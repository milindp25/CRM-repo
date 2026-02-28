'use client';

import { useState, useEffect } from 'react';
import { apiClient, type CompanyUser } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { usePermissions } from '@/hooks/use-permissions';
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
  EMPLOYEE: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
};

const ASSIGNABLE_ROLES = ['COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'];

export default function UsersPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState<Record<string, string>>({});
  const { hasPermission } = usePermissions();

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<CompanyUser | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EMPLOYEE');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);
    try {
      await apiClient.createInvitation({ email: inviteEmail, role: inviteRole });
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('EMPLOYEE');
      fetchUsers();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDelete = async (user: CompanyUser) => {
    setActionLoading(user.id + '-delete');
    try {
      await apiClient.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showSuccess(user.id, 'User deleted');
      setDeleteConfirm(null);
    } catch (err: any) {
      showError(user.id, err.message || 'Failed to delete user');
      setDeleteConfirm(null);
    } finally {
      setActionLoading(null);
    }
  };

  const resetInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteRole('EMPLOYEE');
    setInviteError('');
    setInviteSuccess('');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <RoleGate requiredPermissions={[Permission.VIEW_USERS, Permission.MANAGE_USERS]}>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage team members, roles, and access</p>
          </div>
          {hasPermission(Permission.MANAGE_USERS) && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite User
            </button>
          )}
        </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </div>
                      {user.phone && (
                        <div className="text-xs text-muted-foreground">{user.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[user.role] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
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
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Role change dropdown */}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={actionLoading === user.id + '-role'}
                          className="text-sm border border-border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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

                        {/* Delete button (COMPANY_ADMIN with DELETE_USERS) */}
                        {hasPermission(Permission.DELETE_USERS) && (
                          <button
                            onClick={() => setDeleteConfirm(user)}
                            disabled={!!actionLoading}
                            className="text-sm px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 font-medium disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
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

        <div className="px-4 py-3 border-t text-sm text-muted-foreground">
          {users.length} user{users.length !== 1 ? 's' : ''} in your company
        </div>
      </div>
      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={resetInviteModal}>
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md mx-4 border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Invite User</h2>
              <button onClick={resetInviteModal} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  {inviteSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-card text-foreground"
                  placeholder="user@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-card text-foreground"
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetInviteModal}
                  className="flex-1 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 border border-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete User</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Are you sure you want to delete <strong className="text-foreground">{deleteConfirm.firstName} {deleteConfirm.lastName}</strong>?
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {deleteConfirm.email} &middot; {ROLE_LABELS[deleteConfirm.role] || deleteConfirm.role}
            </p>
            <p className="text-xs text-red-600 mb-4">This action cannot be easily undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm.id + '-delete'}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {actionLoading === deleteConfirm.id + '-delete' ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RoleGate>
  );
}
