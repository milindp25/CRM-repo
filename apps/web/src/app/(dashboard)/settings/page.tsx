'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Company, type UpdateCompanyData } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import {
  Key, Webhook, FileText, Shield, DollarSign,
  ArrowRightLeft, CalendarDays, MapPin, Save,
} from 'lucide-react';

const LEAVE_ENTITLEMENTS = [
  { type: 'Casual Leave', days: 12, note: 'per year' },
  { type: 'Sick Leave', days: 12, note: 'per year' },
  { type: 'Earned Leave', days: 15, note: 'per year' },
  { type: 'Privilege Leave', days: 15, note: 'per year' },
  { type: 'Maternity Leave', days: 180, note: 'per year' },
  { type: 'Paternity Leave', days: 15, note: 'per year' },
  { type: 'Time Off in Lieu', days: 0, note: 'earned when working extra' },
  { type: 'Unpaid Leave', days: 0, note: 'when other leave is used up' },
];

const SETTING_LINKS = [
  { href: '/settings/api-keys', icon: Key, title: 'Integrations', description: 'Connect HRPlatform with other tools your team uses', color: 'blue' as const },
  { href: '/settings/webhooks', icon: Webhook, title: 'Event Notifications', description: 'Get notified in other apps when things happen here', color: 'green' as const },
  { href: '/settings/custom-fields', icon: FileText, title: 'Custom Fields', description: 'Add extra info fields to employee profiles and forms', color: 'purple' as const },
  { href: '/settings/sso', icon: Shield, title: 'Single Sign-On', description: 'Let your team log in with their company account', color: 'amber' as const },
  { href: '/settings/payroll', icon: DollarSign, title: 'Payroll Settings', description: 'Set your region, tax rules, and pay schedule', color: 'cyan' as const },
  { href: '/settings/delegations', icon: ArrowRightLeft, title: 'Backup Approvers', description: 'Pick someone to handle approvals when you\'re away', color: 'orange' as const },
  { href: '/settings/leave-policies', icon: CalendarDays, title: 'Time Off Rules', description: 'Set how many days off each person gets and rollover rules', color: 'rose' as const },
  { href: '/settings/geofence', icon: MapPin, title: 'Office Locations', description: 'Set up check-in zones so attendance is tracked by location', color: 'indigo' as const },
];

const iconColorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
};

const INPUT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

export default function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const [formData, setFormData] = useState<UpdateCompanyData>({
    companyName: '',
    industry: '',
    website: '',
    logoUrl: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    gstin: '',
    pan: '',
  });

  useEffect(() => {
    let cancelled = false;
    const initFetch = async () => {
      try {
        if (!cancelled) setLoading(true);
        const data = await apiClient.getCompany();
        if (!cancelled) {
          setCompany(data);
          setFormData({
            companyName: data.companyName || '',
            industry: data.industry || '',
            website: data.website || '',
            logoUrl: data.logoUrl || '',
            email: data.email || '',
            phone: data.phone || '',
            addressLine1: data.addressLine1 || '',
            addressLine2: data.addressLine2 || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
            postalCode: data.postalCode || '',
            gstin: data.gstin || '',
            pan: data.pan || '',
          });
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load company info');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    initFetch();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.updateCompany(formData);
      toast.success('Settings saved', 'Company profile updated successfully');
    } catch (err: any) {
      toast.error('Update failed', err.message || 'Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UpdateCompanyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_COMPANY]}>
      <PageContainer
        title="Settings"
        description="Update your company details and configure how things work"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Settings' },
        ]}
      >
        {error && (
          <ErrorBanner message={error} onDismiss={() => setError('')} />
        )}

        {/* Company Profile Form */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Company Profile</h2>

          {company && (
            <div className="mb-4 flex items-center gap-3">
              <StatusBadge variant={getStatusVariant(company.subscriptionTier)}>
                {company.subscriptionTier}
              </StatusBadge>
              <StatusBadge variant={getStatusVariant(company.subscriptionStatus)} dot>
                {company.subscriptionStatus}
              </StatusBadge>
              <span className="text-sm text-muted-foreground">Code: {company.companyCode}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. Technology, Finance, Healthcare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Logo URL</label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    className={`flex-1 ${INPUT_CLASS}`}
                    placeholder="https://example.com/logo.png"
                  />
                  {formData.logoUrl && (
                    <img
                      src={formData.logoUrl}
                      alt="Company logo"
                      className="w-10 h-10 rounded-lg object-contain border border-input"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">GSTIN</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">PAN</label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => handleChange('pan', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="AAAAA0000A"
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Address Line 1</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => handleChange('addressLine2', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Advanced Settings Links */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">More Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SETTING_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <div className={`inline-flex rounded-lg p-2 mb-3 ${iconColorMap[link.color]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">{link.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                </a>
              );
            })}
          </div>
        </div>

        {/* Leave Entitlements (informational) */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Time Off Allowances</h2>
            <a href="/settings/leave-policies" className="text-xs text-primary hover:underline">Edit rules</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {LEAVE_ENTITLEMENTS.map((le) => (
              <div key={le.type} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">{le.type}</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {le.days > 0 ? `${le.days} days` : le.note}
                </p>
                {le.days > 0 && (
                  <p className="text-xs text-muted-foreground">{le.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </RoleGate>
  );
}
