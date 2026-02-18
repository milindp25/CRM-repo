import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { DepartmentFilterDto } from './dto';

/**
 * Department Repository
 * Data access layer for department operations
 */
@Injectable()
export class DepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if department code exists
   */
  async existsByCode(
    companyId: string,
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.department.count({
      where: {
        companyId,
        code,
        ...(excludeId && { id: { not: excludeId } }),
        deletedAt: null,
      },
    });
    return count > 0;
  }

  /**
   * Create department
   */
  async create(data: Prisma.DepartmentCreateInput) {
    return this.prisma.department.create({
      data,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  }

  /**
   * Find many departments with filters
   */
  async findMany(companyId: string, filter: DepartmentFilterDto) {
    const { search, isActive, parentId, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = filter;

    const where: Prisma.DepartmentWhereInput = {
      companyId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(parentId !== undefined && {
        parentId: parentId === 'null' || parentId === '' ? null : parentId,
      }),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          children: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              employees: true,
            },
          },
        },
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      data,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find department by ID
   */
  async findById(id: string, companyId: string) {
    return this.prisma.department.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  }

  /**
   * Update department
   */
  async update(id: string, companyId: string, data: Prisma.DepartmentUpdateInput) {
    return this.prisma.department.update({
      where: {
        id,
        companyId,
      },
      data,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete department
   */
  async softDelete(id: string, companyId: string) {
    return this.prisma.department.update({
      where: {
        id,
        companyId,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  /**
   * Get department hierarchy (all departments as tree)
   */
  async getHierarchy(companyId: string) {
    return this.prisma.department.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
