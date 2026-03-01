import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { IAuthService } from './interfaces/auth.service.interface';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import { UpdateSSOConfigDto, SSOConfigResponseDto, SSOProvider } from './dto/sso-config.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { EmailService } from '../../common/services/email.service';

/**
 * Auth Service (Business Logic Layer)
 * Single Responsibility: Handles authentication business logic
 * Dependency Inversion: Depends on abstractions (Repository, JwtService)
 */
@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly cache: CacheService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Register new user and company
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user exists
    const existingUser = await this.authRepository.findUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password (delegate to private method - SRP)
    const passwordHash = await this.hashPassword(dto.password);

    // Generate company code
    const companyCode = this.generateCompanyCode(dto.companyName);

    // Create user and company
    const result = await this.authRepository.createUserWithCompany({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      companyName: dto.companyName,
      companyCode,
    });

    this.logger.log(
      `User registered: ${dto.email}, Company: ${dto.companyName}`,
      'AuthService',
    );

    // Generate tokens
    return this.generateAuthResponse(result.user);
  }

  /**
   * Login user with email and password
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.authRepository.findUserByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check password hash exists
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check active status
    if (!user.isActive || !user.company?.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Generate tokens first (fast, CPU-only) — return response ASAP
    const response = this.generateAuthResponse(user);

    this.logger.log(`User logged in: ${dto.email}`, 'AuthService');

    // Fire-and-forget: update last login + audit log in parallel
    // These are non-critical and should NOT block the login response
    Promise.all([
      this.authRepository.updateLastLogin(user.id),
      this.authRepository.createAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: 'USER_LOGIN',
        resourceType: 'USER',
        resourceId: user.id,
        companyId: user.companyId,
        success: true,
      }),
    ]).catch((err) => {
      this.logger.error(`Failed to update login metadata: ${err.message}`, 'AuthService');
    });

    return response;
  }

  /**
   * Refresh access token with token rotation.
   * Each refresh token can only be used once — reuse triggers session invalidation.
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if this refresh token has already been used (replay attack)
    const jti = payload.jti;
    if (jti && this.cache.get<boolean>(`rt:used:${jti}`)) {
      // Possible token theft — invalidate all sessions for this user
      this.cache.set(`logout:${payload.userId}`, Date.now(), this.getAccessTokenTtlMs());
      this.logger.warn(
        `Refresh token reuse detected for user ${payload.userId} — all sessions invalidated`,
        'AuthService',
      );
      throw new UnauthorizedException('Refresh token has already been used');
    }

    const user = await this.authRepository.findUserById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token');
    }

    // Mark old refresh token as used (keep in cache for the token's remaining lifetime)
    if (jti) {
      const refreshTtlMs = this.getRefreshTokenTtlMs();
      this.cache.set(`rt:used:${jti}`, true, refreshTtlMs);
    }

    return this.generateAuthResponse(user);
  }

  /**
   * Get user profile by ID (cached for 60s to avoid repeated DB roundtrips)
   */
  async getProfile(userId: string) {
    return this.cache.getOrSet(`profile:${userId}`, async () => {
      const user = await this.authRepository.findUserById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        companyId: user.companyId,
        permissions: user.permissions,
      };
    }, 60_000);
  }

  /**
   * Update own profile (name/phone)
   */
  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    this.cache.invalidate(`profile:${userId}`);
    return this.authRepository.updateProfile(userId, data);
  }

  /**
   * Change own password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.authRepository.findUserById(userId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const newHash = await this.hashPassword(newPassword);
    await this.authRepository.updatePassword(userId, newHash);
    this.logger.log(`Password changed for user ${userId}`, 'AuthService');
  }

  /**
   * Request a password reset email.
   * Always returns success (even if email not found) to prevent user enumeration.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user || !user.isActive) {
      // Don't reveal that the user doesn't exist
      return;
    }

    // Sign a short-lived reset token using JWT_SECRET + passwordHash
    // This auto-invalidates the token once the password is changed
    const resetToken = this.jwtService.sign(
      { userId: user.id, purpose: 'password-reset' },
      {
        secret: this.configService.get('JWT_SECRET') + user.passwordHash,
        expiresIn: '1h',
      },
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    await this.emailService.sendTemplatedMail(user.email, 'password-reset', {
      recipientName: user.firstName ?? undefined,
      resetUrl,
      companyName: user.company?.companyName ?? undefined,
    });

    this.logger.log(`Password reset email sent to ${email}`, 'AuthService');
  }

  /**
   * Reset password using a token from the forgot-password email.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Decode the token without verification to extract userId
    let decoded: any;
    try {
      decoded = this.jwtService.decode(token);
    } catch {
      throw new BadRequestException('Invalid reset token');
    }

    if (!decoded?.userId || decoded?.purpose !== 'password-reset') {
      throw new BadRequestException('Invalid reset token');
    }

    const user = await this.authRepository.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new BadRequestException('Invalid reset token');
    }

    // Verify the token with the secret that includes the current passwordHash
    // If the password was already changed, this will fail (token auto-invalidated)
    try {
      this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET') + user.passwordHash,
      });
    } catch {
      throw new BadRequestException('Reset token has expired or already been used');
    }

    const newHash = await this.hashPassword(newPassword);
    await this.authRepository.updatePassword(user.id, newHash);

    // Invalidate all existing sessions
    this.cache.set(`logout:${user.id}`, Date.now(), this.getAccessTokenTtlMs());
    this.cache.invalidate(`profile:${user.id}`);

    this.logger.log(`Password reset completed for user ${user.id}`, 'AuthService');
  }

  /**
   * Logout user — blacklists tokens issued before this moment
   */
  async logout(userId: string): Promise<void> {
    const accessTtl = this.getAccessTokenTtlMs();
    this.cache.set(`logout:${userId}`, Date.now(), accessTtl);
    this.cache.invalidate(`profile:${userId}`);
    this.logger.log(`User logged out: ${userId}`, 'AuthService');
  }

  /**
   * Check if a user's token was issued before their last logout
   */
  isTokenBlacklisted(userId: string, tokenIssuedAt: number): boolean {
    const logoutTimestamp = this.cache.get<number>(`logout:${userId}`);
    if (!logoutTimestamp) return false;
    return tokenIssuedAt * 1000 <= logoutTimestamp;
  }

  private getAccessTokenTtlMs(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    return this.parseDurationToMs(expiresIn, 15 * 60 * 1000);
  }

  private getRefreshTokenTtlMs(): number {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    return this.parseDurationToMs(expiresIn, 30 * 24 * 60 * 60 * 1000);
  }

  private parseDurationToMs(duration: string, defaultMs: number): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return defaultMs;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return defaultMs;
    }
  }

  /**
   * Check if a company with the given name already exists (case-insensitive)
   */
  async checkCompanyExists(name: string): Promise<{ exists: boolean }> {
    const company = await this.authRepository.findCompanyByName(name);
    return { exists: !!company };
  }

  // ============================================================================
  // SSO / Google OAuth Methods
  // ============================================================================

  /**
   * Handle Google OAuth login callback
   * Generates JWT tokens for the authenticated Google user
   */
  async googleLogin(user: any): Promise<AuthResponseDto> {
    if (!user) {
      throw new UnauthorizedException('Google authentication failed');
    }

    // Create audit log for SSO login
    await this.authRepository.createAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_SSO_LOGIN',
      resourceType: 'USER',
      resourceId: user.id,
      companyId: user.companyId,
      success: true,
    });

    this.logger.log(`User logged in via Google SSO: ${user.email}`, 'AuthService');

    return this.generateAuthResponse(user);
  }

  /**
   * Get SSO configuration for a company
   * Returns a sanitized response (secrets are masked)
   */
  async getSSOConfig(companyId: string): Promise<SSOConfigResponseDto> {
    const config = (await this.authRepository.getSSOConfig(companyId)) as any;

    if (!config) {
      // Return default empty config
      return {
        provider: SSOProvider.GOOGLE,
        enabled: false,
        hasGoogleClientSecret: false,
        allowedDomains: [],
      };
    }

    // Mask the client ID (show first 8 chars + last 4 chars)
    let maskedClientId: string | undefined;
    if (config.googleClientId) {
      const id = config.googleClientId;
      if (id.length > 12) {
        maskedClientId = `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
      } else {
        maskedClientId = `${id.substring(0, 4)}...`;
      }
    }

    return {
      provider: config.provider || SSOProvider.GOOGLE,
      enabled: config.enabled || false,
      googleClientId: maskedClientId,
      hasGoogleClientSecret: !!config.googleClientSecret,
      allowedDomains: config.allowedDomains || [],
    };
  }

  /**
   * Update SSO configuration for a company
   */
  async updateSSOConfig(
    companyId: string,
    dto: UpdateSSOConfigDto,
  ): Promise<SSOConfigResponseDto> {
    // Validate that required fields are present when enabling
    if (dto.enabled && dto.provider === SSOProvider.GOOGLE) {
      if (!dto.googleClientId || !dto.googleClientSecret) {
        throw new BadRequestException(
          'Google Client ID and Client Secret are required when enabling Google SSO',
        );
      }
    }

    // Build the config object to store
    const config: Record<string, any> = {
      provider: dto.provider,
      enabled: dto.enabled,
      allowedDomains: dto.allowedDomains || [],
    };

    if (dto.provider === SSOProvider.GOOGLE) {
      // If updating with new credentials, use them; otherwise preserve existing
      if (dto.googleClientId) {
        config.googleClientId = dto.googleClientId;
      }
      if (dto.googleClientSecret) {
        config.googleClientSecret = dto.googleClientSecret;
      }

      // If not providing new credentials, merge with existing config
      if (!dto.googleClientId || !dto.googleClientSecret) {
        const existingConfig = (await this.authRepository.getSSOConfig(companyId)) as any;
        if (existingConfig) {
          if (!dto.googleClientId && existingConfig.googleClientId) {
            config.googleClientId = existingConfig.googleClientId;
          }
          if (!dto.googleClientSecret && existingConfig.googleClientSecret) {
            config.googleClientSecret = existingConfig.googleClientSecret;
          }
        }
      }
    }

    await this.authRepository.updateSSOConfig(companyId, config);

    this.logger.log(
      `SSO config updated for company ${companyId}: provider=${dto.provider}, enabled=${dto.enabled}`,
      'AuthService',
    );

    // Return sanitized config
    return this.getSSOConfig(companyId);
  }

  /**
   * Private helper: Hash password
   * Single Responsibility: Only handles password hashing
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Private helper: Verify password
   * Single Responsibility: Only handles password verification
   */
  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Private helper: Generate authentication response
   * Single Responsibility: Only handles token generation and response formatting
   */
  private generateAuthResponse(user: any): AuthResponseDto {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      permissions: user.permissions as string[],
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      { userId: user.id, type: 'refresh', jti: crypto.randomUUID() },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      },
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: (user.permissions as string[]) || [],
        companyId: user.companyId,
        companyName: user.company?.companyName,
        onboardingCompleted: user.onboardingCompleted ?? user.company?.onboardingCompleted ?? false,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Private helper: Generate company code
   */
  private generateCompanyCode(companyName: string): string {
    const prefix = companyName
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 3);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${random}`;
  }
}
