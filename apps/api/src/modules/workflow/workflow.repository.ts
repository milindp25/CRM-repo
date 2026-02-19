import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { TemplateFilterDto, WorkflowFilterDto } from './dto';

@Injectable()
export class WorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Template Methods ──────────────────────────────────────────────────

  async createTemplate(data: Prisma.WorkflowTemplateCreateInput) {
    return this.prisma.workflowTemplate.create({ data });
  }

  async findTemplateById(id: string, companyId: string) {
    return this.prisma.workflowTemplate.findFirst({
      where: { id, companyId },
    });
  }

  async findTemplates(companyId: string, filter: TemplateFilterDto) {
    const { entityType, isActive, page = 1, limit = 20 } = filter;

    const where: Prisma.WorkflowTemplateWhereInput = {
      companyId,
      ...(entityType && { entityType }),
      ...(isActive !== undefined && { isActive }),
    };

    const [data, total] = await Promise.all([
      this.prisma.workflowTemplate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.workflowTemplate.count({ where }),
    ]);

    return { data, total };
  }

  async findTemplateByEntityType(entityType: string, companyId: string) {
    return this.prisma.workflowTemplate.findFirst({
      where: {
        companyId,
        entityType,
        isActive: true,
      },
    });
  }

  async updateTemplate(
    id: string,
    companyId: string,
    data: Prisma.WorkflowTemplateUpdateInput,
  ) {
    return this.prisma.workflowTemplate.update({
      where: { id, companyId },
      data,
    });
  }

  async deleteTemplate(id: string, companyId: string) {
    return this.prisma.workflowTemplate.update({
      where: { id, companyId },
      data: { isActive: false },
    });
  }

  // ─── Instance Methods ─────────────────────────────────────────────────

  async createInstance(
    instanceData: {
      companyId: string;
      templateId: string;
      entityType: string;
      entityId: string;
      initiatedBy: string;
      status: string;
      currentStepOrder: number;
    },
    stepsConfig: Array<{
      stepOrder: number;
      approverType: string;
      approverValue: string;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const instance = await tx.workflowInstance.create({
        data: {
          company: { connect: { id: instanceData.companyId } },
          template: { connect: { id: instanceData.templateId } },
          entityType: instanceData.entityType,
          entityId: instanceData.entityId,
          initiator: { connect: { id: instanceData.initiatedBy } },
          status: instanceData.status,
          currentStepOrder: instanceData.currentStepOrder,
        },
      });

      for (const stepConfig of stepsConfig) {
        await tx.workflowStep.create({
          data: {
            instance: { connect: { id: instance.id } },
            stepOrder: stepConfig.stepOrder,
            approverType: stepConfig.approverType,
            approverValue: stepConfig.approverValue,
            status: 'PENDING',
          },
        });
      }

      return tx.workflowInstance.findUnique({
        where: { id: instance.id },
        include: {
          steps: { orderBy: { stepOrder: 'asc' } },
          template: true,
        },
      });
    });
  }

  async findInstanceById(id: string, companyId: string) {
    return this.prisma.workflowInstance.findFirst({
      where: { id, companyId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            resolver: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        template: true,
        initiator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findInstances(companyId: string, filter: WorkflowFilterDto) {
    const {
      entityType,
      entityId,
      status,
      initiatedBy,
      page = 1,
      limit = 20,
    } = filter;

    const where: Prisma.WorkflowInstanceWhereInput = {
      companyId,
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(status && { status }),
      ...(initiatedBy && { initiatedBy }),
    };

    const [data, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          steps: { orderBy: { stepOrder: 'asc' } },
          template: { select: { id: true, name: true, entityType: true } },
          initiator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.workflowInstance.count({ where }),
    ]);

    return { data, total };
  }

  async findInstanceByEntity(
    entityType: string,
    entityId: string,
    companyId: string,
  ) {
    return this.prisma.workflowInstance.findFirst({
      where: {
        companyId,
        entityType,
        entityId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        template: true,
      },
    });
  }

  async updateInstance(id: string, data: Prisma.WorkflowInstanceUpdateInput) {
    return this.prisma.workflowInstance.update({
      where: { id },
      data,
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        template: true,
      },
    });
  }

  // ─── Step Methods ─────────────────────────────────────────────────────

  async findStepById(id: string) {
    return this.prisma.workflowStep.findUnique({
      where: { id },
      include: {
        instance: {
          include: {
            template: true,
            initiator: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async findPendingStepsForUser(
    userId: string,
    companyId: string,
    role: string,
  ) {
    // Use a more straightforward approach: find steps where the step's
    // stepOrder matches the instance's currentStepOrder
    const instances = await this.prisma.workflowInstance.findMany({
      where: {
        companyId,
        status: 'IN_PROGRESS',
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        template: { select: { id: true, name: true, entityType: true } },
        initiator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const pendingSteps: any[] = [];

    for (const instance of instances) {
      const currentStep = instance.steps.find(
        (s) =>
          s.stepOrder === instance.currentStepOrder && s.status === 'PENDING',
      );

      if (!currentStep) continue;

      const canApprove =
        (currentStep.approverType === 'USER' &&
          currentStep.approverValue === userId) ||
        (currentStep.approverType === 'ROLE' &&
          currentStep.approverValue === role) ||
        (currentStep.approverType === 'MANAGER' && role === 'MANAGER');

      if (canApprove) {
        pendingSteps.push({
          ...currentStep,
          instance: {
            id: instance.id,
            companyId: instance.companyId,
            entityType: instance.entityType,
            entityId: instance.entityId,
            status: instance.status,
            currentStepOrder: instance.currentStepOrder,
            template: instance.template,
            initiator: instance.initiator,
          },
        });
      }
    }

    return pendingSteps;
  }

  async updateStep(id: string, data: Prisma.WorkflowStepUpdateInput) {
    return this.prisma.workflowStep.update({
      where: { id },
      data,
      include: {
        instance: {
          include: {
            steps: { orderBy: { stepOrder: 'asc' } },
            template: true,
          },
        },
      },
    });
  }

  // ─── Audit Log ────────────────────────────────────────────────────────

  async createAuditLog(data: {
    userId?: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        oldValues: data.oldValues,
        newValues: data.newValues,
      },
    });
  }
}
