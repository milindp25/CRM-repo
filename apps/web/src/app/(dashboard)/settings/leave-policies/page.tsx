'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

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
      toast.success('Policy Created', `Leave policy "${form.name}" has been created`);
      fetchPolicies();
    } catch (err: any) {
      toast.error('Failed to create policy', err.message);
    }
  };

  const leaveTypes = ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'COMPENSATORY', 'UNPAID'];
  const accrualTypes = ['ANNUAL_GRANT', 'MONTHLY_ACCRUAL', 'NO_ACCRUAL'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Policies</h1>
          <p className="text-muted-foreground">Configure leave accrual and entitlement rules</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          {showCreate ? 'Cancel' : 'New Policy'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Leave Type</label>
              <select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Policy Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" placeholder="e.g. Annual Casual Leave" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Annual Entitlement (days)</label>
              <input type="number" value={form.annualEntitlement} onChange={(e) => setForm({ ...form, annualEntitlement: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Accrual Type</label>
              <select value={form.accrualType} onChange={(e) => setForm({ ...form, accrualType: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                {accrualTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Carryover Limit</label>
              <input type="number" value={form.carryoverLimit} onChange={(e) => setForm({ ...form, carryoverLimit: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Max Consecutive Days</label>
              <input type="number" value={form.maxConsecutiveDays} onChange={(e) => setForm({ ...form, maxConsecutiveDays: e.target.value })} placeholder="No limit" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Create Policy</button>
        </form>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No leave policies configured</div>
        ) : (
          policies.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{p.name}</h3>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{p.leaveType}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {p.annualEntitlement} days/year &middot; {p.accrualType.replace(/_/g, ' ')} &middot; Carryover: {p.carryoverLimit} days
                  {p.maxConsecutiveDays && ` · Max ${p.maxConsecutiveDays} consecutive`}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                {p.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
