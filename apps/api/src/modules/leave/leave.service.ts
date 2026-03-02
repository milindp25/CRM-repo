import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { LeaveRepository } from './leave.repository';
import {
  CreateLeaveDto,
  UpdateLeaveDto,
  LeaveFilterDto,
  LeaveResponseDto,
  LeavePaginationResponseDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  CancelLeaveDto,
  BulkLeaveActionDto,
  BulkLeaveActionResponseDto,
} from './dto';

@Injectable()
export class LeaveService {
  constructor(
    private readonly repository: LeaveRepository,
    private readonly logger: LoggerService,
    private readonly cache: CacheService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    dto: CreateLeaveDto,
  ): Promise<LeaveResponseDto> {
    this.logger.log(`Creating leave request for employee ${dto.employeeId}`);

    const createData: Prisma.LeaveCreateInput = {
      leaveType: dto.leaveType,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      totalDays: dto.totalDays,
      reason: dto.reason,
      status: 'PENDING',
      ...(dto.isHalfDay !== undefined && { isHalfDay: dto.isHalfDay }),
      ...(dto.halfDayType && { halfDayType: dto.halfDayType }),
      ...(dto.contactDuringLeave && { contactDuringLeave: dto.contactDuringLeave }),
      company: { connect: { id: companyId } },
      employee: { connect: { id: dto.employeeId } },
    };

    const leave = await this.repository.create(createData);

    // Invalidate leave cache
    this.cache.invalidateByPrefix('leave:');

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'LEAVE',
      resourceId: leave.id,
      newValues: {
        employeeId: dto.employeeId,
        leaveType: dto.leaveType,
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
    });

