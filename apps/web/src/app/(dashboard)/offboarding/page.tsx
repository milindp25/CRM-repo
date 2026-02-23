'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

interface OffboardingProcess {
  id: string;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string };
  separationType: string;
  lastWorkingDay: string;
  status: string;
  tasks: { id: string; title: string; status: string; assignedRole: string | null; completedAt: string | null }[];
  createdAt: string;
}

export default function OffboardingPage() {
  const toast = useToast();
  const [processes, setProcesses] = useState<OffboardingProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStart, setShowStart] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<OffboardingProcess | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [form, setForm] = useState({ employeeId: '', separationType: 'RESIGNATION', lastWorkingDay: '' });
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => { fetchProcesses(); fetchEmployees(); }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request('/offboarding');
      setProcesses(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) { toast.error('Failed to load offboarding processes', err.message); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const data = await apiClient.getEmployees();
      setEmployees(Array.isArray(data) ? data : data?.data || []);
    } catch {}
  };

  const validateForm = (): boolean => {
    if (!form.employeeId) {
      toast.error('Validation Error', 'Please select an employee');
      return false;
    }
    if (!form.lastWorkingDay) {
      toast.error('Validation Error', 'Please select a last working day');
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    if (form.lastWorkingDay < today) {
      toast.warning('Date Warning', 'Last working day is in the past');
    }
    return true;
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await apiClient.request('/offboarding/start', { method: 'POST', body: JSON.stringify(form) });
      setShowStart(false);
      toast.success('Offboarding Started', 'The offboarding process has been initiated');
      fetchProcesses();
    } catch (err: any) { toast.error('Failed to start offboarding', err.message); }
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
    } catch (err: any) { toast.error('Failed to complete task', err.message); }
  };

  const handleComplete = async (processId: string) => {
    try {
      await apiClient.request(`/offboarding/${processId}/complete`, { method: 'POST' });
      toast.success('Offboarding Completed', 'Employee has been offboarded and deactivated');
      setSelectedProcess(null);
      setConfirmComplete(false);
      fetchProcesses();
    } catch (err: any) { toast.error('Failed to complete offboarding', err.message); }
  };

  const statusColors: Record<string, string> = {
    INITIATED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    IN_PROGRESS: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    CANCELLED: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
  };

  const separationTypes = ['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'CONTRACT_END', 'LAYOFF'];

  if (selectedProcess) {
    const completedTasks = selectedProcess.tasks.filter((t) => t.status === 'COMPLETED').length;
    const totalTasks = selectedProcess.tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedProcess(null)} className="text-muted-foreground hover:text-foreground">&larr; Back</button>
          <h1 className="text-2xl font-bold text-foreground">
            {selectedProcess.employee.firstName} {selectedProcess.employee.lastName} - Offboarding
          </h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedProcess.status] || ''}`}>{selectedProcess.status}</span>
        </div>

        
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">{completedTasks}/{totalTasks} tasks</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">Separation:</span> <span className="text-foreground ml-1">{selectedProcess.separationType}</span></div>
          <div><span className="text-muted-foreground">Last Day:</span> <span className="text-foreground ml-1">{new Date(selectedProcess.lastWorkingDay).toLocaleDateString()}</span></div>
          <div><span className="text-muted-foreground">Employee:</span> <span className="text-foreground ml-1">{selectedProcess.employee.employeeCode}</span></div>
          <div><span className="text-muted-foreground">Started:</span> <span className="text-foreground ml-1">{new Date(selectedProcess.createdAt).toLocaleDateString()}</span></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Checklist</h2>
          {selectedProcess.tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.status === 'COMPLETED'}
                  onChange={() => task.status !== 'COMPLETED' && handleCompleteTask(selectedProcess.id, task.id)}
                  disabled={task.status === 'COMPLETED'}
                  className="h-4 w-4"
                />
                <span className={`text-sm ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</span>
              </div>
              {task.assignedRole && <span className="text-xs text-muted-foreground">{task.assignedRole}</span>}
            </div>
          ))}
        </div>

        {selectedProcess.status !== 'COMPLETED' && !confirmComplete && (
          <button onClick={() => setConfirmComplete(true)} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90">
            Complete Offboarding
          </button>
        )}
        {confirmComplete && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-destructive">Are you sure? This will deactivate the employee account and cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => handleComplete(selectedProcess.id)} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 text-sm">
                Yes, Complete Offboarding
              </button>
              <button onClick={() => setConfirmComplete(false)} className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Offboarding</h1>
          <p className="text-muted-foreground">Manage employee exits and separation processes</p>
        </div>
        <button onClick={() => setShowStart(!showStart)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          {showStart ? 'Cancel' : 'Start Offboarding'}
        </button>
      </div>

      {showStart && (
        <form onSubmit={handleStart} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Employee</label>
              <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required>
                <option value="">Select...</option>
                {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Separation Type</label>
              <select value={form.separationType} onChange={(e) => setForm({ ...form, separationType: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                {separationTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Last Working Day</label>
              <input type="date" value={form.lastWorkingDay} onChange={(e) => setForm({ ...form, lastWorkingDay: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Start Offboarding</button>
        </form>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : processes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No offboarding processes</div>
        ) : (
          processes.map((p) => {
            const completedTasks = p.tasks?.filter((t) => t.status === 'COMPLETED').length || 0;
            const totalTasks = p.tasks?.length || 0;
            return (
              <div key={p.id} onClick={() => setSelectedProcess(p)} className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{p.employee.firstName} {p.employee.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{p.separationType.replace(/_/g, ' ')} &middot; Last day: {new Date(p.lastWorkingDay).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{completedTasks}/{totalTasks} tasks</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || ''}`}>{p.status}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
