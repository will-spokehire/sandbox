/**
 * Cache Service
 * 
 * Centralized caching service for API data.
 * Provides in-memory caching with TTL support.
 * 
 * TODO: Consider upgrading to Redis/Upstash for production scalability
 */

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private static instance: CacheService;

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get value from cache
   * Returns null if key doesn't exist or has expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, value: T, ttl: number): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate cache entries by pattern
   * Example: invalidateByPattern('vehicle:') removes all vehicle-related caches
   */
  invalidateByPattern(pattern: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      const isExpired = now - entry.timestamp > entry.ttl;
      if (isExpired) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      const isExpired = now - entry.timestamp > entry.ttl;
      if (isExpired) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Cache key builders for consistency
export const CacheKeys = {
  vehicleFilterOptions: () => 'vehicle:filter-options',
  vehicleList: (params: string) => `vehicle:list:${params}`,
  vehicleDetail: (id: string) => `vehicle:detail:${id}`,
  modelsByMake: (makeId: string) => `models:by-make:${makeId}`,
  userById: (id: string) => `user:${id}`,
  collections: () => 'collections:all',
  makes: () => 'makes:all',
  steeringTypes: () => 'steering:all',
} as const;

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;
