'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { DashboardWidgetLayout } from '@/lib/api-client';
import { useAuthContext } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/use-permissions';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { WIDGET_MAP, getDefaultLayout, QuickAction } from '@/components/dashboard/dashboard-widgets';
import {
  Plus, CalendarCheck, FileCheck, DollarSign,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { isAtLeastRole } = usePermissions();
  const [layout, setLayout] = useState<DashboardWidgetLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');

        // Try the widget API (requires DASHBOARD_CONFIG feature)
        const [widgetsRes, configRes] = await Promise.allSettled([
          apiClient.getDashboardWidgets(),
          apiClient.getDashboardConfig(),
        ]);

        if (configRes.status === 'fulfilled' && configRes.value.layout?.length > 0) {
          // Use the API-provided layout (filters by role on the backend)
          setLayout(configRes.value.layout);
        } else {
          // Fallback to role-based defaults (FREE tier or API error)
          setLayout(getDefaultLayout(user?.role));
        }
      } catch {
        // Full fallback
        setLayout(getDefaultLayout(user?.role));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.role]);

  if (loading) return <PageLoader />;

  const visibleWidgets = layout
    .filter(l => l.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" data-tour="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {isAtLeastRole('MANAGER' as any) && (
          <div className="flex items-center gap-2">
            <Link
              href="/employees/new"
              className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </Link>
          </div>
        )}
      </div>

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError('')} />
      )}

      {/* Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleWidgets.map(item => {
          const Widget = WIDGET_MAP[item.widgetId];
          if (!Widget) return null;
          const isFullWidth = item.size === 'full';
          return (
            <div key={item.widgetId} className={isFullWidth ? 'lg:col-span-2' : ''}>
              <Widget />
            </div>
          );
        })}
      </div>

      {/* Quick Actions — only for Manager+ */}
      {isAtLeastRole('MANAGER' as any) && (
        <div>
          <h2 className="font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction href="/employees/new" icon={Plus} label="Add Employee" color="blue" />
            <QuickAction href="/attendance" icon={CalendarCheck} label="Mark Attendance" color="green" />
            <QuickAction href="/leave" icon={FileCheck} label="Review Time Off" color="amber" />
            <QuickAction href="/payroll" icon={DollarSign} label="Run Payroll" color="purple" />
          </div>
        </div>
      )}
    </div>
  );
}
