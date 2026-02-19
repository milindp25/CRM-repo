import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { DocumentFilterDto } from './dto';

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultInclude = {
    employee: {
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
      },
    },
    uploader: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    },
  };

  async create(data: Prisma.DocumentCreateInput) {
    return this.prisma.document.create({
      data,
      include: this.defaultInclude,
    });
  }

  async findById(id: string, companyId: string) {
    return this.prisma.document.findFirst({
      where: {
        id,
        companyId,
        isActive: true,
        deletedAt: null,
      },
      include: this.defaultInclude,
    });
  }

  async findMany(companyId: string, filter: DocumentFilterDto) {
    const { page = 1, limit = 20, category, employeeId, search } = filter;

    const where: Prisma.DocumentWhereInput = {
      companyId,
      isActive: true,
      deletedAt: null,
      ...(category && { category }),
      ...(employeeId && { employeeId }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.defaultInclude,
      }),
      this.prisma.document.count({ where }),
    ]);

    return { data, total };
  }

  async findByEmployee(employeeId: string, companyId: string) {
    return this.prisma.document.findMany({
      where: {
        employeeId,
        companyId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: this.defaultInclude,
    });
  }

  async update(id: string, companyId: string, data: Prisma.DocumentUpdateInput) {
    return this.prisma.document.update({
      where: {
        id,
        companyId,
      },
      data,
      include: this.defaultInclude,
    });
  }

  async softDelete(id: string, companyId: string) {
    return this.prisma.document.update({
      where: {
        id,
        companyId,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async countByCompany(companyId: string) {
    return this.prisma.document.count({
      where: {
        companyId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async createAuditLog(data: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }
}
