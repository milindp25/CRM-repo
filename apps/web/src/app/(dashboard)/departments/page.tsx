'use client';

import { useEffect, useState } from 'react';
import { apiClient, Department } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { PageContainer } from '@/components/ui/page-container';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { Building2, Plus, Pencil, Trash2, Users, Loader2, FolderTree, AlertCircle } from 'lucide-react';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';

export default function DepartmentsPage() {
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const initLoad = async () => {
      try {
        if (!cancelled) setLoading(true);
        const response = await apiClient.getDepartments({ limit: 100 });
        if (!cancelled) setDepartments(response.data);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    initLoad();
    return () => { cancelled = true; };
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDepartments({ limit: 100 });
      setDepartments(response.data);
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
      if (editingId) {
        await apiClient.updateDepartment(editingId, formData);
        toast.success('Department updated', 'Department has been updated successfully.');
      } else {
        await apiClient.createDepartment(formData);
        toast.success('Department created', 'New department has been created successfully.');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', code: '', description: '' });
      loadDepartments();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormData({ name: dept.name, code: dept.code, description: dept.description || '' });
    setFormError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    try {
      await apiClient.deleteDepartment(id);
      toast.success('Department deleted', 'Department has been deleted successfully.');
      loadDepartments();
    } catch (err: any) {
      toast.error('Failed to delete department', err.message);
    }
  };

  const openNewForm = () => {
    setShowForm(true);
    setEditingId(null);
    setFormData({ name: '', code: '', description: '' });
    setFormError(null);
  };

  if (loading) return <PageLoader />;

  return (
    <PageContainer
      title="Departments"
      description="Organize your company structure"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Departments' }]}
      actions={
        <RoleGate requiredPermissions={[Permission.MANAGE_DEPARTMENTS]} hideOnly>
          <button onClick={openNewForm} className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Department
          </button>
        </RoleGate>
      }
    >
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={loadDepartments} />}

      {/* Department Grid Cards */}
      {departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
          <FolderTree className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No departments yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">Create your first department to start organizing your company structure.</p>
          <RoleGate requiredPermissions={[Permission.MANAGE_DEPARTMENTS]} hideOnly>
            <button onClick={openNewForm} className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Create Department
            </button>
          </RoleGate>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{dept.name}</h3>
                    <span className="text-xs font-mono text-muted-foreground">{dept.code}</span>
                  </div>
                </div>
                <RoleGate requiredPermissions={[Permission.MANAGE_DEPARTMENTS]} hideOnly>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(dept)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors" aria-label="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors" aria-label="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </RoleGate>
              </div>
              {dept.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{dept.description}</p>
              )}
              <div className="flex items-center gap-2 pt-2 border-t">
                <StatusBadge variant="info" dot>
                  <Users className="w-3 h-3 mr-0.5" />
                  {dept.employeeCount || 0} employees
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} size="md">
        <ModalHeader onClose={() => setShowForm(false)}>
          {editingId ? 'Edit Department' : 'New Department'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="Engineering" />
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
                  className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
                  rows={3} placeholder="Brief description of this department" />
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
