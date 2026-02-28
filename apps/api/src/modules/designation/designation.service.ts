import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DesignationRepository } from './designation.repository';
import { CreateDesignationDto, UpdateDesignationDto, DesignationFilterDto, DesignationResponseDto, DesignationPaginationResponseDto } from './dto';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class DesignationService {
  constructor(
    private readonly repository: DesignationRepository,
    private readonly logger: LoggerService,
    private readonly cache: CacheService,
  ) {}

  async create(companyId: string, dto: CreateDesignationDto): Promise<DesignationResponseDto> {
    // Auto-generate code if not provided
    if (!dto.code) {
      dto.code = await this.generateCode(companyId, dto.title);
    }

    this.logger.log(`Creating designation: ${dto.title} (${dto.code})`);

    const codeExists = await this.repository.existsByCode(companyId, dto.code);
    if (codeExists) {
      throw new ConflictException(`Designation code '${dto.code}' already exists`);
    }

    this.cache.invalidateByPrefix(`desigs:${companyId}`);
    const designation = await this.repository.create({
      title: dto.title,
      code: dto.code,
      description: dto.description,
      level: dto.level ?? 1,
      minSalary: dto.minSalary,
      maxSalary: dto.maxSalary,
      currency: dto.currency ?? 'INR',
      company: { connect: { id: companyId } },
    });

    return this.formatDesignation(designation);
  }

  async findMany(companyId: string, filter: DesignationFilterDto): Promise<DesignationPaginationResponseDto> {
    const cacheKey = `desigs:${companyId}:${JSON.stringify(filter)}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const result = await this.repository.findMany(companyId, filter);
      return {
        data: result.data.map((d) => this.formatDesignation(d)),
        meta: result.meta,
      };
    }, 60_000);
  }

  async findById(id: string, companyId: string): Promise<DesignationResponseDto> {
    const designation = await this.repository.findById(id, companyId);
    if (!designation) {
      throw new NotFoundException('Designation not found');
    }
    return this.formatDesignation(designation);
  }

  async update(id: string, companyId: string, dto: UpdateDesignationDto): Promise<DesignationResponseDto> {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Designation not found');
    }

    if (dto.code && dto.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(companyId, dto.code, id);
      if (codeExists) {
        throw new ConflictException(`Designation code '${dto.code}' already exists`);
      }
    }

    this.cache.invalidateByPrefix(`desigs:${companyId}`);
    const updated = await this.repository.update(id, companyId, {
      ...(dto.title && { title: dto.title }),
      ...(dto.code && { code: dto.code }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.level !== undefined && { level: dto.level }),
      ...(dto.minSalary !== undefined && { minSalary: dto.minSalary }),
      ...(dto.maxSalary !== undefined && { maxSalary: dto.maxSalary }),
      ...(dto.currency && { currency: dto.currency }),
    });

    return this.formatDesignation(updated);
  }

  async delete(id: string, companyId: string): Promise<void> {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Designation not found');
    }

    if (existing._count && existing._count.employees > 0) {
      throw new ConflictException(`Cannot delete designation with ${existing._count.employees} employees`);
    }

    this.cache.invalidateByPrefix(`desigs:${companyId}`);
    await this.repository.softDelete(id, companyId);
  }

  /**
   * Auto-generate a unique designation code from title
   */
  private async generateCode(companyId: string, title: string): Promise<string> {
    const words = title.trim().split(/\s+/);
    let code: string;
    if (words.length === 1) {
      code = words[0].toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    } else {
      code = words.map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    }
    if (!code) code = 'DESIG';

    let candidate = code;
    let suffix = 1;
    while (await this.repository.existsByCode(companyId, candidate)) {
      candidate = `${code}${suffix}`;
      suffix++;
    }
    return candidate;
  }

  private formatDesignation(designation: any): DesignationResponseDto {
    return {
      id: designation.id,
      companyId: designation.companyId,
      title: designation.title,
      code: designation.code,
      description: designation.description,
      level: designation.level,
      minSalary: designation.minSalary ? Number(designation.minSalary) : undefined,
      maxSalary: designation.maxSalary ? Number(designation.maxSalary) : undefined,
      currency: designation.currency,
      isActive: designation.isActive,
      createdAt: designation.createdAt,
      updatedAt: designation.updatedAt,
      deletedAt: designation.deletedAt,
      employeeCount: designation._count?.employees || 0,
    };
  }
}
