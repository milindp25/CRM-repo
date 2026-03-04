'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api-client';
import { useAuthContext } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/toast';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import {
  Users, UserCheck, ClipboardList, DollarSign,
  Activity, Building2, Megaphone, Heart, Cake,
  UserPlus, Clock, ChevronRight, ArrowRight,
  FileCheck, CalendarCheck, Loader2, AlertCircle,
  Briefcase, Timer,
} from 'lucide-react';

// Lazy-load heavy components
const CalendarWidget = dynamic(
  () => import('./calendar-widget').then(mod => ({ default: mod.CalendarWidget })),
  { loading: () => <WidgetLoader /> }
);
const ActivityFeedComponent = dynamic(
  () => import('./activity-feed').then(mod => ({ default: mod.ActivityFeed })),
  { loading: () => <WidgetLoader /> }
);
const OrgChartComponent = dynamic(
  () => import('./org-chart').then(mod => ({ default: mod.OrgChart })),
  { loading: () => <WidgetLoader /> }
);

/* ─── Shared helpers ─────────────────────────────────── */

export function WidgetLoader() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function WidgetShell({ title, icon: Icon, linkHref, linkLabel, children }: {
  title: string;
  icon: React.ElementType;
  linkHref?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </h2>
        {linkHref && (
          <Link href={linkHref} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            {linkLabel || 'View all'} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <Icon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/* ─── Widget props (all accept optional GraphQL data) ── */

interface WidgetProps {
  data?: any;
}

/* ═══════════════════════════════════════════════════════
   1. Welcome Widget
   ═══════════════════════════════════════════════════════ */

export function WelcomeWidget(_props: WidgetProps) {
  const { user } = useAuthContext();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-6 text-white">
      <h2 className="text-xl font-bold">{greeting}, {user?.firstName || 'there'}!</h2>
      <p className="text-white/80 mt-1 text-sm">
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   2. Stats Overview Widget (Admin/HR/Manager)
   ═══════════════════════════════════════════════════════ */

export function StatsOverviewWidget({ data: gqlData }: WidgetProps) {
  const [stats, setStats] = useState({
    totalEmployees: 0, activeEmployees: 0,
    presentToday: 0, absentToday: 0, wfhToday: 0,
    pendingLeaves: 0, draftPayrolls: 0,
  });
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return; // GraphQL data provided, skip REST fetch
    (async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [empRes, attRes, leaveRes, payRes] = await Promise.allSettled([
          apiClient.getEmployees({ limit: 200 }),
          apiClient.getAttendance({ startDate: today, endDate: today }),
          apiClient.getLeave({ status: 'PENDING' }),
          apiClient.getPayroll({ take: 5 }),
        ]);
        setStats({
          totalEmployees: empRes.status === 'fulfilled' ? empRes.value.data.length : 0,
          activeEmployees: empRes.status === 'fulfilled' ? empRes.value.data.filter((e: any) => e.status === 'ACTIVE').length : 0,
          presentToday: attRes.status === 'fulfilled' ? attRes.value.data.filter((a: any) => a.status === 'PRESENT').length : 0,
          absentToday: attRes.status === 'fulfilled' ? attRes.value.data.filter((a: any) => a.status === 'ABSENT').length : 0,
          wfhToday: attRes.status === 'fulfilled' ? attRes.value.data.filter((a: any) => a.isWorkFromHome).length : 0,
          pendingLeaves: leaveRes.status === 'fulfilled' ? (leaveRes.value.meta?.totalItems ?? leaveRes.value.data.length) : 0,
          draftPayrolls: payRes.status === 'fulfilled' ? payRes.value.data.filter((p: any) => p.status === 'DRAFT').length : 0,
        });
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  // Use GraphQL data if provided
  const s = gqlData !== undefined ? {
    totalEmployees: gqlData?.totalEmployees ?? 0,
    activeEmployees: gqlData?.activeEmployees ?? 0,
    presentToday: gqlData?.presentToday ?? 0,
    absentToday: gqlData?.absentToday ?? 0,
    wfhToday: gqlData?.wfhToday ?? 0,
    pendingLeaves: gqlData?.pendingLeaves ?? 0,
    draftPayrolls: gqlData?.draftPayrolls ?? 0,
  } : stats;

  if (loading) return <WidgetLoader />;

  const attendanceRate = s.activeEmployees > 0 ? Math.round((s.presentToday / s.activeEmployees) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Employees" value={s.totalEmployees}
        subtitle={`${s.activeEmployees} active`} icon={Users} iconColor="blue"
        onClick={() => window.location.href = '/employees'} />
      <StatCard title="Present Today" value={s.presentToday}
        subtitle={s.wfhToday > 0 ? `${s.wfhToday} remote` : `${s.absentToday} absent`}
        icon={UserCheck} iconColor="green"
        trend={s.activeEmployees > 0 ? { value: attendanceRate, label: 'rate' } : undefined}
        onClick={() => window.location.href = '/attendance'} />
      <StatCard title="Time Off Requests" value={s.pendingLeaves}
        subtitle="Awaiting approval" icon={ClipboardList}
        iconColor={s.pendingLeaves > 0 ? 'amber' : 'green'}
        onClick={() => window.location.href = '/leave'} />
      <StatCard title="Draft Payrolls" value={s.draftPayrolls}
        subtitle="Ready to process" icon={DollarSign} iconColor="purple"
        onClick={() => window.location.href = '/payroll'} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3. My Attendance Widget (Employee view)
   ═══════════════════════════════════════════════════════ */

export function MyAttendanceWidget({ data: gqlData }: WidgetProps) {
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return;
    (async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await apiClient.getAttendance({ startDate: today, endDate: today });
        const records = res.data || [];
        setRecord(records.length > 0 ? records[0] : null);
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  // Use GraphQL data: myAttendance is an array, pick the first record
  const r = gqlData !== undefined
    ? (Array.isArray(gqlData) && gqlData.length > 0 ? gqlData[0] : null)
    : record;

  return (
    <WidgetShell title="My Attendance" icon={CalendarCheck} linkHref="/attendance" linkLabel="Mark Attendance">
      {loading ? <WidgetLoader /> : (
        <div className="p-5">
          {r ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge variant={getStatusVariant(r.status)} size="sm">{r.status}</StatusBadge>
              </div>
              {r.checkInTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Check In</span>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(r.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {r.checkOutTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Check Out</span>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(r.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {r.workHours != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hours</span>
                  <span className="text-sm font-semibold text-foreground">{Number(r.workHours).toFixed(1)}h</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <CalendarCheck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No attendance marked today</p>
              <Link href="/attendance" className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:text-primary/80 font-medium">
                Mark now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   4. My Leaves Widget (Employee view)
   ═══════════════════════════════════════════════════════ */

export function MyLeavesWidget({ data: gqlData }: WidgetProps) {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return;
    (async () => {
      try {
        const res = await apiClient.getLeave({ status: 'PENDING' });
        setLeaves((res.data || []).slice(0, 3));
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  const items = gqlData !== undefined ? (gqlData || []).slice(0, 3) : leaves;

  return (
    <WidgetShell title="My Leaves" icon={Briefcase} linkHref="/leave">
      {loading ? <WidgetLoader /> : (
        <div className="divide-y">
          {items.length === 0 ? (
            <EmptyState icon={Briefcase} message="No pending leave requests" />
          ) : (
            items.map((leave: any) => (
              <div key={leave.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <StatusBadge variant={getStatusVariant(leave.leaveType)} size="sm">
                    {leave.leaveType?.replace('_', ' ')}
                  </StatusBadge>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {leave.totalDays}d &middot; {new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <StatusBadge variant={getStatusVariant(leave.status)} size="sm">{leave.status}</StatusBadge>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   5. My Payslip Widget (Employee view)
   ═══════════════════════════════════════════════════════ */

export function MyPayslipWidget({ data: gqlData }: WidgetProps) {
  const [payslip, setPayslip] = useState<any>(null);
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return;
    (async () => {
      try {
        const res = await apiClient.getPayroll({ take: 1 });
        const records = res.data || [];
        setPayslip(records.length > 0 ? records[0] : null);
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  const p = gqlData !== undefined ? gqlData : payslip;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <WidgetShell title="Latest Payslip" icon={DollarSign} linkHref="/payroll/my-payslips">
      {loading ? <WidgetLoader /> : (
        <div className="p-5">
          {p ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Period</span>
                <span className="text-sm font-medium text-foreground">
                  {months[p.payPeriodMonth - 1]} {p.payPeriodYear}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Net Pay</span>
                <span className="text-lg font-bold text-foreground tabular-nums">
                  ₹{Number(p.netSalary || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge variant={getStatusVariant(p.status)} size="sm">{p.status}</StatusBadge>
              </div>
            </div>
          ) : (
            <EmptyState icon={DollarSign} message="No payslip available" />
          )}
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   6. Pending Approvals Widget (Manager/HR/Admin)
   Note: Has approve/reject actions that still use REST
   ═══════════════════════════════════════════════════════ */

export function PendingApprovalsWidget({ data: gqlData }: WidgetProps) {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(gqlData === undefined);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await apiClient.getLeave({ status: 'PENDING' });
      setLeaves((res.data || []).slice(0, 5));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (gqlData !== undefined) {
      setLeaves((gqlData || []).slice(0, 5));
      return;
    }
    fetchData();
  }, [gqlData]);

  const handleApprove = async (id: string) => {
    try {
      await apiClient.approveLeave(id);
      toast.success('Leave approved');
      await fetchData(); // Refetch via REST after mutation
    } catch (err: any) {
      toast.error('Failed', err.message || 'Could not approve leave');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.rejectLeave(id);
      toast.success('Leave rejected');
      await fetchData();
    } catch (err: any) {
      toast.error('Failed', err.message || 'Could not reject leave');
    }
  };

  return (
    <WidgetShell title="Time Off Requests" icon={FileCheck} linkHref="/leave">
      {loading ? <WidgetLoader /> : (
        <div className="divide-y">
          {leaves.length === 0 ? (
            <EmptyState icon={ClipboardList} message="No pending requests" />
          ) : (
            leaves.map(leave => (
              <div key={leave.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {leave.employee?.firstName} {leave.employee?.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge variant={getStatusVariant(leave.leaveType)} size="sm">
                      {leave.leaveType?.replace('_', ' ')}
                    </StatusBadge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {leave.totalDays}d &middot; {new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => handleApprove(leave.id)}
                    className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors">
                    Approve
                  </button>
                  <button onClick={() => handleReject(leave.id)}
                    className="text-xs px-3 py-1.5 border border-border text-foreground rounded-lg hover:bg-muted font-medium transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   7. Team Attendance Widget (Manager/HR/Admin)
   ═══════════════════════════════════════════════════════ */

export function TeamAttendanceWidget({ data: gqlData }: WidgetProps) {
  const [stats, setStats] = useState({ present: 0, absent: 0, wfh: 0, total: 0 });
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return;
    (async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [attRes, empRes] = await Promise.allSettled([
          apiClient.getAttendance({ startDate: today, endDate: today }),
          apiClient.getEmployees({ limit: 200 }),
        ]);
        const attendance = attRes.status === 'fulfilled' ? attRes.value.data : [];
        const employees = empRes.status === 'fulfilled' ? empRes.value.data : [];
        const activeCount = employees.filter((e: any) => e.status === 'ACTIVE').length;
        setStats({
          present: attendance.filter((a: any) => a.status === 'PRESENT').length,
          absent: attendance.filter((a: any) => a.status === 'ABSENT').length,
          wfh: attendance.filter((a: any) => a.isWorkFromHome).length,
          total: activeCount,
        });
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  const s = gqlData !== undefined ? {
    present: gqlData?.present ?? 0,
    absent: gqlData?.absent ?? 0,
    wfh: gqlData?.wfh ?? 0,
    total: gqlData?.total ?? 0,
  } : stats;

  return (
    <WidgetShell title="Today's Attendance" icon={CalendarCheck} linkHref="/attendance" linkLabel="Mark Attendance">
      {loading ? <WidgetLoader /> : (<div className="p-5">
        {s.total === 0 ? (
          <p className="text-sm text-muted-foreground">No employees to track yet</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Present: <strong className="text-foreground">{s.present}</strong></span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-muted-foreground">Absent: <strong className="text-foreground">{s.absent}</strong></span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-muted-foreground">Remote: <strong className="text-foreground">{s.wfh}</strong></span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-muted-foreground">Unmarked: <strong className="text-foreground">{Math.max(0, s.total - s.present - s.absent)}</strong></span>
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 flex overflow-hidden">
              {s.total > 0 && (
                <>
                  <div className="bg-green-500 h-2 transition-all duration-500" style={{ width: `${(s.present / s.total) * 100}%` }} />
                  <div className="bg-red-400 h-2 transition-all duration-500" style={{ width: `${(s.absent / s.total) * 100}%` }} />
                  <div className="bg-blue-400 h-2 transition-all duration-500" style={{ width: `${(s.wfh / s.total) * 100}%` }} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   8. Team Leaves Widget (Manager/HR/Admin)
   ═══════════════════════════════════════════════════════ */

export function TeamLeavesWidget({ data: gqlData }: WidgetProps) {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return;
    (async () => {
      try {
        const res = await apiClient.getLeave({ status: 'APPROVED' });
        const today = new Date();
        const upcoming = (res.data || []).filter((l: any) => new Date(l.endDate) >= today).slice(0, 5);
        setLeaves(upcoming);
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  const items = gqlData !== undefined ? (gqlData || []).slice(0, 5) : leaves;

  return (
    <WidgetShell title="Team on Leave" icon={Briefcase} linkHref="/leave">
      {loading ? <WidgetLoader /> : (
        <div className="divide-y">
          {items.length === 0 ? (
            <EmptyState icon={Briefcase} message="No one on leave" />
          ) : (
            items.map((leave: any) => (
              <div key={leave.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {leave.employee?.firstName} {leave.employee?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' – '}
                    {new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <StatusBadge variant={getStatusVariant(leave.leaveType)} size="sm">
                  {leave.leaveType?.replace('_', ' ')}
                </StatusBadge>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   9. Calendar Widget (Wrapper)
   ═══════════════════════════════════════════════════════ */

export function CalendarWidgetWrapper(_props: WidgetProps) {
  return (
    <div className="rounded-xl border bg-card p-5 h-full">
      <CalendarWidget />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   10. Activity Feed Widget
   ═══════════════════════════════════════════════════════ */

export function ActivityFeedWidget(_props: WidgetProps) {
  return (
    <WidgetShell title="Recent Activity" icon={Activity} linkHref="/audit-logs" linkLabel="View history">
      <div className="px-5 py-3">
        <ActivityFeedComponent limit={8} compact />
      </div>
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   11. Org Chart Widget
   ═══════════════════════════════════════════════════════ */

export function OrgChartWidget(_props: WidgetProps) {
  return (
    <WidgetShell title="Organization" icon={Building2} linkHref="/departments">
      <div className="px-5 py-3">
        <OrgChartComponent compact />
      </div>
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   12. Announcements Widget
   ═══════════════════════════════════════════════════════ */

export function AnnouncementsWidget({ data: gqlData }: WidgetProps) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return;
    (async () => {
      try {
        const res = await apiClient.request<any>('/social/announcements');
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setAnnouncements(list.slice(0, 3));
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  const items = gqlData !== undefined ? (gqlData || []).slice(0, 3) : announcements;

  return (
    <WidgetShell title="Announcements" icon={Megaphone} linkHref="/social">
      {loading ? <WidgetLoader /> : (
        <div className="divide-y">
          {items.length === 0 ? (
            <EmptyState icon={Megaphone} message="No announcements" />
          ) : (
            items.map((ann: any) => (
              <div key={ann.id} className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{ann.title}</p>
                  {ann.priority === 'IMPORTANT' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 font-semibold uppercase">
                      Important
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ann.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   13. Kudos Feed Widget
   ═══════════════════════════════════════════════════════ */

export function KudosFeedWidget({ data: gqlData }: WidgetProps) {
  const [kudos, setKudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return;
    (async () => {
      try {
        const res = await apiClient.request<any>('/social/kudos');
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setKudos(list.slice(0, 3));
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  const items = gqlData !== undefined ? (gqlData || []).slice(0, 3) : kudos;

  return (
    <WidgetShell title="Recognition" icon={Heart} linkHref="/social">
      {loading ? <WidgetLoader /> : (
        <div className="divide-y">
          {items.length === 0 ? (
            <EmptyState icon={Heart} message="No kudos yet" />
          ) : (
            items.map((k: any) => (
              <div key={k.id} className="px-5 py-3">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{k.sender?.firstName}</span>
                  {' → '}
                  <span className="font-medium">{k.recipient?.firstName}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{k.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   14. Birthdays & Anniversaries Widget
   ═══════════════════════════════════════════════════════ */

export function BirthdaysWidget({ data: gqlData }: WidgetProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return;
    (async () => {
      try {
        const res = await apiClient.getEmployees({ limit: 200 });
        const today = new Date();
        const thisMonth = today.getMonth();
        const upcoming = (res.data || []).filter((e: any) => {
          if (!e.dateOfBirth) return false;
          const dob = new Date(e.dateOfBirth);
          return dob.getMonth() === thisMonth;
        }).slice(0, 5);
        setEmployees(upcoming);
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  const items = gqlData !== undefined ? (gqlData || []).slice(0, 5) : employees;

  return (
    <WidgetShell title="Birthdays This Month" icon={Cake}>
      {loading ? <WidgetLoader /> : (
        <div className="divide-y">
          {items.length === 0 ? (
            <EmptyState icon={Cake} message="No birthdays this month" />
          ) : (
            items.map((emp: any) => (
              <div key={emp.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center">
                  <Cake className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-muted-foreground">
                    {emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   15. HR Analytics Widget (HR/Admin)
   ═══════════════════════════════════════════════════════ */

export function HRAnalyticsWidget({ data: gqlData }: WidgetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return;
    (async () => {
      try {
        const res = await apiClient.request<any>('/analytics/overview');
        setData(res);
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  const d = gqlData !== undefined ? gqlData : data;

  return (
    <WidgetShell title="HR Analytics" icon={Activity} linkHref="/analytics" linkLabel="Full analytics">
      {loading ? <WidgetLoader /> : (
        <div className="p-5">
          {d ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-foreground">{d.totalEmployees ?? 0}</p>
                <p className="text-xs text-muted-foreground">Headcount</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{d.attritionRate != null ? `${d.attritionRate}%` : (d.newHires ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{d.attritionRate != null ? 'Attrition' : 'New Hires'}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{d.terminations ?? d.openPositions ?? 0}</p>
                <p className="text-xs text-muted-foreground">{d.terminations != null ? 'Exits' : 'Open Roles'}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{d.openPositions ?? 0}</p>
                <p className="text-xs text-muted-foreground">Open Roles</p>
              </div>
            </div>
          ) : (
            <EmptyState icon={Activity} message="Analytics unavailable" />
          )}
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   16. Recruitment Pipeline Widget (HR/Admin)
   ═══════════════════════════════════════════════════════ */

export function RecruitmentPipelineWidget({ data: gqlData }: WidgetProps) {
  const [postings, setPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(gqlData === undefined);

  useEffect(() => {
    if (gqlData !== undefined) return;
    (async () => {
      try {
        const data = await apiClient.getJobPostings({ status: 'OPEN' });
        setPostings(data.slice(0, 4));
      } catch {} finally { setLoading(false); }
    })();
  }, [gqlData]);

  const items = gqlData !== undefined ? (gqlData || []).slice(0, 4) : postings;

  return (
    <WidgetShell title="Recruitment Pipeline" icon={UserPlus} linkHref="/recruitment">
      {loading ? <WidgetLoader /> : (
        <div className="divide-y">
          {items.length === 0 ? (
            <EmptyState icon={UserPlus} message="No open positions" />
          ) : (
            items.map((post: any) => (
              <div key={post.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.department?.name || post.department || 'No department'}</p>
                </div>
                <span className="text-xs text-muted-foreground">{post.applicantCount || post._count?.applicants || 0} applicants</span>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════════════
   Widget Registry Map
   ═══════════════════════════════════════════════════════ */

export const WIDGET_MAP: Record<string, React.ComponentType<WidgetProps>> = {
  welcome: WelcomeWidget,
  stats_overview: StatsOverviewWidget,
  my_attendance: MyAttendanceWidget,
  my_leaves: MyLeavesWidget,
  my_payslip: MyPayslipWidget,
  pending_approvals: PendingApprovalsWidget,
  team_attendance: TeamAttendanceWidget,
  team_leaves: TeamLeavesWidget,
  calendar: CalendarWidgetWrapper,
  activity_feed: ActivityFeedWidget,
  org_chart: OrgChartWidget,
  announcements: AnnouncementsWidget,
  kudos_feed: KudosFeedWidget,
  birthdays: BirthdaysWidget,
  hr_analytics: HRAnalyticsWidget,
  recruitment_pipeline: RecruitmentPipelineWidget,
};

/* ═══════════════════════════════════════════════════════
   Widget ID to GraphQL data key mapping
   ═══════════════════════════════════════════════════════ */

export const WIDGET_DATA_KEY: Record<string, string> = {
  stats_overview: 'statsOverview',
  my_attendance: 'myAttendance',
  my_leaves: 'myLeaves',
  my_payslip: 'myPayslip',
  pending_approvals: 'pendingApprovals',
  team_attendance: 'teamAttendance',
  team_leaves: 'teamLeaves',
  announcements: 'announcements',
  kudos_feed: 'kudos',
  birthdays: 'birthdays',
  hr_analytics: 'analyticsOverview',
  recruitment_pipeline: 'recruitmentPipeline',
  activity_feed: 'activityFeed',
};

/* ═══════════════════════════════════════════════════════
   Default Layout for Free Tier (no widget API)
   ═══════════════════════════════════════════════════════ */

export function getDefaultLayout(role?: string): Array<{ widgetId: string; order: number; visible: boolean; size: 'full' | 'half' }> {
  const base = [
    { widgetId: 'welcome', order: 0, visible: true, size: 'full' as const },
    { widgetId: 'my_attendance', order: 5, visible: true, size: 'half' as const },
    { widgetId: 'my_leaves', order: 6, visible: true, size: 'half' as const },
    { widgetId: 'calendar', order: 7, visible: true, size: 'half' as const },
    { widgetId: 'announcements', order: 8, visible: true, size: 'half' as const },
  ];

  if (role === 'COMPANY_ADMIN' || role === 'HR_ADMIN' || role === 'MANAGER') {
    return [
      { widgetId: 'welcome', order: 0, visible: true, size: 'full' as const },
      { widgetId: 'stats_overview', order: 1, visible: true, size: 'full' as const },
      { widgetId: 'pending_approvals', order: 2, visible: true, size: 'half' as const },
      { widgetId: 'team_attendance', order: 3, visible: true, size: 'half' as const },
      ...base.slice(1),
      { widgetId: 'activity_feed', order: 9, visible: true, size: 'half' as const },
      { widgetId: 'org_chart', order: 10, visible: true, size: 'half' as const },
    ];
  }

  return base;
}

/* ═══════════════════════════════════════════════════════
   Quick Action Card (reused from old dashboard)
   ═══════════════════════════════════════════════════════ */

export function QuickAction({
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
