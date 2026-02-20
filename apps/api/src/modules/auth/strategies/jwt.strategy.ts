import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

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
  constructor(private configService: ConfigService) {
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
  async validate(payload: JwtPayload) {
    if (!payload.userId || !payload.companyId) {
      throw new UnauthorizedException('Invalid token payload');
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
