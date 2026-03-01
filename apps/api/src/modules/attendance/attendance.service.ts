import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { AttendanceRepository } from './attendance.repository';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  AttendanceFilterDto,
  AttendanceResponseDto,
  AttendancePaginationResponseDto,
  BulkMarkAttendanceDto,
  BulkAttendanceResponseDto,
} from './dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly repository: AttendanceRepository,
    private readonly logger: LoggerService,
    private readonly cache: CacheService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    dto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    this.logger.log(`Creating attendance for employee ${dto.employeeId} on ${dto.attendanceDate}`);

    // Check if attendance already exists for this employee on this date
    const exists = await this.repository.existsByEmployeeAndDate(
      companyId,
      dto.employeeId,
      dto.attendanceDate,
    );

    if (exists) {
      throw new ConflictException(
        `Attendance already exists for this employee on ${dto.attendanceDate}`,
      );
    }

    // Calculate total hours if both check-in and check-out times are provided
    let totalHours: number | undefined;
    if (dto.checkInTime && dto.checkOutTime) {
      const checkIn = new Date(dto.checkInTime);
      const checkOut = new Date(dto.checkOutTime);
      const diffMs = checkOut.getTime() - checkIn.getTime();
      totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2)); // Convert to hours
    }

    const createData: Prisma.AttendanceCreateInput = {
      attendanceDate: new Date(dto.attendanceDate),
      ...(dto.checkInTime && { checkInTime: new Date(dto.checkInTime) }),
      ...(dto.checkOutTime && { checkOutTime: new Date(dto.checkOutTime) }),
      ...(totalHours !== undefined && { totalHours }),
      status: dto.status || 'PRESENT',
      ...(dto.isWorkFromHome !== undefined && { isWorkFromHome: dto.isWorkFromHome }),
      ...(dto.notes && { notes: dto.notes }),
      company: { connect: { id: companyId } },
      employee: { connect: { id: dto.employeeId } },
    };

    const attendance = await this.repository.create(createData);

    // Invalidate attendance cache
    this.cache.invalidateByPrefix('attendance:');

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'ATTENDANCE',
      resourceId: attendance.id,
      newValues: { employeeId: dto.employeeId, date: dto.attendanceDate },
    });

    return this.formatAttendance(attendance);
  }

  async findAll(
    companyId: string,
    filter: AttendanceFilterDto,
  ): Promise<AttendancePaginationResponseDto> {
    this.logger.log('Finding all attendance records');

    const cacheKey = `attendance:${companyId}:${JSON.stringify(filter)}`;

    return this.cache.getOrSet(cacheKey, async () => {
      const { data, total } = await this.repository.findMany(companyId, filter);

      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const totalPages = Math.ceil(total / limit);

      return {
        data: data.map((a: any) => this.formatAttendance(a)),
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

  async findOne(id: string, companyId: string): Promise<AttendanceResponseDto> {
    this.logger.log(`Finding attendance ${id}`);

    const attendance = await this.repository.findById(id, companyId);

    if (!attendance) {
      throw new NotFoundException(`Attendance record not found`);
    }

    return this.formatAttendance(attendance);
  }

  async update(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    this.logger.log(`Updating attendance ${id}`);

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException(`Attendance record not found`);
    }

    // If updating employeeId or date, check for conflicts
    if (dto.employeeId || dto.attendanceDate) {
      const employeeId = dto.employeeId || existing.employeeId;
      const attendanceDate = dto.attendanceDate || existing.attendanceDate.toISOString().split('T')[0];

      const exists = await this.repository.existsByEmployeeAndDate(
        companyId,
        employeeId,
        attendanceDate,
        id,
      );

      if (exists) {
        throw new ConflictException(
          `Attendance already exists for this employee on ${attendanceDate}`,
        );
      }
    }

    // Recalculate total hours if check-in or check-out time is updated
    let totalHours: number | undefined;
    const checkInTime = dto.checkInTime ? new Date(dto.checkInTime) : existing.checkInTime;
    const checkOutTime = dto.checkOutTime ? new Date(dto.checkOutTime) : existing.checkOutTime;

    if (checkInTime && checkOutTime) {
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    const updateData: Prisma.AttendanceUpdateInput = {
      ...(dto.employeeId && { employee: { connect: { id: dto.employeeId } } }),
      ...(dto.attendanceDate && { attendanceDate: new Date(dto.attendanceDate) }),
      ...(dto.checkInTime && { checkInTime: new Date(dto.checkInTime) }),
      ...(dto.checkOutTime && { checkOutTime: new Date(dto.checkOutTime) }),
      ...(totalHours !== undefined && { totalHours }),
      ...(dto.status && { status: dto.status }),
      ...(dto.isWorkFromHome !== undefined && { isWorkFromHome: dto.isWorkFromHome }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    };

    const updated = await this.repository.update(id, companyId, updateData);

    // Invalidate attendance cache
    this.cache.invalidateByPrefix('attendance:');

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'ATTENDANCE',
      resourceId: id,
      newValues: dto,
    });

    return this.formatAttendance(updated);
  }

  async remove(id: string, companyId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting attendance ${id}`);

    const attendance = await this.repository.findById(id, companyId);

    if (!attendance) {
      throw new NotFoundException(`Attendance record not found`);
    }

    await this.repository.delete(id, companyId);

    // Invalidate attendance cache
    this.cache.invalidateByPrefix('attendance:');

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'ATTENDANCE',
      resourceId: id,
      oldValues: { employeeId: attendance.employeeId, date: attendance.attendanceDate },
    });
  }

  /**
   * Bulk mark attendance for multiple employees on a given date.
   * Skips employees who already have attendance for that date.
   */
  async bulkMark(
    companyId: string,
    userId: string,
    dto: BulkMarkAttendanceDto,
  ): Promise<BulkAttendanceResponseDto> {
    this.logger.log(`Bulk marking attendance for ${dto.records.length} employees on ${dto.date}`);

    const result: BulkAttendanceResponseDto = { created: 0, skipped: 0, errors: [] };

    for (const record of dto.records) {
      try {
        // Check if already exists
        const exists = await this.repository.existsByEmployeeAndDate(
          companyId,
          record.employeeId,
          dto.date,
        );

        if (exists) {
          result.skipped++;
          continue;
        }

        // Calculate total hours if both times provided
        let totalHours: number | undefined;
        if (record.checkInTime && record.checkOutTime) {
          const checkIn = new Date(record.checkInTime);
          const checkOut = new Date(record.checkOutTime);
          const diffMs = checkOut.getTime() - checkIn.getTime();
          totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
        }

        const createData: Prisma.AttendanceCreateInput = {
          attendanceDate: new Date(dto.date),
          ...(record.checkInTime && { checkInTime: new Date(record.checkInTime) }),
          ...(record.checkOutTime && { checkOutTime: new Date(record.checkOutTime) }),
          ...(totalHours !== undefined && { totalHours }),
          status: record.status || 'PRESENT',
          company: { connect: { id: companyId } },
          employee: { connect: { id: record.employeeId } },
        };

        await this.repository.create(createData);
        result.created++;
      } catch (error) {
        result.errors.push({
          employeeId: record.employeeId,
          reason: (error as Error).message,
        });
      }
    }

    // Invalidate cache after bulk operation
    this.cache.invalidateByPrefix('attendance:');

    // Audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'BULK_CREATE',
      resourceType: 'ATTENDANCE',
      resourceId: companyId, // Use companyId as resource since this is a bulk operation
      newValues: { date: dto.date, created: result.created, skipped: result.skipped },
    });

    this.logger.log(`Bulk attendance complete: ${result.created} created, ${result.skipped} skipped, ${result.errors.length} errors`);
    return result;
  }

  private formatAttendance(attendance: any): AttendanceResponseDto {
    return {
      id: attendance.id,
      companyId: attendance.companyId,
      employeeId: attendance.employeeId,
      attendanceDate: attendance.attendanceDate.toISOString().split('T')[0],
      checkInTime: attendance.checkInTime?.toISOString(),
      checkOutTime: attendance.checkOutTime?.toISOString(),
      totalHours: attendance.totalHours ? Number(attendance.totalHours) : undefined,
      status: attendance.status,
      isWorkFromHome: attendance.isWorkFromHome,
      notes: attendance.notes,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
      ...(attendance.employee && {
        employee: {
          id: attendance.employee.id,
          employeeCode: attendance.employee.employeeCode,
          firstName: attendance.employee.firstName,
          lastName: attendance.employee.lastName,
        },
      }),
    };
  }
}
