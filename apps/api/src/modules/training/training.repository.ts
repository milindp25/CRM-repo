import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TrainingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // Course Methods
  // ============================================================================

  async createCourse(data: Prisma.TrainingCourseCreateInput) {
    return this.prisma.trainingCourse.create({ data });
  }

  async findCourseById(id: string, companyId: string) {
    return this.prisma.trainingCourse.findFirst({
      where: {
        id,
        companyId,
        isActive: true,
      },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });
  }

  async findManyCourses(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
      search?: string;
      isMandatory?: boolean;
    },
  ) {
    const { page = 1, limit = 20, status, category, search, isMandatory } = options;

    const where: Prisma.TrainingCourseWhereInput = {
      companyId,
      isActive: true,
      ...(status && { status }),
      ...(category && { category }),
      ...(isMandatory !== undefined && { isMandatory }),
      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.trainingCourse.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { enrollments: true },
          },
        },
      }),
      this.prisma.trainingCourse.count({ where }),
    ]);

    return { data, total };
  }

  async updateCourse(
    id: string,
    companyId: string,
    data: Prisma.TrainingCourseUpdateInput,
  ) {
    return this.prisma.trainingCourse.update({
      where: { id, companyId },
      data,
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });
  }

  async softDeleteCourse(id: string, companyId: string) {
    return this.prisma.trainingCourse.update({
      where: { id, companyId },
      data: { isActive: false },
    });
  }

  // ============================================================================
  // Enrollment Methods
  // ============================================================================

  async createEnrollment(data: Prisma.TrainingEnrollmentCreateInput) {
    return this.prisma.trainingEnrollment.create({
      data,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
      },
    });
  }

  async findEnrollmentById(id: string, companyId: string) {
    return this.prisma.trainingEnrollment.findFirst({
      where: { id, companyId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
      },
    });
  }

  async findEnrollmentsByCourse(
    courseId: string,
    companyId: string,
    options: { page?: number; limit?: number; status?: string },
  ) {
    const { page = 1, limit = 20, status } = options;

    const where: Prisma.TrainingEnrollmentWhereInput = {
      courseId,
      companyId,
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.trainingEnrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              category: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.trainingEnrollment.count({ where }),
    ]);

    return { data, total };
  }

  async findEnrollmentsByEmployee(
    employeeId: string,
    companyId: string,
    options: { page?: number; limit?: number; status?: string },
  ) {
    const { page = 1, limit = 20, status } = options;

    const where: Prisma.TrainingEnrollmentWhereInput = {
      employeeId,
      companyId,
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.trainingEnrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              category: true,
              instructor: true,
              duration: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.trainingEnrollment.count({ where }),
    ]);

    return { data, total };
  }

  async findExistingEnrollment(courseId: string, employeeId: string) {
    return this.prisma.trainingEnrollment.findUnique({
      where: {
        courseId_employeeId: {
          courseId,
          employeeId,
        },
      },
    });
  }

  async countEnrollmentsByCourse(courseId: string): Promise<number> {
    return this.prisma.trainingEnrollment.count({
      where: { courseId },
    });
  }

  async updateEnrollment(
    id: string,
    companyId: string,
    data: Prisma.TrainingEnrollmentUpdateInput,
  ) {
    return this.prisma.trainingEnrollment.update({
      where: { id, companyId },
      data,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
      },
    });
  }

  // ============================================================================
  // Audit Log
  // ============================================================================

  async createAuditLog(data: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}
