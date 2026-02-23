import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Headcount ────────────────────────────────────────────────────────────────

  /**
   * Count active employees, grouped by department.
   */
  async getHeadcount(companyId: string) {
    // Single query: get departments with employee counts
    const departments = await this.prisma.department.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        _count: { select: { employees: { where: { isActive: true } } } },
      },
    });

    // Count unassigned employees
    const unassignedCount = await this.prisma.employee.count({
      where: { companyId, isActive: true, departmentId: null },
    });

    const headcountByDepartment = departments
      .filter((d) => d._count.employees > 0)
      .map((d) => ({
        departmentId: d.id,
        departmentName: d.name,
        count: d._count.employees,
      }));

    if (unassignedCount > 0) {
      headcountByDepartment.push({
        departmentId: null as any,
        departmentName: 'Unassigned',
        count: unassignedCount,
      });
    }

    const total = headcountByDepartment.reduce((sum, d) => sum + d.count, 0);

    return { total, byDepartment: headcountByDepartment };
  }

  /**
   * Monthly employee count over past N months using dateOfJoining/dateOfLeaving.
   * Fetches all employees once and computes monthly headcount in-memory.
   */
  async getHeadcountTrends(companyId: string, months: number) {
    const now = new Date();
    const earliestMonth = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    // Single query: fetch all employees who were active at any point during the range
    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        dateOfJoining: { lte: now },
        OR: [
          { dateOfLeaving: null },
          { dateOfLeaving: { gte: earliestMonth } },
        ],
      },
      select: { dateOfJoining: true, dateOfLeaving: true },
    });

    const trends: Array<{ month: number; year: number; count: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = employees.filter((emp) => {
        const joined = new Date(emp.dateOfJoining);
        if (joined > endOfMonth) return false;
        if (!emp.dateOfLeaving) return true;
        return new Date(emp.dateOfLeaving) > endOfMonth;
      }).length;

      trends.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        count,
      });
    }

    return trends;
  }

  // ─── Attrition ────────────────────────────────────────────────────────────────

  /**
   * Attrition rate: employees who left in past N months / total employees.
   * Fetches all employees once and computes monthly attrition in-memory.
   */
  async getAttritionRate(companyId: string, months: number) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    // Two sequential queries to avoid connection pool exhaustion
    const allEmployees = await this.prisma.employee.findMany({
      where: {
        companyId,
        OR: [
          { dateOfLeaving: null },
          { dateOfLeaving: { gte: startDate } },
        ],
      },
      select: { dateOfJoining: true, dateOfLeaving: true },
    });

    const totalEmployees = await this.prisma.employee.count({ where: { companyId } });

    // Compute leavers count
    const leaversCount = allEmployees.filter(
      (e) => e.dateOfLeaving && new Date(e.dateOfLeaving) >= startDate,
    ).length;

    // Build monthly trend in-memory
    const monthlyTrend: Array<{ month: number; year: number; leavers: number; rate: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const monthLeavers = allEmployees.filter((e) => {
        if (!e.dateOfLeaving) return false;
        const left = new Date(e.dateOfLeaving);
        return left >= monthStart && left <= monthEnd;
      }).length;

      const headcountAtStart = allEmployees.filter((e) => {
        const joined = new Date(e.dateOfJoining);
        if (joined > monthStart) return false;
        if (!e.dateOfLeaving) return true;
        return new Date(e.dateOfLeaving) > monthStart;
      }).length;

      monthlyTrend.push({
        month: monthStart.getMonth() + 1,
        year: monthStart.getFullYear(),
        leavers: monthLeavers,
        rate: headcountAtStart > 0 ? (monthLeavers / headcountAtStart) * 100 : 0,
      });
    }

    return {
      totalLeavers: leaversCount,
      totalEmployees,
      attritionRate: totalEmployees > 0 ? (leaversCount / totalEmployees) * 100 : 0,
      periodMonths: months,
      monthlyTrend,
    };
  }

  // ─── Tenure ───────────────────────────────────────────────────────────────────

  /**
   * Average tenure (in months) for active employees.
   */
  async getAvgTenure(companyId: string) {
    const activeEmployees = await this.prisma.employee.findMany({
      where: { companyId, isActive: true },
      select: { dateOfJoining: true },
    });

    if (activeEmployees.length === 0) {
      return { avgTenureMonths: 0, employeeCount: 0 };
    }

    const now = new Date();
    let totalMonths = 0;

    for (const emp of activeEmployees) {
      const joining = new Date(emp.dateOfJoining);
      const diffMs = now.getTime() - joining.getTime();
      const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44); // Average days in a month
      totalMonths += diffMonths;
    }

    return {
      avgTenureMonths: Math.round((totalMonths / activeEmployees.length) * 10) / 10,
      employeeCount: activeEmployees.length,
    };
  }

  // ─── Leave Utilization ────────────────────────────────────────────────────────

  /**
   * Count leaves by type and status.
   */
  async getLeaveUtilization(companyId: string) {
    const byTypeAndStatus = await this.prisma.leave.groupBy({
      by: ['leaveType', 'status'],
      where: { companyId },
      _count: { id: true },
      _sum: { totalDays: true },
    });

    const pendingCount = await this.prisma.leave.count({
      where: { companyId, status: 'PENDING' },
    });

    return { byTypeAndStatus, pendingCount };
  }

  // ─── Attendance ───────────────────────────────────────────────────────────────

  /**
   * Attendance stats for a specific month: count by status, absenteeism rate.
   */
  async getAttendanceStats(companyId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const byStatus = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: {
        companyId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
    });

    const totalRecords = byStatus.reduce((sum, s) => sum + s._count.id, 0);
    const absentCount = byStatus.find((s) => s.status === 'ABSENT')?._count.id || 0;

    // Average hours worked
    const hoursAgg = await this.prisma.attendance.aggregate({
      where: {
        companyId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
        totalHours: { not: null },
      },
      _avg: { totalHours: true },
    });

    return {
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      totalRecords,
      absentCount,
      absenteeismRate: totalRecords > 0 ? (absentCount / totalRecords) * 100 : 0,
      avgHoursWorked: hoursAgg._avg.totalHours ? Number(hoursAgg._avg.totalHours) : 0,
    };
  }

  // ─── Payroll Costs ────────────────────────────────────────────────────────────

  /**
   * Fetch payroll records grouped by month for cost analysis.
   * Since grossSalary is encrypted, we return raw records for service-layer decryption.
   * We also return non-encrypted deduction sums as a fallback metric.
   */
  async getPayrollRecordsByMonth(companyId: string, months: number) {
    const now = new Date();
    const startYear = new Date(now.getFullYear(), now.getMonth() - months + 1, 1).getFullYear();
    const startMonth = new Date(now.getFullYear(), now.getMonth() - months + 1, 1).getMonth() + 1;

    const payrolls = await this.prisma.payroll.findMany({
      where: {
        companyId,
        isBonus: false,
        OR: [
          { payPeriodYear: { gt: startYear } },
          {
            payPeriodYear: startYear,
            payPeriodMonth: { gte: startMonth },
          },
        ],
      },
      select: {
        payPeriodMonth: true,
        payPeriodYear: true,
        grossSalaryEncrypted: true,
        netSalaryEncrypted: true,
        status: true,
        pfEmployee: true,
        pfEmployer: true,
        esiEmployee: true,
        esiEmployer: true,
        tds: true,
        pt: true,
        otherDeductions: true,
        ssEmployee: true,
        ssEmployer: true,
        medicareEmployee: true,
        medicareEmployer: true,
        federalTax: true,
        stateTax: true,
        employee: {
          select: {
            departmentId: true,
          },
        },
      },
      orderBy: [{ payPeriodYear: 'asc' }, { payPeriodMonth: 'asc' }],
    });

    return payrolls;
  }

  // ─── Diversity ────────────────────────────────────────────────────────────────

  /**
   * Active employees grouped by gender and by department.
   */
  async getDiversityMetrics(companyId: string) {
    const byGender = await this.prisma.employee.groupBy({
      by: ['gender'],
      where: { companyId, isActive: true },
      _count: { id: true },
    });

    const byDepartmentAndGender = await this.prisma.employee.groupBy({
      by: ['departmentId', 'gender'],
      where: { companyId, isActive: true },
      _count: { id: true },
    });

    // Fetch department names
    const departmentIds = byDepartmentAndGender
      .map((d) => d.departmentId)
      .filter((id): id is string => id !== null);

    const uniqueDeptIds = [...new Set(departmentIds)];
    const departments = uniqueDeptIds.length > 0
      ? await this.prisma.department.findMany({
          where: { id: { in: uniqueDeptIds } },
          select: { id: true, name: true },
        })
      : [];

    const departmentMap = new Map(departments.map((d) => [d.id, d.name]));

    return {
      byGender: byGender.map((g) => ({
        gender: g.gender || 'Not Specified',
        count: g._count.id,
      })),
      byDepartmentAndGender: byDepartmentAndGender.map((d) => ({
        departmentId: d.departmentId,
        departmentName: d.departmentId ? departmentMap.get(d.departmentId) || 'Unknown' : 'Unassigned',
        gender: d.gender || 'Not Specified',
        count: d._count.id,
      })),
    };
  }

  // ─── Recruitment ──────────────────────────────────────────────────────────────

  /**
   * Job postings by status, applicants by stage, and time-to-hire.
   */
  async getRecruitmentMetrics(companyId: string) {
    // Sequential queries to avoid connection pool exhaustion
    const jobPostingsByStatus = await this.prisma.jobPosting.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true },
    });

    const applicantsByStage = await this.prisma.applicant.groupBy({
      by: ['stage'],
      where: { companyId },
      _count: { id: true },
    });

    const hiredApplicants = await this.prisma.applicant.findMany({
      where: { companyId, stage: 'HIRED' },
      select: {
        createdAt: true,
        updatedAt: true,
        jobPosting: { select: { createdAt: true } },
      },
    });

    const openPositions = await this.prisma.jobPosting.count({
      where: { companyId, status: 'PUBLISHED' },
    });

    const totalApplicants = await this.prisma.applicant.count({
      where: { companyId },
    });

    let avgTimeToHireDays = 0;
    if (hiredApplicants.length > 0) {
      let totalDays = 0;
      for (const applicant of hiredApplicants) {
        const postingDate = applicant.jobPosting.createdAt;
        const hiredDate = applicant.updatedAt;
        const diffMs = hiredDate.getTime() - postingDate.getTime();
        totalDays += diffMs / (1000 * 60 * 60 * 24);
      }
      avgTimeToHireDays = Math.round((totalDays / hiredApplicants.length) * 10) / 10;
    }

    return {
      jobPostingsByStatus: jobPostingsByStatus.map((j) => ({
        status: j.status,
        count: j._count.id,
      })),
      applicantsByStage: applicantsByStage.map((a) => ({
        stage: a.stage,
        count: a._count.id,
      })),
      openPositions,
      totalApplicants,
      avgTimeToHireDays,
      hiredCount: hiredApplicants.length,
    };
  }

  // ─── Training ─────────────────────────────────────────────────────────────────

  /**
   * Courses by status and enrollment completion rate.
   */
  async getTrainingMetrics(companyId: string) {
    const coursesByStatus = await this.prisma.trainingCourse.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true },
    });

    const totalEnrollments = await this.prisma.trainingEnrollment.count({
      where: { companyId },
    });

    const completedEnrollments = await this.prisma.trainingEnrollment.count({
      where: { companyId, status: 'COMPLETED' },
    });

    const enrollmentsByStatus = await this.prisma.trainingEnrollment.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true },
    });

    const avgScore = await this.prisma.trainingEnrollment.aggregate({
      where: {
        companyId,
        status: 'COMPLETED',
        score: { not: null },
      },
      _avg: { score: true },
    });

    return {
      coursesByStatus: coursesByStatus.map((c) => ({
        status: c.status,
        count: c._count.id,
      })),
      totalEnrollments,
      completedEnrollments,
      completionRate: totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 1000) / 10
        : 0,
      enrollmentsByStatus: enrollmentsByStatus.map((e) => ({
        status: e.status,
        count: e._count.id,
      })),
      avgScore: avgScore._avg.score ? Number(avgScore._avg.score) : null,
    };
  }

  // ─── Quick Counts (for Overview) ──────────────────────────────────────────────

  async getTodayAttendanceCount(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const present = await this.prisma.attendance.count({
      where: {
        companyId,
        attendanceDate: { gte: today, lt: tomorrow },
        status: 'PRESENT',
      },
    });

    const total = await this.prisma.attendance.count({
      where: {
        companyId,
        attendanceDate: { gte: today, lt: tomorrow },
      },
    });

    return { present, total };
  }

  async getOpenPositionsCount(companyId: string) {
    return this.prisma.jobPosting.count({
      where: { companyId, status: 'PUBLISHED' },
    });
  }

  async getPendingLeavesCount(companyId: string) {
    return this.prisma.leave.count({
      where: { companyId, status: 'PENDING' },
    });
  }
}
