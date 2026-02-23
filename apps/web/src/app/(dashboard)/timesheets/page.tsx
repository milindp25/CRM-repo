'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

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

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSheet, setSelectedSheet] = useState<Timesheet | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [weekStart, setWeekStart] = useState('');
  const [entryForm, setEntryForm] = useState({ date: '', hours: '', projectName: '', taskDescription: '', entryType: 'REGULAR' });

  useEffect(() => { fetchTimesheets(); }, []);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request('/timesheets/my');
      setTimesheets(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      const ts = await apiClient.request('/timesheets', { method: 'POST', body: JSON.stringify({ weekStartDate: weekStart }) });
      setShowCreate(false);
      setWeekStart('');
      setSuccess('Timesheet created');
      setTimeout(() => setSuccess(''), 3000);
      fetchTimesheets();
      setSelectedSheet(ts);
    } catch (err: any) { setError(err.message); }
  };

  const handleAddEntry = async () => {
    if (!selectedSheet) return;
    try {
      await apiClient.request(`/timesheets/${selectedSheet.id}/entries`, {
        method: 'POST',
        body: JSON.stringify({ ...entryForm, hours: Number(entryForm.hours) }),
      });
      setEntryForm({ date: '', hours: '', projectName: '', taskDescription: '', entryType: 'REGULAR' });
      const updated = await apiClient.request(`/timesheets/${selectedSheet.id}`);
      setSelectedSheet(updated);
      fetchTimesheets();
    } catch (err: any) { setError(err.message); }
  };

  const handleSubmit = async (id: string) => {
    try {
      await apiClient.request(`/timesheets/${id}/submit`, { method: 'POST' });
      setSuccess('Timesheet submitted');
      setTimeout(() => setSuccess(''), 3000);
      setSelectedSheet(null);
      fetchTimesheets();
    } catch (err: any) { setError(err.message); }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.request(`/timesheets/${id}/approve`, { method: 'POST' });
      setSuccess('Timesheet approved');
      setTimeout(() => setSuccess(''), 3000);
      fetchTimesheets();
    } catch (err: any) { setError(err.message); }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    SUBMITTED: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    APPROVED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    REJECTED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  };

  if (selectedSheet) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedSheet(null)} className="text-muted-foreground hover:text-foreground">&larr; Back</button>
          <h1 className="text-2xl font-bold text-foreground">Week of {new Date(selectedSheet.weekStartDate).toLocaleDateString()}</h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedSheet.status]}`}>{selectedSheet.status}</span>
        </div>

        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg">{error}</div>}

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-foreground">Total: {Number(selectedSheet.totalHours).toFixed(1)}h</span>
            {selectedSheet.status === 'DRAFT' && (
              <button onClick={() => handleSubmit(selectedSheet.id)} className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">Submit</button>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Hours</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Task</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {selectedSheet.entries?.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-sm text-foreground">{new Date(e.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{Number(e.hours).toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.projectName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.taskDescription || '-'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">{e.entryType}</span></td>
                </tr>
              ))}
              {(!selectedSheet.entries || selectedSheet.entries.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No entries yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedSheet.status === 'DRAFT' && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">Add Entry</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <input type="date" value={entryForm.date} onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })} className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm" />
              <input type="number" value={entryForm.hours} onChange={(e) => setEntryForm({ ...entryForm, hours: e.target.value })} placeholder="Hours" step="0.5" className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm" />
              <input type="text" value={entryForm.projectName} onChange={(e) => setEntryForm({ ...entryForm, projectName: e.target.value })} placeholder="Project" className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm" />
              <input type="text" value={entryForm.taskDescription} onChange={(e) => setEntryForm({ ...entryForm, taskDescription: e.target.value })} placeholder="Task" className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm" />
              <button onClick={handleAddEntry} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90">Add</button>
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
          <h1 className="text-2xl font-bold text-foreground">Timesheets</h1>
          <p className="text-muted-foreground">Track your weekly working hours</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          {showCreate ? 'Cancel' : 'New Timesheet'}
        </button>
      </div>

      {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      {success && <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">{success}</div>}

      {showCreate && (
        <div className="bg-card border border-border rounded-lg p-4 flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Week Start (Monday)</label>
            <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-background text-foreground" />
          </div>
          <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Create</button>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : timesheets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No timesheets yet</div>
        ) : timesheets.map((ts) => (
          <div key={ts.id} onClick={() => setSelectedSheet(ts)} className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Week of {new Date(ts.weekStartDate).toLocaleDateString()}</h3>
                <p className="text-sm text-muted-foreground">{Number(ts.totalHours).toFixed(1)} hours &middot; {ts.entries?.length || 0} entries</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ts.status]}`}>{ts.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
