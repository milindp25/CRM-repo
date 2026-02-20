'use client';

import { useState, useEffect } from 'react';
import { apiClient, type AuditLog } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';

const RESOURCE_TYPES = ['USER', 'EMPLOYEE', 'DEPARTMENT', 'DESIGNATION', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'COMPANY'];

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const TAKE = 20;
  const [skip, setSkip] = useState(0);

  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    userId: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [skip, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getAuditLogs({
        skip,
        take: TAKE,
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
        userId: filters.userId || undefined,
      });
      setLogs(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setSkip(0);
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const totalPages = Math.ceil(total / TAKE);
  const currentPage = Math.floor(skip / TAKE) + 1;

  return (
    <RoleGate requiredPermissions={[Permission.VIEW_AUDIT_LOGS]}>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track all actions performed in your company</p>
        </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Action</label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="e.g. USER_LOGIN"
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Resource Type</label>
            <select
              value={filters.resourceType}
              onChange={(e) => handleFilterChange('resourceType', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {RESOURCE_TYPES.map(rt => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">User ID</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="Filter by user ID"
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Resource ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted">
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.userEmail}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{formatAction(log.action)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                   <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">
                        {log.resourceType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono text-xs">
                      {log.resourceId ? log.resourceId.substring(0, 8) + '...' : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {log.success ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Success</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-foreground">
              Showing {skip + 1}–{Math.min(skip + TAKE, total)} of {total} logs
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSkip(Math.max(0, skip - TAKE))}
                disabled={skip === 0}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-muted-foreground">
             Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setSkip(skip + TAKE)}
                disabled={skip + TAKE >= total}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </RoleGate>
  );
}
