import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import { TrainingRepository } from './training.repository';
import {
  CreateCourseDto,
  UpdateCourseDto,
  EnrollDto,
  UpdateEnrollmentDto,
  CompleteEnrollmentDto,
} from './dto';

@Injectable()
export class TrainingService {
  constructor(
    private readonly repository: TrainingRepository,
    private readonly logger: LoggerService,
  ) {}

  // ============================================================================
  // Course Methods
  // ============================================================================

  async createCourse(
    companyId: string,
    userId: string,
    dto: CreateCourseDto,
  ) {
    this.logger.log(
      `Creating training course "${dto.title}" for company ${companyId}`,
      'TrainingService',
    );

    const createData: Prisma.TrainingCourseCreateInput = {
      title: dto.title,
      description: dto.description ?? null,
      category: dto.category ?? null,
      instructor: dto.instructor ?? null,
      contentUrl: dto.contentUrl ?? null,
      duration: dto.duration ?? null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      maxEnrollments: dto.maxEnrollments ?? null,
      isMandatory: dto.isMandatory ?? false,
      status: dto.status ?? 'DRAFT',
      company: { connect: { id: companyId } },
    };

    const course = await this.repository.createCourse(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'TRAINING_COURSE',
      resourceId: course.id,
      newValues: { title: dto.title, category: dto.category, status: dto.status },
    });

    this.logger.log(
      `Training course "${dto.title}" created successfully (id: ${course.id})`,
      'TrainingService',
    );

