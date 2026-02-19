'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Puzzle, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

const AVAILABLE_FEATURES = [
  'EMPLOYEES', 'DEPARTMENTS', 'DESIGNATIONS', 'ATTENDANCE', 'LEAVE',
  'PAYROLL', 'REPORTS', 'AUDIT_LOGS', 'DOCUMENTS', 'WORKFLOWS',
  'PERFORMANCE', 'RECRUITMENT', 'TRAINING', 'ASSETS', 'EXPENSES',
  'SHIFTS', 'API_ACCESS', 'WEBHOOKS', 'SSO', 'CUSTOM_FIELDS',
];

export default function AddonsPage() {
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
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
      alert(err.message);
    }
  }

  async function toggleAddon(id: string, currentActive: boolean) {
    try {
      await apiClient.updateAddon(id, { isActive: !currentActive });
      loadAddons();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const usedFeatures = addons.map((a) => a.feature);
  const availableForCreate = AVAILABLE_FEATURES.filter(
    (f) => !usedFeatures.includes(f)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading add-ons...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Add-ons</h1>
          <p className="text-gray-500 mt-1">
            Configure purchasable features that companies can buy beyond their base tier
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Add-on
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Feature Add-on</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feature</label>
                <select
                  value={form.feature}
                  onChange={(e) => setForm({ ...form, feature: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select a feature...</option>
                  {availableForCreate.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  placeholder="e.g., Document Management"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.yearlyPrice}
                    onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
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

      {/* Add-ons Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Feature</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Monthly</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Yearly</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Companies</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {addons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Puzzle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No add-ons configured yet. Create one to get started.
                </td>
              </tr>
            ) : (
              addons.map((addon) => (
                <tr key={addon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {addon.feature}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{addon.name}</td>
                  <td className="px-6 py-4 text-gray-700">${parseFloat(addon.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {addon.yearlyPrice ? `$${parseFloat(addon.yearlyPrice).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{addon._count?.companyAddons ?? 0}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        addon.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {addon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleAddon(addon.id, addon.isActive)}
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                      title={addon.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {addon.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
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
