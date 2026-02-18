import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { EmployeeFilterDto, SortBy } from './dto';

/**
 * Employee Repository (Data Access Layer)
 * Single Responsibility: Only handles database operations
 */
@Injectable()
export class EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if employee code exists in company
   */
  async existsByCode(
    companyId: string,
    employeeCode: string,
    excludeId?: string,
  ) {
    return this.prisma.employee.findFirst({
      where: {
        companyId,
        employeeCode,
        id: excludeId ? { not: excludeId } : undefined,
        deletedAt: null,
      },
    });
  }

  /**
   * Check if work email exists in company
   */
  async existsByWorkEmail(
    companyId: string,
    workEmail: string,
    excludeId?: string,
  ) {
    return this.prisma.employee.findFirst({
      where: {
        companyId,
        workEmail,
        id: excludeId ? { not: excludeId } : undefined,
        deletedAt: null,
      },
    });
  }

  /**
   * Create employee with relations
   */
  async create(data: Prisma.EmployeeCreateInput) {
    return this.prisma.employee.create({
      data,
      include: {
        department: true,
        designation: true,
        reportingManager: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
          },
        },
      },
    });
  }

  /**
   * Find many employees with filters and pagination
   */
  async findMany(companyId: string, filter: EmployeeFilterDto) {
    const { search, departmentId, designationId, status, employmentType, reportingManagerId, page, limit, sortBy, sortOrder } = filter;

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {
      companyId,
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { workEmail: { contains: search, mode: 'insensitive' } },
          { employeeCode: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(departmentId && { departmentId }),
      ...(designationId && { designationId }),
      ...(status && { status }),
      ...(employmentType && { employmentType }),
      ...(reportingManagerId && { reportingManagerId }),
    };

    // Build orderBy clause
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    // Calculate pagination
    const skip = ((page || 1) - 1) * (limit || 20);
    const take = limit || 20;

    // Execute queries in parallel
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          designation: {
            select: {
              id: true,
              title: true,
              level: true,
            },
          },
          reportingManager: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              workEmail: true,
            },
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find employee by ID with relations
   */
  async findById(id: string, companyId: string) {
    return this.prisma.employee.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        designation: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
        reportingManager: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
          },
        },
      },
    });
  }

  /**
   * Update employee
   */
  async update(id: string, companyId: string, data: Prisma.EmployeeUpdateInput) {
    return this.prisma.employee.update({
      where: {
        id,
        companyId,
      },
      data,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        designation: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
        reportingManager: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete employee
   */
  async softDelete(id: string, companyId: string) {
    return this.prisma.employee.update({
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
   * Create audit log
   */
  async createAuditLog(data: {
    userId: string;
    userEmail: string;
    action: string;
    resourceType: string;
    resourceId: string;
    companyId: string;
    success: boolean;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  /**
   * Build orderBy clause based on sortBy and sortOrder
   */
  private buildOrderBy(sortBy?: SortBy, sortOrder?: string): Prisma.EmployeeOrderByWithRelationInput {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    switch (sortBy) {
      case SortBy.FIRST_NAME:
        return { firstName: order };
      case SortBy.EMPLOYEE_CODE:
        return { employeeCode: order };
      case SortBy.DATE_OF_JOINING:
        return { dateOfJoining: order };
      case SortBy.CREATED_AT:
      default:
        return { createdAt: order };
    }
  }
}
