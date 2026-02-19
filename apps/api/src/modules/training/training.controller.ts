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
import { Permission, UserRole } from '@hrplatform/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TrainingService } from './training.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  EnrollDto,
  UpdateEnrollmentDto,
  CompleteEnrollmentDto,
} from './dto';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

@ApiTags('Training')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'training', version: '1' })
@RequireFeature('TRAINING')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  // ============================================================================
  // Course Endpoints
  // ============================================================================

  @Post('courses')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_TRAINING)
  @ApiOperation({ summary: 'Create a new training course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createCourse(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCourseDto,
  ) {
    return this.trainingService.createCourse(user.companyId, user.userId, dto);
  }

  @Get('courses')
  @RequirePermissions(Permission.VIEW_TRAINING, Permission.MANAGE_TRAINING)
  @ApiOperation({ summary: 'List all training courses with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isMandatory', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllCourses(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('isMandatory') isMandatory?: boolean,
  ) {
    return this.trainingService.findAllCourses(user.companyId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      category,
      search,
      isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : undefined,
    });
  }

  @Get('courses/:id')
  @RequirePermissions(Permission.VIEW_TRAINING, Permission.MANAGE_TRAINING)
  @ApiOperation({ summary: 'Get a single training course by ID' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findOneCourse(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.trainingService.findOneCourse(id, user.companyId);
  }

  @Patch('courses/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_TRAINING)
  @ApiOperation({ summary: 'Update a training course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async updateCourse(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.trainingService.updateCourse(id, user.companyId, user.userId, dto);
  }

  @Delete('courses/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_TRAINING)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a training course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 204, description: 'Course deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async deleteCourse(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.trainingService.deleteCourse(id, user.companyId, user.userId);
  }

  // ============================================================================
  // Enrollment Endpoints
  // ============================================================================

  /**
   * Static path routes MUST be declared before parameterized routes
   * to prevent NestJS from matching "enrollments" as a :courseId parameter.
   */

  @Get('enrollments/my')
  @RequirePermissions(Permission.VIEW_TRAINING, Permission.ENROLL_TRAINING)
  @ApiOperation({ summary: 'Get current user enrollments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Enrollments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMyEnrollments(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.trainingService.findMyEnrollments(user.userId, user.companyId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Patch('enrollments/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_TRAINING)
  @ApiOperation({ summary: 'Update enrollment progress/status' })
  @ApiParam({ name: 'id', description: 'Enrollment UUID' })
  @ApiResponse({ status: 200, description: 'Enrollment updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async updateEnrollment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.trainingService.updateEnrollment(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Patch('enrollments/:id/complete')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.MANAGE_TRAINING)
  @ApiOperation({ summary: 'Mark enrollment as complete with optional score' })
  @ApiParam({ name: 'id', description: 'Enrollment UUID' })
  @ApiResponse({ status: 200, description: 'Enrollment completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - already completed or dropped' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async completeEnrollment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CompleteEnrollmentDto,
  ) {
    return this.trainingService.completeEnrollment(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Post('courses/:courseId/enroll')
  @RequirePermissions(Permission.MANAGE_TRAINING, Permission.ENROLL_TRAINING)
  @ApiOperation({ summary: 'Enroll an employee in a course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({ status: 201, description: 'Employee enrolled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - course cancelled or at capacity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 409, description: 'Conflict - already enrolled' })
  async enrollEmployee(
    @CurrentUser() user: JwtPayload,
    @Param('courseId') courseId: string,
    @Body() dto: EnrollDto,
  ) {
    return this.trainingService.enrollEmployee(
      courseId,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get('courses/:courseId/enrollments')
  @RequirePermissions(Permission.VIEW_TRAINING, Permission.MANAGE_TRAINING)
  @ApiOperation({ summary: 'List enrollments for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Enrollments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findEnrollmentsByCourse(
    @CurrentUser() user: JwtPayload,
    @Param('courseId') courseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.trainingService.findEnrollmentsByCourse(
      courseId,
      user.companyId,
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status,
      },
    );
  }
}