    return this.formatLeave(leave);
  }

  async findAll(
    companyId: string,
    filter: LeaveFilterDto,
  ): Promise<LeavePaginationResponseDto> {
    this.logger.log('Finding all leave requests');

    const cacheKey = `leave:${companyId}:${JSON.stringify(filter)}`;

    return this.cache.getOrSet(cacheKey, async () => {
      const { data, total } = await this.repository.findMany(companyId, filter);

      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const totalPages = Math.ceil(total / limit);

      return {
        data: data.map((leave: any) => this.formatLeave(leave)),
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }, 30_000);
  }

  async findOne(id: string, companyId: string): Promise<LeaveResponseDto> {
    this.logger.log(`Finding leave request ${id}`);

    const leave = await this.repository.findById(id, companyId);

    if (!leave) {
      throw new NotFoundException(`Leave request not found`);
    }

    return this.formatLeave(leave);
  }

  async update(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateLeaveDto,
  ): Promise<LeaveResponseDto> {
    this.logger.log(`Updating leave request ${id}`);

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException(`Leave request not found`);
    }

    const updateData: Prisma.LeaveUpdateInput = {
      ...(dto.employeeId && { employee: { connect: { id: dto.employeeId } } }),
      ...(dto.leaveType && { leaveType: dto.leaveType }),
      ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      ...(dto.totalDays !== undefined && { totalDays: dto.totalDays }),
      ...(dto.reason !== undefined && { reason: dto.reason }),
      ...(dto.isHalfDay !== undefined && { isHalfDay: dto.isHalfDay }),
      ...(dto.halfDayType !== undefined && { halfDayType: dto.halfDayType }),
      ...(dto.contactDuringLeave !== undefined && { contactDuringLeave: dto.contactDuringLeave }),
    };

    const updated = await this.repository.update(id, companyId, updateData);

    // Invalidate leave cache
    this.cache.invalidateByPrefix('leave:');

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'LEAVE',
      resourceId: id,
      newValues: dto,
    });

    return this.formatLeave(updated);
  }

  async remove(id: string, companyId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting leave request ${id}`);

    const leave = await this.repository.findById(id, companyId);

    if (!leave) {
      throw new NotFoundException(`Leave request not found`);
    }

    await this.repository.delete(id, companyId);

    // Invalidate leave cache
    this.cache.invalidateByPrefix('leave:');

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'LEAVE',
      resourceId: id,
      oldValues: {
        employeeId: leave.employeeId,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
      },
    });
  }

  async approve(
    id: string,
    companyId: string,
    userId: string,
    dto: ApproveLeaveDto,
  ): Promise<LeaveResponseDto> {
    this.logger.log(`Approving leave request ${id}`);

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException(`Leave request not found`);
    }

    const updateData: Prisma.LeaveUpdateInput = {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date(),
      ...(dto.approvalNotes && { approvalNotes: dto.approvalNotes }),
    };

    const updated = await this.repository.update(id, companyId, updateData);

    // Invalidate leave cache
    this.cache.invalidateByPrefix('leave:');

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'APPROVE',
      resourceType: 'LEAVE',
      resourceId: id,
      newValues: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
    });

    return this.formatLeave(updated);
  }

  async reject(
    id: string,
    companyId: string,
    userId: string,
    dto: RejectLeaveDto,
  ): Promise<LeaveResponseDto> {
    this.logger.log(`Rejecting leave request ${id}`);

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException(`Leave request not found`);
    }

    const updateData: Prisma.LeaveUpdateInput = {
      status: 'REJECTED',
      approvalNotes: dto.approvalNotes,
    };

    const updated = await this.repository.update(id, companyId, updateData);

    // Invalidate leave cache
    this.cache.invalidateByPrefix('leave:');

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'REJECT',
      resourceType: 'LEAVE',
      resourceId: id,
      newValues: { status: 'REJECTED', approvalNotes: dto.approvalNotes },
    });

    return this.formatLeave(updated);
  }

  async cancel(
    id: string,
    companyId: string,
    userId: string,
    dto: CancelLeaveDto,
  ): Promise<LeaveResponseDto> {
    this.logger.log(`Cancelling leave request ${id}`);

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException(`Leave request not found`);
    }

    const updateData: Prisma.LeaveUpdateInput = {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: dto.cancellationReason,
    };

    const updated = await this.repository.update(id, companyId, updateData);

    // Invalidate leave cache
    this.cache.invalidateByPrefix('leave:');

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CANCEL',
      resourceType: 'LEAVE',
      resourceId: id,
      newValues: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: dto.cancellationReason },
    });

    return this.formatLeave(updated);
  }

  /**
   * Bulk approve multiple leave requests.
   * Skips non-PENDING leaves.
   */
  async bulkApprove(
    companyId: string,
    userId: string,
    dto: BulkLeaveActionDto,
  ): Promise<BulkLeaveActionResponseDto> {
    this.logger.log(`Bulk approving ${dto.leaveIds.length} leave requests`);

    const result: BulkLeaveActionResponseDto = { processed: 0, skipped: 0, errors: [] };

    for (const leaveId of dto.leaveIds) {
      try {
        const leave = await this.repository.findById(leaveId, companyId);
        if (!leave) {
          result.errors.push({ leaveId, reason: 'Not found' });
          continue;
        }
        if (leave.status !== 'PENDING') {
          result.skipped++;
          continue;
        }

        await this.repository.update(leaveId, companyId, {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
          ...(dto.reason && { approvalNotes: dto.reason }),
        });
        result.processed++;
      } catch (error) {
        result.errors.push({ leaveId, reason: (error as Error).message });
      }
    }

    this.cache.invalidateByPrefix('leave:');

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'BULK_APPROVE',
      resourceType: 'LEAVE',
      resourceId: companyId,
      newValues: { approved: result.processed, skipped: result.skipped },
    });

    this.logger.log(`Bulk approve complete: ${result.processed} processed, ${result.skipped} skipped`);
    return result;
  }

  /**
   * Bulk reject multiple leave requests.
   * Skips non-PENDING leaves.
   */
  async bulkReject(
    companyId: string,
    userId: string,
    dto: BulkLeaveActionDto,
  ): Promise<BulkLeaveActionResponseDto> {
    this.logger.log(`Bulk rejecting ${dto.leaveIds.length} leave requests`);

    const result: BulkLeaveActionResponseDto = { processed: 0, skipped: 0, errors: [] };

    for (const leaveId of dto.leaveIds) {
      try {
        const leave = await this.repository.findById(leaveId, companyId);
        if (!leave) {
          result.errors.push({ leaveId, reason: 'Not found' });
          continue;
        }
        if (leave.status !== 'PENDING') {
          result.skipped++;
          continue;
        }

        await this.repository.update(leaveId, companyId, {
          status: 'REJECTED',
          ...(dto.reason && { approvalNotes: dto.reason }),
        });
        result.processed++;
      } catch (error) {
        result.errors.push({ leaveId, reason: (error as Error).message });
      }
    }

    this.cache.invalidateByPrefix('leave:');

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'BULK_REJECT',
      resourceType: 'LEAVE',
      resourceId: companyId,
      newValues: { rejected: result.processed, skipped: result.skipped },
    });

    this.logger.log(`Bulk reject complete: ${result.processed} processed, ${result.skipped} skipped`);
    return result;
  }

  private formatLeave(leave: any): LeaveResponseDto {
    return {
      id: leave.id,
      companyId: leave.companyId,
      employeeId: leave.employeeId,
      leaveType: leave.leaveType,
      startDate: leave.startDate.toISOString().split('T')[0],
      endDate: leave.endDate.toISOString().split('T')[0],
      totalDays: leave.totalDays,
      reason: leave.reason,
      status: leave.status,
      isHalfDay: leave.isHalfDay,
      halfDayType: leave.halfDayType ?? undefined,
      contactDuringLeave: leave.contactDuringLeave ?? undefined,
      appliedAt: leave.appliedAt,
      approvedBy: leave.approvedBy,
      approvedAt: leave.approvedAt,
      approvalNotes: leave.approvalNotes,
      cancelledAt: leave.cancelledAt,
      cancellationReason: leave.cancellationReason,
      createdAt: leave.createdAt,
      updatedAt: leave.updatedAt,
      ...(leave.employee && {
        employee: {
          id: leave.employee.id,
          employeeCode: leave.employee.employeeCode,
          firstName: leave.employee.firstName,
          lastName: leave.employee.lastName,
        },
      }),
    };
  }
}
