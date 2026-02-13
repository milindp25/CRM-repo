'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, Department } from '@/lib/api-client';
import { Building2, Plus, Edit, Trash2, Users, Loader2 } from 'lucide-react';

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  useEffect(() => {
    loadDepartments();
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
      if (editingId) {
        await apiClient.updateDepartment(editingId, formData);
      } else {
        await apiClient.createDepartment(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', code: '', description: '' });
      loadDepartments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormData({ name: dept.name, code: dept.code, description: dept.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    try {
      await apiClient.deleteDepartment(id);
      loadDepartments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="mt-2 text-gray-600">Organize your company structure</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: '', code: '', description: '' });
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          New Department
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Department' : 'New Department'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Engineering"
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
                  placeholder="ENG"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
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
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{dept.code}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    {dept.name}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 max-w-md truncate">
                  {dept.description || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <Users className="h-3 w-3" />
                    {dept.employeeCount || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(dept)}
                    className="mr-2 p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {departments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No departments found. Create your first one!
          </div>
        )}
      </div>
    </div>
  );
}
