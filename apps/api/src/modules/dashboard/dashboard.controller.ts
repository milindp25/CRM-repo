import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';
import { UpdateDashboardConfigDto } from './dto';

// TS1272 workaround: define locally instead of importing
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
  employeeId?: string;
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller({ path: 'dashboard', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireFeature('DASHBOARD_CONFIG')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('widgets')
  @ApiOperation({ summary: 'List available widgets for the current user role' })
  @ApiResponse({ status: 200, description: 'Available widgets retrieved successfully' })
  async getAvailableWidgets(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getAvailableWidgets(user.role);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get the current user dashboard config' })
  @ApiResponse({ status: 200, description: 'Dashboard config retrieved successfully' })
  async getConfig(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getConfig(user.userId, user.role);
  }

  @Patch('config')
  @ApiOperation({ summary: 'Update the current user dashboard config' })
  @ApiResponse({ status: 200, description: 'Dashboard config updated successfully' })
  async updateConfig(
    @Body() dto: UpdateDashboardConfigDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dashboardService.updateConfig(user.userId, user.companyId, dto.layout);
  }

  @Post('config/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset dashboard config to role defaults' })
  @ApiResponse({ status: 200, description: 'Dashboard config reset to defaults' })
  async resetConfig(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.resetConfig(user.userId, user.companyId, user.role);
  }
}
