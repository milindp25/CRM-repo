'use client';

import { useState, useEffect } from 'react';
import { apiClient, type SSOConfig } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { ErrorBanner } from '@/components/ui/error-banner';
import { PageLoader } from '@/components/ui/page-loader';
import { Save, Info } from 'lucide-react';

const INPUT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
const SELECT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

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
    return <PageLoader />;
  }

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_COMPANY]}>
      <FeatureGate feature="SSO">
        <PageContainer
          title="Company Login"
          description="Let your team sign in with their existing Google or company account"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Company Login' },
          ]}
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

          {success && (
            <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 text-sm text-green-700 dark:text-green-300">
              {success}
            </div>
          )}

          <div className="rounded-xl border bg-card p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <h3 className="font-medium text-foreground">Enable Company Login</h3>
                  <p className="text-sm text-muted-foreground">Let your team sign in with their Google or company account instead of a password</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                    className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Provider</label>
                <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value as 'google' | 'saml' }))}
                  className={SELECT_CLASS}>
                  <option value="google">Google OAuth</option>
                  <option value="saml">SAML 2.0 (Coming Soon)</option>
                </select>
              </div>

              {form.provider === 'google' && (
                <>
                  <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <strong className="block mb-1">Setup Instructions:</strong>
                        <ol className="list-decimal ml-4 space-y-1">
                          <li>Go to the Google Cloud Console</li>
                          <li>Create or select a project</li>
                          <li>Enable the Google+ API</li>
                          <li>Create OAuth 2.0 credentials (Web application type)</li>
                          <li>Add your callback URL to Authorized redirect URIs</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Google Client ID</label>
                    <input type="text" value={form.googleClientId}
                      onChange={e => setForm(f => ({ ...f, googleClientId: e.target.value }))}
                      className={INPUT_CLASS} placeholder="xxxx.apps.googleusercontent.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Google Client Secret</label>
                    <input type="password" value={form.googleClientSecret}
                      onChange={e => setForm(f => ({ ...f, googleClientSecret: e.target.value }))}
                      className={INPUT_CLASS} placeholder="GOCSPX-..." />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Allowed Email Domains</label>
                <input type="text" value={form.allowedDomains}
                  onChange={e => setForm(f => ({ ...f, allowedDomains: e.target.value }))}
                  className={INPUT_CLASS}
                  placeholder="example.com, company.org (comma separated)" />
                <p className="text-xs text-muted-foreground mt-1.5">Only users with email addresses on these domains can sign in via SSO. Leave empty to allow all domains.</p>
              </div>

              <div>
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save SSO Configuration'}
                </button>
              </div>
            </form>
          </div>
        </PageContainer>
      </FeatureGate>
    </RoleGate>
  );
}
