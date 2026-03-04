import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Extract the Express request from either an HTTP or GraphQL execution context.
 * Use this in guards and decorators instead of context.switchToHttp().getRequest().
 */
export function getRequestFromContext(context: ExecutionContext): any {
  const contextType = context.getType<string>();
  if (contextType === 'graphql') {
    return GqlExecutionContext.create(context).getContext().req;
  }
  return context.switchToHttp().getRequest();
}
