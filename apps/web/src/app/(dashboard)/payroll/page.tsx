'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, type Payroll, type Employee } from '@/lib/api-client';
import type { PayrollBatch } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { TableLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { DollarSign, Users, AlertTriangle, CheckCircle, Download, Send, CreditCard, RefreshCw, FileText, Filter, ChevronRight, ClipboardCheck } from 'lucide-react';
import { PayrollDetailPanel } from '@/components/payroll/payroll-detail-panel';
import { PayrollReviewPanel } from '@/components/payroll/payroll-review-panel';
import { useAuthContext } from '@/contexts/auth-context';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/format-date';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const getMonthName = (m: number) => MONTH_NAMES[m - 1] || '';

const inputClass = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
const selectClass = inputClass;

type Tab = 'run' | 'history' | 'batches';

export default function PayrollPage() {
  useEffect(() => { document.title = 'Payroll | HRPlatform'; }, []);

  const [tab, setTab] = useState<Tab>('run');
  const toast = useToast();
  const { user } = useAuthContext();

  // Run tab state
  const [runMonth, setRunMonth] = useState(new Date().getMonth() + 1);
  const [runYear, setRunYear] = useState(new Date().getFullYear());
  const [currentBatch, setCurrentBatch] = useState<PayrollBatch | null>(null);
  const [batchPayrolls, setBatchPayrolls] = useState<Payroll[]>([]);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState('');
  const [processing, setProcessing] = useState(false);

  // History tab state
  const [historyRecords, setHistoryRecords] = useState<Payroll[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [histFilters, setHistFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    employeeId: '',
    status: '',
  });

  // Detail panel state
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Review panel state (for PENDING_APPROVAL batches)
  const [reviewingBatch, setReviewingBatch] = useState<PayrollBatch | null>(null);

  // Batches tab state
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Confirm dialog states
  const [runPayrollConfirm, setRunPayrollConfirm] = useState(false);
  const [markAllPaidConfirm, setMarkAllPaidConfirm] = useState(false);

  // Load employees once
  useEffect(() => {
    apiClient.getEmployees({ limit: 200 }).then(r => setEmployees(r.data)).catch(() => {});
  }, []);

  // Run tab: load current batch for selected period
  const loadCurrentBatch = useCallback(async () => {
    setRunLoading(true);
    setRunError('');
    setCurrentBatch(null);
    setBatchPayrolls([]);
    try {
      const batchList = await apiClient.getPayrollBatches();
      const match = batchList.find((b: PayrollBatch) => b.month === runMonth && b.year === runYear);
      if (match) {
        setCurrentBatch(match);
        // Load payrolls for this period
        const payrolls = await apiClient.getPayroll({ month: runMonth, year: runYear, take: 200 });
        setBatchPayrolls(payrolls.data);
      }
    } catch (err: any) {
      setRunError(err.message || 'Failed to load batch data');
    } finally {
      setRunLoading(false);
    }
  }, [runMonth, runYear]);

  useEffect(() => {
    if (tab === 'run') loadCurrentBatch();
  }, [tab, loadCurrentBatch]);

  // History tab: load records
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await apiClient.getPayroll({
        month: histFilters.month,
        year: histFilters.year,
        employeeId: histFilters.employeeId || undefined,
        status: (histFilters.status as any) || undefined,
        take: 100,
      });
      setHistoryRecords(res.data);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, [histFilters]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  // Batches tab
  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const list = await apiClient.getPayrollBatches();
      setBatches(list);
    } catch { }
    finally { setBatchesLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'batches') loadBatches();
  }, [tab, loadBatches]);

  // Actions
  const handleRunPayroll = async () => {
    setProcessing(true);
    try {
      const batch = await apiClient.batchProcessPayroll(runMonth, runYear);
      setCurrentBatch(batch);
      setRunPayrollConfirm(false);
      toast.success('Payroll Started', `Calculating salaries for ${getMonthName(runMonth)} ${runYear}...`);
      setTimeout(() => loadCurrentBatch(), 2000);
    } catch (err: any) {
      toast.error('Batch Failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAllPaid = async () => {
    if (!currentBatch) return;
    try {
      const result = await apiClient.markBatchAsPaid(currentBatch.id);
      toast.success('All Paid', result.message || 'All processed payrolls marked as paid');
      setMarkAllPaidConfirm(false);
      loadCurrentBatch();
    } catch (err: any) {
      toast.error('Error', err.message);
    }
  };

  const handleDownloadPayslip = async (payrollId: string) => {
    try {
      const blob = await apiClient.downloadPayslipPdf(payrollId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${payrollId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Download Failed', err.message);
    }
  };

  const handleDownloadBankFile = async () => {
    if (!currentBatch) return;
    try {
      const blob = await apiClient.downloadBankFile(currentBatch.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bank_file_${currentBatch.month}_${currentBatch.year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Download Failed', err.message);
    }
  };

  const handleRecalculate = async (id: string) => {
    try {
      await apiClient.recalculatePayroll(id);
      toast.success('Recalculated', 'Payroll recalculated successfully');
      loadCurrentBatch();
    } catch (err: any) {
      toast.error('Error', err.message);
    }
  };

  const handleSubmitApproval = async () => {
    if (!currentBatch) return;
    try {
      await apiClient.submitPayrollForApproval(currentBatch.id);
      toast.success('Submitted', 'Batch submitted for approval');
      loadCurrentBatch();
    } catch (err: any) {
      toast.error('Error', err.message);
    }
  };

  const tabClass = (t: Tab) => `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
    tab === t
      ? 'border-primary text-primary'
      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
  }`;

  return (
    <PageContainer
      title="Payroll"
      description="Run payroll, review past payments, and track progress"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Payroll' },
      ]}
    >
      {/* Tabs */}
      <div role="tablist" aria-label="Payroll sections" className="flex gap-0 border-b border-border -mt-2">
        <button role="tab" aria-selected={tab === 'run'} aria-controls="panel-run" onClick={() => setTab('run')} className={tabClass('run')}>Run Payroll</button>
        <button role="tab" aria-selected={tab === 'history'} aria-controls="panel-history" onClick={() => setTab('history')} className={tabClass('history')}>Past Payments</button>
        <button role="tab" aria-selected={tab === 'batches'} aria-controls="panel-batches" onClick={() => setTab('batches')} className={tabClass('batches')}>All Runs</button>
      </div>

      {/* Tab 1: Payroll Run */}
      {tab === 'run' && (
        <div id="panel-run" role="tabpanel" className="space-y-6">
          {/* Period selector + actions */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="payroll-run-month" className="block text-sm font-medium text-foreground mb-1.5">Month</label>
                <select id="payroll-run-month" value={runMonth} onChange={e => setRunMonth(Number(e.target.value))} className={selectClass} style={{ width: 'auto', minWidth: '140px' }}>
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="payroll-run-year" className="block text-sm font-medium text-foreground mb-1.5">Year</label>
                <select id="payroll-run-year" value={runYear} onChange={e => setRunYear(Number(e.target.value))} className={selectClass} style={{ width: 'auto', minWidth: '100px' }}>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {!currentBatch && (
                <RoleGate requiredPermissions={[Permission.MANAGE_PAYROLL]} hideOnly>
                  <button onClick={() => setRunPayrollConfirm(true)} disabled={processing} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <DollarSign className="h-4 w-4" />
                    {processing ? 'Processing...' : 'Run Payroll'}
                  </button>
                </RoleGate>
              )}
              {currentBatch && currentBatch.status === 'COMPLETED' && (
                <>
                  <RoleGate requiredPermissions={[Permission.MANAGE_PAYROLL]} hideOnly>
                    <button onClick={() => setMarkAllPaidConfirm(true)} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      <CreditCard className="h-4 w-4" />
                      Confirm All Payments
                    </button>
                  </RoleGate>
                  <button onClick={handleDownloadBankFile} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors">
                    <Download className="h-4 w-4" />
                    Download for Bank
                  </button>
                  <button onClick={handleSubmitApproval} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-primary text-primary bg-background hover:bg-primary/5 transition-colors">
                    <Send className="h-4 w-4" />
                    Submit for Approval
                  </button>
                  {batchPayrolls.some((p: any) => p.approvalStatus === 'PENDING_APPROVAL') && user?.role === 'COMPANY_ADMIN' && (
                    <button
                      onClick={() => setReviewingBatch(currentBatch)}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Review &amp; Approve
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {runError && <ErrorBanner message={runError} onDismiss={() => setRunError('')} />}

          {/* Batch status card */}
          {currentBatch && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Batch: {getMonthName(currentBatch.month)} {currentBatch.year}
                </h3>
                <div className="flex items-center gap-2">
                  {batchPayrolls.length > 0 && batchPayrolls[0].approvalStatus && (
                    <StatusBadge variant={getStatusVariant(batchPayrolls[0].approvalStatus)} dot>
                      {batchPayrolls[0].approvalStatus.replace(/_/g, ' ')}
                    </StatusBadge>
                  )}
                  <StatusBadge variant={getStatusVariant(currentBatch.status)} dot>
                    {currentBatch.status}
                  </StatusBadge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Total"
                  value={currentBatch.totalCount}
                  icon={Users}
                  iconColor="blue"
                  subtitle="Employees in batch"
                />
                <StatCard
                  title="Processed"
                  value={currentBatch.processedCount}
                  icon={CheckCircle}
                  iconColor="green"
                  subtitle={currentBatch.totalCount > 0 ? `${Math.round((currentBatch.processedCount / currentBatch.totalCount) * 100)}% complete` : '0%'}
                />
                <StatCard
                  title="Failed"
                  value={currentBatch.failedCount}
                  icon={AlertTriangle}
                  iconColor="rose"
                  subtitle="Require attention"
                />
              </div>

              {/* Progress bar */}
              {currentBatch.totalCount > 0 && (
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Processing Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((currentBatch.processedCount / currentBatch.totalCount) * 100)}%
                    </span>
                  </div>
                  <div
                    className="w-full bg-muted rounded-full h-2"
                    role="progressbar"
                    aria-valuenow={Math.round((currentBatch.processedCount / currentBatch.totalCount) * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Payroll processing progress"
                  >
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(currentBatch.processedCount / currentBatch.totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Errors */}
              {currentBatch.errors && currentBatch.errors.length > 0 && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
                    <p className="text-sm font-medium text-destructive">Processing Errors</p>
                  </div>
                  <div className="space-y-1">
                    {currentBatch.errors.slice(0, 5).map((e, i) => (
                      <p key={i} className="text-xs text-destructive/80">
                        Employee {e.employeeId}: {e.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review panel (replaces table when reviewing) */}
          {reviewingBatch && (
            <PayrollReviewPanel
              batch={reviewingBatch}
              onClose={() => setReviewingBatch(null)}
              onActionComplete={() => {
                setReviewingBatch(null);
                loadCurrentBatch();
              }}
            />
          )}

          {/* Payroll records table (hidden when review panel is active) */}
          {!reviewingBatch && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Deductions</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Net</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {runLoading ? (
                    <tr><td colSpan={6}><TableLoader rows={5} cols={6} /></td></tr>
                  ) : batchPayrolls.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-3" aria-hidden="true" />
                        <h3 className="text-lg font-semibold text-foreground">
                          {currentBatch ? 'No payroll records' : 'No payroll batch'}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                          {currentBatch ? 'No payroll records in this batch.' : `No payroll batch for ${getMonthName(runMonth)} ${runYear}. Click "Run Payroll" to start.`}
                        </p>
                      </div>
                    </td></tr>
                  ) : (
                    batchPayrolls.map(r => (
                      <tr
                        key={r.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                        onClick={() => setSelectedPayroll(r)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPayroll(r); } }}
                        tabIndex={0}
                        aria-label={`View payroll details for ${r.employee?.firstName} ${r.employee?.lastName}`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{r.employee?.firstName} {r.employee?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{r.employee?.employeeCode}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right font-medium">
                          {typeof r.grossSalary === 'number' ? `$${r.grossSalary.toLocaleString()}` : '--'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className="text-destructive dark:text-red-400">
                            -{typeof r.pfEmployee === 'number' ? `$${(r.pfEmployee + r.esiEmployee + r.tds + r.pt + r.otherDeductions).toLocaleString()}` : '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          <span className="text-green-600 dark:text-green-400">
                            {typeof r.netSalary === 'number' ? `$${r.netSalary.toLocaleString()}` : '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            {r.status === 'PROCESSED' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRecalculate(r.id); }}
                                className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Recalculate
                              </button>
                            )}
                            {r.status === 'PROCESSED' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); apiClient.markPayrollAsPaid(r.id).then(() => { toast.success('Paid', 'Marked as paid'); loadCurrentBatch(); }).catch((err: any) => toast.error('Error', err.message)); }}
                                className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:text-green-600 hover:bg-green-500/10 transition-colors"
                              >
                                <CreditCard className="h-3 w-3" />
                                Pay
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownloadPayslip(r.id); }}
                              className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10 transition-colors"
                            >
                              <FileText className="h-3 w-3" />
                              Payslip
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: History */}
      {tab === 'history' && (
        <div id="panel-history" role="tabpanel" className="space-y-6">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-medium text-foreground">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="payroll-hist-month" className="block text-sm font-medium text-foreground mb-1.5">Month</label>
                <select id="payroll-hist-month" value={histFilters.month} onChange={e => setHistFilters(p => ({ ...p, month: Number(e.target.value) }))} className={selectClass}>
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="payroll-hist-year" className="block text-sm font-medium text-foreground mb-1.5">Year</label>
                <select id="payroll-hist-year" value={histFilters.year} onChange={e => setHistFilters(p => ({ ...p, year: Number(e.target.value) }))} className={selectClass}>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="payroll-hist-employee" className="block text-sm font-medium text-foreground mb-1.5">Employee</label>
                <select id="payroll-hist-employee" value={histFilters.employeeId} onChange={e => setHistFilters(p => ({ ...p, employeeId: e.target.value }))} className={selectClass}>
                  <option value="">All</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employeeCode} - {emp.firstName} {emp.lastName}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="payroll-hist-status" className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                <select id="payroll-hist-status" value={histFilters.status} onChange={e => setHistFilters(p => ({ ...p, status: e.target.value }))} className={selectClass}>
                  <option value="">All</option>
                  <option value="DRAFT">Pending</option>
                  <option value="PROCESSED">Ready</option>
                  <option value="PAID">Paid</option>
                  <option value="HOLD">On Hold</option>
                </select>
              </div>
            </div>
          </div>

          {historyError && <ErrorBanner message={historyError} onDismiss={() => setHistoryError('')} />}

          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Deductions</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Net</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyLoading ? (
                  <tr><td colSpan={7}><TableLoader rows={5} cols={7} /></td></tr>
                ) : historyRecords.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" aria-hidden="true" />
                      <h3 className="text-lg font-semibold text-foreground">No records found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Try changing the month, employee, or status above to find records.</p>
                    </div>
                  </td></tr>
                ) : (
                  historyRecords.map(r => {
                    const ded = r.pfEmployee + r.esiEmployee + r.tds + r.pt + r.otherDeductions;
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                        onClick={() => setSelectedPayroll(r)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPayroll(r); } }}
                        tabIndex={0}
                        aria-label={`View payroll details for ${r.employee?.firstName} ${r.employee?.lastName}, ${getMonthName(r.payPeriodMonth)} ${r.payPeriodYear}`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{r.employee?.firstName} {r.employee?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{r.employee?.employeeCode}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{getMonthName(r.payPeriodMonth)} {r.payPeriodYear}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-foreground">${r.grossSalary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className="text-destructive dark:text-red-400">-${ded.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          <span className="text-green-600 dark:text-green-400">${r.netSalary.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadPayslip(r.id); }}
                            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10 transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            Payslip
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Batches */}
      {tab === 'batches' && (
        <div id="panel-batches" role="tabpanel" className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Processed</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Failed</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {batchesLoading ? (
                <tr><td colSpan={6}><TableLoader rows={3} cols={6} /></td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50 mb-3" aria-hidden="true" />
                    <h3 className="text-lg font-semibold text-foreground">No batches yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Go to the &quot;Run Payroll&quot; tab to process your first payroll.</p>
                  </div>
                </td></tr>
              ) : (
                batches.map(b => (
                  <tr
                    key={b.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    onClick={() => { setRunMonth(b.month); setRunYear(b.year); setTab('run'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRunMonth(b.month); setRunYear(b.year); setTab('run'); } }}
                    tabIndex={0}
                    aria-label={`View payroll run for ${getMonthName(b.month)} ${b.year}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{getMonthName(b.month)} {b.year}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge variant={getStatusVariant(b.status)} dot>{b.status}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-foreground">{b.totalCount}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className="text-green-600 dark:text-green-400">{b.processedCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className="text-destructive dark:text-red-400">{b.failedCount}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{b.completedAt ? formatDate(b.completedAt, { time: true }) : '--'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Detail Panel */}
      {selectedPayroll && (
        <PayrollDetailPanel
          payroll={selectedPayroll}
          onClose={() => setSelectedPayroll(null)}
          onUpdated={() => {
            if (tab === 'run') loadCurrentBatch();
            if (tab === 'history') loadHistory();
          }}
        />
      )}
      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={runPayrollConfirm}
        onClose={() => setRunPayrollConfirm(false)}
        onConfirm={handleRunPayroll}
        title="Run Payroll"
        description={`Run payroll for ${getMonthName(runMonth)} ${runYear}? This will calculate salaries for all active employees.`}
        confirmLabel="Run Payroll"
      />
      <ConfirmDialog
        open={markAllPaidConfirm}
        onClose={() => setMarkAllPaidConfirm(false)}
        onConfirm={handleMarkAllPaid}
        title="Confirm All Payments"
        description="Mark all processed payrolls as paid? This marks them as complete."
        confirmLabel="Confirm All Paid"
      />
    </PageContainer>
  );
}
