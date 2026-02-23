'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Company } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';

interface PayrollSettingsForm {
  payrollCountry: string;
  payFrequency: string;
  pfEnabled: boolean;
  esiEnabled: boolean;
  emailPayslipEnabled: boolean;
  companyPan: string;
  gstin: string;
  tan: string;
  pfRegNo: string;
  esiRegNo: string;
  ein: string;
}

export default function PayrollSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const [form, setForm] = useState<PayrollSettingsForm>({
    payrollCountry: 'IN',
    payFrequency: 'MONTHLY',
    pfEnabled: false,
    esiEnabled: false,
    emailPayslipEnabled: false,
    companyPan: '',
    gstin: '',
    tan: '',
    pfRegNo: '',
    esiRegNo: '',
    ein: '',
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const company = await apiClient.getCompany();
        if (!cancelled) {
          setForm({
            payrollCountry: (company as any).payrollCountry || 'IN',
            payFrequency: (company as any).payFrequency || 'MONTHLY',
            pfEnabled: (company as any).pfEnabled || false,
            esiEnabled: (company as any).esiEnabled || false,
            emailPayslipEnabled: (company as any).emailPayslipEnabled || false,
            companyPan: company.pan || '',
            gstin: company.gstin || '',
            tan: (company as any).tan || '',
            pfRegNo: (company as any).pfRegNo || '',
            esiRegNo: (company as any).esiRegNo || '',
            ein: (company as any).ein || '',
          });
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.updateCompany({
        payrollCountry: form.payrollCountry,
        payFrequency: form.payrollCountry === 'IN' ? 'MONTHLY' : form.payFrequency,
        pfEnabled: form.pfEnabled,
        esiEnabled: form.esiEnabled,
        emailPayslipEnabled: form.emailPayslipEnabled,
        pan: form.companyPan,
        gstin: form.gstin,
        tan: form.tan,
        pfRegNo: form.pfRegNo,
        esiRegNo: form.esiRegNo,
        ein: form.ein,
      } as any);
      toast.success('Settings saved', 'Payroll settings updated successfully');
    } catch (err: any) {
      toast.error('Update failed', err.message || 'Failed to update payroll settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const isIndia = form.payrollCountry === 'IN';
  const isUS = form.payrollCountry === 'US';

  const inputClass = 'w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-foreground mb-1';
  const sectionClass = 'bg-card rounded-lg shadow-md p-6 mb-6';

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_COMPANY]}>
      <div className="p-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <a href="/settings" className="text-muted-foreground hover:text-foreground text-sm">&larr; Settings</a>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Payroll Settings</h1>
          <p className="text-muted-foreground mt-1">Configure payroll region, tax compliance, and pay frequency</p>
        </div>

        {error && <ErrorBanner message={error} onDismiss={() => setError('')} className="mb-6" />}

        <form onSubmit={handleSubmit}>
          {/* Payroll Region */}
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Payroll Region</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Country *</label>
                <select
                  value={form.payrollCountry}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    payrollCountry: e.target.value,
                    payFrequency: e.target.value === 'IN' ? 'MONTHLY' : prev.payFrequency,
                  }))}
                  className={inputClass}
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Pay Frequency</label>
                {isIndia ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value="Monthly" disabled className={`${inputClass} bg-muted cursor-not-allowed`} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">India: Monthly only</span>
                  </div>
                ) : (
                  <select
                    value={form.payFrequency}
                    onChange={(e) => setForm(prev => ({ ...prev, payFrequency: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="SEMI_MONTHLY">Semi-Monthly (1st & 15th)</option>
                    <option value="BI_WEEKLY">Bi-Weekly (Every 2 weeks)</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* India-specific */}
          {isIndia && (
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-foreground mb-4">India Compliance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Company PAN *</label>
                  <input
                    type="text"
                    value={form.companyPan}
                    onChange={(e) => setForm(prev => ({ ...prev, companyPan: e.target.value.toUpperCase() }))}
                    className={inputClass}
                    placeholder="AAAAA0000A"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className={labelClass}>GSTIN</label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setForm(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                    className={inputClass}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className={labelClass}>TAN (for TDS filing)</label>
                  <input
                    type="text"
                    value={form.tan}
                    onChange={(e) => setForm(prev => ({ ...prev, tan: e.target.value.toUpperCase() }))}
                    className={inputClass}
                    placeholder="AAAA00000A"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                  <input
                    type="checkbox"
                    id="pfEnabled"
                    checked={form.pfEnabled}
                    onChange={(e) => setForm(prev => ({ ...prev, pfEnabled: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="pfEnabled" className="text-sm font-medium text-foreground cursor-pointer">
                      Provident Fund (PF) Enabled
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mandatory for companies with 20+ employees. 12% employee + 12% employer contribution.
                    </p>
                    {form.pfEnabled && (
                      <div className="mt-3">
                        <label className={labelClass}>PF Registration No</label>
                        <input
                          type="text"
                          value={form.pfRegNo}
                          onChange={(e) => setForm(prev => ({ ...prev, pfRegNo: e.target.value }))}
                          className={inputClass}
                          placeholder="e.g. DLCPM0012345000"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                  <input
                    type="checkbox"
                    id="esiEnabled"
                    checked={form.esiEnabled}
                    onChange={(e) => setForm(prev => ({ ...prev, esiEnabled: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="esiEnabled" className="text-sm font-medium text-foreground cursor-pointer">
                      Employee State Insurance (ESI) Enabled
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applicable for employees earning up to 21,000/month. 0.75% employee + 3.25% employer.
                    </p>
                    {form.esiEnabled && (
                      <div className="mt-3">
                        <label className={labelClass}>ESI Registration No</label>
                        <input
                          type="text"
                          value={form.esiRegNo}
                          onChange={(e) => setForm(prev => ({ ...prev, esiRegNo: e.target.value }))}
                          className={inputClass}
                          placeholder="e.g. 12345678901234567"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* US-specific */}
          {isUS && (
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-foreground mb-4">US Compliance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Employer Identification Number (EIN) *</label>
                  <input
                    type="text"
                    value={form.ein}
                    onChange={(e) => setForm(prev => ({ ...prev, ein: e.target.value }))}
                    className={inputClass}
                    placeholder="XX-XXXXXXX"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email Payslip */}
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
            <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
              <input
                type="checkbox"
                id="emailPayslip"
                checked={form.emailPayslipEnabled}
                onChange={(e) => setForm(prev => ({ ...prev, emailPayslipEnabled: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <label htmlFor="emailPayslip" className="text-sm font-medium text-foreground cursor-pointer">
                  Email Payslip on Payment
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically send payslip PDF to employees when payroll is marked as paid.
                </p>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : 'Save Payroll Settings'}
            </button>
          </div>
        </form>
      </div>
    </RoleGate>
  );
}
