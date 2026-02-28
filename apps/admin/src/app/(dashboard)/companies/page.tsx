'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
  Plus,
  X,
  CheckCircle,
  Copy,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { tierColors, statusColors } from '@/lib/constants';

const TIERS = ['', 'FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'];
const STATUSES = ['', 'TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'];

interface Company {
  id: string;
  companyName: string;
  companyCode: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: string;
  _count: { users: number; employees: number };
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Create Company modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState<{
    company: Record<string, unknown>;
    adminUser: { email: string; firstName: string; lastName: string; [key: string]: unknown };
    message?: string;
  } | null>(null);
  const [createForm, setCreateForm] = useState({
    companyName: '',
    companyCode: '',
    subscriptionTier: 'FREE',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    logoUrl: '',
  });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.getCompanies({
        search: search || undefined,
        tier: tier || undefined,
        status: status || undefined,
        page,
        limit: 10,
      });
      setCompanies(result.data);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load companies'
      );
    } finally {
      setLoading(false);
    }
  }, [search, tier, status, page]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, tier, status]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const result = await apiClient.createCompany({
        companyName: createForm.companyName,
        companyCode: createForm.companyCode,
        subscriptionTier: createForm.subscriptionTier,
        adminEmail: createForm.adminEmail,
        adminFirstName: createForm.adminFirstName,
        adminLastName: createForm.adminLastName,
        logoUrl: createForm.logoUrl || undefined,
      });
      setCreateSuccess(result);
      fetchCompanies();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setCreateLoading(false);
    }
  };

  const resetCreateModal = () => {
    setShowCreateModal(false);
    setCreateError('');
    setCreateSuccess(null);
    setCreateForm({
      companyName: '',
      companyCode: '',
      subscriptionTier: 'FREE',
      adminEmail: '',
      adminFirstName: '',
      adminLastName: '',
      logoUrl: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Manage all registered companies ({total} total)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Company
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-card"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t || 'All Tiers'}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-card"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || 'All Statuses'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Company Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Code
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Users
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Employees
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No companies found</p>
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => router.push(`/companies/${company.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">
                        {company.companyName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                      {company.companyCode}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          tierColors[company.subscriptionTier] ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {company.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusColors[company.subscriptionStatus] ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {company.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {company._count.users}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {company._count.employees}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({total} companies)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={resetCreateModal}>
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {createSuccess ? 'Company Created' : 'Create New Company'}
              </h2>
              <button onClick={resetCreateModal} className="p-1 rounded-lg hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {createSuccess ? (
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Company created successfully!</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {createSuccess.adminUser.firstName} {createSuccess.adminUser.lastName} ({createSuccess.adminUser.email}) has been set as the Company Admin.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Password Setup</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    The admin user should use the &quot;Forgot Password&quot; flow to set their password and access the portal.
                  </p>
                </div>

                <button
                  onClick={resetCreateModal}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
                {createError && (
                  <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 border-l-4 border-l-red-500 rounded-lg p-4">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{createError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      value={createForm.companyName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, companyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Company Code</label>
                    <input
                      type="text"
                      required
                      value={createForm.companyCode}
                      onChange={(e) => setCreateForm((f) => ({ ...f, companyCode: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
                      placeholder="ACME"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Subscription Tier</label>
                    <select
                      value={createForm.subscriptionTier}
                      onChange={(e) => setCreateForm((f) => ({ ...f, subscriptionTier: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-card"
                    >
                      <option value="FREE">Free</option>
                      <option value="BASIC">Basic</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                </div>

                <hr className="border-border" />
                <p className="text-sm font-medium text-foreground">Initial Admin User</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={createForm.adminFirstName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, adminFirstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={createForm.adminLastName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, adminLastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Doe"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Admin Email</label>
                    <input
                      type="email"
                      required
                      value={createForm.adminEmail}
                      onChange={(e) => setCreateForm((f) => ({ ...f, adminEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="admin@acme.com"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Logo URL (optional)</label>
                    <input
                      type="url"
                      value={createForm.logoUrl}
                      onChange={(e) => setCreateForm((f) => ({ ...f, logoUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetCreateModal}
                    className="flex-1 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      'Create Company'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
