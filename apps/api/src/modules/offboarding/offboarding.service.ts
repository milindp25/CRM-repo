import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import {
  OffboardingRepository,
  OffboardingFilterParams,
} from './offboarding.repository';
import {
  StartOffboardingDto,
  CreateChecklistDto,
  UpdateChecklistDto,
  UpdateTaskDto,
  ExitInterviewDto,
} from './dto';

@Injectable()
export class OffboardingService {
  constructor(
    private readonly repository: OffboardingRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  // ─── Checklist CRUD ────────────────────────────────────────────────

  async createChecklist(
    companyId: string,
    userId: string,
    dto: CreateChecklistDto,
  ) {
    this.logger.log('Creating offboarding checklist', 'OffboardingService');

    const checklist = await this.repository.createChecklist({
      name: dto.name,
      items: dto.items as any,
      isDefault: dto.isDefault ?? false,
      company: { connect: { id: companyId } },
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'OFFBOARDING_CHECKLIST',
      resourceId: checklist.id,
      newValues: { name: dto.name, itemCount: dto.items.length },
    });

    return checklist;
  }

  async getChecklists(companyId: string) {
    this.logger.log('Fetching offboarding checklists', 'OffboardingService');
    return this.repository.findChecklists(companyId);
  }

  async getChecklist(id: string, companyId: string) {
    this.logger.log(
      `Fetching offboarding checklist ${id}`,
      'OffboardingService',
    );

    const checklist = await this.repository.findChecklistById(id, companyId);
    if (!checklist) {
      throw new NotFoundException('Offboarding checklist not found');
    }

    return checklist;
  }

  async updateChecklist(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateChecklistDto,
  ) {
    this.logger.log(
      `Updating offboarding checklist ${id}`,
      'OffboardingService',
    );

    const existing = await this.repository.findChecklistById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Offboarding checklist not found');
    }

    const updateData: Prisma.OffboardingChecklistUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.items !== undefined && { items: dto.items as any }),
      ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    const updated = await this.repository.updateChecklist(
      id,
      companyId,
      updateData,
    );

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'OFFBOARDING_CHECKLIST',
      resourceId: id,
      newValues: dto,
    });

    return updated;
  }

  async deleteChecklist(id: string, companyId: string, userId: string) {
    this.logger.log(
      `Deleting offboarding checklist ${id}`,
      'OffboardingService',
    );

    const existing = await this.repository.findChecklistById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Offboarding checklist not found');
    }

    await this.repository.deleteChecklist(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'OFFBOARDING_CHECKLIST',
      resourceId: id,
      oldValues: { name: existing.name },
    });

    return { message: 'Offboarding checklist deleted successfully' };
  }

  // ─── Process Management ────────────────────────────────────────────

  async startOffboarding(
    companyId: string,
    dto: StartOffboardingDto,
    userId: string,
  ) {
    this.logger.log(
      `Starting offboarding for employee ${dto.employeeId}`,
      'OffboardingService',
    );

    // Build task list from checklist template if provided
    let tasks: { title: string; assignedRole?: string; sortOrder: number }[] =
      [];

    if (dto.checklistId) {
      const checklist = await this.repository.findChecklistById(
        dto.checklistId,
        companyId,
      );
      if (!checklist) {
        throw new NotFoundException('Offboarding checklist template not found');
      }

      const checklistItems = checklist.items as Array<{
        title: string;
        assignedRole?: string;
        order?: number;
      }>;

      tasks = checklistItems.map((item, index) => ({
        title: item.title,
        assignedRole: item.assignedRole,
        sortOrder: item.order ?? index,
      }));
    }

    // Calculate notice period end date if noticePeriodDays provided
    let noticePeriodEndDate: Date | undefined;
    if (dto.noticePeriodDays) {
      noticePeriodEndDate = new Date();
      noticePeriodEndDate.setDate(
        noticePeriodEndDate.getDate() + dto.noticePeriodDays,
      );
    }

    const processData: Prisma.OffboardingProcessCreateInput = {
      separationType: dto.separationType,
      lastWorkingDay: new Date(dto.lastWorkingDay),
      status: 'INITIATED',
      ...(dto.noticePeriodDays !== undefined && {
        noticePeriodDays: dto.noticePeriodDays,
      }),
      ...(noticePeriodEndDate && { noticePeriodEndDate }),
      company: { connect: { id: companyId } },
      employee: { connect: { id: dto.employeeId } },
      initiatedBy: userId,
    };

    const process = await this.repository.createProcess(processData, tasks);

    // Update employee status to ON_NOTICE
    await this.repository.updateEmployeeStatus(dto.employeeId, {
      status: 'ON_NOTICE',
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'OFFBOARDING_PROCESS',
      resourceId: process?.id,
      newValues: {
        employeeId: dto.employeeId,
        separationType: dto.separationType,
        lastWorkingDay: dto.lastWorkingDay,
        taskCount: tasks.length,
      },
    });

    // Emit offboarding started event
    this.eventEmitter.emit('offboarding.started', {
      processId: process?.id,
      companyId,
      employeeId: dto.employeeId,
      separationType: dto.separationType,
      lastWorkingDay: dto.lastWorkingDay,
      initiatedBy: userId,
    });

    return process;
  }

  async getProcesses(companyId: string, filter: OffboardingFilterParams) {
    this.logger.log('Fetching offboarding processes', 'OffboardingService');

    const { data, total } = await this.repository.findProcesses(
      companyId,
      filter,
    );

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getProcess(id: string, companyId: string) {
    this.logger.log(
      `Fetching offboarding process ${id}`,
      'OffboardingService',
    );

    const process = await this.repository.findProcessById(id, companyId);
    if (!process) {
      throw new NotFoundException('Offboarding process not found');
    }

    return process;
  }

  // ─── Task Management ───────────────────────────────────────────────

  async completeTask(
    processId: string,
    taskId: string,
    userId: string,
    companyId: string,
    dto: UpdateTaskDto,
  ) {
    this.logger.log(
      `Updating task ${taskId} on process ${processId}`,
      'OffboardingService',
    );

    // Verify the process exists and belongs to the company
    const process = await this.repository.findProcessById(
      processId,
      companyId,
    );
    if (!process) {
      throw new NotFoundException('Offboarding process not found');
    }

    if (process.status === 'COMPLETED' || process.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot update tasks on a completed or cancelled process',
      );
    }

    // Verify the task belongs to this process
    const task = await this.repository.findTaskById(taskId);
    if (!task || task.processId !== processId) {
      throw new NotFoundException(
        'Offboarding task not found in this process',
      );
    }

    const updateData: Prisma.OffboardingTaskUpdateInput = {
      status: dto.status,
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.status === 'COMPLETED' && {
        completedBy: userId,
        completedAt: new Date(),
      }),
    };

    const updatedTask = await this.repository.updateTask(taskId, updateData);

    // Check if all tasks are completed -> auto-advance process
    const allTasks = await this.repository.findTasksByProcess(processId);
    const allCompleted = allTasks.every(
      (t) => t.status === 'COMPLETED' || t.status === 'SKIPPED',
    );

    if (allCompleted && process.status !== 'COMPLETED') {
      await this.repository.updateProcess(processId, companyId, {
        status: 'IN_PROGRESS',
      });

      this.logger.log(
        `All tasks completed for process ${processId}, status advanced to IN_PROGRESS`,
        'OffboardingService',
      );
    } else if (process.status === 'INITIATED') {
      // Move from INITIATED to IN_PROGRESS on first task update
      await this.repository.updateProcess(processId, companyId, {
        status: 'IN_PROGRESS',
      });
    }

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'OFFBOARDING_TASK',
      resourceId: taskId,
      newValues: { status: dto.status, notes: dto.notes },
    });

    return updatedTask;
  }

  // ─── Exit Interview ────────────────────────────────────────────────

  async saveExitInterview(
    processId: string,
    userId: string,
    companyId: string,
    dto: ExitInterviewDto,
  ) {
    this.logger.log(
      `Saving exit interview for process ${processId}`,
      'OffboardingService',
    );

    const process = await this.repository.findProcessById(
      processId,
      companyId,
    );
    if (!process) {
      throw new NotFoundException('Offboarding process not found');
    }

    if (process.status === 'COMPLETED' || process.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot add exit interview to a completed or cancelled process',
      );
    }

    const updated = await this.repository.updateProcess(
      processId,
      companyId,
      {
        exitInterviewCompleted: true,
        exitInterviewNotes: {
          notes: dto.notes,
          conductedBy: userId,
          conductedAt: new Date().toISOString(),
        } as any,
      },
    );

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'OFFBOARDING_PROCESS',
      resourceId: processId,
      newValues: { exitInterviewCompleted: true },
    });

    return updated;
  }

  // ─── Complete Offboarding ──────────────────────────────────────────

  async completeOffboarding(
    processId: string,
    userId: string,
    companyId: string,
  ) {
    this.logger.log(
      `Completing offboarding process ${processId}`,
      'OffboardingService',
    );

    const process = await this.repository.findProcessById(
      processId,
      companyId,
    );
    if (!process) {
      throw new NotFoundException('Offboarding process not found');
    }

    if (process.status === 'COMPLETED') {
      throw new BadRequestException(
        'Offboarding process is already completed',
      );
    }

    if (process.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot complete a cancelled offboarding process',
      );
    }

    // Complete the process
    const updated = await this.repository.updateProcess(
      processId,
      companyId,
      {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    );

    // Deactivate the employee
    await this.repository.updateEmployeeStatus(process.employeeId, {
      status: 'TERMINATED',
      isActive: false,
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'COMPLETE',
      resourceType: 'OFFBOARDING_PROCESS',
      resourceId: processId,
      newValues: {
        status: 'COMPLETED',
        employeeId: process.employeeId,
        employeeDeactivated: true,
      },
    });

    // Emit offboarding completed event
    this.eventEmitter.emit('offboarding.completed', {
      processId,
      companyId,
      employeeId: process.employeeId,
      separationType: process.separationType,
      completedBy: userId,
    });

    return updated;
  }
}
