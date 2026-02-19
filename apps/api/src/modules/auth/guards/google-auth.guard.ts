import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Authentication Guard
 * Triggers the Google OAuth2 flow via Passport
 *
 * Used on:
 * - GET /auth/google (initiates redirect to Google)
 * - GET /auth/google/callback (handles the callback)
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  /**
   * Override to pass custom options to the Google strategy
   * Extracts companyId from query params and passes it as state
   */
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const companyId = request.query?.companyId;

    // Encode companyId in the state parameter so it survives the OAuth redirect
    const state = companyId
      ? Buffer.from(JSON.stringify({ companyId })).toString('base64')
      : undefined;

    return {
      state,
      scope: ['email', 'profile'],
    };
  }
}
