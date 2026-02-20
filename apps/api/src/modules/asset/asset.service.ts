import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import { AssetRepository } from './asset.repository';
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssignAssetDto,
  ReturnAssetDto,
} from './dto';

@Injectable()
export class AssetService {
  constructor(
    private readonly repository: AssetRepository,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Create a new asset for a company.
   */
  async create(companyId: string, userId: string, dto: CreateAssetDto) {
    this.logger.log(
      `Creating asset "${dto.name}" (code: ${dto.assetCode}) for company ${companyId}`,
      'AssetService',
    );

    const createData: Prisma.AssetCreateInput = {
      name: dto.name,
      assetCode: dto.assetCode,
      description: dto.description ?? null,
      category: dto.category,
      brand: dto.brand ?? null,
      model: dto.model ?? null,
      serialNumber: dto.serialNumber ?? null,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      purchasePrice: dto.purchasePrice ?? null,
      warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null,
      condition: dto.condition ?? 'GOOD',
      location: dto.location ?? null,
      status: 'AVAILABLE',
      company: { connect: { id: companyId } },
    };

    let asset;
    try {
      asset = await this.repository.create(createData);
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Asset code "${dto.assetCode}" already exists in this company`,
        );
      }
      throw error;
    }

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'ASSET',
      resourceId: asset.id,
      newValues: {
        name: dto.name,
        assetCode: dto.assetCode,
        category: dto.category,
      },
    });

    this.logger.log(
      `Asset "${dto.name}" created successfully (id: ${asset.id})`,
      'AssetService',
    );

    return asset;
  }

  /**
   * List all assets for a company with optional filters.
   */
  async findAll(
    companyId: string,
    filters: {
      status?: string;
      category?: string;
      assignedTo?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    this.logger.log('Listing assets', 'AssetService');

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
   * Find a single asset by ID within a company.
   */
  async findOne(id: string, companyId: string) {
    this.logger.log(`Finding asset ${id}`, 'AssetService');

    const asset = await this.repository.findById(id, companyId);

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  /**
   * Update asset details.
   */
  async update(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateAssetDto,
  ) {
    this.logger.log(`Updating asset ${id}`, 'AssetService');

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Asset not found');
    }

    const updateData: Prisma.AssetUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.brand !== undefined && { brand: dto.brand }),
      ...(dto.model !== undefined && { model: dto.model }),
      ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
      ...(dto.purchaseDate !== undefined && {
        purchaseDate: new Date(dto.purchaseDate),
      }),
      ...(dto.purchasePrice !== undefined && {
        purchasePrice: dto.purchasePrice,
      }),
      ...(dto.warrantyExpiry !== undefined && {
        warrantyExpiry: new Date(dto.warrantyExpiry),
      }),
      ...(dto.condition !== undefined && { condition: dto.condition }),
      ...(dto.location !== undefined && { location: dto.location }),
    };

    const updated = await this.repository.update(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'ASSET',
      resourceId: id,
      oldValues: {
        name: existing.name,
        category: existing.category,
        condition: existing.condition,
      },
      newValues: dto,
    });

    return updated;
  }

  /**
   * Soft-delete an asset.
   */
  async remove(id: string, companyId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting asset ${id}`, 'AssetService');

    const asset = await this.repository.findById(id, companyId);

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.status === 'ASSIGNED') {
      throw new BadRequestException(
        'Cannot delete an asset that is currently assigned. Return it first.',
      );
    }

    await this.repository.softDelete(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'ASSET',
      resourceId: id,
      oldValues: {
        name: asset.name,
        assetCode: asset.assetCode,
        category: asset.category,
      },
    });
  }

  /**
   * Assign an asset to an employee.
   * Transitions status: AVAILABLE -> ASSIGNED
   */
  async assign(
    assetId: string,
    companyId: string,
    userId: string,
    dto: AssignAssetDto,
  ) {
    this.logger.log(
      `Assigning asset ${assetId} to employee ${dto.employeeId}`,
      'AssetService',
    );

    const asset = await this.repository.findById(assetId, companyId);

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.status !== 'AVAILABLE') {
      throw new BadRequestException(
        `Asset cannot be assigned. Current status: ${asset.status}`,
      );
    }

    const now = new Date();

    // Create the assignment record
    const assignment = await this.repository.createAssignment({
      asset: { connect: { id: assetId } },
      employeeId: dto.employeeId,
      assignedAt: now,
      assignmentNotes: dto.assignmentNotes ?? null,
    });

    // Update asset status and assignedTo
    await this.repository.update(assetId, companyId, {
      status: 'ASSIGNED',
      assignedTo: dto.employeeId,
      assignedAt: now,
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'ASSET',
      resourceId: assetId,
      newValues: {
        action: 'ASSIGN',
        employeeId: dto.employeeId,
        assignmentId: assignment.id,
      },
    });

    this.logger.log(
      `Asset ${assetId} assigned to employee ${dto.employeeId}`,
      'AssetService',
    );

    return assignment;
  }

  /**
   * Return an asset from an employee.
   * Transitions status: ASSIGNED -> AVAILABLE
   */
  async return(
    assetId: string,
    companyId: string,
    userId: string,
    dto: ReturnAssetDto,
  ) {
    this.logger.log(`Returning asset ${assetId}`, 'AssetService');

    const asset = await this.repository.findById(assetId, companyId);

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.status !== 'ASSIGNED') {
      throw new BadRequestException(
        `Asset is not currently assigned. Current status: ${asset.status}`,
      );
    }

    // Find the active assignment
    const activeAssignment = await this.repository.findActiveAssignment(assetId);

    if (!activeAssignment) {
      throw new BadRequestException('No active assignment found for this asset');
    }

    const now = new Date();

    // Complete the assignment record
    await this.repository.returnAssignment(activeAssignment.id, {
      returnedAt: now,
      returnNotes: dto.returnNotes,
      conditionOnReturn: dto.conditionOnReturn,
    });

    // Update asset status
    const updateData: Prisma.AssetUpdateInput = {
      status: 'AVAILABLE',
      assignedTo: null,
      assignedAt: null,
      ...(dto.conditionOnReturn && { condition: dto.conditionOnReturn }),
    };

    await this.repository.update(assetId, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'ASSET',
      resourceId: assetId,
      newValues: {
        action: 'RETURN',
        employeeId: activeAssignment.employeeId,
        conditionOnReturn: dto.conditionOnReturn,
      },
    });

    this.logger.log(`Asset ${assetId} returned successfully`, 'AssetService');

    return { message: 'Asset returned successfully' };
  }

  /**
   * Get the assignment history for an asset.
   */
  async getAssignmentHistory(assetId: string, companyId: string) {
    this.logger.log(
      `Getting assignment history for asset ${assetId}`,
      'AssetService',
    );

    // Verify the asset exists and belongs to this company
    const asset = await this.repository.findById(assetId, companyId);

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return this.repository.findAssignmentHistory(assetId);
  }
}
