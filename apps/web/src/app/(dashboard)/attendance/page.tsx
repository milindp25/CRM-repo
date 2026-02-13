'use client';

import { useState, useEffect } from 'react';
import { apiClient, Attendance, CreateAttendanceData, Employee } from '@/lib/api-client';
import { Plus, Calendar, Clock, Trash2, Edit2, MapPin } from 'lucide-react';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState<CreateAttendanceData>({
    employeeId: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
  });

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, [currentPage, employeeFilter, startDate, endDate, statusFilter]);

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.getEmployees({ limit: 1000, status: 'ACTIVE' });
      setEmployees(response.data);
    } catch (err: any) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAttendance({
        page: currentPage,
        limit: 20,
        ...(employeeFilter && { employeeId: employeeFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(statusFilter && { status: statusFilter as any }),
      });
      setAttendance(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.updateAttendance(editingId, formData);
      } else {
        await apiClient.createAttendance(formData);
      }
      resetForm();
      fetchAttendance();
    } catch (err: any) {
      setError(err.message || 'Failed to save attendance record');
    }
  };

  const handleEdit = (record: Attendance) => {
    setEditingId(record.id);
    setFormData({
      employeeId: record.employeeId,
      attendanceDate: record.attendanceDate,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      status: record.status,
      isWorkFromHome: record.isWorkFromHome,
      notes: record.notes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;

    try {
      await apiClient.deleteAttendance(id);
      fetchAttendance();
    } catch (err: any) {
      setError(err.message || 'Failed to delete attendance record');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      attendanceDate: new Date().toISOString().split('T')[0],
      status: 'PRESENT',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PRESENT: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
      LEAVE: 'bg-yellow-100 text-yellow-800',
      HALF_DAY: 'bg-blue-100 text-blue-800',
      WEEKEND: 'bg-gray-100 text-gray-800',
      HOLIDAY: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
        <p className="mt-2 text-gray-600">Manage employee attendance records</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="WEEKEND">Weekend</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setEmployeeFilter('');
              setStartDate('');
              setEndDate('');
              setStatusFilter('');
              setCurrentPage(1);
            }}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Add attendance button */}
      <div className="mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          {showForm ? 'Cancel' : 'Mark Attendance'}
        </button>
      </div>

      {/* Attendance form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Attendance' : 'Mark Attendance'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.attendanceDate}
                onChange={(e) => setFormData({ ...formData, attendanceDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LEAVE">Leave</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="WEEKEND">Weekend</option>
                <option value="HOLIDAY">Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-In Time</label>
              <input
                type="datetime-local"
                value={formData.checkInTime?.slice(0, 16) || ''}
                onChange={(e) =>
                  setFormData({ ...formData, checkInTime: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-Out Time</label>
              <input
                type="datetime-local"
                value={formData.checkOutTime?.slice(0, 16) || ''}
                onChange={(e) =>
                  setFormData({ ...formData, checkOutTime: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={formData.isWorkFromHome || false}
                  onChange={(e) => setFormData({ ...formData, isWorkFromHome: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Work From Home</span>
              </label>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any notes or remarks..."
              />
            </div>

            <div className="md:col-span-3 flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Save'}
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

      {/* Attendance table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading attendance records...</div>
        ) : attendance.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No attendance records found. Click &quot;Mark Attendance&quot; to add one.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
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
                  {attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Calendar size={16} className="text-gray-400" />
                          {new Date(record.attendanceDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.employee?.firstName} {record.employee?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{record.employee?.employeeCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkInTime ? (
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Clock size={14} className="text-green-500" />
                            {new Date(record.checkInTime).toLocaleTimeString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkOutTime ? (
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Clock size={14} className="text-red-500" />
                            {new Date(record.checkOutTime).toLocaleTimeString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.totalHours ? `${record.totalHours}h` : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status.replace('_', ' ')}
                          </span>
                          {record.isWorkFromHome && (
                            <span className="flex items-center gap-1 text-xs text-blue-600" title="Work From Home">
                              <MapPin size={12} />
                              WFH
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
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
