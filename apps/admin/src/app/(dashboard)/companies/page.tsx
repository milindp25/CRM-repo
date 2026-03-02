'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Building2, Plus, X, CheckCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { tierColors, statusColors } from '@/lib/constants';

const TIERS = ['', 'FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'];
const STATUSES = ['', 'TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'];

const inputClass = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

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
    companyName: '', companyCode: '', subscriptionTier: 'FREE',
    adminEmail: '', adminFirstName: '', adminLastName: '', logoUrl: '',
  });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.getCompanies({
        search: search || undefined, tier: tier || undefined,
        status: status || undefined, page, limit: 10,
      });
      setCompanies(result.data);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [search, tier, status, page]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { setPage(1); }, [search, tier, status]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const result = await apiClient.createCompany({
        companyName: createForm.companyName, companyCode: createForm.companyCode,
        subscriptionTier: createForm.subscriptionTier, adminEmail: createForm.adminEmail,
        adminFirstName: createForm.adminFirstName, adminLastName: createForm.adminLastName,
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
    setCreateForm({ companyName: '', companyCode: '', subscriptionTier: 'FREE', adminEmail: '', adminFirstName: '', adminLastName: '', logoUrl: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground mt-1">Manage all registered companies ({total} total)</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Create Company
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
          </div>
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
            {TIERS.map((t) => (<option key={t} value={t}>{t || 'All Tiers'}</option>))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
            {STATUSES.map((s) => (<option key={s} value={s}>{s || 'All Statuses'}</option>))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Company Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Users</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Employees</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No companies found</p>
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => router.push(`/companies/${company.id}`)}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{company.companyName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{company.companyCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tierColors[company.subscriptionTier] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {company.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[company.subscriptionStatus] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {company.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{company._count.users}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{company._count.employees}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(company.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} companies)</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="h-9 px-3 rounded-lg border border-input hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-9 px-3 rounded-lg border border-input hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={resetCreateModal}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-foreground">
                {createSuccess ? 'Company Created' : 'Create New Company'}
              </h2>
              <button onClick={resetCreateModal} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {createSuccess ? (
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 p-4">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Company created successfully!</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {createSuccess.adminUser.firstName} {createSuccess.adminUser.lastName} ({createSuccess.adminUser.email}) has been set as the Company Admin.
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Password Setup</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    The admin user should use the &quot;Forgot Password&quot; flow to set their password and access the portal.
                  </p>
                </div>
                <button onClick={resetCreateModal} className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
                {createError && (
                  <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3">
                    <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">{createError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Company Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={createForm.companyName} onChange={(e) => setCreateForm((f) => ({ ...f, companyName: e.target.value }))} className={inputClass} placeholder="Acme Corp" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Company Code <span className="text-red-500">*</span></label>
                    <input type="text" required value={createForm.companyCode} onChange={(e) => setCreateForm((f) => ({ ...f, companyCode: e.target.value.toUpperCase() }))} className={`${inputClass} font-mono`} placeholder="ACME" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Subscription Tier</label>
                    <select value={createForm.subscriptionTier} onChange={(e) => setCreateForm((f) => ({ ...f, subscriptionTier: e.target.value }))} className={inputClass}>
                      <option value="FREE">Free</option>
                      <option value="BASIC">Basic</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-foreground mb-3">Initial Admin User</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">First Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={createForm.adminFirstName} onChange={(e) => setCreateForm((f) => ({ ...f, adminFirstName: e.target.value }))} className={inputClass} placeholder="John" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Last Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={createForm.adminLastName} onChange={(e) => setCreateForm((f) => ({ ...f, adminLastName: e.target.value }))} className={inputClass} placeholder="Doe" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Admin Email <span className="text-red-500">*</span></label>
                      <input type="email" required value={createForm.adminEmail} onChange={(e) => setCreateForm((f) => ({ ...f, adminEmail: e.target.value }))} className={inputClass} placeholder="admin@acme.com" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Logo URL</label>
                      <input type="url" value={createForm.logoUrl} onChange={(e) => setCreateForm((f) => ({ ...f, logoUrl: e.target.value }))} className={inputClass} placeholder="https://example.com/logo.png" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={resetCreateModal} className="flex-1 h-10 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button type="submit" disabled={createLoading} className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                    {createLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>) : 'Create Company'}
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
