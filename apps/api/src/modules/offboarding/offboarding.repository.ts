import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface OffboardingFilterParams {
  status?: string;
  separationType?: string;
  employeeId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class OffboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Checklist CRUD ────────────────────────────────────────────────

  async createChecklist(data: Prisma.OffboardingChecklistCreateInput) {
    return this.prisma.offboardingChecklist.create({ data });
  }

  async findChecklists(companyId: string) {
    return this.prisma.offboardingChecklist.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findChecklistById(id: string, companyId: string) {
    return this.prisma.offboardingChecklist.findFirst({
      where: { id, companyId },
    });
  }

  async updateChecklist(
    id: string,
    companyId: string,
    data: Prisma.OffboardingChecklistUpdateInput,
  ) {
    return this.prisma.offboardingChecklist.update({
      where: { id, companyId },
      data,
    });
  }

  async deleteChecklist(id: string, companyId: string) {
    return this.prisma.offboardingChecklist.delete({
      where: { id, companyId },
    });
  }

  // ─── Process CRUD ──────────────────────────────────────────────────

  async createProcess(
    processData: Prisma.OffboardingProcessCreateInput,
    tasks: { title: string; assignedRole?: string; sortOrder: number }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const process = await tx.offboardingProcess.create({
        data: processData,
      });

      if (tasks.length > 0) {
        await tx.offboardingTask.createMany({
          data: tasks.map((task) => ({
            processId: process.id,
            title: task.title,
            assignedRole: task.assignedRole ?? null,
            sortOrder: task.sortOrder,
            status: 'PENDING',
          })),
        });
      }

      return tx.offboardingProcess.findUnique({
        where: { id: process.id },
        include: {
          tasks: { orderBy: { sortOrder: 'asc' } },
          employee: true,
        },
      });
    });
  }

  async findProcesses(companyId: string, filter: OffboardingFilterParams) {
    const {
      status,
      separationType,
      employeeId,
      page = 1,
      limit = 20,
    } = filter;

    const where: Prisma.OffboardingProcessWhereInput = {
      companyId,
      ...(status && { status }),
      ...(separationType && { separationType }),
      ...(employeeId && { employeeId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.offboardingProcess.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: true,
          tasks: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.prisma.offboardingProcess.count({ where }),
    ]);

    return { data, total };
  }

  async findProcessById(id: string, companyId: string) {
    return this.prisma.offboardingProcess.findFirst({
      where: { id, companyId },
      include: {
        tasks: { orderBy: { sortOrder: 'asc' } },
        employee: true,
      },
    });
  }

  async updateProcess(
    id: string,
    companyId: string,
    data: Prisma.OffboardingProcessUpdateInput,
  ) {
    return this.prisma.offboardingProcess.update({
      where: { id, companyId },
      data,
      include: {
        tasks: { orderBy: { sortOrder: 'asc' } },
        employee: true,
      },
    });
  }

  // ─── Task CRUD ─────────────────────────────────────────────────────

  async findTasksByProcess(processId: string) {
    return this.prisma.offboardingTask.findMany({
      where: { processId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findTaskById(id: string) {
    return this.prisma.offboardingTask.findUnique({
      where: { id },
      include: { process: true },
    });
  }

  async updateTask(id: string, data: Prisma.OffboardingTaskUpdateInput) {
    return this.prisma.offboardingTask.update({
      where: { id },
      data,
    });
  }

  // ─── Employee Status ───────────────────────────────────────────────

  async updateEmployeeStatus(
    employeeId: string,
    data: { status?: string; isActive?: boolean },
  ) {
    return this.prisma.employee.update({
      where: { id: employeeId },
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
