import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { AttendanceFilterDto } from './dto';

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AttendanceCreateInput) {
    return this.prisma.attendance.create({
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

  async findMany(companyId: string, filter: AttendanceFilterDto) {
    const { employeeId, startDate, endDate, status, page = 1, limit = 20 } = filter;

    const where: Prisma.AttendanceWhereInput = {
      companyId,
      ...(employeeId && { employeeId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        attendanceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { attendanceDate: 'desc' },
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
      this.prisma.attendance.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string, companyId: string) {
    return this.prisma.attendance.findFirst({
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

  async update(id: string, companyId: string, data: Prisma.AttendanceUpdateInput) {
    return this.prisma.attendance.update({
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
    return this.prisma.attendance.delete({
      where: {
        id,
        companyId,
      },
    });
  }

  async existsByEmployeeAndDate(
    companyId: string,
    employeeId: string,
    attendanceDate: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.attendance.count({
      where: {
        companyId,
        employeeId,
        attendanceDate: new Date(attendanceDate),
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
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
