import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Shift Definitions ───────────────────────────────────────────────

  async createDefinition(data: Prisma.ShiftDefinitionCreateInput) {
    return this.prisma.shiftDefinition.create({
      data,
      include: { _count: { select: { assignments: true } } },
    });
  }

  async findDefinitions(
    companyId: string,
    options?: { isActive?: boolean; page?: number; limit?: number },
  ) {
    const { isActive, page = 1, limit = 20 } = options || {};

    const where: Prisma.ShiftDefinitionWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
    };

    const [data, total] = await Promise.all([
      this.prisma.shiftDefinition.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { assignments: true } } },
      }),
      this.prisma.shiftDefinition.count({ where }),
    ]);

    return { data, total };
  }

  async findDefinitionById(id: string, companyId: string) {
    return this.prisma.shiftDefinition.findFirst({
      where: { id, companyId },
      include: { _count: { select: { assignments: true } } },
    });
  }

  async findDefinitionByCode(code: string, companyId: string) {
    return this.prisma.shiftDefinition.findFirst({
      where: { code, companyId },
    });
  }

  async updateDefinition(
    id: string,
    companyId: string,
    data: Prisma.ShiftDefinitionUpdateInput,
  ) {
    return this.prisma.shiftDefinition.update({
      where: { id, companyId },
      data,
      include: { _count: { select: { assignments: true } } },
    });
  }

  async deleteDefinition(id: string, companyId: string) {
    return this.prisma.shiftDefinition.delete({
      where: { id, companyId },
    });
  }

  // ─── Shift Assignments ───────────────────────────────────────────────

  async createAssignment(data: Prisma.ShiftAssignmentCreateInput) {
    return this.prisma.shiftAssignment.create({
      data,
      include: {
        shift: {
          select: {
            id: true,
            name: true,
            code: true,
            startTime: true,
            endTime: true,
            color: true,
          },
        },
      },
    });
  }

  async createManyAssignments(
    assignments: {
      companyId: string;
      shiftId: string;
      employeeId: string;
      assignmentDate: Date;
      endDate?: Date;
      notes?: string;
    }[],
  ) {
    return this.prisma.shiftAssignment.createMany({
      data: assignments,
      skipDuplicates: true,
    });
  }

  async findAssignments(
    companyId: string,
    filters?: {
      employeeId?: string;
      shiftId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { employeeId, shiftId, startDate, endDate, page = 1, limit = 20 } = filters || {};

    const where: Prisma.ShiftAssignmentWhereInput = {
      companyId,
      ...(employeeId && { employeeId }),
      ...(shiftId && { shiftId }),
      ...(startDate &&
        endDate && {
          assignmentDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      ...(startDate &&
        !endDate && {
          assignmentDate: { gte: new Date(startDate) },
        }),
      ...(!startDate &&
        endDate && {
          assignmentDate: { lte: new Date(endDate) },
        }),
    };

    const [data, total] = await Promise.all([
      this.prisma.shiftAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { assignmentDate: 'desc' },
        include: {
          shift: {
            select: {
              id: true,
              name: true,
              code: true,
              startTime: true,
              endTime: true,
              color: true,
            },
          },
        },
      }),
      this.prisma.shiftAssignment.count({ where }),
    ]);

    return { data, total };
  }

  async findAssignmentById(id: string, companyId: string) {
    return this.prisma.shiftAssignment.findFirst({
      where: { id, companyId },
      include: {
        shift: {
          select: {
            id: true,
            name: true,
            code: true,
            startTime: true,
            endTime: true,
            color: true,
          },
        },
      },
    });
  }

  async deleteAssignment(id: string, companyId: string) {
    return this.prisma.shiftAssignment.delete({
      where: { id, companyId },
    });
  }

  // ─── Audit Log ────────────────────────────────────────────────────────

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
