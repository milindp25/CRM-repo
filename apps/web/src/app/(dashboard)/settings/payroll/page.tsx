'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { PageContainer } from '@/components/ui/page-container';
import { Loader2, Globe, ShieldCheck, Bell, Calendar, Info } from 'lucide-react';

interface PayrollSettingsForm {
  payrollCountry: string;
  payFrequency: string;
  payrollAutoGenerate: boolean;
  payrollAutoDay: number;
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
    payrollAutoGenerate: false,
    payrollAutoDay: 25,
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
            payrollAutoGenerate: (company as any).payrollAutoGenerate || false,
            payrollAutoDay: (company as any).payrollAutoDay || 25,
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
      const isNonMonthly = ['BI_WEEKLY', 'WEEKLY'].includes(
        form.payrollCountry === 'IN' ? 'MONTHLY' : form.payFrequency
      );
      await apiClient.updateCompany({
        payrollCountry: form.payrollCountry,
        payFrequency: form.payrollCountry === 'IN' ? 'MONTHLY' : form.payFrequency,
        payrollAutoGenerate: isNonMonthly ? false : form.payrollAutoGenerate,
        payrollAutoDay: form.payrollAutoDay,
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

  const inputClass = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
  const labelClass = 'block text-sm font-medium text-foreground mb-1.5';
  const sectionClass = 'rounded-xl border bg-card p-6';
  const checkboxClass = 'mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary/30';

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_COMPANY]}>
      <PageContainer
        title="Payroll Settings"
        description="Configure payroll region, tax compliance, and pay frequency"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Settings', href: '/settings' },
          { label: 'Payroll' },
        ]}
        className="max-w-4xl"
      >
        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payroll Region */}
          <div className={sectionClass}>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Payroll Region</h2>
            </div>
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

          {/* Automation */}
          {(() => {
            const effectiveFreq = isIndia ? 'MONTHLY' : form.payFrequency;
            const isNonMonthly = ['BI_WEEKLY', 'WEEKLY'].includes(effectiveFreq);

            return (
              <div className={sectionClass}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Automation</h2>
                </div>

                {isNonMonthly && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 mb-4">
                    <Info className="h-4 w-4 mt-0.5 text-blue-500 dark:text-blue-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Not available for {effectiveFreq === 'BI_WEEKLY' ? 'bi-weekly' : 'weekly'} payroll
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        Automatic payroll generation currently supports monthly and semi-monthly schedules. For {effectiveFreq === 'BI_WEEKLY' ? 'bi-weekly' : 'weekly'} payroll, please run it manually from the Payroll page.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                  <input
                    type="checkbox"
                    id="payrollAutoGenerate"
                    checked={form.payrollAutoGenerate}
                    onChange={(e) => setForm(prev => ({ ...prev, payrollAutoGenerate: e.target.checked }))}
                    className={checkboxClass}
                    disabled={isNonMonthly}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="payrollAutoGenerate"
                      className={`text-sm font-medium cursor-pointer ${isNonMonthly ? 'text-muted-foreground' : 'text-foreground'}`}
                    >
                      Automatically Generate Payroll
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      When enabled, payroll will be generated automatically on the scheduled day each month. You can still review and approve before marking as paid.
                    </p>

                    {form.payrollAutoGenerate && !isNonMonthly && (
                      <div className="mt-3">
                        <label className={labelClass}>Day of Month</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            max={28}
                            value={form.payrollAutoDay}
                            onChange={(e) => {
                              const val = Math.min(28, Math.max(1, parseInt(e.target.value) || 1));
                              setForm(prev => ({ ...prev, payrollAutoDay: val }));
                            }}
                            className={`${inputClass} !w-24`}
                          />
                          <span className="text-xs text-muted-foreground">
                            Payroll will be generated on the {form.payrollAutoDay}{form.payrollAutoDay === 1 ? 'st' : form.payrollAutoDay === 2 ? 'nd' : form.payrollAutoDay === 3 ? 'rd' : 'th'} of each month
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Choose a day between 1 and 28 to avoid month-end date issues.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* India-specific */}
          {isIndia && (
            <div className={sectionClass}>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">India Compliance</h2>
              </div>
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
                    className={checkboxClass}
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
                    className={checkboxClass}
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
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">US Compliance</h2>
              </div>
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
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            </div>
            <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
              <input
                type="checkbox"
                id="emailPayslip"
                checked={form.emailPayslipEnabled}
                onChange={(e) => setForm(prev => ({ ...prev, emailPayslipEnabled: e.target.checked }))}
                className={checkboxClass}
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
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Payroll Settings'}
            </button>
          </div>
        </form>
      </PageContainer>
    </RoleGate>
  );
}
