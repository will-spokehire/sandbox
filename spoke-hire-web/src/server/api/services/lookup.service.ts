/**
 * Lookup Service
 * 
 * Business logic layer for lookup/reference data operations.
 * Handles makes, models, collections, and other reference tables.
 */

import { type VehicleStatus } from "@prisma/client";
import { LookupRepository } from "../repositories/lookup.repository";
import { cacheService, CacheKeys, CacheTTL } from "./cache.service";
import { type db } from "~/server/db";

// Use the actual DB client type (with extensions)
type DbClient = typeof db;

export class LookupService {
  private repository: LookupRepository;

  constructor(private db: DbClient) {
    this.repository = new LookupRepository(db);
  }

  /**
   * Get all filter options for vehicle filtering
   * Cached for 5 minutes
   */
  async getFilterOptions(): Promise<Record<string, unknown>> {
    // Check cache first
    const cacheKey = CacheKeys.vehicleFilterOptions();
    const cached = cacheService.get<Record<string, unknown>>(cacheKey);
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
      countries,
      counties,
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

      // Get all countries
      this.repository.getAllCountries(),

      // Get distinct counties
      this.repository.getDistinctCounties(),
    ]);

    const result = {
      makes,
      collections,
      exteriorColors,
      interiorColors,
      years,
      statusCounts: (statusCounts as unknown as Array<{ status: VehicleStatus; _count: number }>).map((sc) => ({
        status: sc.status,
        count: sc._count,
      })),
      seats,
      gearboxTypes,
      steeringTypes,
      countries,
      counties,
    };

    // Cache for 5 minutes
    cacheService.set(cacheKey, result, CacheTTL.MEDIUM);

    return result;
  }

  /**
   * Get models by make ID
   * Cached for 5 minutes
   */
  async getModelsByMake(makeId: string): Promise<Array<Record<string, unknown>>> {
    // Check cache first
    const cacheKey = CacheKeys.modelsByMake(makeId);
    const cached = cacheService.get<Array<Record<string, unknown>>>(cacheKey);
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
