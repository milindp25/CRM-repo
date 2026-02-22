import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { IndianTaxEngine } from './indian-tax.engine';
import { USTaxEngine } from './us-tax.engine';
import type { TaxEngine } from './tax-engine.interface';

/**
 * Tax Engine Factory
 *
 * Selects the correct tax engine based on company's payrollCountry.
 * Loads tax configuration from DB with TTL cache.
 */
@Injectable()
export class TaxEngineFactory {
  private readonly logger = new Logger(TaxEngineFactory.name);

  // Cache: country → { configs, loadedAt }
  private configCache = new Map<
    string,
    { configs: Record<string, any>; loadedAt: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly indianEngine: IndianTaxEngine,
    private readonly usEngine: USTaxEngine,
  ) {}

  /**
   * Get the tax engine for a given country.
   * Loads and caches tax configuration from DB.
   */
  async getEngine(country: 'IN' | 'US'): Promise<TaxEngine> {
    // Load/refresh tax config from DB
    await this.loadConfig(country);

    if (country === 'US') {
      return this.usEngine;
    }
    return this.indianEngine;
  }

  /**
   * Load tax configuration from TaxConfiguration table.
   * Cached with TTL to avoid hitting DB on every payroll computation.
   */
  private async loadConfig(country: string): Promise<void> {
    const cached = this.configCache.get(country);
    if (cached && Date.now() - cached.loadedAt < this.CACHE_TTL) {
      return; // Cache is fresh
    }

    try {
      const currentDate = new Date();
      const configs = await this.prisma.taxConfiguration.findMany({
        where: {
          country,
          isActive: true,
          effectiveFrom: { lte: currentDate },
          effectiveTo: { gte: currentDate },
          companyId: null, // Global defaults only (company overrides can be added later)
        },
      });

      const configMap: Record<string, any> = {};
      for (const config of configs) {
        configMap[config.configKey] = config.configValue;
      }

      // Apply config to the appropriate engine
      if (country === 'IN') {
        this.indianEngine.setConfig(configMap);
      } else if (country === 'US') {
        this.usEngine.setConfig(configMap);
      }

      this.configCache.set(country, {
        configs: configMap,
        loadedAt: Date.now(),
      });

      this.logger.log(
        `Tax config loaded for ${country}: ${configs.length} configurations`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to load tax config for ${country}, using defaults: ${error.message}`,
      );
      // Engine will use its hardcoded defaults — graceful degradation
    }
  }

  /**
   * Invalidate cache (e.g., when admin updates tax config)
   */
  invalidateCache(country?: string) {
    if (country) {
      this.configCache.delete(country);
    } else {
      this.configCache.clear();
    }
  }
}
