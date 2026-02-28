import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UpdateCompanyDto, UpdateDesignationDto } from './dto/index.js';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard Metrics ──────────────────────────────────────────────

  async countCompanies(): Promise<number> {
    return this.prisma.company.count();
  }

  async countUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  async countEmployees(): Promise<number> {
    return this.prisma.employee.count();
  }

  async countCompaniesByTier(): Promise<{ tier: string; count: number }[]> {
    const results = await this.prisma.company.groupBy({
      by: ['subscriptionTier'],
      _count: { id: true },
    });
    return results.map((r) => ({
      tier: r.subscriptionTier,
      count: r._count.id,
    }));
  }

  async countCompaniesByStatus(): Promise<{ status: string; count: number }[]> {
    const results = await this.prisma.company.groupBy({
      by: ['subscriptionStatus'],
      _count: { id: true },
    });
    return results.map((r) => ({
      status: r.subscriptionStatus,
      count: r._count.id,
    }));
  }

  async findRecentCompanies(limit: number) {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ── Company Listing ────────────────────────────────────────────────

  async findCompanies(params: {
    search?: string;
    page: number;
    limit: number;
    status?: string;
    tier?: string;
  }) {
    const { search, page, limit, status, tier } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      // Limit search string length to prevent abuse
      const safeSearch = search.slice(0, 200);
      where.OR = [
        { companyName: { contains: safeSearch, mode: 'insensitive' } },
        { companyCode: { contains: safeSearch, mode: 'insensitive' } },
        { email: { contains: safeSearch, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.subscriptionStatus = status;
    }

    if (tier) {
      where.subscriptionTier = tier;
    }

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              employees: true,
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ── Company Lookup ─────────────────────────────────────────────────

  async findCompanyByCode(code: string) {
    return this.prisma.company.findUnique({ where: { companyCode: code } });
  }

  // ── Company Creation ──────────────────────────────────────────────

  async createCompanyWithAdmin(data: {
    companyName: string;
    companyCode: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    logoUrl?: string;
    adminEmail: string;
    adminFirstName: string;
    adminLastName: string;
    adminPasswordHash: string;
    permissions: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          companyName: data.companyName,
          companyCode: data.companyCode,
          subscriptionTier: data.subscriptionTier,
          subscriptionStatus: data.subscriptionStatus,
          logoUrl: data.logoUrl,
        },
      });

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email: data.adminEmail,
          passwordHash: data.adminPasswordHash,
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          role: 'COMPANY_ADMIN',
          permissions: data.permissions,
          isActive: true,
          emailVerified: true,
        },
      });

      return { company, user };
    });
  }

  // ── Company Detail ─────────────────────────────────────────────────

  async findCompanyById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
          },
        },
      },
    });
  }

  // ── Company Update ─────────────────────────────────────────────────

  async updateCompany(id: string, data: UpdateCompanyDto) {
    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  async updateCompanyFeatures(id: string, features: string[]) {
    return this.prisma.company.update({
      where: { id },
      data: { featuresEnabled: features },
    });
  }

  async updateCompanySubscription(
    id: string,
    data: { subscriptionTier?: string; subscriptionStatus?: string },
  ) {
    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  // ── Company Users ──────────────────────────────────────────────────

  async findUsersByCompanyId(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        companyId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  async softDeleteUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async createAdminAuditLog(data: {
    adminUserId: string;
    adminEmail: string;
    action: string;
    targetUserId: string;
    targetEmail: string;
    companyId: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.adminUserId,
        userEmail: data.adminEmail,
        action: data.action,
        resourceType: 'USER',
        resourceId: data.targetUserId,
        companyId: data.companyId,
        success: true,
        metadata: (data.metadata ?? {}) as any,
      },
    });
  }

  // ── Designations ─────────────────────────────────────────────────

  async findDesignationsByCompanyId(companyId: string) {
    return this.prisma.designation.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { level: 'desc' },
      include: { _count: { select: { employees: true } } },
    });
  }

  async findDesignationByCode(companyId: string, code: string) {
    return this.prisma.designation.findFirst({
      where: { companyId, code, deletedAt: null },
    });
  }

  async findDesignationById(id: string) {
    return this.prisma.designation.findUnique({ where: { id } });
  }

  async createDesignation(companyId: string, data: {
    title: string;
    code: string;
    level?: number;
    description?: string;
    minSalary?: number;
    maxSalary?: number;
    currency?: string;
  }) {
    return this.prisma.designation.create({
      data: { companyId, ...data },
    });
  }

  async updateDesignation(id: string, data: UpdateDesignationDto) {
    return this.prisma.designation.update({
      where: { id },
      data,
    });
  }

  async softDeleteDesignation(id: string) {
    return this.prisma.designation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
