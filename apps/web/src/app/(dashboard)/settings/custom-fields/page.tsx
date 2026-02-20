'use client';

import { useState, useEffect } from 'react';
import { apiClient, type CustomFieldDefinition } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import Link from 'next/link';

const ENTITY_TYPES = ['EMPLOYEE', 'DEPARTMENT', 'LEAVE', 'ATTENDANCE'];
const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'BOOLEAN', 'URL', 'EMAIL'];

export default function CustomFieldsPage() {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [form, setForm] = useState({
    name: '',
    fieldKey: '',
    description: '',
    entityType: 'EMPLOYEE',
    fieldType: 'TEXT',
    isRequired: false,
    defaultValue: '',
    displayOrder: 0,
    options: [{ value: '', label: '' }],
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchDefinitions(); }, [filterEntity]);

  const fetchDefinitions = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getCustomFieldDefinitions(filterEntity || undefined);
      setDefinitions(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const isSelectType = form.fieldType === 'SELECT' || form.fieldType === 'MULTI_SELECT';
      await apiClient.createCustomFieldDefinition({
        name: form.name,
        fieldKey: form.fieldKey,
        description: form.description || undefined,
        entityType: form.entityType,
        fieldType: form.fieldType,
        isRequired: form.isRequired,
        defaultValue: form.defaultValue || undefined,
        displayOrder: form.displayOrder,
        options: isSelectType ? form.options.filter(o => o.value && o.label) : undefined,
      });
      setShowCreate(false);
      setForm({ name: '', fieldKey: '', description: '', entityType: 'EMPLOYEE', fieldType: 'TEXT', isRequired: false, defaultValue: '', displayOrder: 0, options: [{ value: '', label: '' }] });
      fetchDefinitions();
      setSuccess('Custom field created');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this custom field? Existing values will be lost.')) return;
    try {
      await apiClient.deleteCustomFieldDefinition(id);
      fetchDefinitions();
    } catch (err: any) { setError(err.message); }
  };

  const addOption = () => setForm(f => ({ ...f, options: [...f.options, { value: '', label: '' }] }));
  const updateOption = (idx: number, field: 'value' | 'label', val: string) => {
    setForm(f => ({
      ...f,
      options: f.options.map((o, i) => i === idx ? { ...o, [field]: val } : o),
    }));
  };
  const removeOption = (idx: number) => setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));

  const autoFieldKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const fieldTypeLabel = (ft: string) => ft.replace(/_/g, ' ');
  const isSelectType = form.fieldType === 'SELECT' || form.fieldType === 'MULTI_SELECT';

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_COMPANY]}>
      <FeatureGate feature="CUSTOM_FIELDS">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link href="/settings" className="hover:text-blue-600">Settings</Link>
                <span>/</span><span>Custom Fields</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Custom Fields</h1>
              <p className="text-muted-foreground mt-1">Add custom data fields to your entities</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Add Field
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

          {/* Entity Type Filter */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setFilterEntity('')} className={`px-3 py-1 rounded-full text-sm ${!filterEntity ? 'bg-blue-600 text-white' : 'bg-muted text-foreground hover:bg-muted'}`}>
              All
            </button>
            {ENTITY_TYPES.map(et => (
              <button key={et} onClick={() => setFilterEntity(et)} className={`px-3 py-1 rounded-full text-sm ${filterEntity === et ? 'bg-blue-600 text-white' : 'bg-muted text-foreground hover:bg-muted'}`}>
                {et}
              </button>
            ))}
          </div>

          {/* Create Form */}
          {showCreate && (
            <div className="mb-6 bg-card rounded-lg shadow-md p-6 border">
              <h2 className="text-lg font-semibold mb-4">Add Custom Field</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Display Name *</label>
                    <input type="text" required value={form.name}
                      onChange={e => { setForm(f => ({ ...f, name: e.target.value, fieldKey: autoFieldKey(e.target.value) })); }}
                      className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Blood Group" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Field Key *</label>
                    <input type="text" required value={form.fieldKey}
                      onChange={e => setForm(f => ({ ...f, fieldKey: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm" placeholder="blood_group" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Entity Type *</label>
                    <select value={form.entityType} onChange={e => setForm(f => ({ ...f, entityType: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                      {ENTITY_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Field Type *</label>
                    <select value={form.fieldType} onChange={e => setForm(f => ({ ...f, fieldType: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                      {FIELD_TYPES.map(ft => <option key={ft} value={ft}>{fieldTypeLabel(ft)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                {isSelectType && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Options</label>
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input type="text" value={opt.value} onChange={e => updateOption(i, 'value', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Value" />
                        <input type="text" value={opt.label} onChange={e => updateOption(i, 'label', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Label" />
                        <button type="button" onClick={() => removeOption(i)} className="px-2 text-red-500 hover:bg-red-50 rounded">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={addOption} className="text-sm text-blue-600 hover:text-blue-700">+ Add option</button>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isRequired} onChange={e => setForm(f => ({ ...f, isRequired: e.target.checked }))} className="rounded" />
                    Required field
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-foreground">Order:</label>
                    <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} className="w-20 px-2 py-1 border rounded text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create Field'}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Definitions List */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading custom fields...</div>
          ) : definitions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow-md">
              <div className="text-4xl mb-2">📋</div>
              <h3 className="text-lg font-medium text-foreground">No custom fields</h3>
              <p className="text-muted-foreground mt-1">Add custom fields to capture additional data for your entities</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Key</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Required</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {definitions.map(def => (
                    <tr key={def.id} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{def.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{def.fieldKey}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">{def.entityType}</span></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{fieldTypeLabel(def.fieldType)}</td>
                      <td className="px-4 py-3 text-sm">{def.isRequired ? '✓' : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(def.id)} className="text-sm text-red-600 hover:text-red-700">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FeatureGate>
    </RoleGate>
  );
}
