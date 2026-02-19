import { SubscriptionTier } from '../enums/status.enum';

export interface TierLimits {
  maxEmployees: number;
  maxUsers: number;
  maxDepartments: number;
}

/** Resource limits per subscription tier */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  [SubscriptionTier.FREE]: {
    maxEmployees: 10,
    maxUsers: 5,
    maxDepartments: 5,
  },
  [SubscriptionTier.BASIC]: {
    maxEmployees: 50,
    maxUsers: 20,
    maxDepartments: 20,
  },
  [SubscriptionTier.PROFESSIONAL]: {
    maxEmployees: 200,
    maxUsers: 50,
    maxDepartments: 50,
  },
  [SubscriptionTier.ENTERPRISE]: {
    maxEmployees: Infinity,
    maxUsers: Infinity,
    maxDepartments: Infinity,
  },
};

/** Human-readable tier labels */
export const TIER_LABELS: Record<SubscriptionTier, string> = {
  [SubscriptionTier.FREE]: 'Free',
  [SubscriptionTier.BASIC]: 'Basic',
  [SubscriptionTier.PROFESSIONAL]: 'Professional',
  [SubscriptionTier.ENTERPRISE]: 'Enterprise',
};
