'use client';

import { useState, useEffect } from 'react';
import { apiClient, Leave, CreateLeaveData, Employee } from '@/lib/api-client';
import { Plus, Calendar, Clock, Trash2, Edit2, CheckCircle, XCircle, Ban, Filter, X, CalendarDays, CalendarClock, Check } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { TableLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/format-date';
import { Loader2 } from 'lucide-react';

const inputClass = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
const selectClass = inputClass;

export default function LeavePage() {
  useEffect(() => { document.title = 'Time Off | HRPlatform'; }, []);

  const [leaves, setLeaves] = useState<Leave[]>([]);
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
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [bulkApproveConfirm, setBulkApproveConfirm] = useState(false);
  const [bulkRejectConfirm, setBulkRejectConfirm] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  // Per-row loading states
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Fetch leaves when filters or page changes
  useEffect(() => {
    let cancelled = false;
    const loadLeaves = async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setError(null);
        }
        const response = await apiClient.getLeave({
          page: currentPage,
          limit: 20,
          ...(employeeFilter && { employeeId: employeeFilter }),
          ...(leaveTypeFilter && { leaveType: leaveTypeFilter }),
          ...(statusFilter && { status: statusFilter as any }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });
        if (!cancelled) {
          setLeaves(response.data);
          setTotalPages(response.meta.totalPages);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to fetch leave requests');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadLeaves();
    return () => { cancelled = true; };
  }, [currentPage, employeeFilter, leaveTypeFilter, statusFilter, startDate, endDate]);

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.getEmployees({ limit: 100, status: 'ACTIVE' });
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
      setSubmitting(true);
      if (editingId) {
        await apiClient.updateLeave(editingId, formData);
        toast.success('Leave request updated successfully');
      } else {
        await apiClient.createLeave(formData);
        toast.success('Leave request submitted successfully');
      }
      setError(null);
      resetForm();
      fetchLeaves();
    } catch (err: any) {
      toast.error('Failed to save leave request', err.message || undefined);
    } finally {
      setSubmitting(false);
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
    try {
      await apiClient.deleteLeave(id);
      toast.success('Leave request deleted successfully');
      setError(null);
      setDeleteConfirmId(null);
      fetchLeaves();
    } catch (err: any) {
      toast.error('Failed to delete leave request', err.message || undefined);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setApprovingId(id);
      await apiClient.approveLeave(id);
      toast.success('Leave request approved');
      setError(null);
      fetchLeaves();
    } catch (err: any) {
      toast.error('Failed to approve leave request', err.message || undefined);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.rejectLeave(id, rejectReason || undefined);
      toast.success('Leave request rejected');
      setError(null);
      setRejectConfirmId(null);
      setRejectReason('');
      fetchLeaves();
    } catch (err: any) {
      toast.error('Failed to reject leave request', err.message || undefined);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiClient.cancelLeave(id, cancelReason || undefined);
      toast.success('Leave request cancelled');
      setError(null);
      setCancelConfirmId(null);
      setCancelReason('');
      fetchLeaves();
    } catch (err: any) {
      toast.error('Failed to cancel leave request', err.message || undefined);
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    try {
      const result = await apiClient.bulkApproveLeave(ids);
      toast.success('Bulk Approved', `${result.processed} leave request(s) approved`);
      setSelectedIds(new Set());
      setBulkApproveConfirm(false);
      fetchLeaves();
    } catch (err: any) {
      toast.error('Bulk Approve Failed', err.message || undefined);
    }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    try {
      const result = await apiClient.bulkRejectLeave(ids, bulkRejectReason || undefined);
      toast.success('Bulk Rejected', `${result.processed} leave request(s) rejected`);
      setSelectedIds(new Set());
      setBulkRejectConfirm(false);
      setBulkRejectReason('');
      fetchLeaves();
    } catch (err: any) {
      toast.error('Bulk Reject Failed', err.message || undefined);
    }
  };

  const toggleSelectAll = () => {
    const pendingLeaves = leaves.filter(l => l.status === 'PENDING');
    if (pendingLeaves.length === 0) return;
    const allSelected = pendingLeaves.every(l => selectedIds.has(l.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingLeaves.map(l => l.id)));
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
      leaveType: 'CASUAL',
      startDate: '',
      endDate: '',
      totalDays: 1,
      reason: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CASUAL: 'Casual Leave',
      SICK: 'Sick Leave',
      EARNED: 'Earned Leave',
      PRIVILEGE: 'Privilege Leave',
      MATERNITY: 'Maternity Leave',
      PATERNITY: 'Paternity Leave',
      COMPENSATORY: 'Time Off in Lieu',
      LOSS_OF_PAY: 'Unpaid Leave',
    };
    return labels[type] || type;
  };

  // Compute summary stats
  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;
  const totalDays = leaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);

  const hasFilters = employeeFilter || leaveTypeFilter || statusFilter || startDate || endDate;

  return (
    <PageContainer
      title="Time Off"
      description="Review and manage time off requests from your team"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Time Off' },
      ]}
      actions={
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Apply for Leave
        </button>
      }
    >
      {/* Error banner */}
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
          onRetry={() => fetchLeaves()}
        />
      )}

      {/* Stat cards */}
      {!loading && leaves.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending"
            value={pendingCount}
            icon={Clock}
            iconColor="amber"
            subtitle="Awaiting approval"
          />
          <StatCard
            title="Approved"
            value={approvedCount}
            icon={CheckCircle}
            iconColor="green"
            subtitle="Current page"
          />
          <StatCard
            title="Rejected"
            value={rejectedCount}
            icon={XCircle}
            iconColor="rose"
            subtitle="Current page"
          />
          <StatCard
            title="Total Days"
            value={totalDays}
            icon={CalendarDays}
            iconColor="blue"
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
                setLeaveTypeFilter('');
                setStatusFilter('');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className="ml-auto inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Employee</label>
            <select
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
            <label className="block text-sm font-medium text-foreground mb-1.5">Leave Type</label>
            <select
              value={leaveTypeFilter}
              onChange={(e) => {
                setLeaveTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={selectClass}
            >
              <option value="">All Types</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EARNED">Earned Leave</option>
              <option value="PRIVILEGE">Privilege Leave</option>
              <option value="MATERNITY">Maternity Leave</option>
              <option value="PATERNITY">Paternity Leave</option>
              <option value="COMPENSATORY">Time Off in Lieu</option>
              <option value="LOSS_OF_PAY">Unpaid Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={selectClass}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Start Date</label>
            <input
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
            <label className="block text-sm font-medium text-foreground mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Leave form modal */}
      <Modal open={showForm} onClose={resetForm} size="lg">
        <ModalHeader onClose={resetForm}>
          {editingId ? 'Edit Leave Request' : 'Apply for Leave'}
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
                  Leave Type <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
                  className={selectClass}
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="EARNED">Earned Leave</option>
                  <option value="PRIVILEGE">Privilege Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                  <option value="COMPENSATORY">Time Off in Lieu</option>
                  <option value="LOSS_OF_PAY">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Start Date <span className="text-destructive">*</span>
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
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  End Date <span className="text-destructive">*</span>
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
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Total Days <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  value={formData.totalDays}
                  onChange={(e) => setFormData({ ...formData, totalDays: parseFloat(e.target.value) })}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-4 pt-7">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isHalfDay || false}
                    onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm font-medium text-foreground">Half Day</span>
                </label>

                {formData.isHalfDay && (
                  <select
                    value={formData.halfDayType || ''}
                    onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value as any })}
                    className="h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  >
                    <option value="">Select Half</option>
                    <option value="FIRST_HALF">First Half</option>
                    <option value="SECOND_HALF">Second Half</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Contact During Leave</label>
                <input
                  type="text"
                  value={formData.contactDuringLeave || ''}
                  onChange={(e) => setFormData({ ...formData, contactDuringLeave: e.target.value })}
                  placeholder="Phone number or email"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Reason <span className="text-destructive">*</span>
                </label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="Reason for leave..."
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
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Submit'}
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
              onClick={() => setBulkApproveConfirm(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve ({selectedIds.size})
            </button>
            <button
              onClick={() => setBulkRejectConfirm(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject ({selectedIds.size})
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

      {/* Leave requests table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <TableLoader rows={5} cols={7} />
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center" style={{ gridColumn: 'span 7' }}>
            <CalendarClock className="h-12 w-12 text-muted-foreground/50 mb-3" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-foreground">No leave requests</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              No leave requests found. Click &quot;Apply for Leave&quot; to create one.
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
                        aria-checked={leaves.filter(l => l.status === 'PENDING').length > 0 && leaves.filter(l => l.status === 'PENDING').every(l => selectedIds.has(l.id))}
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                          leaves.filter(l => l.status === 'PENDING').length > 0 && leaves.filter(l => l.status === 'PENDING').every(l => selectedIds.has(l.id))
                            ? 'bg-primary border-primary text-primary-foreground'
                            : selectedIds.size > 0
                              ? 'bg-primary/50 border-primary text-primary-foreground'
                              : 'border-input hover:border-primary/50'
                        }`}
                        aria-label="Select all leave requests"
                      >
                        {(selectedIds.size > 0) && <Check className="h-3 w-3" />}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Reason
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
                  {leaves.map((leave) => (
                    <tr key={leave.id} className={`hover:bg-muted/30 transition-colors ${selectedIds.has(leave.id) ? 'bg-primary/5' : ''}`}>
                      <td className="w-10 px-4 py-4">
                        {leave.status === 'PENDING' ? (
                          <button
                            onClick={() => toggleSelect(leave.id)}
                            role="checkbox"
                            aria-checked={selectedIds.has(leave.id)}
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                              selectedIds.has(leave.id)
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-input hover:border-primary/50'
                            }`}
                            aria-label={`Select leave request for ${leave.employee?.firstName ?? ''} ${leave.employee?.lastName ?? ''}`.trim()}
                          >
                            {selectedIds.has(leave.id) && <Check className="h-3 w-3" />}
                          </button>
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {leave.employee?.firstName} {leave.employee?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{leave.employee?.employeeCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge variant={getStatusVariant(leave.leaveType)}>
                          {getLeaveTypeLabel(leave.leaveType)}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground max-w-xs truncate">{leave.reason}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge variant={getStatusVariant(leave.status)} dot>
                          {leave.status}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1">
                          {leave.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(leave.id)}
                                disabled={approvingId === leave.id}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                                aria-label="Approve"
                              >
                                {approvingId === leave.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => setRejectConfirmId(leave.id)}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                aria-label="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {(leave.status === 'PENDING' || leave.status === 'APPROVED') && (
                            <button
                              onClick={() => setCancelConfirmId(leave.id)}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10 transition-colors"
                              aria-label="Cancel"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          {leave.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleEdit(leave)}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                aria-label="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(leave.id)}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                aria-label="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
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
        title="Delete Leave Request"
        description="Are you sure you want to delete this leave request? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
      <ConfirmDialog
        open={!!rejectConfirmId}
        onClose={() => { setRejectConfirmId(null); setRejectReason(''); }}
        onConfirm={() => handleReject(rejectConfirmId!)}
        title="Reject Leave Request"
        description="Please provide an optional reason for rejection."
        confirmLabel="Reject"
        variant="destructive"
      >
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection (optional)"
          rows={2}
          className="mt-3 w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={!!cancelConfirmId}
        onClose={() => { setCancelConfirmId(null); setCancelReason(''); }}
        onConfirm={() => handleCancel(cancelConfirmId!)}
        title="Cancel Leave Request"
        description="Are you sure you want to cancel this leave request?"
        confirmLabel="Cancel Request"
        variant="destructive"
      >
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Reason for cancellation (optional)"
          rows={2}
          className="mt-3 w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={bulkApproveConfirm}
        onClose={() => setBulkApproveConfirm(false)}
        onConfirm={handleBulkApprove}
        title="Approve Selected Requests"
        description={`Are you sure you want to approve ${selectedIds.size} leave request(s)?`}
        confirmLabel="Approve All"
      />
      <ConfirmDialog
        open={bulkRejectConfirm}
        onClose={() => { setBulkRejectConfirm(false); setBulkRejectReason(''); }}
        onConfirm={handleBulkReject}
        title="Reject Selected Requests"
        description={`Reject ${selectedIds.size} leave request(s)?`}
        confirmLabel="Reject All"
        variant="destructive"
      >
        <textarea
          value={bulkRejectReason}
          onChange={(e) => setBulkRejectReason(e.target.value)}
          placeholder="Reason for rejection (optional)"
          rows={2}
          className="mt-3 w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </ConfirmDialog>
    </PageContainer>
  );
}
