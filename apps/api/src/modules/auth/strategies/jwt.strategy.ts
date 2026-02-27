import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthService } from '../auth.service';

/**
 * Extract JWT from httpOnly cookie or Authorization header.
 * Cookie takes precedence (more secure), falls back to Bearer header for M2M clients.
 */
function extractJwtFromCookieOrHeader(req: Request): string | null {
  const cookieToken = (req as any).cookies?.access_token;
  if (cookieToken) return cookieToken;

  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

/**
 * JWT Strategy for Passport
 * Validates JWT tokens from httpOnly cookie or Authorization: Bearer header
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }

    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Validate JWT payload
   * This method is called after token signature is verified
   */
  async validate(payload: JwtPayload & { iat?: number }) {
    if (!payload.userId || !payload.companyId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Reject tokens issued before the user's last logout
    if (payload.iat && this.authService.isTokenBlacklisted(payload.userId, payload.iat)) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    return {
      userId: payload.userId,
      email: payload.email,
      companyId: payload.companyId,
      role: payload.role,
      permissions: payload.permissions,
    };
  }
}
