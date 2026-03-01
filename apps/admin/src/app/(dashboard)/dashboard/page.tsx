'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, UserCheck, Loader2, AlertCircle, TrendingUp, Clock, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface DashboardData {
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
}

const tierBadge: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  BASIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PROFESSIONAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ENTERPRISE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const statusBadge: Record<string, string> = {
  TRIAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SUSPENDED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const result = await apiClient.getDashboard();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-6 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and metrics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Companies" value={data.totalCompanies} icon={Building2} color="blue" />
        <StatCard title="Total Users" value={data.totalUsers} icon={Users} color="green" />
        <StatCard title="Total Employees" value={data.totalEmployees} icon={UserCheck} color="purple" />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Companies by Tier</h3>
          <div className="space-y-2.5">
            {data.companiesByTier.map(({ tier, count }) => (
              <div key={tier} className="flex items-center justify-between py-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tierBadge[tier] || tierBadge.FREE}`}>
                  {tier}
                </span>
                <span className="text-sm font-semibold text-foreground">{count}</span>
              </div>
            ))}
            {data.companiesByTier.length === 0 && (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Companies by Status</h3>
          <div className="space-y-2.5">
            {data.companiesByStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between py-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[status] || statusBadge.CANCELLED}`}>
                  {status}
                </span>
                <span className="text-sm font-semibold text-foreground">{count}</span>
              </div>
            ))}
            {data.companiesByStatus.length === 0 && (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Companies */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-foreground">Recent Companies</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.recentCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => (window.location.href = `/companies/${company.id}`)}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{company.companyName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{company.companyCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tierBadge[company.subscriptionTier] || tierBadge.FREE}`}>
                      {company.subscriptionTier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[company.subscriptionStatus] || statusBadge.CANCELLED}`}>
                      {company.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {data.recentCompanies.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">No companies found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const iconColors: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-50 dark:bg-green-950/50', text: 'text-green-600 dark:text-green-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-600 dark:text-purple-400' },
};

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const c = iconColors[color] || iconColors.blue;
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
    </div>
  );
}
