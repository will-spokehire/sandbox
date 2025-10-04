/**
 * Cache Management Utilities
 * 
 * Centralized utilities for managing server-side caches across routers.
 * Import these functions in mutations that should invalidate caches.
 */

import { invalidateFilterOptionsCache } from "./vehicle";

/**
 * Invalidate all vehicle-related caches
 * 
 * Call this after:
 * - Creating/updating/deleting vehicles
 * - Updating vehicle colors, years, or other filter-related fields
 */
export function invalidateVehicleCaches() {
  invalidateFilterOptionsCache();
}

/**
 * Invalidate filter caches when lookup tables change
 * 
 * Call this after:
 * - Creating/updating/deleting makes
 * - Creating/updating/deleting models
 * - Creating/updating/deleting collections
 */
export function invalidateLookupCaches() {
  invalidateFilterOptionsCache();
}

/**
 * Invalidate all caches (nuclear option)
 * 
 * Use sparingly, only for major data migrations or testing
 */
export function invalidateAllCaches() {
  invalidateFilterOptionsCache();
  // Add other cache invalidations here as needed
}

/**
 * Get cache statistics (for monitoring/debugging)
 */
export function getCacheStats() {
  return {
    filterOptionsCache: {
      // You could extend this to track hits/misses
      exists: true,
      ttl: 300, // 5 minutes in seconds
    },
  };
}

