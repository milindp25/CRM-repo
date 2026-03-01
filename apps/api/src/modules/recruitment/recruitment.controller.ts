import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permission, UserRole } from '@hrplatform/shared';
import { RecruitmentService } from './recruitment.service';
import { OfferLetterService } from './pdf/offer-letter.service';
import {
  CreateJobPostingDto,
  UpdateJobPostingDto,
  CreateApplicantDto,
  UpdateApplicantDto,
  ApplicantStage,
  ScheduleInterviewDto,
  SubmitInterviewFeedbackDto,
} from './dto';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

// ─── Filter DTOs (inline for query params) ─────────────────────────────────

class JobPostingFilterDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by status (DRAFT, PUBLISHED, PAUSED, CLOSED, FILLED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by department UUID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Search by title' })
  @IsOptional()
  @IsString()
  search?: string;
}

class ApplicantFilterDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by stage' })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}

class InterviewFilterDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by status (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)' })
  @IsOptional()
  @IsString()
  status?: string;
}

class MoveStageDto {
  @ApiPropertyOptional({
    enum: ApplicantStage,
    description: 'Target stage',
  })
  @IsEnum(ApplicantStage)
  stage: ApplicantStage;

  @ApiPropertyOptional({ description: 'Notes for the stage change' })
  @IsOptional()
  @IsString()
  stageNotes?: string;
}

// ─── Controller ─────────────────────────────────────────────────────────────

