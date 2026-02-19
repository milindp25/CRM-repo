import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultInclude = {
    _count: {
      select: {
        acknowledgments: true,
      },
    },
  };

  // ──────────────────────────────────────────────────────────────
  // Policy CRUD
  // ──────────────────────────────────────────────────────────────

  async create(data: Prisma.PolicyCreateInput) {
    return this.prisma.policy.create({
      data,
      include: this.defaultInclude,
    });
  }

  async findById(id: string, companyId: string) {
    return this.prisma.policy.findFirst({
      where: {
        id,
        companyId,
        isActive: true,
      },
      include: this.defaultInclude,
    });
  }

  async findMany(
    companyId: string,
    filters: {
      status?: string;
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { page = 1, limit = 20, status, category, search } = filters;

    const where: Prisma.PolicyWhereInput = {
      companyId,
      isActive: true,
      ...(status && { status }),
      ...(category && { category }),
      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.policy.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.defaultInclude,
      }),
      this.prisma.policy.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, companyId: string, data: Prisma.PolicyUpdateInput) {
    return this.prisma.policy.update({
      where: {
        id,
        companyId,
      },
      data,
      include: this.defaultInclude,
    });
  }

  async softDelete(id: string, companyId: string) {
    return this.prisma.policy.update({
      where: {
        id,
        companyId,
      },
      data: {
        isActive: false,
        status: 'ARCHIVED',
      },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Acknowledgments
  // ──────────────────────────────────────────────────────────────

  async createAcknowledgment(data: {
    policyId: string;
    employeeId: string;
    ipAddress?: string;
  }) {
    return this.prisma.policyAcknowledgment.create({
      data: {
        policy: { connect: { id: data.policyId } },
        employeeId: data.employeeId,
        acknowledgedAt: new Date(),
        ...(data.ipAddress && { ipAddress: data.ipAddress }),
      },
    });
  }

  async findAcknowledgment(policyId: string, employeeId: string) {
    return this.prisma.policyAcknowledgment.findUnique({
      where: {
        policyId_employeeId: {
          policyId,
          employeeId,
        },
      },
    });
  }

  async findAcknowledgmentsByPolicy(
    policyId: string,
    filters: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 20 } = filters;

    const where = { policyId };

    const [data, total] = await Promise.all([
      this.prisma.policyAcknowledgment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { acknowledgedAt: 'desc' },
      }),
      this.prisma.policyAcknowledgment.count({ where }),
    ]);

    return { data, total };
  }

  async findAcknowledgmentsByEmployee(
    employeeId: string,
    filters: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 20 } = filters;

    const where = { employeeId };

    const [data, total] = await Promise.all([
      this.prisma.policyAcknowledgment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { acknowledgedAt: 'desc' },
        include: {
          policy: {
            select: {
              id: true,
              title: true,
              category: true,
              version: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.policyAcknowledgment.count({ where }),
    ]);

    return { data, total };
  }

  async countAcknowledgmentsForPolicy(policyId: string) {
    return this.prisma.policyAcknowledgment.count({
      where: { policyId },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Employee lookup (for acknowledgment status)
  // ──────────────────────────────────────────────────────────────

  async findActiveEmployeesByCompany(companyId: string) {
    return this.prisma.employee.findMany({
      where: {
        companyId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        workEmail: true,
      },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Audit Log
  // ──────────────────────────────────────────────────────────────

  async createAuditLog(data: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }
}
