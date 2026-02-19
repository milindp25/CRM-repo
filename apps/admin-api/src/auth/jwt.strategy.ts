import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

/**
 * JWT Strategy for Admin API
 * Validates JWT tokens (same secret as tenant API)
 * Only validates - no login endpoint here
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Admin API only allows SUPER_ADMIN
    if (payload.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied. Super Admin privileges required.');
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
