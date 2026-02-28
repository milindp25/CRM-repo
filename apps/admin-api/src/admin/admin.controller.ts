import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { UserRole } from '@hrplatform/shared';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateCompanyDto, UpdateCompanyFeaturesDto, UpdateSubscriptionDto } from './dto/index.js';

interface JwtPayload { userId: string; email: string; companyId: string; role: string; }

@ApiTags('Admin')
@ApiBearerAuth()
@Controller({ path: 'admin', version: '1' })
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ──────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get platform dashboard metrics' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── List Companies ─────────────────────────────────────────────────

  @Get('companies')
  @ApiOperation({ summary: 'List all companies with search and pagination' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'tier', required: false, type: String })
  async getCompanies(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('tier') tier?: string,
  ) {
    return this.adminService.getCompanies({
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      tier,
    });
  }

  // ── Create Company ────────────────────────────────────────────────

  @Post('companies')
  @ApiOperation({ summary: 'Create a new company with initial admin user' })
  async createCompany(@Body() dto: CreateCompanyDto) {
    return this.adminService.createCompany(dto);
  }

  // ── Company Detail ─────────────────────────────────────────────────

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get company detail with user and employee counts' })
  async getCompanyById(@Param('id') id: string) {
    return this.adminService.getCompanyById(id);
  }

  // ── Update Company ─────────────────────────────────────────────────

  @Patch('companies/:id')
  @ApiOperation({ summary: 'Update company details (name, email, phone, website, status)' })
  async updateCompany(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; companyName?: string; email?: string; phone?: string; website?: string },
  ) {
    return this.adminService.updateCompany(id, body);
  }

  // ── Update Company Features ────────────────────────────────────────

  @Patch('companies/:id/features')
  @ApiOperation({ summary: 'Update company features' })
  async updateCompanyFeatures(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyFeaturesDto,
  ) {
    return this.adminService.updateCompanyFeatures(id, dto.features);
  }

  // ── Update Company Subscription ────────────────────────────────────

  @Patch('companies/:id/subscription')
  @ApiOperation({ summary: 'Update company subscription' })
  async updateCompanySubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.adminService.updateCompanySubscription(id, dto);
  }

  // ── Company Users ──────────────────────────────────────────────────

  @Get('companies/:id/users')
  @ApiOperation({ summary: 'List users in a company' })
  async getCompanyUsers(@Param('id') id: string) {
    return this.adminService.getCompanyUsers(id);
  }

  @Delete('companies/:companyId/users/:userId')
  @ApiOperation({ summary: 'Delete a user from a company (SUPER_ADMIN only, audited)' })
  async deleteCompanyUser(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminService.deleteCompanyUser(companyId, userId, admin.userId);
  }

  // ── Company Designations (Org Structure) ────────────────────────────

  @Get('companies/:id/designations')
  @ApiOperation({ summary: 'List designations in a company' })
  async getCompanyDesignations(@Param('id') id: string) {
    return this.adminService.getCompanyDesignations(id);
  }

  @Post('companies/:id/designations')
  @ApiOperation({ summary: 'Create a designation for a company' })
  async createCompanyDesignation(
    @Param('id') id: string,
    @Body() body: {
      title: string;
      code: string;
      level?: number;
      description?: string;
      minSalary?: number;
      maxSalary?: number;
      currency?: string;
    },
  ) {
    return this.adminService.createCompanyDesignation(id, body);
  }

  @Patch('companies/:companyId/designations/:designationId')
  @ApiOperation({ summary: 'Update a designation in a company' })
  async updateCompanyDesignation(
    @Param('companyId') companyId: string,
    @Param('designationId') designationId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateCompanyDesignation(companyId, designationId, body);
  }

  @Delete('companies/:companyId/designations/:designationId')
  @ApiOperation({ summary: 'Delete a designation from a company' })
  async deleteCompanyDesignation(
    @Param('companyId') companyId: string,
    @Param('designationId') designationId: string,
  ) {
    return this.adminService.deleteCompanyDesignation(companyId, designationId);
    }
}
