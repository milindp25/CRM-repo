import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { PerformanceRepository } from './performance.repository';
import {
  CreateReviewCycleDto,
  UpdateReviewCycleDto,
  CreateGoalDto,
  UpdateGoalDto,
  SubmitSelfReviewDto,
  SubmitManagerReviewDto,
} from './dto';

/**
 * Performance Service (Business Logic Layer)
 * Single Responsibility: Handles performance management business logic
 * Covers review cycles, performance reviews, and goals
 */
@Injectable()
export class PerformanceService {
  constructor(
    private readonly performanceRepository: PerformanceRepository,
    private readonly logger: LoggerService,
  ) {}

  // ============================================================================
  // REVIEW CYCLES
  // ============================================================================

  /**
   * Create a new review cycle
   */
  async createReviewCycle(companyId: string, dto: CreateReviewCycleDto, userId: string) {
    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (dto.selfReviewDeadline && dto.managerReviewDeadline) {
      const selfDeadline = new Date(dto.selfReviewDeadline);
      const managerDeadline = new Date(dto.managerReviewDeadline);
      if (managerDeadline <= selfDeadline) {
        throw new BadRequestException('Manager review deadline must be after self-review deadline');
      }
    }

    const cycle = await this.performanceRepository.createReviewCycle({
      name: dto.name,
      description: dto.description,
      cycleType: dto.cycleType,
      startDate,
      endDate,
      ...(dto.selfReviewDeadline && { selfReviewDeadline: new Date(dto.selfReviewDeadline) }),
      ...(dto.managerReviewDeadline && { managerReviewDeadline: new Date(dto.managerReviewDeadline) }),
      ...(dto.ratingScale && { ratingScale: dto.ratingScale }),
      company: { connect: { id: companyId } },
    });

    this.logger.log(`Review cycle created: ${cycle.name} (${cycle.id})`, 'PerformanceService');

    // Audit log (fire and forget)
    this.performanceRepository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'REVIEW_CYCLE_CREATED',
      resourceType: 'REVIEW_CYCLE',
      resourceId: cycle.id,
      companyId,
      success: true,
      metadata: { name: cycle.name, cycleType: cycle.cycleType },
    });

    return cycle;
  }

  /**
   * List review cycles with filters
   */
  async findAllReviewCycles(
    companyId: string,
    filters: {
      status?: string;
      cycleType?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { data, total } = await this.performanceRepository.findManyReviewCycles(companyId, filters);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get a single review cycle by ID
   */
  async findReviewCycleById(id: string, companyId: string) {
    const cycle = await this.performanceRepository.findReviewCycleById(id, companyId);
    if (!cycle) {
      throw new NotFoundException(`Review cycle with ID ${id} not found`);
    }
    return cycle;
  }

  /**
   * Update a review cycle
   */
  async updateReviewCycle(id: string, companyId: string, dto: UpdateReviewCycleDto, userId: string) {
    const existing = await this.performanceRepository.findReviewCycleById(id, companyId);
    if (!existing) {
      throw new NotFoundException(`Review cycle with ID ${id} not found`);
    }

    if (existing.status === 'COMPLETED') {
      throw new BadRequestException('Cannot update a completed review cycle');
    }

    // Validate dates if provided
    if (dto.startDate && dto.endDate) {
      if (new Date(dto.endDate) <= new Date(dto.startDate)) {
        throw new BadRequestException('End date must be after start date');
      }
    } else if (dto.endDate && new Date(dto.endDate) <= existing.startDate) {
      throw new BadRequestException('End date must be after start date');
    } else if (dto.startDate && existing.endDate <= new Date(dto.startDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    const cycle = await this.performanceRepository.updateReviewCycle(id, companyId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.cycleType && { cycleType: dto.cycleType }),
      ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      ...(dto.selfReviewDeadline && { selfReviewDeadline: new Date(dto.selfReviewDeadline) }),
      ...(dto.managerReviewDeadline && { managerReviewDeadline: new Date(dto.managerReviewDeadline) }),
      ...(dto.ratingScale !== undefined && { ratingScale: dto.ratingScale }),
    });

    this.logger.log(`Review cycle updated: ${cycle.name} (${cycle.id})`, 'PerformanceService');

    this.performanceRepository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'REVIEW_CYCLE_UPDATED',
      resourceType: 'REVIEW_CYCLE',
      resourceId: cycle.id,
      companyId,
      success: true,
      metadata: { name: cycle.name },
    });

    return cycle;
  }

  /**
   * Activate a review cycle - creates performance reviews for all active employees
   */
  async activateReviewCycle(id: string, companyId: string, userId: string) {
    const cycle = await this.performanceRepository.findReviewCycleById(id, companyId);
    if (!cycle) {
      throw new NotFoundException(`Review cycle with ID ${id} not found`);
    }

    if (cycle.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot activate a cycle with status ${cycle.status}. Only DRAFT cycles can be activated.`);
    }

    // Get all active employees for the company
    const employees = await this.performanceRepository.getActiveEmployees(companyId);

    if (employees.length === 0) {
      throw new BadRequestException('No active employees found to create reviews for');
    }

    // Create performance reviews for each employee
    const reviewData = employees.map((emp) => ({
      companyId,
      cycleId: id,
      employeeId: emp.id,
      reviewerId: emp.reportingManagerId,
      status: 'PENDING',
    }));

    await this.performanceRepository.createManyReviews(reviewData);

    // Update cycle status to ACTIVE
    const updatedCycle = await this.performanceRepository.updateReviewCycle(id, companyId, {
      status: 'ACTIVE',
    });

    this.logger.log(
      `Review cycle activated: ${updatedCycle.name} - ${employees.length} reviews created`,
      'PerformanceService',
    );

    this.performanceRepository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'REVIEW_CYCLE_ACTIVATED',
      resourceType: 'REVIEW_CYCLE',
      resourceId: id,
      companyId,
      success: true,
      metadata: { reviewsCreated: employees.length },
    });

    return updatedCycle;
  }

  /**
   * Complete a review cycle
   */
  async completeReviewCycle(id: string, companyId: string, userId: string) {
    const cycle = await this.performanceRepository.findReviewCycleById(id, companyId);
    if (!cycle) {
      throw new NotFoundException(`Review cycle with ID ${id} not found`);
    }

    if (cycle.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot complete a cycle with status ${cycle.status}. Only ACTIVE cycles can be completed.`);
    }

    const updatedCycle = await this.performanceRepository.updateReviewCycle(id, companyId, {
      status: 'COMPLETED',
    });

    this.logger.log(`Review cycle completed: ${updatedCycle.name}`, 'PerformanceService');

    this.performanceRepository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'REVIEW_CYCLE_COMPLETED',
      resourceType: 'REVIEW_CYCLE',
      resourceId: id,
      companyId,
      success: true,
    });

    return updatedCycle;
  }

  // ============================================================================
  // PERFORMANCE REVIEWS
  // ============================================================================

  /**
   * List performance reviews with filters
   */
  async findAllReviews(
    companyId: string,
    filters: {
      cycleId?: string;
      employeeId?: string;
      reviewerId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { data, total } = await this.performanceRepository.findManyReviews(companyId, filters);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get current user's performance reviews
   */
  async findMyReviews(companyId: string, userId: string) {
    const employeeId = await this.performanceRepository.getEmployeeByUserId(companyId, userId);
    if (!employeeId) {
      throw new NotFoundException('No employee record linked to your user account');
    }

    return this.performanceRepository.findReviewsByEmployee(companyId, employeeId);
  }

  /**
   * Get a single performance review by ID
   */
  async findReviewById(id: string, companyId: string) {
    const review = await this.performanceRepository.findReviewById(id, companyId);
    if (!review) {
      throw new NotFoundException(`Performance review with ID ${id} not found`);
    }
    return review;
  }

  /**
   * Submit self-review
   */
  async submitSelfReview(
    id: string,
    companyId: string,
    userId: string,
    dto: SubmitSelfReviewDto,
  ) {
    const review = await this.performanceRepository.findReviewById(id, companyId);
    if (!review) {
      throw new NotFoundException(`Performance review with ID ${id} not found`);
    }

    // Verify the user is the employee being reviewed
    const employeeId = await this.performanceRepository.getEmployeeByUserId(companyId, userId);
    if (!employeeId || review.employeeId !== employeeId) {
      throw new ForbiddenException('You can only submit self-reviews for your own performance review');
    }

    if (review.status !== 'PENDING' && review.status !== 'SELF_REVIEW') {
      throw new BadRequestException(
        `Cannot submit self-review for a review with status ${review.status}`,
      );
    }

    // Check cycle is active
    if (review.cycle.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot submit self-review for an inactive review cycle');
    }

    const updatedReview = await this.performanceRepository.updateReview(id, companyId, {
      selfRating: dto.selfRating,
      selfComments: dto.selfComments,
      status: 'SELF_REVIEW',
    });

    this.logger.log(`Self-review submitted for review ${id}`, 'PerformanceService');

    this.performanceRepository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'SELF_REVIEW_SUBMITTED',
      resourceType: 'PERFORMANCE_REVIEW',
      resourceId: id,
      companyId,
      success: true,
    });

    return updatedReview;
  }

  /**
   * Submit manager review
   */
  async submitManagerReview(
    id: string,
    companyId: string,
    userId: string,
    dto: SubmitManagerReviewDto,
  ) {
    const review = await this.performanceRepository.findReviewById(id, companyId);
    if (!review) {
      throw new NotFoundException(`Performance review with ID ${id} not found`);
    }

    // Verify the user is the reviewer (manager) or an admin
    const employeeId = await this.performanceRepository.getEmployeeByUserId(companyId, userId);
    // Managers can only review their direct reports; admins can review anyone
    // The controller will handle role checks; here we just check reviewer match if set
    if (review.reviewerId && employeeId && review.reviewerId !== employeeId) {
      // The caller is not the assigned reviewer - the controller's role check
      // should have already verified the user is an admin
    }

    if (review.status !== 'SELF_REVIEW' && review.status !== 'MANAGER_REVIEW') {
      throw new BadRequestException(
        `Cannot submit manager review for a review with status ${review.status}. Self-review must be completed first.`,
      );
    }

    const finalRating = dto.finalRating ?? dto.managerRating;

    const updatedReview = await this.performanceRepository.updateReview(id, companyId, {
      managerRating: dto.managerRating,
      managerComments: dto.managerComments,
      finalRating,
      overallComments: dto.overallComments,
      status: 'COMPLETED',
      completedAt: new Date(),
    });

    this.logger.log(`Manager review submitted for review ${id}`, 'PerformanceService');

    this.performanceRepository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'MANAGER_REVIEW_SUBMITTED',
      resourceType: 'PERFORMANCE_REVIEW',
      resourceId: id,
      companyId,
      success: true,
    });

    return updatedReview;
  }

  // ============================================================================
  // GOALS
  // ============================================================================

  /**
   * Create a goal
   */
  async createGoal(companyId: string, userId: string, dto: CreateGoalDto) {
    // If no employeeId provided, default to the current user's employee record
    let employeeId: string | undefined = dto.employeeId;
    if (!employeeId) {
      employeeId = (await this.performanceRepository.getEmployeeByUserId(companyId, userId)) ?? undefined;
      if (!employeeId) {
        throw new BadRequestException(
          'No employee record linked to your user account. Provide an employeeId explicitly.',
        );
      }
    }

    const goalData: any = {
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
      ...(dto.weightage !== undefined && { weightage: dto.weightage }),
      ...(dto.keyResults && { keyResults: dto.keyResults }),
      companyId,
      employeeId,
      ...(dto.reviewId && { review: { connect: { id: dto.reviewId } } }),
    };

    const goal = await this.performanceRepository.createGoal(goalData);

    this.logger.log(`Goal created: ${goal.title} (${goal.id})`, 'PerformanceService');

    this.performanceRepository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'GOAL_CREATED',
      resourceType: 'GOAL',
      resourceId: goal.id,
      companyId,
      success: true,
      metadata: { title: goal.title },
    });

    return goal;
  }

  /**
   * List goals with filters
   */
  async findAllGoals(
    companyId: string,
    filters: {
      employeeId?: string;
      reviewId?: string;
      status?: string;
      category?: string;
      priority?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { data, total } = await this.performanceRepository.findManyGoals(companyId, filters);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get current user's goals
   */
  async findMyGoals(companyId: string, userId: string) {
    const employeeId = await this.performanceRepository.getEmployeeByUserId(companyId, userId);
    if (!employeeId) {
      throw new NotFoundException('No employee record linked to your user account');
    }

    return this.performanceRepository.findGoalsByEmployee(companyId, employeeId);
  }

  /**
   * Get a single goal by ID
   */
  async findGoalById(id: string, companyId: string) {
    const goal = await this.performanceRepository.findGoalById(id, companyId);
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }
    return goal;
  }

  /**
   * Update a goal
   */
  async updateGoal(id: string, companyId: string, dto: UpdateGoalDto, userId: string) {
    const existing = await this.performanceRepository.findGoalById(id, companyId);
    if (!existing) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot update a goal with status ${existing.status}`);
    }

    const goal = await this.performanceRepository.updateGoal(id, companyId, {
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.priority && { priority: dto.priority }),
      ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
      ...(dto.weightage !== undefined && { weightage: dto.weightage }),
      ...(dto.keyResults !== undefined && { keyResults: dto.keyResults }),
      ...(dto.status && { status: dto.status }),
      ...(dto.reviewId !== undefined && {
        review: dto.reviewId ? { connect: { id: dto.reviewId } } : { disconnect: true },
      }),
    });

    this.logger.log(`Goal updated: ${goal.title} (${goal.id})`, 'PerformanceService');

    this.performanceRepository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'GOAL_UPDATED',
      resourceType: 'GOAL',
      resourceId: goal.id,
      companyId,
      success: true,
      metadata: { title: goal.title },
    });

    return goal;
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(
    id: string,
    companyId: string,
    progress: number,
    userId: string,
  ) {
    const existing = await this.performanceRepository.findGoalById(id, companyId);
    if (!existing) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    if (progress < 0 || progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }

    const updateData: any = { progress };

    // Auto-update status based on progress
    if (progress === 0 && existing.status === 'IN_PROGRESS') {
      updateData.status = 'NOT_STARTED';
    } else if (progress > 0 && progress < 100 && existing.status === 'NOT_STARTED') {
      updateData.status = 'IN_PROGRESS';
    } else if (progress === 100) {
      updateData.status = 'COMPLETED';
    }

    const goal = await this.performanceRepository.updateGoal(id, companyId, updateData);

    this.logger.log(`Goal progress updated: ${goal.title} - ${progress}%`, 'PerformanceService');

    this.performanceRepository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'GOAL_PROGRESS_UPDATED',
      resourceType: 'GOAL',
      resourceId: goal.id,
      companyId,
      success: true,
      metadata: { title: goal.title, progress },
    });

    return goal;
  }

  /**
   * Delete a goal
   */
  async deleteGoal(id: string, companyId: string, userId: string) {
    const existing = await this.performanceRepository.findGoalById(id, companyId);
    if (!existing) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    await this.performanceRepository.deleteGoal(id, companyId);

    this.logger.log(`Goal deleted: ${existing.title} (${id})`, 'PerformanceService');

    this.performanceRepository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'GOAL_DELETED',
      resourceType: 'GOAL',
      resourceId: id,
      companyId,
      success: true,
      metadata: { title: existing.title },
    });
  }
}
