import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly repository: AnalyticsRepository,
    private readonly logger: LoggerService,
  ) {}

  // ─── Overview Dashboard ───────────────────────────────────────────────────────

  /**
   * Aggregated summary for the main analytics dashboard.
   */
  async getOverview(companyId: string) {
    this.logger.log('Fetching analytics overview', 'AnalyticsService');

    // All methods use sequential internal queries (max 1 connection each),
    // so running 7 in parallel uses at most 7 concurrent connections
    const [headcount, attritionData, tenureData, pendingLeaves, todayAttendance, openPositions, payrollRecords] = await Promise.all([
      this.repository.getHeadcount(companyId),
      this.repository.getAttritionRate(companyId, 12),
      this.repository.getAvgTenure(companyId),
      this.repository.getPendingLeavesCount(companyId),
      this.repository.getTodayAttendanceCount(companyId),
      this.repository.getOpenPositionsCount(companyId),
      this.repository.getPayrollRecordsByMonth(companyId, 1),
    ]);

    // Calculate monthly payroll cost from non-encrypted deduction fields
    // Since gross salary is encrypted, we estimate total cost from deduction totals
    // and use annualCtc-based estimation as primary metric
    const monthlyPayrollCost = this.calculateMonthlyPayrollCost(payrollRecords);

    return {
      totalEmployees: headcount.total,
      activeEmployees: headcount.total,
      attritionRate: Math.round(attritionData.attritionRate * 100) / 100,
      avgTenureMonths: tenureData.avgTenureMonths,
      pendingLeaves,
      todayAttendance: {
        present: todayAttendance.present,
        total: todayAttendance.total,
      },
      openPositions,
      monthlyPayrollCost,
    };
  }

  // ─── Headcount Analytics ──────────────────────────────────────────────────────

  async getHeadcountAnalytics(companyId: string, months: number = 12) {
    this.logger.log('Fetching headcount analytics', 'AnalyticsService');

    const [headcount, trends] = await Promise.all([
      this.repository.getHeadcount(companyId),
      this.repository.getHeadcountTrends(companyId, months),
    ]);

    return {
      current: headcount,
      trends,
    };
  }

  // ─── Attrition Analytics ──────────────────────────────────────────────────────

  async getAttritionAnalytics(companyId: string, months: number = 12) {
    this.logger.log('Fetching attrition analytics', 'AnalyticsService');

    const attritionData = await this.repository.getAttritionRate(companyId, months);

    return {
      attritionRate: Math.round(attritionData.attritionRate * 100) / 100,
      totalLeavers: attritionData.totalLeavers,
      totalEmployees: attritionData.totalEmployees,
      periodMonths: attritionData.periodMonths,
      monthlyTrend: attritionData.monthlyTrend.map((t) => ({
        month: t.month,
        year: t.year,
        leavers: t.leavers,
        rate: Math.round(t.rate * 100) / 100,
      })),
    };
  }

  // ─── Leave Analytics ──────────────────────────────────────────────────────────

  async getLeaveAnalytics(companyId: string) {
    this.logger.log('Fetching leave analytics', 'AnalyticsService');

    const leaveData = await this.repository.getLeaveUtilization(companyId);

    // Group by leave type
    const byType = new Map<string, { total: number; totalDays: number; approved: number; pending: number; rejected: number }>();

    for (const entry of leaveData.byTypeAndStatus) {
      const leaveType = entry.leaveType;
      if (!byType.has(leaveType)) {
        byType.set(leaveType, { total: 0, totalDays: 0, approved: 0, pending: 0, rejected: 0 });
      }
      const typeData = byType.get(leaveType)!;
      typeData.total += entry._count.id;
      typeData.totalDays += entry._sum.totalDays ? Number(entry._sum.totalDays) : 0;

      if (entry.status === 'APPROVED') typeData.approved += entry._count.id;
      if (entry.status === 'PENDING') typeData.pending += entry._count.id;
      if (entry.status === 'REJECTED') typeData.rejected += entry._count.id;
    }

    const utilizationByType = Array.from(byType.entries()).map(([leaveType, data]) => ({
      leaveType,
      ...data,
    }));

    // Sort by total days used (descending) for "most used" ranking
    const mostUsedTypes = [...utilizationByType].sort((a, b) => b.totalDays - a.totalDays);

    return {
      utilizationByType,
      mostUsedTypes: mostUsedTypes.slice(0, 5),
      pendingCount: leaveData.pendingCount,
    };
  }

  // ─── Attendance Analytics ─────────────────────────────────────────────────────

  async getAttendanceAnalytics(companyId: string, month?: number, year?: number) {
    this.logger.log('Fetching attendance analytics', 'AnalyticsService');

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const stats = await this.repository.getAttendanceStats(companyId, targetMonth, targetYear);

    return {
      month: targetMonth,
      year: targetYear,
      statusBreakdown: stats.byStatus,
      totalRecords: stats.totalRecords,
      absentCount: stats.absentCount,
      absenteeismRate: Math.round(stats.absenteeismRate * 100) / 100,
      avgHoursWorked: Math.round(stats.avgHoursWorked * 100) / 100,
    };
  }

  // ─── Payroll Analytics ────────────────────────────────────────────────────────

  async getPayrollAnalytics(companyId: string, months: number = 12) {
    this.logger.log('Fetching payroll analytics', 'AnalyticsService');

    const payrollRecords = await this.repository.getPayrollRecordsByMonth(companyId, months);

    // Group by month
    const monthlyData = new Map<string, {
      month: number;
      year: number;
      recordCount: number;
      totalDeductions: number;
      totalEmployerContributions: number;
      byDepartment: Map<string, { count: number; totalDeductions: number }>;
    }>();

    for (const record of payrollRecords) {
      const key = `${record.payPeriodYear}-${record.payPeriodMonth}`;

      if (!monthlyData.has(key)) {
        monthlyData.set(key, {
          month: record.payPeriodMonth,
          year: record.payPeriodYear,
          recordCount: 0,
          totalDeductions: 0,
          totalEmployerContributions: 0,
          byDepartment: new Map(),
        });
      }

      const data = monthlyData.get(key)!;
      data.recordCount++;

      // Sum non-encrypted deduction fields
      const deductions =
        Number(record.pfEmployee) +
        Number(record.esiEmployee) +
        Number(record.tds) +
        Number(record.pt) +
        Number(record.otherDeductions) +
        Number(record.ssEmployee) +
        Number(record.medicareEmployee) +
        Number(record.federalTax) +
        Number(record.stateTax);

      const employerContrib =
        Number(record.pfEmployer) +
        Number(record.esiEmployer) +
        Number(record.ssEmployer) +
        Number(record.medicareEmployer);

      data.totalDeductions += deductions;
      data.totalEmployerContributions += employerContrib;

      // Department breakdown
      const deptId = record.employee?.departmentId || 'unassigned';
      if (!data.byDepartment.has(deptId)) {
        data.byDepartment.set(deptId, { count: 0, totalDeductions: 0 });
      }
      const deptData = data.byDepartment.get(deptId)!;
      deptData.count++;
      deptData.totalDeductions += deductions;
    }

    const monthlyCosts = Array.from(monthlyData.values()).map((data) => ({
      month: data.month,
      year: data.year,
      recordCount: data.recordCount,
      totalDeductions: Math.round(data.totalDeductions * 100) / 100,
      totalEmployerContributions: Math.round(data.totalEmployerContributions * 100) / 100,
      departmentBreakdown: Array.from(data.byDepartment.entries()).map(([deptId, deptData]) => ({
        departmentId: deptId === 'unassigned' ? null : deptId,
        count: deptData.count,
        totalDeductions: Math.round(deptData.totalDeductions * 100) / 100,
      })),
    }));

    return {
      monthlyCosts,
      totalRecords: payrollRecords.length,
    };
  }

  // ─── Diversity Analytics ──────────────────────────────────────────────────────

  async getDiversityAnalytics(companyId: string) {
    this.logger.log('Fetching diversity analytics', 'AnalyticsService');

    const metrics = await this.repository.getDiversityMetrics(companyId);

    const totalEmployees = metrics.byGender.reduce((sum, g) => sum + g.count, 0);

    return {
      genderDistribution: metrics.byGender.map((g) => ({
        ...g,
        percentage: totalEmployees > 0 ? Math.round((g.count / totalEmployees) * 1000) / 10 : 0,
      })),
      departmentBreakdown: metrics.byDepartmentAndGender,
      totalEmployees,
    };
  }

  // ─── Recruitment Analytics ────────────────────────────────────────────────────

  async getRecruitmentAnalytics(companyId: string) {
    this.logger.log('Fetching recruitment analytics', 'AnalyticsService');

    const metrics = await this.repository.getRecruitmentMetrics(companyId);

    return {
      pipelineStats: {
        openPositions: metrics.openPositions,
        totalApplicants: metrics.totalApplicants,
        hiredCount: metrics.hiredCount,
        avgTimeToHireDays: metrics.avgTimeToHireDays,
      },
      jobPostingsByStatus: metrics.jobPostingsByStatus,
      applicantsByStage: metrics.applicantsByStage,
    };
  }

  // ─── Training Analytics ───────────────────────────────────────────────────────

  async getTrainingAnalytics(companyId: string) {
    this.logger.log('Fetching training analytics', 'AnalyticsService');

    const metrics = await this.repository.getTrainingMetrics(companyId);

    return {
      coursesByStatus: metrics.coursesByStatus,
      enrollmentStats: {
        totalEnrollments: metrics.totalEnrollments,
        completedEnrollments: metrics.completedEnrollments,
        completionRate: metrics.completionRate,
        avgScore: metrics.avgScore,
      },
      enrollmentsByStatus: metrics.enrollmentsByStatus,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  /**
   * Calculate total payroll cost from non-encrypted deduction fields.
   * Since grossSalary is encrypted, we sum all known deduction + employer contribution fields
   * as a proxy metric for payroll cost reporting.
   */
  private calculateMonthlyPayrollCost(payrollRecords: any[]): number {
    let totalDeductions = 0;

    for (const record of payrollRecords) {
      totalDeductions +=
        Number(record.pfEmployee) +
        Number(record.pfEmployer) +
        Number(record.esiEmployee) +
        Number(record.esiEmployer) +
        Number(record.tds) +
        Number(record.pt) +
        Number(record.otherDeductions) +
        Number(record.ssEmployee) +
        Number(record.ssEmployer) +
        Number(record.medicareEmployee) +
        Number(record.medicareEmployer) +
        Number(record.federalTax) +
        Number(record.stateTax);
    }

    return Math.round(totalDeductions * 100) / 100;
  }
}
