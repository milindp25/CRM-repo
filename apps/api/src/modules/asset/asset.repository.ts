import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Asset CRUD ────────────────────────────────────────────────────────

  async create(data: Prisma.AssetCreateInput) {
    return this.prisma.asset.create({ data });
  }

  async findById(id: string, companyId: string) {
    return this.prisma.asset.findFirst({
      where: {
        id,
        companyId,
        isActive: true,
      },
      include: {
        assignments: {
          where: { returnedAt: null },
          take: 1,
          orderBy: { assignedAt: 'desc' },
        },
      },
    });
  }

  async findMany(
    companyId: string,
    filters: {
      status?: string;
      category?: string;
      assignedTo?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { page = 1, limit = 20, status, category, assignedTo, search } = filters;

    const where: Prisma.AssetWhereInput = {
      companyId,
      isActive: true,
      ...(status && { status }),
      ...(category && { category }),
      ...(assignedTo && { assignedTo }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { assetCode: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { serialNumber: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignments: {
            where: { returnedAt: null },
            take: 1,
            orderBy: { assignedAt: 'desc' },
          },
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, companyId: string, data: Prisma.AssetUpdateInput) {
    return this.prisma.asset.update({
      where: { id, companyId },
      data,
    });
  }

  async softDelete(id: string, companyId: string) {
    return this.prisma.asset.update({
      where: { id, companyId },
      data: {
        isActive: false,
      },
    });
  }

  // ─── Assignment Operations ─────────────────────────────────────────────

  async createAssignment(data: Prisma.AssetAssignmentCreateInput) {
    return this.prisma.assetAssignment.create({ data });
  }

  async findActiveAssignment(assetId: string) {
    return this.prisma.assetAssignment.findFirst({
      where: {
        assetId,
        returnedAt: null,
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async returnAssignment(
    assignmentId: string,
    data: {
      returnedAt: Date;
      returnNotes?: string;
      conditionOnReturn?: string;
    },
  ) {
    return this.prisma.assetAssignment.update({
      where: { id: assignmentId },
      data,
    });
  }

  async findAssignmentHistory(assetId: string) {
    return this.prisma.assetAssignment.findMany({
      where: { assetId },
      orderBy: { assignedAt: 'desc' },
    });
  }

  // ─── Audit Log ─────────────────────────────────────────────────────────

  async createAuditLog(data: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}
