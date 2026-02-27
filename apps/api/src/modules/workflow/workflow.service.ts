import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggerService } from '../../common/services/logger.service';
import { WorkflowRepository } from './workflow.repository';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFilterDto,
  StartWorkflowDto,
  ResolveStepDto,
  WorkflowFilterDto,
} from './dto';
import {
  WorkflowStatus,
  WorkflowStepStatus,
  WorkflowApproverType,
} from '@hrplatform/shared';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly repository: WorkflowRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  // ─── Template Management ──────────────────────────────────────────────

  async createTemplate(
    companyId: string,
    userId: string,
    dto: CreateTemplateDto,
  ) {
    this.logger.log(
      `Creating workflow template "${dto.name}" for entity type ${dto.entityType}`,
      'WorkflowService',
    );

    // Validate steps: ensure orders are sequential starting from 1
    this.validateStepsConfig(dto.steps);

    const template = await this.repository.createTemplate({
      company: { connect: { id: companyId } },
      name: dto.name,
      description: dto.description ?? null,
      entityType: dto.entityType,
      steps: dto.steps as any,
      isActive: true,
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'WORKFLOW_TEMPLATE',
      resourceId: template.id,
      newValues: { name: dto.name, entityType: dto.entityType },
    });

    this.logger.log(
      `Workflow template created: ${template.id}`,
      'WorkflowService',
    );

    return template;
  }

  async getTemplates(companyId: string, filter: TemplateFilterDto) {
    this.logger.log('Listing workflow templates', 'WorkflowService');

    const { data, total } = await this.repository.findTemplates(
      companyId,
      filter,
    );

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

  async getTemplate(id: string, companyId: string) {
    this.logger.log(`Finding workflow template ${id}`, 'WorkflowService');

    const template = await this.repository.findTemplateById(id, companyId);

    if (!template) {
      throw new NotFoundException('Workflow template not found');
    }

    return template;
  }

  async updateTemplate(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateTemplateDto,
  ) {
    this.logger.log(`Updating workflow template ${id}`, 'WorkflowService');

    const existing = await this.repository.findTemplateById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Workflow template not found');
    }

    if (dto.steps) {
      this.validateStepsConfig(dto.steps);
    }

    const updateData: any = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.entityType !== undefined && { entityType: dto.entityType }),
      ...(dto.steps !== undefined && { steps: dto.steps as any }),
    };

    const updated = await this.repository.updateTemplate(
      id,
      companyId,
      updateData,
    );

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'WORKFLOW_TEMPLATE',
      resourceId: id,
      oldValues: { name: existing.name, entityType: existing.entityType },
      newValues: dto,
    });

    return updated;
  }

  async deleteTemplate(id: string, companyId: string, userId: string) {
    this.logger.log(`Deactivating workflow template ${id}`, 'WorkflowService');

    const existing = await this.repository.findTemplateById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Workflow template not found');
    }

    await this.repository.deleteTemplate(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'WORKFLOW_TEMPLATE',
      resourceId: id,
      oldValues: { name: existing.name, entityType: existing.entityType },
    });
  }

  // ─── Workflow Execution (State Machine) ───────────────────────────────

  /**
   * Start a workflow for a given entity.
   * Returns the workflow instance if a template is configured, or null if
   * no active workflow template exists for this entity type.
   */
  async startWorkflow(
    companyId: string,
    userId: string,
    entityType: string,
    entityId: string,
  ) {
    this.logger.log(
      `Starting workflow for ${entityType}/${entityId}`,
      'WorkflowService',
    );

    // Check if there is already an active workflow for this entity
    const existingInstance = await this.repository.findInstanceByEntity(
      entityType,
      entityId,
      companyId,
    );

    if (existingInstance) {
      throw new BadRequestException(
        'An active workflow already exists for this entity',
      );
    }

    // Find active template for this entity type
    const template = await this.repository.findTemplateByEntityType(
      entityType,
      companyId,
    );

    if (!template) {
      this.logger.log(
        `No active workflow template found for ${entityType}, skipping workflow`,
        'WorkflowService',
      );
      return null;
    }

    // Parse steps from template
    const templateSteps = template.steps as Array<{
      order: number;
      approverType: string;
      approverValue: string;
      required?: boolean;
    }>;

    if (!templateSteps || templateSteps.length === 0) {
      throw new BadRequestException(
        'Workflow template has no steps configured',
      );
    }

    // Sort steps by order
    const sortedSteps = [...templateSteps].sort((a, b) => a.order - b.order);

    // Create instance with steps in a transaction
    const instance = await this.repository.createInstance(
      {
        companyId,
        templateId: template.id,
        entityType,
        entityId,
        initiatedBy: userId,
        status: WorkflowStatus.IN_PROGRESS,
        currentStepOrder: sortedSteps[0].order,
      },
      sortedSteps.map((step) => ({
        stepOrder: step.order,
        approverType: step.approverType,
        approverValue: step.approverValue,
      })),
    );

    this.logger.log(
      `Workflow instance created: ${instance?.id}`,
      'WorkflowService',
    );

    // Emit workflow started event
    this.eventEmitter.emit('workflow.started', {
      instanceId: instance?.id,
      templateId: template.id,
      entityType,
      entityId,
      companyId,
      initiatedBy: userId,
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'START_WORKFLOW',
      resourceType: 'WORKFLOW_INSTANCE',
      resourceId: instance?.id,
      newValues: { entityType, entityId, templateId: template.id },
    });

    return instance;
  }

  /**
   * Approve a workflow step. If it's the last step, the workflow is approved.
   * Otherwise, the workflow advances to the next step.
   */
  async approveStep(
    stepId: string,
    userId: string,
    companyId: string,
    comments?: string,
  ) {
    this.logger.log(
      `Approving workflow step ${stepId}`,
      'WorkflowService',
    );

    const step = await this.repository.findStepById(stepId);

    if (!step) {
      throw new NotFoundException('Workflow step not found');
    }

    // Verify this step belongs to the correct company
    if (step.instance.companyId !== companyId) {
      throw new NotFoundException('Workflow step not found');
    }

    // Verify step is PENDING
    if (step.status !== WorkflowStepStatus.PENDING) {
      throw new BadRequestException(
        `Step has already been resolved with status: ${step.status}`,
      );
    }

    // Verify the instance is IN_PROGRESS
    if (step.instance.status !== WorkflowStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Workflow is not in progress (current status: ${step.instance.status})`,
      );
    }

    // Verify this is the current step
    if (step.stepOrder !== step.instance.currentStepOrder) {
      throw new BadRequestException(
        'This step is not the current active step in the workflow',
      );
    }

    // Mark step as APPROVED
    const updatedStep = await this.repository.updateStep(stepId, {
      status: WorkflowStepStatus.APPROVED,
      resolver: { connect: { id: userId } },
      resolvedAt: new Date(),
      comments: comments ?? null,
    });

    const instanceSteps = updatedStep.instance.steps;
    const currentStepIndex = instanceSteps.findIndex(
      (s) => s.id === stepId,
    );
    const isLastStep = currentStepIndex === instanceSteps.length - 1;

    if (isLastStep) {
      // All steps approved - mark instance as APPROVED
      await this.repository.updateInstance(step.instanceId, {
        status: WorkflowStatus.APPROVED,
        completedAt: new Date(),
      });

      this.logger.log(
        `Workflow instance ${step.instanceId} fully approved`,
        'WorkflowService',
      );

      this.eventEmitter.emit('workflow.approved', {
        instanceId: step.instanceId,
        entityType: step.instance.entityType,
        entityId: step.instance.entityId,
        companyId,
        approvedBy: userId,
      });
    } else {
      // Advance to the next step
      const nextStep = instanceSteps[currentStepIndex + 1];

      await this.repository.updateInstance(step.instanceId, {
        currentStepOrder: nextStep.stepOrder,
      });

      this.logger.log(
        `Workflow instance ${step.instanceId} advanced to step ${nextStep.stepOrder}`,
        'WorkflowService',
      );

      this.eventEmitter.emit('workflow.step.approved', {
        instanceId: step.instanceId,
        stepId,
        nextStepId: nextStep.id,
        nextStepOrder: nextStep.stepOrder,
        entityType: step.instance.entityType,
        entityId: step.instance.entityId,
        companyId,
        approvedBy: userId,
      });
    }

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'APPROVE_STEP',
      resourceType: 'WORKFLOW_STEP',
      resourceId: stepId,
      newValues: {
        status: WorkflowStepStatus.APPROVED,
        comments,
        instanceId: step.instanceId,
      },
    });

    return updatedStep;
  }

  /**
   * Reject a workflow step. This immediately rejects the entire workflow instance.
   */
  async rejectStep(
    stepId: string,
    userId: string,
    companyId: string,
    comments?: string,
  ) {
    this.logger.log(
      `Rejecting workflow step ${stepId}`,
      'WorkflowService',
    );

    const step = await this.repository.findStepById(stepId);

    if (!step) {
      throw new NotFoundException('Workflow step not found');
    }

    // Verify this step belongs to the correct company
    if (step.instance.companyId !== companyId) {
      throw new NotFoundException('Workflow step not found');
    }

    // Verify step is PENDING
    if (step.status !== WorkflowStepStatus.PENDING) {
      throw new BadRequestException(
        `Step has already been resolved with status: ${step.status}`,
      );
    }

    // Verify the instance is IN_PROGRESS
    if (step.instance.status !== WorkflowStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Workflow is not in progress (current status: ${step.instance.status})`,
      );
    }

    // Verify this is the current step
    if (step.stepOrder !== step.instance.currentStepOrder) {
      throw new BadRequestException(
        'This step is not the current active step in the workflow',
      );
    }

    // Mark step as REJECTED
    const updatedStep = await this.repository.updateStep(stepId, {
      status: WorkflowStepStatus.REJECTED,
      resolver: { connect: { id: userId } },
      resolvedAt: new Date(),
      comments: comments ?? null,
    });

    // Mark the entire instance as REJECTED
    await this.repository.updateInstance(step.instanceId, {
      status: WorkflowStatus.REJECTED,
      completedAt: new Date(),
    });

    this.logger.log(
      `Workflow instance ${step.instanceId} rejected at step ${step.stepOrder}`,
      'WorkflowService',
    );

    this.eventEmitter.emit('workflow.rejected', {
      instanceId: step.instanceId,
      stepId,
      entityType: step.instance.entityType,
      entityId: step.instance.entityId,
      companyId,
      rejectedBy: userId,
      comments,
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'REJECT_STEP',
      resourceType: 'WORKFLOW_STEP',
      resourceId: stepId,
      newValues: {
        status: WorkflowStepStatus.REJECTED,
        comments,
        instanceId: step.instanceId,
      },
    });

    return updatedStep;
  }

  /**
   * Cancel a running workflow. Only the initiator or admins can cancel.
   */
  async cancelWorkflow(instanceId: string, userId: string, companyId: string) {
    this.logger.log(
      `Cancelling workflow instance ${instanceId}`,
      'WorkflowService',
    );

    const instance = await this.repository.findInstanceById(
      instanceId,
      companyId,
    );

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    if (
      instance.status !== WorkflowStatus.PENDING &&
      instance.status !== WorkflowStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Cannot cancel workflow with status: ${instance.status}`,
      );
    }

    await this.repository.updateInstance(instanceId, {
      status: WorkflowStatus.CANCELLED,
      completedAt: new Date(),
    });

    this.logger.log(
      `Workflow instance ${instanceId} cancelled`,
      'WorkflowService',
    );

    this.eventEmitter.emit('workflow.cancelled', {
      instanceId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      companyId,
      cancelledBy: userId,
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CANCEL_WORKFLOW',
      resourceType: 'WORKFLOW_INSTANCE',
      resourceId: instanceId,
      oldValues: { status: instance.status },
      newValues: { status: WorkflowStatus.CANCELLED },
    });
  }

  // ─── Query Methods ────────────────────────────────────────────────────

  async getInstances(companyId: string, filter: WorkflowFilterDto) {
    this.logger.log('Listing workflow instances', 'WorkflowService');

    const { data, total } = await this.repository.findInstances(
      companyId,
      filter,
    );

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

  async getInstance(id: string, companyId: string) {
    this.logger.log(`Finding workflow instance ${id}`, 'WorkflowService');

    const instance = await this.repository.findInstanceById(id, companyId);

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    return instance;
  }

  async getMyPendingApprovals(
    userId: string,
    companyId: string,
    role: string,
  ) {
    this.logger.log(
      `Finding pending approvals for user ${userId}`,
      'WorkflowService',
    );

    return this.repository.findPendingStepsForUser(
      userId,
      companyId,
      role,
    );
  }

  // ─── Delegation Management ───────────────────────────────────────────

  async createDelegation(
    companyId: string,
    delegatorId: string,
    dto: { delegateId: string; startDate: string; endDate: string; reason?: string; scope?: string[] },
  ) {
    this.logger.log(`Creating delegation from ${delegatorId} to ${dto.delegateId}`, 'WorkflowService');

    if (delegatorId === dto.delegateId) {
      throw new BadRequestException('Cannot delegate to yourself');
    }

    const delegation = await this.repository.createDelegation({
      companyId,
      delegatorId,
      delegateId: dto.delegateId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      reason: dto.reason,
      scope: dto.scope ? { types: dto.scope } : {},
    });

    this.eventEmitter.emit('delegation.created', {
      companyId,
      delegatorId,
      delegateId: dto.delegateId,
    });

    return delegation;
  }

  async getDelegations(companyId: string, userId: string) {
    return this.repository.findDelegations(companyId, userId);
  }

  async revokeDelegation(id: string, companyId: string, userId: string) {
    await this.repository.deleteDelegation(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'REVOKE_DELEGATION',
      resourceType: 'APPROVAL_DELEGATION',
      resourceId: id,
    });

    return { message: 'Delegation revoked' };
  }

  // ─── Authorization Helper ─────────────────────────────────────────────

  /**
   * Check if a user can approve a given step based on the step's approver
   * type configuration.
   *
   * - USER: approverValue must match the userId
   * - ROLE: approverValue must match the user's role
   * - MANAGER: checks actual reporting manager chain via employee records;
   *            falls back to role-based check if employee records are missing
   */
  async canUserApproveStep(
    step: { approverType: string; approverValue: string },
    userId: string,
    userRole: string,
    initiatorUserId?: string,
    companyId?: string,
  ): Promise<boolean> {
    switch (step.approverType) {
      case WorkflowApproverType.USER:
        return step.approverValue === userId;
      case WorkflowApproverType.ROLE:
        return step.approverValue === userRole;
      case WorkflowApproverType.MANAGER:
        // Try actual reporting manager check if we have the context
        if (initiatorUserId && companyId) {
          const isManager = await this.repository.isReportingManagerOf(
            userId,
            initiatorUserId,
            companyId,
          );
          if (isManager) return true;
        }
        // Fallback: accept MANAGER or higher roles (HR_ADMIN, COMPANY_ADMIN)
        return ['MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'].includes(userRole);
      default:
        return false;
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────

  /**
   * Validate that step configurations are well-formed:
   * - Orders must be positive integers
   * - Orders must be sequential starting from 1
   * - No duplicate orders
   */
  private validateStepsConfig(
    steps: Array<{ order: number; approverType: string; approverValue: string }>,
  ) {
    if (!steps || steps.length === 0) {
      throw new BadRequestException(
        'At least one workflow step is required',
      );
    }

    const orders = steps.map((s) => s.order).sort((a, b) => a - b);

    // Check for duplicates
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      throw new BadRequestException('Step orders must be unique');
    }

    // Check sequential starting from 1
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new BadRequestException(
          `Step orders must be sequential starting from 1. Expected ${i + 1}, got ${orders[i]}`,
        );
      }
    }

    // Validate each step has required fields
    for (const step of steps) {
      if (!step.approverType || !step.approverValue) {
        throw new BadRequestException(
          'Each step must have approverType and approverValue',
        );
      }
    }
  }
}
