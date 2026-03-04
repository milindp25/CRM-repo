'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from './auth-context';
import { apiClient } from '@/lib/api-client';

interface FeatureContextValue {
  features: string[];
  loading: boolean;
  hasFeature: (feature: string) => boolean;
  refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextValue | undefined>(undefined);

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = useCallback(async (bypassCache = false) => {
    if (!isAuthenticated) {
      setFeatures([]);
      setLoading(false);
      return;
    }

    try {
      // Check sessionStorage cache (5-minute TTL) to avoid redundant API calls
      if (!bypassCache && typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('cached_features');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setFeatures(data);
            setLoading(false);
            return;
          }
        }
      }

      const response = await apiClient.get<{ features: string[] }>('/company/features');
      const featureList = response.features || [];
      setFeatures(featureList);

      // Cache in sessionStorage (clears on tab close)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cached_features', JSON.stringify({
          data: featureList,
          timestamp: Date.now(),
        }));
      }
    } catch {
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const hasFeature = useCallback(
    (feature: string): boolean => {
      return features.includes(feature);
    },
    [features],
  );

  const value = useMemo(
    () => ({
      features,
      loading,
      hasFeature,
      refreshFeatures: () => fetchFeatures(true),
    }),
    [features, loading, hasFeature, fetchFeatures],
  );

  return <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>;
}

export function useFeatures(): FeatureContextValue {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
}
