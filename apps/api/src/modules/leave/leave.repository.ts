import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { LeaveFilterDto } from './dto';

@Injectable()
export class LeaveRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LeaveCreateInput) {
    return this.prisma.leave.create({
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

  async findMany(companyId: string, filter: LeaveFilterDto) {
    const { employeeId, startDate, endDate, status, leaveType, page = 1, limit = 20 } = filter;

    const where: Prisma.LeaveWhereInput = {
      companyId,
      ...(employeeId && { employeeId }),
      ...(status && { status }),
      ...(leaveType && { leaveType }),
      ...(startDate && endDate && {
        startDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.leave.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.prisma.leave.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string, companyId: string) {
    return this.prisma.leave.findFirst({
      where: {
        id,
        companyId,
      },
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

  async update(id: string, companyId: string, data: Prisma.LeaveUpdateInput) {
    return this.prisma.leave.update({
      where: {
        id,
        companyId,
      },
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

  async delete(id: string, companyId: string) {
    return this.prisma.leave.delete({
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
