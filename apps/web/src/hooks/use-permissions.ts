'use client';

import { useMemo, useCallback } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { Permission, UserRole, RolePermissions } from '@hrplatform/shared';

export function usePermissions() {
  const { user } = useAuthContext();

  const role = user?.role as UserRole | undefined;

  const permissions = useMemo(() => {
    if (!role) return [];
    return RolePermissions[role] ?? [];
  }, [role]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!role) return false;
      if (permissions.includes(Permission.ALL)) return true;
      return permissions.includes(permission);
    },
    [role, permissions],
  );

  const hasAnyPermission = useCallback(
    (perms: Permission[]): boolean => {
      return perms.some((p) => hasPermission(p));
    },
    [hasPermission],
  );

  const hasAllPermissions = useCallback(
    (perms: Permission[]): boolean => {
      return perms.every((p) => hasPermission(p));
    },
    [hasPermission],
  );

  const hasRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!role) return false;
      return roles.includes(role);
    },
    [role],
  );

  const isAtLeastRole = useCallback(
    (minimumRole: UserRole): boolean => {
      if (!role) return false;
      const hierarchy: UserRole[] = [
        UserRole.EMPLOYEE,
        UserRole.MANAGER,
        UserRole.HR_ADMIN,
        UserRole.COMPANY_ADMIN,
        UserRole.SUPER_ADMIN,
      ];
      const userLevel = hierarchy.indexOf(role);
      const requiredLevel = hierarchy.indexOf(minimumRole);
      return userLevel >= requiredLevel;
    },
    [role],
  );

  return {
    role,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAtLeastRole,
  };
}
