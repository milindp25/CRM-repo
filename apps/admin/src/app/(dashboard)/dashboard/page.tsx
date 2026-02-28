'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, UserCheck, Loader2, AlertCircle } from 'lucide-react';
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

const tierColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-700',
  BASIC: 'bg-blue-100 text-blue-700',
  PROFESSIONAL: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700',
};

const statusColors: Record<string, string> = {
  TRIAL: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
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
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard data'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and metrics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Companies"
          value={data.totalCompanies}
          icon={<Building2 className="w-6 h-6" />}
          color="bg-blue-600"
        />
        <StatCard
          title="Total Users"
          value={data.totalUsers}
          icon={<Users className="w-6 h-6" />}
          color="bg-emerald-600"
        />
        <StatCard
          title="Total Employees"
          value={data.totalEmployees}
          icon={<UserCheck className="w-6 h-6" />}
          color="bg-purple-600"
        />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Tier */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Companies by Tier
          </h3>
          <div className="space-y-3">
            {data.companiesByTier.map(({ tier, count }) => (
              <div
                key={tier}
                className="flex items-center justify-between py-2"
              >
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tierColors[tier] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tier}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {count}
                </span>
              </div>
            ))}
            {data.companiesByTier.length === 0 && (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Companies by Status
          </h3>
          <div className="space-y-3">
            {data.companiesByStatus.map(({ status, count }) => (
              <div
                key={status}
                className="flex items-center justify-between py-2"
              >
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {status}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {count}
                </span>
              </div>
            ))}
            {data.companiesByStatus.length === 0 && (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Companies */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">
            Recent Companies
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-muted cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/companies/${company.id}`)
                  }
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {company.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground">{company.companyCode}</p>
                    </div>
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
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {data.recentCompanies.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    No companies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl ${color} text-white`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
