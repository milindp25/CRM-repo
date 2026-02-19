import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface ExpenseFilterParams {
  status?: string;
  category?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ExpenseClaimCreateInput) {
    return this.prisma.expenseClaim.create({
      data,
    });
  }

  async findMany(companyId: string, filter: ExpenseFilterParams) {
    const {
      status,
      category,
      employeeId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filter;

    const where: Prisma.ExpenseClaimWhereInput = {
      companyId,
      ...(status && { status }),
      ...(category && { category }),
      ...(employeeId && { employeeId }),
      ...(startDate &&
        endDate && {
          expenseDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [data, total] = await Promise.all([
      this.prisma.expenseClaim.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expenseClaim.count({ where }),
    ]);

    return { data, total };
  }

  async findByEmployee(companyId: string, employeeId: string, filter: ExpenseFilterParams) {
    const { status, category, startDate, endDate, page = 1, limit = 20 } = filter;

    const where: Prisma.ExpenseClaimWhereInput = {
      companyId,
      employeeId,
      ...(status && { status }),
      ...(category && { category }),
      ...(startDate &&
        endDate && {
          expenseDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [data, total] = await Promise.all([
      this.prisma.expenseClaim.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expenseClaim.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string, companyId: string) {
    return this.prisma.expenseClaim.findFirst({
      where: {
        id,
        companyId,
      },
    });
  }

  async update(id: string, companyId: string, data: Prisma.ExpenseClaimUpdateInput) {
    return this.prisma.expenseClaim.update({
      where: {
        id,
        companyId,
      },
      data,
    });
  }

  async delete(id: string, companyId: string) {
    return this.prisma.expenseClaim.delete({
      where: {
        id,
        companyId,
      },
    });
  }

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
