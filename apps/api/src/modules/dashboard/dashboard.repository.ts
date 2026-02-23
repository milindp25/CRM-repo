import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find dashboard config by userId (unique constraint).
   */
  async findConfig(userId: string) {
    return this.prisma.dashboardConfig.findUnique({
      where: { userId },
    });
  }

  /**
   * Upsert dashboard config for a user.
   * Creates if none exists, updates if it does.
   */
  async upsertConfig(userId: string, companyId: string, layout: any) {
    return this.prisma.dashboardConfig.upsert({
      where: { userId },
      create: {
        userId,
        companyId,
        layout,
      },
      update: {
        layout,
      },
    });
  }

  /**
   * Delete dashboard config for a user (used for reset).
   */
  async deleteConfig(userId: string) {
    const existing = await this.prisma.dashboardConfig.findUnique({
      where: { userId },
    });
    if (existing) {
      return this.prisma.dashboardConfig.delete({
        where: { userId },
      });
    }
    return null;
  }
}
