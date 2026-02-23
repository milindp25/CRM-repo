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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permission, UserRole } from '@hrplatform/shared';
import { LeavePolicyService } from './leave-policy.service';
import { CreatePolicyDto, UpdatePolicyDto, AdjustBalanceDto } from './dto';

// TS1272 workaround: define JwtPayload locally instead of importing
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
  permissions: string[];
}

@ApiTags('Leave Policies & Balances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'leave-policies', version: '1' })
@RequireFeature('LEAVE_POLICIES')
export class LeavePolicyController {
  constructor(private readonly leavePolicyService: LeavePolicyService) {}

  // ─── Policy CRUD ─────────────────────────────────────────────────────

  @Get()
  @RequirePermissions(Permission.MANAGE_LEAVE_POLICIES, Permission.VIEW_LEAVE_BALANCES)
  @ApiOperation({ summary: 'List all leave policies for the company' })
  @ApiResponse({ status: 200, description: 'Leave policies retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPolicies(@CurrentUser() user: JwtPayload) {
    return this.leavePolicyService.getPolicies(user.companyId);
  }

  @Post()
  @RequirePermissions(Permission.MANAGE_LEAVE_POLICIES)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new leave policy' })
  @ApiResponse({ status: 201, description: 'Leave policy created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Policy for this leave type already exists' })
  async createPolicy(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePolicyDto,
  ) {
    return this.leavePolicyService.createPolicy(user.companyId, user.userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.MANAGE_LEAVE_POLICIES)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update a leave policy' })
  @ApiResponse({ status: 200, description: 'Leave policy updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Leave policy not found' })
  async updatePolicy(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.leavePolicyService.updatePolicy(id, user.companyId, user.userId, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_LEAVE_POLICIES)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Delete a leave policy' })
  @ApiResponse({ status: 200, description: 'Leave policy deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Leave policy not found' })
  async deletePolicy(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.leavePolicyService.deletePolicy(id, user.companyId, user.userId);
  }

  // ─── Balance Operations ──────────────────────────────────────────────

  @Get('balances/:employeeId')
  @RequirePermissions(Permission.VIEW_LEAVE_BALANCES, Permission.MANAGE_LEAVE_POLICIES)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get leave balances for an employee (admin view)' })
  @ApiQuery({
    name: 'fiscalYear',
    required: false,
    description: 'Filter by fiscal year (defaults to current year)',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Leave balances retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getBalances(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Query('fiscalYear') fiscalYear?: string,
  ) {
    const fy = fiscalYear ? parseInt(fiscalYear, 10) : undefined;
    return this.leavePolicyService.getBalances(user.companyId, employeeId, fy);
  }

  @Get('my/balances')
  @ApiOperation({ summary: 'Get my own leave balances (current fiscal year)' })
  @ApiResponse({ status: 200, description: 'Leave balances retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No employee record linked to this user' })
  async getMyBalances(@CurrentUser() user: JwtPayload) {
    return this.leavePolicyService.getMyBalances(user.companyId, user.userId);
  }

  @Post('balances/adjust')
  @RequirePermissions(Permission.MANAGE_LEAVE_POLICIES)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Manually adjust an employee leave balance' })
  @ApiResponse({ status: 201, description: 'Balance adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async adjustBalance(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AdjustBalanceDto,
  ) {
    return this.leavePolicyService.adjustBalance(user.companyId, user.userId, dto);
  }

  @Post('balances/accrue')
  @RequirePermissions(Permission.MANAGE_LEAVE_POLICIES)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Trigger monthly accrual for all employees (admin action)' })
  @ApiResponse({ status: 201, description: 'Monthly accrual completed successfully' })
  @ApiResponse({ status: 400, description: 'No accrual policies found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async runMonthlyAccrual(@CurrentUser() user: JwtPayload) {
    return this.leavePolicyService.runMonthlyAccrual(user.companyId, user.userId);
  }

  @Post('balances/grant')
  @RequirePermissions(Permission.MANAGE_LEAVE_POLICIES)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Grant annual entitlements to all employees based on policies' })
  @ApiResponse({ status: 201, description: 'Annual entitlements granted successfully' })
  @ApiResponse({ status: 400, description: 'No active policies or employees found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async grantAnnualEntitlements(@CurrentUser() user: JwtPayload) {
    return this.leavePolicyService.grantAnnualEntitlements(user.companyId, user.userId);
  }
}
