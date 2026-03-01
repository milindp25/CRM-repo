'use client';

import { useState, useEffect } from 'react';
import { apiClient, type CustomFieldDefinition } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge } from '@/components/ui/status-badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { ErrorBanner, EmptyState } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import { FileText, Plus, Trash2, Check, Minus, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const INPUT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
const SELECT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

const ENTITY_TYPES = ['EMPLOYEE', 'DEPARTMENT', 'LEAVE', 'ATTENDANCE'];
const ENTITY_TYPE_LABELS: Record<string, string> = {
  EMPLOYEE: 'Employee',
  DEPARTMENT: 'Department',
  LEAVE: 'Time Off',
  ATTENDANCE: 'Attendance',
};
const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'BOOLEAN', 'URL', 'EMAIL'];
const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Text',
  NUMBER: 'Number',
  DATE: 'Date',
  SELECT: 'Dropdown',
  MULTI_SELECT: 'Multiple Choice',
  BOOLEAN: 'Yes / No',
  URL: 'Link',
  EMAIL: 'Email',
};

export default function CustomFieldsPage() {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    try {
      await apiClient.deleteCustomFieldDefinition(id);
      setDeleteConfirmId(null);
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
        <PageContainer
          title="Custom Fields"
          description="Add extra information fields to your employee records and other sections"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Custom Fields' },
          ]}
          actions={
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors">
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          }
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

          {success && (
            <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 text-sm text-green-700 dark:text-green-300">
              {success}
            </div>
          )}

          {/* Entity Type Filter */}
          <div className="flex gap-2">
            <button onClick={() => setFilterEntity('')}
              className={`h-8 px-3 rounded-lg text-sm font-medium transition-colors ${!filterEntity ? 'bg-primary text-primary-foreground' : 'border border-input bg-background text-foreground hover:bg-muted'}`}>
              All
            </button>
            {ENTITY_TYPES.map(et => (
              <button key={et} onClick={() => setFilterEntity(et)}
                className={`h-8 px-3 rounded-lg text-sm font-medium transition-colors ${filterEntity === et ? 'bg-primary text-primary-foreground' : 'border border-input bg-background text-foreground hover:bg-muted'}`}>
                {ENTITY_TYPE_LABELS[et] || et}
              </button>
            ))}
          </div>

          {/* Create Form Modal */}
          <Modal open={showCreate} onClose={() => setShowCreate(false)} size="lg">
            <ModalHeader onClose={() => setShowCreate(false)}>Add Custom Field</ModalHeader>
            <form onSubmit={handleCreate}>
              <ModalBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Display Name *</label>
                    <input type="text" required value={form.name}
                      onChange={e => { setForm(f => ({ ...f, name: e.target.value, fieldKey: autoFieldKey(e.target.value) })); }}
                      className={INPUT_CLASS} placeholder="e.g. Blood Group" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Internal Name *</label>
                    <input type="text" required value={form.fieldKey}
                      onChange={e => setForm(f => ({ ...f, fieldKey: e.target.value }))}
                      className={`${INPUT_CLASS} font-mono`} placeholder="blood_group" />
                    <p className="text-xs text-muted-foreground mt-1">Auto-generated from the display name</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Applies To *</label>
                    <select value={form.entityType} onChange={e => setForm(f => ({ ...f, entityType: e.target.value }))} className={SELECT_CLASS}>
                      {ENTITY_TYPES.map(et => <option key={et} value={et}>{ENTITY_TYPE_LABELS[et] || et}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Input Type *</label>
                    <select value={form.fieldType} onChange={e => setForm(f => ({ ...f, fieldType: e.target.value }))} className={SELECT_CLASS}>
                      {FIELD_TYPES.map(ft => <option key={ft} value={ft}>{FIELD_TYPE_LABELS[ft] || ft}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={INPUT_CLASS} />
                </div>
                {isSelectType && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Options</label>
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input type="text" value={opt.value} onChange={e => updateOption(i, 'value', e.target.value)}
                          className={`flex-1 ${INPUT_CLASS}`} placeholder="Value" />
                        <input type="text" value={opt.label} onChange={e => updateOption(i, 'label', e.target.value)}
                          className={`flex-1 ${INPUT_CLASS}`} placeholder="Label" />
                        <button type="button" onClick={() => removeOption(i)}
                          className="text-destructive hover:bg-destructive/10 h-10 w-10 rounded-lg flex items-center justify-center transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addOption} className="text-sm text-primary hover:underline font-medium">+ Add option</button>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="checkbox" checked={form.isRequired} onChange={e => setForm(f => ({ ...f, isRequired: e.target.checked }))} className="rounded border-input" />
                    Required field
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-foreground">Order:</label>
                    <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                      className="h-10 w-20 px-2 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="border border-input bg-background text-foreground hover:bg-muted h-9 px-4 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {creating ? 'Creating...' : 'Create Field'}
                </button>
              </ModalFooter>
            </form>
          </Modal>

          {/* Definitions Table */}
          {loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              <TableLoader rows={5} cols={6} />
            </div>
          ) : definitions.length === 0 ? (
            <div className="rounded-xl border bg-card">
              <EmptyState
                icon={<FileText className="h-10 w-10" />}
                title="No custom fields"
                description="Add custom fields to capture extra information for your team"
                action={{ label: 'Add Field', onClick: () => setShowCreate(true) }}
              />
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Internal Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Applies To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Input Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Required</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {definitions.map(def => (
                    <tr key={def.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{def.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{def.fieldKey}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant="info">{ENTITY_TYPE_LABELS[def.entityType] || def.entityType}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{FIELD_TYPE_LABELS[def.fieldType] || def.fieldType}</td>
                      <td className="px-4 py-3 text-sm">
                        {def.isRequired ? (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setDeleteConfirmId(def.id)}
                          className="inline-flex items-center gap-1 text-sm text-destructive hover:bg-destructive/10 h-8 px-2.5 rounded-lg transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Confirm Dialog */}
          <ConfirmDialog
            open={!!deleteConfirmId}
            onClose={() => setDeleteConfirmId(null)}
            onConfirm={() => handleDelete(deleteConfirmId!)}
            title="Delete Custom Field"
            description="Are you sure you want to delete this custom field? Any existing values stored in this field will be permanently lost."
            confirmLabel="Delete Field"
            variant="destructive"
          />
        </PageContainer>
      </FeatureGate>
    </RoleGate>
  );
}
