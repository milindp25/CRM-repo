'use client';

import { useState, useEffect } from 'react';
import { apiClient, type ShiftDefinition, type ShiftAssignment, type Employee } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import { useToast } from '@/components/ui/toast';
import {
  Plus, Loader2, AlertCircle, Clock, Sun, Moon, CalendarDays,
  Timer, LayoutGrid, Edit2, Trash2, Power, Users, UserPlus, X, Check,
} from 'lucide-react';

const INITIAL_FORM = {
  name: '', code: '', startTime: '09:00', endTime: '18:00',
  breakDuration: 60, color: '#3B82F6', isOvernight: false,
  graceMinutes: 15, description: '',
};

type FormState = typeof INITIAL_FORM;

export default function ShiftsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'definitions' | 'assignments' | 'my-shifts'>('definitions');
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [myShifts, setMyShifts] = useState<ShiftAssignment[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create / Edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Assignment modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignShiftId, setAssignShiftId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [assignForm, setAssignForm] = useState({ employeeId: '', assignmentDate: '', endDate: '', notes: '' });
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'definitions') fetchShifts();
    else if (activeTab === 'assignments') { fetchShifts(); fetchAssignments(); }
    else fetchMyShifts();
  }, [activeTab]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getShifts();
      setShifts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyShifts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyShiftAssignments();
      setMyShifts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getShiftAssignments();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrent = () => {
    if (activeTab === 'definitions') fetchShifts();
    else if (activeTab === 'assignments') { fetchShifts(); fetchAssignments(); }
    else fetchMyShifts();
  };

  // Create / Edit handlers
  const openNewForm = () => {
    setEditingShift(null);
    setShowForm(true);
    setForm(INITIAL_FORM);
    setFormError(null);
  };

  const openEditForm = (shift: ShiftDefinition) => {
    setEditingShift(shift);
    setForm({
      name: shift.name,
      code: shift.code,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      color: shift.color || '#3B82F6',
      isOvernight: shift.isOvernight,
      graceMinutes: shift.graceMinutes,
      description: shift.description || '',
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const payload = {
      ...form,
      breakDuration: Number(form.breakDuration),
      graceMinutes: Number(form.graceMinutes),
    };
    try {
      if (editingShift) {
        await apiClient.updateShift(editingShift.id, payload);
        toast.success('Shift Updated', `"${form.name}" has been updated successfully.`);
      } else {
        await apiClient.createShift(payload);
        toast.success('Shift Created', 'New shift definition has been created successfully.');
      }
      setShowForm(false);
      setForm(INITIAL_FORM);
      setEditingShift(null);
      fetchShifts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save shift');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteShift(id);
      setDeletingId(null);
      toast.success('Shift Deleted', 'Shift definition has been removed.');
      fetchShifts();
    } catch (err: any) {
      toast.error('Failed to delete shift', err.message);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (shift: ShiftDefinition) => {
    try {
      await apiClient.updateShift(shift.id, { isActive: !shift.isActive } as any);
      toast.success(
        shift.isActive ? 'Shift Deactivated' : 'Shift Activated',
        `"${shift.name}" is now ${shift.isActive ? 'inactive' : 'active'}.`
      );
      fetchShifts();
    } catch (err: any) {
      toast.error('Failed to toggle shift', err.message);
    }
  };

  // Assignment handlers
  const openAssignModal = async (shiftId?: string) => {
    setShowAssign(true);
    setAssignShiftId(shiftId || '');
    setAssignForm({ employeeId: '', assignmentDate: '', endDate: '', notes: '' });
    if (employees.length === 0) {
      setLoadingEmployees(true);
      try {
        const res = await apiClient.getEmployees({ page: 1, limit: 200 });
        setEmployees(res.data || []);
      } catch (err: any) {
        toast.error('Failed to load employees', err.message);
      } finally {
        setLoadingEmployees(false);
      }
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignShiftId || !assignForm.employeeId || !assignForm.assignmentDate) return;
    setAssignSubmitting(true);
    try {
      await apiClient.assignShift(assignShiftId, {
        employeeId: assignForm.employeeId,
        assignmentDate: assignForm.assignmentDate,
        endDate: assignForm.endDate || undefined,
        notes: assignForm.notes || undefined,
      });
      toast.success('Employee Assigned', 'Shift assignment created successfully.');
      setShowAssign(false);
      fetchAssignments();
    } catch (err: any) {
      toast.error('Failed to assign', err.message);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    try {
      await apiClient.deleteShiftAssignment(id);
      toast.success('Assignment Removed', 'Shift assignment has been removed.');
      fetchAssignments();
    } catch (err: any) {
      toast.error('Failed to remove assignment', err.message);
    }
  };

  // Stats
  const overnight = shifts.filter(s => s.isOvernight).length;
  const active = shifts.filter(s => s.isActive).length;

  const inputClass = 'w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

  return (
    <FeatureGate feature="SHIFTS">
      <RoleGate requiredPermissions={[Permission.VIEW_SHIFTS, Permission.MANAGE_SHIFTS]}>
        <PageContainer
          title="Shift Management"
          description="Define shifts and manage assignments"
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Shifts' }]}
          actions={
            activeTab === 'definitions' ? (
              <RoleGate requiredPermissions={[Permission.MANAGE_SHIFTS]} hideOnly>
                <button
                  onClick={openNewForm}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> New Shift
                </button>
              </RoleGate>
            ) : activeTab === 'assignments' ? (
              <RoleGate requiredPermissions={[Permission.MANAGE_SHIFTS]} hideOnly>
                <button
                  onClick={() => openAssignModal()}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Assign Employee
                </button>
              </RoleGate>
            ) : undefined
          }
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={fetchCurrent} />}

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-border">
            {(['definitions', 'assignments', 'my-shifts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'definitions' ? 'Shift Definitions' : tab === 'assignments' ? 'Assignments' : 'My Shifts'}
              </button>
            ))}
          </div>

          {/* Definitions Tab */}
          {activeTab === 'definitions' && (
            <>
              {/* Stats */}
              {!loading && shifts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Shifts" value={shifts.length} icon={LayoutGrid} iconColor="blue" subtitle="Defined shifts" />
                  <StatCard title="Active" value={active} icon={Check} iconColor="green" subtitle="Currently active" />
                  <StatCard title="Day Shifts" value={shifts.length - overnight} icon={Sun} iconColor="amber" subtitle="Standard hours" />
                  <StatCard title="Overnight" value={overnight} icon={Moon} iconColor="purple" subtitle="Night shifts" />
                </div>
              )}

              {loading ? (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <TableLoader rows={4} cols={4} />
                </div>
              ) : shifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                  <Clock className="w-12 h-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No shift definitions yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Create your first shift definition to start scheduling employees.</p>
                  <RoleGate requiredPermissions={[Permission.MANAGE_SHIFTS]} hideOnly>
                    <button onClick={openNewForm} className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                      <Plus className="w-4 h-4" /> Create Shift
                    </button>
                  </RoleGate>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shifts.map(shift => (
                    <div key={shift.id} className={`rounded-xl border bg-card p-5 hover:shadow-md transition-all group ${!shift.isActive ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: (shift.color || '#3B82F6') + '20' }}
                        >
                          {shift.isOvernight ? (
                            <Moon className="w-5 h-5" style={{ color: shift.color || '#3B82F6' }} />
                          ) : (
                            <Sun className="w-5 h-5" style={{ color: shift.color || '#3B82F6' }} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate">{shift.name}</h3>
                          <span className="text-xs font-mono text-muted-foreground">{shift.code}</span>
                        </div>
                        {/* Status badge */}
                        <StatusBadge
                          variant={shift.isActive ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {shift.isActive ? 'Active' : 'Inactive'}
                        </StatusBadge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">{shift.startTime} - {shift.endTime}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" /> Break: {shift.breakDuration}m
                          </span>
                          <span>Grace: {shift.graceMinutes}m</span>
                        </div>
                        {shift.isOvernight && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                            <Moon className="w-3 h-3" /> Overnight shift
                          </span>
                        )}
                        {shift.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{shift.description}</p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <RoleGate requiredPermissions={[Permission.MANAGE_SHIFTS]} hideOnly>
                        {deletingId === shift.id ? (
                          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
                            <span className="text-xs text-destructive font-medium flex-1">Delete this shift?</span>
                            <button
                              onClick={() => handleDelete(shift.id)}
                              className="h-7 px-3 bg-destructive text-destructive-foreground rounded-md text-xs font-medium hover:bg-destructive/90 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="h-7 px-3 border border-input rounded-md text-xs font-medium hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center gap-1 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditForm(shift)}
                              className="h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => openAssignModal(shift.id)}
                              className="h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1"
                              title="Assign employees"
                            >
                              <Users className="w-3.5 h-3.5" /> Assign
                            </button>
                            <button
                              onClick={() => handleToggleActive(shift)}
                              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                                shift.isActive
                                  ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                  : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                              }`}
                              title={shift.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <Power className="w-3.5 h-3.5" /> {shift.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => setDeletingId(shift.id)}
                              className="h-7 px-2.5 rounded-md text-xs font-medium text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors inline-flex items-center gap-1 ml-auto"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </RoleGate>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <>
              {loading ? (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <TableLoader rows={5} cols={5} />
                </div>
              ) : assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                  <Users className="w-12 h-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No shift assignments</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Assign employees to shifts to get started.</p>
                  <RoleGate requiredPermissions={[Permission.MANAGE_SHIFTS]} hideOnly>
                    <button onClick={() => openAssignModal()} className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                      <UserPlus className="w-4 h-4" /> Assign Employee
                    </button>
                  </RoleGate>
                </div>
              ) : (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <table className="min-w-full divide-y">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Shift</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">End Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assignments.map(a => (
                        <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            {a.employeeId.slice(0, 8)}...
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {a.shift && (
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.shift.color || '#3B82F6' }} />
                              )}
                              <span className="text-sm font-medium text-foreground">{a.shift?.name || a.shiftId.slice(0, 8)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(a.assignmentDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {a.endDate ? new Date(a.endDate).toLocaleDateString() : 'Ongoing'}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{a.notes || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <RoleGate requiredPermissions={[Permission.MANAGE_SHIFTS]} hideOnly>
                              <button
                                onClick={() => handleRemoveAssignment(a.id)}
                                className="h-7 px-2.5 rounded-md text-xs font-medium text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors inline-flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" /> Remove
                              </button>
                            </RoleGate>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* My Shifts Tab */}
          {activeTab === 'my-shifts' && (
            <>
              {loading ? (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <TableLoader rows={5} cols={3} />
                </div>
              ) : myShifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                  <CalendarDays className="w-12 h-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No shift assignments</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">You don&apos;t have any shift assignments yet.</p>
                </div>
              ) : (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <table className="min-w-full divide-y">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Shift</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {myShifts.map(assignment => (
                        <tr key={assignment.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                                <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {new Date(assignment.assignmentDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {assignment.shift && (
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: assignment.shift.color || '#3B82F6' }} />
                              )}
                              <span className="text-sm font-medium text-foreground">{assignment.shift?.name || assignment.shiftId}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {assignment.shift ? `${assignment.shift.startTime} - ${assignment.shift.endTime}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{assignment.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Create / Edit Shift Modal */}
          <Modal open={showForm} onClose={() => { setShowForm(false); setEditingShift(null); }} size="lg">
            <ModalHeader onClose={() => { setShowForm(false); setEditingShift(null); }}>
              {editingShift ? 'Edit Shift Definition' : 'Create Shift Definition'}
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <div className="space-y-4">
                  {formError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Name <span className="text-destructive">*</span></label>
                      <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="Morning Shift" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Code <span className="text-destructive">*</span></label>
                      <input type="text" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className={inputClass} placeholder="MORNING" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 border border-input rounded-lg cursor-pointer" />
                        <span className="text-xs text-muted-foreground font-mono">{form.color}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Start Time <span className="text-destructive">*</span></label>
                      <input type="time" required value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">End Time <span className="text-destructive">*</span></label>
                      <input type="time" required value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Break (mins)</label>
                      <input type="number" min="0" value={form.breakDuration} onChange={e => setForm(p => ({ ...p, breakDuration: Number(e.target.value) }))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Grace (mins)</label>
                      <input type="number" min="0" value={form.graceMinutes} onChange={e => setForm(p => ({ ...p, graceMinutes: Number(e.target.value) }))} className={inputClass} />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="Optional description" />
                    </div>
                    <div className="flex items-center gap-2 pt-7">
                      <input
                        type="checkbox"
                        id="overnight"
                        checked={form.isOvernight}
                        onChange={e => setForm(p => ({ ...p, isOvernight: e.target.checked }))}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                      />
                      <label htmlFor="overnight" className="text-sm font-medium text-foreground">Overnight shift</label>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button type="button" onClick={() => { setShowForm(false); setEditingShift(null); }} disabled={submitting}
                  className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingShift ? 'Update Shift' : 'Create Shift'}
                </button>
              </ModalFooter>
            </form>
          </Modal>

          {/* Assign Employee Modal */}
          <Modal open={showAssign} onClose={() => setShowAssign(false)} size="md">
            <ModalHeader onClose={() => setShowAssign(false)}>Assign Employee to Shift</ModalHeader>
            <form onSubmit={handleAssign}>
              <ModalBody>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Shift <span className="text-destructive">*</span></label>
                    <select
                      required
                      value={assignShiftId}
                      onChange={e => setAssignShiftId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select a shift...</option>
                      {shifts.filter(s => s.isActive).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Employee <span className="text-destructive">*</span></label>
                    {loadingEmployees ? (
                      <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading employees...
                      </div>
                    ) : (
                      <select
                        required
                        value={assignForm.employeeId}
                        onChange={e => setAssignForm(p => ({ ...p, employeeId: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="">Select an employee...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Start Date <span className="text-destructive">*</span></label>
                      <input
                        type="date"
                        required
                        value={assignForm.assignmentDate}
                        onChange={e => setAssignForm(p => ({ ...p, assignmentDate: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">End Date</label>
                      <input
                        type="date"
                        value={assignForm.endDate}
                        onChange={e => setAssignForm(p => ({ ...p, endDate: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Notes</label>
                    <input
                      type="text"
                      value={assignForm.notes}
                      onChange={e => setAssignForm(p => ({ ...p, notes: e.target.value }))}
                      className={inputClass}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button type="button" onClick={() => setShowAssign(false)} disabled={assignSubmitting}
                  className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={assignSubmitting || !assignShiftId || !assignForm.employeeId}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
                  {assignSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assign
                </button>
              </ModalFooter>
            </form>
          </Modal>
        </PageContainer>
      </RoleGate>
    </FeatureGate>
  );
}
