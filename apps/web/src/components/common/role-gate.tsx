'use client';

import type { ReactNode } from 'react';
import { Permission, UserRole } from '@hrplatform/shared';
import { usePermissions } from '@/hooks/use-permissions';
import { AccessDenied } from './access-denied';

interface RoleGateProps {
  children: ReactNode;
  /** User must have ANY of these permissions */
  requiredPermissions?: Permission[];
  /** User must have ANY of these roles */
  requiredRoles?: UserRole[];
  /** What to render when access is denied. Defaults to <AccessDenied /> */
  fallback?: ReactNode;
  /** If true, renders nothing instead of the fallback */
  hideOnly?: boolean;
}

export function RoleGate({
  children,
  requiredPermissions,
  requiredRoles,
  fallback,
  hideOnly = false,
}: RoleGateProps) {
  const { hasAnyPermission, hasRole } = usePermissions();

  let hasAccess = true;

  if (requiredPermissions && requiredPermissions.length > 0) {
    hasAccess = hasAnyPermission(requiredPermissions);
  }

  if (hasAccess && requiredRoles && requiredRoles.length > 0) {
    hasAccess = hasRole(requiredRoles);
  }

  if (!hasAccess) {
    if (hideOnly) return null;
    return <>{fallback ?? <AccessDenied />}</>;
  }

  return <>{children}</>;
}
