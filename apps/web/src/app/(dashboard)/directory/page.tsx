'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { PageContainer } from '@/components/ui/page-container';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import {
  Search, Users, Building2, Cake, CalendarHeart, Mail, Phone,
  UserCircle, PartyPopper,
} from 'lucide-react';

interface DirectoryEmployee {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  workPhone: string | null;
  department: { name: string } | null;
  designation: { title: string } | null;
  dateOfJoining: string;
}

export default function DirectoryPage() {
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [anniversaries, setAnniversaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'directory' | 'celebrations'>('directory');

  useEffect(() => {
    fetchDirectory();
    fetchCelebrations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchDirectory(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const data = await apiClient.request(`/social/directory?${params}`);
      setEmployees(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchCelebrations = async () => {
    try {
      const [bd, an] = await Promise.all([
        apiClient.request('/social/directory/birthdays'),
        apiClient.request('/social/directory/anniversaries'),
      ]);
      setBirthdays(Array.isArray(bd) ? bd : []);
      setAnniversaries(Array.isArray(an) ? an : []);
    } catch {}
  };

  const tabs = [
    { id: 'directory' as const, label: 'Directory', icon: Users },
    { id: 'celebrations' as const, label: 'Celebrations', icon: PartyPopper },
  ];

  const uniqueDepartments = new Set(employees.map(e => e.department?.name).filter(Boolean)).size;

  return (
    <PageContainer
      title="Employee Directory"
      description="Search and connect with your colleagues"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Directory' }]}
    >
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={fetchDirectory} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={employees.length} icon={Users} iconColor="blue" loading={loading} />
        <StatCard title="Departments" value={uniqueDepartments} icon={Building2} iconColor="purple" loading={loading} />
        <StatCard title="Birthdays This Month" value={birthdays.length} icon={Cake} iconColor="rose" loading={loading} />
        <StatCard title="Anniversaries" value={anniversaries.length} icon={CalendarHeart} iconColor="amber" loading={loading} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'directory' && (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Employee Grid */}
          {loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              <TableLoader rows={6} cols={3} />
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
              <UserCircle className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No employees found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {search ? `No results for "${search}". Try a different search term.` : 'No employees in the directory yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground truncate">{emp.firstName} {emp.lastName}</h3>
                      <p className="text-xs text-muted-foreground truncate">{emp.designation?.title || 'No designation'}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{emp.workEmail}</span>
                    </div>
                    {emp.workPhone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{emp.workPhone}</span>
                      </div>
                    )}
                    {emp.department && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{emp.department.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'celebrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Birthdays */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b bg-muted/30">
              <Cake className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <h2 className="text-sm font-semibold text-foreground">Birthdays This Month</h2>
              <span className="ml-auto text-xs text-muted-foreground">{birthdays.length}</span>
            </div>
            {birthdays.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Cake className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No birthdays this month</p>
              </div>
            ) : (
              <div className="divide-y">
                {birthdays.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400 text-xs font-medium flex-shrink-0">
                      {(b.first_name || b.firstName || '?')[0]}{(b.last_name || b.lastName || '?')[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground">{b.first_name || b.firstName} {b.last_name || b.lastName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {b.date_of_birth ? new Date(b.date_of_birth).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anniversaries */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b bg-muted/30">
              <CalendarHeart className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h2 className="text-sm font-semibold text-foreground">Work Anniversaries</h2>
              <span className="ml-auto text-xs text-muted-foreground">{anniversaries.length}</span>
            </div>
            {anniversaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarHeart className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No anniversaries this month</p>
              </div>
            ) : (
              <div className="divide-y">
                {anniversaries.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-medium flex-shrink-0">
                      {(a.first_name || a.firstName || '?')[0]}{(a.last_name || a.lastName || '?')[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground">{a.first_name || a.firstName} {a.last_name || a.lastName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {a.date_of_joining ? new Date(a.date_of_joining).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
