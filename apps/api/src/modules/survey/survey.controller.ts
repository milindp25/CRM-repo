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
import { Permission, UserRole } from '@hrplatform/shared';
import { SurveyService } from './survey.service';
import { CreateSurveyDto, SubmitResponseDto } from './dto';

// TS1272 workaround: define JwtPayload locally
interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

@ApiTags('Surveys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'surveys', version: '1' })
@RequireFeature('SURVEYS')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  // ─── Survey CRUD ────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_SURVEYS)
  @ApiOperation({ summary: 'Create a new survey' })
  @ApiResponse({ status: 201, description: 'Survey created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSurveyDto,
  ) {
    return this.surveyService.createSurvey(user.companyId, user.userId, dto);
  }

  @Get()
  @RequirePermissions(Permission.MANAGE_SURVEYS, Permission.RESPOND_SURVEY)
  @ApiOperation({ summary: 'List surveys with optional filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (DRAFT, ACTIVE, CLOSED, ARCHIVED)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Surveys retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.surveyService.getSurveys(user.companyId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.MANAGE_SURVEYS, Permission.RESPOND_SURVEY)
  @ApiOperation({ summary: 'Get a survey by ID' })
  @ApiParam({ name: 'id', description: 'Survey UUID' })
  @ApiResponse({ status: 200, description: 'Survey retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.surveyService.getSurvey(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_SURVEYS)
  @ApiOperation({ summary: 'Update a survey (DRAFT only)' })
  @ApiParam({ name: 'id', description: 'Survey UUID' })
  @ApiResponse({ status: 200, description: 'Survey updated successfully' })
  @ApiResponse({ status: 400, description: 'Only DRAFT surveys can be updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: Partial<CreateSurveyDto>,
  ) {
    return this.surveyService.updateSurvey(id, user.companyId, user.userId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_SURVEYS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a survey' })
  @ApiParam({ name: 'id', description: 'Survey UUID' })
  @ApiResponse({ status: 204, description: 'Survey deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete an active survey' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.surveyService.deleteSurvey(id, user.companyId, user.userId);
  }

  // ─── Survey Lifecycle ───────────────────────────────────────────────

  @Post(':id/activate')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_SURVEYS)
  @ApiOperation({ summary: 'Activate a survey (DRAFT -> ACTIVE)' })
  @ApiParam({ name: 'id', description: 'Survey UUID' })
  @ApiResponse({ status: 201, description: 'Survey activated successfully' })
  @ApiResponse({ status: 400, description: 'Only DRAFT surveys can be activated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async activate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.surveyService.activateSurvey(id, user.companyId, user.userId);
  }

  @Post(':id/close')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_SURVEYS)
  @ApiOperation({ summary: 'Close a survey (ACTIVE -> CLOSED)' })
  @ApiParam({ name: 'id', description: 'Survey UUID' })
  @ApiResponse({ status: 201, description: 'Survey closed successfully' })
  @ApiResponse({ status: 400, description: 'Only ACTIVE surveys can be closed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async close(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.surveyService.closeSurvey(id, user.companyId, user.userId);
  }

  // ─── Survey Responses ───────────────────────────────────────────────

  @Post(':id/responses')
  @RequirePermissions(Permission.RESPOND_SURVEY)
  @ApiOperation({ summary: 'Submit a response to a survey' })
  @ApiParam({ name: 'id', description: 'Survey UUID' })
  @ApiResponse({ status: 201, description: 'Response submitted successfully' })
  @ApiResponse({ status: 400, description: 'Survey is not active' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  @ApiResponse({ status: 409, description: 'Already submitted a response' })
  async submitResponse(
    @CurrentUser() user: JwtPayload,
    @Param('id') surveyId: string,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.surveyService.submitResponse(
      surveyId,
      user.userId,
      dto.answers,
      user.companyId,
    );
  }

  // ─── Analytics ──────────────────────────────────────────────────────

  @Get(':id/analytics')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.VIEW_SURVEY_RESULTS, Permission.MANAGE_SURVEYS)
  @ApiOperation({ summary: 'Get survey analytics and aggregated results' })
  @ApiParam({ name: 'id', description: 'Survey UUID' })
  @ApiResponse({ status: 200, description: 'Survey analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async getAnalytics(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.surveyService.getAnalytics(id, user.companyId);
  }
}
