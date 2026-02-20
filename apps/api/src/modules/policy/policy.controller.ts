import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, Permission } from '@hrplatform/shared';
import { PolicyService } from './policy.service';
import { CreatePolicyDto, UpdatePolicyDto } from './dto';
import type { Request } from 'express';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

@ApiTags('Policies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'policies', version: '1' })
@RequireFeature('POLICIES')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  // ──────────────────────────────────────────────────────────────
  // Policy CRUD
  // ──────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_POLICIES)
  @ApiOperation({ summary: 'Create a new policy' })
  @ApiResponse({ status: 201, description: 'Policy created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePolicyDto,
  ) {
    return this.policyService.create(user.companyId, user.userId, dto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_POLICIES, Permission.MANAGE_POLICIES)
  @ApiOperation({ summary: 'List policies with optional filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (DRAFT, PUBLISHED, ARCHIVED)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category (HR, IT, FINANCE, COMPLIANCE, SAFETY, GENERAL)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by title' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Policies retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.policyService.findAll(user.companyId, {
      status,
      category,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Static routes MUST be declared before parameterized routes
   * to prevent NestJS from matching "acknowledgments" as an :id parameter.
   */
  @Get('acknowledgments/my')
  @RequirePermissions(Permission.ACKNOWLEDGE_POLICY)
  @ApiOperation({ summary: 'Get my policy acknowledgments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'My acknowledgments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMyAcknowledgments(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Use the userId as the employeeId lookup.
    // In this system, the user's linked employeeId is used.
    // We pass userId here; the service resolves accordingly.
    return this.policyService.findMyAcknowledgments(user.userId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_POLICIES)
  @ApiOperation({ summary: 'Get a single policy by ID' })
  @ApiParam({ name: 'id', description: 'Policy UUID' })
  @ApiResponse({ status: 200, description: 'Policy retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.policyService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_POLICIES)
  @ApiOperation({ summary: 'Update a policy' })
  @ApiParam({ name: 'id', description: 'Policy UUID' })
  @ApiResponse({ status: 200, description: 'Policy updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policyService.update(id, user.companyId, user.userId, dto);
  }

  @Patch(':id/publish')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_POLICIES)
  @ApiOperation({ summary: 'Publish a policy' })
  @ApiParam({ name: 'id', description: 'Policy UUID' })
  @ApiResponse({ status: 200, description: 'Policy published successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - policy cannot be published',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async publish(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.policyService.publish(id, user.companyId, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_POLICIES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive (soft-delete) a policy' })
  @ApiParam({ name: 'id', description: 'Policy UUID' })
  @ApiResponse({ status: 204, description: 'Policy archived successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.policyService.remove(id, user.companyId, user.userId);
  }

  // ──────────────────────────────────────────────────────────────
  // Acknowledgments
  // ──────────────────────────────────────────────────────────────

  @Post(':id/acknowledge')
  @RequirePermissions(Permission.ACKNOWLEDGE_POLICY)
  @ApiOperation({ summary: 'Acknowledge a policy' })
  @ApiParam({ name: 'id', description: 'Policy UUID' })
  @ApiResponse({
    status: 201,
    description: 'Policy acknowledged successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - policy not published',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - already acknowledged',
  })
  async acknowledge(
    @CurrentUser() user: JwtPayload,
    @Param('id') policyId: string,
    @Req() req: Request,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || undefined;

    return this.policyService.acknowledge(
      policyId,
      user.companyId,
      user.userId,
      ipAddress,
    );
  }

  @Get(':id/acknowledgments')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_POLICIES, Permission.VIEW_POLICIES)
  @ApiOperation({ summary: 'List acknowledgments for a policy' })
  @ApiParam({ name: 'id', description: 'Policy UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Acknowledgments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async findAcknowledgments(
    @CurrentUser() user: JwtPayload,
    @Param('id') policyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.policyService.findAcknowledgments(
      policyId,
      user.companyId,
      {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
    );
  }

  @Get(':id/acknowledgments/status')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_POLICIES, Permission.VIEW_POLICIES)
  @ApiOperation({
    summary: 'Get acknowledgment status (who has/hasn\'t acknowledged)',
  })
  @ApiParam({ name: 'id', description: 'Policy UUID' })
  @ApiResponse({
    status: 200,
    description: 'Acknowledgment status retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async getAcknowledgmentStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') policyId: string,
  ) {
    return this.policyService.getAcknowledgmentStatus(
      policyId,
      user.companyId,
    );
  }
}
