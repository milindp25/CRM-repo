'use client';

import Link from 'next/link';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

interface FeatureUpgradePromptProps {
  featureName?: string;
  description?: string;
}

export function FeatureUpgradePrompt({ featureName, description }: FeatureUpgradePromptProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 mb-6">
        <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">
        {featureName || 'Feature'} is not available on your plan
      </h1>

      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        {description || 'Upgrade your subscription to unlock this feature and get access to more powerful tools for your team.'}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 h-10 px-6 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade Plan
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 h-10 px-6 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
        >
          Back to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
