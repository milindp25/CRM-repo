'use client';

import { useState, useEffect } from 'react';
import { apiClient, Attendance, CreateAttendanceData, Employee } from '@/lib/api-client';
import { Plus, Calendar, Clock, Trash2, Edit2, MapPin, Users, CheckCircle, XCircle, Filter, X, Check } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { TableLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/format-date';

const inputClass = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
const selectClass = inputClass;

export default function AttendancePage() {
  useEffect(() => { document.title = 'Attendance | HRPlatform'; }, []);

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const toast = useToast();

  // Confirm dialog states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Fetch employees once on mount
  useEffect(() => {
    let cancelled = false;
    const loadEmployees = async () => {
      try {
        const response = await apiClient.getEmployees({ limit: 100, status: 'ACTIVE' });
        if (!cancelled) setEmployees(response.data);
      } catch (err: any) {
        if (!cancelled) console.error('Failed to fetch employees:', err);
      }
    };
    loadEmployees();
    return () => { cancelled = true; };
  }, []);

  // Fetch attendance data when filters or page changes
  useEffect(() => {
    let cancelled = false;
    const loadAttendance = async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setError(null);
        }
        const response = await apiClient.getAttendance({
          page: currentPage,
          limit: 20,
          ...(employeeFilter && { employeeId: employeeFilter }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(statusFilter && { status: statusFilter as any }),
        });
        if (!cancelled) {
          setAttendance(response.data);
          setTotalPages(response.meta.totalPages);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to fetch attendance records');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadAttendance();
    return () => { cancelled = true; };
  }, [currentPage, employeeFilter, startDate, endDate, statusFilter]);

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.getEmployees({ limit: 100, status: 'ACTIVE' });
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
      setSubmitting(true);
      if (editingId) {
        await apiClient.updateAttendance(editingId, formData);
        toast.success('Attendance Updated', 'Attendance record has been updated successfully.');
      } else {
        await apiClient.createAttendance(formData);
        toast.success('Attendance Created', 'Attendance record has been created successfully.');
      }
      setError(null);
      resetForm();
      fetchAttendance();
    } catch (err: any) {
      toast.error('Failed to Save', err.message || 'Failed to save attendance record');
    } finally {
      setSubmitting(false);
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
    try {
      setDeletingId(id);
      await apiClient.deleteAttendance(id);
      setError(null);
      setDeleteConfirmId(null);
      toast.success('Attendance Deleted', 'Attendance record has been deleted successfully.');
      fetchAttendance();
    } catch (err: any) {
      toast.error('Failed to Delete', err.message || 'Failed to delete attendance record');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      let deleted = 0;
      for (const id of ids) {
        await apiClient.deleteAttendance(id);
        deleted++;
      }
      toast.success('Bulk Deleted', `${deleted} attendance record(s) deleted`);
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
      fetchAttendance();
    } catch (err: any) {
      toast.error('Bulk Delete Failed', err.message || undefined);
    }
  };

  const toggleSelectAll = () => {
    if (attendance.length === 0) return;
    const allSelected = attendance.every(r => selectedIds.has(r.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(attendance.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
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

  // Compute summary stats from current data
  const presentCount = attendance.filter(r => r.status === 'PRESENT').length;
  const absentCount = attendance.filter(r => r.status === 'ABSENT').length;
  const leaveCount = attendance.filter(r => r.status === 'LEAVE').length;
  const wfhCount = attendance.filter(r => r.isWorkFromHome).length;

  const hasFilters = employeeFilter || startDate || endDate || statusFilter;

  return (
    <PageContainer
      title="Attendance"
      description="See who&apos;s in, who&apos;s working remotely, and manage daily records"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Attendance' },
      ]}
      actions={
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Mark Attendance
        </button>
      }
    >
      {/* Error banner */}
      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={() => fetchAttendance()} />
      )}

      {/* Stat cards */}
      {!loading && attendance.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Present"
            value={presentCount}
            icon={CheckCircle}
            iconColor="green"
            subtitle="Current page"
          />
          <StatCard
            title="Absent"
            value={absentCount}
            icon={XCircle}
            iconColor="rose"
            subtitle="Current page"
          />
          <StatCard
            title="On Leave"
            value={leaveCount}
            icon={Calendar}
            iconColor="amber"
            subtitle="Current page"
          />
          <StatCard
            title="Work From Home"
            value={wfhCount}
            icon={MapPin}
            iconColor="cyan"
            subtitle="Current page"
          />
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-medium text-foreground">Filters</h3>
          {hasFilters && (
            <button
              onClick={() => {
                setEmployeeFilter('');
                setStartDate('');
                setEndDate('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="ml-auto inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="att-filter-employee" className="block text-sm font-medium text-foreground mb-1.5">Employee</label>
            <select
              id="att-filter-employee"
              value={employeeFilter}
              onChange={(e) => {
                setEmployeeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={selectClass}
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
            <label htmlFor="att-filter-start" className="block text-sm font-medium text-foreground mb-1.5">Start Date</label>
            <input
              id="att-filter-start"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="att-filter-end" className="block text-sm font-medium text-foreground mb-1.5">End Date</label>
            <input
              id="att-filter-end"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="att-filter-status" className="block text-sm font-medium text-foreground mb-1.5">Status</label>
            <select
              id="att-filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={selectClass}
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="WEEKEND">Weekend</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance form modal */}
      <Modal open={showForm} onClose={resetForm} size="lg">
        <ModalHeader onClose={resetForm}>
          {editingId ? 'Edit Attendance' : 'Mark Attendance'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Employee <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className={selectClass}
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
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.attendanceDate}
                  onChange={(e) => setFormData({ ...formData, attendanceDate: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Status <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className={selectClass}
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
                <label className="block text-sm font-medium text-foreground mb-1.5">Check-In Time</label>
                <input
                  type="datetime-local"
                  value={formData.checkInTime?.slice(0, 16) || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, checkInTime: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Check-Out Time</label>
                <input
                  type="datetime-local"
                  value={formData.checkOutTime?.slice(0, 16) || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, checkOutTime: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center pt-7">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isWorkFromHome || false}
                    onChange={(e) => setFormData({ ...formData, isWorkFromHome: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm font-medium text-foreground">Work From Home</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="Add any notes or remarks..."
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Save'}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-primary/5 border-primary/20" aria-live="polite">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete ({selectedIds.size})
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Attendance table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <TableLoader rows={5} cols={8} />
        ) : attendance.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-foreground">No attendance records</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              No attendance records found. Click &quot;Mark Attendance&quot; to add one.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th scope="col" className="w-10 px-4 py-3">
                      <button
                        onClick={toggleSelectAll}
                        role="checkbox"
                        aria-checked={attendance.length > 0 && attendance.every(r => selectedIds.has(r.id))}
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                          attendance.length > 0 && attendance.every(r => selectedIds.has(r.id))
                            ? 'bg-primary border-primary text-primary-foreground'
                            : selectedIds.size > 0
                              ? 'bg-primary/50 border-primary text-primary-foreground'
                              : 'border-input hover:border-primary/50'
                        }`}
                        aria-label="Select all attendance records"
                      >
                        {selectedIds.size > 0 && <Check className="h-3 w-3" />}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Check In
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Check Out
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Hours
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendance.map((record) => (
                    <tr key={record.id} className={`hover:bg-muted/30 transition-colors ${selectedIds.has(record.id) ? 'bg-primary/5' : ''}`}>
                      <td className="w-10 px-4 py-4">
                        <button
                          onClick={() => toggleSelect(record.id)}
                          role="checkbox"
                          aria-checked={selectedIds.has(record.id)}
                          className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                            selectedIds.has(record.id)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-input hover:border-primary/50'
                          }`}
                          aria-label={`Select attendance record for ${record.employee?.firstName ?? ''} ${record.employee?.lastName ?? ''}`.trim()}
                        >
                          {selectedIds.has(record.id) && <Check className="h-3 w-3" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          {formatDate(record.attendanceDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {record.employee?.firstName} {record.employee?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{record.employee?.employeeCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkInTime ? (
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <Clock className="h-3.5 w-3.5 text-green-500 dark:text-green-400" aria-hidden="true" />
                            {new Date(record.checkInTime).toLocaleTimeString()}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkOutTime ? (
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <Clock className="h-3.5 w-3.5 text-red-500 dark:text-red-400" aria-hidden="true" />
                            {new Date(record.checkOutTime).toLocaleTimeString()}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {record.totalHours ? `${record.totalHours}h` : '--'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusBadge variant={getStatusVariant(record.status)}>
                            {record.status.replace('_', ' ')}
                          </StatusBadge>
                          {record.isWorkFromHome && (
                            <StatusBadge variant="cyan">
                              <MapPin className="h-3 w-3" />
                              Remote
                            </StatusBadge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(record)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            aria-label={`Edit attendance for ${record.employee?.firstName ?? ''} ${record.employee?.lastName ?? ''}`.trim()}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(record.id)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label={`Delete attendance for ${record.employee?.firstName ?? ''} ${record.employee?.lastName ?? ''}`.trim()}
                          >
                            <Trash2 className="h-4 w-4" />
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
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-9 px-4 text-sm font-medium border border-input rounded-lg bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9 px-4 text-sm font-medium border border-input rounded-lg bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId!)}
        title="Delete Attendance Record"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
      <ConfirmDialog
        open={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Records"
        description={`Are you sure you want to delete ${selectedIds.size} attendance record(s)? This action cannot be undone.`}
        confirmLabel="Delete All"
        variant="destructive"
      />
    </PageContainer>
  );
}
