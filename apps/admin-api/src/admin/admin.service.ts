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

  async updateCompany(id: string, data: { isActive?: boolean }) {
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
}
