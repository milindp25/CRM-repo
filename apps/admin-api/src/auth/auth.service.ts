import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.company?.isActive) {
      throw new UnauthorizedException('Company is inactive');
    }

    if (user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException(
        'Access denied. Super Admin privileges required.',
      );
    }

    const payload = {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      permissions: user.permissions as string[],
    };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Admin login successful: ${email}`);

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
      },
      accessToken,
    };
  }
}
