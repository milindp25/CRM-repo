import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface TimesheetFilterParams {
  status?: string;
  employeeId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class TimesheetRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Timesheet ─────────────────────────────────────────────────────

  async createTimesheet(data: Prisma.TimesheetCreateInput) {
    return this.prisma.timesheet.create({
      data,
      include: {
        entries: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, workEmail: true },
        },
      },
    });
  }

  async findTimesheets(companyId: string, filter: TimesheetFilterParams) {
    const { status, employeeId, page = 1, limit = 20 } = filter;

    const where: Prisma.TimesheetWhereInput = {
      companyId,
      ...(status && { status }),
      ...(employeeId && { employeeId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.timesheet.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { weekStartDate: 'desc' },
        include: {
          entries: true,
          employee: {
            select: { id: true, firstName: true, lastName: true, workEmail: true },
          },
        },
      }),
      this.prisma.timesheet.count({ where }),
    ]);

    return { data, total };
  }

  async findTimesheetById(id: string, companyId: string) {
    return this.prisma.timesheet.findFirst({
      where: { id, companyId },
      include: {
        entries: {
          orderBy: { date: 'asc' },
          include: {
            project: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        employee: {
          select: { id: true, firstName: true, lastName: true, workEmail: true },
        },
      },
    });
  }

  async updateTimesheet(id: string, data: Prisma.TimesheetUpdateInput) {
    return this.prisma.timesheet.update({
      where: { id },
      data,
      include: {
        entries: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, workEmail: true },
        },
      },
    });
  }

  async findMyTimesheets(
    companyId: string,
    employeeId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const where: Prisma.TimesheetWhereInput = { companyId, employeeId };

    const [data, total] = await Promise.all([
      this.prisma.timesheet.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { weekStartDate: 'desc' },
        include: {
          entries: true,
        },
      }),
      this.prisma.timesheet.count({ where }),
    ]);

    return { data, total };
  }

  async findTimesheetByWeek(
    companyId: string,
    employeeId: string,
    weekStartDate: Date,
  ) {
    return this.prisma.timesheet.findFirst({
      where: {
        companyId,
        employeeId,
        weekStartDate,
      },
    });
  }

  // ─── Time Entry ────────────────────────────────────────────────────

  async createEntry(data: Prisma.TimeEntryCreateInput) {
    return this.prisma.timeEntry.create({ data });
  }

  async updateEntry(id: string, data: Prisma.TimeEntryUpdateInput) {
    return this.prisma.timeEntry.update({
      where: { id },
      data,
    });
  }

  async deleteEntry(id: string) {
    return this.prisma.timeEntry.delete({
      where: { id },
    });
  }

  async findEntriesByTimesheet(timesheetId: string) {
    return this.prisma.timeEntry.findMany({
      where: { timesheetId },
      orderBy: { date: 'asc' },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async findEntryById(id: string) {
    return this.prisma.timeEntry.findUnique({
      where: { id },
      include: {
        timesheet: true,
      },
    });
  }

  // ─── Project ───────────────────────────────────────────────────────

  async createProject(data: Prisma.ProjectCreateInput) {
    return this.prisma.project.create({ data });
  }

  async findProjects(companyId: string) {
    return this.prisma.project.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findProjectById(id: string, companyId: string) {
    return this.prisma.project.findFirst({
      where: { id, companyId },
    });
  }

  async updateProject(
    id: string,
    companyId: string,
    data: Prisma.ProjectUpdateInput,
  ) {
    return this.prisma.project.update({
      where: { id, companyId },
      data,
    });
  }

  // ─── Audit Log ─────────────────────────────────────────────────────

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
