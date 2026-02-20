import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, TIER_FEATURES, SubscriptionTier } from '@hrplatform/shared';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../services/cache.service';
import { FEATURE_KEY } from '../decorators/feature.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No feature requirement - allow access
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // No user context - skip (public routes)
    if (!user) {
      return true;
    }

    // Super admin bypasses feature checks
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Reuse company context from SubscriptionGuard (stored on request)
    // This eliminates a redundant DB query since SubscriptionGuard already fetched it
    let company = request._companyContext;
    if (!company) {
      // Fallback: fetch from cache or DB (in case guard order changes)
      const cacheKey = `guard:company:${user.companyId}`;
      company = await this.cache.getOrSet(
        cacheKey,
        () =>
          this.prisma.company.findUnique({
            where: { id: user.companyId },
            select: {
              featuresEnabled: true,
              subscriptionTier: true,
              subscriptionStatus: true,
              trialEndsAt: true,
              isActive: true,
            },
          }),
        15_000,
      );
    }

    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    // Check 1: Explicit features enabled on company
    if (company.featuresEnabled && company.featuresEnabled.length > 0) {
      if (company.featuresEnabled.includes(requiredFeature)) {
        return true;
      }
    }

    // Check 2: Features from subscription tier
    const tier = company.subscriptionTier as SubscriptionTier;
    const tierFeatures = TIER_FEATURES[tier] ?? TIER_FEATURES[SubscriptionTier.FREE];

    if (tierFeatures.includes(requiredFeature as any)) {
      return true;
    }

    // Check 3: Active paid add-ons (cached per company+feature, 30s TTL)
    const addonCacheKey = `guard:addon:${user.companyId}:${requiredFeature}`;
    const hasAddon = await this.cache.getOrSet(
      addonCacheKey,
      async () => {
        const activeAddon = await this.prisma.companyAddon.findFirst({
          where: {
            companyId: user.companyId,
            status: 'ACTIVE',
            featureAddon: {
              feature: requiredFeature,
              isActive: true,
            },
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        });
        return !!activeAddon;
      },
      30_000,
    );

    if (hasAddon) {
      return true;
    }

    throw new ForbiddenException(
      `This feature is not available on your current plan. Please upgrade or purchase this add-on to access it.`,
    );
  }
}
