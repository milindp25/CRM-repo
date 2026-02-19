import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { PolicyRepository } from './policy.repository';
import { CreatePolicyDto, UpdatePolicyDto } from './dto';

@Injectable()
export class PolicyService {
  constructor(
    private readonly repository: PolicyRepository,
    private readonly logger: LoggerService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // Policy CRUD
  // ──────────────────────────────────────────────────────────────

  /**
   * Create a new policy in DRAFT status.
   */
  async create(companyId: string, userId: string, dto: CreatePolicyDto) {
    this.logger.log(
      `Creating policy "${dto.title}" for company ${companyId}`,
      'PolicyService',
    );

    const policy = await this.repository.create({
      title: dto.title,
      description: dto.description ?? null,
      content: dto.content,
      category: dto.category,
      version: dto.version ?? '1.0',
      requiresAcknowledgment: dto.requiresAcknowledgment ?? false,
      ...(dto.effectiveDate && {
        effectiveDate: new Date(dto.effectiveDate),
      }),
      company: { connect: { id: companyId } },
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'POLICY',
      resourceId: policy.id,
      newValues: {
        title: dto.title,
        category: dto.category,
        version: dto.version ?? '1.0',
      },
    });

    this.logger.log(
      `Policy "${dto.title}" created successfully (id: ${policy.id})`,
      'PolicyService',
    );

    return policy;
  }

  /**
   * List policies for a company with optional filters.
   */
  async findAll(
    companyId: string,
    filters: {
      status?: string;
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    this.logger.log('Listing policies', 'PolicyService');

    const { data, total } = await this.repository.findMany(companyId, filters);

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
   * Get a single policy by ID.
   */
  async findOne(id: string, companyId: string) {
    this.logger.log(`Finding policy ${id}`, 'PolicyService');

    const policy = await this.repository.findById(id, companyId);

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return policy;
  }

  /**
   * Update a policy. Only DRAFT policies can have content changed.
   */
  async update(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdatePolicyDto,
  ) {
    this.logger.log(`Updating policy ${id}`, 'PolicyService');

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Policy not found');
    }

    const updateData: Record<string, any> = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.version !== undefined) updateData.version = dto.version;
    if (dto.requiresAcknowledgment !== undefined)
      updateData.requiresAcknowledgment = dto.requiresAcknowledgment;
    if (dto.effectiveDate !== undefined)
      updateData.effectiveDate = new Date(dto.effectiveDate);

    const updated = await this.repository.update(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'POLICY',
      resourceId: id,
      oldValues: {
        title: existing.title,
        category: existing.category,
        version: existing.version,
        status: existing.status,
      },
      newValues: dto,
    });

    return updated;
  }

  /**
   * Publish a policy (transition from DRAFT to PUBLISHED).
   */
  async publish(id: string, companyId: string, userId: string) {
    this.logger.log(`Publishing policy ${id}`, 'PolicyService');

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Policy not found');
    }

    if (existing.status === 'PUBLISHED') {
      throw new BadRequestException('Policy is already published');
    }

    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot publish an archived policy');
    }

    const updated = await this.repository.update(id, companyId, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'PUBLISH',
      resourceType: 'POLICY',
      resourceId: id,
      oldValues: { status: existing.status },
      newValues: { status: 'PUBLISHED' },
    });

    this.logger.log(`Policy ${id} published successfully`, 'PolicyService');

    return updated;
  }

  /**
   * Archive (soft-delete) a policy.
   */
  async remove(id: string, companyId: string, userId: string) {
    this.logger.log(`Archiving policy ${id}`, 'PolicyService');

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Policy not found');
    }

    await this.repository.softDelete(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'POLICY',
      resourceId: id,
      oldValues: {
        title: existing.title,
        category: existing.category,
        status: existing.status,
      },
    });

    this.logger.log(`Policy ${id} archived successfully`, 'PolicyService');
  }

  // ──────────────────────────────────────────────────────────────
  // Acknowledgments
  // ──────────────────────────────────────────────────────────────

  /**
   * Acknowledge a policy. The employee (userId's linked employee) acknowledges.
   */
  async acknowledge(
    policyId: string,
    companyId: string,
    employeeId: string,
    ipAddress?: string,
  ) {
    this.logger.log(
      `Employee ${employeeId} acknowledging policy ${policyId}`,
      'PolicyService',
    );

    const policy = await this.repository.findById(policyId, companyId);

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    if (policy.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'Only published policies can be acknowledged',
      );
    }

    // Check if already acknowledged
    const existing = await this.repository.findAcknowledgment(
      policyId,
      employeeId,
    );

    if (existing) {
      throw new ConflictException(
        'You have already acknowledged this policy',
      );
    }

    const acknowledgment = await this.repository.createAcknowledgment({
      policyId,
      employeeId,
      ipAddress,
    });

    this.logger.log(
      `Policy ${policyId} acknowledged by employee ${employeeId}`,
      'PolicyService',
    );

    return acknowledgment;
  }

  /**
   * List acknowledgments for a specific policy.
   */
  async findAcknowledgments(
    policyId: string,
    companyId: string,
    filters: { page?: number; limit?: number },
  ) {
    this.logger.log(
      `Listing acknowledgments for policy ${policyId}`,
      'PolicyService',
    );

    // Verify policy exists and belongs to company
    const policy = await this.repository.findById(policyId, companyId);

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    const { data, total } = await this.repository.findAcknowledgmentsByPolicy(
      policyId,
      filters,
    );

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
   * List acknowledgments by the current employee.
   */
  async findMyAcknowledgments(
    employeeId: string,
    filters: { page?: number; limit?: number },
  ) {
    this.logger.log(
      `Listing acknowledgments for employee ${employeeId}`,
      'PolicyService',
    );

    const { data, total } =
      await this.repository.findAcknowledgmentsByEmployee(
        employeeId,
        filters,
      );

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
   * Get acknowledgment status for a policy: who has and who hasn't acknowledged.
   */
  async getAcknowledgmentStatus(policyId: string, companyId: string) {
    this.logger.log(
      `Getting acknowledgment status for policy ${policyId}`,
      'PolicyService',
    );

    const policy = await this.repository.findById(policyId, companyId);

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Get all active employees
    const allEmployees =
      await this.repository.findActiveEmployeesByCompany(companyId);

    // Get all acknowledgments for this policy
    const { data: acknowledgments } =
      await this.repository.findAcknowledgmentsByPolicy(policyId, {
        page: 1,
        limit: 10000,
      });

    const acknowledgedEmployeeIds = new Set(
      acknowledgments.map((a: any) => a.employeeId),
    );

    const acknowledged = allEmployees.filter((e) =>
      acknowledgedEmployeeIds.has(e.id),
    );
    const pending = allEmployees.filter(
      (e) => !acknowledgedEmployeeIds.has(e.id),
    );

    return {
      policyId,
      totalEmployees: allEmployees.length,
      acknowledgedCount: acknowledged.length,
      pendingCount: pending.length,
      acknowledged,
      pending,
    };
  }
}
