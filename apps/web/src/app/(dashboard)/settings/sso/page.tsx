'use client';

import { useState, useEffect } from 'react';
import { apiClient, type SSOConfig } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import Link from 'next/link';

export default function SSOSettingsPage() {
  const [config, setConfig] = useState<SSOConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    provider: 'google' as 'google' | 'saml',
    enabled: false,
    googleClientId: '',
    googleClientSecret: '',
    allowedDomains: '',
  });

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const data = await apiClient.getSSOConfig();
      setConfig(data);
      setForm({
        provider: data.provider || 'google',
        enabled: data.enabled || false,
        googleClientId: data.googleClientId || '',
        googleClientSecret: data.googleClientSecret || '',
        allowedDomains: (data.allowedDomains || []).join(', '),
      });
    } catch (err: any) {
      // SSO may not be configured yet
      if (err.statusCode !== 404) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.updateSSOConfig({
        provider: form.provider,
        enabled: form.enabled,
        googleClientId: form.googleClientId || undefined,
        googleClientSecret: form.googleClientSecret || undefined,
        allowedDomains: form.allowedDomains
          ? form.allowedDomains.split(',').map(d => d.trim()).filter(Boolean)
          : undefined,
      });
      setSuccess('SSO configuration saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading SSO configuration...</div>;
  }

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_COMPANY]}>
      <FeatureGate feature="SSO">
        <div className="p-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/settings" className="hover:text-blue-600">Settings</Link>
              <span>/</span><span>Single Sign-On</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Single Sign-On (SSO)</h1>
            <p className="text-muted-foreground mt-1">Configure SSO for your organization</p>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

          <div className="bg-card rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-medium text-foreground">Enable SSO</h3>
                  <p className="text-sm text-muted-foreground">Allow users to sign in with their identity provider</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                    className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Provider</label>
                <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value as 'google' | 'saml' }))}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="google">Google OAuth</option>
                  <option value="saml">SAML 2.0 (Coming Soon)</option>
                </select>
              </div>

              {form.provider === 'google' && (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <strong>Setup Instructions:</strong>
                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                      <li>Go to the Google Cloud Console</li>
                      <li>Create or select a project</li>
                      <li>Enable the Google+ API</li>
                      <li>Create OAuth 2.0 credentials (Web application type)</li>
                      <li>Add your callback URL to Authorized redirect URIs</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Google Client ID</label>
                    <input type="text" value={form.googleClientId}
                      onChange={e => setForm(f => ({ ...f, googleClientId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg" placeholder="xxxx.apps.googleusercontent.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Google Client Secret</label>
                    <input type="password" value={form.googleClientSecret}
                      onChange={e => setForm(f => ({ ...f, googleClientSecret: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg" placeholder="GOCSPX-..." />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Allowed Email Domains</label>
                <input type="text" value={form.allowedDomains}
                  onChange={e => setForm(f => ({ ...f, allowedDomains: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="example.com, company.org (comma separated)" />
                <p className="text-xs text-muted-foreground mt-1">Only users with email addresses on these domains can sign in via SSO. Leave empty to allow all domains.</p>
              </div>

              <div>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {saving ? 'Saving...' : 'Save SSO Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </FeatureGate>
    </RoleGate>
  );
}
