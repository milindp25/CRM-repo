'use client';

import { useEffect, useState } from 'react';
import { apiClient, Designation } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { PageContainer } from '@/components/ui/page-container';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { Award, Plus, Pencil, Trash2, Users, Loader2, Layers, AlertCircle } from 'lucide-react';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';

export default function DesignationsPage() {
  const toast = useToast();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', code: '', description: '', level: 1, minSalary: '', maxSalary: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const initLoad = async () => {
      try {
        if (!cancelled) setLoading(true);
        const response = await apiClient.getDesignations({ limit: 100 });
        if (!cancelled) setDesignations(response.data);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    initLoad();
    return () => { cancelled = true; };
  }, []);

  const loadDesignations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDesignations({ limit: 100 });
      setDesignations(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);
      const data = {
        ...formData,
        minSalary: formData.minSalary ? Number(formData.minSalary) : undefined,
        maxSalary: formData.maxSalary ? Number(formData.maxSalary) : undefined,
      };
      if (editingId) {
        await apiClient.updateDesignation(editingId, data);
        toast.success('Designation updated', 'Designation has been updated successfully.');
      } else {
        await apiClient.createDesignation(data);
        toast.success('Designation created', 'New designation has been created successfully.');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', code: '', description: '', level: 1, minSalary: '', maxSalary: '' });
      loadDesignations();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save designation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (designation: Designation) => {
    setEditingId(designation.id);
    setFormData({
      title: designation.title, code: designation.code,
      description: designation.description || '', level: designation.level,
      minSalary: designation.minSalary?.toString() || '',
      maxSalary: designation.maxSalary?.toString() || '',
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this designation?')) return;
    try {
      await apiClient.deleteDesignation(id);
      toast.success('Designation deleted', 'Designation has been deleted successfully.');
      loadDesignations();
    } catch (err: any) {
      toast.error('Failed to delete designation', err.message);
    }
  };

  const getLevelLabel = (level: number) => {
    const labels = ['', 'Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level'];
    return labels[level] || `L${level}`;
  };

  const getLevelVariant = (level: number) => {
    if (level <= 2) return 'neutral' as const;
    if (level <= 4) return 'info' as const;
    if (level <= 6) return 'purple' as const;
    if (level <= 8) return 'cyan' as const;
    return 'success' as const;
  };

  const formatSalary = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const openNewForm = () => {
    setShowForm(true);
    setEditingId(null);
    setFormData({ title: '', code: '', description: '', level: 1, minSalary: '', maxSalary: '' });
    setFormError(null);
  };

  if (loading) return <PageLoader />;

  return (
    <PageContainer
      title="Job Titles"
      description="Define roles and pay ranges for your team"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Job Titles' }]}
      actions={
        <RoleGate requiredPermissions={[Permission.MANAGE_DESIGNATIONS]} hideOnly>
          <button onClick={openNewForm} className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Designation
          </button>
        </RoleGate>
      }
    >
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={loadDesignations} />}

      {designations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
          <Layers className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No designations yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">Create designations to define job titles and salary bands.</p>
          <RoleGate requiredPermissions={[Permission.MANAGE_DESIGNATIONS]} hideOnly>
            <button onClick={openNewForm} className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Create Designation
            </button>
          </RoleGate>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Salary Range</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employees</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {designations.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{d.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{d.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={getLevelVariant(d.level)} size="sm">
                        L{d.level} &middot; {getLevelLabel(d.level)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {d.minSalary || d.maxSalary
                        ? `${formatSalary(d.minSalary)} – ${formatSalary(d.maxSalary)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant="info" dot size="sm">
                        {d.employeeCount || 0}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RoleGate requiredPermissions={[Permission.MANAGE_DESIGNATIONS]} hideOnly>
                        <div className="inline-flex gap-1">
                          <button onClick={() => handleEdit(d)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors" aria-label="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(d.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors" aria-label="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </RoleGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} size="lg">
        <ModalHeader onClose={() => setShowForm(false)}>
          {editingId ? 'Edit Designation' : 'New Designation'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="Senior Software Engineer" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Code</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="Auto-generated" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[60px] px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Level (1-9)</label>
                  <input type="number" min="1" max="9" value={formData.level} onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                    className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Min Salary</label>
                  <input type="number" value={formData.minSalary} onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                    className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="800000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Max Salary</label>
                  <input type="number" value={formData.maxSalary} onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                    className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="1200000" />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button type="button" onClick={() => setShowForm(false)} disabled={submitting}
              className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Update' : 'Create'}
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </PageContainer>
  );
}
