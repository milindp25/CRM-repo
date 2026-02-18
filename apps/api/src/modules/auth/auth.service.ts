import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { IAuthService } from './interfaces/auth.service.interface';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoggerService } from '../../common/services/logger.service';

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

    // Update last login
    await this.authRepository.updateLastLogin(user.id);

    // Create audit log
    await this.authRepository.createAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: user.id,
      companyId: user.companyId,
      success: true,
    });

    this.logger.log(`User logged in: ${dto.email}`, 'AuthService');

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.authRepository.findUserById(payload.userId);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid token');
      }

      return this.generateAuthResponse(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
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
  }

  /**
   * Update own profile (name/phone)
   */
  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
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
   * Logout user (placeholder for token blacklist implementation)
   */
  async logout(userId: string): Promise<void> {
    // TODO: Implement token blacklist or session invalidation
    this.logger.log(`User logged out: ${userId}`, 'AuthService');
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
      { userId: user.id, type: 'refresh' },
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
        companyId: user.companyId,
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
