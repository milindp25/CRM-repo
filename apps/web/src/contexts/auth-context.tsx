'use client';

/**
 * Auth Context Provider
 * Provides global authentication state using React Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@hrplatform/shared';
import {
  apiClient,
  ApiError,
  type LoginCredentials,
  type RegisterData,
  type AuthResponse,
} from '@/lib/api-client';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials, remember?: boolean) => Promise<void>;
  register: (data: RegisterData, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 * Wraps the app to provide authentication state
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Initialize auth state
   * Check if user has valid token and fetch profile
   */
  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      const token = apiClient.getAccessToken();

      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const profile = await apiClient.getProfile();
        if (!cancelled) setUser(profile);
      } catch (err) {
        // Token invalid or expired
        if (!cancelled) {
          apiClient.clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initAuth();
    return () => { cancelled = true; };
  }, []);

  /**
   * Login user
   */
  const login = useCallback(
    async (credentials: LoginCredentials, remember: boolean = true) => {
      setLoading(true);
      setError(null);

      try {
        const response: AuthResponse = await apiClient.login(credentials, remember);
        setUser(response.user);

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Login failed. Please try again.');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  /**
   * Register new user
   */
  const register = useCallback(
    async (data: RegisterData, remember: boolean = true) => {
      setLoading(true);
      setError(null);

      try {
        const response: AuthResponse = await apiClient.register(data, remember);
        setUser(response.user);

        // Redirect to onboarding wizard for new registrations
        router.push('/onboarding');
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Registration failed. Please try again.');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.logout();
    } catch (err) {
      // Log error but continue with logout
      console.error('Logout error:', err);
    } finally {
      // Always clear user state and tokens
      setUser(null);
      apiClient.clearTokens();
      setLoading(false);

      // Redirect to login
      router.push('/login');
    }
  }, [router]);

  /**
   * Refresh user profile
   */
  const refreshUser = useCallback(async () => {
    if (!apiClient.getAccessToken()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profile = await apiClient.getProfile();
      setUser(profile);
    } catch (err) {
      if (err instanceof ApiError) {
        // If unauthorized, clear tokens and redirect
        if (err.statusCode === 401) {
          apiClient.clearTokens();
          setUser(null);
          router.push('/login');
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuthContext Hook
 * Access authentication context
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
