'use client';

import { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Users,
  DollarSign,
  TrendingDown,
  Banknote,
  AlertTriangle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PayrollApprovalPanelProps {
  batchId: string;
  batchStatus: string; // PENDING, PROCESSING, COMPLETED, FAILED, PARTIAL
  approvalStatus?: string | null; // PENDING_APPROVAL, APPROVED, REJECTED, null
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  currency: string; // e.g. '\u20B9' or '$'
  onStatusChange: () => void; // callback to refresh parent
}

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PayrollApprovalPanel({
  batchId,
  batchStatus,
  approvalStatus,
  totalEmployees,
  totalGross,
  totalNet,
  totalDeductions,
  currency,
  onStatusChange,
}: PayrollApprovalPanelProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  const canSubmitForApproval = batchStatus === 'COMPLETED' && approvalStatus == null;

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    try {
      await apiClient.submitPayrollForApproval(batchId);
      toast.success('Submitted for Approval', 'Payroll batch has been submitted for approval.');
      setShowConfirmDialog(false);
      onStatusChange();
    } catch (err: any) {
      toast.error('Submission Failed', err.message || 'Failed to submit payroll for approval.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await apiClient.approvePayrollBatch(batchId);
      toast.success('Approved', 'Payroll batch has been approved.');
      onStatusChange();
    } catch (err: any) {
      toast.error('Approval Failed', err.message || 'Failed to approve payroll batch.');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNotes.trim()) {
      toast.warning('Notes Required', 'Please provide a reason for rejection.');
      return;
    }
    setRejecting(true);
    try {
      await apiClient.rejectPayrollBatch(batchId, rejectionNotes);
      toast.success('Rejected', 'Payroll batch has been rejected.');
      setShowRejectDialog(false);
      setRejectionNotes('');
      onStatusChange();
    } catch (err: any) {
      toast.error('Rejection Failed', err.message || 'Failed to reject payroll batch.');
    } finally {
      setRejecting(false);
    }
  };

  const handleResubmit = async () => {
    setResubmitting(true);
    try {
      await apiClient.submitPayrollForApproval(batchId, 'Revised and resubmitted');
      toast.success('Resubmitted', 'Payroll batch has been resubmitted for approval.');
      onStatusChange();
    } catch (err: any) {
      toast.error('Resubmission Failed', err.message || 'Failed to resubmit payroll batch.');
    } finally {
      setResubmitting(false);
    }
  };

  // Summary metrics
  const summaryItems = [
    {
      label: 'Total Employees',
      value: totalEmployees.toLocaleString(),
      icon: Users,
      iconColor: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Gross Total',
      value: formatCurrency(totalGross, currency),
      icon: DollarSign,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Deductions',
      value: formatCurrency(totalDeductions, currency),
      icon: TrendingDown,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'Net Payable',
      value: formatCurrency(totalNet, currency),
      icon: Banknote,
      iconColor: 'text-violet-500 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Batch Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Payroll Summary</CardTitle>
            {approvalStatus && <ApprovalBadge status={approvalStatus} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.bgColor}`}>
                    <Icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground truncate">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit for Approval Section */}
      {canSubmitForApproval && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Send className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ready for Approval</p>
                  <p className="text-xs text-muted-foreground">
                    Payroll processing is complete. Submit this batch for approval before disbursement.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={submitting}
                size="sm"
              >
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog (inline) */}
      {showConfirmDialog && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                <AlertTriangle className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">Confirm Submission</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  You are about to submit payroll for <span className="font-medium text-foreground">{totalEmployees} employees</span> with
                  a net payable of <span className="font-medium text-foreground">{formatCurrency(totalNet, currency)}</span>.
                  This action will initiate the approval workflow.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    onClick={handleSubmitForApproval}
                    disabled={submitting}
                    size="sm"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirm
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={submitting}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Notice & Resubmit */}
      {approvalStatus === 'REJECTED' && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">Payroll Rejected</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  This payroll batch has been rejected. Please review the calculations,
                  make any necessary corrections, and resubmit for approval.
                </p>
                <div className="mt-3 rounded-md bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">
                    Action Required: Review and correct any issues before resubmitting.
                  </p>
                </div>
                <div className="mt-4">
                  <Button
                    onClick={handleResubmit}
                    disabled={resubmitting}
                    variant="outline"
                    size="sm"
                  >
                    {resubmitting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Resubmitting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Revise &amp; Resubmit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approver Actions (shown when pending approval) */}
      {approvalStatus === 'PENDING_APPROVAL' && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
                <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">Approval Required</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  This payroll batch for <span className="font-medium text-foreground">{totalEmployees} employees</span> totaling{' '}
                  <span className="font-medium text-foreground">{formatCurrency(totalNet, currency)}</span> net
                  is awaiting your approval.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={approving || rejecting}
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  >
                    {approving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={approving || rejecting}
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>

            {/* Inline Reject Dialog */}
            {showRejectDialog && (
              <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-4">
                <h5 className="text-sm font-medium text-foreground mb-2">Rejection Reason</h5>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Please provide a reason for rejecting this payroll batch..."
                  className="w-full rounded-md border border-border bg-background text-foreground text-sm p-3 min-h-[80px] resize-y placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={rejecting || !rejectionNotes.trim()}
                    size="sm"
                  >
                    {rejecting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Confirm Rejection
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowRejectDialog(false);
                      setRejectionNotes('');
                    }}
                    disabled={rejecting}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approved Notice */}
      {approvalStatus === 'APPROVED' && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Payroll Approved</h4>
                <p className="text-xs text-muted-foreground">
                  This payroll batch has been approved and is ready for disbursement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---- Approval Status Badge ----

function ApprovalBadge({ status }: { status: string }) {
  switch (status) {
    case 'PENDING_APPROVAL':
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending Approval
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return null;
  }
}
