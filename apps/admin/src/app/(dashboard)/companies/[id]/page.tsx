'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  Users,
  UserCheck,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Trash2,
  Plus,
  Pencil,
  X,
  AlertTriangle,
  ChevronDown,
  Save,
  Check,
  DollarSign,
  Package,
  CreditCard,
  FileText,
  CheckCircle,
  Globe,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────

type Tab = 'overview' | 'users' | 'org-structure' | 'subscription' | 'features' | 'billing' | 'addons';

interface CompanyDetail {
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
}

interface CompanyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Designation {
  id: string;
  title: string;
  code: string;
  level: number;
  description: string | null;
  minSalary: string | null;
  maxSalary: string | null;
  currency: string;
  _count: { employees: number };
}

// ── Constants ──────────────────────────────────────────────────────────

const tierColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  BASIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  PROFESSIONAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  ENTERPRISE: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
};

const statusColors: Record<string, string> = {
  TRIAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  SUSPENDED: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  HR_ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  MANAGER: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
  EMPLOYEE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Entry',
  2: 'Junior',
  3: 'Mid',
  4: 'Senior',
  5: 'Lead',
  6: 'Manager',
  7: 'Director',
  8: 'VP',
  9: 'C-Level',
};

const EMPTY_DESIGNATION_FORM = {
  title: '',
  code: '',
  level: 3,
  description: '',
  minSalary: '',
  maxSalary: '',
  currency: 'USD',
};

// ── Main Page Component ────────────────────────────────────────────────

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const refreshCompany = useCallback(async () => {
    try {
      const result = await apiClient.getCompany(companyId);
      setCompany(result);
    } catch (err) {
      // silently fail on refresh
    }
  }, [companyId]);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const result = await apiClient.getCompany(companyId);
        setCompany(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load company'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/companies"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </Link>
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!company) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'org-structure', label: 'Org Structure' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'features', label: 'Features' },
    { key: 'billing', label: 'Billing' },
    { key: 'addons', label: 'Add-ons' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/companies"
          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {company.companyName}
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            {company.companyCode}
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            tierColors[company.subscriptionTier] ||
            'bg-gray-100 text-gray-700'
          }`}
        >
          {company.subscriptionTier}
        </span>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            statusColors[company.subscriptionStatus] ||
            'bg-gray-100 text-gray-700'
          }`}
        >
          {company.subscriptionStatus}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab company={company} companyId={companyId} onUpdate={refreshCompany} />}
      {activeTab === 'users' && <UsersTab companyId={companyId} />}
      {activeTab === 'org-structure' && (
        <OrgStructureTab companyId={companyId} />
      )}
      {activeTab === 'subscription' && company && <SubscriptionTab companyId={companyId} company={company} onUpdate={refreshCompany} />}
      {activeTab === 'features' && company && <FeaturesTab companyId={companyId} company={company} onUpdate={refreshCompany} />}
      {activeTab === 'billing' && <BillingTab companyId={companyId} />}
      {activeTab === 'addons' && <AddonsTab companyId={companyId} />}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────

