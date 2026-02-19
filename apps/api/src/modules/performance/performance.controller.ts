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
import { PerformanceService } from './performance.service';
import {
  CreateReviewCycleDto,
  UpdateReviewCycleDto,
  CreateGoalDto,
  UpdateGoalDto,
  SubmitSelfReviewDto,
  SubmitManagerReviewDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permission, UserRole } from '@hrplatform/shared';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

/**
 * Performance Controller (HTTP Layer)
 * Single Responsibility: Handle HTTP requests/responses for performance management
 * Delegates business logic to PerformanceService
 */
@ApiTags('performance')
@Controller({
  path: 'performance',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireFeature('PERFORMANCE')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // ============================================================================
  // REVIEW CYCLES
  // ============================================================================

  @Post('review-cycles')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_PERFORMANCE)
  @ApiOperation({ summary: 'Create a new review cycle' })
  @ApiResponse({ status: 201, description: 'Review cycle created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createReviewCycle(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewCycleDto,
  ) {
    return this.performanceService.createReviewCycle(user.companyId, dto, user.userId);
  }

  @Get('review-cycles')
  @RequirePermissions(Permission.VIEW_PERFORMANCE, Permission.MANAGE_PERFORMANCE)
  @ApiOperation({ summary: 'List review cycles with optional filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (DRAFT, ACTIVE, COMPLETED, CANCELLED)' })
  @ApiQuery({ name: 'cycleType', required: false, description: 'Filter by cycle type (QUARTERLY, HALF_YEARLY, ANNUAL, CUSTOM)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or description' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Review cycles retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllReviewCycles(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('cycleType') cycleType?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.performanceService.findAllReviewCycles(user.companyId, {
      status,
      cycleType,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('review-cycles/:id')
  @RequirePermissions(Permission.VIEW_PERFORMANCE, Permission.MANAGE_PERFORMANCE)
  @ApiOperation({ summary: 'Get a review cycle by ID' })
  @ApiParam({ name: 'id', description: 'Review Cycle UUID' })
  @ApiResponse({ status: 200, description: 'Review cycle retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Review cycle not found' })
  async findReviewCycleById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.performanceService.findReviewCycleById(id, user.companyId);
  }

  @Patch('review-cycles/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_PERFORMANCE)
  @ApiOperation({ summary: 'Update a review cycle' })
  @ApiParam({ name: 'id', description: 'Review Cycle UUID' })
  @ApiResponse({ status: 200, description: 'Review cycle updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Review cycle not found' })
  async updateReviewCycle(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateReviewCycleDto,
  ) {
    return this.performanceService.updateReviewCycle(id, user.companyId, dto, user.userId);
  }

  @Patch('review-cycles/:id/activate')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_PERFORMANCE)
  @ApiOperation({ summary: 'Activate a review cycle - creates reviews for all active employees' })
  @ApiParam({ name: 'id', description: 'Review Cycle UUID' })
  @ApiResponse({ status: 200, description: 'Review cycle activated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cycle is not in DRAFT status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Review cycle not found' })
  async activateReviewCycle(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.performanceService.activateReviewCycle(id, user.companyId, user.userId);
  }

  @Patch('review-cycles/:id/complete')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_PERFORMANCE)
  @ApiOperation({ summary: 'Complete a review cycle' })
  @ApiParam({ name: 'id', description: 'Review Cycle UUID' })
  @ApiResponse({ status: 200, description: 'Review cycle completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cycle is not in ACTIVE status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Review cycle not found' })
  async completeReviewCycle(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.performanceService.completeReviewCycle(id, user.companyId, user.userId);
  }

  // ============================================================================
  // PERFORMANCE REVIEWS
  // ============================================================================

  @Get('reviews')
  @RequirePermissions(Permission.VIEW_PERFORMANCE, Permission.MANAGE_PERFORMANCE)
  @ApiOperation({ summary: 'List performance reviews with filters' })
  @ApiQuery({ name: 'cycleId', required: false, description: 'Filter by review cycle ID' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee ID' })
  @ApiQuery({ name: 'reviewerId', required: false, description: 'Filter by reviewer ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (PENDING, SELF_REVIEW, MANAGER_REVIEW, COMPLETED)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Performance reviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllReviews(
    @CurrentUser() user: JwtPayload,
    @Query('cycleId') cycleId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('reviewerId') reviewerId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.performanceService.findAllReviews(user.companyId, {
      cycleId,
      employeeId,
      reviewerId,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('reviews/my')
  @RequirePermissions(Permission.VIEW_OWN_PERFORMANCE)
  @ApiOperation({ summary: 'Get current user\'s performance reviews' })
  @ApiResponse({ status: 200, description: 'User reviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No employee record linked to user' })
  async findMyReviews(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.performanceService.findMyReviews(user.companyId, user.userId);
  }

  @Get('reviews/:id')
  @RequirePermissions(Permission.VIEW_PERFORMANCE, Permission.VIEW_OWN_PERFORMANCE)
  @ApiOperation({ summary: 'Get a performance review by ID' })
  @ApiParam({ name: 'id', description: 'Performance Review UUID' })
  @ApiResponse({ status: 200, description: 'Performance review retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Performance review not found' })
  async findReviewById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.performanceService.findReviewById(id, user.companyId);
  }

  @Patch('reviews/:id/self-review')
  @RequirePermissions(Permission.SUBMIT_SELF_REVIEW)
  @ApiOperation({ summary: 'Submit self-review for a performance review' })
  @ApiParam({ name: 'id', description: 'Performance Review UUID' })
  @ApiResponse({ status: 200, description: 'Self-review submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - review not in correct status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your review' })
  @ApiResponse({ status: 404, description: 'Performance review not found' })
  async submitSelfReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitSelfReviewDto,
  ) {
    return this.performanceService.submitSelfReview(id, user.companyId, user.userId, dto);
  }

  @Patch('reviews/:id/manager-review')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_PERFORMANCE, Permission.VIEW_PERFORMANCE)
  @ApiOperation({ summary: 'Submit manager review for a performance review' })
  @ApiParam({ name: 'id', description: 'Performance Review UUID' })
  @ApiResponse({ status: 200, description: 'Manager review submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - self-review not yet completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Performance review not found' })
  async submitManagerReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitManagerReviewDto,
  ) {
    return this.performanceService.submitManagerReview(id, user.companyId, user.userId, dto);
  }

  // ============================================================================
  // GOALS
  // ============================================================================

  @Post('goals')
  @RequirePermissions(Permission.MANAGE_PERFORMANCE, Permission.VIEW_OWN_PERFORMANCE)
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createGoal(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateGoalDto,
  ) {
    return this.performanceService.createGoal(user.companyId, user.userId, dto);
  }

  @Get('goals')
  @RequirePermissions(Permission.VIEW_PERFORMANCE, Permission.MANAGE_PERFORMANCE)
  @ApiOperation({ summary: 'List goals with filters' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee ID' })
  @ApiQuery({ name: 'reviewId', required: false, description: 'Filter by review ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category (INDIVIDUAL, TEAM, COMPANY)' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority (LOW, MEDIUM, HIGH, CRITICAL)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Goals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllGoals(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId') employeeId?: string,
    @Query('reviewId') reviewId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.performanceService.findAllGoals(user.companyId, {
      employeeId,
      reviewId,
      status,
      category,
      priority,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('goals/my')
  @RequirePermissions(Permission.VIEW_OWN_PERFORMANCE)
  @ApiOperation({ summary: 'Get current user\'s goals' })
  @ApiResponse({ status: 200, description: 'User goals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No employee record linked to user' })
  async findMyGoals(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.performanceService.findMyGoals(user.companyId, user.userId);
  }

  @Get('goals/:id')
  @RequirePermissions(Permission.VIEW_PERFORMANCE, Permission.VIEW_OWN_PERFORMANCE)
  @ApiOperation({ summary: 'Get a goal by ID' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Goal retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async findGoalById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.performanceService.findGoalById(id, user.companyId);
  }

  @Patch('goals/:id')
  @RequirePermissions(Permission.MANAGE_PERFORMANCE, Permission.VIEW_OWN_PERFORMANCE)
  @ApiOperation({ summary: 'Update a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Goal updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or goal is completed/cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async updateGoal(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.performanceService.updateGoal(id, user.companyId, dto, user.userId);
  }

  @Patch('goals/:id/progress')
  @RequirePermissions(Permission.MANAGE_PERFORMANCE, Permission.VIEW_OWN_PERFORMANCE)
  @ApiOperation({ summary: 'Update goal progress (0-100)' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Goal progress updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - progress must be 0-100' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async updateGoalProgress(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('progress') progress: number,
  ) {
    return this.performanceService.updateGoalProgress(id, user.companyId, progress, user.userId);
  }

  @Delete('goals/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_PERFORMANCE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 204, description: 'Goal deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async deleteGoal(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.performanceService.deleteGoal(id, user.companyId, user.userId);
  }
}
