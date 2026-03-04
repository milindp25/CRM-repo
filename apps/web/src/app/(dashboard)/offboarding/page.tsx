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
  Calendar, Hash, ArrowRight, FileText, Edit2, Trash2, X as XIcon,
  MessageSquare, Save,
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

interface ChecklistTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  items: { title: string; assignedRole?: string; order?: number }[];
}

const separationTypes = ['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'CONTRACT_END', 'LAYOFF'];
const assignableRoles = ['HR_ADMIN', 'MANAGER', 'EMPLOYEE', 'COMPANY_ADMIN'];

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
  // Exit Interview
  const [showExitInterview, setShowExitInterview] = useState(false);
  const [exitNotes, setExitNotes] = useState('');
  const [savingInterview, setSavingInterview] = useState(false);
  // Checklist Templates
  const [activeTab, setActiveTab] = useState<'processes' | 'templates'>('processes');
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistTemplate | null>(null);
  const [checklistForm, setChecklistForm] = useState({ name: '', isDefault: false, items: [{ title: '', assignedRole: '' }] });
  const [deletingChecklistId, setDeletingChecklistId] = useState<string | null>(null);

  useEffect(() => { Promise.all([fetchProcesses(), fetchEmployees(), fetchChecklists()]); }, []);

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

  const fetchChecklists = async () => {
    try {
      const data = await apiClient.request('/offboarding/checklists');
      setChecklists(Array.isArray(data) ? data : data?.data || []);
    } catch {}
  };

  const handleSaveExitInterview = async () => {
    if (!selectedProcess || !exitNotes.trim()) return;
    try {
      setSavingInterview(true);
      await apiClient.request(`/offboarding/${selectedProcess.id}/exit-interview`, {
        method: 'POST',
        body: JSON.stringify({ notes: exitNotes }),
      });
      toast.success('Exit Interview Saved', 'Interview notes have been recorded');
      setShowExitInterview(false);
      setExitNotes('');
    } catch (err: any) {
      toast.error('Failed to save exit interview', err.message);
    } finally {
      setSavingInterview(false);
    }
  };

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistForm.name.trim()) { toast.error('Validation Error', 'Name is required'); return; }
    const items = checklistForm.items.filter(i => i.title.trim()).map((i, idx) => ({
      title: i.title, assignedRole: i.assignedRole || undefined, order: idx + 1,
    }));
    if (items.length === 0) { toast.error('Validation Error', 'Add at least one task'); return; }
    try {
      setSubmitting(true);
      await apiClient.request('/offboarding/checklists', {
        method: 'POST',
        body: JSON.stringify({ name: checklistForm.name, isDefault: checklistForm.isDefault, items }),
      });
      toast.success('Checklist Created', `"${checklistForm.name}" template created`);
      setShowChecklistForm(false);
      setChecklistForm({ name: '', isDefault: false, items: [{ title: '', assignedRole: '' }] });
      fetchChecklists();
    } catch (err: any) {
      toast.error('Failed to create checklist', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChecklist) return;
    const items = checklistForm.items.filter(i => i.title.trim()).map((i, idx) => ({
      title: i.title, assignedRole: i.assignedRole || undefined, order: idx + 1,
    }));
    try {
      setSubmitting(true);
      await apiClient.request(`/offboarding/checklists/${editingChecklist.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: checklistForm.name, isDefault: checklistForm.isDefault, items }),
      });
      toast.success('Checklist Updated', `"${checklistForm.name}" template updated`);
      setEditingChecklist(null);
      setChecklistForm({ name: '', isDefault: false, items: [{ title: '', assignedRole: '' }] });
      fetchChecklists();
    } catch (err: any) {
      toast.error('Failed to update checklist', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    try {
      await apiClient.request(`/offboarding/checklists/${id}`, { method: 'DELETE' });
      toast.success('Checklist Deleted', 'Template has been removed');
      setDeletingChecklistId(null);
      fetchChecklists();
    } catch (err: any) {
      toast.error('Failed to delete checklist', err.message);
    }
  };

  const addChecklistItem = () => {
    setChecklistForm({ ...checklistForm, items: [...checklistForm.items, { title: '', assignedRole: '' }] });
  };

  const updateChecklistItem = (index: number, field: string, value: string) => {
    const updated = [...checklistForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setChecklistForm({ ...checklistForm, items: updated });
  };

  const removeChecklistItem = (index: number) => {
    setChecklistForm({ ...checklistForm, items: checklistForm.items.filter((_, i) => i !== index) });
  };

  const openEditChecklist = (cl: ChecklistTemplate) => {
    setEditingChecklist(cl);
    setChecklistForm({
      name: cl.name,
      isDefault: cl.isDefault,
      items: cl.items.length > 0 ? cl.items.map(i => ({ title: i.title, assignedRole: i.assignedRole || '' })) : [{ title: '', assignedRole: '' }],
    });
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

        {/* Exit Interview */}
        {selectedProcess.status !== 'COMPLETED' && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Exit Interview</h3>
              </div>
              {!showExitInterview && (
                <button
                  onClick={() => setShowExitInterview(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-input bg-background text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <FileText className="w-3 h-3" /> Record Interview
                </button>
              )}
            </div>
            {showExitInterview && (
              <div className="space-y-3">
                <textarea
                  value={exitNotes}
                  onChange={(e) => setExitNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors min-h-[120px]"
                  placeholder="Record exit interview notes, reason for leaving, feedback, suggestions for improvement..."
                  rows={5}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setShowExitInterview(false); setExitNotes(''); }}
                    className="h-8 px-3 text-xs font-medium border border-input rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveExitInterview}
                    disabled={savingInterview || !exitNotes.trim()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {savingInterview ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save Interview
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('processes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'processes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Processes
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'templates' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Checklist Templates
        </button>
      </div>

      {/* Processes Tab */}
      {activeTab === 'processes' && (
        <>
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
        </>
      )}

      {/* Checklist Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setShowChecklistForm(true); setChecklistForm({ name: '', isDefault: false, items: [{ title: '', assignedRole: '' }] }); }}
              className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Template
            </button>
          </div>

          {checklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
              <ClipboardList className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No checklist templates</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Create reusable checklist templates to standardize your offboarding process.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {checklists.map((cl) => (
                <div key={cl.id} className="group rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{cl.name}</h3>
                        {cl.isDefault && <StatusBadge variant="info">Default</StatusBadge>}
                        {!cl.isActive && <StatusBadge variant="neutral">Inactive</StatusBadge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {cl.items?.length || 0} tasks
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditChecklist(cl)}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {deletingChecklistId === cl.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => handleDeleteChecklist(cl.id)} className="px-2 py-1 text-destructive font-medium hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors">Delete</button>
                          <button onClick={() => setDeletingChecklistId(null)} className="px-2 py-1 text-muted-foreground hover:bg-muted rounded-md transition-colors">Cancel</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeletingChecklistId(cl.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {cl.items && cl.items.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {cl.items.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-4 h-4 rounded border border-input flex-shrink-0" />
                          <span>{item.title}</span>
                          {item.assignedRole && <StatusBadge variant="neutral">{item.assignedRole.replace(/_/g, ' ')}</StatusBadge>}
                        </div>
                      ))}
                      {cl.items.length > 5 && (
                        <p className="text-xs text-muted-foreground pl-6">...and {cl.items.length - 5} more tasks</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Checklist Template Modal */}
      <Modal
        open={showChecklistForm || !!editingChecklist}
        onClose={() => { setShowChecklistForm(false); setEditingChecklist(null); setChecklistForm({ name: '', isDefault: false, items: [{ title: '', assignedRole: '' }] }); }}
        size="lg"
      >
        <ModalHeader onClose={() => { setShowChecklistForm(false); setEditingChecklist(null); }}>
          {editingChecklist ? 'Edit Checklist Template' : 'Create Checklist Template'}
        </ModalHeader>
        <form onSubmit={editingChecklist ? handleUpdateChecklist : handleCreateChecklist}>
          <ModalBody>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Template Name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={checklistForm.name}
                  onChange={(e) => setChecklistForm({ ...checklistForm, name: e.target.value })}
                  placeholder="e.g. Standard Offboarding Checklist"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={checklistForm.isDefault}
                  onChange={(e) => setChecklistForm({ ...checklistForm, isDefault: e.target.checked })}
                  className="accent-primary"
                />
                <label htmlFor="isDefault" className="text-sm text-foreground cursor-pointer">Set as default checklist</label>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">Tasks</label>
                  <button type="button" onClick={addChecklistItem} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </button>
                </div>
                <div className="space-y-2">
                  {checklistForm.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateChecklistItem(i, 'title', e.target.value)}
                        placeholder={`Task ${i + 1}`}
                        className={inputClass}
                      />
                      <select
                        value={item.assignedRole}
                        onChange={(e) => updateChecklistItem(i, 'assignedRole', e.target.value)}
                        className="h-10 w-40 px-2 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      >
                        <option value="">No role</option>
                        {assignableRoles.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                      </select>
                      {checklistForm.items.length > 1 && (
                        <button type="button" onClick={() => removeChecklistItem(i)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted transition-colors flex-shrink-0">
                          <XIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button type="button" onClick={() => { setShowChecklistForm(false); setEditingChecklist(null); }} disabled={submitting}
              className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingChecklist ? 'Save Changes' : 'Create Template'}
            </button>
          </ModalFooter>
        </form>
      </Modal>

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
