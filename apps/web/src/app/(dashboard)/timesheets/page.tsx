'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageContainer } from '@/components/ui/page-container';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import {
  Clock, Plus, Calendar, FileCheck, Send, ChevronLeft, Timer,
  ClipboardList,
} from 'lucide-react';

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  projectName: string | null;
  taskDescription: string | null;
  entryType: string;
  isBillable: boolean;
}

interface Timesheet {
  id: string;
  weekStartDate: string;
  status: string;
  totalHours: number;
  notes: string | null;
  entries: TimeEntry[];
  employee?: { firstName: string; lastName: string; employeeCode: string };
  submittedAt: string | null;
  approvedAt: string | null;
}

const defaultEntryForm = { date: '', hours: '', projectName: '', taskDescription: '', entryType: 'REGULAR' };

export default function TimesheetsPage() {
  const toast = useToast();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSheet, setSelectedSheet] = useState<Timesheet | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [weekStart, setWeekStart] = useState('');
  const [entryForm, setEntryForm] = useState({ ...defaultEntryForm });
  const [showAddEntry, setShowAddEntry] = useState(false);

  useEffect(() => { fetchTimesheets(); }, []);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.request('/timesheets/my');
      setTimesheets(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const validateWeekStart = (): boolean => {
    if (!weekStart) {
      toast.error('Validation Error', 'Please select a week start date');
      return false;
    }
    const date = new Date(weekStart);
    if (date.getUTCDay() !== 1) {
      toast.warning('Auto-adjusted', 'Date will be normalized to the nearest Monday by the server');
    }
    return true;
  };

  const validateEntry = (): boolean => {
    if (!entryForm.date) {
      toast.error('Validation Error', 'Please select a date for this entry');
      return false;
    }
    if (!entryForm.hours || Number(entryForm.hours) <= 0) {
      toast.error('Validation Error', 'Hours must be greater than 0');
      return false;
    }
    if (Number(entryForm.hours) > 24) {
      toast.error('Validation Error', 'Hours cannot exceed 24 per day');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateWeekStart()) return;
    try {
      const ts = await apiClient.request('/timesheets', { method: 'POST', body: JSON.stringify({ weekStartDate: weekStart }) });
      setShowCreate(false);
      setWeekStart('');
      toast.success('Timesheet Created', 'You can now add time entries');
      fetchTimesheets();
      setSelectedSheet(ts);
    } catch (err: any) { toast.error('Failed to create timesheet', err.message); }
  };

  const handleAddEntry = async () => {
    if (!selectedSheet) return;
    if (!validateEntry()) return;
    try {
      await apiClient.request(`/timesheets/${selectedSheet.id}/entries`, {
        method: 'POST',
        body: JSON.stringify({ ...entryForm, hours: Number(entryForm.hours) }),
      });
      setEntryForm({ ...defaultEntryForm });
      setShowAddEntry(false);
      const updated = await apiClient.request(`/timesheets/${selectedSheet.id}`);
      setSelectedSheet(updated);
      toast.success('Entry Added', `${entryForm.hours}h logged`);
      fetchTimesheets();
    } catch (err: any) { toast.error('Failed to add entry', err.message); }
  };

  const handleSubmit = async (id: string) => {
    if (selectedSheet && (!selectedSheet.entries || selectedSheet.entries.length === 0)) {
      toast.error('Cannot Submit', 'Add at least one time entry before submitting');
      return;
    }
    try {
      await apiClient.request(`/timesheets/${id}/submit`, { method: 'POST' });
      toast.success('Timesheet Submitted', 'Your timesheet has been sent for approval');
      setSelectedSheet(null);
      fetchTimesheets();
    } catch (err: any) { toast.error('Failed to submit timesheet', err.message); }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.request(`/timesheets/${id}/approve`, { method: 'POST' });
      toast.success('Timesheet Approved', 'The timesheet has been approved');
      fetchTimesheets();
    } catch (err: any) { toast.error('Failed to approve timesheet', err.message); }
  };

  // Stats
  const totalHoursLogged = timesheets.reduce((sum, ts) => sum + Number(ts.totalHours), 0);
  const submittedCount = timesheets.filter((ts) => ts.status === 'SUBMITTED').length;
  const approvedCount = timesheets.filter((ts) => ts.status === 'APPROVED').length;

  // ── Detail view (selected timesheet) ──────────────────────────────
  if (selectedSheet) {
    return (
      <PageContainer
        title={`Week of ${new Date(selectedSheet.weekStartDate).toLocaleDateString()}`}
        description={`${Number(selectedSheet.totalHours).toFixed(1)} total hours logged`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Timesheets', href: '/timesheets' },
          { label: `Week of ${new Date(selectedSheet.weekStartDate).toLocaleDateString()}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSheet(null)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {selectedSheet.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => setShowAddEntry(true)}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Entry
                </button>
                <button
                  onClick={() => handleSubmit(selectedSheet.id)}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Submit
                </button>
              </>
            )}
            {selectedSheet.status === 'SUBMITTED' && (
              <button
                onClick={() => handleApprove(selectedSheet.id)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <FileCheck className="h-4 w-4" />
                Approve
              </button>
            )}
          </div>
        }
      >
        {/* Status + summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Clock} title="Total Hours" value={`${Number(selectedSheet.totalHours).toFixed(1)}h`} iconColor="blue" />
          <StatCard icon={Calendar} title="Entries" value={selectedSheet.entries?.length || 0} iconColor="purple" />
          <div className="rounded-xl border bg-card p-6 flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <StatusBadge variant={getStatusVariant(selectedSheet.status)} dot size="md">
              {selectedSheet.status}
            </StatusBadge>
          </div>
          {selectedSheet.employee && (
            <StatCard icon={Clock} title="Employee" value={`${selectedSheet.employee.firstName} ${selectedSheet.employee.lastName}`} iconColor="green" subtitle={selectedSheet.employee.employeeCode} />
          )}
        </div>

        {/* Time entries table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Task</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {selectedSheet.entries?.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">{new Date(e.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{Number(e.hours).toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.projectName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.taskDescription || '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={getStatusVariant(e.entryType)}>{e.entryType}</StatusBadge>
                  </td>
                </tr>
              ))}
              {(!selectedSheet.entries || selectedSheet.entries.length === 0) && (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mb-3 opacity-40" />
                      <p className="text-sm font-medium text-foreground">No entries yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add time entries to track your hours</p>
                      {selectedSheet.status === 'DRAFT' && (
                        <button
                          onClick={() => setShowAddEntry(true)}
                          className="mt-3 inline-flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          Add Entry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Add Entry Modal ──────────────────────────────────────── */}
        <Modal open={showAddEntry} onClose={() => { setShowAddEntry(false); setEntryForm({ ...defaultEntryForm }); }}>
          <ModalHeader onClose={() => { setShowAddEntry(false); setEntryForm({ ...defaultEntryForm }); }}>
            Add Time Entry
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                <input
                  type="date"
                  value={entryForm.date}
                  onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                  className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Hours</label>
                <input
                  type="number"
                  value={entryForm.hours}
                  onChange={(e) => setEntryForm({ ...entryForm, hours: e.target.value })}
                  placeholder="0.0"
                  step="0.5"
                  className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Project</label>
                <input
                  type="text"
                  value={entryForm.projectName}
                  onChange={(e) => setEntryForm({ ...entryForm, projectName: e.target.value })}
                  placeholder="Project name"
                  className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Task Description</label>
                <input
                  type="text"
                  value={entryForm.taskDescription}
                  onChange={(e) => setEntryForm({ ...entryForm, taskDescription: e.target.value })}
                  placeholder="What did you work on?"
                  className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Entry Type</label>
                <select
                  value={entryForm.entryType}
                  onChange={(e) => setEntryForm({ ...entryForm, entryType: e.target.value })}
                  className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="OVERTIME">Overtime</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="PTO">PTO</option>
                </select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => { setShowAddEntry(false); setEntryForm({ ...defaultEntryForm }); }}
              className="h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEntry}
              className="h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Add Entry
            </button>
          </ModalFooter>
        </Modal>
      </PageContainer>
    );
  }

  // ── Main list view ────────────────────────────────────────────────
  return (
    <PageContainer
      title="Timesheets"
      description="Track your weekly working hours"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Timesheets' },
      ]}
      actions={
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Timesheet
        </button>
      }
    >
      {error && (
        <ErrorBanner message={error} onRetry={fetchTimesheets} onDismiss={() => setError('')} />
      )}

      {/* Stats */}
      {!loading && timesheets.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ClipboardList} title="Total Timesheets" value={timesheets.length} iconColor="blue" />
          <StatCard icon={Timer} title="Hours Logged" value={`${totalHoursLogged.toFixed(1)}h`} iconColor="green" />
          <StatCard icon={Send} title="Submitted" value={submittedCount} iconColor="amber" />
          <StatCard icon={FileCheck} title="Approved" value={approvedCount} iconColor="purple" />
        </div>
      )}

      {/* Timesheet list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <TableLoader rows={4} cols={4} />
        ) : timesheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-lg font-semibold text-foreground">No timesheets yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">Create your first timesheet to start tracking your working hours.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Timesheet
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Week</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Entries</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedSheet(ts)}>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">
                      Week of {new Date(ts.weekStartDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{Number(ts.totalHours).toFixed(1)}h</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">{ts.entries?.length || 0} entries</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={getStatusVariant(ts.status)} dot>{ts.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedSheet(ts); }}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Timesheet Modal ─────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setWeekStart(''); }}>
        <ModalHeader onClose={() => { setShowCreate(false); setWeekStart(''); }}>
          New Timesheet
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Week Start (Monday)</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">Select the Monday of the week you want to track.</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => { setShowCreate(false); setWeekStart(''); }}
            className="h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create
          </button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
