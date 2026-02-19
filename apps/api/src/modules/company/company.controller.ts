import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';

interface JwtPayload { userId: string; companyId: string; role: UserRole; }

@ApiTags('Company')
@ApiBearerAuth()
@Controller({ path: 'company', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get company info' })
  async getCompany(@CurrentUser() user: JwtPayload) {
    return this.companyService.getCompany(user.companyId);
  }

  @Get('features')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get enabled features for the current company' })
  async getFeatures(@CurrentUser() user: JwtPayload) {
    return this.companyService.getEnabledFeatures(user.companyId);
  }

  @Get('subscription')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get subscription info for the current company' })
  async getSubscription(@CurrentUser() user: JwtPayload) {
    return this.companyService.getSubscription(user.companyId);
  }

  @Patch()
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update company info (COMPANY_ADMIN only)' })
  async updateCompany(@Body() body: any, @CurrentUser() user: JwtPayload) {
    return this.companyService.updateCompany(user.companyId, body);
  }

  @Get('onboarding')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get onboarding status' })
  async getOnboardingStatus(@CurrentUser() user: JwtPayload) {
    return this.companyService.getOnboardingStatus(user.companyId);
  }

  @Patch('onboarding/step')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update onboarding step' })
  async updateOnboardingStep(@Body() body: { step: number }, @CurrentUser() user: JwtPayload) {
    return this.companyService.updateOnboardingStep(user.companyId, body.step);
  }

  @Post('onboarding/complete')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Mark onboarding as complete' })
  async completeOnboarding(@CurrentUser() user: JwtPayload) {
    return this.companyService.completeOnboarding(user.companyId);
  }
}
