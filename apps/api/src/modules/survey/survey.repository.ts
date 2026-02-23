import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface SurveyFilterParams {
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SurveyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Survey CRUD ────────────────────────────────────────────────────

  async createSurvey(data: Prisma.SurveyCreateInput) {
    return this.prisma.survey.create({
      data,
      include: {
        _count: { select: { responses: true } },
      },
    });
  }

  async findSurveys(companyId: string, filter: SurveyFilterParams) {
    const { status, page = 1, limit = 20 } = filter;

    const where: Prisma.SurveyWhereInput = {
      companyId,
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.survey.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.survey.count({ where }),
    ]);

    return { data, total };
  }

  async findSurveyById(id: string, companyId: string) {
    return this.prisma.survey.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        _count: { select: { responses: true } },
      },
    });
  }

  async updateSurvey(id: string, companyId: string, data: Prisma.SurveyUpdateInput) {
    return this.prisma.survey.update({
      where: {
        id,
        companyId,
      },
      data,
      include: {
        _count: { select: { responses: true } },
      },
    });
  }

  async deleteSurvey(id: string, companyId: string) {
    return this.prisma.survey.delete({
      where: {
        id,
        companyId,
      },
    });
  }

  // ─── Survey Responses ───────────────────────────────────────────────

  async createResponse(surveyId: string, respondentId: string, answers: any) {
    return this.prisma.surveyResponse.create({
      data: {
        survey: { connect: { id: surveyId } },
        respondent: { connect: { id: respondentId } },
        answers: answers as any,
      },
    });
  }

  async findResponseBySurveyAndUser(surveyId: string, respondentId: string) {
    return this.prisma.surveyResponse.findUnique({
      where: {
        surveyId_respondentId: {
          surveyId,
          respondentId,
        },
      },
    });
  }

  async findResponsesBySurvey(surveyId: string) {
    return this.prisma.surveyResponse.findMany({
      where: { surveyId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async countResponses(surveyId: string) {
    return this.prisma.surveyResponse.count({
      where: { surveyId },
    });
  }

  // ─── Audit Log ──────────────────────────────────────────────────────

  async createAuditLog(data: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }
}
