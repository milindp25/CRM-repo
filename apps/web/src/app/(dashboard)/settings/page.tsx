'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Company, type UpdateCompanyData } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';

const LEAVE_ENTITLEMENTS = [
  { type: 'Casual Leave', days: 12, note: 'per year' },
  { type: 'Sick Leave', days: 12, note: 'per year' },
  { type: 'Earned Leave', days: 15, note: 'per year' },
  { type: 'Privilege Leave', days: 15, note: 'per year' },
  { type: 'Maternity Leave', days: 180, note: 'per year' },
  { type: 'Paternity Leave', days: 15, note: 'per year' },
  { type: 'Compensatory Leave', days: 0, note: 'as accrued' },
  { type: 'Loss of Pay', days: 0, note: 'as applicable' },
];

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

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCompany();
      setCompany(data);
      setFormData({
        companyName: data.companyName || '',
        industry: data.industry || '',
        website: data.website || '',
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
    } catch (err: any) {
      setError(err.message || 'Failed to load company info');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your company profile and configuration</p>
        </div>

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError('')} className="mb-6" />
      )}

      {/* Company Profile Form */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Company Profile</h2>

        {company && (
          <div className="mb-4 flex gap-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {company.subscriptionTier}
            </span>
            <span className={`px-3 py-1 text-sm rounded-full ${
              company.subscriptionStatus === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {company.subscriptionStatus}
            </span>
            <span className="text-sm text-muted-foreground">Code: {company.companyCode}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Technology, Finance, Healthcare"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">PAN</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => handleChange('pan', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AAAAA0000A"
              />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => handleChange('addressLine1', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => handleChange('addressLine2', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Advanced Settings Links */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Advanced Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/settings/api-keys" className="border border-border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
            <div className="text-2xl mb-2">🔑</div>
            <h3 className="font-medium text-foreground group-hover:text-blue-700">API Keys</h3>
            <p className="text-xs text-muted-foreground mt-1">Manage API keys for integrations</p>
          </a>
          <a href="/settings/webhooks" className="border border-border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
            <div className="text-2xl mb-2">🔗</div>
            <h3 className="font-medium text-foreground group-hover:text-blue-700">Webhooks</h3>
            <p className="text-xs text-muted-foreground mt-1">Send events to external services</p>
          </a>
          <a href="/settings/custom-fields" className="border border-border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-medium text-foreground group-hover:text-blue-700">Custom Fields</h3>
            <p className="text-xs text-muted-foreground mt-1">Add custom data fields to entities</p>
          </a>
          <a href="/settings/sso" className="border border-border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
            <div className="text-2xl mb-2">🔐</div>
            <h3 className="font-medium text-foreground group-hover:text-blue-700">Single Sign-On</h3>
            <p className="text-xs text-muted-foreground mt-1">Configure SSO for your organization</p>
          </a>
        </div>
      </div>

      {/* Leave Entitlements (informational) */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Leave Entitlements</h2>
          <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">System defaults · Configurable in next release</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {LEAVE_ENTITLEMENTS.map((le) => (
            <div key={le.type} className="border border-border rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">{le.type}</p>
              <p className="text-lg font-bold text-blue-600 mt-1">
                {le.days > 0 ? `${le.days} days` : le.note}
              </p>
              {le.days > 0 && (
                <p className="text-xs text-muted-foreground">{le.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    </RoleGate>
  );
}
