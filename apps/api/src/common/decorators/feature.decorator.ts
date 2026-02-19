import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'required_feature';

/**
 * Require a specific feature to be enabled for the company.
 * Usage: @RequireFeature('PAYROLL')
 */
export const RequireFeature = (feature: string) =>
  SetMetadata(FEATURE_KEY, feature);
