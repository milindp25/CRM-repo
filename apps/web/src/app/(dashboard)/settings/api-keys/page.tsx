'use client';

import { useState, useEffect } from 'react';
import { apiClient, type ApiKey, type ApiKeyCreateResponse } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import Link from 'next/link';

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

  const availablePermissions = [
    'VIEW_EMPLOYEES', 'VIEW_DEPARTMENTS', 'VIEW_DESIGNATIONS',
    'VIEW_ATTENDANCE', 'VIEW_LEAVES', 'VIEW_PAYROLL',
    'VIEW_REPORTS', 'VIEW_AUDIT_LOGS',
    'CREATE_EMPLOYEES', 'UPDATE_EMPLOYEES',
    'MANAGE_ATTENDANCE', 'MANAGE_LEAVES',
  ];

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
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Link href="/settings" className="hover:text-blue-600">Settings</Link>
                <span>/</span>
                <span>API Keys</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
              <p className="text-gray-600 mt-1">Manage API keys for machine-to-machine integration</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create API Key
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          )}

          {/* New Key Display (shown once after creation) */}
          {newKey && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">API Key Created Successfully</h3>
              <p className="text-sm text-green-700 mb-2">Copy your API key now. You won&apos;t be able to see it again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white rounded border font-mono text-sm break-all">{newKey.key}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(newKey.key); }}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
              <button onClick={() => setNewKey(null)} className="mt-2 text-sm text-green-600 hover:text-green-700">
                Dismiss
              </button>
            </div>
          )}

          {/* Create Form Modal */}
          {showCreate && (
            <div className="mb-6 bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-lg font-semibold mb-4">Create New API Key</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Production Integration" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="What is this key used for?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {availablePermissions.map(perm => (
                      <label key={perm} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={permissions.includes(perm)}
                          onChange={() => togglePermission(perm)} className="rounded" />
                        {perm.replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
                  <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={creating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create Key'}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* API Keys List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-2">🔑</div>
              <h3 className="text-lg font-medium text-gray-900">No API keys yet</h3>
              <p className="text-gray-500 mt-1">Create your first API key for external integrations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map(key => (
                <div key={key.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{key.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${key.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {key.isActive ? 'Active' : 'Revoked'}
                        </span>
                      </div>
                      {key.description && <p className="text-sm text-gray-500 mt-0.5">{key.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Prefix: <code className="bg-gray-100 px-1 rounded">{key.prefix}</code></span>
                        <span>Permissions: {key.permissions.length}</span>
                        {key.lastUsedAt && <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                        {key.expiresAt && <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>}
                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {key.isActive && (
                      <button onClick={() => handleRevoke(key.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FeatureGate>
    </RoleGate>
  );
}
