import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Performance Repository (Data Access Layer)
 * Single Responsibility: Only handles database operations for ReviewCycle, PerformanceReview, Goal models
 * All queries enforce companyId filtering for multi-tenancy
 */
@Injectable()
export class PerformanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // REVIEW CYCLES
  // ============================================================================

  /**
   * Create a review cycle
   */
  async createReviewCycle(data: Prisma.ReviewCycleCreateInput) {
    return this.prisma.reviewCycle.create({ data });
  }

  /**
   * Find many review cycles with filters and pagination
   */
  async findManyReviewCycles(
    companyId: string,
    filters: {
      status?: string;
      cycleType?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, cycleType, search, page = 1, limit = 20 } = filters;

    const where: Prisma.ReviewCycleWhereInput = {
      companyId,
      ...(status && { status }),
      ...(cycleType && { cycleType }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.reviewCycle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { reviews: true },
          },
        },
      }),
      this.prisma.reviewCycle.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find review cycle by ID with company isolation
   */
  async findReviewCycleById(id: string, companyId: string) {
    return this.prisma.reviewCycle.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });
  }

  /**
   * Update review cycle
   */
  async updateReviewCycle(id: string, companyId: string, data: Prisma.ReviewCycleUpdateInput) {
    return this.prisma.reviewCycle.update({
      where: { id, companyId },
      data,
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });
  }

  // ============================================================================
  // PERFORMANCE REVIEWS
  // ============================================================================

  /**
   * Find many performance reviews with filters
   */
  async findManyReviews(
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
    const { cycleId, employeeId, reviewerId, status, page = 1, limit = 20 } = filters;

    const where: Prisma.PerformanceReviewWhereInput = {
      companyId,
      ...(cycleId && { cycleId }),
      ...(employeeId && { employeeId }),
      ...(reviewerId && { reviewerId }),
      ...(status && { status }),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.performanceReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cycle: {
            select: {
              id: true,
              name: true,
              cycleType: true,
              status: true,
            },
          },
          goals: true,
        },
      }),
      this.prisma.performanceReview.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find performance review by ID with company isolation
   */
  async findReviewById(id: string, companyId: string) {
    return this.prisma.performanceReview.findFirst({
      where: { id, companyId },
      include: {
        cycle: {
          select: {
            id: true,
            name: true,
            cycleType: true,
            status: true,
            ratingScale: true,
          },
        },
        goals: true,
      },
    });
  }

  /**
   * Find reviews for a specific employee (their own reviews)
   */
  async findReviewsByEmployee(companyId: string, employeeId: string) {
    return this.prisma.performanceReview.findMany({
      where: { companyId, employeeId },
      orderBy: { createdAt: 'desc' },
      include: {
        cycle: {
          select: {
            id: true,
            name: true,
            cycleType: true,
            status: true,
          },
        },
        goals: true,
      },
    });
  }

  /**
   * Update a performance review
   */
  async updateReview(id: string, companyId: string, data: Prisma.PerformanceReviewUpdateInput) {
    return this.prisma.performanceReview.update({
      where: { id, companyId },
      data,
      include: {
        cycle: {
          select: {
            id: true,
            name: true,
            cycleType: true,
            status: true,
          },
        },
        goals: true,
      },
    });
  }

  /**
   * Create performance reviews in bulk (when activating a cycle)
   */
  async createManyReviews(data: Prisma.PerformanceReviewCreateManyInput[]) {
    return this.prisma.performanceReview.createMany({ data });
  }

  // ============================================================================
  // GOALS
  // ============================================================================

  /**
   * Create a goal
   */
  async createGoal(data: Prisma.GoalCreateInput) {
    return this.prisma.goal.create({
      data,
      include: {
        review: {
          select: {
            id: true,
            cycleId: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Find many goals with filters
   */
  async findManyGoals(
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
    const { employeeId, reviewId, status, category, priority, page = 1, limit = 20 } = filters;

    const where: Prisma.GoalWhereInput = {
      companyId,
      ...(employeeId && { employeeId }),
      ...(reviewId && { reviewId }),
      ...(status && { status }),
      ...(category && { category }),
      ...(priority && { priority }),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.goal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          review: {
            select: {
              id: true,
              cycleId: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.goal.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find goal by ID with company isolation
   */
  async findGoalById(id: string, companyId: string) {
    return this.prisma.goal.findFirst({
      where: { id, companyId },
      include: {
        review: {
          select: {
            id: true,
            cycleId: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Find goals for a specific employee
   */
  async findGoalsByEmployee(companyId: string, employeeId: string) {
    return this.prisma.goal.findMany({
      where: { companyId, employeeId },
      orderBy: { createdAt: 'desc' },
      include: {
        review: {
          select: {
            id: true,
            cycleId: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Update a goal
   */
  async updateGoal(id: string, companyId: string, data: Prisma.GoalUpdateInput) {
    return this.prisma.goal.update({
      where: { id, companyId },
      data,
      include: {
        review: {
          select: {
            id: true,
            cycleId: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Delete a goal
   */
  async deleteGoal(id: string, companyId: string) {
    return this.prisma.goal.delete({
      where: { id, companyId },
    });
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get active employees for a company (used when activating a review cycle)
   */
  async getActiveEmployees(companyId: string) {
    return this.prisma.employee.findMany({
      where: {
        companyId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        reportingManagerId: true,
      },
    });
  }

  /**
   * Get employee by user ID (for mapping current user to employee)
   */
  async getEmployeeByUserId(companyId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
      },
      select: {
        employeeId: true,
      },
    });
    return user?.employeeId ?? null;
  }

  /**
   * Create audit log
   */
  async createAuditLog(data: {
    userId: string;
    userEmail: string;
    action: string;
    resourceType: string;
    resourceId: string;
    companyId: string;
    success: boolean;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}