@ApiTags('Recruitment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireFeature('RECRUITMENT')
@Controller({ path: 'recruitment', version: '1' })
export class RecruitmentController {
  constructor(
    private readonly recruitmentService: RecruitmentService,
    private readonly offerLetterService: OfferLetterService,
  ) {}

  // ─── Job Postings ────────────────────────────────────────────────────────

  @Post('jobs')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.CREATE_JOB_POSTINGS, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: 201, description: 'Job posting created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createJobPosting(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateJobPostingDto,
  ) {
    return this.recruitmentService.createJobPosting(
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get('jobs')
  @RequirePermissions(Permission.VIEW_RECRUITMENT, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'List job postings with filters' })
  @ApiResponse({ status: 200, description: 'Job postings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getJobPostings(
    @CurrentUser() user: JwtPayload,
    @Query() filter: JobPostingFilterDto,
  ) {
    return this.recruitmentService.getJobPostings(user.companyId, filter);
  }

  @Get('jobs/:id')
  @RequirePermissions(Permission.VIEW_RECRUITMENT, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Get a single job posting by ID' })
  @ApiParam({ name: 'id', description: 'Job posting UUID' })
  @ApiResponse({ status: 200, description: 'Job posting retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async getJobPosting(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.recruitmentService.getJobPosting(id, user.companyId);
  }

  @Patch('jobs/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Update a job posting' })
  @ApiParam({ name: 'id', description: 'Job posting UUID' })
  @ApiResponse({ status: 200, description: 'Job posting updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async updateJobPosting(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateJobPostingDto,
  ) {
    return this.recruitmentService.updateJobPosting(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Patch('jobs/:id/publish')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Publish a job posting' })
  @ApiParam({ name: 'id', description: 'Job posting UUID' })
  @ApiResponse({ status: 200, description: 'Job posting published successfully' })
  @ApiResponse({ status: 400, description: 'Cannot publish posting in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async publishJobPosting(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.recruitmentService.publishJobPosting(
      id,
      user.companyId,
      user.userId,
    );
  }

  @Patch('jobs/:id/close')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Close a job posting' })
  @ApiParam({ name: 'id', description: 'Job posting UUID' })
  @ApiResponse({ status: 200, description: 'Job posting closed successfully' })
  @ApiResponse({ status: 400, description: 'Job posting is already closed or filled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async closeJobPosting(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.recruitmentService.closeJobPosting(
      id,
      user.companyId,
      user.userId,
    );
  }

  // ─── Applicants ──────────────────────────────────────────────────────────

  @Post('jobs/:jobId/applicants')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_APPLICANTS, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Add an applicant to a job posting' })
  @ApiParam({ name: 'jobId', description: 'Job posting UUID' })
  @ApiResponse({ status: 201, description: 'Applicant added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or job not accepting applicants' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async addApplicant(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() dto: CreateApplicantDto,
  ) {
    return this.recruitmentService.addApplicant(
      jobId,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get('jobs/:jobId/applicants')
  @RequirePermissions(Permission.VIEW_RECRUITMENT, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'List applicants for a job posting' })
  @ApiParam({ name: 'jobId', description: 'Job posting UUID' })
  @ApiResponse({ status: 200, description: 'Applicants retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async getApplicantsForJob(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Query() filter: ApplicantFilterDto,
  ) {
    return this.recruitmentService.getApplicantsForJob(
      jobId,
      user.companyId,
      filter,
    );
  }

  @Get('applicants/:id')
  @RequirePermissions(Permission.VIEW_RECRUITMENT, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Get a single applicant by ID' })
  @ApiParam({ name: 'id', description: 'Applicant UUID' })
  @ApiResponse({ status: 200, description: 'Applicant retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Applicant not found' })
  async getApplicant(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.recruitmentService.getApplicant(id, user.companyId);
  }

  @Patch('applicants/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_APPLICANTS, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Update an applicant' })
  @ApiParam({ name: 'id', description: 'Applicant UUID' })
  @ApiResponse({ status: 200, description: 'Applicant updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Applicant not found' })
  async updateApplicant(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateApplicantDto,
  ) {
    return this.recruitmentService.updateApplicant(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Patch('applicants/:id/stage')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_APPLICANTS, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Move applicant to a new pipeline stage' })
  @ApiParam({ name: 'id', description: 'Applicant UUID' })
  @ApiResponse({ status: 200, description: 'Applicant stage updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Applicant not found' })
  async moveApplicantStage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: MoveStageDto,
  ) {
    return this.recruitmentService.moveApplicantStage(
      id,
      user.companyId,
      user.userId,
      dto.stage,
      dto.stageNotes,
    );
  }

  @Delete('applicants/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_APPLICANTS, Permission.MANAGE_RECRUITMENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an applicant' })
  @ApiParam({ name: 'id', description: 'Applicant UUID' })
  @ApiResponse({ status: 204, description: 'Applicant deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Applicant not found' })
  async deleteApplicant(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.recruitmentService.deleteApplicant(
      id,
      user.companyId,
      user.userId,
    );
  }

  // ─── Offer Letter PDF ──────────────────────────────────────────────────

  @Get('applicants/:id/offer-letter')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_APPLICANTS, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Generate and download offer letter PDF for an applicant' })
  @ApiParam({ name: 'id', description: 'Applicant UUID' })
  @ApiResponse({ status: 200, description: 'Offer letter PDF stream' })
  @ApiResponse({ status: 400, description: 'Applicant not in OFFER/HIRED stage' })
  @ApiResponse({ status: 404, description: 'Applicant not found' })
  async downloadOfferLetter(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.offerLetterService.generateOfferLetter(id, user.companyId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="offer_letter_${id}.pdf"`);
    return res.send(buffer);
  }

  // ─── Interviews ──────────────────────────────────────────────────────────

  @Post('applicants/:applicantId/interviews')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_APPLICANTS, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Schedule an interview for an applicant' })
  @ApiParam({ name: 'applicantId', description: 'Applicant UUID' })
  @ApiResponse({ status: 201, description: 'Interview scheduled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Applicant not found' })
  async scheduleInterview(
    @CurrentUser() user: JwtPayload,
    @Param('applicantId') applicantId: string,
    @Body() dto: ScheduleInterviewDto,
  ) {
    return this.recruitmentService.scheduleInterview(
      applicantId,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get('applicants/:applicantId/interviews')
  @RequirePermissions(Permission.VIEW_RECRUITMENT, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'List interviews for an applicant' })
  @ApiParam({ name: 'applicantId', description: 'Applicant UUID' })
  @ApiResponse({ status: 200, description: 'Interviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Applicant not found' })
  async getInterviewsForApplicant(
    @CurrentUser() user: JwtPayload,
    @Param('applicantId') applicantId: string,
    @Query() filter: InterviewFilterDto,
  ) {
    return this.recruitmentService.getInterviewsForApplicant(
      applicantId,
      user.companyId,
      filter,
    );
  }

  @Patch('interviews/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_APPLICANTS, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Update an interview' })
  @ApiParam({ name: 'id', description: 'Interview UUID' })
  @ApiResponse({ status: 200, description: 'Interview updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  async updateInterview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ScheduleInterviewDto,
  ) {
    return this.recruitmentService.updateInterview(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Patch('interviews/:id/feedback')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_APPLICANTS, Permission.MANAGE_RECRUITMENT)
  @ApiOperation({ summary: 'Submit interview feedback' })
  @ApiParam({ name: 'id', description: 'Interview UUID' })
  @ApiResponse({ status: 200, description: 'Feedback submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  async submitInterviewFeedback(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitInterviewFeedbackDto,
  ) {
    return this.recruitmentService.submitInterviewFeedback(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }
}
