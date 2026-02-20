'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Asset } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', assetCode: '', category: 'LAPTOP', brand: '', model: '', serialNumber: '', location: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [statusFilter, categoryFilter]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAssets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      setAssets(Array.isArray(data) ? data : []);
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
      await apiClient.createAsset(form);
      setShowCreate(false);
      setForm({ name: '', assetCode: '', category: 'LAPTOP', brand: '', model: '', serialNumber: '', location: '', description: '' });
      setSuccess('Asset created successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchAssets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      RETIRED: 'bg-gray-100 text-gray-800',
      DISPOSED: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status.replace(/_/g, ' ')}</span>;
  };

  const conditionBadge = (condition: string) => {
    const colors: Record<string, string> = {
      NEW: 'text-green-600',
      GOOD: 'text-blue-600',
      FAIR: 'text-yellow-600',
      POOR: 'text-orange-600',
      DAMAGED: 'text-red-600',
    };
    return <span className={`text-xs font-medium ${colors[condition] || 'text-gray-600'}`}>{condition}</span>;
  };

  const categories = ['LAPTOP', 'PHONE', 'MONITOR', 'DESK', 'CHAIR', 'VEHICLE', 'SOFTWARE_LICENSE', 'OTHER'];

  return (
    <FeatureGate feature="ASSETS">
      <RoleGate requiredPermissions={[Permission.VIEW_ASSETS, Permission.MANAGE_ASSETS]}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Asset Management</h1>
              <p className="text-muted-foreground mt-1">Track and manage company assets</p>
            </div>
            <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              {showCreate ? 'Cancel' : '+ New Asset'}
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

          {showCreate && (
            <form onSubmit={handleCreate} className="bg-card rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-foreground mb-4">Add New Asset</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" placeholder="MacBook Pro 16" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Asset Code *</label>
                  <input type="text" required value={form.assetCode} onChange={e => setForm(p => ({ ...p, assetCode: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" placeholder="AST-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md">
                    {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Brand</label>
                  <input type="text" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Model</label>
                  <input type="text" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Serial Number</label>
                  <input type="text" value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                </div>
              </div>
              <button type="submit" disabled={creating} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">{creating ? 'Creating...' : 'Add Asset'}</button>
            </form>
          )}

          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border rounded-md text-sm">
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-border rounded-md text-sm">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading assets...</div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow-md"><p className="text-muted-foreground">No assets found</p></div>
          ) : (
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Condition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assets.map(asset => (
                    <tr key={asset.id} className="hover:bg-muted">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{asset.name}</div>
                        {asset.brand && <div className="text-xs text-muted-foreground">{asset.brand} {asset.model}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{asset.assetCode}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{asset.category.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4">{conditionBadge(asset.condition)}</td>
                      <td className="px-6 py-4">{statusBadge(asset.status)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{asset.location || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </RoleGate>
    </FeatureGate>
  );
}
