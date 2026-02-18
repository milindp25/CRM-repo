import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { DesignationFilterDto } from './dto';

@Injectable()
export class DesignationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsByCode(companyId: string, code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.designation.count({
      where: {
        companyId,
        code,
        ...(excludeId && { id: { not: excludeId } }),
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async create(data: Prisma.DesignationCreateInput) {
    return this.prisma.designation.create({
      data,
      include: {
        _count: { select: { employees: true } },
      },
    });
  }

  async findMany(companyId: string, filter: DesignationFilterDto) {
    const { search, level, page = 1, limit = 20, sortBy = 'title', sortOrder = 'asc' } = filter;

    const where: Prisma.DesignationWhereInput = {
      companyId,
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(level && { level }),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.designation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { employees: true } } },
      }),
      this.prisma.designation.count({ where }),
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

  async findById(id: string, companyId: string) {
    return this.prisma.designation.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { _count: { select: { employees: true } } },
    });
  }

  async update(id: string, companyId: string, data: Prisma.DesignationUpdateInput) {
    return this.prisma.designation.update({
      where: { id, companyId },
      data,
      include: { _count: { select: { employees: true } } },
    });
  }

  async softDelete(id: string, companyId: string) {
    return this.prisma.designation.update({
      where: { id, companyId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
