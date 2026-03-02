'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SubscriptionBanner } from '@/components/common/subscription-banner';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { navigation } from '@/lib/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { useFeatures } from '@/contexts/feature-context';
import { useWebSocket } from '@/hooks/use-websocket';
import { useLocale } from '@/contexts/locale-context';
import { useAuthContext } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { Menu, X } from 'lucide-react';
import type { Permission } from '@hrplatform/shared';
import { TourProvider } from '@/components/tour/tour-provider';
import { TourButton } from '@/components/tour/tour-button';
import { CommandPalette } from '@/components/command-palette/command-palette';
import { KeyboardShortcutsHelp } from '@/components/common/keyboard-shortcuts-help';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasAnyPermission } = usePermissions();
  const { hasFeature } = useFeatures();
  const { t } = useLocale();
  const { user } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keyboard shortcuts (vim-style sequences like g-d, g-e, etc.)
  useKeyboardShortcuts();

  // Onboarding guard — redirect to /onboarding if not completed
  // Covers: new registration (1B), incomplete onboarding re-prompt on login (1C)
  // Role-aware: COMPANY_ADMIN checks company onboarding, others check user onboarding (1D)
  useEffect(() => {
    if (!user || pathname === '/onboarding') return;

    // SUPER_ADMIN bypasses onboarding
    if (user.role === 'SUPER_ADMIN') return;

    // Check sessionStorage cache to avoid API call on every navigation
    const cacheKey = `onboarding-checked-${user.companyId}-${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached === 'completed') return;

    async function checkOnboarding() {
      try {
        if (user!.role === 'COMPANY_ADMIN') {
          // Company admin checks company-level onboarding
          const status = await apiClient.get<{ completed: boolean; currentStep: number }>('/company/onboarding');
          if (status.completed) {
            sessionStorage.setItem(cacheKey, 'completed');
          } else {
            router.push('/onboarding');
          }
        } else {
          // Invited users check user-level onboarding
          const status = await apiClient.get<{ completed: boolean }>('/company/onboarding/user');
          if (status.completed) {
            sessionStorage.setItem(cacheKey, 'completed');
          } else {
            router.push('/onboarding');
          }
        }
      } catch {
        // If API fails, skip guard gracefully
      }
    }

    checkOnboarding();
  }, [user, pathname, router]);

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
    <nav className="p-3 space-y-0.5" aria-label="Sidebar navigation" data-tour="sidebar-nav">
      {filteredNavigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            data-tour={`nav-${item.href.replace(/\//g, '')}`}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              active
                ? 'text-sidebar-active bg-sidebar-active-bg shadow-sm'
                : 'text-sidebar-text hover:bg-muted hover:text-foreground'
            }`}
            aria-current={active ? 'page' : undefined}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{item.nameKey ? t(item.nameKey) : item.name}</span>
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

      <TourProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
        >
          Skip to main content
        </a>
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
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
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
          <aside className="hidden lg:flex lg:flex-col w-64 bg-sidebar-bg border-r border-sidebar-border/70 min-h-screen sticky top-0" data-tour="sidebar">
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
            <div className="p-3 border-t border-sidebar-border" id="sidebar-footer" data-tour="sidebar-footer">
              <TourButton />
            </div>
          </aside>

          {/* Main Content */}
          <main id="main-content" className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </TourProvider>

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Keyboard Shortcuts Help Modal (? key) */}
      <KeyboardShortcutsHelp />
    </div>
  );
}
