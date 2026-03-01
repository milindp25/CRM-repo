'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, TrendingDown, Calendar, Clock, DollarSign, Heart, Briefcase, GraduationCap,
  BarChart3,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard as DesignChartCard, chartColors, chartColorArray } from '@/components/ui/chart-card';
import { ErrorBanner } from '@/components/ui/error-banner';

// ── Month names ─────────────────────────────────────────────────────
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

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

interface HeadcountTrendItem {
  month: number;
  year: number;
  count: number;
}

interface HeadcountDepartmentItem {
  departmentName: string;
  count: number;
}

interface HeadcountData {
  current?: {
    total?: number;
    byDepartment?: HeadcountDepartmentItem[];
  };
  trends?: HeadcountTrendItem[];
}

interface AttritionTrendItem {
  month: number;
  year: number;
  rate: number;
  leavers: number;
}

interface AttritionData {
  attritionRate?: number;
  totalLeavers?: number;
  totalEmployees?: number;
  periodMonths?: number;
  monthlyTrend?: AttritionTrendItem[];
}

interface LeaveUtilizationItem {
  leaveType: string;
  totalDays: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface LeaveData {
  pendingCount?: number;
  utilizationByType?: LeaveUtilizationItem[];
}

interface AttendanceStatusItem {
  status: string;
  count: number;
}

interface AttendanceData {
  totalRecords?: number;
  month?: number;
  year?: number;
  absentCount?: number;
  absenteeismRate?: number;
  avgHoursWorked?: number;
  statusBreakdown?: AttendanceStatusItem[];
}

interface PayrollMonthlyCostItem {
  month: number;
  year: number;
  totalDeductions: number;
  totalEmployerContributions: number;
}

interface PayrollData {
  totalRecords?: number;
  monthlyCosts?: PayrollMonthlyCostItem[];
}

interface GenderDistributionItem {
  gender: string;
  count: number;
  percentage: number;
}

interface DepartmentGenderItem {
  departmentName: string;
  gender: string;
  count: number;
}

interface DiversityData {
  totalEmployees?: number;
  genderDistribution?: GenderDistributionItem[];
  departmentBreakdown?: DepartmentGenderItem[];
}

interface RecruitmentStageItem {
  stage: string;
  count: number;
}

interface JobStatusItem {
  status: string;
  count: number;
}

interface RecruitmentData {
  pipelineStats?: {
    openPositions?: number;
    totalApplicants?: number;
    hiredCount?: number;
    avgTimeToHireDays?: number;
  };
  applicantsByStage?: RecruitmentStageItem[];
  jobPostingsByStatus?: JobStatusItem[];
}

interface CourseStatusItem {
  status: string;
  count: number;
}

interface EnrollmentStatusItem {
  status: string;
  count: number;
}

interface TrainingData {
  enrollmentStats?: {
    totalEnrollments?: number;
    completedEnrollments?: number;
    completionRate?: number;
    avgScore?: number | null;
  };
  coursesByStatus?: CourseStatusItem[];
  enrollmentsByStatus?: EnrollmentStatusItem[];
}

interface PieLabelProps {
  name?: string;
  percent?: number;
}

interface PieLabelWithValueProps {
  name?: string;
  value?: number;
}

// ── Shared Components ───────────────────────────────────────────────
function AnalyticsEmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <BarChart3 className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: TooltipPayloadItem, i: number) => (
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
    : String(data.todayAttendance);
  const activePercent = data.totalEmployees > 0
    ? ((data.activeEmployees / data.totalEmployees) * 100).toFixed(0)
    : '0';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={Users} title="Total Employees" value={data.totalEmployees} iconColor="blue" />
      <StatCard icon={Users} title="Active Employees" value={data.activeEmployees} iconColor="green"
        trend={{ value: Number(activePercent) > 80 ? 5 : -2 }} subtitle={`${activePercent}% active`} />
      <StatCard icon={TrendingDown} title="Attrition Rate" value={`${(data.attritionRate || 0).toFixed(1)}%`} iconColor="rose"
        subtitle="Last 12 months" trend={{ value: (data.attritionRate ?? 0) > 15 ? -5 : 0 }} />
      <StatCard icon={Clock} title="Avg Tenure" value={`${((data.avgTenureMonths || 0) / 12).toFixed(1)} yrs`} iconColor="purple" />
      <StatCard icon={Calendar} title="Pending Leaves" value={data.pendingLeaves} iconColor="amber" />
      <StatCard icon={Users} title="Today Attendance" value={attendance} iconColor="cyan" />
      <StatCard icon={Briefcase} title="Open Positions" value={data.openPositions} iconColor="indigo" />
      <StatCard icon={DollarSign} title="Monthly Payroll" value={`$${(data.monthlyPayrollCost || 0).toLocaleString()}`} iconColor="green" />
    </div>
  );
}

