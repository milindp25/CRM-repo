/**
 * Token Synchronization Utility
 *
 * Auth is now primarily handled via httpOnly cookies set by the API.
 * This utility manages:
 * 1. A `has_session` cookie for Next.js middleware route protection
 * 2. localStorage tokens as Bearer header fallback (for M2M or SSR)
 * 3. Refresh token in localStorage for client-side refresh attempts
 */

/**
 * Store access token in localStorage and set session cookie for middleware
 */
export function setToken(token: string, remember: boolean = true): void {
  if (typeof window === 'undefined') return;

  try {
    if (remember) {
      localStorage.setItem('access_token', token);
    } else {
      sessionStorage.setItem('access_token', token);
    }

    // Set a lightweight session flag cookie for Next.js middleware
    // (not the actual token - that's in httpOnly cookie from the API)
    const maxAge = remember ? 7 * 24 * 60 * 60 : undefined;
    document.cookie = `has_session=1; path=/; SameSite=Lax${maxAge ? `; max-age=${maxAge}` : ''}`;
  } catch (error) {
    console.error('Failed to set token:', error);
  }
}

/**
 * Store refresh token in localStorage for fallback refresh attempts
 */
export function setRefreshToken(token: string, remember: boolean = true): void {
  if (typeof window === 'undefined') return;

  try {
    if (remember) {
      localStorage.setItem('refresh_token', token);
    } else {
      sessionStorage.setItem('refresh_token', token);
    }
  } catch (error) {
    console.error('Failed to set refresh token:', error);
  }
}

/**
 * Get access token from localStorage/sessionStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem('access_token')
      || sessionStorage.getItem('access_token')
      || null;
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
}

/**
 * Clear all tokens and session cookies
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');

    // Clear session flag cookie
    document.cookie = 'has_session=; path=/; max-age=0';
    // Clear legacy cookies if they exist
    document.cookie = 'access_token=; path=/; max-age=0';
    document.cookie = 'refresh_token=; path=/; max-age=0';
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

/**
 * Initialize token sync on app startup
 */
export function initTokenSync(): void {
  if (typeof window === 'undefined') return;

  const token = getToken();
  if (token) {
    const isInLocalStorage = !!localStorage.getItem('access_token');
    setToken(token, isInLocalStorage);
  }
}
