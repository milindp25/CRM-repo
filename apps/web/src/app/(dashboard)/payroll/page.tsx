'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, type Payroll, type Employee } from '@/lib/api-client';
import type { PayrollBatch } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { TableLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const getMonthName = (m: number) => MONTH_NAMES[m - 1] || '';

type Tab = 'run' | 'history' | 'batches';

export default function PayrollPage() {
  const [tab, setTab] = useState<Tab>('run');
  const toast = useToast();

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

  // Batches tab state
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

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
    if (!confirm(`Run payroll for ${getMonthName(runMonth)} ${runYear}? This will process all active employees.`)) return;
    setProcessing(true);
    try {
      const batch = await apiClient.batchProcessPayroll(runMonth, runYear);
      setCurrentBatch(batch);
      toast.success('Payroll Started', `Batch processing initiated for ${getMonthName(runMonth)} ${runYear}`);
      // Reload after a moment
      setTimeout(() => loadCurrentBatch(), 2000);
    } catch (err: any) {
      toast.error('Batch Failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAllPaid = async () => {
    if (!currentBatch) return;
    if (!confirm('Mark all processed payrolls as paid?')) return;
    try {
      for (const p of batchPayrolls.filter(p => p.status === 'PROCESSED')) {
        await apiClient.markPayrollAsPaid(p.id);
      }
      toast.success('All Paid', 'All processed payrolls marked as paid');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
      case 'PROCESSED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'HOLD': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'PENDING': return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'PARTIAL': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  const tabClass = (t: Tab) => `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
    tab === t
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
  }`;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-muted-foreground mt-1">Process payroll, view history, and manage batches</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        <button onClick={() => setTab('run')} className={tabClass('run')}>Payroll Run</button>
        <button onClick={() => setTab('history')} className={tabClass('history')}>History</button>
        <button onClick={() => setTab('batches')} className={tabClass('batches')}>Batches</button>
      </div>

      {/* ═══ Tab 1: Payroll Run ═══ */}
      {tab === 'run' && (
        <div>
          {/* Period selector + actions */}
          <div className="bg-card rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Month</label>
                <select value={runMonth} onChange={e => setRunMonth(Number(e.target.value))} className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                <select value={runYear} onChange={e => setRunYear(Number(e.target.value))} className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {!currentBatch && (
                <button onClick={handleRunPayroll} disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                  {processing ? 'Processing...' : 'Run Payroll'}
                </button>
              )}
              {currentBatch && currentBatch.status === 'COMPLETED' && (
                <>
                  <button onClick={handleMarkAllPaid} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
                    Mark All Paid
                  </button>
                  <button onClick={handleDownloadBankFile} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium">
                    Download Bank File
                  </button>
                  <button onClick={handleSubmitApproval} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium">
                    Submit for Approval
                  </button>
                </>
              )}
            </div>
          </div>

          {runError && <ErrorBanner message={runError} onDismiss={() => setRunError('')} className="mb-4" />}

          {/* Batch status card */}
          {currentBatch && (
            <div className="bg-card rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">
                  Batch: {getMonthName(currentBatch.month)} {currentBatch.year}
                </h3>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(currentBatch.status)}`}>
                  {currentBatch.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-2xl font-bold text-foreground">{currentBatch.totalCount}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{currentBatch.processedCount}</p>
                  <p className="text-xs text-muted-foreground">Processed</p>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{currentBatch.failedCount}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
              {currentBatch.totalCount > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(currentBatch.processedCount / currentBatch.totalCount) * 100}%` }}
                  />
                </div>
              )}
              {currentBatch.errors && currentBatch.errors.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 rounded text-sm">
                  <p className="font-medium text-red-800 dark:text-red-400 mb-1">Errors:</p>
                  {currentBatch.errors.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-red-700 dark:text-red-300 text-xs">Employee {e.employeeId}: {e.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payroll records table */}
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Employee</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Gross</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Deductions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Net</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runLoading ? (
                  <tr><td colSpan={6}><TableLoader rows={5} cols={6} /></td></tr>
                ) : batchPayrolls.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    {currentBatch ? 'No payroll records in this batch.' : `No payroll batch for ${getMonthName(runMonth)} ${runYear}. Click "Run Payroll" to start.`}
                  </td></tr>
                ) : (
                  batchPayrolls.map(r => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{r.employee?.firstName} {r.employee?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{r.employee?.employeeCode}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground text-right font-medium">
                        {typeof r.grossSalary === 'number' ? `₹${r.grossSalary.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 text-right">
                        -{typeof r.pfEmployee === 'number' ? `₹${(r.pfEmployee + r.esiEmployee + r.tds + r.pt + r.otherDeductions).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 text-right font-semibold">
                        {typeof r.netSalary === 'number' ? `₹${r.netSalary.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          {r.status === 'PROCESSED' && (
                            <button onClick={() => handleRecalculate(r.id)} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">Recalc</button>
                          )}
                          {r.status === 'PROCESSED' && (
                            <button onClick={() => apiClient.markPayrollAsPaid(r.id).then(() => { toast.success('Paid', 'Marked as paid'); loadCurrentBatch(); }).catch((e: any) => toast.error('Error', e.message))} className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">Pay</button>
                          )}
                          <button onClick={() => handleDownloadPayslip(r.id)} className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded">Payslip</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Tab 2: History ═══ */}
      {tab === 'history' && (
        <div>
          <div className="bg-card rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Month</label>
                <select value={histFilters.month} onChange={e => setHistFilters(p => ({ ...p, month: Number(e.target.value) }))} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                <select value={histFilters.year} onChange={e => setHistFilters(p => ({ ...p, year: Number(e.target.value) }))} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Employee</label>
                <select value={histFilters.employeeId} onChange={e => setHistFilters(p => ({ ...p, employeeId: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                  <option value="">All</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employeeCode} - {emp.firstName} {emp.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select value={histFilters.status} onChange={e => setHistFilters(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                  <option value="">All</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PROCESSED">Processed</option>
                  <option value="PAID">Paid</option>
                  <option value="HOLD">Hold</option>
                </select>
              </div>
            </div>
          </div>

          {historyError && <ErrorBanner message={historyError} onDismiss={() => setHistoryError('')} className="mb-4" />}

          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Period</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Gross</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Deductions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Net</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyLoading ? (
                  <tr><td colSpan={7}><TableLoader rows={5} cols={7} /></td></tr>
                ) : historyRecords.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No records found.</td></tr>
                ) : (
                  historyRecords.map(r => {
                    const ded = r.pfEmployee + r.esiEmployee + r.tds + r.pt + r.otherDeductions;
                    return (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{r.employee?.firstName} {r.employee?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{r.employee?.employeeCode}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{getMonthName(r.payPeriodMonth)} {r.payPeriodYear}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-foreground">₹{r.grossSalary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">-₹{ded.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">₹{r.netSalary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(r.status)}`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDownloadPayslip(r.id)} className="text-xs text-purple-600 hover:text-purple-800">Payslip</button>
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

      {/* ═══ Tab 3: Batches ═══ */}
      {tab === 'batches' && (
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Period</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Processed</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Failed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {batchesLoading ? (
                <tr><td colSpan={6}><TableLoader rows={3} cols={6} /></td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No batches yet.</td></tr>
              ) : (
                batches.map(b => (
                  <tr key={b.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setRunMonth(b.month); setRunYear(b.year); setTab('run'); }}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{getMonthName(b.month)} {b.year}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-foreground">{b.totalCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400">{b.processedCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-red-600 dark:text-red-400">{b.failedCount}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{b.completedAt ? new Date(b.completedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
