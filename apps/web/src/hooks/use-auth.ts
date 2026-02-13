'use client';

/**
 * Authentication Hook
 * Provides authentication state and methods
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@hrplatform/shared';
import {
  apiClient,
  ApiError,
  type LoginCredentials,
  type RegisterData,
  type AuthResponse,
} from '@/lib/api-client';

interface UseAuthResult {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials, remember?: boolean) => Promise<void>;
  register: (data: RegisterData, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

/**
 * useAuth Hook
 * Manages authentication state and operations
 */
export function useAuth(): UseAuthResult {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
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

        // Redirect to dashboard
        router.push('/dashboard');
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
      setUser(null);

      // Redirect to login
      router.push('/login');
    } catch (err) {
      // Clear user state even if logout request fails
      setUser(null);
      apiClient.clearTokens();
      router.push('/login');

      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  /**
   * Refresh user profile
   */
  const refreshUser = useCallback(async () => {
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
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };
}
