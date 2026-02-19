import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecruitmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // Job Postings
  // ============================================================================

  async createJobPosting(data: Prisma.JobPostingCreateInput) {
    return this.prisma.jobPosting.create({ data });
  }

  async findJobPostingById(id: string, companyId: string) {
    return this.prisma.jobPosting.findFirst({
      where: {
        id,
        companyId,
        isActive: true,
      },
      include: {
        applicants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            stage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { applicants: true },
        },
      },
    });
  }

  async findJobPostings(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      departmentId?: string;
      search?: string;
    },
  ) {
    const { page = 1, limit = 20, status, departmentId, search } = options;

    const where: Prisma.JobPostingWhereInput = {
      companyId,
      isActive: true,
      ...(status && { status }),
      ...(departmentId && { departmentId }),
      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { applicants: true },
          },
        },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return { data, total };
  }

  async updateJobPosting(
    id: string,
    companyId: string,
    data: Prisma.JobPostingUpdateInput,
  ) {
    return this.prisma.jobPosting.update({
      where: { id, companyId },
      data,
    });
  }

  // ============================================================================
  // Applicants
  // ============================================================================

  async createApplicant(data: Prisma.ApplicantCreateInput) {
    return this.prisma.applicant.create({
      data,
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  async findApplicantById(id: string, companyId: string) {
    return this.prisma.applicant.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });
  }

  async findApplicantsByJob(
    jobPostingId: string,
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      stage?: string;
      search?: string;
    },
  ) {
    const { page = 1, limit = 20, stage, search } = options;

    const where: Prisma.ApplicantWhereInput = {
      jobPostingId,
      companyId,
      ...(stage && { stage }),
      ...(search && {
        OR: [
          {
            firstName: {
              contains: search,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.applicant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { interviews: true },
          },
        },
      }),
      this.prisma.applicant.count({ where }),
    ]);

    return { data, total };
  }

  async updateApplicant(
    id: string,
    companyId: string,
    data: Prisma.ApplicantUpdateInput,
  ) {
    return this.prisma.applicant.update({
      where: { id, companyId },
      data,
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  async deleteApplicant(id: string, companyId: string) {
    return this.prisma.applicant.delete({
      where: { id, companyId },
    });
  }

  // ============================================================================
  // Interviews
  // ============================================================================

  async createInterview(data: Prisma.InterviewCreateInput) {
    return this.prisma.interview.create({ data });
  }

  async findInterviewById(id: string, companyId: string) {
    return this.prisma.interview.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobPostingId: true,
          },
        },
      },
    });
  }

  async findInterviewsByApplicant(
    applicantId: string,
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
    },
  ) {
    const { page = 1, limit = 20, status } = options;

    const where: Prisma.InterviewWhereInput = {
      applicantId,
      companyId,
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.interview.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.interview.count({ where }),
    ]);

    return { data, total };
  }

  async updateInterview(
    id: string,
    companyId: string,
    data: Prisma.InterviewUpdateInput,
  ) {
    return this.prisma.interview.update({
      where: { id, companyId },
      data,
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // ============================================================================
  // Audit Logs
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
