/**
 * Lookup Service
 * 
 * Business logic layer for lookup/reference data operations.
 * Handles makes, models, collections, and other reference tables.
 */

import { type VehicleStatus } from "@prisma/client";
import { LookupRepository } from "../repositories/lookup.repository";
import { cacheService, CacheKeys, CacheTTL } from "./cache.service";

// Use the DB type from context
type DbClient = any;

export class LookupService {
  private repository: LookupRepository;

  constructor(private db: DbClient) {
    this.repository = new LookupRepository(db);
  }

  /**
   * Get all filter options for vehicle filtering
   * Cached for 5 minutes
   */
  async getFilterOptions() {
    // Check cache first
    const cacheKey = CacheKeys.vehicleFilterOptions();
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch all filter options in parallel
    const [
      makes,
      collections,
      exteriorColors,
      interiorColors,
      years,
      statusCounts,
      seats,
      gearboxTypes,
      steeringTypes,
    ] = await Promise.all([
      this.repository.getAllMakes(),
      this.repository.getAllCollections(),
      this.repository.getDistinctExteriorColors(),
      this.repository.getDistinctInteriorColors(),
      this.repository.getDistinctYears(),
      this.repository.getStatusCounts(),
      this.repository.getDistinctSeats(),
      this.repository.getDistinctGearboxTypes(),
      this.repository.getAllSteeringTypes(),
    ]);

    const result = {
      makes,
      collections,
      exteriorColors,
      interiorColors,
      years,
      statusCounts: statusCounts.map((sc: any) => ({
        status: sc.status as VehicleStatus,
        count: sc._count as number,
      })),
      seats,
      gearboxTypes,
      steeringTypes,
    };

    // Cache for 5 minutes
    cacheService.set(cacheKey, result, CacheTTL.MEDIUM);

    return result;
  }

  /**
   * Get models by make ID
   * Cached for 5 minutes
   */
  async getModelsByMake(makeId: string) {
    // Check cache first
    const cacheKey = CacheKeys.modelsByMake(makeId);
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch models
    const models = await this.repository.getModelsByMake(makeId);

    // Cache for 5 minutes
    cacheService.set(cacheKey, models, CacheTTL.MEDIUM);

    return models;
  }

  /**
   * Invalidate all lookup caches
   * Call this when makes, models, or collections are updated
   */
  invalidateCaches() {
    cacheService.delete(CacheKeys.vehicleFilterOptions());
    cacheService.invalidateByPattern("models:by-make:");
    cacheService.delete(CacheKeys.makes());
    cacheService.delete(CacheKeys.collections());
    cacheService.delete(CacheKeys.steeringTypes());
  }
}
