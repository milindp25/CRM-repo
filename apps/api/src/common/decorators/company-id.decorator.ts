import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract company ID from current user
 * Usage: @CompanyId() companyId: string
 */
export const CompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.companyId;
  },
);
