import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PayrollRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PayrollCreateInput) {
    return this.prisma.payroll.create({
      data,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PayrollWhereInput;
    orderBy?: Prisma.PayrollOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.payroll.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.PayrollUpdateInput) {
    return this.prisma.payroll.update({
      where: { id },
      data,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.payroll.delete({
      where: { id },
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
