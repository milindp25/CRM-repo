'use client';

import { useState, useEffect } from 'react';
import { apiClient, type CompanyUser } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  HR_ADMIN: 'HR Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  COMPANY_ADMIN: 'bg-purple-100 text-purple-800',
  HR_ADMIN: 'bg-blue-100 text-blue-800',
  MANAGER: 'bg-indigo-100 text-indigo-800',
  EMPLOYEE: 'bg-gray-100 text-gray-700',
};

const ASSIGNABLE_ROLES = ['COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'];

export default function UsersPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (userId: string, msg: string) => {
    setActionSuccess(prev => ({ ...prev, [userId]: msg }));
    setTimeout(() => setActionSuccess(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    }), 3000);
  };

  const showError = (userId: string, msg: string) => {
    setActionError(prev => ({ ...prev, [userId]: msg }));
    setTimeout(() => setActionError(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    }), 4000);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading(userId + '-role');
    try {
      const updated = await apiClient.updateUserRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
      showSuccess(userId, 'Role updated');
    } catch (err: any) {
      showError(userId, err.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (user: CompanyUser) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    setActionLoading(user.id + '-active');
    try {
      const updated = user.isActive
        ? await apiClient.deactivateUser(user.id)
        : await apiClient.activateUser(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: updated.isActive } : u));
      showSuccess(user.id, user.isActive ? 'User deactivated' : 'User activated');
    } catch (err: any) {
      showError(user.id, err.message || `Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <RoleGate requiredPermissions={[Permission.VIEW_USERS, Permission.MANAGE_USERS]}>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage team members, roles, and access</p>
        </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      {user.phone && (
                        <div className="text-xs text-gray-500">{user.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Role change dropdown */}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={actionLoading === user.id + '-role'}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {ASSIGNABLE_ROLES.map(role => (
                            <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                          ))}
                        </select>

                        {/* Activate/Deactivate button */}
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={actionLoading === user.id + '-active'}
                          className={`text-sm px-3 py-1 rounded border font-medium disabled:opacity-50 ${
                            user.isActive
                              ? 'border-red-300 text-red-600 hover:bg-red-50'
                              : 'border-green-300 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {actionLoading === user.id + '-active'
                            ? '...'
                            : user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>

                      {/* Feedback messages */}
                      {actionSuccess[user.id] && (
                        <p className="text-xs text-green-600 mt-1">{actionSuccess[user.id]}</p>
                      )}
                      {actionError[user.id] && (
                        <p className="text-xs text-red-600 mt-1">{actionError[user.id]}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t text-sm text-gray-500">
          {users.length} user{users.length !== 1 ? 's' : ''} in your company
        </div>
      </div>
    </div>
    </RoleGate>
  );
}
