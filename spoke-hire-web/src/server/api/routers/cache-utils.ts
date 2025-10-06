/**
 * Cache Management Utilities
 * 
 * Centralized utilities for managing server-side caches across routers.
 * Import these functions in mutations that should invalidate caches.
 * 
 * REFACTORED: Now uses the centralized CacheService
 */

import { cacheService, CacheKeys } from "../services/cache.service";

/**
 * Invalidate all vehicle-related caches
 * 
 * Call this after:
 * - Creating/updating/deleting vehicles
 * - Updating vehicle colors, years, or other filter-related fields
 */
export function invalidateVehicleCaches() {
  cacheService.invalidateByPattern("vehicle:");
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
  cacheService.delete(CacheKeys.vehicleFilterOptions());
  cacheService.invalidateByPattern("models:by-make:");
  cacheService.delete(CacheKeys.makes());
  cacheService.delete(CacheKeys.collections());
  cacheService.delete(CacheKeys.steeringTypes());
}

/**
 * Invalidate all caches (nuclear option)
 * 
 * Use sparingly, only for major data migrations or testing
 */
export function invalidateAllCaches() {
  cacheService.clear();
}

/**
 * Get cache statistics (for monitoring/debugging)
 */
export function getCacheStats() {
  return cacheService.getStats();
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCaches() {
  return cacheService.cleanup();
}

