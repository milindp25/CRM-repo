import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache service
 * Avoids repeated DB roundtrips to remote Supabase (~500ms per query)
 * TTL-based expiration, per-key storage
 */
@Injectable()
export class CacheService {
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly logger = new Logger(CacheService.name);
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Get cached value or execute factory and cache the result
   * @param key Cache key
   * @param factory Async function to generate value if cache miss
   * @param ttlMs Time-to-live in milliseconds (default: 30s)
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs: number = 30_000): Promise<T> {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data as T;
    }

    const data = await factory();
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    return data;
  }

  /**
   * Get cached value (returns undefined on miss)
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data as T;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return undefined;
  }

  /**
   * Set a cache entry
   */
  set<T>(key: string, data: T, ttlMs: number = 30_000): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Invalidate a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
