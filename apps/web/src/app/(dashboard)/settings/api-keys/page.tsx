'use client';

import { useState, useEffect } from 'react';
import { apiClient, type ApiKey, type ApiKeyCreateResponse } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { ErrorBanner, EmptyState } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import { Key, Plus, Copy, Clock, Shield, CheckCircle } from 'lucide-react';

const INPUT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

const availablePermissions = [
  'VIEW_EMPLOYEES', 'VIEW_DEPARTMENTS', 'VIEW_DESIGNATIONS',
  'VIEW_ATTENDANCE', 'VIEW_LEAVES', 'VIEW_PAYROLL',
  'VIEW_REPORTS', 'VIEW_AUDIT_LOGS',
  'CREATE_EMPLOYEES', 'UPDATE_EMPLOYEES',
  'MANAGE_ATTENDANCE', 'MANAGE_LEAVES',
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<ApiKeyCreateResponse | null>(null);

  // Create form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const data = await apiClient.getApiKeys();
      setApiKeys(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const result = await apiClient.createApiKey({
        name,
        description: description || undefined,
        permissions,
        expiresAt: expiresAt || undefined,
      });
      setNewKey(result);
      setShowCreate(false);
      setName('');
      setDescription('');
      setPermissions([]);
      setExpiresAt('');
      fetchApiKeys();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;
    try {
      await apiClient.revokeApiKey(id);
      fetchApiKeys();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const togglePermission = (perm: string) => {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_COMPANY]}>
      <FeatureGate feature="API_ACCESS">
        <PageContainer
          title="Integrations"
          description="Create keys to connect HRPlatform with other tools and services"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'API Keys' },
          ]}
          actions={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create API Key
            </button>
          }
        >
          {error && (
            <ErrorBanner message={error} onDismiss={() => setError('')} />
          )}

          {/* New Key Display (shown once after creation) */}
          {newKey && (
            <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-green-800 dark:text-green-300">API Key Created Successfully</h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400 mb-3">Copy your API key now. You won&apos;t be able to see it again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2.5 bg-card rounded-lg border border-input font-mono text-sm break-all text-foreground">{newKey.key}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(newKey.key); }}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
              <button onClick={() => setNewKey(null)} className="mt-2 text-sm text-green-600 dark:text-green-400 hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Create Form Modal */}
          <Modal open={showCreate} onClose={() => setShowCreate(false)} size="lg">
            <ModalHeader onClose={() => setShowCreate(false)}>Create New API Key</ModalHeader>
            <form onSubmit={handleCreate}>
              <ModalBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    className={INPUT_CLASS} placeholder="e.g. Production Integration" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                    className={INPUT_CLASS} placeholder="What is this key used for?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Permissions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {availablePermissions.map(perm => (
                      <label key={perm} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input type="checkbox" checked={permissions.includes(perm)}
                          onChange={() => togglePermission(perm)} className="rounded border-input" />
                        {perm.replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Expires At (optional)</label>
                  <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                    className={INPUT_CLASS} />
                </div>
              </ModalBody>
              <ModalFooter>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="border border-input bg-background text-foreground hover:bg-muted h-9 px-4 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {creating ? 'Creating...' : 'Create Key'}
                </button>
              </ModalFooter>
            </form>
          </Modal>

          {/* API Keys List */}
          {loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              <TableLoader rows={4} cols={4} />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="rounded-xl border bg-card">
              <EmptyState
                icon={<Key className="h-10 w-10" />}
                title="No integration keys yet"
                description="Create your first key to connect HRPlatform with other tools"
                action={{ label: 'Create API Key', onClick: () => setShowCreate(true) }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map(key => (
                <div key={key.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{key.name}</h3>
                        <StatusBadge variant={getStatusVariant(key.isActive ? 'ACTIVE' : 'DISABLED')} dot>
                          {key.isActive ? 'Active' : 'Revoked'}
                        </StatusBadge>
                      </div>
                      {key.description && <p className="text-sm text-muted-foreground mt-0.5">{key.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          Prefix: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{key.prefix}</code>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {key.permissions.length} permissions
                        </span>
                        {key.lastUsedAt && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                          </span>
                        )}
                        {key.expiresAt && <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>}
                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {key.isActive && (
                      <button onClick={() => handleRevoke(key.id)}
                        className="text-sm text-destructive hover:bg-destructive/10 h-8 px-3 rounded-lg transition-colors font-medium">
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageContainer>
      </FeatureGate>
    </RoleGate>
  );
}
