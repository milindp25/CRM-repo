import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@hrplatform/shared';

/**
 * Extract current user from request
 * Usage: @CurrentUser() user: JwtPayload
 * Usage: @CurrentUser('userId') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    return data ? user?.[data] : user;
  },
);
