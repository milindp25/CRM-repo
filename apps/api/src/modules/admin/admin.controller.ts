import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';
import { UpdateCompanyFeaturesDto, UpdateSubscriptionDto } from './dto';

interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
}

@ApiTags('Admin')
@ApiBearerAuth()
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ──────────────────────────────────────────────────────

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get platform dashboard metrics (SUPER_ADMIN only)' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── List Companies ─────────────────────────────────────────────────

  @Get('companies')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all companies with search and pagination (SUPER_ADMIN only)' })
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
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get company detail with user and employee counts (SUPER_ADMIN only)' })
  async getCompanyById(@Param('id') id: string) {
    return this.adminService.getCompanyById(id);
  }

  // ── Update Company (activate/deactivate) ───────────────────────────

  @Patch('companies/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update company (activate/deactivate) (SUPER_ADMIN only)' })
  async updateCompany(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean },
  ) {
    return this.adminService.updateCompany(id, body);
  }

  // ── Update Company Features ────────────────────────────────────────

  @Patch('companies/:id/features')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update company features (SUPER_ADMIN only)' })
  async updateCompanyFeatures(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyFeaturesDto,
  ) {
    return this.adminService.updateCompanyFeatures(id, dto.features);
  }

  // ── Update Company Subscription ────────────────────────────────────

  @Patch('companies/:id/subscription')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update company subscription (SUPER_ADMIN only)' })
  async updateCompanySubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.adminService.updateCompanySubscription(id, dto);
  }

  // ── Company Users ──────────────────────────────────────────────────

  @Get('companies/:id/users')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List users in a company (SUPER_ADMIN only)' })
  async getCompanyUsers(@Param('id') id: string) {
    return this.adminService.getCompanyUsers(id);
  }
}
