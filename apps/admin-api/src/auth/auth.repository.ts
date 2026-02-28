import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            isActive: true,
          },
        },
      },
    });
  }
}
