'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Company } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const QUARTERS = [
  { value: 1, label: 'Q1 (Jan-Mar / Apr-Jun)' },
  { value: 2, label: 'Q2 (Apr-Jun / Jul-Sep)' },
  { value: 3, label: 'Q3 (Jul-Sep / Oct-Dec)' },
  { value: 4, label: 'Q4 (Oct-Dec / Jan-Mar)' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollReportsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const toast = useToast();

  // Form states
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [state, setState] = useState('');

  useEffect(() => {
    apiClient.getCompany().then(setCompany).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const downloadFile = async (reportType: string, fetchFn: () => Promise<Blob>, filename: string) => {
    setDownloading(reportType);
    try {
      const blob = await fetchFn();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded', `${reportType} downloaded successfully`);
    } catch (err: any) {
      toast.error('Download Failed', err.message || `Failed to download ${reportType}`);
    } finally {
      setDownloading('');
    }
  };

  if (loading) return <PageLoader />;

  const isIndia = (company as any)?.payrollCountry === 'IN' || !(company as any)?.payrollCountry;
  const isUS = (company as any)?.payrollCountry === 'US';

  const inputClass = 'px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm';
  const cardClass = 'bg-card rounded-lg shadow-md p-6 mb-6';

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_PAYROLL]}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <a href="/payroll" className="text-muted-foreground hover:text-foreground text-sm">&larr; Payroll</a>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Compliance Reports</h1>
          <p className="text-muted-foreground mt-1">Download statutory reports for tax filing and compliance</p>
        </div>

        {/* Period Selectors */}
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-foreground mb-3">Report Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Quarter</label>
              <select value={quarter} onChange={e => setQuarter(Number(e.target.value))} className={inputClass + ' w-full'}>
                {QUARTERS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className={inputClass + ' w-full'}>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className={inputClass + ' w-full'}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            {isUS && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">State</label>
                <input value={state} onChange={e => setState(e.target.value.toUpperCase())} placeholder="e.g. CA, NY" maxLength={2} className={inputClass + ' w-full'} />
              </div>
            )}
          </div>
        </div>

        {/* India Reports */}
        {isIndia && (
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">India</span>
              India Compliance Reports
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <h3 className="font-medium text-foreground">Form 24Q — Quarterly TDS Return</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Quarterly summary of TDS deducted and deposited for all employees. Upload to TRACES portal.</p>
                </div>
                <button
                  onClick={() => downloadFile('Form 24Q', () => apiClient.get(`/payroll/reports/form24q?quarter=${quarter}&fiscalYear=${year}`, { headers: { Accept: 'text/csv' } } as any).then(() => { throw new Error('Use blob download'); }).catch(() => {
                    const url = `${API_BASE}/payroll/reports/form24q?quarter=${quarter}&fiscalYear=${year}`;
                    return fetch(url, { credentials: 'include', headers: { Authorization: `Bearer ${apiClient.getAccessToken()}` } }).then(r => r.blob());
                  }), `form24q_Q${quarter}_FY${year}.csv`)}
                  disabled={downloading === 'Form 24Q'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  {downloading === 'Form 24Q' ? 'Downloading...' : 'Download CSV'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <h3 className="font-medium text-foreground">PF ECR — Monthly PF Challan</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Employee-wise PF contribution breakdown (EPF + EPS). Upload to EPFO portal.</p>
                </div>
                <button
                  onClick={() => {
                    const url = `${API_BASE}/payroll/reports/pf-ecr?month=${month}&year=${year}`;
                    downloadFile('PF ECR', () => fetch(url, { credentials: 'include', headers: { Authorization: `Bearer ${apiClient.getAccessToken()}` } }).then(r => r.blob()), `pf_ecr_${month}_${year}.csv`);
                  }}
                  disabled={downloading === 'PF ECR'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  {downloading === 'PF ECR' ? 'Downloading...' : 'Download CSV'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <h3 className="font-medium text-foreground">ESI Contribution Sheet</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Monthly ESI employee + employer contribution. Upload to ESIC portal.</p>
                </div>
                <button
                  onClick={() => {
                    const url = `${API_BASE}/payroll/reports/esi?month=${month}&year=${year}`;
                    downloadFile('ESI', () => fetch(url, { credentials: 'include', headers: { Authorization: `Bearer ${apiClient.getAccessToken()}` } }).then(r => r.blob()), `esi_${month}_${year}.csv`);
                  }}
                  disabled={downloading === 'ESI'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  {downloading === 'ESI' ? 'Downloading...' : 'Download CSV'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* US Reports */}
        {isUS && (
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">US</span>
              US Compliance Reports
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <h3 className="font-medium text-foreground">Form 941 — Quarterly Federal Tax</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Total wages, federal tax withheld, SS/Medicare totals. IRS quarterly filing.</p>
                </div>
                <button
                  onClick={() => {
                    const url = `${API_BASE}/payroll/reports/form941?quarter=${quarter}&year=${year}`;
                    downloadFile('Form 941', () => fetch(url, { credentials: 'include', headers: { Authorization: `Bearer ${apiClient.getAccessToken()}` } }).then(r => r.blob()), `form941_Q${quarter}_${year}.pdf`);
                  }}
                  disabled={downloading === 'Form 941'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  {downloading === 'Form 941' ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <h3 className="font-medium text-foreground">State Tax Report</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Quarterly state withholding report. Format varies by state.</p>
                </div>
                <button
                  onClick={() => {
                    if (!state) { toast.error('Required', 'Enter a state code'); return; }
                    const url = `${API_BASE}/payroll/reports/state-tax?quarter=${quarter}&year=${year}&state=${state}`;
                    downloadFile('State Tax', () => fetch(url, { credentials: 'include', headers: { Authorization: `Bearer ${apiClient.getAccessToken()}` } }).then(r => r.blob()), `state_tax_${state}_Q${quarter}_${year}.csv`);
                  }}
                  disabled={downloading === 'State Tax'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  {downloading === 'State Tax' ? 'Downloading...' : 'Download CSV'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