// ── Headcount Tab ───────────────────────────────────────────────────
function HeadcountTab({ data }: { data: HeadcountData | null }) {
  if (!data) return <AnalyticsEmptyState />;
  const deptData = data.current?.byDepartment || [];
  const trendData = (data.trends || []).map((t: HeadcountTrendItem) => ({
    ...t,
    label: `${MONTH_NAMES[t.month - 1]} ${t.year}`,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon={Users} title="Total Headcount" value={data.current?.total || 0} iconColor="blue" />
        <StatCard icon={Users} title="Departments" value={deptData.length} subtitle="with active employees" iconColor="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DesignChartCard title="Headcount by Department" height={300}>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="departmentName" type="category" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Employees" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <AnalyticsEmptyState />}
        </DesignChartCard>
        <DesignChartCard title="Headcount Trend" height={300}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" name="Employees" stroke={chartColors.primary} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <AnalyticsEmptyState message="No trend data available" />}
        </DesignChartCard>
      </div>
    </div>
  );
}

// ── Attrition Tab ───────────────────────────────────────────────────
function AttritionTab({ data }: { data: AttritionData | null }) {
  if (!data) return <AnalyticsEmptyState />;
  const trendData = (data.monthlyTrend || []).map((t: AttritionTrendItem) => ({
    ...t,
    label: `${MONTH_NAMES[t.month - 1]} ${t.year}`,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingDown} title="Attrition Rate" value={`${(data.attritionRate ?? 0).toFixed(1)}%`} iconColor="rose"
          trend={{ value: (data.attritionRate ?? 0) > 15 ? -5 : 0 }} />
        <StatCard icon={Users} title="Total Leavers" value={data.totalLeavers || 0} subtitle={`out of ${data.totalEmployees || 0}`} iconColor="amber" />
        <StatCard icon={Users} title="Total Employees" value={data.totalEmployees || 0} iconColor="blue" />
        <StatCard icon={Calendar} title="Period" value={`${data.periodMonths || 12} months`} iconColor="purple" />
      </div>
      <DesignChartCard title="Monthly Attrition Trend" height={350}>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="attritionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.danger} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.danger} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="rate" name="Attrition Rate %" stroke={chartColors.danger} fill="url(#attritionGradient)" strokeWidth={2} />
              <Line type="monotone" dataKey="leavers" name="Leavers" stroke={chartColors.warning} strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <AnalyticsEmptyState message="No attrition trend data" />}
      </DesignChartCard>
    </div>
  );
}

// ── Leave Tab ───────────────────────────────────────────────────────
function LeaveTab({ data }: { data: LeaveData | null }) {
  if (!data) return <AnalyticsEmptyState />;
  const utilization = data.utilizationByType || [];
  const pieData = utilization.map((item: LeaveUtilizationItem) => ({
    name: item.leaveType,
    value: item.totalDays,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Calendar} title="Pending Requests" value={data.pendingCount || 0} iconColor="amber" />
        <StatCard icon={Calendar} title="Leave Types" value={utilization.length} iconColor="blue" />
        <StatCard icon={Calendar} title="Total Days Used" value={utilization.reduce((sum: number, u: LeaveUtilizationItem) => sum + (u.totalDays || 0), 0)} iconColor="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DesignChartCard title="Leave Days by Type" height={300}>
          {utilization.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="leaveType" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="approved" name="Approved" fill={chartColors.success} stackId="a" />
                <Bar dataKey="pending" name="Pending" fill={chartColors.warning} stackId="a" />
                <Bar dataKey="rejected" name="Rejected" fill={chartColors.danger} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <AnalyticsEmptyState />}
        </DesignChartCard>
        <DesignChartCard title="Distribution by Type" height={300}>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} dataKey="value" label={({ name, percent }: PieLabelProps) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((_: { name: string; value: number }, i: number) => (
                    <Cell key={i} fill={chartColorArray[i % chartColorArray.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <AnalyticsEmptyState />}
        </DesignChartCard>
      </div>
    </div>
  );
}

// ── Attendance Tab ──────────────────────────────────────────────────
function AttendanceTab({ data }: { data: AttendanceData | null }) {
  if (!data) return <AnalyticsEmptyState />;
  const statusData = data.statusBreakdown || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} title="Total Records" value={data.totalRecords || 0} subtitle={`${MONTH_NAMES[(data.month || 1) - 1]} ${data.year || ''}`} iconColor="blue" />
        <StatCard icon={Clock} title="Absent Count" value={data.absentCount || 0} iconColor="rose" />
        <StatCard icon={Clock} title="Absenteeism Rate" value={`${(data.absenteeismRate || 0).toFixed(1)}%`} iconColor="amber"
          trend={{ value: (data.absenteeismRate ?? 0) > 10 ? -3 : 0 }} />
        <StatCard icon={Clock} title="Avg Hours Worked" value={`${(data.avgHoursWorked || 0).toFixed(1)}h`} iconColor="green" />
      </div>
      <DesignChartCard title="Attendance Status Breakdown" height={350}>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="status" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                {statusData.map((_: AttendanceStatusItem, i: number) => (
                  <Cell key={i} fill={chartColorArray[i % chartColorArray.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <AnalyticsEmptyState />}
      </DesignChartCard>
    </div>
  );
}

// ── Payroll Tab ─────────────────────────────────────────────────────
function PayrollTab({ data }: { data: PayrollData | null }) {
  if (!data) return <AnalyticsEmptyState />;
  const monthlyCosts = (data.monthlyCosts || []).map((m: PayrollMonthlyCostItem) => ({
    ...m,
    label: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
    total: (m.totalDeductions || 0) + (m.totalEmployerContributions || 0),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} title="Total Records" value={data.totalRecords || 0} iconColor="blue" />
        <StatCard icon={DollarSign} title="Months Covered" value={monthlyCosts.length} iconColor="purple" />
        <StatCard icon={DollarSign} title="Total Costs" iconColor="green"
          value={`$${monthlyCosts.reduce((s: number, m: PayrollMonthlyCostItem & { total: number }) => s + m.total, 0).toLocaleString()}`}
        />
      </div>
      <DesignChartCard title="Monthly Payroll Costs" height={350}>
        {monthlyCosts.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyCosts}>
              <defs>
                <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="totalDeductions" name="Deductions" stroke={chartColors.danger} fill="url(#payrollGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="totalEmployerContributions" name="Employer Contributions" stroke={chartColors.success} fill="none" strokeWidth={2} />
              <Line type="monotone" dataKey="total" name="Total Cost" stroke={chartColors.primary} strokeWidth={2.5} dot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <AnalyticsEmptyState message="No payroll data available" />}
      </DesignChartCard>
    </div>
  );
}

// ── Diversity Tab ───────────────────────────────────────────────────
function DiversityTab({ data }: { data: DiversityData | null }) {
  if (!data) return <AnalyticsEmptyState />;
  const genderData = data.genderDistribution || [];
  const deptData = data.departmentBreakdown || [];

  const deptMap = new Map<string, Record<string, string | number>>();
  deptData.forEach((d: DepartmentGenderItem) => {
    const name = d.departmentName || 'Unassigned';
    if (!deptMap.has(name)) deptMap.set(name, { departmentName: name });
    deptMap.get(name)![d.gender] = d.count;
  });
  const deptChartData = Array.from(deptMap.values());
  const genders = [...new Set(deptData.map((d: DepartmentGenderItem) => d.gender))] as string[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Heart} title="Total Employees" value={data.totalEmployees || 0} iconColor="rose" />
        {genderData.slice(0, 2).map((g: GenderDistributionItem) => (
          <StatCard key={g.gender} icon={Users} title={g.gender} value={g.count} subtitle={`${g.percentage}%`} iconColor="blue" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DesignChartCard title="Gender Distribution" height={300}>
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={genderData.map((g: GenderDistributionItem) => ({ name: g.gender, value: g.count }))} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} dataKey="value"
                  label={({ name, percent }: PieLabelProps) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {genderData.map((_: GenderDistributionItem, i: number) => (
                    <Cell key={i} fill={chartColorArray[i % chartColorArray.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <AnalyticsEmptyState />}
        </DesignChartCard>
        <DesignChartCard title="Gender by Department" height={300}>
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="departmentName" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {genders.map((g, i) => (
                  <Bar key={g} dataKey={g} name={g} fill={chartColorArray[i % chartColorArray.length]} stackId="a" radius={i === genders.length - 1 ? [4, 4, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : <AnalyticsEmptyState />}
        </DesignChartCard>
      </div>
    </div>
  );
}

// ── Recruitment Tab ─────────────────────────────────────────────────
function RecruitmentTab({ data }: { data: RecruitmentData | null }) {
  if (!data) return <AnalyticsEmptyState />;
  const pipeline = data.pipelineStats || {};
  const stages = data.applicantsByStage || [];
  const jobStatuses = data.jobPostingsByStatus || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} title="Open Positions" value={pipeline.openPositions || 0} iconColor="indigo" />
        <StatCard icon={Users} title="Total Applicants" value={pipeline.totalApplicants || 0} iconColor="blue" />
        <StatCard icon={Users} title="Hired" value={pipeline.hiredCount || 0} iconColor="green" trend={{ value: 3 }} />
        <StatCard icon={Clock} title="Avg Time to Hire" value={`${(pipeline.avgTimeToHireDays || 0).toFixed(0)} days`} iconColor="amber" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DesignChartCard title="Recruitment Pipeline" height={300}>
          {stages.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stages} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="stage" type="category" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Applicants" radius={[0, 4, 4, 0]}>
                  {stages.map((_: RecruitmentStageItem, i: number) => (
                    <Cell key={i} fill={chartColorArray[i % chartColorArray.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <AnalyticsEmptyState />}
        </DesignChartCard>
        <DesignChartCard title="Job Postings by Status" height={300}>
          {jobStatuses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={jobStatuses.map((j: JobStatusItem) => ({ name: j.status, value: j.count }))} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} dataKey="value"
                  label={({ name, value }: PieLabelWithValueProps) => `${name ?? ''}: ${value ?? 0}`}>
                  {jobStatuses.map((_: JobStatusItem, i: number) => (
                    <Cell key={i} fill={chartColorArray[i % chartColorArray.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <AnalyticsEmptyState />}
        </DesignChartCard>
      </div>
    </div>
  );
}

// ── Training Tab ────────────────────────────────────────────────────
function TrainingTab({ data }: { data: TrainingData | null }) {
  if (!data) return <AnalyticsEmptyState />;
  const courseStatuses = data.coursesByStatus || [];
  const enrollmentStatuses = data.enrollmentsByStatus || [];
  const stats = data.enrollmentStats || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} title="Total Enrollments" value={stats.totalEnrollments || 0} iconColor="blue" />
        <StatCard icon={GraduationCap} title="Completed" value={stats.completedEnrollments || 0} iconColor="green" trend={{ value: 5 }} />
        <StatCard icon={GraduationCap} title="Completion Rate" value={`${(stats.completionRate || 0).toFixed(1)}%`} iconColor="purple" />
        <StatCard icon={GraduationCap} title="Avg Score" value={stats.avgScore != null ? `${stats.avgScore.toFixed(1)}%` : 'N/A'} iconColor="amber" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DesignChartCard title="Courses by Status" height={300}>
          {courseStatuses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseStatuses}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Courses" radius={[4, 4, 0, 0]}>
                  {courseStatuses.map((_: CourseStatusItem, i: number) => (
                    <Cell key={i} fill={chartColorArray[i % chartColorArray.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <AnalyticsEmptyState />}
        </DesignChartCard>
        <DesignChartCard title="Enrollments by Status" height={300}>
          {enrollmentStatuses.length > 0 ? (
            <div className="h-full flex flex-col">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={enrollmentStatuses.map((e: EnrollmentStatusItem) => ({ name: e.status, value: e.count }))} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} dataKey="value">
                    {enrollmentStatuses.map((_: EnrollmentStatusItem, i: number) => (
                      <Cell key={i} fill={chartColorArray[i % chartColorArray.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {enrollmentStatuses.map((e: EnrollmentStatusItem, i: number) => {
                  const pct = (stats.totalEnrollments ?? 0) > 0 ? (e.count / (stats.totalEnrollments ?? 1)) * 100 : 0;
                  return (
                    <div key={e.status} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 truncate">{e.status}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: chartColorArray[i % chartColorArray.length] }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-10 text-right">{e.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <AnalyticsEmptyState />}
        </DesignChartCard>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [tabData, setTabData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.request('/analytics/overview');
      setOverview(data);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'An error occurred'); }
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
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'An error occurred'); }
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
    if (loading) return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
    switch (activeTab) {
      case 'overview': return overview ? <OverviewTab data={overview} /> : <AnalyticsEmptyState />;
      case 'headcount': return <HeadcountTab data={tabData as HeadcountData | null} />;
      case 'attrition': return <AttritionTab data={tabData as AttritionData | null} />;
      case 'leave': return <LeaveTab data={tabData as LeaveData | null} />;
      case 'attendance': return <AttendanceTab data={tabData as AttendanceData | null} />;
      case 'payroll': return <PayrollTab data={tabData as PayrollData | null} />;
      case 'diversity': return <DiversityTab data={tabData as DiversityData | null} />;
      case 'recruitment': return <RecruitmentTab data={tabData as RecruitmentData | null} />;
      case 'training': return <TrainingTab data={tabData as TrainingData | null} />;
      default: return <AnalyticsEmptyState />;
    }
  };

  return (
    <PageContainer
      title="HR Analytics"
      description="Data-driven insights across your organization"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Analytics' },
      ]}
    >
      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => activeTab === 'overview' ? fetchOverview() : fetchTabData()}
          onDismiss={() => setError('')}
        />
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
    </PageContainer>
  );
}
