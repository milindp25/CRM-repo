'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { CreditCard, Plus } from 'lucide-react';

const TIERS = ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'];

export default function BillingPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
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
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading billing plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Plans</h1>
          <p className="text-gray-500 mt-1">
            Configure pricing plans with seat-based billing
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Create Billing Plan</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                    placeholder="e.g., Standard Plan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                  <select
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.yearlyBasePrice}
                    onChange={(e) => setForm({ ...form, yearlyBasePrice: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Employee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.pricePerEmployee}
                    onChange={(e) => setForm({ ...form, pricePerEmployee: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Per User ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.pricePerUser}
                    onChange={(e) => setForm({ ...form, pricePerUser: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Included Employees</label>
                  <input
                    type="number"
                    min="0"
                    value={form.includedEmployees}
                    onChange={(e) => setForm({ ...form, includedEmployees: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Included Users</label>
                  <input
                    type="number"
                    min="0"
                    value={form.includedUsers}
                    onChange={(e) => setForm({ ...form, includedUsers: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
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
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            No billing plans configured yet. Create one to get started.
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    plan.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mb-4">
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {plan.tier}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Base Price (Monthly):</span>
                  <span className="font-semibold text-gray-900">
                    ${parseFloat(plan.basePrice).toFixed(2)}
                  </span>
                </div>
                {plan.yearlyBasePrice && (
                  <div className="flex justify-between">
                    <span>Base Price (Yearly):</span>
                    <span className="font-semibold text-gray-900">
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
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span>Included Employees:</span>
                    <span className="font-medium">{plan.includedEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Included Users:</span>
                    <span className="font-medium">{plan.includedUsers}</span>
                  </div>
                </div>
                <div className="border-t pt-2 mt-2">
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
