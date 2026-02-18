'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Payroll, type CreatePayrollData, type Employee } from '@/lib/api-client';

export default function PayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreatePayrollData>({
    employeeId: '',
    payPeriodMonth: new Date().getMonth() + 1,
    payPeriodYear: new Date().getFullYear(),
    payDate: '',
    basicSalary: 0,
    hra: 0,
    specialAllowance: 0,
    otherAllowances: 0,
    pfEmployee: 0,
    pfEmployer: 0,
    esiEmployee: 0,
    esiEmployer: 0,
    tds: 0,
    pt: 0,
    otherDeductions: 0,
    daysWorked: 0,
    daysInMonth: 30,
    leaveDays: 0,
    absentDays: 0,
    overtimeHours: 0,
    bankAccount: '',
    ifscCode: '',
    bankName: '',
    notes: '',
  });

  // Filters
  const [filters, setFilters] = useState({
    employeeId: '',
    status: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Calculated values
  const grossSalary = (formData.basicSalary || 0) + (formData.hra || 0) +
    (formData.specialAllowance || 0) + (formData.otherAllowances || 0);

  const totalDeductions = (formData.pfEmployee || 0) + (formData.esiEmployee || 0) +
    (formData.tds || 0) + (formData.pt || 0) + (formData.otherDeductions || 0);

  const netSalary = grossSalary - totalDeductions;

  useEffect(() => {
    fetchPayrollRecords();
    fetchEmployees();
  }, [filters]);

  const fetchPayrollRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getPayroll({
        employeeId: filters.employeeId || undefined,
        status: filters.status as any || undefined,
        month: filters.month,
        year: filters.year,
      });
      setPayrollRecords(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payroll records');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.getEmployees({ limit: 100 });
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await apiClient.createPayroll(formData);
      setShowForm(false);
      // Reset form
      setFormData({
        employeeId: '',
        payPeriodMonth: new Date().getMonth() + 1,
        payPeriodYear: new Date().getFullYear(),
        payDate: '',
        basicSalary: 0,
        hra: 0,
        specialAllowance: 0,
        otherAllowances: 0,
        pfEmployee: 0,
        pfEmployer: 0,
        esiEmployee: 0,
        esiEmployer: 0,
        tds: 0,
        pt: 0,
        otherDeductions: 0,
        daysWorked: 0,
        daysInMonth: 30,
        leaveDays: 0,
        absentDays: 0,
        overtimeHours: 0,
        bankAccount: '',
        ifscCode: '',
        bankName: '',
        notes: '',
      });
      await fetchPayrollRecords();
    } catch (err: any) {
      setError(err.message || 'Failed to create payroll');
      console.error('Create error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string) => {
    if (!confirm('Process this payroll record?')) return;
    try {
      setLoading(true);
      await apiClient.processPayroll(id);
      await fetchPayrollRecords();
    } catch (err: any) {
      setError(err.message || 'Failed to process payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm('Mark this payroll as paid?')) return;
    try {
      setLoading(true);
      await apiClient.markPayrollAsPaid(id);
      await fetchPayrollRecords();
    } catch (err: any) {
      setError(err.message || 'Failed to mark payroll as paid');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payroll record? This action cannot be undone.')) return;
    try {
      setLoading(true);
      await apiClient.deletePayroll(id);
      await fetchPayrollRecords();
    } catch (err: any) {
      setError(err.message || 'Failed to delete payroll');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PROCESSED': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'HOLD': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="text-gray-600 mt-1">Manage employee salary and payroll records</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : '+ New Payroll'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Payroll</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pay Period Section */}
            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Pay Period</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month *
                  </label>
                  <select
                    value={formData.payPeriodMonth}
                    onChange={(e) => setFormData({ ...formData, payPeriodMonth: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                      <option key={month} value={month}>{getMonthName(month)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    value={formData.payPeriodYear}
                    onChange={(e) => setFormData({ ...formData, payPeriodYear: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="2020"
                    max="2100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pay Date
                  </label>
                  <input
                    type="date"
                    value={formData.payDate}
                    onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Employee Selection */}
            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Employee</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Employee *
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Salary Components */}
            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Salary Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Basic Salary * (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HRA (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.hra}
                    onChange={(e) => setFormData({ ...formData, hra: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Allowance (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.specialAllowance}
                    onChange={(e) => setFormData({ ...formData, specialAllowance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Allowances (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.otherAllowances}
                    onChange={(e) => setFormData({ ...formData, otherAllowances: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-900">
                  Gross Salary: ₹{grossSalary.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Deductions */}
            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Deductions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PF Employee (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.pfEmployee}
                    onChange={(e) => setFormData({ ...formData, pfEmployee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PF Employer (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.pfEmployer}
                    onChange={(e) => setFormData({ ...formData, pfEmployer: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ESI Employee (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.esiEmployee}
                    onChange={(e) => setFormData({ ...formData, esiEmployee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ESI Employer (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.esiEmployer}
                    onChange={(e) => setFormData({ ...formData, esiEmployer: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TDS (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.tds}
                    onChange={(e) => setFormData({ ...formData, tds: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PT (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.pt}
                    onChange={(e) => setFormData({ ...formData, pt: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.otherDeductions}
                    onChange={(e) => setFormData({ ...formData, otherDeductions: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="p-3 bg-red-50 rounded-md">
                  <p className="text-sm font-medium text-red-900">
                    Total Deductions: ₹{totalDeductions.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-sm font-medium text-green-900">
                    Net Salary: ₹{netSalary.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Attendance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Days Worked *
                  </label>
                  <input
                    type="number"
                    value={formData.daysWorked}
                    onChange={(e) => setFormData({ ...formData, daysWorked: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Days in Month *
                  </label>
                  <input
                    type="number"
                    value={formData.daysInMonth}
                    onChange={(e) => setFormData({ ...formData, daysInMonth: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="28"
                    max="31"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Days
                  </label>
                  <input
                    type="number"
                    value={formData.leaveDays}
                    onChange={(e) => setFormData({ ...formData, leaveDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Absent Days
                  </label>
                  <input
                    type="number"
                    value={formData.absentDays}
                    onChange={(e) => setFormData({ ...formData, absentDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    value={formData.overtimeHours}
                    onChange={(e) => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="IFSC code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Bank name"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Creating...' : 'Create Payroll'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="font-medium mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PROCESSED">Processed</option>
              <option value="PAID">Paid</option>
              <option value="HOLD">Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Salary</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && !payrollRecords.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : payrollRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No payroll records found. Create one to get started.
                  </td>
                </tr>
              ) : (
                payrollRecords.map((record) => {
                  const totalDeductions = record.pfEmployee + record.esiEmployee + record.tds + record.pt + record.otherDeductions;
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {record.employee?.firstName} {record.employee?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {record.employee?.employeeCode}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getMonthName(record.payPeriodMonth)} {record.payPeriodYear}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        ₹{record.grossSalary.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 text-right">
                        -₹{totalDeductions.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 text-right font-semibold">
                        ₹{record.netSalary.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {record.status === 'DRAFT' && (
                            <button
                              onClick={() => handleProcess(record.id)}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Process
                            </button>
                          )}
                          {record.status === 'PROCESSED' && (
                            <button
                              onClick={() => handleMarkPaid(record.id)}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Mark Paid
                            </button>
                          )}
                          {record.status !== 'PAID' && (
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
