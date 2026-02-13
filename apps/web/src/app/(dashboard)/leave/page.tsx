'use client';

import { useState, useEffect } from 'react';
import { apiClient, Leave, CreateLeaveData, Employee } from '@/lib/api-client';
import { Plus, Calendar, Clock, Trash2, Edit2, CheckCircle, XCircle, Ban } from 'lucide-react';

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form state
  const [formData, setFormData] = useState<CreateLeaveData>({
    employeeId: '',
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    totalDays: 1,
    reason: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchLeaves();
  }, [currentPage, employeeFilter, leaveTypeFilter, statusFilter, startDate, endDate]);

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.getEmployees({ limit: 1000, status: 'ACTIVE' });
      setEmployees(response.data);
    } catch (err: any) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getLeave({
        page: currentPage,
        limit: 20,
        ...(employeeFilter && { employeeId: employeeFilter }),
        ...(leaveTypeFilter && { leaveType: leaveTypeFilter }),
        ...(statusFilter && { status: statusFilter as any }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      setLeaves(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.updateLeave(editingId, formData);
      } else {
        await apiClient.createLeave(formData);
      }
      resetForm();
      fetchLeaves();
    } catch (err: any) {
      setError(err.message || 'Failed to save leave request');
    }
  };

  const handleEdit = (leave: Leave) => {
    setEditingId(leave.id);
    setFormData({
      employeeId: leave.employeeId,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
      isHalfDay: leave.isHalfDay,
      halfDayType: leave.halfDayType,
      reason: leave.reason,
      contactDuringLeave: leave.contactDuringLeave,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;

    try {
      await apiClient.deleteLeave(id);
      fetchLeaves();
    } catch (err: any) {
      setError(err.message || 'Failed to delete leave request');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.approveLeave(id);
      fetchLeaves();
    } catch (err: any) {
      setError(err.message || 'Failed to approve leave request');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await apiClient.rejectLeave(id, reason || undefined);
      fetchLeaves();
    } catch (err: any) {
      setError(err.message || 'Failed to reject leave request');
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Reason for cancellation (optional):');
    try {
      await apiClient.cancelLeave(id, reason || undefined);
      fetchLeaves();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel leave request');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      leaveType: 'CASUAL',
      startDate: '',
      endDate: '',
      totalDays: 1,
      reason: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CASUAL: 'Casual Leave',
      SICK: 'Sick Leave',
      EARNED: 'Earned Leave',
      PRIVILEGE: 'Privilege Leave',
      MATERNITY: 'Maternity Leave',
      PATERNITY: 'Paternity Leave',
      COMPENSATORY: 'Compensatory Off',
      LOSS_OF_PAY: 'Loss of Pay',
    };
    return labels[type] || type;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
        <p className="mt-2 text-gray-600">Manage employee leave requests</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 underline text-sm mt-1">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              value={employeeFilter}
              onChange={(e) => {
                setEmployeeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select
              value={leaveTypeFilter}
              onChange={(e) => {
                setLeaveTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EARNED">Earned Leave</option>
              <option value="PRIVILEGE">Privilege Leave</option>
              <option value="MATERNITY">Maternity Leave</option>
              <option value="PATERNITY">Paternity Leave</option>
              <option value="COMPENSATORY">Compensatory Off</option>
              <option value="LOSS_OF_PAY">Loss of Pay</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setEmployeeFilter('');
              setLeaveTypeFilter('');
              setStatusFilter('');
              setStartDate('');
              setEndDate('');
              setCurrentPage(1);
            }}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Apply leave button */}
      <div className="mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          {showForm ? 'Cancel' : 'Apply for Leave'}
        </button>
      </div>

      {/* Leave form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Leave Request' : 'Apply for Leave'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CASUAL">Casual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="EARNED">Earned Leave</option>
                <option value="PRIVILEGE">Privilege Leave</option>
                <option value="MATERNITY">Maternity Leave</option>
                <option value="PATERNITY">Paternity Leave</option>
                <option value="COMPENSATORY">Compensatory Off</option>
                <option value="LOSS_OF_PAY">Loss of Pay</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  const days = calculateDays(newStartDate, formData.endDate);
                  setFormData({ ...formData, startDate: newStartDate, totalDays: days });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => {
                  const newEndDate = e.target.value;
                  const days = calculateDays(formData.startDate, newEndDate);
                  setFormData({ ...formData, endDate: newEndDate, totalDays: days });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Days <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0.5"
                step="0.5"
                value={formData.totalDays}
                onChange={(e) => setFormData({ ...formData, totalDays: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isHalfDay || false}
                  onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Half Day</span>
              </label>

              {formData.isHalfDay && (
                <select
                  value={formData.halfDayType || ''}
                  onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Half</option>
                  <option value="FIRST_HALF">First Half</option>
                  <option value="SECOND_HALF">Second Half</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact During Leave</label>
              <input
                type="text"
                value={formData.contactDuringLeave || ''}
                onChange={(e) => setFormData({ ...formData, contactDuringLeave: e.target.value })}
                placeholder="Phone number or email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Reason for leave..."
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave requests table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading leave requests...</div>
        ) : leaves.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No leave requests found. Click &quot;Apply for Leave&quot; to create one.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {leave.employee?.firstName} {leave.employee?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{leave.employee?.employeeCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getLeaveTypeLabel(leave.leaveType)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{leave.totalDays} days</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{leave.reason}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {leave.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(leave.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleReject(leave.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          {(leave.status === 'PENDING' || leave.status === 'APPROVED') && (
                            <button
                              onClick={() => handleCancel(leave.id)}
                              className="text-orange-600 hover:text-orange-800"
                              title="Cancel"
                            >
                              <Ban size={18} />
                            </button>
                          )}
                          {leave.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleEdit(leave)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(leave.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
