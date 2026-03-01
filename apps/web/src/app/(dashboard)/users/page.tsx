'use client';

import { useState, useEffect } from 'react';
import { apiClient, type CompanyUser } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { usePermissions } from '@/hooks/use-permissions';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import {
  UserPlus, Users, UserCheck, UserX, Shield,
  Trash2, ToggleLeft, ToggleRight, Mail, Loader2,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  HR_ADMIN: 'HR Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

const ROLE_VARIANT: Record<string, string> = {
  SUPER_ADMIN: 'error',
  COMPANY_ADMIN: 'purple',
  HR_ADMIN: 'info',
  MANAGER: 'cyan',
  EMPLOYEE: 'neutral',
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

  const showSuccessMsg = (userId: string, msg: string) => {
    setActionSuccess(prev => ({ ...prev, [userId]: msg }));
    setTimeout(() => setActionSuccess(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    }), 3000);
  };

  const showErrorMsg = (userId: string, msg: string) => {
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
      showSuccessMsg(userId, 'Role updated');
    } catch (err: any) {
      showErrorMsg(userId, err.message || 'Failed to update role');
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
      showSuccessMsg(user.id, user.isActive ? 'User deactivated' : 'User activated');
    } catch (err: any) {
      showErrorMsg(user.id, err.message || `Failed to ${action} user`);
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
      showSuccessMsg(user.id, 'User deleted');
      setDeleteConfirm(null);
    } catch (err: any) {
      showErrorMsg(user.id, err.message || 'Failed to delete user');
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

  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  return (
    <RoleGate requiredPermissions={[Permission.VIEW_USERS, Permission.MANAGE_USERS]}>
      <PageContainer
        title="User Accounts"
        description="Manage who has access and what they can do"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'User Accounts' },
        ]}
        actions={
          hasPermission(Permission.MANAGE_USERS) ? (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Invite User
            </button>
          ) : undefined
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Users" value={users.length} icon={Users} iconColor="blue" loading={loading} />
          <StatCard title="Active Users" value={activeCount} icon={UserCheck} iconColor="green" loading={loading} />
          <StatCard title="Inactive Users" value={inactiveCount} icon={UserX} iconColor="amber" loading={loading} />
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} onRetry={fetchUsers} onDismiss={() => setError('')} />}

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {loading ? (
            <TableLoader rows={6} cols={6} />
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No users found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Invite team members to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Login</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm text-foreground">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-muted-foreground">{user.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={(ROLE_VARIANT[user.role] || 'neutral') as any}>
                          {ROLE_LABELS[user.role] || user.role}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={user.isActive ? 'success' : 'neutral'} dot>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.lastLoginAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Role change dropdown */}
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={actionLoading === user.id + '-role'}
                            className="h-8 px-2 border border-input bg-background text-foreground rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50"
                          >
                            {ASSIGNABLE_ROLES.map(role => (
                              <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                            ))}
                          </select>

                          {/* Activate/Deactivate button */}
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={actionLoading === user.id + '-active'}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            {actionLoading === user.id + '-active' ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : user.isActive ? (
                              <><ToggleRight className="h-3 w-3" /> Deactivate</>
                            ) : (
                              <><ToggleLeft className="h-3 w-3" /> Activate</>
                            )}
                          </button>

                          {/* Delete button */}
                          {hasPermission(Permission.DELETE_USERS) && (
                            <button
                              onClick={() => setDeleteConfirm(user)}
                              disabled={!!actionLoading}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          )}
                        </div>

                        {/* Feedback messages */}
                        {actionSuccess[user.id] && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{actionSuccess[user.id]}</p>
                        )}
                        {actionError[user.id] && (
                          <p className="text-xs text-destructive mt-1">{actionError[user.id]}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="px-4 py-3 border-t text-sm text-muted-foreground">
              {users.length} user{users.length !== 1 ? 's' : ''} in your company
            </div>
          )}
        </div>

        {/* Invite User Modal */}
        <Modal open={showInviteModal} onClose={resetInviteModal} size="sm">
          <ModalHeader onClose={resetInviteModal}>Invite User</ModalHeader>
          <form onSubmit={handleInvite}>
            <ModalBody className="space-y-4">
              {inviteError && (
                <ErrorBanner message={inviteError} onDismiss={() => setInviteError('')} />
              )}
              {inviteSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 text-sm text-green-700 dark:text-green-300">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  {inviteSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="user@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
            </ModalBody>
            <ModalFooter>
              <button
                type="button"
                onClick={resetInviteModal}
                className="h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviteLoading}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </ModalFooter>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} size="sm">
          <ModalHeader onClose={() => setDeleteConfirm(null)}>Delete User</ModalHeader>
          <ModalBody>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-foreground">
                  Are you sure you want to delete <strong>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong>?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {deleteConfirm?.email} &middot; {ROLE_LABELS[deleteConfirm?.role || ''] || deleteConfirm?.role}
                </p>
                <p className="text-xs text-destructive mt-2">This action cannot be easily undone.</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={!!deleteConfirm && actionLoading === deleteConfirm.id + '-delete'}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {deleteConfirm && actionLoading === deleteConfirm.id + '-delete' && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {deleteConfirm && actionLoading === deleteConfirm.id + '-delete' ? 'Deleting...' : 'Delete User'}
            </button>
          </ModalFooter>
        </Modal>
      </PageContainer>
    </RoleGate>
  );
}
