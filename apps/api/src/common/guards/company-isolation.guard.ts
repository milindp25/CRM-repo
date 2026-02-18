import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@hrplatform/shared';

/**
 * Ensures users can only access their own company data (multi-tenancy)
 */
@Injectable()
export class CompanyIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;
    const query = request.query;
    const body = request.body;

    // Super admin can access all companies
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

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
