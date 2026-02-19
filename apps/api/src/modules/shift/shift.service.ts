import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import { ShiftRepository } from './shift.repository';
import { CreateShiftDto, UpdateShiftDto, AssignShiftDto } from './dto';

@Injectable()
export class ShiftService {
  constructor(
    private readonly repository: ShiftRepository,
    private readonly logger: LoggerService,
  ) {}

  // ─── Shift Definitions ───────────────────────────────────────────────

  async createDefinition(companyId: string, userId: string, dto: CreateShiftDto) {
    this.logger.log(`Creating shift definition: ${dto.name} (${dto.code})`);

    // Check for duplicate code within company
    const existing = await this.repository.findDefinitionByCode(dto.code, companyId);
    if (existing) {
      throw new ConflictException(`Shift with code "${dto.code}" already exists`);
    }

    const createData: Prisma.ShiftDefinitionCreateInput = {
      name: dto.name,
      code: dto.code,
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.color !== undefined && { color: dto.color }),
      startTime: dto.startTime,
      endTime: dto.endTime,
      ...(dto.breakDuration !== undefined && { breakDuration: dto.breakDuration }),
      ...(dto.isOvernight !== undefined && { isOvernight: dto.isOvernight }),
      ...(dto.graceMinutes !== undefined && { graceMinutes: dto.graceMinutes }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      company: { connect: { id: companyId } },
    };

    const shift = await this.repository.createDefinition(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'SHIFT_DEFINITION',
      resourceId: shift.id,
      newValues: { name: dto.name, code: dto.code },
    });

    return this.formatDefinition(shift);
  }

  async findAllDefinitions(
    companyId: string,
    options?: { isActive?: boolean; page?: number; limit?: number },
  ) {
    this.logger.log('Finding all shift definitions');

    const { data, total } = await this.repository.findDefinitions(companyId, options);

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((s: any) => this.formatDefinition(s)),
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

  async findOneDefinition(id: string, companyId: string) {
    this.logger.log(`Finding shift definition ${id}`);

    const shift = await this.repository.findDefinitionById(id, companyId);
    if (!shift) {
      throw new NotFoundException('Shift definition not found');
    }

    return this.formatDefinition(shift);
  }

  async updateDefinition(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateShiftDto,
  ) {
    this.logger.log(`Updating shift definition ${id}`);

    const existing = await this.repository.findDefinitionById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Shift definition not found');
    }

    // If updating code, check for duplicates
    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.repository.findDefinitionByCode(dto.code, companyId);
      if (duplicate) {
        throw new ConflictException(`Shift with code "${dto.code}" already exists`);
      }
    }

    const updateData: Prisma.ShiftDefinitionUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.code !== undefined && { code: dto.code }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.startTime !== undefined && { startTime: dto.startTime }),
      ...(dto.endTime !== undefined && { endTime: dto.endTime }),
      ...(dto.breakDuration !== undefined && { breakDuration: dto.breakDuration }),
      ...(dto.isOvernight !== undefined && { isOvernight: dto.isOvernight }),
      ...(dto.graceMinutes !== undefined && { graceMinutes: dto.graceMinutes }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    const updated = await this.repository.updateDefinition(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'SHIFT_DEFINITION',
      resourceId: id,
      newValues: dto,
    });

    return this.formatDefinition(updated);
  }

  async deleteDefinition(id: string, companyId: string, userId: string) {
    this.logger.log(`Deleting shift definition ${id}`);

    const existing = await this.repository.findDefinitionById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Shift definition not found');
    }

    await this.repository.deleteDefinition(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'SHIFT_DEFINITION',
      resourceId: id,
      oldValues: { name: existing.name, code: existing.code },
    });
  }

  // ─── Shift Assignments ───────────────────────────────────────────────

  async assignShift(
    shiftId: string,
    companyId: string,
    userId: string,
    dto: AssignShiftDto,
  ) {
    this.logger.log(`Assigning shift ${shiftId} to ${dto.employeeIds.length} employee(s)`);

    // Verify shift definition exists and belongs to company
    const shift = await this.repository.findDefinitionById(shiftId, companyId);
    if (!shift) {
      throw new NotFoundException('Shift definition not found');
    }

    if (!shift.isActive) {
      throw new BadRequestException('Cannot assign an inactive shift');
    }

    // Validate date range
    if (dto.endDate && new Date(dto.endDate) < new Date(dto.assignmentDate)) {
      throw new BadRequestException('End date must be after assignment date');
    }

    const assignments = dto.employeeIds.map((employeeId) => ({
      companyId,
      shiftId,
      employeeId,
      assignmentDate: new Date(dto.assignmentDate),
      ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      ...(dto.notes && { notes: dto.notes }),
    }));

    const result = await this.repository.createManyAssignments(assignments);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'SHIFT_ASSIGNMENT',
      resourceId: shiftId,
      newValues: {
        shiftId,
        employeeIds: dto.employeeIds,
        assignmentDate: dto.assignmentDate,
      },
    });

    return {
      created: result.count,
      shiftId,
      assignmentDate: dto.assignmentDate,
      endDate: dto.endDate || null,
    };
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
    this.logger.log('Finding shift assignments');

    const { data, total } = await this.repository.findAssignments(companyId, filters);

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((a: any) => this.formatAssignment(a)),
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

  async findMyAssignments(
    companyId: string,
    userId: string,
    filters?: { startDate?: string; endDate?: string; page?: number; limit?: number },
  ) {
    this.logger.log(`Finding assignments for user ${userId}`);

    // userId here is the user's ID; we filter by employeeId = userId
    const { data, total } = await this.repository.findAssignments(companyId, {
      employeeId: userId,
      ...filters,
    });

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((a: any) => this.formatAssignment(a)),
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

  async deleteAssignment(id: string, companyId: string, userId: string) {
    this.logger.log(`Deleting shift assignment ${id}`);

    const assignment = await this.repository.findAssignmentById(id, companyId);
    if (!assignment) {
      throw new NotFoundException('Shift assignment not found');
    }

    await this.repository.deleteAssignment(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'SHIFT_ASSIGNMENT',
      resourceId: id,
      oldValues: {
        shiftId: assignment.shiftId,
        employeeId: assignment.employeeId,
        assignmentDate: assignment.assignmentDate,
      },
    });
  }

  // ─── Formatters ───────────────────────────────────────────────────────

  private formatDefinition(shift: any) {
    return {
      id: shift.id,
      companyId: shift.companyId,
      name: shift.name,
      code: shift.code,
      description: shift.description,
      color: shift.color,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      isOvernight: shift.isOvernight,
      graceMinutes: shift.graceMinutes,
      isActive: shift.isActive,
      assignmentCount: shift._count?.assignments ?? 0,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
    };
  }

  private formatAssignment(assignment: any) {
    return {
      id: assignment.id,
      companyId: assignment.companyId,
      shiftId: assignment.shiftId,
      employeeId: assignment.employeeId,
      assignmentDate: assignment.assignmentDate instanceof Date
        ? assignment.assignmentDate.toISOString().split('T')[0]
        : assignment.assignmentDate,
      endDate: assignment.endDate instanceof Date
        ? assignment.endDate.toISOString().split('T')[0]
        : assignment.endDate || null,
      notes: assignment.notes,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      ...(assignment.shift && {
        shift: {
          id: assignment.shift.id,
          name: assignment.shift.name,
          code: assignment.shift.code,
          startTime: assignment.shift.startTime,
          endTime: assignment.shift.endTime,
          color: assignment.shift.color,
        },
      }),
    };
  }
}
