import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@hrplatform/shared';
import { getRequestFromContext } from '../utils/get-request';

/**
 * Extract current user from request (works for both REST and GraphQL)
 * Usage: @CurrentUser() user: JwtPayload
 * Usage: @CurrentUser('userId') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = getRequestFromContext(ctx);
    const user = request.user as JwtPayload;

    return data ? user?.[data] : user;
  },
);
