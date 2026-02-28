import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AdminRepository } from './admin.repository.js';
import { CreateCompanyDto } from './dto/index.js';

@Injectable()
export class AdminService {
  constructor(private readonly repository: AdminRepository) {}

  // ── Dashboard ──────────────────────────────────────────────────────

  async getDashboard() {
    const [
      totalCompanies,
      totalUsers,
      totalEmployees,
      companiesByTier,
      companiesByStatus,
      recentCompanies,
    ] = await Promise.all([
      this.repository.countCompanies(),
      this.repository.countUsers(),
      this.repository.countEmployees(),
      this.repository.countCompaniesByTier(),
      this.repository.countCompaniesByStatus(),
      this.repository.findRecentCompanies(5),
    ]);

    return {
      totalCompanies,
      totalUsers,
      totalEmployees,
      companiesByTier,
      companiesByStatus,
      recentCompanies,
    };
  }

  // ── Company Listing ────────────────────────────────────────────────

  async getCompanies(params: {
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
    tier?: string;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;

    const result = await this.repository.findCompanies({
      search: params.search,
      page,
      limit,
      status: params.status,
      tier: params.tier,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  // ── Company Detail ─────────────────────────────────────────────────

  async getCompanyById(id: string) {
    const company = await this.repository.findCompanyById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  // ── Company Update (activate/deactivate) ───────────────────────────

  async updateCompany(id: string, data: { isActive?: boolean; companyName?: string; email?: string; phone?: string; website?: string }) {
    const company = await this.repository.findCompanyById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return this.repository.updateCompany(id, data);
  }

  // ── Update Company Features ────────────────────────────────────────

  async updateCompanyFeatures(id: string, features: string[]) {
    const company = await this.repository.findCompanyById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return this.repository.updateCompanyFeatures(id, features);
  }

  // ── Update Company Subscription ────────────────────────────────────

  async updateCompanySubscription(
    id: string,
    data: { tier?: string; status?: string },
  ) {
    const company = await this.repository.findCompanyById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const updateData: { subscriptionTier?: string; subscriptionStatus?: string } = {};
    if (data.tier) {
      updateData.subscriptionTier = data.tier;
    }
    if (data.status) {
      updateData.subscriptionStatus = data.status;
    }

    return this.repository.updateCompanySubscription(id, updateData);
  }

  // ── Company Creation ──────────────────────────────────────────────

  async createCompany(dto: CreateCompanyDto) {
    // Check for duplicate company code
    const existing = await this.repository.findCompanyByCode(dto.companyCode);
    if (existing) {
      throw new ConflictException(`Company code "${dto.companyCode}" already exists`);
    }

    // Generate a temporary password
    const temporaryPassword = crypto.randomBytes(6).toString('base64url'); // ~8 chars
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // Default permissions for COMPANY_ADMIN
    const permissions = ['ALL'];

    const result = await this.repository.createCompanyWithAdmin({
      companyName: dto.companyName,
      companyCode: dto.companyCode,
      subscriptionTier: dto.subscriptionTier || 'FREE',
      subscriptionStatus: dto.subscriptionStatus || 'ACTIVE',
      logoUrl: dto.logoUrl,
      adminEmail: dto.adminEmail,
      adminFirstName: dto.adminFirstName,
      adminLastName: dto.adminLastName,
      adminPasswordHash: passwordHash,
      permissions,
    });

    return {
      company: result.company,
      adminUser: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      temporaryPassword,
    };
  }

  // ── Company Users ──────────────────────────────────────────────────

  async getCompanyUsers(companyId: string) {
    const company = await this.repository.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return this.repository.findUsersByCompanyId(companyId);
  }

  async deleteCompanyUser(companyId: string, userId: string, adminUserId: string) {
    const user = await this.repository.findUserById(userId);
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('User not found in this company');
    }
    await this.repository.softDeleteUser(userId);
    // Audit log for super admin action
    await this.repository.createAdminAuditLog({
      adminUserId,
      action: 'SUPER_ADMIN_DELETE_USER',
      targetUserId: userId,
      targetEmail: user.email,
      companyId,
      metadata: { role: user.role, email: user.email, firstName: user.firstName, lastName: user.lastName },
    });
    return { message: 'User deleted successfully' };
  }

  // ── Company Designations ─────────────────────────────────────────

  async getCompanyDesignations(companyId: string) {
    const company = await this.repository.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return this.repository.findDesignationsByCompanyId(companyId);
  }

  async createCompanyDesignation(
    companyId: string,
    data: {
      title: string;
      code: string;
      level?: number;
      description?: string;
      minSalary?: number;
      maxSalary?: number;
      currency?: string;
    },
  ) {
    const company = await this.repository.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    // Check for duplicate code within company
    const existing = await this.repository.findDesignationByCode(companyId, data.code);
    if (existing) {
      throw new ConflictException(`Designation code "${data.code}" already exists in this company`);
    }
    return this.repository.createDesignation(companyId, data);
  }

  async updateCompanyDesignation(
    companyId: string,
    designationId: string,
    data: Record<string, unknown>,
  ) {
    const company = await this.repository.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    const designation = await this.repository.findDesignationById(designationId);
    if (!designation || designation.companyId !== companyId) {
      throw new NotFoundException('Designation not found in this company');
    }
    return this.repository.updateDesignation(designationId, data);
  }

  async deleteCompanyDesignation(companyId: string, designationId: string) {
    const company = await this.repository.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    const designation = await this.repository.findDesignationById(designationId);
    if (!designation || designation.companyId !== companyId) {
      throw new NotFoundException('Designation not found in this company');
    }
    return this.repository.softDeleteDesignation(designationId);
  }
}
