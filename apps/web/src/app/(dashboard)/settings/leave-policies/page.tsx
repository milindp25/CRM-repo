'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import { CalendarDays, Plus } from 'lucide-react';

const INPUT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
const SELECT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

interface LeavePolicy {
  id: string;
  leaveType: string;
  name: string;
  annualEntitlement: number;
  accrualType: string;
  carryoverLimit: number;
  maxConsecutiveDays: number | null;
  isActive: boolean;
}

export default function LeavePoliciesPage() {
  const toast = useToast();
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'CASUAL',
    name: '',
    annualEntitlement: '12',
    accrualType: 'ANNUAL_GRANT',
    carryoverLimit: '0',
    maxConsecutiveDays: '',
    fiscalYearStart: '1',
  });

  useEffect(() => { fetchPolicies(); }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request('/leave-policies');
      setPolicies(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load policies', err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      toast.error('Validation Error', 'Policy name is required');
      return false;
    }
    const entitlement = Number(form.annualEntitlement);
    if (!entitlement || entitlement <= 0) {
      toast.error('Validation Error', 'Annual entitlement must be greater than 0');
      return false;
    }
    if (entitlement > 365) {
      toast.error('Validation Error', 'Annual entitlement cannot exceed 365 days');
      return false;
    }
    const carryover = Number(form.carryoverLimit);
    if (carryover < 0) {
      toast.error('Validation Error', 'Carryover limit cannot be negative');
      return false;
    }
    if (carryover > entitlement) {
      toast.error('Validation Error', 'Carryover limit cannot exceed annual entitlement');
      return false;
    }
    if (form.maxConsecutiveDays) {
      const maxDays = Number(form.maxConsecutiveDays);
      if (maxDays <= 0) {
        toast.error('Validation Error', 'Max consecutive days must be greater than 0');
        return false;
      }
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await apiClient.request('/leave-policies', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          annualEntitlement: Number(form.annualEntitlement),
          carryoverLimit: Number(form.carryoverLimit),
          maxConsecutiveDays: form.maxConsecutiveDays ? Number(form.maxConsecutiveDays) : undefined,
          fiscalYearStart: Number(form.fiscalYearStart),
        }),
      });
      setShowCreate(false);
      setForm({ leaveType: 'CASUAL', name: '', annualEntitlement: '12', accrualType: 'ANNUAL_GRANT', carryoverLimit: '0', maxConsecutiveDays: '', fiscalYearStart: '1' });
      toast.success('Policy Created', `Leave policy "${form.name}" has been created`);
      fetchPolicies();
    } catch (err: any) {
      toast.error('Failed to create policy', err.message);
    }
  };

  const leaveTypes = ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'COMPENSATORY', 'UNPAID'];
  const accrualTypes = ['ANNUAL_GRANT', 'MONTHLY_ACCRUAL', 'NO_ACCRUAL'];

  return (
    <PageContainer
      title="Time Off Rules"
      description="Set up how time off is earned and how much each employee gets"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Settings', href: '/settings' },
        { label: 'Time Off Rules' },
      ]}
      actions={
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          New Policy
        </button>
      }
    >
      {/* Create Form Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <ModalHeader onClose={() => setShowCreate(false)}>New Leave Policy</ModalHeader>
        <form onSubmit={handleCreate}>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Leave Type</label>
                <select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} className={SELECT_CLASS}>
                  {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Policy Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={INPUT_CLASS} placeholder="e.g. Annual Casual Leave" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Annual Entitlement (days)</label>
                <input type="number" value={form.annualEntitlement} onChange={(e) => setForm({ ...form, annualEntitlement: e.target.value })}
                  className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Accrual Type</label>
                <select value={form.accrualType} onChange={(e) => setForm({ ...form, accrualType: e.target.value })} className={SELECT_CLASS}>
                  {accrualTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Carryover Limit</label>
                <input type="number" value={form.carryoverLimit} onChange={(e) => setForm({ ...form, carryoverLimit: e.target.value })}
                  className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Max Consecutive Days</label>
                <input type="number" value={form.maxConsecutiveDays} onChange={(e) => setForm({ ...form, maxConsecutiveDays: e.target.value })}
                  placeholder="No limit" className={INPUT_CLASS} />
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
              Create Policy
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Policies List */}
      {loading ? (
        <div className="rounded-xl border bg-card overflow-hidden">
          <TableLoader rows={4} cols={3} />
        </div>
      ) : policies.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={<CalendarDays className="h-10 w-10" />}
            title="No time off rules set up yet"
            description="Create rules to define how much time off your employees earn and can take"
            action={{ label: 'New Policy', onClick: () => setShowCreate(true) }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{p.name}</h3>
                    <StatusBadge variant={getStatusVariant(p.leaveType)}>
                      {p.leaveType}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {p.annualEntitlement} days/year &middot; {p.accrualType.replace(/_/g, ' ')} &middot; Carryover: {p.carryoverLimit} days
                    {p.maxConsecutiveDays && ` · Max ${p.maxConsecutiveDays} consecutive`}
                  </p>
                </div>
                <StatusBadge variant={getStatusVariant(p.isActive ? 'ACTIVE' : 'INACTIVE')} dot>
                  {p.isActive ? 'Active' : 'Inactive'}
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
