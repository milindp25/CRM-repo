import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@hrplatform/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Ensures users can only access their own company data (multi-tenancy)
 */
@Injectable()
export class CompanyIsolationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No user context (shouldn't happen after JwtAuthGuard, but safety check)
    if (!user) {
      return true;
    }

    // Super admin can access all companies
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const params = request.params || {};
    const query = request.query || {};
    const body = request.body || {};

    // Check if request contains companyId
    const requestCompanyId =
      params.companyId || query.companyId || body.companyId;

    // If no companyId in request, use user's companyId (allow)
    if (!requestCompanyId) {
      return true;
    }

    // Ensure user can only access their own company data
    if (requestCompanyId !== user.companyId) {
      throw new ForbiddenException('Access denied to this company data');
    }

    return true;
  }
}
