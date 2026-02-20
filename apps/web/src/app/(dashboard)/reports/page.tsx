'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Attendance, type Leave, type Payroll, type Employee } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';

type ReportType = 'attendance' | 'leave' | 'payroll';

interface ReportRow {
  [key: string]: string | number;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [employeeId, setEmployeeId] = useState('');
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [reportHeaders, setReportHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState('');

  // Load employees on mount
  useEffect(() => {
    apiClient.getEmployees({ limit: 100 }).then(r => setEmployees(r.data)).catch(() => {});
  }, []);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');
      setGenerated(false);

      if (reportType === 'attendance') {
        const res = await apiClient.getAttendance({
          startDate,
          endDate,
          employeeId: employeeId || undefined,
        });
        const headers = ['Employee Code', 'Employee Name', 'Date', 'Status', 'Check In', 'Check Out', 'Total Hours', 'WFH'];
        const rows: ReportRow[] = res.data.map(a => ({
          'Employee Code': a.employee?.employeeCode || '',
          'Employee Name': `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`.trim(),
          'Date': new Date(a.attendanceDate).toLocaleDateString('en-IN'),
          'Status': a.status,
          'Check In': a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
          'Check Out': a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
          'Total Hours': a.totalHours ?? '',
          'WFH': a.isWorkFromHome ? 'Yes' : 'No',
        }));
        setReportHeaders(headers);
        setReportData(rows);

      } else if (reportType === 'leave') {
        const res = await apiClient.getLeave({
          startDate,
          endDate,
          employeeId: employeeId || undefined,
        });
        const headers = ['Employee Code', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Applied On'];
        const rows: ReportRow[] = res.data.map(l => ({
          'Employee Code': l.employee?.employeeCode || '',
          'Employee Name': `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`.trim(),
          'Leave Type': l.leaveType.replace('_', ' '),
          'Start Date': new Date(l.startDate).toLocaleDateString('en-IN'),
          'End Date': new Date(l.endDate).toLocaleDateString('en-IN'),
          'Days': Number(l.totalDays),
          'Status': l.status,
          'Reason': l.reason,
          'Applied On': new Date(l.appliedAt).toLocaleDateString('en-IN'),
        }));
        setReportHeaders(headers);
        setReportData(rows);

      } else if (reportType === 'payroll') {
        const res = await apiClient.getPayroll({
          employeeId: employeeId || undefined,
          take: 500,
        });
        // Filter by month/year on client side
        const filtered = res.data.filter(
          p => p.payPeriodMonth === payMonth && p.payPeriodYear === payYear
        );
        const headers = [
          'Employee Code', 'Employee Name', 'Period',
          'Basic Salary', 'HRA', 'Special Allowance', 'Other Allowances', 'Gross Salary',
          'PF (Employee)', 'ESI (Employee)', 'TDS', 'PT', 'Other Deductions', 'Net Salary',
          'Days Worked', 'Days in Month', 'Leave Days', 'Absent Days',
          'Bank Name', 'Status', 'Paid At',
        ];
        const rows: ReportRow[] = filtered.map(p => ({
          'Employee Code': p.employee?.employeeCode || '',
          'Employee Name': `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.trim(),
          'Period': `${MONTH_NAMES[p.payPeriodMonth - 1]} ${p.payPeriodYear}`,
          'Basic Salary': p.basicSalary,
          'HRA': p.hra ?? 0,
          'Special Allowance': p.specialAllowance ?? 0,
          'Other Allowances': p.otherAllowances ?? 0,
          'Gross Salary': p.grossSalary,
          'PF (Employee)': p.pfEmployee,
          'ESI (Employee)': p.esiEmployee,
          'TDS': p.tds,
          'PT': p.pt,
          'Other Deductions': p.otherDeductions,
          'Net Salary': p.netSalary,
          'Days Worked': p.daysWorked,
          'Days in Month': p.daysInMonth,
          'Leave Days': p.leaveDays,
          'Absent Days': p.absentDays,
          'Bank Name': p.bankName || '',
          'Status': p.status,
          'Paid At': p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '',
        }));
        setReportHeaders(headers);
        setReportData(rows);
      }

      setGenerated(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData.length) return;

    const escape = (val: string | number) => {
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [
      reportHeaders.map(escape).join(','),
      ...reportData.map(row => reportHeaders.map(h => escape(row[h] ?? '')).join(',')),
    ];

    const csvContent = '\uFEFF' + csvRows.join('\r\n'); // BOM for Excel UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `${reportType}-report-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSummary = () => {
    if (!reportData.length) return null;

    if (reportType === 'attendance') {
      const present = reportData.filter(r => r['Status'] === 'PRESENT').length;
      const absent = reportData.filter(r => r['Status'] === 'ABSENT').length;
      const leave = reportData.filter(r => r['Status'] === 'LEAVE').length;
      return [
        { label: 'Total Records', value: reportData.length },
        { label: 'Present', value: present },
        { label: 'Absent', value: absent },
        { label: 'On Leave', value: leave },
      ];
    }
    if (reportType === 'leave') {
      const approved = reportData.filter(r => r['Status'] === 'APPROVED').length;
      const pending = reportData.filter(r => r['Status'] === 'PENDING').length;
      const totalDays = reportData.reduce((s, r) => s + Number(r['Days']), 0);
      return [
        { label: 'Total Applications', value: reportData.length },
        { label: 'Approved', value: approved },
        { label: 'Pending', value: pending },
        { label: 'Total Days', value: totalDays },
      ];
    }
    if (reportType === 'payroll') {
      const totalNet = reportData.reduce((s, r) => s + Number(r['Net Salary']), 0);
      const totalGross = reportData.reduce((s, r) => s + Number(r['Gross Salary']), 0);
      const paid = reportData.filter(r => r['Status'] === 'PAID').length;
      return [
        { label: 'Employees', value: reportData.length },
        { label: 'Paid', value: paid },
        { label: 'Total Gross', value: `₹${totalGross.toLocaleString('en-IN')}` },
        { label: 'Total Net Payable', value: `₹${totalNet.toLocaleString('en-IN')}` },
      ];
    }
    return null;
  };

  const summary = generated ? getSummary() : null;

  return (
    <RoleGate requiredPermissions={[Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS]}>
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and export HR reports</p>
        </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Report Configuration */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-foreground mb-4">Report Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={e => { setReportType(e.target.value as ReportType); setGenerated(false); }}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            >
              <option value="attendance">Attendance Report</option>
              <option value="leave">Leave Report</option>
              <option value="payroll">Payroll Report</option>
            </select>
          </div>

          {/* Employee */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Employee</label>
            <select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} – {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range (Attendance / Leave) */}
          {reportType !== 'payroll' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Month</label>
                <select
                  value={payMonth}
                  onChange={e => setPayMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                <select
                  value={payYear}
                  onChange={e => setPayYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {generated && reportData.length > 0 && (
            <button
              onClick={exportToCSV}
              className="px-5 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition"
            >
              Export to Excel (CSV)
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {summary.map(item => (
            <div key={item.label} className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Report Table */}
      {generated && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">
              {reportData.length} record{reportData.length !== 1 ? 's' : ''} found
            </p>
            {reportData.length > 0 && (
              <button
                onClick={exportToCSV}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Export CSV
              </button>
            )}
          </div>

          {reportData.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No records found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    {reportHeaders.map(header => (
                      <th
                        key={header}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted">
                      {reportHeaders.map(header => (
                        <td key={header} className="px-4 py-2 text-foreground whitespace-nowrap">
                          {header === 'Status' ? (
                            <StatusBadge status={String(row[header])} />
                          ) : typeof row[header] === 'number' && (
                            header.includes('Salary') || header.includes('HRA') ||
                            header.includes('Allowance') || header.includes('TDS') ||
                            header.includes('PF') || header.includes('ESI') ||
                            header.includes('Net') || header.includes('Gross')
                          ) ? (
                            `₹${Number(row[header]).toLocaleString('en-IN')}`
                          ) : (
                            String(row[header] ?? '')
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
    </RoleGate>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-700',
    ABSENT: 'bg-red-100 text-red-700',
    LEAVE: 'bg-yellow-100 text-yellow-700',
    HALF_DAY: 'bg-orange-100 text-orange-700',
    WEEKEND: 'bg-gray-100 text-gray-500',
    HOLIDAY: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    DRAFT: 'bg-gray-100 text-gray-700',
    PROCESSED: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    HOLD: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
