/**
 * Dashboard Layout
 * Shared layout for all dashboard pages with navigation sidebar
 */

'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Users, Calendar, Briefcase, DollarSign, Building2, Award, BarChart2, ClipboardList, Shield, Settings, UserCircle, ScrollText } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Designations', href: '/designations', icon: Award },
  { name: 'Attendance', href: '/attendance', icon: Calendar },
  { name: 'Leave', href: '/leave', icon: Briefcase },
  { name: 'Leave Balance', href: '/leave/balance', icon: ClipboardList },
  { name: 'Payroll', href: '/payroll', icon: DollarSign },
  { name: 'Reports', href: '/reports', icon: BarChart2 },
  { name: 'Users', href: '/users', icon: Shield },
  { name: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: UserCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen sticky top-0">
          <nav className="p-4 space-y-1" aria-label="Sidebar navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    active
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
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
