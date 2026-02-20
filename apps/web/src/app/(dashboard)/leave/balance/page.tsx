'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient, type Employee, type Leave } from '@/lib/api-client';

// Standard annual leave entitlements (days per year)
const LEAVE_ENTITLEMENTS: Record<string, number> = {
  CASUAL:       12,
  SICK:         12,
  EARNED:       15,
  PRIVILEGE:    15,
  COMPENSATORY:  0, // accrued, not allocated
  MATERNITY:   180,
  PATERNITY:    15,
  LOSS_OF_PAY:   0, // unlimited but tracked
};

const LEAVE_LABELS: Record<string, string> = {
  CASUAL:       'Casual',
  SICK:         'Sick',
  EARNED:       'Earned',
  PRIVILEGE:    'Privilege',
  COMPENSATORY: 'Compensatory',
  MATERNITY:    'Maternity',
  PATERNITY:    'Paternity',
  LOSS_OF_PAY:  'Loss of Pay',
};

interface EmployeeLeaveBalance {
  employee: Employee;
  balances: {
    type: string;
    entitlement: number;
    used: number;
    pending: number;
    remaining: number;
  }[];
  totalUsed: number;
  totalEntitlement: number;
}

export default function LeaveBalancePage() {
  const [balances, setBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [year, selectedEmployee]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [empRes, approvedRes, pendingRes] = await Promise.all([
        apiClient.getEmployees({ limit: 100, status: 'ACTIVE' }),
        apiClient.getLeave({
          status: 'APPROVED',
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
        }),
        apiClient.getLeave({
          status: 'PENDING',
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
        }),
      ]);

      const allEmployees = empRes.data;
      setEmployees(allEmployees);

      const filteredEmployees = selectedEmployee
        ? allEmployees.filter(e => e.id === selectedEmployee)
        : allEmployees;

      const approvedLeaves = approvedRes.data;
      const pendingLeaves = pendingRes.data;

      const result: EmployeeLeaveBalance[] = filteredEmployees.map(emp => {
        const empApproved = approvedLeaves.filter(l => l.employeeId === emp.id);
        const empPending = pendingLeaves.filter(l => l.employeeId === emp.id);

        const leaveTypes = Object.keys(LEAVE_ENTITLEMENTS);

        const balanceRows = leaveTypes.map(type => {
          const usedDays = empApproved
            .filter(l => l.leaveType === type)
            .reduce((sum, l) => sum + Number(l.totalDays), 0);

          const pendingDays = empPending
            .filter(l => l.leaveType === type)
            .reduce((sum, l) => sum + Number(l.totalDays), 0);

          const entitlement = LEAVE_ENTITLEMENTS[type];
          const remaining = entitlement > 0 ? Math.max(0, entitlement - usedDays) : 0;

          return {
            type,
            entitlement,
            used: usedDays,
            pending: pendingDays,
            remaining,
          };
        }).filter(b => b.entitlement > 0 || b.used > 0 || b.pending > 0);

        const totalEntitlement = balanceRows.reduce((sum, b) => sum + b.entitlement, 0);
        const totalUsed = balanceRows.reduce((sum, b) => sum + b.used, 0);

        return { employee: emp, balances: balanceRows, totalUsed, totalEntitlement };
      });

      setBalances(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load leave balances');
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (used: number, entitlement: number) => {
    if (entitlement === 0) return 'bg-gray-200 dark:bg-gray-700';
    const pct = (used / entitlement) * 100;
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-orange-400';
    return 'bg-green-500';
  };

  const getBalanceBadgeColor = (remaining: number, entitlement: number) => {
    if (entitlement === 0) return 'text-muted-foreground';
    const pct = (remaining / entitlement) * 100;
    if (pct <= 10) return 'text-red-600 font-bold';
    if (pct <= 30) return 'text-orange-600 font-semibold';
    return 'text-green-600 font-semibold';
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Balance</h1>
          <p className="text-muted-foreground text-sm mt-1">Annual leave entitlement and usage tracking</p>
        </div>
        <Link
          href="/leave"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          ← Leave Requests
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Year</label>
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-border rounded-md text-sm"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Employee</label>
          <select
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-md text-sm min-w-[200px]"
          >
            <option value="">All Active Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeCode} – {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="ml-auto flex items-end gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Healthy</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span> Low</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Critical</span>
        </div>
      </div>

      {/* Entitlement Key */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Annual Entitlements (Days)</p>
        <div className="flex flex-wrap gap-4 text-sm text-blue-800">
          {Object.entries(LEAVE_ENTITLEMENTS)
            .filter(([, days]) => days > 0)
            .map(([type, days]) => (
              <span key={type}>
                <strong>{LEAVE_LABELS[type]}:</strong> {days}d
              </span>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : balances.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          No employees found.
        </div>
      ) : (
        <div className="space-y-4">
          {balances.map(({ employee, balances: rows, totalUsed, totalEntitlement }) => (
            <div key={employee.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              {/* Employee header row */}
              <div className="flex items-center justify-between px-5 py-3 bg-muted border-b border-border">
                <div>
                  <span className="font-semibold text-foreground text-sm">
                    {employee.firstName} {employee.lastName}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">{employee.employeeCode}</span>
                  {employee.department && (
                    <span className="ml-2 text-xs text-muted-foreground">· {employee.department.name}</span>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <span>Used: <strong className="text-foreground">{totalUsed}d</strong></span>
                  <span className="ml-3">Total: <strong className="text-foreground">{totalEntitlement}d</strong></span>
                  <span className="ml-3">Remaining: <strong className={getBalanceBadgeColor(totalEntitlement - totalUsed, totalEntitlement)}>
                    {totalEntitlement - totalUsed}d
                  </strong></span>
                </div>
              </div>

              {/* Leave type rows */}
              <div className="divide-y divide-border">
                {rows.map(row => (
                  <div key={row.type} className="px-5 py-2.5 flex items-center gap-4">
                    <div className="w-28 text-sm text-foreground flex-shrink-0">
                      {LEAVE_LABELS[row.type]}
                    </div>

                    {/* Progress bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          {row.entitlement > 0 && (
                            <>
                              <div
                                className={`h-2 rounded-full ${getUsageColor(row.used, row.entitlement)} transition-all`}
                                style={{ width: `${Math.min(100, (row.used / row.entitlement) * 100)}%` }}
                              />
                            </>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
                          {row.used}d / {row.entitlement > 0 ? `${row.entitlement}d` : '–'}
                        </span>
                      </div>
                    </div>

                    {/* Pending */}
                    <div className="w-20 text-center flex-shrink-0">
                      {row.pending > 0 ? (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                          {row.pending}d pending
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">–</span>
                      )}
                    </div>

                    {/* Remaining */}
                    <div className="w-20 text-right flex-shrink-0 text-sm">
                      {row.entitlement > 0 ? (
                        <span className={getBalanceBadgeColor(row.remaining, row.entitlement)}>
                          {row.remaining}d left
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">accrued</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
