/**
 * Token Synchronization Utility
 * Syncs tokens between localStorage and cookies
 * Cookies are needed for middleware, localStorage for API client
 */

/**
 * Set token in both localStorage and cookie
 */
export function setToken(token: string, remember: boolean = true): void {
  if (typeof window === 'undefined') return;

  try {
    // Store in localStorage/sessionStorage
    if (remember) {
      localStorage.setItem('access_token', token);
    } else {
      sessionStorage.setItem('access_token', token);
    }

    // Store in cookie (for middleware)
    const maxAge = remember ? 7 * 24 * 60 * 60 : undefined; // 7 days or session
    document.cookie = `access_token=${token}; path=/; SameSite=Lax${maxAge ? `; max-age=${maxAge}` : ''}`;
  } catch (error) {
    console.error('Failed to set token:', error);
  }
}

/**
 * Set refresh token
 */
export function setRefreshToken(token: string, remember: boolean = true): void {
  if (typeof window === 'undefined') return;

  try {
    // Store in localStorage/sessionStorage
    if (remember) {
      localStorage.setItem('refresh_token', token);
    } else {
      sessionStorage.setItem('refresh_token', token);
    }

    // Store in cookie
    const maxAge = remember ? 30 * 24 * 60 * 60 : undefined; // 30 days or session
    document.cookie = `refresh_token=${token}; path=/; SameSite=Lax${maxAge ? `; max-age=${maxAge}` : ''}`;
  } catch (error) {
    console.error('Failed to set refresh token:', error);
  }
}

/**
 * Get token from localStorage/sessionStorage or cookie
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // Try localStorage first
    const localToken = localStorage.getItem('access_token');
    if (localToken) return localToken;

    // Try sessionStorage
    const sessionToken = sessionStorage.getItem('access_token');
    if (sessionToken) return sessionToken;

    // Try cookie as fallback
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'access_token') {
        return value;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
}

/**
 * Clear all tokens
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear from storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');

    // Clear cookies
    document.cookie = 'access_token=; path=/; max-age=0';
    document.cookie = 'refresh_token=; path=/; max-age=0';
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

/**
 * Initialize token sync
 * Call this on app initialization to sync localStorage/sessionStorage to cookies
 */
export function initTokenSync(): void {
  if (typeof window === 'undefined') return;

  const token = getToken();
  if (token) {
    // Re-set token to ensure cookie is set
    const isInLocalStorage = !!localStorage.getItem('access_token');
    setToken(token, isInLocalStorage);
  }

  const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  if (refreshToken) {
    const isInLocalStorage = !!localStorage.getItem('refresh_token');
    setRefreshToken(refreshToken, isInLocalStorage);
  }
}
