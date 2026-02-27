import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AuditFilterParams {
  skip?: number;
  take?: number;
  resourceType?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, params: AuditFilterParams) {
    const { skip = 0, take = 50, resourceType, action, userId, startDate, endDate } = params;
    const where: any = { companyId };
    if (resourceType) where.resourceType = resourceType;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

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

  /**
   * Fetch all matching records (no pagination) for CSV export.
   * Capped at 10,000 rows to prevent memory issues.
   */
  async findAllForExport(companyId: string, params: Omit<AuditFilterParams, 'skip' | 'take'>) {
    const { resourceType, action, userId, startDate, endDate } = params;
    const where: any = { companyId };
    if (resourceType) where.resourceType = resourceType;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      take: 10_000,
      orderBy: { createdAt: 'desc' },
    });
  }
}
