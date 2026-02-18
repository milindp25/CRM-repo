import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@hrplatform/shared';

export const ROLES_KEY = 'roles';

/**
 * Require specific roles to access route
 * Usage: @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
