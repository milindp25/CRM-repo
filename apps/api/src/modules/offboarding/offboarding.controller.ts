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
import { OffboardingService } from './offboarding.service';
import {
  StartOffboardingDto,
  CreateChecklistDto,
  UpdateChecklistDto,
  UpdateTaskDto,
  ExitInterviewDto,
} from './dto';

// TS1272 workaround: define JwtPayload locally
interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

@ApiTags('Offboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'offboarding', version: '1' })
@RequireFeature('OFFBOARDING')
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) {}

  // ─── Checklist Routes (Admin) ──────────────────────────────────────

  @Post('checklists')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_OFFBOARDING)
  @ApiOperation({ summary: 'Create an offboarding checklist template' })
  @ApiResponse({ status: 201, description: 'Checklist created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createChecklist(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateChecklistDto,
  ) {
    return this.offboardingService.createChecklist(
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get('checklists')
  @RequirePermissions(Permission.VIEW_OFFBOARDING)
  @ApiOperation({ summary: 'List all offboarding checklist templates' })
  @ApiResponse({
    status: 200,
    description: 'Checklists retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getChecklists(@CurrentUser() user: JwtPayload) {
    return this.offboardingService.getChecklists(user.companyId);
  }

  @Get('checklists/:id')
  @RequirePermissions(Permission.VIEW_OFFBOARDING)
  @ApiOperation({ summary: 'Get offboarding checklist by ID' })
  @ApiResponse({
    status: 200,
    description: 'Checklist retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  async getChecklist(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.offboardingService.getChecklist(id, user.companyId);
  }

  @Patch('checklists/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_OFFBOARDING)
  @ApiOperation({ summary: 'Update an offboarding checklist template' })
  @ApiResponse({ status: 200, description: 'Checklist updated successfully' })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  async updateChecklist(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateChecklistDto,
  ) {
    return this.offboardingService.updateChecklist(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Delete('checklists/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_OFFBOARDING)
  @ApiOperation({ summary: 'Delete an offboarding checklist template' })
  @ApiResponse({ status: 200, description: 'Checklist deleted successfully' })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  async deleteChecklist(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.offboardingService.deleteChecklist(
      id,
      user.companyId,
      user.userId,
    );
  }

  // ─── Process Routes ────────────────────────────────────────────────

  @Post('start')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_OFFBOARDING)
  @ApiOperation({ summary: 'Start an offboarding process for an employee' })
  @ApiResponse({
    status: 201,
    description: 'Offboarding process started successfully',
  })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  async startOffboarding(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartOffboardingDto,
  ) {
    return this.offboardingService.startOffboarding(
      user.companyId,
      dto,
      user.userId,
    );
  }

  @Get()
  @RequirePermissions(Permission.VIEW_OFFBOARDING)
  @ApiOperation({ summary: 'List offboarding processes with filters' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by process status',
  })
  @ApiQuery({
    name: 'separationType',
    required: false,
    description: 'Filter by separation type',
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    description: 'Filter by employee UUID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Offboarding processes retrieved successfully',
  })
  async getProcesses(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('separationType') separationType?: string,
    @Query('employeeId') employeeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.offboardingService.getProcesses(user.companyId, {
      status,
      separationType,
      employeeId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_OFFBOARDING)
  @ApiOperation({ summary: 'Get offboarding process by ID' })
  @ApiResponse({
    status: 200,
    description: 'Offboarding process retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Process not found' })
  async getProcess(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.offboardingService.getProcess(id, user.companyId);
  }

  // ─── Task Routes ───────────────────────────────────────────────────

  @Patch(':processId/tasks/:taskId')
  @RequirePermissions(Permission.MANAGE_OFFBOARDING, Permission.VIEW_OFFBOARDING)
  @ApiOperation({ summary: 'Update an offboarding task status' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Process or task not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot update tasks on completed/cancelled process',
  })
  async updateTask(
    @CurrentUser() user: JwtPayload,
    @Param('processId') processId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.offboardingService.completeTask(
      processId,
      taskId,
      user.userId,
      user.companyId,
      dto,
    );
  }

  // ─── Exit Interview ────────────────────────────────────────────────

  @Post(':id/exit-interview')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_OFFBOARDING)
  @ApiOperation({ summary: 'Save exit interview notes' })
  @ApiResponse({
    status: 201,
    description: 'Exit interview saved successfully',
  })
  @ApiResponse({ status: 404, description: 'Process not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot add to completed/cancelled process',
  })
  async saveExitInterview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ExitInterviewDto,
  ) {
    return this.offboardingService.saveExitInterview(
      id,
      user.userId,
      user.companyId,
      dto,
    );
  }

  // ─── Complete Offboarding ──────────────────────────────────────────

  @Post(':id/complete')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_OFFBOARDING)
  @ApiOperation({ summary: 'Complete offboarding and deactivate employee' })
  @ApiResponse({
    status: 201,
    description: 'Offboarding completed, employee deactivated',
  })
  @ApiResponse({ status: 404, description: 'Process not found' })
  @ApiResponse({
    status: 400,
    description: 'Process already completed or cancelled',
  })
  async completeOffboarding(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.offboardingService.completeOffboarding(
      id,
      user.userId,
      user.companyId,
    );
  }
}
