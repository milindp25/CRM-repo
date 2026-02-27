import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest, ThrottlerLimitDetail } from '@nestjs/throttler';

/**
 * Custom throttler guard that applies per-API-key rate limits.
 *
 * For API key requests (M2M), the rate limit comes from the `rateLimit` field
 * on the ApiKey model (requests per hour). The tracker key is the API key ID
 * so each key has its own isolated quota.
 *
 * For normal JWT-authenticated or public requests, falls back to the
 * default ThrottlerGuard behavior (IP-based, using named configs).
 */
@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
  /**
   * Return the tracker key. For API key requests, use the apiKeyId
   * so each key gets its own rate-limit bucket.
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (req.user?.role === 'API_KEY' && req.user.apiKeyId) {
      return `api-key:${req.user.apiKeyId}`;
    }
    return super.getTracker(req);
  }

  /**
   * Override handleRequest to apply per-key limits for API key requests.
   * The ApiKey model stores `rateLimit` as requests/hour.
   * We convert that to a 1-hour TTL window.
   */
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    const req = context.switchToHttp().getRequest();

    if (req.user?.role === 'API_KEY' && req.user.apiKeyRateLimit) {
      requestProps.limit = req.user.apiKeyRateLimit;
      requestProps.ttl = 3600000; // 1 hour in milliseconds
    }

    return super.handleRequest(requestProps);
  }

  /**
   * Custom error message for API key rate limiting.
   */
  protected async getErrorMessage(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<string> {
    const req = context.switchToHttp().getRequest();

    if (req.user?.role === 'API_KEY') {
      return `API key rate limit exceeded. Limit: ${throttlerLimitDetail.limit} requests/hour. Try again later.`;
    }

    return super.getErrorMessage(context, throttlerLimitDetail);
  }
}
