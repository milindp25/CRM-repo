import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

/**
 * JWT Authentication Guard
 * Protects routes unless marked with @Public() decorator.
 * Works for both REST and GraphQL contexts.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Call parent guard to validate JWT
    return super.canActivate(context);
  }

  /**
   * Override getRequest so Passport can extract JWT from GraphQL context.
   * Passport's AuthGuard internally calls this to find the request object.
   */
  getRequest(context: ExecutionContext) {
    const contextType = context.getType<string>();
    if (contextType === 'graphql') {
      return GqlExecutionContext.create(context).getContext().req;
    }
    return context.switchToHttp().getRequest();
  }
}
