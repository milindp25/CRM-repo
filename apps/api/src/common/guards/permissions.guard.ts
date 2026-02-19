import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, UserRole, RolePermissions } from '@hrplatform/shared';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required - allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userRole = user.role as UserRole;

    // Get permissions for this role
    const rolePermissions = RolePermissions[userRole] ?? [];

    // ALL permission grants access to everything
    if (rolePermissions.includes(Permission.ALL)) {
      return true;
    }

    // Check if user has ANY of the required permissions
    return requiredPermissions.some((perm) => rolePermissions.includes(perm));
  }
}
