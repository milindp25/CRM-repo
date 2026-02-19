import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminRepository } from './admin.repository';

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

  // ── Company Users ──────────────────────────────────────────────────

  async getCompanyUsers(companyId: string) {
    const company = await this.repository.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return this.repository.findUsersByCompanyId(companyId);
  }
}
