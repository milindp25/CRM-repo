import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../../common/services/logger.service';
import { SalaryStructureRepository } from './salary-structure.repository';
import {
  CreateSalaryStructureDto,
  UpdateSalaryStructureDto,
  SalaryComponentDto,
  SalaryComponentType,
  SalaryStructureResponseDto,
} from './salary-structure.dto';

@Injectable()
export class SalaryStructureService {
  constructor(
    private readonly repository: SalaryStructureRepository,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(
    companyId: string,
    dto: CreateSalaryStructureDto,
  ): Promise<SalaryStructureResponseDto> {
    this.logger.log(`Creating salary structure "${dto.name}" for company ${companyId}`);

    this.validateComponents(dto.components, dto.country);

    const createData: Prisma.SalaryStructureCreateInput = {
      name: dto.name,
      country: dto.country,
      components: dto.components as any,
      company: { connect: { id: companyId } },
      ...(dto.description && { description: dto.description }),
      ...(dto.designationId && { designationId: dto.designationId }),
    };

    const structure = await this.repository.create(createData);

    return this.toResponse(structure);
  }

  // ─── Find All ─────────────────────────────────────────────────────────────

  async findAll(
    companyId: string,
    filter: { designationId?: string; isActive?: boolean; skip?: number; take?: number },
  ) {
    this.logger.log(`Listing salary structures for company ${companyId}`);

    const where: Prisma.SalaryStructureWhereInput = {
      companyId,
      ...(filter.designationId && { designationId: filter.designationId }),
      ...(filter.isActive !== undefined && { isActive: filter.isActive }),
    };

    const skip = filter.skip ?? 0;
    const take = filter.take ?? 50;

    const { data, total } = await this.repository.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    return {
      data: data.map((s: any) => this.toResponse(s)),
      meta: {
        totalItems: total,
        itemsPerPage: take,
        currentPage: Math.floor(skip / take) + 1,
        totalPages: Math.ceil(total / take),
        hasNextPage: skip + take < total,
        hasPreviousPage: skip > 0,
      },
    };
  }

  // ─── Find One ─────────────────────────────────────────────────────────────

  async findOne(id: string, companyId: string): Promise<SalaryStructureResponseDto> {
    this.logger.log(`Finding salary structure ${id}`);

    const structure = await this.repository.findById(id);

    if (!structure || structure.companyId !== companyId) {
      throw new NotFoundException('Salary structure not found');
    }

    return this.toResponse(structure);
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    companyId: string,
    dto: UpdateSalaryStructureDto,
  ): Promise<SalaryStructureResponseDto> {
    this.logger.log(`Updating salary structure ${id}`);

    const existing = await this.repository.findById(id);

    if (!existing || existing.companyId !== companyId) {
      throw new NotFoundException('Salary structure not found');
    }

    // If components are being updated, validate them against the target country
    if (dto.components) {
      const country = dto.country ?? existing.country;
      this.validateComponents(dto.components, country);
    }

    const updateData: Prisma.SalaryStructureUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.country !== undefined && { country: dto.country }),
      ...(dto.components !== undefined && { components: dto.components as any }),
      ...(dto.designationId !== undefined && { designationId: dto.designationId }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    const updated = await this.repository.update(id, updateData);

    return this.toResponse(updated);
  }

  // ─── Remove ───────────────────────────────────────────────────────────────

  async remove(id: string, companyId: string): Promise<void> {
    this.logger.log(`Deleting salary structure ${id}`);

    const existing = await this.repository.findById(id);

    if (!existing || existing.companyId !== companyId) {
      throw new NotFoundException('Salary structure not found');
    }

    await this.repository.delete(id);
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  /**
   * Validate salary components based on country-specific labour regulations.
   *
   * India (2025 Labour Code):
   *   Basic must be >= 50 % of total earnings (sum of all EARNING components).
   *   "Basic" is identified by the first component whose name lowercased starts
   *   with "basic".
   */
  validateComponents(components: SalaryComponentDto[], country: string): void {
    if (!components || components.length === 0) {
      throw new BadRequestException('At least one salary component is required');
    }

    // Ensure there is at least one EARNING component
    const earningComponents = components.filter(
      (c) => c.type === SalaryComponentType.EARNING,
    );

    if (earningComponents.length === 0) {
      throw new BadRequestException('At least one EARNING component is required');
    }

    if (country === 'IN') {
      this.validateIndianComponents(components, earningComponents);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private validateIndianComponents(
    components: SalaryComponentDto[],
    earningComponents: SalaryComponentDto[],
  ): void {
    // Find the "Basic" component
    const basicComponent = components.find(
      (c) =>
        c.type === SalaryComponentType.EARNING &&
        c.name.toLowerCase().startsWith('basic'),
    );

    if (!basicComponent) {
      throw new BadRequestException(
        'Indian salary structures must include a "Basic" earning component',
      );
    }

    // Only validate the ratio when all earning components use FIXED calculation
    // (percentage-based values depend on runtime CTC, so the ratio cannot be
    //  statically asserted at definition time).
    const allFixed = earningComponents.every(
      (c) => c.calculationType === 'FIXED',
    );

    if (allFixed) {
      const totalEarnings = earningComponents.reduce((sum, c) => sum + c.value, 0);

      if (totalEarnings > 0 && basicComponent.value / totalEarnings < 0.5) {
        throw new BadRequestException(
          'For Indian salary structures, Basic must be at least 50% of total earnings (2025 Labour Code compliance)',
        );
      }
    }
  }

  private toResponse(structure: any): SalaryStructureResponseDto {
    return {
      id: structure.id,
      companyId: structure.companyId,
      name: structure.name,
      description: structure.description ?? undefined,
      country: structure.country,
      components: structure.components as SalaryComponentDto[],
      designationId: structure.designationId ?? undefined,
      isActive: structure.isActive,
      createdAt: structure.createdAt,
      updatedAt: structure.updatedAt,
    };
  }
}
