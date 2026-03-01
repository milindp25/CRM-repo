'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { apiClient, type Payroll } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import {
  X, ArrowLeft, Plus, Trash2, Loader2, RefreshCw, Save,
  DollarSign, TrendingUp, TrendingDown, FileText, Calendar,
  Clock, User,
} from 'lucide-react';

interface PayrollAdjustment {
  id: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  amount: number;
  reason?: string;
  addedBy?: string;
  addedAt?: string;
}

interface PayrollDetailPanelProps {
  payroll: Payroll;
  onClose: () => void;
  onUpdated: () => void;
}

export function PayrollDetailPanel({ payroll, onClose, onUpdated }: PayrollDetailPanelProps) {
  const toast = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const isDraft = payroll.status === 'DRAFT';
  const isEditable = isDraft || payroll.status === 'PROCESSED';

  useFocusTrap(panelRef, !!payroll);

  // Close on Escape key
  const handlePanelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  }, [onClose]);

  // Adjustments
  const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([]);
  const [loadingAdj, setLoadingAdj] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline add
  const [showAddRow, setShowAddRow] = useState(false);
  const [newAdj, setNewAdj] = useState({ name: '', type: 'EARNING' as 'EARNING' | 'DEDUCTION', amount: '', reason: '' });

  // Load adjustments
  useEffect(() => {
    async function load() {
      setLoadingAdj(true);
      try {
        const data = await apiClient.get<PayrollAdjustment[]>(`/payroll/${payroll.id}/adjustments`);
        setAdjustments(Array.isArray(data) ? data : []);
      } catch {
        setAdjustments([]);
      } finally {
        setLoadingAdj(false);
      }
    }
    load();
  }, [payroll.id]);

  // Calculate totals
  const earningAdj = useMemo(() =>
    adjustments.filter(a => a.type === 'EARNING').reduce((sum, a) => sum + a.amount, 0),
    [adjustments]
  );
  const deductionAdj = useMemo(() =>
    adjustments.filter(a => a.type === 'DEDUCTION').reduce((sum, a) => sum + a.amount, 0),
    [adjustments]
  );
  const netAdjustment = earningAdj - deductionAdj;

  const grossSalary = typeof payroll.grossSalary === 'number' ? payroll.grossSalary : 0;
  const totalDeductions = (payroll.pfEmployee || 0) + (payroll.esiEmployee || 0) + (payroll.tds || 0) + (payroll.pt || 0) + (payroll.otherDeductions || 0);
  const calculatedNet = grossSalary - totalDeductions + netAdjustment;

  // Add adjustment
  const handleAddAdjustment = async () => {
    if (!newAdj.name || !newAdj.amount || Number(newAdj.amount) <= 0) {
      toast.error('Validation', 'Name and a positive amount are required');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/payroll/${payroll.id}/adjustments`, {
        adjustments: [{
          name: newAdj.name,
          type: newAdj.type,
          amount: Number(newAdj.amount),
          reason: newAdj.reason || undefined,
        }],
      });
      // Reload adjustments
      const data = await apiClient.get<PayrollAdjustment[]>(`/payroll/${payroll.id}/adjustments`);
      setAdjustments(Array.isArray(data) ? data : []);
      setNewAdj({ name: '', type: 'EARNING', amount: '', reason: '' });
      setShowAddRow(false);
      toast.success('Added', `${newAdj.type === 'EARNING' ? 'Earning' : 'Deduction'} adjustment added`);
      onUpdated();
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to add adjustment');
    } finally {
      setSaving(false);
    }
  };

  // Remove adjustment
  const handleRemoveAdjustment = async (adjId: string) => {
    try {
      await apiClient.delete(`/payroll/${payroll.id}/adjustments/${adjId}`);
      setAdjustments(adjustments.filter(a => a.id !== adjId));
      toast.success('Removed', 'Adjustment removed');
      onUpdated();
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to remove adjustment');
    }
  };

  // Recalculate
  const handleRecalculate = async () => {
    try {
      await apiClient.recalculatePayroll(payroll.id);
      toast.success('Recalculated', 'Payroll recalculated successfully');
      onUpdated();
    } catch (err: any) {
      toast.error('Error', err.message || 'Recalculation failed');
    }
  };

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-card border-l border-border shadow-2xl flex flex-col animate-slide-in-right overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={`Payroll details for ${payroll.employee?.firstName ?? ''} ${payroll.employee?.lastName ?? ''}`.trim()}
        onKeyDown={handlePanelKeyDown}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <StatusBadge variant={getStatusVariant(payroll.status)} dot>
              {payroll.status}
            </StatusBadge>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {payroll.employee?.firstName} {payroll.employee?.lastName}
              </h2>
              <p className="text-xs text-muted-foreground">
                {payroll.employee?.employeeCode}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {payroll.payPeriodMonth && payroll.payPeriodYear
                ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][payroll.payPeriodMonth - 1]} ${payroll.payPeriodYear}`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Earnings Section */}
          <Section title="Earnings" icon={TrendingUp} color="green">
            <Row label="Basic Salary" value={fmt(payroll.basicSalary || 0)} />
            <Row label="HRA" value={fmt(payroll.hra || 0)} />
            <Row label="Special Allowance" value={fmt(payroll.specialAllowance || 0)} />
            <Row label="Other Allowances" value={fmt(payroll.otherAllowances || 0)} />
            <TotalRow label="Gross Salary" value={fmt(grossSalary)} />
          </Section>

          {/* Deductions Section */}
          <Section title="Deductions" icon={TrendingDown} color="red">
            <Row label="PF (Employee)" value={`-${fmt(payroll.pfEmployee || 0)}`} />
            <Row label="ESI" value={`-${fmt(payroll.esiEmployee || 0)}`} />
            <Row label="TDS" value={`-${fmt(payroll.tds || 0)}`} muted="Auto-calculated" />
            <Row label="Professional Tax" value={`-${fmt(payroll.pt || 0)}`} />
            {(payroll.otherDeductions || 0) > 0 && (
              <Row label="Other Deductions" value={`-${fmt(payroll.otherDeductions || 0)}`} />
            )}
            <TotalRow label="Total Deductions" value={`-${fmt(totalDeductions)}`} negative />
          </Section>

          {/* Adjustments Section */}
          <Section
            title="Adjustments"
            icon={DollarSign}
            color="blue"
            action={isDraft && (
              <button
                onClick={() => setShowAddRow(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          >
            {loadingAdj ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : adjustments.length === 0 && !showAddRow ? (
              <p className="text-xs text-muted-foreground py-2 text-center">No adjustments</p>
            ) : (
              <>
                {adjustments.map((adj) => (
                  <div key={adj.id} className="flex items-center justify-between py-1.5 px-1 group">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        adj.type === 'EARNING'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {adj.type === 'EARNING' ? '+' : '-'}
                      </span>
                      <div>
                        <span className="text-sm text-foreground">{adj.name}</span>
                        {adj.reason && (
                          <p className="text-[10px] text-muted-foreground">{adj.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        adj.type === 'EARNING'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {adj.type === 'EARNING' ? '+' : '-'}{fmt(adj.amount)}
                      </span>
                      {isDraft && (
                        <button
                          onClick={() => handleRemoveAdjustment(adj.id)}
                          aria-label={`Remove ${adj.name}`}
                          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Inline add row */}
            {showAddRow && (
              <div className="mt-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAdj.name}
                    onChange={(e) => setNewAdj({ ...newAdj, name: e.target.value })}
                    placeholder="e.g., Travel Reimbursement"
                    aria-label="Adjustment name"
                    className="flex-1 h-8 px-2.5 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <select
                    value={newAdj.type}
                    onChange={(e) => setNewAdj({ ...newAdj, type: e.target.value as 'EARNING' | 'DEDUCTION' })}
                    aria-label="Adjustment type"
                    className="w-28 h-8 px-2 text-sm border border-input bg-background text-foreground rounded-md"
                  >
                    <option value="EARNING">Earning</option>
                    <option value="DEDUCTION">Deduction</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newAdj.amount}
                    onChange={(e) => setNewAdj({ ...newAdj, amount: e.target.value })}
                    placeholder="Amount"
                    min="0.01"
                    step="0.01"
                    aria-label="Adjustment amount"
                    className="w-28 h-8 px-2.5 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text"
                    value={newAdj.reason}
                    onChange={(e) => setNewAdj({ ...newAdj, reason: e.target.value })}
                    placeholder="Reason (optional)"
                    aria-label="Adjustment reason"
                    className="flex-1 h-8 px-2.5 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowAddRow(false); setNewAdj({ name: '', type: 'EARNING', amount: '', reason: '' }); }}
                    className="h-7 px-3 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAdjustment}
                    disabled={saving}
                    className="h-7 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    Add
                  </button>
                </div>
              </div>
            )}

            {adjustments.length > 0 && (
              <TotalRow
                label="Net Adjustments"
                value={`${netAdjustment >= 0 ? '+' : ''}${fmt(netAdjustment)}`}
                positive={netAdjustment >= 0}
              />
            )}
          </Section>

          {/* Net Pay */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">NET PAY</span>
              <span className="text-xl font-bold text-foreground">{fmt(calculatedNet)}</span>
            </div>
          </div>

          {/* Attendance info */}
          {(payroll.daysInMonth || payroll.daysWorked || payroll.leaveDays !== undefined) && (
            <div className="rounded-lg border border-border p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                Attendance Summary
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Working Days</span>
                <span className="text-foreground font-medium">{payroll.daysInMonth ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Present Days</span>
                <span className="text-foreground font-medium">{payroll.daysWorked ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Leave Days</span>
                <span className="text-foreground font-medium">{payroll.leaveDays ?? '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {isDraft && (
          <div className="flex-shrink-0 p-4 border-t border-border flex gap-3">
            <button
              onClick={handleRecalculate}
              className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recalculate
            </button>
            <button
              onClick={() => { toast.info('Info', 'Changes are saved automatically when adding/removing adjustments'); }}
              className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              Done
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══ Sub-components ═══ */

function Section({
  title, icon: Icon, color, action, children,
}: {
  title: string;
  icon: any;
  color: 'green' | 'red' | 'blue';
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const colorMap = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorMap[color]}`} aria-hidden="true" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</span>
        </div>
        {action}
      </div>
      <div className="px-3 py-1 divide-y divide-border/50">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <span className="text-sm text-muted-foreground">{label}</span>
        {muted && <span className="text-[10px] text-muted-foreground/60 ml-1">({muted})</span>}
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function TotalRow({ label, value, negative, positive }: { label: string; value: string; negative?: boolean; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 mt-1 border-t border-dashed border-border">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className={`text-sm font-bold ${
        negative ? 'text-red-600 dark:text-red-400' : positive ? 'text-green-600 dark:text-green-400' : 'text-foreground'
      }`}>
        {value}
      </span>
    </div>
  );
}
