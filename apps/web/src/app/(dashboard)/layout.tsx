'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SubscriptionBanner } from '@/components/common/subscription-banner';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { navigation } from '@/lib/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { useFeatures } from '@/contexts/feature-context';
import { useWebSocket } from '@/hooks/use-websocket';
import { Menu, X } from 'lucide-react';
import type { Permission } from '@hrplatform/shared';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { hasAnyPermission } = usePermissions();
  const { hasFeature } = useFeatures();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

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

  const sidebarContent = (
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
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Subscription Banner */}
      <SubscriptionBanner />

      {/* Header */}
      <DashboardHeader
        wsConnected={wsConnected}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar-bg border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HR</span>
              </div>
              <span className="text-sidebar-text font-semibold">HRPlatform</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-sidebar-text hover:bg-muted transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-65px)]">
            {sidebarContent}
          </div>
        </aside>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 bg-sidebar-bg border-r border-sidebar-border min-h-screen sticky top-0">
          {sidebarContent}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
