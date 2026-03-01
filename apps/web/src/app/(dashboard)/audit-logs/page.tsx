'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, type AuditLog } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorBanner, EmptyState } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import { formatDate } from '@/lib/format-date';
import {
  Download, ScrollText, CheckCircle2, XCircle, Filter,
  ChevronLeft, ChevronRight, Loader2, FileText, ChevronDown,
} from 'lucide-react';

const RESOURCE_TYPES = ['USER', 'EMPLOYEE', 'DEPARTMENT', 'DESIGNATION', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'COMPANY', 'DOCUMENT', 'WORKFLOW'];

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  USER: 'User Account',
  EMPLOYEE: 'Employee',
  DEPARTMENT: 'Department',
  DESIGNATION: 'Job Title',
  ATTENDANCE: 'Attendance',
  LEAVE: 'Time Off',
  PAYROLL: 'Payroll',
  COMPANY: 'Company',
  DOCUMENT: 'Document',
  WORKFLOW: 'Approval',
};

const ACTION_TYPES = [
  'USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTERED', 'USER_SSO_LOGIN',
  'CREATE', 'UPDATE', 'DELETE',
  'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_DELETED',
  'LEAVE_CREATED', 'LEAVE_APPROVED', 'LEAVE_REJECTED',
  'PAYROLL_PROCESSED',
];

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const TAKE = 20;
  const [skip, setSkip] = useState(0);

  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getAuditLogs({
        skip,
        take: TAKE,
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
        userId: filters.userId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setLogs(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [skip, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (field: string, value: string) => {
    setSkip(0);
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = `/v1/audit-logs/export/csv${queryString ? `?${queryString}` : ''}`;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch(`${baseUrl}${url}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setSkip(0);
    setFilters({ action: '', resourceType: '', userId: '', startDate: '', endDate: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const totalPages = Math.ceil(total / TAKE);
  const currentPage = Math.floor(skip / TAKE) + 1;

  const successCount = logs.filter(l => l.success).length;
  const failedCount = logs.filter(l => !l.success).length;

  const [filtersOpen, setFiltersOpen] = useState(true);

  const inputClass = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

  return (
    <RoleGate requiredPermissions={[Permission.VIEW_AUDIT_LOGS]}>
      <PageContainer
        title="Activity History"
        description="See what's been happening across your company"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Activity History' },
        ]}
        actions={
          <button
            onClick={handleExportCsv}
            disabled={exporting || total === 0}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Activities" value={total} icon={ScrollText} iconColor="blue" loading={loading} />
          <StatCard title="Successful" value={successCount} subtitle="on this page" icon={CheckCircle2} iconColor="green" loading={loading} />
          <StatCard title="Failed" value={failedCount} subtitle="on this page" icon={XCircle} iconColor="rose" loading={loading} />
        </div>

        {/* Filters (collapsible on mobile) */}
        <div className="rounded-xl border bg-card p-4">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 w-full md:cursor-default"
            aria-expanded={filtersOpen}
          >
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-muted-foreground ml-auto transition-transform md:hidden ${filtersOpen ? 'rotate-180' : ''}`} />
            {hasActiveFilters && (
              <button
                onClick={(e) => { e.stopPropagation(); handleClearFilters(); }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground underline transition-colors hidden md:block"
              >
                Clear all
              </button>
            )}
          </button>
          <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-3 ${filtersOpen ? '' : 'hidden md:grid'}`}>
            <div>
              <label htmlFor="audit-filter-action" className="block text-xs font-medium text-muted-foreground mb-1.5">Action</label>
              <select
                id="audit-filter-action"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className={inputClass}
              >
                <option value="">All Actions</option>
                {ACTION_TYPES.map(a => (
                  <option key={a} value={a}>{formatAction(a)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="audit-filter-category" className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
              <select
                id="audit-filter-category"
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className={inputClass}
              >
                <option value="">All Categories</option>
                {RESOURCE_TYPES.map(rt => (
                  <option key={rt} value={rt}>{RESOURCE_TYPE_LABELS[rt] || rt}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="audit-filter-from" className="block text-xs font-medium text-muted-foreground mb-1.5">From Date</label>
              <input
                id="audit-filter-from"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="audit-filter-to" className="block text-xs font-medium text-muted-foreground mb-1.5">To Date</label>
              <input
                id="audit-filter-to"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="audit-filter-user" className="block text-xs font-medium text-muted-foreground mb-1.5">User</label>
              <input
                id="audit-filter-user"
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="Filter by user"
                className={inputClass}
              />
            </div>
            {/* Mobile clear button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors md:hidden"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} onRetry={fetchLogs} onDismiss={() => setError('')} />}

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {loading ? (
            <TableLoader rows={8} cols={6} />
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-10 w-10" />}
              title="No activity found"
              description={hasActiveFilters ? 'Try adjusting your filters.' : 'Activity will show up here as your team starts using the platform.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Record</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt, { time: true })}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{log.userEmail}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{formatAction(log.action)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant="neutral">{RESOURCE_TYPE_LABELS[log.resourceType] || log.resourceType}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono text-xs">
                        {log.resourceId ? log.resourceId.substring(0, 8) + '...' : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={log.success ? 'success' : 'error'} dot>
                          {log.success ? 'Success' : 'Failed'}
                        </StatusBadge>
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
              <p className="text-sm text-muted-foreground">
                Showing {skip + 1}&ndash;{Math.min(skip + TAKE, total)} of {total} logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSkip(Math.max(0, skip - TAKE))}
                  disabled={skip === 0}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="px-2 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setSkip(skip + TAKE)}
                  disabled={skip + TAKE >= total}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </RoleGate>
  );
}
