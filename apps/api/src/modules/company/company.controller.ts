import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
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

  @Get('onboarding/user')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get current user onboarding status' })
  async getUserOnboardingStatus(@CurrentUser() user: JwtPayload) {
    return this.companyService.getUserOnboardingStatus(user.userId);
  }

  @Post('onboarding/user/complete')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Mark current user onboarding as complete' })
  async completeUserOnboarding(@CurrentUser() user: JwtPayload) {
    return this.companyService.completeUserOnboarding(user.userId);
  }

  @Post('logo')
  @Roles(UserRole.COMPANY_ADMIN)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload company logo' })
  async uploadLogo(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No logo file provided');
    }
    return this.companyService.uploadLogo(user.companyId, file);
  }
}
