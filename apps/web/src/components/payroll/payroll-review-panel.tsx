'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Payroll } from '@/lib/api-client';
import type { PayrollBatch } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import {
  ChevronDown, ChevronRight, CheckCircle, XCircle, RotateCcw,
  DollarSign, TrendingDown, TrendingUp, Users, X,
} from 'lucide-react';

interface PayrollReviewPanelProps {
  batch: PayrollBatch;
  onClose: () => void;
  onActionComplete: () => void;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function PayrollReviewPanel({ batch, onClose, onActionComplete }: PayrollReviewPanelProps) {
  const toast = useToast();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState<'changes' | 'reject' | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadPayrolls();
  }, [batch.id]);

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getPayroll({ month: batch.month, year: batch.year, take: 200 });
      setPayrolls(res.data);
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await apiClient.approvePayrollBatch(batch.id);
      toast.success('Approved', 'Payroll batch has been approved');
      onActionComplete();
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!comment.trim()) {
      toast.error('Required', 'Please provide comments for changes requested');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.requestBatchChanges(batch.id, comment);
      toast.success('Sent', 'Changes requested for payroll batch');
      onActionComplete();
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setActionLoading(false);
      setShowCommentBox(null);
      setComment('');
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await apiClient.rejectPayrollBatch(batch.id, comment || 'Rejected by approver');
      toast.success('Rejected', 'Payroll batch has been rejected');
      onActionComplete();
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setActionLoading(false);
      setShowCommentBox(null);
      setComment('');
    }
  };

  // Calculate totals
  const totalGross = payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + (p.pfEmployee || 0) + (p.esiEmployee || 0) + (p.tds || 0) + (p.pt || 0) + (p.otherDeductions || 0), 0);
  const totalNet = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const monthName = MONTH_NAMES[batch.month - 1] || '';

  // Determine approval status from the first payroll record (all records in a batch share the same approval status)
  const approvalStatus = payrolls[0]?.approvalStatus || 'PENDING_APPROVAL';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Review: {monthName} {batch.year} Payroll
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge variant={getStatusVariant(approvalStatus)} dot>
              {approvalStatus.replace(/_/g, ' ')}
            </StatusBadge>
            <span className="text-sm text-muted-foreground">
              {payrolls.length} employees
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close review panel"
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" aria-hidden="true" />
            Total Gross
          </div>
          <p className="text-xl font-bold text-foreground">${totalGross.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingDown className="h-4 w-4" aria-hidden="true" />
            Total Deductions
          </div>
          <p className="text-xl font-bold text-destructive">${totalDeductions.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            Net Payout
          </div>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">${totalNet.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Users className="h-4 w-4" aria-hidden="true" />
            Employees
          </div>
          <p className="text-xl font-bold text-foreground">{payrolls.length}</p>
        </div>
      </div>

      {/* Expandable employee table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th scope="col" className="w-8 px-4 py-3"><span className="sr-only">Toggle details</span></th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Deductions</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Loading payroll records...
                </td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No payroll records found for this batch.
                </td>
              </tr>
            ) : (
              payrolls.map((p) => {
                const ded = (p.pfEmployee || 0) + (p.esiEmployee || 0) + (p.tds || 0) + (p.pt || 0) + (p.otherDeductions || 0);
                const isExpanded = expandedRows.has(p.id);
                const adjustments = (p as any).adjustments || [];
                return (
                  <PayrollRow
                    key={p.id}
                    payroll={p}
                    deductions={ded}
                    isExpanded={isExpanded}
                    adjustments={adjustments}
                    onToggle={() => toggleExpand(p.id)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Comment box for changes/reject */}
      {showCommentBox && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h4 id="comment-box-heading" className="text-sm font-medium text-foreground">
            {showCommentBox === 'changes' ? 'Request Changes' : 'Reject Batch'}
          </h4>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={showCommentBox === 'changes' ? 'Describe the changes needed...' : 'Reason for rejection...'}
            rows={3}
            aria-labelledby="comment-box-heading"
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={showCommentBox === 'changes' ? handleRequestChanges : handleReject}
              disabled={actionLoading}
              className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                showCommentBox === 'changes'
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }`}
            >
              {actionLoading ? 'Submitting...' : showCommentBox === 'changes' ? 'Send Request' : 'Reject'}
            </button>
            <button
              onClick={() => { setShowCommentBox(null); setComment(''); }}
              className="h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!showCommentBox && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {actionLoading ? 'Processing...' : 'Approve All'}
          </button>
          <button
            onClick={() => setShowCommentBox('changes')}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Request Changes
          </button>
          <button
            onClick={() => setShowCommentBox('reject')}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Sub-component: expandable payroll row ----

function PayrollRow({
  payroll,
  deductions,
  isExpanded,
  adjustments,
  onToggle,
}: {
  payroll: Payroll;
  deductions: number;
  isExpanded: boolean;
  adjustments: any[];
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="hover:bg-muted/30 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${payroll.employee?.firstName} ${payroll.employee?.lastName} payroll details`}
      >
        <td className="px-4 py-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            {payroll.employee?.firstName} {payroll.employee?.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{payroll.employee?.employeeCode}</p>
        </td>
        <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
          ${(payroll.grossSalary || 0).toLocaleString()}
        </td>
        <td className="px-4 py-3 text-sm text-right">
          <span className="text-destructive dark:text-red-400">-${deductions.toLocaleString()}</span>
        </td>
        <td className="px-4 py-3 text-sm text-right font-semibold">
          <span className="text-green-600 dark:text-green-400">
            ${(payroll.netSalary || 0).toLocaleString()}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-8 py-3 bg-muted/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-foreground mb-1">Earnings</p>
                <div className="space-y-0.5 text-muted-foreground">
                  <p>Basic: ${(payroll.basicSalary || 0).toLocaleString()}</p>
                  <p>HRA: ${(payroll.hra || 0).toLocaleString()}</p>
                  <p>Special Allowance: ${(payroll.specialAllowance || 0).toLocaleString()}</p>
                  <p>Other: ${(payroll.otherAllowances || 0).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Deductions</p>
                <div className="space-y-0.5 text-muted-foreground">
                  <p>PF: ${(payroll.pfEmployee || 0).toLocaleString()}</p>
                  <p>ESI: ${(payroll.esiEmployee || 0).toLocaleString()}</p>
                  <p>TDS: ${(payroll.tds || 0).toLocaleString()}</p>
                  <p>PT: ${(payroll.pt || 0).toLocaleString()}</p>
                  <p>Other: ${(payroll.otherDeductions || 0).toLocaleString()}</p>
                </div>
              </div>
              {adjustments.length > 0 && (
                <div>
                  <p className="font-medium text-foreground mb-1">Adjustments</p>
                  <div className="space-y-0.5">
                    {adjustments.map((adj: any) => (
                      <p key={adj.id} className={adj.type === 'EARNING' ? 'text-green-600 dark:text-green-400' : 'text-destructive dark:text-red-400'}>
                        {adj.type === 'EARNING' ? '+' : '-'}${adj.amount.toLocaleString()} ({adj.name})
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
