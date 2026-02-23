'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { SalaryStructure, SalaryComponent, CreateSalaryStructureData } from '@/lib/api/types';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';

const EMPTY_COMPONENT: SalaryComponent = {
  name: '',
  type: 'EARNING',
  calculationType: 'FIXED',
  value: 0,
  isTaxable: true,
};

interface FormState {
  name: string;
  description: string;
  country: string;
  components: SalaryComponent[];
  designationId: string;
}

const initialForm: FormState = {
  name: '',
  description: '',
  country: 'IN',
  components: [
    { name: 'Basic', type: 'EARNING', calculationType: 'FIXED', value: 0, isTaxable: true },
    { name: 'HRA', type: 'EARNING', calculationType: 'PERCENTAGE_OF_BASIC', value: 50, isTaxable: true },
    { name: 'Special Allowance', type: 'EARNING', calculationType: 'FIXED', value: 0, isTaxable: true },
  ],
  designationId: '',
};

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({ ...initialForm });
  const toast = useToast();

  const fetchStructures = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getSalaryStructures();
      setStructures(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load salary structures');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...initialForm });
    setShowModal(true);
  };

  const openEdit = (s: SalaryStructure) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description || '',
      country: s.country,
      components: s.components.length > 0 ? [...s.components] : [{ ...EMPTY_COMPONENT }],
      designationId: s.designationId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this salary structure?')) return;
    try {
      await apiClient.deleteSalaryStructure(id);
      toast.success('Deleted', 'Salary structure deleted');
      fetchStructures();
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  const addComponent = () => {
    setForm(prev => ({
      ...prev,
      components: [...prev.components, { ...EMPTY_COMPONENT }],
    }));
  };

  const removeComponent = (idx: number) => {
    setForm(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== idx),
    }));
  };

  const updateComponent = (idx: number, field: keyof SalaryComponent, value: any) => {
    setForm(prev => ({
      ...prev,
      components: prev.components.map((c, i) =>
        i === idx ? { ...c, [field]: field === 'value' ? parseFloat(value) || 0 : value } : c,
      ),
    }));
  };

  // India 50% basic validation
  const getBasicWarning = (): string | null => {
    if (form.country !== 'IN') return null;
    const earnings = form.components.filter(c => c.type === 'EARNING');
    if (earnings.length === 0) return null;
    const allFixed = earnings.every(c => c.calculationType === 'FIXED');
    if (!allFixed) return null;
    const totalEarnings = earnings.reduce((s, c) => s + c.value, 0);
    if (totalEarnings <= 0) return null;
    const basic = earnings.find(c => c.name.toLowerCase().startsWith('basic'));
    if (!basic) return 'Indian salary structures must include a "Basic" component';
    if (basic.value / totalEarnings < 0.5) {
      return `Basic is ${((basic.value / totalEarnings) * 100).toFixed(1)}% of earnings — must be at least 50% (2025 Labour Code)`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.components.length === 0) {
      toast.error('Validation', 'At least one component is required');
      return;
    }
    const warning = getBasicWarning();
    if (warning && form.country === 'IN') {
      toast.error('Validation', warning);
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateSalaryStructureData = {
        name: form.name,
        country: form.country,
        components: form.components,
        ...(form.description && { description: form.description }),
        ...(form.designationId && { designationId: form.designationId }),
      };

      if (editingId) {
        await apiClient.updateSalaryStructure(editingId, payload);
        toast.success('Updated', 'Salary structure updated');
      } else {
        await apiClient.createSalaryStructure(payload);
        toast.success('Created', 'Salary structure created');
      }
      setShowModal(false);
      fetchStructures();
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  const basicWarning = getBasicWarning();
  const inputClass = 'w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_PAYROLL]}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Salary Structures</h1>
            <p className="text-muted-foreground mt-1">Define reusable salary component templates</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
          >
            + Create Structure
          </button>
        </div>

        {error && <ErrorBanner message={error} onDismiss={() => setError('')} className="mb-6" />}

        {/* Table */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Country</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Components</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {structures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No salary structures yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                structures.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        s.country === 'IN'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {s.country === 'IN' ? 'India' : 'United States'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {s.components.filter(c => c.type === 'EARNING').length} earnings,{' '}
                      {s.components.filter(c => c.type === 'DEDUCTION').length} deductions
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        s.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(s)} className="text-sm text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className="relative bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-semibold text-foreground">
                  {editingId ? 'Edit Salary Structure' : 'Create Salary Structure'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className={inputClass}
                      placeholder="e.g. Standard CTC - Senior Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Country *</label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="IN">India</option>
                      <option value="US">United States</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      className={inputClass}
                      rows={2}
                      placeholder="Optional description..."
                    />
                  </div>
                </div>

                {/* Components */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Salary Components</h3>
                    <button
                      type="button"
                      onClick={addComponent}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add Component
                    </button>
                  </div>

                  {basicWarning && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                      {basicWarning}
                    </div>
                  )}

                  <div className="space-y-3">
                    {form.components.map((comp, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 border border-border rounded-lg bg-muted/20">
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                          <input
                            type="text"
                            placeholder="Name"
                            required
                            value={comp.name}
                            onChange={(e) => updateComponent(idx, 'name', e.target.value)}
                            className={inputClass}
                          />
                          <select
                            value={comp.type}
                            onChange={(e) => updateComponent(idx, 'type', e.target.value)}
                            className={inputClass}
                          >
                            <option value="EARNING">Earning</option>
                            <option value="DEDUCTION">Deduction</option>
                          </select>
                          <select
                            value={comp.calculationType}
                            onChange={(e) => updateComponent(idx, 'calculationType', e.target.value)}
                            className={inputClass}
                          >
                            <option value="FIXED">Fixed</option>
                            <option value="PERCENTAGE_OF_BASIC">% of Basic</option>
                            <option value="PERCENTAGE_OF_GROSS">% of Gross</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Value"
                            required
                            value={comp.value || ''}
                            onChange={(e) => updateComponent(idx, 'value', e.target.value)}
                            className={inputClass}
                            min={0}
                            step="0.01"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                              <input
                                type="checkbox"
                                checked={comp.isTaxable}
                                onChange={(e) => updateComponent(idx, 'isTaxable', e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-gray-300"
                              />
                              Taxable
                            </label>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeComponent(idx)}
                          className="text-red-500 hover:text-red-700 text-lg mt-1 px-1"
                          title="Remove"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update Structure' : 'Create Structure'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
