'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { HelpButton, HelpPanel } from '@/components/common/help-panel';
import { LanguageSwitcher } from '@/components/common/language-switcher';
import { Wifi, WifiOff } from 'lucide-react';

interface DashboardHeaderProps {
  wsConnected?: boolean;
}

export function DashboardHeader({ wsConnected }: DashboardHeaderProps) {
  const { user, logout, isAuthenticated } = useAuthContext();
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">HR</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <>
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">HR</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user.firstName}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* WebSocket connection indicator */}
              {wsConnected !== undefined && (
                <div
                  className="p-2"
                  title={wsConnected ? 'Real-time updates active' : 'Real-time updates disconnected'}
                >
                  {wsConnected ? (
                    <Wifi className="w-4 h-4 text-success" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              )}

              <LanguageSwitcher />
              <ThemeToggle />
              <HelpButton onClick={() => setHelpOpen(true)} />
              <NotificationBell />

              <div className="relative group ml-2">
                <button className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-ring rounded-lg p-1">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">{initials}</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      Company Settings
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Help Panel */}
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
