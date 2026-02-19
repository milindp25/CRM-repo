import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AddonRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Feature Add-ons ────────────────────────────────────────────────

  async findAllAddons() {
    return this.prisma.featureAddon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { companyAddons: true } },
      },
    });
  }

  async findAddonById(id: string) {
    return this.prisma.featureAddon.findUnique({
      where: { id },
      include: {
        _count: { select: { companyAddons: true } },
      },
    });
  }

  async findAddonByFeature(feature: string) {
    return this.prisma.featureAddon.findUnique({
      where: { feature },
    });
  }

  async createAddon(data: {
    feature: string;
    name: string;
    description?: string;
    price: number;
    yearlyPrice?: number;
  }) {
    return this.prisma.featureAddon.create({
      data: {
        feature: data.feature,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        yearlyPrice: data.yearlyPrice ?? null,
      },
    });
  }

  async updateAddon(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      yearlyPrice?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.featureAddon.update({
      where: { id },
      data,
    });
  }

  async deleteAddon(id: string) {
    return this.prisma.featureAddon.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Company Add-ons ────────────────────────────────────────────────

  async findCompanyAddons(companyId: string) {
    return this.prisma.companyAddon.findMany({
      where: { companyId },
      include: {
        featureAddon: true,
      },
      orderBy: { activatedAt: 'desc' },
    });
  }

  async findCompanyAddon(companyId: string, featureAddonId: string) {
    return this.prisma.companyAddon.findUnique({
      where: {
        companyId_featureAddonId: { companyId, featureAddonId },
      },
    });
  }

  async activateAddonForCompany(data: {
    companyId: string;
    featureAddonId: string;
    expiresAt?: Date;
  }) {
    return this.prisma.companyAddon.upsert({
      where: {
        companyId_featureAddonId: {
          companyId: data.companyId,
          featureAddonId: data.featureAddonId,
        },
      },
      create: {
        companyId: data.companyId,
        featureAddonId: data.featureAddonId,
        status: 'ACTIVE',
        expiresAt: data.expiresAt ?? null,
      },
      update: {
        status: 'ACTIVE',
        activatedAt: new Date(),
        expiresAt: data.expiresAt ?? null,
      },
    });
  }

  async deactivateAddonForCompany(companyId: string, featureAddonId: string) {
    return this.prisma.companyAddon.update({
      where: {
        companyId_featureAddonId: { companyId, featureAddonId },
      },
      data: { status: 'CANCELLED' },
    });
  }
}
