'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MyPayslipsPage() {
  const [latest, setLatest] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [ytd, setYtd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasArchive, setHasArchive] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [latestRes, historyRes, ytdRes] = await Promise.allSettled([
          apiClient.getMyLatestPaycheck(),
          apiClient.getMyPaycheckHistory(),
          apiClient.getMyPayrollYtd(),
        ]);

        if (!cancelled) {
          if (latestRes.status === 'fulfilled') setLatest(latestRes.value);
          if (historyRes.status === 'fulfilled') {
            const h = historyRes.value;
            setHistory(h?.data || []);
            setHasArchive(h?.hasArchive || false);
          }
          if (ytdRes.status === 'fulfilled') setYtd(ytdRes.value);
        }
      } catch { }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleDownload = async (payrollId: string) => {
    try {
      const blob = await apiClient.downloadPayslipPdf(payrollId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${payrollId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Download Failed', err.message || 'Could not download payslip');
    }
  };

  if (loading) return <PageLoader />;

  const currency = latest?.country === 'US' ? '$' : '₹';
  const fmt = (v: number) => `${currency}${(v || 0).toLocaleString(latest?.country === 'US' ? 'en-US' : 'en-IN')}`;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Payslips</h1>
        <p className="text-muted-foreground mt-1">View your paycheck details and download payslips</p>
      </div>

      {/* Latest Paycheck Hero */}
      {latest ? (
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Latest Paycheck</h2>
            <span className="text-sm text-muted-foreground">
              {MONTH_NAMES[(latest.payPeriodMonth || 1) - 1]} {latest.payPeriodYear}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Gross Pay</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{fmt(latest.grossSalary)}</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Deductions</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                -{fmt(latest.pfEmployee + latest.esiEmployee + latest.tds + latest.pt + latest.otherDeductions)}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Net Pay</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{fmt(latest.netSalary)}</p>
            </div>
          </div>

          {/* Earnings/Deductions breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Earnings</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Basic Salary</span>
                  <span className="text-foreground">{fmt(latest.basicSalary)}</span>
                </div>
                {latest.hra > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">HRA</span>
                    <span className="text-foreground">{fmt(latest.hra)}</span>
                  </div>
                )}
                {latest.specialAllowance > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Special Allowance</span>
                    <span className="text-foreground">{fmt(latest.specialAllowance)}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Deductions</h3>
              <div className="space-y-1">
                {latest.pfEmployee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">PF</span>
                    <span className="text-red-600 dark:text-red-400">-{fmt(latest.pfEmployee)}</span>
                  </div>
                )}
                {latest.tds > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TDS</span>
                    <span className="text-red-600 dark:text-red-400">-{fmt(latest.tds)}</span>
                  </div>
                )}
                {latest.pt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Professional Tax</span>
                    <span className="text-red-600 dark:text-red-400">-{fmt(latest.pt)}</span>
                  </div>
                )}
                {latest.esiEmployee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ESI</span>
                    <span className="text-red-600 dark:text-red-400">-{fmt(latest.esiEmployee)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleDownload(latest.id)}
            className="w-full mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium text-sm"
          >
            Download Payslip PDF
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow-md p-12 mb-6 text-center">
          <p className="text-muted-foreground">No paycheck data available yet.</p>
        </div>
      )}

      {/* YTD Summary */}
      {ytd && (
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Year-to-Date Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Gross Earned</p>
              <p className="text-lg font-bold text-foreground">{fmt(ytd.grossEarnings)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Deductions</p>
              <p className="text-lg font-bold text-foreground">{fmt(ytd.totalDeductions)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Tax Paid</p>
              <p className="text-lg font-bold text-foreground">{fmt(ytd.taxPaid)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Paycheck History */}
      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Paycheck History</h2>
          {!hasArchive && history.length > 0 && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 rounded-full">
              Showing latest only &mdash; Upgrade for full history
            </span>
          )}
        </div>
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Period</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Gross</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Net</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No paycheck history available.</td></tr>
            ) : (
              history.map((r: any) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-foreground">{MONTH_NAMES[(r.payPeriodMonth || 1) - 1]} {r.payPeriodYear}</td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">{fmt(r.grossSalary)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">{fmt(r.netSalary)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      r.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDownload(r.id)} className="text-xs text-blue-600 hover:text-blue-800">Download</button>
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
