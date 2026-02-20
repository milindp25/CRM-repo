'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { apiClient, type Employee, type Leave, type Attendance, type Payroll } from '@/lib/api-client';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Building2, Activity, Loader2 } from 'lucide-react';

// Lazy load heavy dashboard widgets to reduce initial bundle
const ActivityFeed = dynamic(
  () => import('@/components/dashboard/activity-feed').then(mod => ({ default: mod.ActivityFeed })),
  { loading: () => <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> }
);
const CalendarWidget = dynamic(
  () => import('@/components/dashboard/calendar-widget').then(mod => ({ default: mod.CalendarWidget })),
  { loading: () => <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> }
);
const OrgChart = dynamic(
  () => import('@/components/dashboard/org-chart').then(mod => ({ default: mod.OrgChart })),
  { loading: () => <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> }
);

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  absentToday: number;
  wfhToday: number;
  pendingLeaves: number;
  draftPayrolls: number;
  processedPayrolls: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    wfhToday: 0,
    pendingLeaves: 0,
    draftPayrolls: 0,
    processedPayrolls: 0,
  });
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [recentPayrolls, setRecentPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setError('');
        }

        const [employeesRes, attendanceRes, leavesRes, payrollRes] = await Promise.allSettled([
          apiClient.getEmployees({ limit: 100 }),
          apiClient.getAttendance({ startDate: today, endDate: today }),
          apiClient.getLeave({ status: 'PENDING' }),
          apiClient.getPayroll({ take: 5 }),
        ]);

        if (!cancelled) {
          // Process employees
          if (employeesRes.status === 'fulfilled') {
            const employees = employeesRes.value.data;
            setStats(prev => ({
              ...prev,
              totalEmployees: employees.length,
              activeEmployees: employees.filter(e => e.status === 'ACTIVE').length,
            }));
          }

          // Process attendance
          if (attendanceRes.status === 'fulfilled') {
            const attendance = attendanceRes.value.data;
            setStats(prev => ({
              ...prev,
              presentToday: attendance.filter(a => a.status === 'PRESENT').length,
              absentToday: attendance.filter(a => a.status === 'ABSENT').length,
              wfhToday: attendance.filter(a => a.isWorkFromHome).length,
            }));
          }

          // Process leaves
          if (leavesRes.status === 'fulfilled') {
            const leaves = leavesRes.value.data;
            setPendingLeaves(leaves.slice(0, 5));
            setStats(prev => ({
              ...prev,
              pendingLeaves: leavesRes.value.meta.totalItems || leaves.length,
            }));
          }

          // Process payroll
          if (payrollRes.status === 'fulfilled') {
            const payrolls = payrollRes.value.data;
            setRecentPayrolls(payrolls);
            setStats(prev => ({
              ...prev,
              draftPayrolls: payrolls.filter(p => p.status === 'DRAFT').length,
              processedPayrolls: payrolls.filter(p => p.status === 'PROCESSED').length,
            }));
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [employeesRes, attendanceRes, leavesRes, payrollRes] = await Promise.allSettled([
        apiClient.getEmployees({ limit: 100 }),
        apiClient.getAttendance({ startDate: today, endDate: today }),
        apiClient.getLeave({ status: 'PENDING' }),
        apiClient.getPayroll({ take: 5 }),
      ]);

      if (employeesRes.status === 'fulfilled') {
        const employees = employeesRes.value.data;
        setStats(prev => ({
          ...prev,
          totalEmployees: employees.length,
          activeEmployees: employees.filter(e => e.status === 'ACTIVE').length,
        }));
      }

      if (attendanceRes.status === 'fulfilled') {
        const attendance = attendanceRes.value.data;
        setStats(prev => ({
          ...prev,
          presentToday: attendance.filter(a => a.status === 'PRESENT').length,
          absentToday: attendance.filter(a => a.status === 'ABSENT').length,
          wfhToday: attendance.filter(a => a.isWorkFromHome).length,
        }));
      }

      if (leavesRes.status === 'fulfilled') {
        const leaves = leavesRes.value.data;
        setPendingLeaves(leaves.slice(0, 5));
        setStats(prev => ({
          ...prev,
          pendingLeaves: leavesRes.value.meta.totalItems || leaves.length,
        }));
      }

      if (payrollRes.status === 'fulfilled') {
        const payrolls = payrollRes.value.data;
        setRecentPayrolls(payrolls);
        setStats(prev => ({
          ...prev,
          draftPayrolls: payrolls.filter(p => p.status === 'DRAFT').length,
          processedPayrolls: payrolls.filter(p => p.status === 'PROCESSED').length,
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id: string) => {
    try {
      await apiClient.approveLeave(id);
      toast.success('Leave approved', 'The leave request has been approved');
      await fetchDashboardData();
    } catch (err: any) {
      toast.error('Approval failed', err.message || 'Failed to approve leave');
    }
  };

  const handleRejectLeave = async (id: string) => {
    try {
      await apiClient.rejectLeave(id);
      toast.success('Leave rejected', 'The leave request has been rejected');
      await fetchDashboardData();
    } catch (err: any) {
      toast.error('Rejection failed', err.message || 'Failed to reject leave');
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const getPayrollStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-muted text-muted-foreground';
      case 'PROCESSED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PAID': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'HOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CASUAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      SICK: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      EARNED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      PRIVILEGE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      MATERNITY: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      PATERNITY: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      COMPENSATORY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      LOSS_OF_PAY: 'bg-muted text-muted-foreground',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={() => fetchDashboardData()} className="mb-6" />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          sub={`${stats.activeEmployees} active`}
          icon="👥"
          color="blue"
          href="/employees"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          sub={stats.wfhToday > 0 ? `${stats.wfhToday} WFH` : stats.absentToday > 0 ? `${stats.absentToday} absent` : 'All present'}
          icon="✅"
          color="green"
          href="/attendance"
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          sub="Awaiting approval"
          icon="📋"
          color={stats.pendingLeaves > 0 ? 'orange' : 'green'}
          href="/leave"
        />
        <StatCard
          title="Payroll Actions"
          value={stats.draftPayrolls + stats.processedPayrolls}
          sub={`${stats.draftPayrolls} draft · ${stats.processedPayrolls} to pay`}
          icon="💰"
          color={stats.draftPayrolls + stats.processedPayrolls > 0 ? 'purple' : 'green'}
          href="/payroll"
        />
      </div>

      {/* Two column layout: Leaves & Payroll */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Leave Approvals */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Pending Leave Approvals</h2>
            <Link href="/leave" className="text-sm text-primary hover:opacity-80">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {pendingLeaves.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                No pending leave requests
              </div>
            ) : (
              pendingLeaves.map(leave => (
                <div key={leave.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getLeaveTypeColor(leave.leaveType)}`}>
                        {leave.leaveType.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {leave.totalDays}d · {new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApproveLeave(leave.id)}
                      className="text-xs px-2.5 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectLeave(leave.id)}
                      className="text-xs px-2.5 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payroll */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Payroll</h2>
            <Link href="/payroll" className="text-sm text-primary hover:opacity-80">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentPayrolls.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                No payroll records yet
              </div>
            ) : (
              recentPayrolls.map(payroll => (
                <div key={payroll.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {payroll.employee?.firstName} {payroll.employee?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getMonthName(payroll.payPeriodMonth)} {payroll.payPeriodYear}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      ₹{payroll.netSalary.toFixed(0)}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getPayrollStatusColor(payroll.status)}`}>
                      {payroll.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Attendance Summary Bar */}
      <div className="bg-card rounded-xl border border-border shadow-sm mb-6 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Today&apos;s Attendance</h2>
          <Link href="/attendance" className="text-sm text-primary hover:opacity-80">
            Mark Attendance
          </Link>
        </div>
        {stats.totalEmployees === 0 ? (
          <p className="text-sm text-muted-foreground">No employees to track yet</p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-6 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                <span className="text-muted-foreground">Present: <strong className="text-foreground">{stats.presentToday}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                <span className="text-muted-foreground">Absent: <strong className="text-foreground">{stats.absentToday}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block"></span>
                <span className="text-muted-foreground">WFH: <strong className="text-foreground">{stats.wfhToday}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 inline-block"></span>
                <span className="text-muted-foreground">Not Marked: <strong className="text-foreground">{Math.max(0, stats.activeEmployees - stats.presentToday - stats.absentToday)}</strong></span>
              </span>
            </div>
            {stats.activeEmployees > 0 && (
              <div className="w-full bg-muted rounded-full h-2.5 flex overflow-hidden">
                <div className="bg-green-500 h-2.5 transition-all" style={{ width: `${(stats.presentToday / stats.activeEmployees) * 100}%` }} />
                <div className="bg-red-400 h-2.5 transition-all" style={{ width: `${(stats.absentToday / stats.activeEmployees) * 100}%` }} />
                <div className="bg-blue-400 h-2.5 transition-all" style={{ width: `${(stats.wfhToday / stats.activeEmployees) * 100}%` }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Three column layout: Calendar, Activity Feed, Org Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Calendar */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <CalendarWidget />
        </div>

        {/* Activity Feed */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Recent Activity</h2>
            </div>
            <Link href="/audit-logs" className="text-sm text-primary hover:opacity-80">
              View all
            </Link>
          </div>
          <div className="px-5 py-3">
            <ActivityFeed limit={8} compact />
          </div>
        </div>

        {/* Org Chart */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Organization</h2>
            </div>
            <Link href="/departments" className="text-sm text-primary hover:opacity-80">
              View all
            </Link>
          </div>
          <div className="px-5 py-3">
            <OrgChart compact />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/employees/new" icon="➕" label="Add Employee" color="blue" />
          <QuickAction href="/attendance" icon="📅" label="Mark Attendance" color="green" />
          <QuickAction href="/leave" icon="✅" label="Review Leaves" color="orange" badge={stats.pendingLeaves} />
          <QuickAction href="/payroll" icon="💰" label="Process Payroll" color="purple" badge={stats.draftPayrolls} />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function StatCard({
  title, value, sub, icon, color, href,
}: {
  title: string;
  value: number;
  sub: string;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  href: string;
}) {
  const colorMap = {
    blue:   { text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/40' },
    green:  { text: 'text-green-600 dark:text-green-400', border: 'border-green-100 dark:border-green-900/40' },
    orange: { text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-900/40' },
    purple: { text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900/40' },
  };
  const c = colorMap[color];

  return (
    <Link href={href} className={`bg-card rounded-xl border ${c.border} shadow-sm p-5 hover:shadow-md transition-shadow block`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${c.text}`}>{value}</span>
      </div>
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </Link>
  );
}

function QuickAction({
  href, icon, label, color, badge,
}: {
  href: string;
  icon: string;
  label: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  badge?: number;
}) {
  const colorMap = {
    blue:   'hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:border-blue-800',
    green:  'hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20 dark:hover:border-green-800',
    orange: 'hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-900/20 dark:hover:border-orange-800',
    purple: 'hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-900/20 dark:hover:border-purple-800',
  };

  return (
    <Link
      href={href}
      className={`relative bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-all ${colorMap[color]} shadow-sm hover:shadow-md`}
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}
