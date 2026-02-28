'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { CreditCard, Plus, Pencil, Search, AlertCircle } from 'lucide-react';

const TIERS = ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'];

export default function BillingPlansPage() {
  const [plans, setPlans] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [form, setForm] = useState({
    name: '',
    tier: 'BASIC',
    basePrice: '',
    yearlyBasePrice: '',
    pricePerEmployee: '',
    pricePerUser: '',
    includedEmployees: '10',
    includedUsers: '5',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    tier: 'BASIC',
    basePrice: '',
    yearlyBasePrice: '',
    pricePerEmployee: '',
    pricePerUser: '',
    includedEmployees: '10',
    includedUsers: '5',
  });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const data = await apiClient.getBillingPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load billing plans:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    try {
      await apiClient.createBillingPlan({
        name: form.name,
        tier: form.tier,
        basePrice: parseFloat(form.basePrice),
        yearlyBasePrice: form.yearlyBasePrice ? parseFloat(form.yearlyBasePrice) : undefined,
        pricePerEmployee: parseFloat(form.pricePerEmployee),
        pricePerUser: parseFloat(form.pricePerUser),
        includedEmployees: parseInt(form.includedEmployees) || 0,
        includedUsers: parseInt(form.includedUsers) || 0,
      });
      setShowCreate(false);
      setForm({
        name: '',
        tier: 'BASIC',
        basePrice: '',
        yearlyBasePrice: '',
        pricePerEmployee: '',
        pricePerUser: '',
        includedEmployees: '10',
        includedUsers: '5',
      });
      loadPlans();
    } catch (err: any) {
      setCreateError(err.message);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError('');
    try {
      await apiClient.updateBillingPlan(editId, {
        name: editForm.name,
        tier: editForm.tier,
        basePrice: parseFloat(editForm.basePrice),
        yearlyBasePrice: editForm.yearlyBasePrice ? parseFloat(editForm.yearlyBasePrice) : undefined,
        pricePerEmployee: parseFloat(editForm.pricePerEmployee),
        pricePerUser: parseFloat(editForm.pricePerUser),
        includedEmployees: parseInt(editForm.includedEmployees) || 0,
        includedUsers: parseInt(editForm.includedUsers) || 0,
      });
      setShowEdit(false);
      setEditId('');
      setEditForm({
        name: '',
        tier: 'BASIC',
        basePrice: '',
        yearlyBasePrice: '',
        pricePerEmployee: '',
        pricePerUser: '',
        includedEmployees: '10',
        includedUsers: '5',
      });
      loadPlans();
    } catch (err: any) {
      setEditError(err.message);
    }
  }

  function openEdit(plan: any) {
    setEditId(plan.id);
    setEditForm({
      name: plan.name,
      tier: plan.tier,
      basePrice: String(parseFloat(plan.basePrice)),
      yearlyBasePrice: plan.yearlyBasePrice ? String(parseFloat(plan.yearlyBasePrice)) : '',
      pricePerEmployee: String(parseFloat(plan.pricePerEmployee)),
      pricePerUser: String(parseFloat(plan.pricePerUser)),
      includedEmployees: String(plan.includedEmployees),
      includedUsers: String(plan.includedUsers),
    });
    setEditError('');
    setShowEdit(true);
  }

  // Client-side filtering
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      !search ||
      plan.name.toLowerCase().includes(search.toLowerCase()) ||
      plan.tier.toLowerCase().includes(search.toLowerCase());
    const matchesTier =
      filterTier === 'all' || plan.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading billing plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing Plans</h1>
          <p className="text-muted-foreground mt-1">
            Configure pricing plans with seat-based billing
          </p>
        </div>
        <button
          onClick={() => { setCreateError(''); setShowCreate(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 bg-card text-foreground"
        >
          <option value="all">All Tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-lg border border-border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Create Billing Plan</h2>
            {createError && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{createError}</p>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    required
                    placeholder="e.g., Standard Plan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tier</label>
                  <select
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Monthly Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Yearly Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.yearlyBasePrice}
                    onChange={(e) => setForm({ ...form, yearlyBasePrice: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Price Per Employee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.pricePerEmployee}
                    onChange={(e) => setForm({ ...form, pricePerEmployee: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Price Per User ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.pricePerUser}
                    onChange={(e) => setForm({ ...form, pricePerUser: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Included Employees</label>
                  <input
                    type="number"
                    min="0"
                    value={form.includedEmployees}
                    onChange={(e) => setForm({ ...form, includedEmployees: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Included Users</label>
                  <input
                    type="number"
                    min="0"
                    value={form.includedUsers}
                    onChange={(e) => setForm({ ...form, includedUsers: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
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
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center" onClick={() => setShowEdit(false)}>
          <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-lg border border-border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Edit Billing Plan</h2>
            {editError && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{editError}</p>
              </div>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    required
                    placeholder="e.g., Standard Plan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tier</label>
                  <select
                    value={editForm.tier}
                    onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Monthly Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.basePrice}
                    onChange={(e) => setEditForm({ ...editForm, basePrice: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Yearly Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.yearlyBasePrice}
                    onChange={(e) => setEditForm({ ...editForm, yearlyBasePrice: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Price Per Employee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.pricePerEmployee}
                    onChange={(e) => setEditForm({ ...editForm, pricePerEmployee: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Price Per User ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.pricePerUser}
                    onChange={(e) => setEditForm({ ...editForm, pricePerUser: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Included Employees</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.includedEmployees}
                    onChange={(e) => setEditForm({ ...editForm, includedEmployees: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Included Users</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.includedUsers}
                    onChange={(e) => setEditForm({ ...editForm, includedUsers: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground"
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

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full bg-card rounded-xl shadow-sm border border-border p-12 text-center text-muted-foreground">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {plans.length === 0
              ? 'No billing plans configured yet. Create one to get started.'
              : 'No plans match your search or filter.'}
          </div>
        ) : (
          filteredPlans.map((plan) => (
            <div key={plan.id} className="bg-card rounded-xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(plan)}
                    className="text-muted-foreground hover:text-blue-600 transition-colors"
                    title="Edit plan"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      plan.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded">
                  {plan.tier}
                </span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Base Price (Monthly):</span>
                  <span className="font-semibold text-foreground">
                    ${parseFloat(plan.basePrice).toFixed(2)}
                  </span>
                </div>
                {plan.yearlyBasePrice && (
                  <div className="flex justify-between">
                    <span>Base Price (Yearly):</span>
                    <span className="font-semibold text-foreground">
                      ${parseFloat(plan.yearlyBasePrice).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Per Employee:</span>
                  <span className="font-medium">${parseFloat(plan.pricePerEmployee).toFixed(2)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Per User:</span>
                  <span className="font-medium">${parseFloat(plan.pricePerUser).toFixed(2)}/mo</span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span>Included Employees:</span>
                    <span className="font-medium">{plan.includedEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Included Users:</span>
                    <span className="font-medium">{plan.includedUsers}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span>Companies Using:</span>
                    <span className="font-medium">{plan._count?.companyBillings ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
