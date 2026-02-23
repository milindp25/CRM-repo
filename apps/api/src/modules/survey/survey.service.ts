import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import { SurveyRepository, SurveyFilterParams } from './survey.repository';
import { CreateSurveyDto } from './dto';

@Injectable()
export class SurveyService {
  constructor(
    private readonly repository: SurveyRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  // ─── Survey CRUD ────────────────────────────────────────────────────

  async createSurvey(companyId: string, userId: string, dto: CreateSurveyDto) {
    this.logger.log(`Creating survey "${dto.title}" for company ${companyId}`);

    const createData: Prisma.SurveyCreateInput = {
      title: dto.title,
      type: dto.type,
      status: 'DRAFT',
      questions: dto.questions as any,
      isAnonymous: dto.isAnonymous ?? true,
      ...(dto.description && { description: dto.description }),
      ...(dto.targetAudience && { targetAudience: dto.targetAudience as any }),
      company: { connect: { id: companyId } },
      creator: { connect: { id: userId } },
    };

    const survey = await this.repository.createSurvey(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'SURVEY',
      resourceId: survey.id,
      newValues: {
        title: dto.title,
        type: dto.type,
        isAnonymous: dto.isAnonymous ?? true,
        questionCount: dto.questions.length,
      },
    });

    return survey;
  }

  async getSurveys(companyId: string, filter: SurveyFilterParams) {
    this.logger.log('Finding all surveys');

    const { data, total } = await this.repository.findSurveys(companyId, filter);

    const page = filter.page || 1;
    const limit = filter.limit || 20;
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

  async getSurvey(id: string, companyId: string) {
    this.logger.log(`Finding survey ${id}`);

    const survey = await this.repository.findSurveyById(id, companyId);

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    return survey;
  }

  async updateSurvey(
    id: string,
    companyId: string,
    userId: string,
    dto: Partial<CreateSurveyDto>,
  ) {
    this.logger.log(`Updating survey ${id}`);

    const existing = await this.repository.findSurveyById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Survey not found');
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT surveys can be updated');
    }

    const updateData: Prisma.SurveyUpdateInput = {
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.type && { type: dto.type }),
      ...(dto.isAnonymous !== undefined && { isAnonymous: dto.isAnonymous }),
      ...(dto.questions && { questions: dto.questions as any }),
      ...(dto.targetAudience !== undefined && { targetAudience: dto.targetAudience as any }),
    };

