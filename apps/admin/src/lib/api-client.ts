// Tenant API - used only for authentication (login)
const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// Admin API - used for all admin operations
const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:4001/v1';

interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

class AdminApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_access_token');
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('admin_access_token', token);
    // Set session flag cookie for middleware (actual auth via httpOnly cookie)
    document.cookie = `admin_has_session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }

  private removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('admin_access_token');
    document.cookie = 'admin_has_session=; path=/; max-age=0';
    // Clear legacy cookie
    document.cookie = 'admin_access_token=; path=/; max-age=0';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useAuthApi = false,
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = useAuthApi ? AUTH_BASE_URL : ADMIN_API_BASE_URL;
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          message: `Request failed with status ${response.status}`,
          statusCode: response.status,
        };
      }

      if (response.status === 401) {
        this.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      throw new Error(errorData.message || 'An unexpected error occurred');
    }

    const json = await response.json();
    // Both tenant API and admin-api wrap responses in { data: ... }
    return (json.data !== undefined ? json.data : json) as T;
  }

  // ── Auth (uses tenant API) ─────────────────────────────────────────

  async login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; user: Record<string, unknown> }> {
    const data = await this.request<{
      accessToken: string;
      user: Record<string, unknown>;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, true);

    if (data.user?.role !== 'SUPER_ADMIN') {
      throw new Error('Access denied. Super Admin privileges required.');
    }

    this.setToken(data.accessToken);
    return data;
  }

  logout(): void {
    this.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // ── Dashboard (admin-api) ──────────────────────────────────────────

  async getDashboard(): Promise<{
    totalCompanies: number;
    totalUsers: number;
    totalEmployees: number;
    companiesByTier: { tier: string; count: number }[];
    companiesByStatus: { status: string; count: number }[];
    recentCompanies: Array<{
      id: string;
      companyName: string;
      companyCode: string;
      subscriptionTier: string;
      subscriptionStatus: string;
      createdAt: string;
    }>;
  }> {
    return this.request('/admin/dashboard');
  }

  // ── Companies (admin-api) ──────────────────────────────────────────

  async getCompanies(
    filters: {
      search?: string;
      tier?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    data: Array<{
      id: string;
      companyName: string;
      companyCode: string;
      subscriptionTier: string;
      subscriptionStatus: string;
      createdAt: string;
      _count: { users: number; employees: number };
    }>;
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.tier) params.set('tier', filters.tier);
    if (filters.status) params.set('status', filters.status);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const query = params.toString();
    return this.request(`/admin/companies${query ? `?${query}` : ''}`);
  }

  async getCompany(id: string): Promise<{
    id: string;
    companyName: string;
    companyCode: string;
    email: string;
    phone: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    featuresEnabled: string[];
    createdAt: string;
    updatedAt: string;
    _count: { users: number; employees: number };
  }> {
    return this.request(`/admin/companies/${id}`);
  }

  async updateCompany(
    id: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.request(`/admin/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateCompanyFeatures(
    id: string,
    features: string[]
  ): Promise<Record<string, unknown>> {
    return this.request(`/admin/companies/${id}/features`, {
      method: 'PATCH',
      body: JSON.stringify({ features }),
    });
  }

  async updateCompanySubscription(
    id: string,
    data: { tier?: string; status?: string }
  ): Promise<Record<string, unknown>> {
    return this.request(`/admin/companies/${id}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getCompanyUsers(
    id: string
  ): Promise<
    Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      isActive: boolean;
      createdAt: string;
    }>
  > {
    return this.request(`/admin/companies/${id}/users`);
  }

  // ── Feature Add-ons (admin-api) ────────────────────────────────────

  async getAddons(): Promise<Array<{
    id: string;
    feature: string;
    name: string;
    description: string | null;
    price: string;
    yearlyPrice: string | null;
    isActive: boolean;
    createdAt: string;
    _count: { companyAddons: number };
  }>> {
    return this.request('/addons');
  }

  async createAddon(data: {
    feature: string;
    name: string;
    description?: string;
    price: number;
    yearlyPrice?: number;
  }): Promise<Record<string, unknown>> {
    return this.request('/addons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAddon(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      yearlyPrice?: number;
      isActive?: boolean;
    }
  ): Promise<Record<string, unknown>> {
    return this.request(`/addons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deactivateAddon(id: string): Promise<Record<string, unknown>> {
    return this.request(`/addons/${id}`, { method: 'DELETE' });
  }

  async getCompanyAddons(companyId: string): Promise<Array<{
    id: string;
    status: string;
    activatedAt: string;
    expiresAt: string | null;
    featureAddon: {
      id: string;
      feature: string;
      name: string;
      price: string;
    };
  }>> {
    return this.request(`/addons/companies/${companyId}`);
  }

  async activateAddonForCompany(
    companyId: string,
    featureAddonId: string,
    expiresAt?: string
  ): Promise<Record<string, unknown>> {
    return this.request(`/addons/companies/${companyId}`, {
      method: 'POST',
      body: JSON.stringify({ featureAddonId, expiresAt }),
    });
  }

  async deactivateAddonForCompany(
    companyId: string,
    addonId: string
  ): Promise<Record<string, unknown>> {
    return this.request(`/addons/companies/${companyId}/${addonId}`, {
      method: 'DELETE',
    });
  }

  // ── Billing Plans (admin-api) ──────────────────────────────────────

  async getBillingPlans(): Promise<Array<{
    id: string;
    name: string;
    tier: string;
    basePrice: string;
    yearlyBasePrice: string | null;
    pricePerEmployee: string;
    pricePerUser: string;
    includedEmployees: number;
    includedUsers: number;
    isActive: boolean;
    _count: { companyBillings: number };
  }>> {
    return this.request('/billing/plans');
  }

  async createBillingPlan(data: {
    name: string;
    tier: string;
    basePrice: number;
    yearlyBasePrice?: number;
    pricePerEmployee: number;
    pricePerUser: number;
    includedEmployees?: number;
    includedUsers?: number;
  }): Promise<Record<string, unknown>> {
    return this.request('/billing/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBillingPlan(
    id: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.request(`/billing/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ── Company Billing (admin-api) ────────────────────────────────────

  async getCompanyBilling(companyId: string): Promise<{
    companyId: string;
    hasBilling: boolean;
    billing: {
      id: string;
      billingCycle: string;
      currentEmployees: number;
      currentUsers: number;
      monthlyTotal: string;
      nextBillingDate: string | null;
      billingPlan: {
        name: string;
        tier: string;
        basePrice: string;
        pricePerEmployee: string;
        pricePerUser: string;
        includedEmployees: number;
        includedUsers: number;
      };
    } | null;
  }> {
    return this.request(`/companies/${companyId}/billing`);
  }

  async assignBillingPlan(
    companyId: string,
    billingPlanId: string,
    billingCycle?: string
  ): Promise<Record<string, unknown>> {
    return this.request(`/companies/${companyId}/billing`, {
      method: 'POST',
      body: JSON.stringify({ billingPlanId, billingCycle }),
    });
  }

  // ── Invoices (admin-api) ───────────────────────────────────────────

  async getCompanyInvoices(companyId: string): Promise<Array<{
    id: string;
    invoiceNumber: string;
    periodStart: string;
    periodEnd: string;
    baseAmount: string;
    employeeAmount: string;
    userAmount: string;
    addonAmount: string;
    totalAmount: string;
    status: string;
    employeeCount: number;
    userCount: number;
    issuedAt: string;
    dueDate: string;
    paidAt: string | null;
  }>> {
    return this.request(`/companies/${companyId}/invoices`);
  }

  async generateInvoice(companyId: string): Promise<Record<string, unknown>> {
    return this.request(`/companies/${companyId}/invoices/generate`, {
      method: 'POST',
    });
  }

  async updateInvoiceStatus(
    invoiceId: string,
    status: string
  ): Promise<Record<string, unknown>> {
    return this.request(`/invoices/${invoiceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ── Revenue (admin-api) ────────────────────────────────────────────

  async getRevenueSummary(): Promise<{
    mrr: number;
    arr: number;
    baseMRR: number;
    addonMRR: number;
    revenueByTier: { tier: string; amount: number }[];
    totalCompaniesWithBilling: number;
    totalActiveAddons: number;
    invoicesSummary: {
      totalPaid: number;
      paidCount: number;
      totalPending: number;
      pendingCount: number;
    };
  }> {
    return this.request('/billing/revenue');
  }
}

export const apiClient = new AdminApiClient();
