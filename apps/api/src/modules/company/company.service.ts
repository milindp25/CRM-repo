import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from './company.repository';
import { TIER_FEATURES, SubscriptionTier } from '@hrplatform/shared';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class CompanyService {
  constructor(
    private readonly repository: CompanyRepository,
    private readonly cache: CacheService,
  ) {}

  async getCompany(companyId: string) {
    return this.cache.getOrSet(`company:${companyId}`, async () => {
      const company = await this.repository.findById(companyId);
      if (!company) throw new NotFoundException('Company not found');
      return company;
    }, 120_000); // Company data rarely changes, cache 2 min
  }

  async getEnabledFeatures(companyId: string) {
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

    let baseFeatures: string[];
    let source: string;

    // If explicit features are set, use them
    if (company.featuresEnabled && company.featuresEnabled.length > 0) {
      baseFeatures = company.featuresEnabled as string[];
      source = 'custom';
    } else {
      // Otherwise derive from subscription tier
      const tier = company.subscriptionTier as SubscriptionTier;
      baseFeatures = [...(TIER_FEATURES[tier] ?? TIER_FEATURES[SubscriptionTier.FREE])];
      source = 'tier';
    }

    // Merge paid add-on features
    const addonFeatures = await this.repository.findActiveAddonFeatures(companyId);
    const allFeatures = [...new Set([...baseFeatures, ...addonFeatures])];

    return {
      features: allFeatures,
      source,
      ...(source === 'tier' && { tier: company.subscriptionTier }),
      ...(addonFeatures.length > 0 && { addons: addonFeatures }),
    };
  }

  async getSubscription(companyId: string) {
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

    return {
      tier: company.subscriptionTier,
      status: company.subscriptionStatus,
      trialEndsAt: company.trialEndsAt,
    };
  }

  async updateCompany(companyId: string, data: any) {
    this.cache.invalidate(`company:${companyId}`);
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    return this.repository.update(companyId, data);
  }

  async getOnboardingStatus(companyId: string) {
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    return {
      completed: company.onboardingCompleted,
      currentStep: company.onboardingStep,
    };
  }

  async updateOnboardingStep(companyId: string, step: number) {
    return this.repository.updateOnboarding(companyId, step, false);
  }

  async completeOnboarding(companyId: string) {
    return this.repository.updateOnboarding(companyId, 4, true);
  }
}
