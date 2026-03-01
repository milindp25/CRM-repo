'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageContainer } from '@/components/ui/page-container';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import {
  UserMinus, Plus, ArrowLeft, Loader2, AlertCircle,
  ClipboardList, CheckCircle2, Clock, AlertTriangle, UserX,
  Calendar, Hash, ArrowRight,
} from 'lucide-react';

interface OffboardingProcess {
  id: string;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string };
  separationType: string;
  lastWorkingDay: string;
  status: string;
  tasks: { id: string; title: string; status: string; assignedRole: string | null; completedAt: string | null }[];
  createdAt: string;
}

const separationTypes = ['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'CONTRACT_END', 'LAYOFF'];

export default function OffboardingPage() {
  const toast = useToast();
  const [processes, setProcesses] = useState<OffboardingProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStart, setShowStart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<OffboardingProcess | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [form, setForm] = useState({ employeeId: '', separationType: 'RESIGNATION', lastWorkingDay: '' });
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => { fetchProcesses(); fetchEmployees(); }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.request('/offboarding');
      setProcesses(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load offboarding processes');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await apiClient.getEmployees();
      setEmployees(Array.isArray(data) ? data : data?.data || []);
    } catch {}
  };

  const validateForm = (): string | null => {
    if (!form.employeeId) return 'Please select an employee';
    if (!form.lastWorkingDay) return 'Please select a last working day';
    return null;
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setFormError(validationError); return; }
    const today = new Date().toISOString().split('T')[0];
    if (form.lastWorkingDay < today) {
      toast.warning('Date Warning', 'Last working day is in the past');
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await apiClient.request('/offboarding/start', { method: 'POST', body: JSON.stringify(form) });
      setShowStart(false);
      setForm({ employeeId: '', separationType: 'RESIGNATION', lastWorkingDay: '' });
      toast.success('Offboarding Started', 'The offboarding process has been initiated');
      fetchProcesses();
    } catch (err: any) {
      setFormError(err.message || 'Failed to start offboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async (processId: string, taskId: string) => {
    try {
      await apiClient.request(`/offboarding/${processId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      toast.success('Task Completed', 'Offboarding task marked as complete');
      fetchProcesses();
      if (selectedProcess?.id === processId) {
        const updated = await apiClient.request(`/offboarding/${processId}`);
        setSelectedProcess(updated);
      }
    } catch (err: any) {
      toast.error('Failed to complete task', err.message);
    }
  };

  const handleComplete = async (processId: string) => {
    try {
      await apiClient.request(`/offboarding/${processId}/complete`, { method: 'POST' });
      toast.success('Offboarding Completed', 'Employee has been offboarded and deactivated');
      setSelectedProcess(null);
      setConfirmComplete(false);
      fetchProcesses();
    } catch (err: any) {
      toast.error('Failed to complete offboarding', err.message);
    }
  };

  const openStartForm = () => {
    setShowStart(true);
    setFormError(null);
    setForm({ employeeId: '', separationType: 'RESIGNATION', lastWorkingDay: '' });
  };

  const inProgressCount = processes.filter(p => p.status === 'IN_PROGRESS' || p.status === 'INITIATED').length;
  const completedCount = processes.filter(p => p.status === 'COMPLETED').length;
  const inputClass = 'w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

  // Process detail view
  if (selectedProcess) {
    const completedTasks = selectedProcess.tasks.filter((t) => t.status === 'COMPLETED').length;
    const totalTasks = selectedProcess.tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
      <PageContainer
        title={`${selectedProcess.employee.firstName} ${selectedProcess.employee.lastName}`}
        description="Offboarding Process"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Offboarding', href: '/offboarding' },
          { label: `${selectedProcess.employee.firstName} ${selectedProcess.employee.lastName}` },
        ]}
        actions={
          <StatusBadge variant={getStatusVariant(selectedProcess.status)} dot size="md">
            {selectedProcess.status.replace(/_/g, ' ')}
          </StatusBadge>
        }
      >
        <button
          onClick={() => { setSelectedProcess(null); setConfirmComplete(false); }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Offboarding
        </button>

        {/* Progress Bar */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">{completedTasks}/{totalTasks} tasks ({progress}%)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Details Card */}
        <div className="rounded-xl border bg-card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Separation Type</span>
            <p className="text-foreground font-medium">{selectedProcess.separationType.replace(/_/g, ' ')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Last Working Day</span>
            <p className="text-foreground font-medium">{new Date(selectedProcess.lastWorkingDay).toLocaleDateString()}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Employee Code</span>
            <p className="text-foreground font-medium font-mono">{selectedProcess.employee.employeeCode}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Started</span>
            <p className="text-foreground font-medium">{new Date(selectedProcess.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Checklist */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Checklist</h2>
          <div className="space-y-2">
            {selectedProcess.tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-xl border bg-card p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => task.status !== 'COMPLETED' && handleCompleteTask(selectedProcess.id, task.id)}
                    disabled={task.status === 'COMPLETED'}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      task.status === 'COMPLETED'
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-input hover:border-primary'
                    }`}
                  >
                    {task.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <span className={`text-sm ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </span>
                </div>
                {task.assignedRole && (
                  <StatusBadge variant="neutral">{task.assignedRole.replace(/_/g, ' ')}</StatusBadge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Complete Offboarding */}
        {selectedProcess.status !== 'COMPLETED' && !confirmComplete && (
          <button
            onClick={() => setConfirmComplete(true)}
            className="inline-flex items-center gap-2 h-9 px-4 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <UserX className="w-4 h-4" /> Complete Offboarding
          </button>
        )}
        {confirmComplete && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Are you sure?</p>
                <p className="text-sm text-muted-foreground mt-1">This will deactivate the employee account and cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 ml-8">
              <button
                onClick={() => handleComplete(selectedProcess.id)}
                className="h-9 px-4 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Yes, Complete Offboarding
              </button>
              <button
                onClick={() => setConfirmComplete(false)}
                className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </PageContainer>
    );
  }

  // Main list view
  return (
    <PageContainer
      title="Exit Process"
      description="Manage employee departures and ensure a smooth transition"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Exit Process' }]}
      actions={
        <button
          onClick={openStartForm}
          className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Start Offboarding
        </button>
      }
    >
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={fetchProcesses} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Processes" value={processes.length} icon={UserMinus} iconColor="blue" loading={loading} />
        <StatCard title="In Progress" value={inProgressCount} icon={Clock} iconColor="amber" loading={loading} />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle2} iconColor="green" loading={loading} />
      </div>

      {/* Process List */}
      {loading ? (
        <div className="rounded-xl border bg-card overflow-hidden">
          <TableLoader rows={4} cols={4} />
        </div>
      ) : processes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
          <ClipboardList className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No offboarding processes</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">Start an offboarding process when an employee is leaving the organization.</p>
          <button
            onClick={openStartForm}
            className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Start Offboarding
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {processes.map((p) => {
            const completedTasks = p.tasks?.filter((t) => t.status === 'COMPLETED').length || 0;
            const totalTasks = p.tasks?.length || 0;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProcess(p)}
                className="rounded-xl border bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                      <UserMinus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{p.employee.firstName} {p.employee.lastName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {p.separationType.replace(/_/g, ' ')} &middot; Last day: {new Date(p.lastWorkingDay).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{completedTasks}/{totalTasks}</span>
                    </div>
                    <StatusBadge variant={getStatusVariant(p.status)} dot>{p.status.replace(/_/g, ' ')}</StatusBadge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Start Offboarding Modal */}
      <Modal open={showStart} onClose={() => setShowStart(false)} size="md">
        <ModalHeader onClose={() => setShowStart(false)}>Start Offboarding</ModalHeader>
        <form onSubmit={handleStart}>
          <ModalBody>
            <div className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Employee <span className="text-destructive">*</span></label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className={inputClass}
                  required
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Separation Type</label>
                <select
                  value={form.separationType}
                  onChange={(e) => setForm({ ...form, separationType: e.target.value })}
                  className={inputClass}
                >
                  {separationTypes.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Last Working Day <span className="text-destructive">*</span></label>
                <input
                  type="date"
                  value={form.lastWorkingDay}
                  onChange={(e) => setForm({ ...form, lastWorkingDay: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button type="button" onClick={() => setShowStart(false)} disabled={submitting}
              className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Start Offboarding
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </PageContainer>
  );
}
