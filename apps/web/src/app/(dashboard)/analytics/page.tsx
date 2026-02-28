'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, TrendingDown, Calendar, Clock, DollarSign, Heart, Briefcase, GraduationCap,
  BarChart3, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';

// ── Color palette ───────────────────────────────────────────────────
const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Types ───────────────────────────────────────────────────────────
interface OverviewData {
  totalEmployees: number;
  activeEmployees: number;
  attritionRate: number;
  avgTenureMonths: number;
  pendingLeaves: number;
  todayAttendance: { present: number; total: number } | number;
  openPositions: number;
  monthlyPayrollCost: number;
}

// ── Shared Components ───────────────────────────────────────────────
function KpiCard({ label, value, subtitle, icon: Icon, trend }: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: any;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      {Icon && (
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && <TrendIcon className={`w-4 h-4 ${trendColor}`} />}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <BarChart3 className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Overview Tab ────────────────────────────────────────────────────
function OverviewTab({ data }: { data: OverviewData }) {
  const attendance = typeof data.todayAttendance === 'object'
    ? `${data.todayAttendance.present}/${data.todayAttendance.total}`
    : data.todayAttendance;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard icon={Users} label="Total Employees" value={data.totalEmployees} />
      <KpiCard icon={Users} label="Active Employees" value={data.activeEmployees} trend="up" subtitle={`${((data.activeEmployees / Math.max(data.totalEmployees, 1)) * 100).toFixed(0)}% active`} />
      <KpiCard icon={TrendingDown} label="Attrition Rate" value={`${(data.attritionRate || 0).toFixed(1)}%`} subtitle="Last 12 months" trend={data.attritionRate > 15 ? 'down' : 'neutral'} />
      <KpiCard icon={Clock} label="Avg Tenure" value={`${((data.avgTenureMonths || 0) / 12).toFixed(1)} yrs`} />
      <KpiCard icon={Calendar} label="Pending Leaves" value={data.pendingLeaves} />
      <KpiCard icon={Users} label="Today Attendance" value={attendance} />
      <KpiCard icon={Briefcase} label="Open Positions" value={data.openPositions} />
      <KpiCard icon={DollarSign} label="Monthly Payroll" value={`$${(data.monthlyPayrollCost || 0).toLocaleString()}`} />
    </div>
  );
}

// ── Headcount Tab ───────────────────────────────────────────────────
function HeadcountTab({ data }: { data: any }) {
  if (!data) return <EmptyState />;
  const deptData = data.current?.byDepartment || [];
  const trendData = (data.trends || []).map((t: any) => ({
    ...t,
    label: `${MONTH_NAMES[t.month - 1]} ${t.year}`,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard icon={Users} label="Total Headcount" value={data.current?.total || 0} />
        <KpiCard icon={Users} label="Departments" value={deptData.length} subtitle="with active employees" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Headcount by Department">
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="departmentName" type="category" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Employees" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>
        <ChartCard title="Headcount Trend">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" name="Employees" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No trend data available" />}
        </ChartCard>
      </div>
    </div>
  );
}

// ── Attrition Tab ───────────────────────────────────────────────────
function AttritionTab({ data }: { data: any }) {
  if (!data) return <EmptyState />;
  const trendData = (data.monthlyTrend || []).map((t: any) => ({
    ...t,
    label: `${MONTH_NAMES[t.month - 1]} ${t.year}`,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={TrendingDown} label="Attrition Rate" value={`${(data.attritionRate || 0).toFixed(1)}%`} trend={data.attritionRate > 15 ? 'down' : 'neutral'} />
        <KpiCard icon={Users} label="Total Leavers" value={data.totalLeavers || 0} subtitle={`out of ${data.totalEmployees || 0}`} />
        <KpiCard icon={Users} label="Total Employees" value={data.totalEmployees || 0} />
        <KpiCard icon={Calendar} label="Period" value={`${data.periodMonths || 12} months`} />
      </div>
      <ChartCard title="Monthly Attrition Trend">
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="attritionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="rate" name="Attrition Rate %" stroke="#ef4444" fill="url(#attritionGradient)" strokeWidth={2} />
              <Line type="monotone" dataKey="leavers" name="Leavers" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyState message="No attrition trend data" />}
      </ChartCard>
    </div>
  );
}

// ── Leave Tab ───────────────────────────────────────────────────────
function LeaveTab({ data }: { data: any }) {
  if (!data) return <EmptyState />;
  const utilization = data.utilizationByType || [];
  const pieData = utilization.map((item: any) => ({
    name: item.leaveType,
    value: item.totalDays,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard icon={Calendar} label="Pending Requests" value={data.pendingCount || 0} />
        <KpiCard icon={Calendar} label="Leave Types" value={utilization.length} />
        <KpiCard icon={Calendar} label="Total Days Used" value={utilization.reduce((sum: number, u: any) => sum + (u.totalDays || 0), 0)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Leave Days by Type">
          {utilization.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="leaveType" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="approved" name="Approved" fill="#22c55e" stackId="a" />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" stackId="a" />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>
        <ChartCard title="Distribution by Type">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>
      </div>
    </div>
  );
}

// ── Attendance Tab ──────────────────────────────────────────────────
function AttendanceTab({ data }: { data: any }) {
  if (!data) return <EmptyState />;
  const statusData = data.statusBreakdown || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Clock} label="Total Records" value={data.totalRecords || 0} subtitle={`${MONTH_NAMES[(data.month || 1) - 1]} ${data.year || ''}`} />
        <KpiCard icon={Clock} label="Absent Count" value={data.absentCount || 0} />
        <KpiCard icon={Clock} label="Absenteeism Rate" value={`${(data.absenteeismRate || 0).toFixed(1)}%`} trend={data.absenteeismRate > 10 ? 'down' : 'neutral'} />
        <KpiCard icon={Clock} label="Avg Hours Worked" value={`${(data.avgHoursWorked || 0).toFixed(1)}h`} />
      </div>
      <ChartCard title="Attendance Status Breakdown">
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="status" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                {statusData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </ChartCard>
    </div>
  );
}

// ── Payroll Tab ─────────────────────────────────────────────────────
function PayrollTab({ data }: { data: any }) {
  if (!data) return <EmptyState />;
  const monthlyCosts = (data.monthlyCosts || []).map((m: any) => ({
    ...m,
    label: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
    total: (m.totalDeductions || 0) + (m.totalEmployerContributions || 0),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard icon={DollarSign} label="Total Records" value={data.totalRecords || 0} />
        <KpiCard icon={DollarSign} label="Months Covered" value={monthlyCosts.length} />
        <KpiCard icon={DollarSign} label="Total Costs"
          value={`$${monthlyCosts.reduce((s: number, m: any) => s + m.total, 0).toLocaleString()}`}
        />
      </div>
      <ChartCard title="Monthly Payroll Costs">
        {monthlyCosts.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyCosts}>
              <defs>
                <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="totalDeductions" name="Deductions" stroke="#ef4444" fill="url(#payrollGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="totalEmployerContributions" name="Employer Contributions" stroke="#22c55e" fill="none" strokeWidth={2} />
              <Line type="monotone" dataKey="total" name="Total Cost" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyState message="No payroll data available" />}
      </ChartCard>
    </div>
  );
}

// ── Diversity Tab ───────────────────────────────────────────────────
function DiversityTab({ data }: { data: any }) {
  if (!data) return <EmptyState />;
  const genderData = data.genderDistribution || [];
  const deptData = data.departmentBreakdown || [];

  // Group department breakdown by department for stacked bar
  const deptMap = new Map<string, any>();
  deptData.forEach((d: any) => {
    const name = d.departmentName || 'Unassigned';
    if (!deptMap.has(name)) deptMap.set(name, { departmentName: name });
    deptMap.get(name)![d.gender] = d.count;
  });
  const deptChartData = Array.from(deptMap.values());
  const genders = [...new Set(deptData.map((d: any) => d.gender))] as string[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard icon={Heart} label="Total Employees" value={data.totalEmployees || 0} />
        {genderData.slice(0, 2).map((g: any) => (
          <KpiCard key={g.gender} icon={Users} label={g.gender} value={g.count} subtitle={`${g.percentage}%`} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Gender Distribution">
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={genderData.map((g: any) => ({ name: g.gender, value: g.count }))} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {genderData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>
        <ChartCard title="Gender by Department">
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="departmentName" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {genders.map((g, i) => (
                  <Bar key={g} dataKey={g} name={g} fill={COLORS[i % COLORS.length]} stackId="a" radius={i === genders.length - 1 ? [4, 4, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>
      </div>
    </div>
  );
}

// ── Recruitment Tab ─────────────────────────────────────────────────
function RecruitmentTab({ data }: { data: any }) {
  if (!data) return <EmptyState />;
  const pipeline = data.pipelineStats || {};
  const stages = data.applicantsByStage || [];
  const jobStatuses = data.jobPostingsByStatus || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Briefcase} label="Open Positions" value={pipeline.openPositions || 0} />
        <KpiCard icon={Users} label="Total Applicants" value={pipeline.totalApplicants || 0} />
        <KpiCard icon={Users} label="Hired" value={pipeline.hiredCount || 0} trend="up" />
        <KpiCard icon={Clock} label="Avg Time to Hire" value={`${(pipeline.avgTimeToHireDays || 0).toFixed(0)} days`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Recruitment Pipeline">
          {stages.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stages} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="stage" type="category" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Applicants" radius={[0, 4, 4, 0]}>
                  {stages.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>
        <ChartCard title="Job Postings by Status">
          {jobStatuses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={jobStatuses.map((j: any) => ({ name: j.status, value: j.count }))} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} dataKey="value"
                  label={({ name, value }: any) => `${name}: ${value}`}>
                  {jobStatuses.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>
      </div>
    </div>
  );
}

// ── Training Tab ────────────────────────────────────────────────────
function TrainingTab({ data }: { data: any }) {
  if (!data) return <EmptyState />;
  const courseStatuses = data.coursesByStatus || [];
  const enrollmentStatuses = data.enrollmentsByStatus || [];
  const stats = data.enrollmentStats || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={GraduationCap} label="Total Enrollments" value={stats.totalEnrollments || 0} />
        <KpiCard icon={GraduationCap} label="Completed" value={stats.completedEnrollments || 0} trend="up" />
        <KpiCard icon={GraduationCap} label="Completion Rate" value={`${(stats.completionRate || 0).toFixed(1)}%`} />
        <KpiCard icon={GraduationCap} label="Avg Score" value={stats.avgScore != null ? `${stats.avgScore.toFixed(1)}%` : 'N/A'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Courses by Status">
          {courseStatuses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseStatuses}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Courses" radius={[4, 4, 0, 0]}>
                  {courseStatuses.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>
        <ChartCard title="Enrollments by Status">
          {enrollmentStatuses.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={enrollmentStatuses.map((e: any) => ({ name: e.status, value: e.count }))} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} dataKey="value">
                    {enrollmentStatuses.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              {/* Progress bars */}
              <div className="mt-4 space-y-2">
                {enrollmentStatuses.map((e: any, i: number) => {
                  const pct = stats.totalEnrollments > 0 ? (e.count / stats.totalEnrollments) * 100 : 0;
                  return (
                    <div key={e.status} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 truncate">{e.status}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-10 text-right">{e.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <EmptyState />}
        </ChartCard>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [tabData, setTabData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.request('/analytics/overview');
      setOverview(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const fetchTabData = useCallback(async () => {
    const endpoints: Record<string, string> = {
      headcount: '/analytics/headcount',
      attrition: '/analytics/attrition',
      leave: '/analytics/leave-utilization',
      attendance: '/analytics/attendance',
      payroll: '/analytics/payroll-costs',
      diversity: '/analytics/diversity',
      recruitment: '/analytics/recruitment',
      training: '/analytics/training',
    };
    if (!endpoints[activeTab]) return;
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.request(endpoints[activeTab]);
      setTabData(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);
  useEffect(() => { if (activeTab !== 'overview') { setTabData(null); fetchTabData(); } }, [activeTab, fetchTabData]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'headcount', label: 'Headcount', icon: Users },
    { id: 'attrition', label: 'Attrition', icon: TrendingDown },
    { id: 'leave', label: 'Leave', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'diversity', label: 'Diversity', icon: Heart },
    { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
    { id: 'training', label: 'Training', icon: GraduationCap },
  ];

  const renderTab = () => {
    if (loading) return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
    switch (activeTab) {
      case 'overview': return overview ? <OverviewTab data={overview} /> : <EmptyState />;
      case 'headcount': return <HeadcountTab data={tabData} />;
      case 'attrition': return <AttritionTab data={tabData} />;
      case 'leave': return <LeaveTab data={tabData} />;
      case 'attendance': return <AttendanceTab data={tabData} />;
      case 'payroll': return <PayrollTab data={tabData} />;
      case 'diversity': return <DiversityTab data={tabData} />;
      case 'recruitment': return <RecruitmentTab data={tabData} />;
      case 'training': return <TrainingTab data={tabData} />;
      default: return <EmptyState />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HR Analytics</h1>
        <p className="text-muted-foreground">Data-driven insights across your organization</p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <span className="text-sm">{error}</span>
          <button onClick={() => activeTab === 'overview' ? fetchOverview() : fetchTabData()} className="text-xs underline ml-auto">Retry</button>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {renderTab()}
    </div>
  );
}
