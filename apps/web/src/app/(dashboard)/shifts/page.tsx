'use client';

import { useState, useEffect } from 'react';
import { apiClient, type ShiftDefinition, type ShiftAssignment } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';

export default function ShiftsPage() {
  const [activeTab, setActiveTab] = useState<'definitions' | 'my-shifts'>('definitions');
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [myShifts, setMyShifts] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', startTime: '09:00', endTime: '18:00', breakDuration: 60, color: '#3B82F6', isOvernight: false, graceMinutes: 15, description: '' });
  const [creating, setCreating] = useState(false);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.createShift({
        ...form,
        breakDuration: Number(form.breakDuration),
        graceMinutes: Number(form.graceMinutes),
      });
      setShowCreate(false);
      setForm({ name: '', code: '', startTime: '09:00', endTime: '18:00', breakDuration: 60, color: '#3B82F6', isOvernight: false, graceMinutes: 15, description: '' });
      setSuccess('Shift created successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchShifts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <FeatureGate feature="SHIFTS">
      <RoleGate requiredPermissions={[Permission.VIEW_SHIFTS, Permission.MANAGE_SHIFTS]}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Shift Management</h1>
              <p className="text-muted-foreground mt-1">Define shifts and manage assignments</p>
            </div>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

          <div className="flex space-x-4 mb-6 border-b border-border">
            <button onClick={() => setActiveTab('definitions')} className={`pb-3 px-1 font-medium text-sm ${activeTab === 'definitions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}>
              Shift Definitions
            </button>
            <button onClick={() => setActiveTab('my-shifts')} className={`pb-3 px-1 font-medium text-sm ${activeTab === 'my-shifts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}>
              My Shifts
            </button>
          </div>

          {activeTab === 'definitions' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                  {showCreate ? 'Cancel' : '+ New Shift'}
                </button>
              </div>

              {showCreate && (
                <form onSubmit={handleCreate} className="bg-card rounded-lg shadow-md p-6 mb-6">
                  <h3 className="font-semibold text-foreground mb-4">Create Shift Definition</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                      <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" placeholder="Morning Shift" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Code *</label>
                      <input type="text" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" placeholder="MORNING" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Color</label>
                      <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-full h-10 border border-border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Start Time *</label>
                      <input type="time" required value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">End Time *</label>
                      <input type="time" required value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Break (mins)</label>
                      <input type="number" min="0" value={form.breakDuration} onChange={e => setForm(p => ({ ...p, breakDuration: Number(e.target.value) }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Grace (mins)</label>
                      <input type="number" min="0" value={form.graceMinutes} onChange={e => setForm(p => ({ ...p, graceMinutes: Number(e.target.value) }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input type="checkbox" id="overnight" checked={form.isOvernight} onChange={e => setForm(p => ({ ...p, isOvernight: e.target.checked }))} className="rounded" />
                      <label htmlFor="overnight" className="text-sm text-foreground">Overnight shift</label>
                    </div>
                  </div>
                  <button type="submit" disabled={creating} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">{creating ? 'Creating...' : 'Create Shift'}</button>
                </form>
              )}

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading shifts...</div>
              ) : shifts.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg shadow-md"><p className="text-muted-foreground">No shift definitions found</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shifts.map(shift => (
                    <div key={shift.id} className="bg-card rounded-lg shadow-md p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: shift.color || '#3B82F6' }} />
                        <h3 className="font-semibold text-foreground">{shift.name}</h3>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded font-mono">{shift.code}</span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Time: <span className="font-medium">{shift.startTime} - {shift.endTime}</span></p>
                        <p>Break: {shift.breakDuration} mins | Grace: {shift.graceMinutes} mins</p>
                        {shift.isOvernight && <p className="text-purple-600 font-medium">Overnight shift</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-shifts' && (
            <div>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading your shifts...</div>
              ) : myShifts.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg shadow-md"><p className="text-muted-foreground">No shift assignments found</p></div>
              ) : (
                <div className="bg-card rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Shift</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {myShifts.map(assignment => (
                        <tr key={assignment.id} className="hover:bg-muted">
                          <td className="px-6 py-4 text-sm text-foreground">{new Date(assignment.assignmentDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{assignment.shift?.name || assignment.shiftId}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{assignment.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </RoleGate>
    </FeatureGate>
  );
}
