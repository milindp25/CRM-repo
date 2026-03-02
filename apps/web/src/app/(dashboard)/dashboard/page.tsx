'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { apiClient, type Leave, type Payroll } from '@/lib/api-client';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import {
  Users, UserCheck, CalendarCheck, ClipboardList,
  DollarSign, TrendingUp, Loader2, Activity, Building2,
  Plus, Clock, ChevronRight, ArrowRight, FileCheck,
} from 'lucide-react';

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
    totalEmployees: 0, activeEmployees: 0,
    presentToday: 0, absentToday: 0, wfhToday: 0,
    pendingLeaves: 0, draftPayrolls: 0, processedPayrolls: 0,
  });
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [recentPayrolls, setRecentPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const today = new Date().toISOString().split('T')[0];

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  if (loading) return <PageLoader />;

  const attendanceRate = stats.activeEmployees > 0
    ? Math.round((stats.presentToday / stats.activeEmployees) * 100)
    : 0;

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
        <div className="flex items-center gap-2">
          <Link
            href="/employees/new"
            className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </Link>
        </div>
      </div>

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={fetchDashboardData} />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children" data-tour="dashboard-stats">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          subtitle={`${stats.activeEmployees} active`}
          icon={Users}
          iconColor="blue"
          onClick={() => window.location.href = '/employees'}
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          subtitle={stats.wfhToday > 0 ? `${stats.wfhToday} remote today` : `${stats.absentToday} absent`}
          icon={UserCheck}
          iconColor="green"
          trend={stats.activeEmployees > 0 ? { value: attendanceRate, label: 'attendance rate' } : undefined}
          onClick={() => window.location.href = '/attendance'}
        />
        <StatCard
          title="Time Off Requests"
          value={stats.pendingLeaves}
          subtitle="Awaiting approval"
          icon={ClipboardList}
          iconColor={stats.pendingLeaves > 0 ? 'amber' : 'green'}
          onClick={() => window.location.href = '/leave'}
        />
        <StatCard
          title="Payroll"
          value={stats.draftPayrolls + stats.processedPayrolls}
          subtitle={`${stats.draftPayrolls} pending, ${stats.processedPayrolls} ready`}
          icon={DollarSign}
          iconColor="purple"
          onClick={() => window.location.href = '/payroll'}
        />
      </div>

      {/* Attendance bar */}
      <div className="rounded-xl border bg-card p-5" data-tour="attendance-overview">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            Today&apos;s Attendance
          </h2>
          <Link href="/attendance" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            Mark Attendance <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {stats.activeEmployees === 0 ? (
          <p className="text-sm text-muted-foreground">No employees to track yet</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Present: <strong className="text-foreground">{stats.presentToday}</strong></span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-muted-foreground">Absent: <strong className="text-foreground">{stats.absentToday}</strong></span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-muted-foreground">Working from Home: <strong className="text-foreground">{stats.wfhToday}</strong></span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-muted-foreground">No Status Yet: <strong className="text-foreground">{Math.max(0, stats.activeEmployees - stats.presentToday - stats.absentToday)}</strong></span>
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 flex overflow-hidden">
              <div className="bg-green-500 h-2 transition-all duration-500" style={{ width: `${(stats.presentToday / stats.activeEmployees) * 100}%` }} />
              <div className="bg-red-400 h-2 transition-all duration-500" style={{ width: `${(stats.absentToday / stats.activeEmployees) * 100}%` }} />
              <div className="bg-blue-400 h-2 transition-all duration-500" style={{ width: `${(stats.wfhToday / stats.activeEmployees) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Two column: Leaves & Payroll */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Approvals */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-500" />
              Time Off Requests
            </h2>
            <Link href="/leave" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y">
            {pendingLeaves.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <ClipboardList className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              pendingLeaves.map(leave => (
                <div key={leave.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge variant={getStatusVariant(leave.leaveType)} size="sm">
                        {leave.leaveType.replace('_', ' ')}
                      </StatusBadge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {leave.totalDays}d &middot; {new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleApproveLeave(leave.id)}
                      className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectLeave(leave.id)}
                      className="text-xs px-3 py-1.5 border border-border text-foreground rounded-lg hover:bg-muted font-medium transition-colors"
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
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-500" />
              Recent Payroll
            </h2>
            <Link href="/payroll" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y">
            {recentPayrolls.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <DollarSign className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No payroll records yet</p>
              </div>
            ) : (
              recentPayrolls.map(payroll => (
                <div key={payroll.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {payroll.employee?.firstName} {payroll.employee?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getMonthName(payroll.payPeriodMonth)} {payroll.payPeriodYear}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      ₹{payroll.netSalary.toFixed(0)}
                    </p>
                    <StatusBadge variant={getStatusVariant(payroll.status)} size="sm">
                      {payroll.status}
                    </StatusBadge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Three column: Calendar, Activity, Org Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <CalendarWidget />
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Recent Activity</h2>
            </div>
            <Link href="/audit-logs" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              View history <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="px-5 py-3">
            <ActivityFeed limit={8} compact />
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Organization</h2>
            </div>
            <Link href="/departments" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
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
          <QuickAction href="/employees/new" icon={Plus} label="Add Employee" color="blue" />
          <QuickAction href="/attendance" icon={CalendarCheck} label="Mark Attendance" color="green" />
          <QuickAction href="/leave" icon={FileCheck} label="Review Time Off" color="amber" badge={stats.pendingLeaves} />
          <QuickAction href="/payroll" icon={DollarSign} label="Run Payroll" color="purple" badge={stats.draftPayrolls} />
        </div>
      </div>
    </div>
  );
}

/* ── Quick Action Card ─────────────────────────────────── */

function QuickAction({
  href, icon: Icon, label, color, badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  color: 'blue' | 'green' | 'amber' | 'purple';
  badge?: number;
}) {
  const hoverColors = {
    blue: 'hover:border-blue-300 dark:hover:border-blue-800',
    green: 'hover:border-green-300 dark:hover:border-green-800',
    amber: 'hover:border-amber-300 dark:hover:border-amber-800',
    purple: 'hover:border-purple-300 dark:hover:border-purple-800',
  };
  const iconBg = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
  };

  return (
    <Link
      href={href}
      className={`relative rounded-xl border bg-card p-4 flex flex-col items-center gap-3 text-center transition-all hover:shadow-md hover:-translate-y-0.5 ${hoverColors[color]}`}
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}