    return this.formatCourse(course);
  }

  async findAllCourses(
    companyId: string,
    filter: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
      search?: string;
      isMandatory?: boolean;
    },
  ) {
    this.logger.log('Listing training courses', 'TrainingService');

    const { data, total } = await this.repository.findManyCourses(
      companyId,
      filter,
    );

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((course: any) => this.formatCourse(course)),
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

  async findOneCourse(id: string, companyId: string) {
    this.logger.log(`Finding training course ${id}`, 'TrainingService');

    const course = await this.repository.findCourseById(id, companyId);

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    return this.formatCourse(course);
  }

  async updateCourse(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateCourseDto,
  ) {
    this.logger.log(`Updating training course ${id}`, 'TrainingService');

    const existing = await this.repository.findCourseById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Training course not found');
    }

    const updateData: Prisma.TrainingCourseUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.instructor !== undefined && { instructor: dto.instructor }),
      ...(dto.contentUrl !== undefined && { contentUrl: dto.contentUrl }),
      ...(dto.duration !== undefined && { duration: dto.duration }),
      ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      ...(dto.maxEnrollments !== undefined && { maxEnrollments: dto.maxEnrollments }),
      ...(dto.isMandatory !== undefined && { isMandatory: dto.isMandatory }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    const updated = await this.repository.updateCourse(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'TRAINING_COURSE',
      resourceId: id,
      oldValues: {
        title: existing.title,
        category: existing.category,
        status: existing.status,
      },
      newValues: dto,
    });

    return this.formatCourse(updated);
  }

  async deleteCourse(id: string, companyId: string, userId: string) {
    this.logger.log(`Deleting training course ${id}`, 'TrainingService');

    const course = await this.repository.findCourseById(id, companyId);

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    await this.repository.softDeleteCourse(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'TRAINING_COURSE',
      resourceId: id,
      oldValues: {
        title: course.title,
        category: course.category,
        status: course.status,
      },
    });
  }

  // ============================================================================
  // Enrollment Methods
  // ============================================================================

  async enrollEmployee(
    courseId: string,
    companyId: string,
    userId: string,
    dto: EnrollDto,
  ) {
    this.logger.log(
      `Enrolling employee ${dto.employeeId} in course ${courseId}`,
      'TrainingService',
    );

    // Verify course exists and belongs to the company
    const course = await this.repository.findCourseById(courseId, companyId);

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    if (course.status === 'CANCELLED') {
      throw new BadRequestException('Cannot enroll in a cancelled course');
    }

    // Check for duplicate enrollment
    const existing = await this.repository.findExistingEnrollment(
      courseId,
      dto.employeeId,
    );

    if (existing) {
      throw new ConflictException('Employee is already enrolled in this course');
    }

    // Check max enrollments
    if (course.maxEnrollments) {
      const currentCount = await this.repository.countEnrollmentsByCourse(courseId);
      if (currentCount >= course.maxEnrollments) {
        throw new BadRequestException('Course has reached maximum enrollment capacity');
      }
    }

    const enrollData: Prisma.TrainingEnrollmentCreateInput = {
      companyId,
      employeeId: dto.employeeId,
      course: { connect: { id: courseId } },
    };

    const enrollment = await this.repository.createEnrollment(enrollData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'TRAINING_ENROLLMENT',
      resourceId: enrollment.id,
      newValues: {
        courseId,
        employeeId: dto.employeeId,
      },
    });

    return this.formatEnrollment(enrollment);
  }

  async findEnrollmentsByCourse(
    courseId: string,
    companyId: string,
    filter: { page?: number; limit?: number; status?: string },
  ) {
    this.logger.log(
      `Listing enrollments for course ${courseId}`,
      'TrainingService',
    );

    // Verify course exists
    const course = await this.repository.findCourseById(courseId, companyId);

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    const { data, total } = await this.repository.findEnrollmentsByCourse(
      courseId,
      companyId,
      filter,
    );

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((enrollment: any) => this.formatEnrollment(enrollment)),
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

  async findMyEnrollments(
    employeeId: string,
    companyId: string,
    filter: { page?: number; limit?: number; status?: string },
  ) {
    this.logger.log(
      `Listing enrollments for employee ${employeeId}`,
      'TrainingService',
    );

    const { data, total } = await this.repository.findEnrollmentsByEmployee(
      employeeId,
      companyId,
      filter,
    );

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((enrollment: any) => this.formatEnrollment(enrollment)),
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

  async updateEnrollment(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateEnrollmentDto,
  ) {
    this.logger.log(`Updating enrollment ${id}`, 'TrainingService');

    const existing = await this.repository.findEnrollmentById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Training enrollment not found');
    }

    const updateData: Prisma.TrainingEnrollmentUpdateInput = {
      ...(dto.progress !== undefined && { progress: dto.progress }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.score !== undefined && { score: dto.score }),
      ...(dto.passed !== undefined && { passed: dto.passed }),
      ...(dto.certificateUrl !== undefined && { certificateUrl: dto.certificateUrl }),
    };

    const updated = await this.repository.updateEnrollment(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'TRAINING_ENROLLMENT',
      resourceId: id,
      oldValues: {
        progress: existing.progress,
        status: existing.status,
        score: existing.score,
      },
      newValues: dto,
    });

    return this.formatEnrollment(updated);
  }

  async completeEnrollment(
    id: string,
    companyId: string,
    userId: string,
    dto: CompleteEnrollmentDto,
  ) {
    this.logger.log(`Completing enrollment ${id}`, 'TrainingService');

    const existing = await this.repository.findEnrollmentById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Training enrollment not found');
    }

    if (existing.status === 'COMPLETED') {
      throw new BadRequestException('Enrollment is already completed');
    }

    if (existing.status === 'DROPPED') {
      throw new BadRequestException('Cannot complete a dropped enrollment');
    }

    const updateData: Prisma.TrainingEnrollmentUpdateInput = {
      status: 'COMPLETED',
      progress: 100,
      completedAt: new Date(),
      ...(dto.score !== undefined && { score: dto.score }),
      ...(dto.passed !== undefined && { passed: dto.passed }),
      ...(dto.certificateUrl !== undefined && { certificateUrl: dto.certificateUrl }),
    };

    const updated = await this.repository.updateEnrollment(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'COMPLETE',
      resourceType: 'TRAINING_ENROLLMENT',
      resourceId: id,
      oldValues: {
        status: existing.status,
        progress: existing.progress,
      },
      newValues: {
        status: 'COMPLETED',
        progress: 100,
        score: dto.score,
        passed: dto.passed,
      },
    });

    return this.formatEnrollment(updated);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private formatCourse(course: any) {
    return {
      id: course.id,
      companyId: course.companyId,
      title: course.title,
      description: course.description,
      category: course.category,
      instructor: course.instructor,
      contentUrl: course.contentUrl,
      duration: course.duration,
      startDate: course.startDate,
      endDate: course.endDate,
      maxEnrollments: course.maxEnrollments,
      isMandatory: course.isMandatory,
      status: course.status,
      isActive: course.isActive,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      enrollmentCount: course._count?.enrollments ?? 0,
    };
  }

  private formatEnrollment(enrollment: any) {
    return {
      id: enrollment.id,
      companyId: enrollment.companyId,
      courseId: enrollment.courseId,
      employeeId: enrollment.employeeId,
      progress: enrollment.progress,
      completedAt: enrollment.completedAt,
      score: enrollment.score,
      passed: enrollment.passed,
      certificateUrl: enrollment.certificateUrl,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
      ...(enrollment.course && {
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          category: enrollment.course.category,
          status: enrollment.course.status,
          ...(enrollment.course.instructor !== undefined && {
            instructor: enrollment.course.instructor,
          }),
          ...(enrollment.course.duration !== undefined && {
            duration: enrollment.course.duration,
          }),
        },
      }),
    };
  }
}
