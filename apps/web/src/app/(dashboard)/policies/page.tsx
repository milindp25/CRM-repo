'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Policy } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', content: '', category: 'HR', version: '1.0', requiresAcknowledgment: false });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, [categoryFilter]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPolicies({
        category: categoryFilter || undefined,
      });
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.createPolicy(form);
      setShowCreate(false);
      setForm({ title: '', description: '', content: '', category: 'HR', version: '1.0', requiresAcknowledgment: false });
      setSuccess('Policy created successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchPolicies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await apiClient.publishPolicy(id);
      setSuccess('Policy published');
      setTimeout(() => setSuccess(''), 3000);
      fetchPolicies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await apiClient.acknowledgePolicy(id);
      setSuccess('Policy acknowledged');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-yellow-100 text-yellow-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const categories = ['HR', 'IT', 'FINANCE', 'COMPLIANCE', 'SAFETY', 'GENERAL'];

  return (
    <FeatureGate feature="POLICIES">
      <RoleGate requiredPermissions={[Permission.VIEW_POLICIES, Permission.MANAGE_POLICIES, Permission.ACKNOWLEDGE_POLICY]}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Policies</h1>
              <p className="text-gray-600 mt-1">Company policies, handbooks, and acknowledgments</p>
            </div>
            <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              {showCreate ? 'Cancel' : '+ New Policy'}
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

          {showCreate && (
            <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Create Policy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Employee Code of Conduct" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input type="text" value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown) *</label>
                  <textarea required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm" rows={6} placeholder="# Policy Title&#10;&#10;## Section 1&#10;Policy content here..." />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="ack" checked={form.requiresAcknowledgment} onChange={e => setForm(p => ({ ...p, requiresAcknowledgment: e.target.checked }))} className="rounded" />
                  <label htmlFor="ack" className="text-sm text-gray-700">Requires employee acknowledgment</label>
                </div>
              </div>
              <button type="submit" disabled={creating} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">{creating ? 'Creating...' : 'Create Policy'}</button>
            </form>
          )}

          {/* Filter */}
          <div className="flex gap-4 mb-4">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Policy List */}
            <div className="lg:col-span-1">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : policies.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow-md"><p className="text-gray-500">No policies found</p></div>
              ) : (
                <div className="space-y-2">
                  {policies.map(policy => (
                    <div key={policy.id} onClick={() => setSelectedPolicy(policy)} className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer border-2 transition ${selectedPolicy?.id === policy.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{policy.title}</h3>
                        {statusBadge(policy.status)}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{policy.category}</span>
                        <span className="text-xs text-gray-400">v{policy.version}</span>
                      </div>
                      {policy.requiresAcknowledgment && (
                        <span className="text-xs text-orange-600 mt-1 block">Acknowledgment required</span>
                      )}
                      {policy.status === 'DRAFT' && (
                        <button onClick={e => { e.stopPropagation(); handlePublish(policy.id); }} className="mt-2 text-xs text-blue-600 hover:text-blue-800">Publish</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Policy Content */}
            <div className="lg:col-span-2">
              {selectedPolicy ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedPolicy.title}</h2>
                      <div className="flex gap-2 mt-1">
                        {statusBadge(selectedPolicy.status)}
                        <span className="text-xs text-gray-500">v{selectedPolicy.version}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{selectedPolicy.category}</span>
                      </div>
                    </div>
                    {selectedPolicy.requiresAcknowledgment && selectedPolicy.status === 'PUBLISHED' && (
                      <button onClick={() => handleAcknowledge(selectedPolicy.id)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
                        Acknowledge
                      </button>
                    )}
                  </div>
                  {selectedPolicy.description && (
                    <p className="text-sm text-gray-600 mb-4">{selectedPolicy.description}</p>
                  )}
                  <div className="prose prose-sm max-w-none border-t pt-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{selectedPolicy.content}</pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                  <p className="text-gray-500">Select a policy to view its content</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </RoleGate>
    </FeatureGate>
  );
}
