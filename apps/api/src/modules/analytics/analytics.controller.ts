import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';

// TS1272 workaround: define locally instead of importing from shared
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
  employeeId?: string;
}

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller({ path: 'analytics', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireFeature('ANALYTICS')
@Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ─── Overview Dashboard ───────────────────────────────────────────────────────

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview dashboard' })
  @ApiResponse({ status: 200, description: 'Overview metrics retrieved' })
  async getOverview(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getOverview(user.companyId);
  }

  // ─── Headcount ────────────────────────────────────────────────────────────────

  @Get('headcount')
  @ApiOperation({ summary: 'Get headcount analytics with department breakdown and trends' })
  @ApiResponse({ status: 200, description: 'Headcount analytics retrieved' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months for trends (default: 12)' })
  async getHeadcount(
    @CurrentUser() user: JwtPayload,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getHeadcountAnalytics(
      user.companyId,
      months ? parseInt(months, 10) : 12,
    );
  }

  // ─── Attrition ────────────────────────────────────────────────────────────────

  @Get('attrition')
  @ApiOperation({ summary: 'Get attrition analytics with monthly trend' })
  @ApiResponse({ status: 200, description: 'Attrition analytics retrieved' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months to analyze (default: 12)' })
  async getAttrition(
    @CurrentUser() user: JwtPayload,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getAttritionAnalytics(
      user.companyId,
      months ? parseInt(months, 10) : 12,
    );
  }

  // ─── Leave Utilization ────────────────────────────────────────────────────────

  @Get('leave-utilization')
  @ApiOperation({ summary: 'Get leave utilization by type and status' })
  @ApiResponse({ status: 200, description: 'Leave analytics retrieved' })
  async getLeaveUtilization(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getLeaveAnalytics(user.companyId);
  }

  // ─── Attendance ───────────────────────────────────────────────────────────────

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance analytics with absenteeism rate' })
  @ApiResponse({ status: 200, description: 'Attendance analytics retrieved' })
  @ApiQuery({ name: 'month', required: false, type: Number, description: 'Month (1-12, default: current)' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Year (default: current)' })
  async getAttendance(
    @CurrentUser() user: JwtPayload,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.analyticsService.getAttendanceAnalytics(
      user.companyId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  // ─── Payroll Costs ────────────────────────────────────────────────────────────

  @Get('payroll-costs')
  @ApiOperation({ summary: 'Get payroll cost analytics with monthly trends' })
  @ApiResponse({ status: 200, description: 'Payroll cost analytics retrieved' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months to analyze (default: 12)' })
  async getPayrollCosts(
    @CurrentUser() user: JwtPayload,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getPayrollAnalytics(
      user.companyId,
      months ? parseInt(months, 10) : 12,
    );
  }

  // ─── Diversity ────────────────────────────────────────────────────────────────

  @Get('diversity')
  @ApiOperation({ summary: 'Get diversity metrics by gender and department' })
  @ApiResponse({ status: 200, description: 'Diversity analytics retrieved' })
  async getDiversity(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getDiversityAnalytics(user.companyId);
  }

  // ─── Recruitment ──────────────────────────────────────────────────────────────

  @Get('recruitment')
  @ApiOperation({ summary: 'Get recruitment pipeline analytics' })
  @ApiResponse({ status: 200, description: 'Recruitment analytics retrieved' })
  async getRecruitment(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getRecruitmentAnalytics(user.companyId);
  }

  // ─── Training ─────────────────────────────────────────────────────────────────

  @Get('training')
  @ApiOperation({ summary: 'Get training completion and enrollment analytics' })
  @ApiResponse({ status: 200, description: 'Training analytics retrieved' })
  async getTraining(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getTrainingAnalytics(user.companyId);
  }
}
