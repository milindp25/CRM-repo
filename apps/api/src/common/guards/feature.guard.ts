import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, TIER_FEATURES, SubscriptionTier } from '@hrplatform/shared';
import { PrismaService } from '../../database/prisma.service';
import { FEATURE_KEY } from '../decorators/feature.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
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

    const { user } = context.switchToHttp().getRequest();

    // Super admin bypasses feature checks
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: { featuresEnabled: true, subscriptionTier: true },
    });

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

    // Check 3: Active paid add-ons for the company
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

    if (activeAddon) {
      return true;
    }

    throw new ForbiddenException(
      `This feature is not available on your current plan. Please upgrade or purchase this add-on to access it.`,
    );
  }
}