    const updated = await this.repository.updateSurvey(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'SURVEY',
      resourceId: id,
      newValues: dto,
    });

    return updated;
  }

  async deleteSurvey(id: string, companyId: string, userId: string) {
    this.logger.log(`Deleting survey ${id}`);

    const existing = await this.repository.findSurveyById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Survey not found');
    }

    if (existing.status === 'ACTIVE') {
      throw new BadRequestException('Cannot delete an active survey. Close it first.');
    }

    await this.repository.deleteSurvey(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'SURVEY',
      resourceId: id,
      oldValues: { title: existing.title, status: existing.status },
    });
  }

  // ─── Survey Lifecycle ───────────────────────────────────────────────

  async activateSurvey(id: string, companyId: string, userId: string) {
    this.logger.log(`Activating survey ${id}`);

    const existing = await this.repository.findSurveyById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Survey not found');
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT surveys can be activated');
    }

    const questions = existing.questions as any[];
    if (!questions || questions.length === 0) {
      throw new BadRequestException('Survey must have at least one question before activation');
    }

    const updated = await this.repository.updateSurvey(id, companyId, {
      status: 'ACTIVE',
      startDate: new Date(),
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'ACTIVATE',
      resourceType: 'SURVEY',
      resourceId: id,
      newValues: { status: 'ACTIVE', startDate: new Date() },
    });

    this.eventEmitter.emit('survey.activated', {
      surveyId: id,
      companyId,
      userId,
      title: existing.title,
      type: existing.type,
      targetAudience: existing.targetAudience,
    });

    return updated;
  }

  async closeSurvey(id: string, companyId: string, userId: string) {
    this.logger.log(`Closing survey ${id}`);

    const existing = await this.repository.findSurveyById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Survey not found');
    }

    if (existing.status !== 'ACTIVE') {
      throw new BadRequestException('Only ACTIVE surveys can be closed');
    }

    const updated = await this.repository.updateSurvey(id, companyId, {
      status: 'CLOSED',
      endDate: new Date(),
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CLOSE',
      resourceType: 'SURVEY',
      resourceId: id,
      newValues: { status: 'CLOSED', endDate: new Date() },
    });

    return updated;
  }

  // ─── Survey Responses ───────────────────────────────────────────────

  async submitResponse(
    surveyId: string,
    respondentId: string,
    answers: any[],
    companyId: string,
  ) {
    this.logger.log(`Submitting response for survey ${surveyId} by user ${respondentId}`);

    const survey = await this.repository.findSurveyById(surveyId, companyId);

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    if (survey.status !== 'ACTIVE') {
      throw new BadRequestException('Survey is not currently active');
    }

    // Check if user already responded (unique constraint)
    const existingResponse = await this.repository.findResponseBySurveyAndUser(
      surveyId,
      respondentId,
    );

    if (existingResponse) {
      throw new ConflictException('You have already submitted a response to this survey');
    }

    const response = await this.repository.createResponse(surveyId, respondentId, answers);

    this.eventEmitter.emit('survey.response.submitted', {
      surveyId,
      companyId,
      respondentId,
      surveyTitle: survey.title,
      isAnonymous: survey.isAnonymous,
    });

    return response;
  }

  // ─── Analytics ──────────────────────────────────────────────────────

  async getAnalytics(surveyId: string, companyId: string) {
    this.logger.log(`Generating analytics for survey ${surveyId}`);

    const survey = await this.repository.findSurveyById(surveyId, companyId);

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    const responses = await this.repository.findResponsesBySurvey(surveyId);
    const totalResponses = responses.length;
    const questions = survey.questions as any[];

    const questionAnalytics = questions.map((question: any) => {
      const answersForQuestion = responses
        .map((r) => {
          const answersArr = r.answers as any[];
          return answersArr.find((a: any) => a.questionId === question.id);
        })
        .filter(Boolean);

      const answeredCount = answersForQuestion.length;

      switch (question.type) {
        case 'RATING': {
          const values = answersForQuestion
            .map((a: any) => Number(a.value))
            .filter((v: number) => !isNaN(v));
          const avg =
            values.length > 0
              ? values.reduce((sum: number, v: number) => sum + v, 0) / values.length
              : 0;
          return {
            questionId: question.id,
            questionText: question.text,
            type: question.type,
            answeredCount,
            averageScore: Math.round(avg * 100) / 100,
          };
        }

        case 'NPS': {
          const npsValues = answersForQuestion
            .map((a: any) => Number(a.value))
            .filter((v: number) => !isNaN(v));
          const promoters = npsValues.filter((v: number) => v >= 9).length;
          const detractors = npsValues.filter((v: number) => v <= 6).length;
          const total = npsValues.length;
          const npsScore =
            total > 0
              ? Math.round(((promoters - detractors) / total) * 100)
              : 0;
          return {
            questionId: question.id,
            questionText: question.text,
            type: question.type,
            answeredCount,
            npsScore,
            promoters,
            passives: total - promoters - detractors,
            detractors,
          };
        }

        case 'MULTIPLE_CHOICE': {
          const optionCounts: Record<string, number> = {};
          if (question.options) {
            for (const opt of question.options) {
              optionCounts[opt] = 0;
            }
          }
          for (const a of answersForQuestion) {
            const val = String((a as any).value);
            optionCounts[val] = (optionCounts[val] || 0) + 1;
          }
          return {
            questionId: question.id,
            questionText: question.text,
            type: question.type,
            answeredCount,
            optionCounts,
          };
        }

        case 'TEXT':
        default: {
          return {
            questionId: question.id,
            questionText: question.text,
            type: question.type,
            answeredCount,
          };
        }
      }
    });

    return {
      surveyId: survey.id,
      surveyTitle: survey.title,
      surveyType: survey.type,
      status: survey.status,
      totalResponses,
      questionAnalytics,
    };
  }
}
