'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient, type Employee, type Leave, type Attendance, type Payroll } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';

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
  const toast = useToast();

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchDashboardData();
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
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'PROCESSED': return 'bg-blue-100 text-blue-700';
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'HOLD': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CASUAL: 'bg-blue-100 text-blue-700',
      SICK: 'bg-red-100 text-red-700',
      EARNED: 'bg-green-100 text-green-700',
      PRIVILEGE: 'bg-purple-100 text-purple-700',
      MATERNITY: 'bg-pink-100 text-pink-700',
      PATERNITY: 'bg-indigo-100 text-indigo-700',
      COMPENSATORY: 'bg-orange-100 text-orange-700',
      LOSS_OF_PAY: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
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

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Pending Leave Approvals */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Pending Leave Approvals</h2>
            <Link href="/leave" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingLeaves.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No pending leave requests
              </div>
            ) : (
              pendingLeaves.map(leave => (
                <div key={leave.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getLeaveTypeColor(leave.leaveType)}`}>
                        {leave.leaveType.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Payroll</h2>
            <Link href="/payroll" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentPayrolls.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No payroll records yet
              </div>
            ) : (
              recentPayrolls.map(payroll => (
                <div key={payroll.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payroll.employee?.firstName} {payroll.employee?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {getMonthName(payroll.payPeriodMonth)} {payroll.payPeriodYear}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Today&apos;s Attendance</h2>
          <Link href="/attendance" className="text-sm text-blue-600 hover:text-blue-700">
            Mark Attendance
          </Link>
        </div>
        {stats.totalEmployees === 0 ? (
          <p className="text-sm text-gray-400">No employees to track yet</p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-6 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                <span className="text-gray-600">Present: <strong>{stats.presentToday}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                <span className="text-gray-600">Absent: <strong>{stats.absentToday}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block"></span>
                <span className="text-gray-600">WFH: <strong>{stats.wfhToday}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
                <span className="text-gray-600">Not Marked: <strong>{Math.max(0, stats.activeEmployees - stats.presentToday - stats.absentToday)}</strong></span>
              </span>
            </div>
            {stats.activeEmployees > 0 && (
              <div className="w-full bg-gray-100 rounded-full h-2.5 flex overflow-hidden">
                <div
                  className="bg-green-500 h-2.5 transition-all"
                  style={{ width: `${(stats.presentToday / stats.activeEmployees) * 100}%` }}
                />
                <div
                  className="bg-red-400 h-2.5 transition-all"
                  style={{ width: `${(stats.absentToday / stats.activeEmployees) * 100}%` }}
                />
                <div
                  className="bg-blue-400 h-2.5 transition-all"
                  style={{ width: `${(stats.wfhToday / stats.activeEmployees) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
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
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  };
  const c = colorMap[color];

  return (
    <Link href={href} className={`bg-white rounded-xl border ${c.border} shadow-sm p-5 hover:shadow-md transition-shadow block`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${c.text}`}>{value}</span>
      </div>
      <p className="font-medium text-gray-800 text-sm">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
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
    blue:   'hover:bg-blue-50 hover:border-blue-200',
    green:  'hover:bg-green-50 hover:border-green-200',
    orange: 'hover:bg-orange-50 hover:border-orange-200',
    purple: 'hover:bg-purple-50 hover:border-purple-200',
  };

  return (
    <Link
      href={href}
      className={`relative bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-all ${colorMap[color]} shadow-sm hover:shadow-md`}
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}
