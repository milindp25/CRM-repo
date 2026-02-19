'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, Designation } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Award, Plus, Edit, Trash2, Users, Loader2 } from 'lucide-react';

export default function DesignationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    level: 1,
    minSalary: '',
    maxSalary: '',
  });

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
      toast.error('Failed to save designation', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (designation: Designation) => {
    setEditingId(designation.id);
    setFormData({
      title: designation.title,
      code: designation.code,
      description: designation.description || '',
      level: designation.level,
      minSalary: designation.minSalary?.toString() || '',
      maxSalary: designation.maxSalary?.toString() || '',
    });
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
    return labels[level] || level;
  };

  const formatSalary = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Designations</h1>
          <p className="mt-2 text-gray-600">Define job titles and salary bands</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ title: '', code: '', description: '', level: 1, minSalary: '', maxSalary: '' });
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          New Designation
        </button>
      </div>

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={() => loadDesignations()} className="mb-6" />
      )}

      {showForm && (
        <div className="mb-6 bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Designation' : 'New Designation'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="SSE"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Level (1-9)</label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Salary</label>
                <input
                  type="number"
                  value={formData.minSalary}
                  onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="800000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Salary</label>
                <input
                  type="number"
                  value={formData.maxSalary}
                  onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="1200000"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={submitting}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Salary Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Employees
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {designations.map((designation) => (
              <tr key={designation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{designation.code}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-gray-400" />
                    {designation.title}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    L{designation.level} - {getLevelLabel(designation.level)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {designation.minSalary || designation.maxSalary
                    ? `${formatSalary(designation.minSalary)} - ${formatSalary(designation.maxSalary)}`
                    : '-'}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <Users className="h-3 w-3" />
                    {designation.employeeCount || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(designation)}
                    className="mr-2 p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(designation.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {designations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No designations found. Create your first one!
          </div>
        )}
      </div>
    </div>
  );
}
