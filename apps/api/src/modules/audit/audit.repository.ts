import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, params: {
    skip?: number;
    take?: number;
    resourceType?: string;
    action?: string;
    userId?: string;
  }) {
    const { skip = 0, take = 50, resourceType, action, userId } = params;
    const where: any = { companyId };
    if (resourceType) where.resourceType = resourceType;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total };
  }
}
