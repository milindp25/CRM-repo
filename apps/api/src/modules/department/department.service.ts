import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DepartmentRepository } from './department.repository';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFilterDto,
  DepartmentResponseDto,
  DepartmentPaginationResponseDto,
} from './dto';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';

/**
 * Department Service
 * Business logic for department management
 */
@Injectable()
export class DepartmentService {
  constructor(
    private readonly repository: DepartmentRepository,
    private readonly logger: LoggerService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Create new department
   */
  async create(
    companyId: string,
    dto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    this.logger.log(`Creating department: ${dto.name} (${dto.code})`);

    // Validate unique code
    const codeExists = await this.repository.existsByCode(companyId, dto.code);
    if (codeExists) {
      throw new ConflictException(
        `Department code '${dto.code}' already exists in your company`,
      );
    }

    // Create department
    this.cache.invalidateByPrefix(`depts:${companyId}`);
    const department = await this.repository.create({
      name: dto.name,
      code: dto.code,
      description: dto.description,
      ...(dto.parentId && { parent: { connect: { id: dto.parentId } } }),
      headEmployeeId: dto.headEmployeeId,
      costCenter: dto.costCenter,
      isActive: dto.isActive ?? true,
      company: {
        connect: { id: companyId },
      },
    });

    this.logger.log(`Department created: ${department.id}`);

    return this.formatDepartment(department);
  }

  /**
   * List departments with filters and pagination
   */
  async findMany(
    companyId: string,
    filter: DepartmentFilterDto,
  ): Promise<DepartmentPaginationResponseDto> {
    const cacheKey = `depts:${companyId}:${JSON.stringify(filter)}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const result = await this.repository.findMany(companyId, filter);
      return {
        data: result.data.map((dept) => this.formatDepartment(dept)),
        meta: result.meta,
      };
    }, 60_000);
  }

  /**
   * Get department by ID
   */
  async findById(id: string, companyId: string): Promise<DepartmentResponseDto> {
    const department = await this.repository.findById(id, companyId);

    if (!department) {
      throw new NotFoundException(`Department not found`);
    }

    return this.formatDepartment(department);
  }

  /**
   * Update department
   */
  async update(
    id: string,
    companyId: string,
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    this.logger.log(`Updating department: ${id}`);

    // Check department exists
    const existing = await this.repository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundException(`Department not found`);
    }

    // Validate unique code if changed
    if (dto.code && dto.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(
        companyId,
        dto.code,
        id,
      );
      if (codeExists) {
        throw new ConflictException(
          `Department code '${dto.code}' already exists in your company`,
        );
      }
    }

    // Prevent circular hierarchy
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException('Department cannot be its own parent');
      }
      // TODO: Add more sophisticated circular dependency check
    }

    this.cache.invalidateByPrefix(`depts:${companyId}`);
    // Update department
    const updated = await this.repository.update(id, companyId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.code && { code: dto.code }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      ...(dto.headEmployeeId !== undefined && { headEmployeeId: dto.headEmployeeId }),
      ...(dto.costCenter !== undefined && { costCenter: dto.costCenter }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    this.logger.log(`Department updated: ${id}`);

    return this.formatDepartment(updated);
  }

  /**
   * Delete department (soft delete)
   */
  async delete(id: string, companyId: string): Promise<void> {
    this.logger.log(`Deleting department: ${id}`);

    // Check department exists
    const existing = await this.repository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundException(`Department not found`);
    }

    // Check if department has employees
    if (existing._count && existing._count.employees > 0) {
      throw new ConflictException(
        `Cannot delete department with ${existing._count.employees} employees. Please reassign employees first.`,
      );
    }

    // Check if department has child departments
    if (existing.children && existing.children.length > 0) {
      throw new ConflictException(
        `Cannot delete department with ${existing.children.length} sub-departments. Please delete or reassign sub-departments first.`,
      );
    }

    this.cache.invalidateByPrefix(`depts:${companyId}`);
    // Soft delete
    await this.repository.softDelete(id, companyId);

    this.logger.log(`Department deleted: ${id}`);
  }

  /**
   * Get department hierarchy
   */
  async getHierarchy(companyId: string): Promise<DepartmentResponseDto[]> {
    const departments = await this.repository.getHierarchy(companyId);
    return departments.map((dept) => this.formatDepartment(dept));
  }

  /**
   * Format department for response
   */
  private formatDepartment(department: any): DepartmentResponseDto {
    return {
      id: department.id,
      companyId: department.companyId,
      name: department.name,
      code: department.code,
      description: department.description,
      parent: department.parent || null,
      children: department.children || [],
      headEmployee: department.headEmployee || null,
      costCenter: department.costCenter,
      isActive: department.isActive,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      deletedAt: department.deletedAt,
      employeeCount: department._count?.employees || 0,
    };
  }
}
