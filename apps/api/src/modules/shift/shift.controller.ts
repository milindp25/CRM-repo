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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permission, UserRole } from '@hrplatform/shared';
import { ShiftService } from './shift.service';
import { CreateShiftDto, UpdateShiftDto, AssignShiftDto } from './dto';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

@ApiTags('Shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'shifts', version: '1' })
@RequireFeature('SHIFTS')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  // ─── Shift Definitions ───────────────────────────────────────────────

  @Post()
  @RequirePermissions(Permission.MANAGE_SHIFTS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create shift definition' })
  @ApiResponse({ status: 201, description: 'Shift definition created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Shift code already exists' })
  async createDefinition(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateShiftDto,
  ) {
    return this.shiftService.createDefinition(user.companyId, user.userId, dto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_SHIFTS, Permission.MANAGE_SHIFTS)
  @ApiOperation({ summary: 'List shift definitions' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Shift definitions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllDefinitions(
    @CurrentUser() user: JwtPayload,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shiftService.findAllDefinitions(user.companyId, {
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('assignments')
  @RequirePermissions(Permission.VIEW_SHIFTS, Permission.MANAGE_SHIFTS)
  @ApiOperation({ summary: 'List shift assignments with filters' })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  @ApiQuery({ name: 'shiftId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Shift assignments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAssignments(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId') employeeId?: string,
    @Query('shiftId') shiftId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shiftService.findAssignments(user.companyId, {
      employeeId,
      shiftId,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('assignments/my')
  @ApiOperation({ summary: 'Get my shift assignments' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'My shift assignments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMyAssignments(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shiftService.findMyAssignments(user.companyId, user.userId, {
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_SHIFTS)
  @ApiOperation({ summary: 'Get shift definition by ID' })
  @ApiResponse({ status: 200, description: 'Shift definition retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Shift definition not found' })
  async findOneDefinition(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.shiftService.findOneDefinition(id, user.companyId);
  }

  @Patch(':id')
  @RequirePermissions(Permission.MANAGE_SHIFTS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update shift definition' })
  @ApiResponse({ status: 200, description: 'Shift definition updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Shift definition not found' })
  @ApiResponse({ status: 409, description: 'Shift code already exists' })
  async updateDefinition(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.shiftService.updateDefinition(id, user.companyId, user.userId, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_SHIFTS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete shift definition' })
  @ApiResponse({ status: 204, description: 'Shift definition deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Shift definition not found' })
  async deleteDefinition(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.shiftService.deleteDefinition(id, user.companyId, user.userId);
  }

  // ─── Shift Assignments ───────────────────────────────────────────────

  @Post(':shiftId/assignments')
  @RequirePermissions(Permission.MANAGE_SHIFTS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Assign shift to employee(s)' })
  @ApiResponse({ status: 201, description: 'Shift assigned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Shift definition not found' })
  async assignShift(
    @CurrentUser() user: JwtPayload,
    @Param('shiftId') shiftId: string,
    @Body() dto: AssignShiftDto,
  ) {
    return this.shiftService.assignShift(shiftId, user.companyId, user.userId, dto);
  }

  @Delete('assignments/:id')
  @RequirePermissions(Permission.MANAGE_SHIFTS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove shift assignment' })
  @ApiResponse({ status: 204, description: 'Shift assignment removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Shift assignment not found' })
  async deleteAssignment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.shiftService.deleteAssignment(id, user.companyId, user.userId);
  }
}
