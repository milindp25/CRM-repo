'use client';

import { useState, useEffect } from 'react';
import { apiClient, type ShiftDefinition, type ShiftAssignment } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import { useToast } from '@/components/ui/toast';
import {
  Plus, Loader2, AlertCircle, Clock, Sun, Moon, CalendarDays,
  Timer, LayoutGrid
} from 'lucide-react';

const INITIAL_FORM = {
  name: '', code: '', startTime: '09:00', endTime: '18:00',
  breakDuration: 60, color: '#3B82F6', isOvernight: false,
  graceMinutes: 15, description: '',
};

export default function ShiftsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'definitions' | 'my-shifts'>('definitions');
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [myShifts, setMyShifts] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'definitions') fetchShifts();
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

  const fetchCurrent = () => activeTab === 'definitions' ? fetchShifts() : fetchMyShifts();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await apiClient.createShift({
        ...form,
        breakDuration: Number(form.breakDuration),
        graceMinutes: Number(form.graceMinutes),
      });
      setShowForm(false);
      setForm(INITIAL_FORM);
      toast.success('Shift created', 'New shift definition has been created successfully.');
      fetchShifts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create shift');
    } finally {
      setSubmitting(false);
    }
  };

  const openNewForm = () => {
    setShowForm(true);
    setForm(INITIAL_FORM);
    setFormError(null);
  };

  // Stats
  const overnight = shifts.filter(s => s.isOvernight).length;

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
            ) : undefined
          }
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={fetchCurrent} />}

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-border">
            <button
              onClick={() => setActiveTab('definitions')}
              className={`pb-3 px-4 font-medium text-sm transition-colors ${
                activeTab === 'definitions'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Shift Definitions
            </button>
            <button
              onClick={() => setActiveTab('my-shifts')}
              className={`pb-3 px-4 font-medium text-sm transition-colors ${
                activeTab === 'my-shifts'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Shifts
            </button>
          </div>

          {/* Definitions Tab */}
          {activeTab === 'definitions' && (
            <>
              {/* Stats */}
              {!loading && shifts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard title="Total Shifts" value={shifts.length} icon={LayoutGrid} iconColor="blue" subtitle="Defined shifts" />
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
                    <div key={shift.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-all group">
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
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: shift.color || '#3B82F6' }} />
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
                      </div>
                    </div>
                  ))}
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
                            <span className="text-sm text-foreground font-medium">{assignment.shift?.name || assignment.shiftId}</span>
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

          {/* Create Shift Modal */}
          <Modal open={showForm} onClose={() => setShowForm(false)} size="lg">
            <ModalHeader onClose={() => setShowForm(false)}>Create Shift Definition</ModalHeader>
            <form onSubmit={handleCreate}>
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
                    <div className="flex items-center gap-2 pt-7 md:col-span-2">
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
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting}
                  className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Shift
                </button>
              </ModalFooter>
            </form>
          </Modal>
        </PageContainer>
      </RoleGate>
    </FeatureGate>
  );
}
