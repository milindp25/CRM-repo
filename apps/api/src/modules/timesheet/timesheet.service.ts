import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggerService } from '../../common/services/logger.service';
import { TimesheetRepository, TimesheetFilterParams } from './timesheet.repository';
import {
  CreateTimesheetDto,
  CreateEntryDto,
  UpdateEntryDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './dto';

@Injectable()
export class TimesheetService {
  constructor(
    private readonly repository: TimesheetRepository,
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Timesheet CRUD ────────────────────────────────────────────────

  async createTimesheet(
    companyId: string,
    employeeId: string,
    dto: CreateTimesheetDto,
  ) {
    const targetEmployeeId = dto.employeeId || employeeId;
    const weekStart = this.normalizeToMonday(new Date(dto.weekStartDate));

    this.logger.log(
      `Creating timesheet for employee ${targetEmployeeId}, week starting ${weekStart.toISOString()}`,
      'TimesheetService',
    );

    // Check for existing timesheet for that week (unique constraint)
    const existing = await this.repository.findTimesheetByWeek(
      companyId,
      targetEmployeeId,
      weekStart,
    );

    if (existing) {
      throw new ConflictException(
        'A timesheet already exists for this employee for the specified week',
      );
    }

    const createData: Prisma.TimesheetCreateInput = {
      weekStartDate: weekStart,
      status: 'DRAFT',
      totalHours: 0,
      ...(dto.notes && { notes: dto.notes }),
      company: { connect: { id: companyId } },
      employee: { connect: { id: targetEmployeeId } },
    };

    const timesheet = await this.repository.createTimesheet(createData);

    await this.repository.createAuditLog({
      userId: employeeId,
      companyId,
      action: 'CREATE',
      resourceType: 'TIMESHEET',
      resourceId: timesheet.id,
      newValues: {
        employeeId: targetEmployeeId,
        weekStartDate: weekStart.toISOString(),
        status: 'DRAFT',
      },
    });

    return timesheet;
  }

  async getTimesheets(companyId: string, filter: TimesheetFilterParams) {
    this.logger.log('Finding all timesheets', 'TimesheetService');

    const { data, total } = await this.repository.findTimesheets(
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

  async getTimesheet(id: string, companyId: string) {
    this.logger.log(`Finding timesheet ${id}`, 'TimesheetService');

    const timesheet = await this.repository.findTimesheetById(id, companyId);

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    return timesheet;
  }

  async getMyTimesheets(
    companyId: string,
    employeeId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    this.logger.log(
      `Finding timesheets for employee ${employeeId}`,
      'TimesheetService',
    );

    const { data, total } = await this.repository.findMyTimesheets(
      companyId,
      employeeId,
      page,
      limit,
    );

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

  // ─── Time Entry Management ─────────────────────────────────────────

  async addEntry(
    timesheetId: string,
    dto: CreateEntryDto,
    companyId: string,
    userId: string,
  ) {
    this.logger.log(
      `Adding entry to timesheet ${timesheetId}`,
      'TimesheetService',
    );

    const timesheet = await this.repository.findTimesheetById(
      timesheetId,
      companyId,
    );

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.status !== 'DRAFT') {
      throw new BadRequestException(
        'Can only add entries to DRAFT timesheets',
      );
    }

    const entryData: Prisma.TimeEntryCreateInput = {
      date: new Date(dto.date),
      hours: dto.hours,
      entryType: dto.entryType || 'REGULAR',
      isBillable: dto.isBillable ?? false,
      ...(dto.projectName && { projectName: dto.projectName }),
      ...(dto.taskDescription && { taskDescription: dto.taskDescription }),
      timesheet: { connect: { id: timesheetId } },
      ...(dto.projectId && { project: { connect: { id: dto.projectId } } }),
    };

    const entry = await this.repository.createEntry(entryData);

    // Recalculate total hours
    await this.recalculateTotalHours(timesheetId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'TIME_ENTRY',
      resourceId: entry.id,
      newValues: {
        timesheetId,
        date: dto.date,
        hours: dto.hours,
        entryType: dto.entryType || 'REGULAR',
      },
    });

    return entry;
  }

  async updateEntry(
    timesheetId: string,
    entryId: string,
    dto: UpdateEntryDto,
    companyId: string,
    userId: string,
  ) {
    this.logger.log(
      `Updating entry ${entryId} on timesheet ${timesheetId}`,
      'TimesheetService',
    );

    const timesheet = await this.repository.findTimesheetById(
      timesheetId,
      companyId,
    );

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.status !== 'DRAFT') {
      throw new BadRequestException(
        'Can only update entries on DRAFT timesheets',
      );
    }

    // Verify entry belongs to this timesheet
    const existingEntry = await this.repository.findEntryById(entryId);
    if (!existingEntry || existingEntry.timesheetId !== timesheetId) {
      throw new NotFoundException('Time entry not found on this timesheet');
    }

    const updateData: Prisma.TimeEntryUpdateInput = {
      ...(dto.date && { date: new Date(dto.date) }),
      ...(dto.hours !== undefined && { hours: dto.hours }),
      ...(dto.projectName !== undefined && { projectName: dto.projectName }),
      ...(dto.taskDescription !== undefined && {
        taskDescription: dto.taskDescription,
      }),
      ...(dto.entryType && { entryType: dto.entryType }),
      ...(dto.isBillable !== undefined && { isBillable: dto.isBillable }),
      ...(dto.projectId !== undefined && {
        project: dto.projectId
          ? { connect: { id: dto.projectId } }
          : { disconnect: true },
      }),
    };

    const updated = await this.repository.updateEntry(entryId, updateData);

    // Recalculate total hours
    await this.recalculateTotalHours(timesheetId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'TIME_ENTRY',
      resourceId: entryId,
      newValues: dto,
    });

    return updated;
  }

  async deleteEntry(
    timesheetId: string,
    entryId: string,
    companyId: string,
    userId: string,
  ) {
    this.logger.log(
      `Deleting entry ${entryId} from timesheet ${timesheetId}`,
      'TimesheetService',
    );

    const timesheet = await this.repository.findTimesheetById(
      timesheetId,
      companyId,
    );

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.status !== 'DRAFT') {
      throw new BadRequestException(
        'Can only delete entries from DRAFT timesheets',
      );
    }

    // Verify entry belongs to this timesheet
    const existingEntry = await this.repository.findEntryById(entryId);
    if (!existingEntry || existingEntry.timesheetId !== timesheetId) {
      throw new NotFoundException('Time entry not found on this timesheet');
    }

    await this.repository.deleteEntry(entryId);

    // Recalculate total hours
    await this.recalculateTotalHours(timesheetId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'TIME_ENTRY',
      resourceId: entryId,
      oldValues: {
        timesheetId,
        date: existingEntry.date,
        hours: parseFloat(existingEntry.hours.toString()),
      },
    });

    return { message: 'Time entry deleted successfully' };
  }

  // ─── Timesheet Workflow ────────────────────────────────────────────

  async submitTimesheet(
    timesheetId: string,
    userId: string,
    companyId: string,
  ) {
    this.logger.log(
      `Submitting timesheet ${timesheetId}`,
      'TimesheetService',
    );

    const timesheet = await this.repository.findTimesheetById(
      timesheetId,
      companyId,
    );

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT timesheets can be submitted');
    }

    if (timesheet.entries.length === 0) {
      throw new BadRequestException(
        'Cannot submit a timesheet with no entries',
      );
    }

    const updated = await this.repository.updateTimesheet(timesheetId, {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'SUBMIT',
      resourceType: 'TIMESHEET',
      resourceId: timesheetId,
      newValues: { status: 'SUBMITTED', submittedAt: new Date() },
    });

    this.eventEmitter.emit('timesheet.submitted', {
      timesheetId,
      companyId,
      employeeId: timesheet.employeeId,
      weekStartDate: timesheet.weekStartDate,
      totalHours: parseFloat(timesheet.totalHours.toString()),
    });

    return updated;
  }

  async approveTimesheet(
    timesheetId: string,
    userId: string,
    companyId: string,
  ) {
    this.logger.log(
      `Approving timesheet ${timesheetId}`,
      'TimesheetService',
    );

    const timesheet = await this.repository.findTimesheetById(
      timesheetId,
      companyId,
    );

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Only SUBMITTED timesheets can be approved',
      );
    }

    const updated = await this.repository.updateTimesheet(timesheetId, {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date(),
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'APPROVE',
      resourceType: 'TIMESHEET',
      resourceId: timesheetId,
      newValues: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    this.eventEmitter.emit('timesheet.approved', {
      timesheetId,
      companyId,
      employeeId: timesheet.employeeId,
      approvedBy: userId,
      weekStartDate: timesheet.weekStartDate,
      totalHours: parseFloat(timesheet.totalHours.toString()),
    });

    return updated;
  }

  async rejectTimesheet(
    timesheetId: string,
    userId: string,
    companyId: string,
    reason?: string,
  ) {
    this.logger.log(
      `Rejecting timesheet ${timesheetId}`,
      'TimesheetService',
    );

    const timesheet = await this.repository.findTimesheetById(
      timesheetId,
      companyId,
    );

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Only SUBMITTED timesheets can be rejected',
      );
    }

    const updated = await this.repository.updateTimesheet(timesheetId, {
      status: 'REJECTED',
      ...(reason && { notes: reason }),
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'REJECT',
      resourceType: 'TIMESHEET',
      resourceId: timesheetId,
      newValues: { status: 'REJECTED', reason },
    });

    this.eventEmitter.emit('timesheet.rejected', {
      timesheetId,
      companyId,
      employeeId: timesheet.employeeId,
      rejectedBy: userId,
      weekStartDate: timesheet.weekStartDate,
      reason,
    });

    return updated;
  }

  // ─── Project CRUD ──────────────────────────────────────────────────

  async createProject(companyId: string, userId: string, dto: CreateProjectDto) {
    this.logger.log(
      `Creating project "${dto.name}" for company ${companyId}`,
      'TimesheetService',
    );

    const createData: Prisma.ProjectCreateInput = {
      name: dto.name,
      code: dto.code,
      ...(dto.clientName && { clientName: dto.clientName }),
      ...(dto.budgetHours !== undefined && { budgetHours: dto.budgetHours }),
      company: { connect: { id: companyId } },
    };

    const project = await this.repository.createProject(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'PROJECT',
      resourceId: project.id,
      newValues: { name: dto.name, code: dto.code },
    });

    return project;
  }

  async getProjects(companyId: string) {
    this.logger.log('Finding all projects', 'TimesheetService');
    return this.repository.findProjects(companyId);
  }

  async getProject(id: string, companyId: string) {
    this.logger.log(`Finding project ${id}`, 'TimesheetService');

    const project = await this.repository.findProjectById(id, companyId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async updateProject(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateProjectDto,
  ) {
    this.logger.log(`Updating project ${id}`, 'TimesheetService');

    const existing = await this.repository.findProjectById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    const updateData: Prisma.ProjectUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.clientName !== undefined && { clientName: dto.clientName }),
      ...(dto.budgetHours !== undefined && { budgetHours: dto.budgetHours }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    const updated = await this.repository.updateProject(
      id,
      companyId,
      updateData,
    );

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'PROJECT',
      resourceId: id,
      newValues: dto,
    });

    return updated;
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private async recalculateTotalHours(timesheetId: string): Promise<void> {
    const entries =
      await this.repository.findEntriesByTimesheet(timesheetId);

    const totalHours = entries.reduce(
      (sum, entry) => sum + parseFloat(entry.hours.toString()),
      0,
    );

    await this.repository.updateTimesheet(timesheetId, {
      totalHours,
    });
  }

  /**
   * Normalize a date to the Monday of its week.
   * If the given date is not a Monday, roll back to the previous Monday.
   */
  private normalizeToMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days; otherwise go back to Monday
    d.setUTCDate(d.getUTCDate() + diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}
