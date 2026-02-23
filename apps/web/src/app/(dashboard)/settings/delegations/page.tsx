'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface Delegation {
  id: string;
  delegatorId: string;
  delegateId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  isActive: boolean;
  scope: any;
  delegator: { id: string; firstName: string; lastName: string; email: string };
  delegate: { id: string; firstName: string; lastName: string; email: string };
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function DelegationsPage() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    delegateId: '',
    startDate: '',
    endDate: '',
    reason: '',
    scope: [] as string[],
  });

  useEffect(() => {
    fetchDelegations();
    fetchUsers();
  }, []);

  const fetchDelegations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request('/workflows/delegations');
      setDelegations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiClient.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.request('/workflows/delegations', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          scope: form.scope.length > 0 ? form.scope : undefined,
        }),
      });
      setShowCreate(false);
      setForm({ delegateId: '', startDate: '', endDate: '', reason: '', scope: [] });
      setSuccess('Delegation created');
      setTimeout(() => setSuccess(''), 3000);
      fetchDelegations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await apiClient.request(`/workflows/delegations/${id}`, { method: 'DELETE' });
      setSuccess('Delegation revoked');
      setTimeout(() => setSuccess(''), 3000);
      fetchDelegations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const scopeOptions = ['LEAVE', 'EXPENSE', 'DOCUMENT', 'PAYROLL'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approval Delegations</h1>
          <p className="text-muted-foreground">Delegate your approvals when you&apos;re away</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          {showCreate ? 'Cancel' : 'New Delegation'}
        </button>
      </div>

      {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      {success && <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">{success}</div>}

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Delegate To</label>
              <select
                value={form.delegateId}
                onChange={(e) => setForm({ ...form, delegateId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                required
              >
                <option value="">Select user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Reason</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g., On vacation"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Scope (leave empty for all types)</label>
            <div className="flex flex-wrap gap-2">
              {scopeOptions.map((s) => (
                <label key={s} className="flex items-center gap-1 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.scope.includes(s)}
                    onChange={(e) => {
                      if (e.target.checked) setForm({ ...form, scope: [...form.scope, s] });
                      else setForm({ ...form, scope: form.scope.filter((x) => x !== s) });
                    }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            Create Delegation
          </button>
        </form>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Delegator</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Delegate</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Period</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Reason</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : delegations.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No delegations found</td></tr>
            ) : (
              delegations.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-foreground">{d.delegator.firstName} {d.delegator.lastName}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{d.delegate.firstName} {d.delegate.lastName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(d.startDate).toLocaleDateString()} - {new Date(d.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{d.reason || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      {d.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {d.isActive && (
                      <button onClick={() => handleRevoke(d.id)} className="text-sm text-destructive hover:underline">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
