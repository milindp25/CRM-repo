'use client';

import { useMemo, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SubscriptionBanner } from '@/components/common/subscription-banner';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { navigation } from '@/lib/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { useFeatures } from '@/contexts/feature-context';
import { useWebSocket } from '@/hooks/use-websocket';
import type { Permission } from '@hrplatform/shared';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { hasAnyPermission } = usePermissions();
  const { hasFeature } = useFeatures();

  // WebSocket connection for real-time updates
  const handleNotification = useCallback((data: any) => {
    // Notifications are handled by the notification bell component
    // This is a placeholder for future real-time update handling
  }, []);

  const { connected: wsConnected } = useWebSocket({
    onNotification: handleNotification,
  });

  const filteredNavigation = useMemo(() => {
    return navigation.filter((item) => {
      if (item.alwaysVisible) return true;

      // Check role-based permissions
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        if (!hasAnyPermission(item.requiredPermissions as Permission[])) return false;
      }

      // Check feature flag
      if (item.requiredFeature) {
        if (!hasFeature(item.requiredFeature)) return false;
      }

      return true;
    });
  }, [hasAnyPermission, hasFeature]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Subscription Banner */}
      <SubscriptionBanner />

      {/* Header */}
      <DashboardHeader wsConnected={wsConnected} />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar-bg border-r border-sidebar-border min-h-screen sticky top-0">
          <nav className="p-4 space-y-1" aria-label="Sidebar navigation">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    active
                      ? 'text-sidebar-active bg-sidebar-active-bg'
                      : 'text-sidebar-text hover:bg-muted'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
