import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from './company.repository';
import { TIER_FEATURES, SubscriptionTier } from '@hrplatform/shared';

@Injectable()
export class CompanyService {
  constructor(private readonly repository: CompanyRepository) {}

  async getCompany(companyId: string) {
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async getEnabledFeatures(companyId: string) {
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

    // If explicit features are set, use them
    if (company.featuresEnabled && company.featuresEnabled.length > 0) {
      return { features: company.featuresEnabled, source: 'custom' };
    }

    // Otherwise derive from subscription tier
    const tier = company.subscriptionTier as SubscriptionTier;
    const features = TIER_FEATURES[tier] ?? TIER_FEATURES[SubscriptionTier.FREE];
    return { features, source: 'tier', tier: company.subscriptionTier };
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
