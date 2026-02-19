import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AddonRepository } from './addon.repository.js';

@Injectable()
export class AddonService {
  constructor(private readonly repository: AddonRepository) {}

  // ── Feature Add-ons CRUD ───────────────────────────────────────────

  async listAddons() {
    return this.repository.findAllAddons();
  }

  async getAddon(id: string) {
    const addon = await this.repository.findAddonById(id);
    if (!addon) {
      throw new NotFoundException('Add-on not found');
    }
    return addon;
  }

  async createAddon(data: {
    feature: string;
    name: string;
    description?: string;
    price: number;
    yearlyPrice?: number;
  }) {
    // Check if feature already has an add-on
    const existing = await this.repository.findAddonByFeature(data.feature);
    if (existing) {
      throw new ConflictException(`Add-on for feature "${data.feature}" already exists`);
    }

    return this.repository.createAddon(data);
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
    const addon = await this.repository.findAddonById(id);
    if (!addon) {
      throw new NotFoundException('Add-on not found');
    }
    return this.repository.updateAddon(id, data);
  }

  async deactivateAddon(id: string) {
    const addon = await this.repository.findAddonById(id);
    if (!addon) {
      throw new NotFoundException('Add-on not found');
    }
    return this.repository.deleteAddon(id);
  }

  // ── Company Add-on Management ─────────────────────────────────────

  async getCompanyAddons(companyId: string) {
    return this.repository.findCompanyAddons(companyId);
  }

  async activateAddonForCompany(
    companyId: string,
    featureAddonId: string,
    expiresAt?: string,
  ) {
    const addon = await this.repository.findAddonById(featureAddonId);
    if (!addon) {
      throw new NotFoundException('Add-on not found');
    }
    if (!addon.isActive) {
      throw new ConflictException('This add-on is no longer available');
    }

    return this.repository.activateAddonForCompany({
      companyId,
      featureAddonId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
  }

  async deactivateAddonForCompany(companyId: string, featureAddonId: string) {
    const companyAddon = await this.repository.findCompanyAddon(companyId, featureAddonId);
    if (!companyAddon) {
      throw new NotFoundException('Company does not have this add-on');
    }

    return this.repository.deactivateAddonForCompany(companyId, featureAddonId);
  }
}
