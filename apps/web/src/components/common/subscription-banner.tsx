'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { AlertTriangle, Clock, X } from 'lucide-react';

interface SubscriptionInfo {
  tier: string;
  status: string;
  trialEndsAt: string | null;
}

export function SubscriptionBanner() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    apiClient
      .get<SubscriptionInfo>('/company/subscription')
      .then(setSubscription)
      .catch(() => {});
  }, []);

  const bannerContent = useMemo(() => {
    if (!subscription || dismissed) return null;

    if (subscription.status === 'TRIAL' && subscription.trialEndsAt) {
      const daysLeft = Math.max(
        0,
        Math.ceil(
          (new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      );

      if (daysLeft <= 7) {
        return {
          icon: Clock,
          message: `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade to keep access to all features.`,
          type: daysLeft <= 3 ? 'warning' : 'info',
          dismissable: true,
        };
      }
    }

    if (subscription.status === 'EXPIRED') {
      return {
        icon: AlertTriangle,
        message: 'Your subscription has expired. Please upgrade to continue using the platform.',
        type: 'error',
        dismissable: false,
      };
    }

    if (subscription.status === 'SUSPENDED') {
      return {
        icon: AlertTriangle,
        message: 'Your account has been suspended. Please contact support.',
        type: 'error',
        dismissable: false,
      };
    }

    return null;
  }, [subscription, dismissed]);

  if (!bannerContent) return null;

  const colorMap = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const Icon = bannerContent.icon;

  return (
    <div className={`border-b px-4 py-3 flex items-center justify-between ${colorMap[bannerContent.type as keyof typeof colorMap]}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">{bannerContent.message}</span>
      </div>
      {bannerContent.dismissable && (
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-black/5 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