function OverviewTab({ company, companyId, onUpdate }: { company: CompanyDetail; companyId: string; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: company.companyName,
    email: company.email || '',
    phone: company.phone || '',
    website: (company as any).website || '',
  });
  const [saving, setSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  const handleEditSave = async () => {
    setSaving(true);
    setEditError('');
    setEditSuccess('');
    try {
      await apiClient.updateCompany(companyId, {
        companyName: editForm.companyName,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        website: editForm.website || undefined,
      });
      setEditSuccess('Company updated successfully');
      setEditing(false);
      onUpdate();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditForm({
      companyName: company.companyName,
      email: company.email || '',
      phone: company.phone || '',
      website: (company as any).website || '',
    });
    setEditError('');
    setEditSuccess('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Company Info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            Company Information
          </h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          )}
        </div>

        {editSuccess && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">{editSuccess}</p>
          </div>
        )}
        {editError && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{editError}</p>
          </div>
        )}

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Company Name</label>
              <input
                type="text"
                value={editForm.companyName}
                onChange={(e) => setEditForm(f => ({ ...f, companyName: e.target.value }))}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Phone</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Website</label>
              <input
                type="text"
                value={editForm.website}
                onChange={(e) => setEditForm(f => ({ ...f, website: e.target.value }))}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="https://example.com"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="Company Name"
              value={company.companyName}
            />
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="Company Code"
              value={company.companyCode}
            />
            <InfoRow
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              value={company.email || 'Not provided'}
            />
            <InfoRow
              icon={<Phone className="w-4 h-4" />}
              label="Phone"
              value={company.phone || 'Not provided'}
            />
            <InfoRow
              icon={<Globe className="w-4 h-4" />}
              label="Website"
              value={(company as any).website || 'Not provided'}
            />
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Created"
              value={new Date(company.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold text-foreground">
                {company._count.users}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold text-foreground">
                {company._count.employees}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Summary */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-base font-semibold text-foreground mb-3">
            Subscription
          </h3>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                tierColors[company.subscriptionTier] ||
                'bg-gray-100 text-gray-700'
              }`}
            >
              {company.subscriptionTier}
            </span>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                statusColors[company.subscriptionStatus] ||
                'bg-gray-100 text-gray-700'
              }`}
            >
              {company.subscriptionStatus}
            </span>
          </div>
        </div>

        {/* Features Enabled */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-base font-semibold text-foreground mb-3">
            Features Enabled
          </h3>
          {company.featuresEnabled && company.featuresEnabled.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {company.featuresEnabled.map((feature) => (
                <span
                  key={feature}
                  className="px-2.5 py-1 bg-muted text-muted-foreground rounded-md text-xs font-medium"
                >
                  {feature.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No features explicitly enabled
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ── Users Tab ──────────────────────────────────────────────────────────

function UsersTab({ companyId }: { companyId: string }) {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managementMode, setManagementMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CompanyUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.getCompanyUsers(companyId);
      setUsers(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load users'
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchUsers();
    // Reset management mode when this tab mounts (tab switch)
    setManagementMode(false);
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: string) => {
    setDeleting(true);
    try {
      await apiClient.deleteCompanyUser(companyId, userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete user'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Company Users
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} user{users.length !== 1 ? 's' : ''} in this company
          </p>
        </div>
        <button
          onClick={() => setManagementMode((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            managementMode
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          {managementMode ? 'Disable User Management' : 'Enable User Management'}
        </button>
      </div>

      {/* Warning banner */}
      {managementMode && (
        <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            User management mode is active. All actions are audited and logged.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                {managementMode && (
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={managementMode ? 6 : 5}
                    className="px-6 py-12 text-center"
                  >
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">
                      No users found
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          roleColors[user.role] ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          user.isActive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    {managementMode && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteConfirm(user)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-md mx-4 border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Confirm User Deletion
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    This action is irreversible
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This will soft-delete the user and their access will be
                    revoked immediately.
                  </p>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground">
                    {deleteConfirm.firstName} {deleteConfirm.lastName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">
                    {deleteConfirm.email}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium text-foreground">
                    {deleteConfirm.role.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm.id)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    'Delete User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Org Structure Tab ──────────────────────────────────────────────────

function OrgStructureTab({ companyId }: { companyId: string }) {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDesignation, setEditingDesignation] =
    useState<Designation | null>(null);
  const [form, setForm] = useState(EMPTY_DESIGNATION_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState<Designation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDesignations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.getCompanyDesignations(companyId);
      // Sort by level descending (C-Level at top)
      const sorted = [...result].sort((a, b) => b.level - a.level);
      setDesignations(sorted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load designations'
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const openCreateModal = () => {
    setEditingDesignation(null);
    setForm(EMPTY_DESIGNATION_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (designation: Designation) => {
    setEditingDesignation(designation);
    setForm({
      title: designation.title,
      code: designation.code,
      level: designation.level,
      description: designation.description || '',
      minSalary: designation.minSalary || '',
      maxSalary: designation.maxSalary || '',
      currency: designation.currency || 'USD',
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDesignation(null);
    setForm(EMPTY_DESIGNATION_FORM);
    setFormError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    const payload: Record<string, unknown> = {
      title: form.title,
      code: form.code,
      level: Number(form.level),
      description: form.description || undefined,
      minSalary: form.minSalary ? Number(form.minSalary) : undefined,
      maxSalary: form.maxSalary ? Number(form.maxSalary) : undefined,
      currency: form.currency,
    };

    try {
      if (editingDesignation) {
        await apiClient.updateCompanyDesignation(
          companyId,
          editingDesignation.id,
          payload
        );
      } else {
        await apiClient.createCompanyDesignation(companyId, payload as {
          title: string;
          code: string;
          level?: number;
          description?: string;
          minSalary?: number;
          maxSalary?: number;
          currency?: string;
        });
      }
      closeModal();
      fetchDesignations();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to save designation'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (designationId: string) => {
    setDeleting(true);
    try {
      await apiClient.deleteCompanyDesignation(companyId, designationId);
      setDesignations((prev) => prev.filter((d) => d.id !== designationId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete designation'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Designation Management
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {designations.length} designation
            {designations.length !== 1 ? 's' : ''} defined
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Designation
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Designations Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Code
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Level
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Salary Range
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Employees
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {designations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">
                      No designations found
                    </p>
                  </td>
                </tr>
              ) : (
                designations.map((designation) => (
                  <tr
                    key={designation.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">
                        {designation.title}
                      </p>
                      {designation.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                          {designation.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                      {designation.code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs font-bold">
                          {designation.level}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {LEVEL_LABELS[designation.level] || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {designation.minSalary || designation.maxSalary ? (
                        <span>
                          {designation.currency}{' '}
                          {designation.minSalary
                            ? Number(designation.minSalary).toLocaleString()
                            : '---'}
                          {' - '}
                          {designation.maxSalary
                            ? Number(designation.maxSalary).toLocaleString()
                            : '---'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">
                          Not set
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-medium">
                      {designation._count.employees}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(designation)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit designation"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(designation)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          title="Delete designation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Designation Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={closeModal}>
          <div
            className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {editingDesignation
                  ? 'Edit Designation'
                  : 'Add New Designation'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {formError}
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
                    placeholder="e.g. VP"
                  />
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Level
                  </label>
                  <div className="relative">
                    <select
                      value={form.level}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          level: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm appearance-none"
                    >
                      {Object.entries(LEVEL_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {val} - {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                  placeholder="Optional description..."
                />
              </div>

              {/* Salary Range */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Salary Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={form.minSalary}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          minSalary: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Min salary"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={form.maxSalary}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          maxSalary: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Max salary"
                    />
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Currency
                </label>
                <div className="relative">
                  <select
                    value={form.currency}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        currency: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm appearance-none"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : editingDesignation ? (
                    'Update Designation'
                  ) : (
                    'Create Designation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-md mx-4 border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Delete Designation
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Are you sure you want to delete this designation?
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This will remove the designation. Employees assigned to it
                    may be affected.
                  </p>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium text-foreground">
                    {deleteConfirm.title}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Code</span>
                  <span className="font-medium text-foreground font-mono">
                    {deleteConfirm.code}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-medium text-foreground">
                    {deleteConfirm.level} -{' '}
                    {LEVEL_LABELS[deleteConfirm.level] || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Employees</span>
                  <span className="font-medium text-foreground">
                    {deleteConfirm._count.employees}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    'Delete Designation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subscription Tab ──────────────────────────────────────────────────

function SubscriptionTab({ companyId, company, onUpdate }: { companyId: string; company: CompanyDetail; onUpdate: () => void }) {
  const [tier, setTier] = useState(company.subscriptionTier);
  const [status, setStatus] = useState(company.subscriptionStatus);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.updateCompanySubscription(companyId, { tier, status });
      setSuccess('Subscription updated successfully');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">Manage Subscription</h3>

        {success && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Subscription Tier</label>
            <div className="relative">
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              >
                <option value="FREE">FREE</option>
                <option value="BASIC">BASIC</option>
                <option value="PROFESSIONAL">PROFESSIONAL</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Subscription Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              >
                <option value="TRIAL">TRIAL</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierColors[company.subscriptionTier] || 'bg-gray-100 text-gray-700'}`}>
              {company.subscriptionTier}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[company.subscriptionStatus] || 'bg-gray-100 text-gray-700'}`}>
              {company.subscriptionStatus}
            </span>
          </div>
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Features Tab ──────────────────────────────────────────────────────

function FeaturesTab({ companyId, company, onUpdate }: { companyId: string; company: CompanyDetail; onUpdate: () => void }) {
  const ALL_FEATURES = [
    { group: 'Core HR', features: ['EMPLOYEES', 'DEPARTMENTS', 'DESIGNATIONS', 'ATTENDANCE', 'LEAVE'] },
    { group: 'Financial', features: ['PAYROLL'] },
    { group: 'Analytics & Reporting', features: ['REPORTS', 'AUDIT_LOGS', 'ANALYTICS'] },
    { group: 'Documents & Workflows', features: ['DOCUMENTS', 'WORKFLOWS', 'CUSTOM_FIELDS'] },
    { group: 'Talent Management', features: ['PERFORMANCE', 'RECRUITMENT', 'TRAINING'] },
    { group: 'Operations', features: ['ASSETS', 'EXPENSES', 'SHIFTS', 'POLICIES'] },
    { group: 'Integrations', features: ['API_ACCESS', 'WEBHOOKS', 'SSO'] },
    { group: 'Advanced', features: ['OFFBOARDING', 'LEAVE_POLICIES', 'SURVEYS', 'DIRECTORY', 'TIME_TRACKING', 'CONTRACTORS', 'DASHBOARD_CONFIG'] },
  ];

  const allFeaturesList = ALL_FEATURES.flatMap(g => g.features);
  const [selected, setSelected] = useState<string[]>(company.featuresEnabled || []);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const toggle = (f: string) => setSelected(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const selectAll = () => setSelected([...allFeaturesList]);
  const clearAll = () => setSelected([]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.updateCompanyFeatures(companyId, selected);
      setSuccess('Features updated successfully');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-foreground">Manage Features</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-accent text-foreground rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-accent text-foreground rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {ALL_FEATURES.map((group) => (
            <div key={group.group}>
              <h4 className="text-sm font-semibold text-foreground mb-3">{group.group}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.features.map((feature) => (
                  <label
                    key={feature}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selected.includes(feature)
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-muted/50 border-border hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(feature)}
                      onChange={() => toggle(feature)}
                      className={`w-4 h-4 rounded focus:ring-blue-500 ${
                        selected.includes(feature) ? 'border-white text-white' : 'border-border text-blue-600'
                      }`}
                    />
                    <span className={`text-sm font-medium ${selected.includes(feature) ? 'text-white' : 'text-foreground'}`}>{feature.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {selected.length} of {allFeaturesList.length} features selected
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Features
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Billing Tab ───────────────────────────────────────────────────────

function BillingTab({ companyId }: { companyId: string }) {
  const [billing, setBilling] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [assigningPlan, setAssigningPlan] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [billingData, invoiceData, planData] = await Promise.all([
        apiClient.getCompanyBilling(companyId).catch(() => null),
        apiClient.getCompanyInvoices(companyId).catch(() => []),
        apiClient.getBillingPlans().catch(() => []),
      ]);
      setBilling(billingData);
      setInvoices(Array.isArray(invoiceData) ? invoiceData : (invoiceData as any)?.data || []);
      setPlans(Array.isArray(planData) ? planData : (planData as any)?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignPlan = async () => {
    if (!selectedPlan) return;
    setAssigningPlan(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.assignBillingPlan(companyId, selectedPlan);
      setSuccess('Billing plan assigned successfully');
      setSelectedPlan('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign plan');
    } finally {
      setAssigningPlan(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.generateInvoice(companyId);
      setSuccess('Invoice generated successfully');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    setError('');
    setSuccess('');
    try {
      await apiClient.updateInvoiceStatus(invoiceId, newStatus);
      setSuccess('Invoice status updated');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const invoiceStatusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
    PAID: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
    CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    VOID: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Current Plan Info */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Current Plan</h3>
        </div>
        {billing?.billing ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="text-sm font-medium text-foreground">{billing.billing.billingPlan?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Billing Cycle</p>
              <p className="text-sm font-medium text-foreground">{billing.billing.billingCycle}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Total</p>
              <p className="text-sm font-medium text-foreground">${Number(billing.billing.monthlyTotal || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Next Billing</p>
              <p className="text-sm font-medium text-foreground">
                {billing.billing.nextBillingDate
                  ? new Date(billing.billing.nextBillingDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No billing plan assigned</p>
        )}
      </div>

      {/* Assign Plan */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Assign Billing Plan</h3>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Select Plan</label>
            <div className="relative">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              >
                <option value="">Choose a plan...</option>
                {plans.filter(p => p.isActive).map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.tier}) - ${Number(plan.basePrice).toFixed(2)}/mo
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <button
            onClick={handleAssignPlan}
            disabled={!selectedPlan || assigningPlan}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigningPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Assign Plan
          </button>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">Invoices</h3>
          </div>
          <button
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate Invoice
          </button>
        </div>

        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No invoices found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-foreground">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">${Number(invoice.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${invoiceStatusColors[invoice.status] || 'bg-gray-100 text-gray-700'}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <select
                          value={invoice.status}
                          onChange={(e) => handleUpdateInvoiceStatus(invoice.id, e.target.value)}
                          className="bg-background border border-input rounded px-2 py-1 text-xs text-foreground appearance-none pr-6 cursor-pointer"
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID</option>
                          <option value="OVERDUE">OVERDUE</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="VOID">VOID</option>
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add-ons Tab ───────────────────────────────────────────────────────

function AddonsTab({ companyId }: { companyId: string }) {
  const [companyAddons, setCompanyAddons] = useState<any[]>([]);
  const [allAddons, setAllAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activating, setActivating] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [caData, allData] = await Promise.all([
        apiClient.getCompanyAddons(companyId).catch(() => []),
        apiClient.getAddons().catch(() => []),
      ]);
      setCompanyAddons(Array.isArray(caData) ? caData : (caData as any)?.data || []);
      setAllAddons(Array.isArray(allData) ? allData : (allData as any)?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load add-ons');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeAddonIds = companyAddons.map(ca => ca.featureAddon?.id).filter(Boolean);
  const availableAddons = allAddons.filter(a => a.isActive && !activeAddonIds.includes(a.id));

  const handleActivate = async (featureAddonId: string) => {
    setActivating(featureAddonId);
    setError('');
    setSuccess('');
    try {
      await apiClient.activateAddonForCompany(companyId, featureAddonId);
      setSuccess('Add-on activated successfully');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to activate add-on');
    } finally {
      setActivating(null);
    }
  };

  const handleDeactivate = async (addonId: string) => {
    setDeactivating(addonId);
    setError('');
    setSuccess('');
    try {
      await apiClient.deactivateAddonForCompany(companyId, addonId);
      setSuccess('Add-on deactivated successfully');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate add-on');
    } finally {
      setDeactivating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Active Add-ons */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Active Add-ons</h3>
          <span className="ml-auto text-sm text-muted-foreground">{companyAddons.length} active</span>
        </div>

        {companyAddons.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No active add-ons</p>
        ) : (
          <div className="space-y-3">
            {companyAddons.map((ca) => (
              <div key={ca.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{ca.featureAddon?.name || 'Unknown'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{ca.featureAddon?.feature?.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">${Number(ca.featureAddon?.price || 0).toFixed(2)}/mo</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ca.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {ca.status}
                    </span>
                  </div>
                  {ca.expiresAt && (
                    <p className="text-xs text-muted-foreground mt-1">Expires: {new Date(ca.expiresAt).toLocaleDateString()}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeactivate(ca.id)}
                  disabled={deactivating === ca.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
                >
                  {deactivating === ca.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Deactivate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Add-ons */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Available Add-ons</h3>
          <span className="ml-auto text-sm text-muted-foreground">{availableAddons.length} available</span>
        </div>

        {availableAddons.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No additional add-ons available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableAddons.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{addon.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{addon.feature?.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-medium text-foreground">${Number(addon.price).toFixed(2)}/mo</span>
                  </div>
                  {addon.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">{addon.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleActivate(addon.id)}
                  disabled={activating === addon.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {activating === addon.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Activate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
