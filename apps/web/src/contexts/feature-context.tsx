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

  const fetchFeatures = useCallback(async () => {
    if (!isAuthenticated) {
      setFeatures([]);
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get<{ features: string[] }>('/company/features');
      setFeatures(response.features || []);
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
      refreshFeatures: fetchFeatures,
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
