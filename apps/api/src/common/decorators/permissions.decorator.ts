import { SetMetadata } from '@nestjs/common';
import { Permission } from '@hrplatform/shared';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Require specific permissions to access route.
 * User must have ANY of the listed permissions.
 * Usage: @RequirePermissions(Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES)
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
