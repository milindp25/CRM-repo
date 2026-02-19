'use client';

import { useFeatures } from '@/contexts/feature-context';

interface FeatureGateProps {
  children: React.ReactNode;
  /** The feature that must be enabled */
  feature: string;
  /** What to render when feature is disabled. Defaults to nothing. */
  fallback?: React.ReactNode;
}

export function FeatureGate({ children, feature, fallback }: FeatureGateProps) {
  const { hasFeature, loading } = useFeatures();

  if (loading) return null;

  if (!hasFeature(feature)) {
    return <>{fallback ?? null}</>;
  }

  return <>{children}</>;
}
