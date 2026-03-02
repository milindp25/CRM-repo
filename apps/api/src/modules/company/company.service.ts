import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from './company.repository';
import { TIER_FEATURES, SubscriptionTier } from '@hrplatform/shared';
import { CacheService } from '../../common/services/cache.service';
import { StorageService } from '../../common/services/storage.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CompanyService {
  constructor(
    private readonly repository: CompanyRepository,
    private readonly cache: CacheService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
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

  async getUserOnboardingStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { completed: user.onboardingCompleted };
  }

  async completeUserOnboarding(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
    return { completed: true };
  }

  async uploadLogo(companyId: string, file: Express.Multer.File) {
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

    // Delete old logo if exists
    if (company.logoUrl) {
      try {
        await this.storageService.delete(company.logoUrl);
      } catch {
        // Ignore deletion errors for old file
      }
    }

    const result = await this.storageService.upload(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      companyId,
      'logos',
    );

    // Update company record with logo path
    await this.repository.update(companyId, { logoUrl: result.filePath });
    this.cache.invalidate(`company:${companyId}`);

    return { logoUrl: result.filePath };
  }
}
