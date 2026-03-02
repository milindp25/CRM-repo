'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import { ArrowRightLeft, Plus } from 'lucide-react';

const INPUT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
const SELECT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

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
  const toast = useToast();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
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
      toast.error('Failed to load delegations', err.message);
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

  const validateForm = (): boolean => {
    if (!form.delegateId) {
      toast.error('Validation Error', 'Please select a delegate');
      return false;
    }
    if (!form.startDate) {
      toast.error('Validation Error', 'Please select a start date');
      return false;
    }
    if (!form.endDate) {
      toast.error('Validation Error', 'Please select an end date');
      return false;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error('Validation Error', 'End date must be after start date');
      return false;
    }
    if (new Date(form.startDate) < new Date(new Date().toISOString().split('T')[0])) {
      toast.warning('Date Warning', 'Start date is in the past');
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
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
      toast.success('Delegation Created', 'Approval delegation has been set up successfully');
      fetchDelegations();
    } catch (err: any) {
      toast.error('Failed to create delegation', err.message);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await apiClient.request(`/workflows/delegations/${id}`, { method: 'DELETE' });
      toast.success('Delegation Revoked', 'The delegation has been revoked');
      fetchDelegations();
    } catch (err: any) {
      toast.error('Failed to revoke delegation', err.message);
    }
  };

  const scopeOptions = ['LEAVE', 'EXPENSE', 'DOCUMENT', 'PAYROLL'];
  const scopeLabels: Record<string, string> = { LEAVE: 'Time Off', EXPENSE: 'Expenses', DOCUMENT: 'Documents', PAYROLL: 'Payroll' };

  return (
    <PageContainer
      title="Backup Approvers"
      description="Assign someone to handle approvals when you're away"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Settings', href: '/settings' },
        { label: 'Backup Approvers' },
      ]}
      actions={
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Add Backup Approver
        </button>
      }
    >
      {/* Create Form Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <ModalHeader onClose={() => setShowCreate(false)}>Add Backup Approver</ModalHeader>
        <form onSubmit={handleCreate}>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Delegate To *</label>
                <select
                  value={form.delegateId}
                  onChange={(e) => setForm({ ...form, delegateId: e.target.value })}
                  className={SELECT_CLASS}
                  required
                >
                  <option value="">Select user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Reason</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g., On vacation"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">End Date *</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">What can they approve? (leave empty for everything)</label>
              <div className="flex flex-wrap gap-3">
                {scopeOptions.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.scope.includes(s)}
                      onChange={(e) => {
                        if (e.target.checked) setForm({ ...form, scope: [...form.scope, s] });
                        else setForm({ ...form, scope: form.scope.filter((x) => x !== s) });
                      }}
                      className="rounded border-input"
                    />
                    {scopeLabels[s] || s}
                  </label>
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button type="button" onClick={() => setShowCreate(false)}
              className="border border-input bg-background text-foreground hover:bg-muted h-9 px-4 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors">
              Save
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delegations Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Original Approver</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Backup Person</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6}><TableLoader rows={4} cols={6} /></td></tr>
            ) : delegations.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<ArrowRightLeft className="h-10 w-10" />}
                    title="No backup approvers set up"
                    description="Assign someone to handle approvals on your behalf when you're away"
                    action={{ label: 'Add Backup Approver', onClick: () => setShowCreate(true) }}
                  />
                </td>
              </tr>
            ) : (
              delegations.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">{d.delegator.firstName} {d.delegator.lastName}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{d.delegate.firstName} {d.delegate.lastName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(d.startDate).toLocaleDateString()} - {new Date(d.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{d.reason || '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={getStatusVariant(d.isActive ? 'ACTIVE' : 'INACTIVE')} dot>
                      {d.isActive ? 'Active' : 'Revoked'}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    {d.isActive && (
                      <button onClick={() => handleRevoke(d.id)}
                        className="text-sm text-destructive hover:bg-destructive/10 h-8 px-3 rounded-lg transition-colors font-medium">
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
    </PageContainer>
  );
}
