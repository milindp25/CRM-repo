import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import { RecruitmentRepository } from './recruitment.repository';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantDto, ApplicantStage } from './dto/update-applicant.dto';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { SubmitInterviewFeedbackDto } from './dto/submit-interview-feedback.dto';

@Injectable()
export class RecruitmentService {
  constructor(
    private readonly repository: RecruitmentRepository,
    private readonly logger: LoggerService,
  ) {}

  // ============================================================================
  // Job Postings
  // ============================================================================

  async createJobPosting(
    companyId: string,
    userId: string,
    dto: CreateJobPostingDto,
  ) {
    this.logger.log(
      `Creating job posting "${dto.title}" for company ${companyId}`,
      'RecruitmentService',
    );

    const createData: Prisma.JobPostingCreateInput = {
      title: dto.title,
      description: dto.description,
      requirements: dto.requirements ?? null,
      location: dto.location ?? null,
      jobType: dto.jobType ?? 'FULL_TIME',
      experience: dto.experience ?? null,
      salaryMin: dto.salaryMin ?? null,
      salaryMax: dto.salaryMax ?? null,
      currency: dto.currency ?? 'INR',
      showSalary: dto.showSalary ?? false,
      departmentId: dto.departmentId ?? null,
      designationId: dto.designationId ?? null,
      hiringManagerId: dto.hiringManagerId ?? null,
      openings: dto.openings ?? 1,
      closingDate: dto.closingDate ? new Date(dto.closingDate) : null,
      status: 'DRAFT',
      company: { connect: { id: companyId } },
    };

    const jobPosting = await this.repository.createJobPosting(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'JOB_POSTING',
      resourceId: jobPosting.id,
      newValues: { title: dto.title, jobType: dto.jobType },
    });

    this.logger.log(
      `Job posting "${dto.title}" created (id: ${jobPosting.id})`,
      'RecruitmentService',
    );

