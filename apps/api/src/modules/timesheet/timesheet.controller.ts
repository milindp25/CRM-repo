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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permission, UserRole } from '@hrplatform/shared';
import { TimesheetService } from './timesheet.service';
import {
  CreateTimesheetDto,
  CreateEntryDto,
  UpdateEntryDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './dto';

// TS1272 workaround: define JwtPayload locally instead of importing
interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
  employeeId?: string;
}

@ApiTags('Timesheets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'timesheets', version: '1' })
@RequireFeature('TIME_TRACKING')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  // ─── Timesheet CRUD ────────────────────────────────────────────────

  @Post()
  @RequirePermissions(Permission.MANAGE_TIMESHEETS, Permission.VIEW_OWN_TIMESHEETS)
  @ApiOperation({ summary: 'Create a new weekly timesheet' })
  @ApiResponse({ status: 201, description: 'Timesheet created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Timesheet already exists for this week' })
  async createTimesheet(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTimesheetDto,
  ) {
    return this.timesheetService.createTimesheet(
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get()
  @RequirePermissions(Permission.MANAGE_TIMESHEETS)
  @ApiOperation({ summary: 'List all timesheets with filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (DRAFT, SUBMITTED, APPROVED, REJECTED)' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee UUID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Timesheets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTimesheets(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timesheetService.getTimesheets(user.companyId, {
      status,
      employeeId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('my')
  @RequirePermissions(Permission.VIEW_OWN_TIMESHEETS, Permission.MANAGE_TIMESHEETS)
  @ApiOperation({ summary: 'Get my timesheets' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'My timesheets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyTimesheets(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timesheetService.getMyTimesheets(
      user.companyId,
      user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ─── Project CRUD (must be above :id route to avoid conflicts) ────

  @Get('projects')
  @RequirePermissions(Permission.MANAGE_TIMESHEETS, Permission.VIEW_OWN_TIMESHEETS)
  @ApiOperation({ summary: 'List all projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProjects(@CurrentUser() user: JwtPayload) {
    return this.timesheetService.getProjects(user.companyId);
  }

  @Post('projects')
  @RequirePermissions(Permission.MANAGE_TIMESHEETS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createProject(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProjectDto,
  ) {
    return this.timesheetService.createProject(
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Patch('projects/:id')
  @RequirePermissions(Permission.MANAGE_TIMESHEETS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async updateProject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.timesheetService.updateProject(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_OWN_TIMESHEETS, Permission.MANAGE_TIMESHEETS)
  @ApiOperation({ summary: 'Get timesheet by ID' })
  @ApiResponse({ status: 200, description: 'Timesheet retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  async getTimesheet(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.timesheetService.getTimesheet(id, user.companyId);
  }

  // ─── Time Entry Management ─────────────────────────────────────────

  @Post(':id/entries')
  @RequirePermissions(Permission.VIEW_OWN_TIMESHEETS, Permission.MANAGE_TIMESHEETS)
  @ApiOperation({ summary: 'Add a time entry to a timesheet' })
  @ApiResponse({ status: 201, description: 'Time entry created successfully' })
  @ApiResponse({ status: 400, description: 'Timesheet is not in DRAFT status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  async addEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id') timesheetId: string,
    @Body() dto: CreateEntryDto,
  ) {
    return this.timesheetService.addEntry(
      timesheetId,
      dto,
      user.companyId,
      user.userId,
    );
  }

  @Patch(':id/entries/:entryId')
  @RequirePermissions(Permission.VIEW_OWN_TIMESHEETS, Permission.MANAGE_TIMESHEETS)
  @ApiOperation({ summary: 'Update a time entry on a timesheet' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully' })
  @ApiResponse({ status: 400, description: 'Timesheet is not in DRAFT status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Timesheet or entry not found' })
  async updateEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id') timesheetId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.timesheetService.updateEntry(
      timesheetId,
      entryId,
      dto,
      user.companyId,
      user.userId,
    );
  }

  @Delete(':id/entries/:entryId')
  @RequirePermissions(Permission.VIEW_OWN_TIMESHEETS, Permission.MANAGE_TIMESHEETS)
  @ApiOperation({ summary: 'Delete a time entry from a timesheet' })
  @ApiResponse({ status: 200, description: 'Time entry deleted successfully' })
  @ApiResponse({ status: 400, description: 'Timesheet is not in DRAFT status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Timesheet or entry not found' })
  async deleteEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id') timesheetId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.timesheetService.deleteEntry(
      timesheetId,
      entryId,
      user.companyId,
      user.userId,
    );
  }

  // ─── Timesheet Workflow ────────────────────────────────────────────

  @Post(':id/submit')
  @RequirePermissions(Permission.VIEW_OWN_TIMESHEETS, Permission.MANAGE_TIMESHEETS)
  @ApiOperation({ summary: 'Submit a timesheet for approval' })
  @ApiResponse({ status: 200, description: 'Timesheet submitted successfully' })
  @ApiResponse({ status: 400, description: 'Timesheet is not in DRAFT status or has no entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  async submitTimesheet(
    @CurrentUser() user: JwtPayload,
    @Param('id') timesheetId: string,
  ) {
    return this.timesheetService.submitTimesheet(
      timesheetId,
      user.userId,
      user.companyId,
    );
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.APPROVE_TIMESHEETS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve a submitted timesheet' })
  @ApiResponse({ status: 200, description: 'Timesheet approved successfully' })
  @ApiResponse({ status: 400, description: 'Timesheet is not in SUBMITTED status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  async approveTimesheet(
    @CurrentUser() user: JwtPayload,
    @Param('id') timesheetId: string,
  ) {
    return this.timesheetService.approveTimesheet(
      timesheetId,
      user.userId,
      user.companyId,
    );
  }

  @Post(':id/reject')
  @RequirePermissions(Permission.APPROVE_TIMESHEETS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Reject a submitted timesheet' })
  @ApiResponse({ status: 200, description: 'Timesheet rejected successfully' })
  @ApiResponse({ status: 400, description: 'Timesheet is not in SUBMITTED status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  async rejectTimesheet(
    @CurrentUser() user: JwtPayload,
    @Param('id') timesheetId: string,
    @Body('reason') reason?: string,
  ) {
    return this.timesheetService.rejectTimesheet(
      timesheetId,
      user.userId,
      user.companyId,
      reason,
    );
  }

}
