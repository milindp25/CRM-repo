'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Puzzle, Plus, ToggleLeft, ToggleRight, Pencil, Search, AlertCircle } from 'lucide-react';

const AVAILABLE_FEATURES = [
  'EMPLOYEES', 'DEPARTMENTS', 'DESIGNATIONS', 'ATTENDANCE', 'LEAVE',
  'PAYROLL', 'REPORTS', 'AUDIT_LOGS', 'DOCUMENTS', 'WORKFLOWS',
  'PERFORMANCE', 'RECRUITMENT', 'TRAINING', 'ASSETS', 'EXPENSES',
  'SHIFTS', 'API_ACCESS', 'WEBHOOKS', 'SSO', 'CUSTOM_FIELDS',
];

export default function AddonsPage() {
  const [addons, setAddons] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    feature: '',
    name: '',
    description: '',
    price: '',
    yearlyPrice: '',
  });
  const [editForm, setEditForm] = useState({
    feature: '',
    name: '',
    description: '',
    price: '',
    yearlyPrice: '',
  });

  useEffect(() => {
    loadAddons();
  }, []);

  async function loadAddons() {
    try {
      const data = await apiClient.getAddons();
      setAddons(data);
    } catch (err) {
      console.error('Failed to load add-ons:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    try {
      await apiClient.createAddon({
        feature: form.feature,
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        yearlyPrice: form.yearlyPrice ? parseFloat(form.yearlyPrice) : undefined,
      });
      setShowCreate(false);
      setForm({ feature: '', name: '', description: '', price: '', yearlyPrice: '' });
      loadAddons();
    } catch (err: any) {
      setCreateError(err.message);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError('');
    try {
      await apiClient.updateAddon(editId, {
        name: editForm.name,
        description: editForm.description || undefined,
        price: parseFloat(editForm.price),
        yearlyPrice: editForm.yearlyPrice ? parseFloat(editForm.yearlyPrice) : undefined,
      });
      setShowEdit(false);
      setEditId('');
      setEditForm({ feature: '', name: '', description: '', price: '', yearlyPrice: '' });
      loadAddons();
    } catch (err: any) {
      setEditError(err.message);
    }
  }

  function openEdit(addon: any) {
    setEditId(addon.id);
    setEditForm({
      feature: addon.feature,
      name: addon.name,
      description: addon.description || '',
      price: String(parseFloat(addon.price)),
      yearlyPrice: addon.yearlyPrice ? String(parseFloat(addon.yearlyPrice)) : '',
    });
    setEditError('');
    setShowEdit(true);
  }

  async function toggleAddon(id: string, currentActive: boolean) {
    try {
      await apiClient.updateAddon(id, { isActive: !currentActive });
      loadAddons();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const usedFeatures = addons.map((a) => a.feature);
  const availableForCreate = AVAILABLE_FEATURES.filter(
    (f) => !usedFeatures.includes(f)
  );

  // Client-side filtering
  const filteredAddons = addons.filter((addon) => {
    const matchesSearch =
      !search ||
      addon.name.toLowerCase().includes(search.toLowerCase()) ||
      addon.feature.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && addon.isActive) ||
      (filterStatus === 'inactive' && !addon.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading add-ons...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feature Add-ons</h1>
          <p className="text-muted-foreground mt-1">
            Configure purchasable features that companies can buy beyond their base tier
          </p>
        </div>
        <button
          onClick={() => { setCreateError(''); setShowCreate(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Add-on
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium">Dismiss</button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or feature..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 bg-card text-foreground"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-md border border-border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Create Feature Add-on</h2>
            {createError && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{createError}</p>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Feature</label>
                <select
                  value={form.feature}
                  onChange={(e) => setForm({ ...form, feature: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                  required
                >
                  <option value="">Select a feature...</option>
                  {availableForCreate.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                  required
                  placeholder="e.g., Document Management"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Yearly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.yearlyPrice}
                    onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center" onClick={() => setShowEdit(false)}>
          <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-md border border-border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Edit Feature Add-on</h2>
            {editError && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{editError}</p>
              </div>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Feature</label>
                <input
                  type="text"
                  value={editForm.feature}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-muted-foreground cursor-not-allowed"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                  required
                  placeholder="e.g., Document Management"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Yearly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.yearlyPrice}
                    onChange={(e) => setEditForm({ ...editForm, yearlyPrice: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add-ons Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Feature</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Monthly</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Yearly</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Companies</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAddons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  <Puzzle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  {addons.length === 0
                    ? 'No add-ons configured yet. Create one to get started.'
                    : 'No add-ons match your search or filter.'}
                </td>
              </tr>
            ) : (
              filteredAddons.map((addon) => (
                <tr key={addon.id} className="hover:bg-muted">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {addon.feature}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{addon.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">${parseFloat(addon.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {addon.yearlyPrice ? `$${parseFloat(addon.yearlyPrice).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{addon._count?.companyAddons ?? 0}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        addon.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {addon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(addon)}
                        className="text-muted-foreground hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleAddon(addon.id, addon.isActive)}
                        className="text-muted-foreground hover:text-blue-600 transition-colors"
                        title={addon.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {addon.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