    return jobPosting;
  }

  async getJobPostings(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      departmentId?: string;
      search?: string;
    },
  ) {
    this.logger.log('Listing job postings', 'RecruitmentService');

    const { data, total } = await this.repository.findJobPostings(
      companyId,
      options,
    );

    const page = options.page || 1;
    const limit = options.limit || 20;
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

  async getJobPosting(id: string, companyId: string) {
    this.logger.log(`Getting job posting ${id}`, 'RecruitmentService');

    const jobPosting = await this.repository.findJobPostingById(id, companyId);

    if (!jobPosting) {
      throw new NotFoundException('Job posting not found');
    }

    return jobPosting;
  }

  async updateJobPosting(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateJobPostingDto,
  ) {
    this.logger.log(`Updating job posting ${id}`, 'RecruitmentService');

    const existing = await this.repository.findJobPostingById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Job posting not found');
    }

    const updateData: Prisma.JobPostingUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.requirements !== undefined && { requirements: dto.requirements }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.jobType !== undefined && { jobType: dto.jobType }),
      ...(dto.experience !== undefined && { experience: dto.experience }),
      ...(dto.salaryMin !== undefined && { salaryMin: dto.salaryMin }),
      ...(dto.salaryMax !== undefined && { salaryMax: dto.salaryMax }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.showSalary !== undefined && { showSalary: dto.showSalary }),
      ...(dto.departmentId !== undefined && {
        departmentId: dto.departmentId,
      }),
      ...(dto.designationId !== undefined && {
        designationId: dto.designationId,
      }),
      ...(dto.hiringManagerId !== undefined && {
        hiringManagerId: dto.hiringManagerId,
      }),
      ...(dto.openings !== undefined && { openings: dto.openings }),
      ...(dto.closingDate !== undefined && {
        closingDate: new Date(dto.closingDate),
      }),
    };

    const updated = await this.repository.updateJobPosting(
      id,
      companyId,
      updateData,
    );

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'JOB_POSTING',
      resourceId: id,
      oldValues: { title: existing.title, status: existing.status },
      newValues: dto,
    });

    return updated;
  }

  async publishJobPosting(id: string, companyId: string, userId: string) {
    this.logger.log(`Publishing job posting ${id}`, 'RecruitmentService');

    const existing = await this.repository.findJobPostingById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Job posting not found');
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'PAUSED') {
      throw new BadRequestException(
        `Cannot publish a job posting with status "${existing.status}"`,
      );
    }

    const updated = await this.repository.updateJobPosting(id, companyId, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'JOB_POSTING',
      resourceId: id,
      oldValues: { status: existing.status },
      newValues: { status: 'PUBLISHED' },
    });

    return updated;
  }

  async closeJobPosting(id: string, companyId: string, userId: string) {
    this.logger.log(`Closing job posting ${id}`, 'RecruitmentService');

    const existing = await this.repository.findJobPostingById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Job posting not found');
    }

    if (existing.status === 'CLOSED' || existing.status === 'FILLED') {
      throw new BadRequestException(
        `Job posting is already "${existing.status}"`,
      );
    }

    const updated = await this.repository.updateJobPosting(id, companyId, {
      status: 'CLOSED',
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'JOB_POSTING',
      resourceId: id,
      oldValues: { status: existing.status },
      newValues: { status: 'CLOSED' },
    });

    return updated;
  }

  // ============================================================================
  // Applicants
  // ============================================================================

  async addApplicant(
    jobPostingId: string,
    companyId: string,
    userId: string,
    dto: CreateApplicantDto,
  ) {
    this.logger.log(
      `Adding applicant to job ${jobPostingId}`,
      'RecruitmentService',
    );

    // Verify job posting exists and belongs to this company
    const jobPosting = await this.repository.findJobPostingById(
      jobPostingId,
      companyId,
    );

    if (!jobPosting) {
      throw new NotFoundException('Job posting not found');
    }

    if (
      jobPosting.status !== 'PUBLISHED' &&
      jobPosting.status !== 'DRAFT'
    ) {
      throw new BadRequestException(
        `Cannot add applicants to a job posting with status "${jobPosting.status}"`,
      );
    }

    const createData: Prisma.ApplicantCreateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone ?? null,
      resumePath: dto.resumePath ?? null,
      coverLetter: dto.coverLetter ?? null,
      source: dto.source ?? null,
      rating: dto.rating ?? null,
      stage: 'APPLIED',
      company: { connect: { id: companyId } },
      jobPosting: { connect: { id: jobPostingId } },
    };

    const applicant = await this.repository.createApplicant(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'APPLICANT',
      resourceId: applicant.id,
      newValues: {
        name: `${dto.firstName} ${dto.lastName}`,
        email: dto.email,
        jobPostingId,
      },
    });

    this.logger.log(
      `Applicant ${dto.firstName} ${dto.lastName} added (id: ${applicant.id})`,
      'RecruitmentService',
    );

    return applicant;
  }

  async getApplicantsForJob(
    jobPostingId: string,
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      stage?: string;
      search?: string;
    },
  ) {
    this.logger.log(
      `Listing applicants for job ${jobPostingId}`,
      'RecruitmentService',
    );

    // Verify job posting exists
    const jobPosting = await this.repository.findJobPostingById(
      jobPostingId,
      companyId,
    );

    if (!jobPosting) {
      throw new NotFoundException('Job posting not found');
    }

    const { data, total } = await this.repository.findApplicantsByJob(
      jobPostingId,
      companyId,
      options,
    );

    const page = options.page || 1;
    const limit = options.limit || 20;
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

  async getApplicant(id: string, companyId: string) {
    this.logger.log(`Getting applicant ${id}`, 'RecruitmentService');

    const applicant = await this.repository.findApplicantById(id, companyId);

    if (!applicant) {
      throw new NotFoundException('Applicant not found');
    }

    return applicant;
  }

  async updateApplicant(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateApplicantDto,
  ) {
    this.logger.log(`Updating applicant ${id}`, 'RecruitmentService');

    const existing = await this.repository.findApplicantById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Applicant not found');
    }

    const updateData: Prisma.ApplicantUpdateInput = {
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.resumePath !== undefined && { resumePath: dto.resumePath }),
      ...(dto.coverLetter !== undefined && { coverLetter: dto.coverLetter }),
      ...(dto.source !== undefined && { source: dto.source }),
      ...(dto.rating !== undefined && { rating: dto.rating }),
      ...(dto.stageNotes !== undefined && { stageNotes: dto.stageNotes }),
      ...(dto.offerSalary !== undefined && { offerSalary: dto.offerSalary }),
      ...(dto.offerDate !== undefined && {
        offerDate: new Date(dto.offerDate),
      }),
      ...(dto.joinDate !== undefined && {
        joinDate: new Date(dto.joinDate),
      }),
    };

    const updated = await this.repository.updateApplicant(
      id,
      companyId,
      updateData,
    );

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'APPLICANT',
      resourceId: id,
      oldValues: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        stage: existing.stage,
      },
      newValues: dto,
    });

    return updated;
  }

  async moveApplicantStage(
    id: string,
    companyId: string,
    userId: string,
    stage: ApplicantStage,
    stageNotes?: string,
  ) {
    this.logger.log(
      `Moving applicant ${id} to stage ${stage}`,
      'RecruitmentService',
    );

    const existing = await this.repository.findApplicantById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Applicant not found');
    }

    const updateData: Prisma.ApplicantUpdateInput = {
      stage,
      ...(stageNotes !== undefined && { stageNotes }),
    };

    const updated = await this.repository.updateApplicant(
      id,
      companyId,
      updateData,
    );

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'APPLICANT',
      resourceId: id,
      oldValues: { stage: existing.stage },
      newValues: { stage, stageNotes },
    });

    return updated;
  }

  async deleteApplicant(id: string, companyId: string, userId: string) {
    this.logger.log(`Deleting applicant ${id}`, 'RecruitmentService');

    const existing = await this.repository.findApplicantById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Applicant not found');
    }

    await this.repository.deleteApplicant(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'APPLICANT',
      resourceId: id,
      oldValues: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email,
        stage: existing.stage,
        jobPostingId: existing.jobPostingId,
      },
    });
  }

  // ============================================================================
  // Interviews
  // ============================================================================

  async scheduleInterview(
    applicantId: string,
    companyId: string,
    userId: string,
    dto: ScheduleInterviewDto,
  ) {
    this.logger.log(
      `Scheduling interview for applicant ${applicantId}`,
      'RecruitmentService',
    );

    // Verify applicant exists and belongs to this company
    const applicant = await this.repository.findApplicantById(
      applicantId,
      companyId,
    );

    if (!applicant) {
      throw new NotFoundException('Applicant not found');
    }

    const createData: Prisma.InterviewCreateInput = {
      scheduledAt: new Date(dto.scheduledAt),
      duration: dto.duration ?? 60,
      location: dto.location ?? null,
      interviewType: dto.interviewType ?? 'IN_PERSON',
      round: dto.round ?? 1,
      interviewerId: dto.interviewerId ?? null,
      companyId,
      status: 'SCHEDULED',
      applicant: { connect: { id: applicantId } },
    };

    const interview = await this.repository.createInterview(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'INTERVIEW',
      resourceId: interview.id,
      newValues: {
        applicantId,
        scheduledAt: dto.scheduledAt,
        interviewType: dto.interviewType,
        round: dto.round,
      },
    });

    this.logger.log(
      `Interview scheduled (id: ${interview.id}) for applicant ${applicantId}`,
      'RecruitmentService',
    );

    return interview;
  }

  async getInterviewsForApplicant(
    applicantId: string,
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
    },
  ) {
    this.logger.log(
      `Listing interviews for applicant ${applicantId}`,
      'RecruitmentService',
    );

    // Verify applicant exists
    const applicant = await this.repository.findApplicantById(
      applicantId,
      companyId,
    );

    if (!applicant) {
      throw new NotFoundException('Applicant not found');
    }

    const { data, total } = await this.repository.findInterviewsByApplicant(
      applicantId,
      companyId,
      options,
    );

    const page = options.page || 1;
    const limit = options.limit || 20;
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

  async updateInterview(
    id: string,
    companyId: string,
    userId: string,
    data: {
      scheduledAt?: string;
      duration?: number;
      location?: string;
      interviewType?: string;
      round?: number;
      interviewerId?: string;
      status?: string;
    },
  ) {
    this.logger.log(`Updating interview ${id}`, 'RecruitmentService');

    const existing = await this.repository.findInterviewById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Interview not found');
    }

    const updateData: Prisma.InterviewUpdateInput = {
      ...(data.scheduledAt !== undefined && {
        scheduledAt: new Date(data.scheduledAt),
      }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.interviewType !== undefined && {
        interviewType: data.interviewType,
      }),
      ...(data.round !== undefined && { round: data.round }),
      ...(data.interviewerId !== undefined && {
        interviewerId: data.interviewerId,
      }),
      ...(data.status !== undefined && { status: data.status }),
    };

    const updated = await this.repository.updateInterview(
      id,
      companyId,
      updateData,
    );

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'INTERVIEW',
      resourceId: id,
      oldValues: {
        scheduledAt: existing.scheduledAt,
        status: existing.status,
      },
      newValues: data,
    });

    return updated;
  }

  async submitInterviewFeedback(
    id: string,
    companyId: string,
    userId: string,
    dto: SubmitInterviewFeedbackDto,
  ) {
    this.logger.log(
      `Submitting feedback for interview ${id}`,
      'RecruitmentService',
    );

    const existing = await this.repository.findInterviewById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Interview not found');
    }

    const updateData: Prisma.InterviewUpdateInput = {
      feedback: dto.feedback,
      status: 'COMPLETED',
      ...(dto.rating !== undefined && { rating: dto.rating }),
      ...(dto.recommendation !== undefined && {
        recommendation: dto.recommendation,
      }),
    };

    const updated = await this.repository.updateInterview(
      id,
      companyId,
      updateData,
    );

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'INTERVIEW',
      resourceId: id,
      oldValues: { status: existing.status },
      newValues: {
        status: 'COMPLETED',
        feedback: dto.feedback,
        rating: dto.rating,
        recommendation: dto.recommendation,
      },
    });

    return updated;
  }
}
