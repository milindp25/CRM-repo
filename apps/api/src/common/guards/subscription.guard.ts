import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@hrplatform/shared';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../services/cache.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // No user context (shouldn't happen after JwtAuthGuard, but safety check)
    if (!user) {
      return true;
    }

    // Super admin bypasses subscription checks
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Use cached company data (15s TTL) to avoid repeated DB queries
    const cacheKey = `guard:company:${user.companyId}`;
    const company = await this.cache.getOrSet(
      cacheKey,
      () =>
        this.prisma.company.findUnique({
          where: { id: user.companyId },
          select: {
            subscriptionStatus: true,
            subscriptionTier: true,
            trialEndsAt: true,
            isActive: true,
            featuresEnabled: true,
          },
        }),
      15_000,
    );

    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    // Store on request for downstream guards (FeatureGuard) to reuse
    request._companyContext = company;

    if (!company.isActive) {
      throw new ForbiddenException(
        'Your organization has been deactivated. Please contact support.',
      );
    }

    const status = company.subscriptionStatus;

    // Check if trial has expired
    if (
      status === 'TRIAL' &&
      company.trialEndsAt &&
      new Date() > new Date(company.trialEndsAt)
    ) {
      // Auto-expire the trial and invalidate cache
      await this.prisma.company.update({
        where: { id: user.companyId },
        data: { subscriptionStatus: 'EXPIRED' },
      });
      this.cache.invalidate(cacheKey);

      throw new ForbiddenException(
        'Your trial period has ended. Please subscribe to continue using the platform.',
      );
    }

    // Block access for expired/cancelled subscriptions
    if (status === 'EXPIRED' || status === 'CANCELLED') {
      throw new ForbiddenException(
        'Your subscription has expired. Please renew to continue using the platform.',
      );
    }

    if (status === 'SUSPENDED') {
      throw new ForbiddenException(
        'Your account has been suspended. Please contact support.',
      );
    }

    return true;
  }
}
