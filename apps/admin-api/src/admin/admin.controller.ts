import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { UserRole } from '@hrplatform/shared';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UpdateCompanyFeaturesDto, UpdateSubscriptionDto } from './dto/index.js';

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

  // ── Company Detail ─────────────────────────────────────────────────

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get company detail with user and employee counts' })
  async getCompanyById(@Param('id') id: string) {
    return this.adminService.getCompanyById(id);
  }

  // ── Update Company ─────────────────────────────────────────────────

  @Patch('companies/:id')
  @ApiOperation({ summary: 'Update company (activate/deactivate)' })
  async updateCompany(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean },
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
}
