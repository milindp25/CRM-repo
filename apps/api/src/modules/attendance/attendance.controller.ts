import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, Permission } from '@hrplatform/shared';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  AttendanceFilterDto,
  AttendanceResponseDto,
  AttendancePaginationResponseDto,
  BulkMarkAttendanceDto,
  BulkAttendanceResponseDto,
} from './dto';

interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
}

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'attendance', version: '1' })
@RequireFeature('ATTENDANCE')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MARK_ATTENDANCE)
  @ApiOperation({ summary: 'Create attendance record' })
  @ApiResponse({
    status: 201,
    description: 'Attendance record created successfully',
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Attendance already exists for this date' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.create(user.companyId, user.userId, dto);
  }

  @Post('bulk')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk mark attendance for multiple employees' })
  @ApiResponse({
    status: 201,
    description: 'Bulk attendance marked',
    type: BulkAttendanceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async bulkMark(
    @CurrentUser() user: JwtPayload,
    @Body() dto: BulkMarkAttendanceDto,
  ): Promise<BulkAttendanceResponseDto> {
    return this.attendanceService.bulkMark(user.companyId, user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attendance records' })
  @ApiResponse({
    status: 200,
    description: 'Attendance records retrieved successfully',
    type: AttendancePaginationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() filter: AttendanceFilterDto,
  ): Promise<AttendancePaginationResponseDto> {
    return this.attendanceService.findAll(user.companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendance record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record retrieved successfully',
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MARK_ATTENDANCE)
  @ApiOperation({ summary: 'Update attendance record' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record updated successfully',
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  @ApiResponse({ status: 409, description: 'Attendance already exists for this date' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.update(id, user.companyId, user.userId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Delete attendance record' })
  @ApiResponse({ status: 204, description: 'Attendance record deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    return this.attendanceService.remove(id, user.companyId, user.userId);
  }
}
