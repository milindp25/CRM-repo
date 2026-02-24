import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Google OAuth2 Strategy for Passport
 *
 * Handles Google SSO authentication flow:
 * 1. Validates the Google profile returned after OAuth consent
 * 2. Checks the email domain against the company's allowed SSO domains
 * 3. Finds existing user by googleId or email, or creates a new user
 * 4. Returns the user object to be used by the auth service for JWT generation
 *
 * The companyId is passed via the OAuth state parameter so we know which
 * company's SSO config to validate against.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Use env vars as defaults; per-company config is validated in the callback
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || `http://localhost:${configService.get('API_PORT', 4000)}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  /**
   * Validate the Google OAuth callback
   * Called automatically by Passport after Google redirects back
   */
  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const { emails, name, photos, id: googleId } = profile;

      if (!emails || emails.length === 0) {
        return done(new UnauthorizedException('No email found in Google profile'), false);
      }

      const email = emails[0].value;
      const emailDomain = email.split('@')[1];

      // Extract companyId from OAuth state parameter
      const state = req.query?.state;
      let companyId: string | undefined;

      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
          companyId = stateData.companyId;
        } catch {
          this.logger.warn('Failed to parse OAuth state parameter');
        }
      }

      if (!companyId) {
        return done(new UnauthorizedException('Company context is required for SSO login'), false);
      }

      // Fetch company and its SSO config
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company || !company.isActive) {
        return done(new UnauthorizedException('Company not found or inactive'), false);
      }

      const ssoConfig = company.ssoConfig as any;

      if (!ssoConfig || !ssoConfig.enabled || ssoConfig.provider !== 'google') {
        return done(new UnauthorizedException('Google SSO is not enabled for this company'), false);
      }

      // Validate email domain against allowed domains
      if (ssoConfig.allowedDomains && ssoConfig.allowedDomains.length > 0) {
        const domainAllowed = ssoConfig.allowedDomains.some(
          (domain: string) => domain.toLowerCase() === emailDomain.toLowerCase(),
        );

        if (!domainAllowed) {
          return done(
            new UnauthorizedException(
              `Email domain '${emailDomain}' is not allowed for this company's SSO`,
            ),
            false,
          );
        }
      }

      // Try to find existing user by googleId
      let user = await this.prisma.user.findUnique({
        where: { googleId },
        include: { company: true },
      });

      if (user) {
        // Verify user belongs to the correct company
        if (user.companyId !== companyId) {
          return done(
            new UnauthorizedException('User is associated with a different company'),
            false,
          );
        }

        if (!user.isActive) {
          return done(new UnauthorizedException('User account is inactive'), false);
        }

        // Update last login
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return done(null, user);
      }

      // Try to find existing user by email within the same company
      user = await this.prisma.user.findFirst({
        where: {
          email,
          companyId,
        },
        include: { company: true },
      });

      if (user) {
        if (!user.isActive) {
          return done(new UnauthorizedException('User account is inactive'), false);
        }

        // Link Google account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            lastLoginAt: new Date(),
            emailVerified: true,
          },
          include: { company: true },
        });

        this.logger.log(`Linked Google account to existing user: ${email}`);
        return done(null, user);
      }

      // Create new user from Google profile
      const newUser = await this.prisma.user.create({
        data: {
          email,
          googleId,
          firstName: name?.givenName || 'Unknown',
          lastName: name?.familyName || 'User',
          avatar: photos?.[0]?.value || null,
          companyId,
          role: 'EMPLOYEE', // Default role for SSO-created users
          permissions: [],
          isActive: true,
          emailVerified: true,
          lastLoginAt: new Date(),
        },
        include: { company: true },
      });

      // Create audit log for new SSO user
      await this.prisma.auditLog.create({
        data: {
          userId: newUser.id,
          userEmail: newUser.email,
          action: 'USER_SSO_REGISTERED',
          resourceType: 'USER',
          resourceId: newUser.id,
          companyId,
          success: true,
          metadata: { provider: 'google' },
        },
      });

      this.logger.log(`Created new user via Google SSO: ${email}`);
      return done(null, newUser);
    } catch (error) {
      this.logger.error(`Google OAuth validation error: ${error.message}`, error.stack);
      return done(error as Error, false);
    }
  }
}
