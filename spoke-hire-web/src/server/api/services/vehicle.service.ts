/**
 * Vehicle Service
 * 
 * Business logic layer for vehicle operations.
 * Orchestrates repositories, builders, and external services.
 * 
 * REFACTORED: Now uses dependency injection and shared types.
 */

import type { VehicleStatus } from "@prisma/client";
import type { VehicleRepository } from "../repositories/vehicle.repository";
import type { VehicleQueryBuilder } from "../builders/vehicle-query.builder";
import type { VehicleFilters } from "../builders/vehicle-query.builder";
import { geocodePostcode } from "~/lib/services/geocoding";
import { type CacheService, CacheKeys, CacheTTL } from "./cache.service";
import { VehicleNotFoundError } from "../errors/app-errors";
import type {
  ListVehiclesParams,
  ListVehiclesResult,
  VehicleWithRelations,
} from "~/server/types";

export class VehicleService {
  constructor(
    private repository: VehicleRepository,
    private queryBuilder: VehicleQueryBuilder,
    private cache: CacheService
  ) {}

  /**
   * List vehicles with pagination, filters, and optional distance-based sorting
   */
  async listVehicles(params: ListVehiclesParams): Promise<ListVehiclesResult> {
    const {
      limit,
      cursor,
      skip,
      userPostcode,
      userLatitude,
      userLongitude,
      maxDistanceMiles,
      sortByDistance,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeTotalCount = false,
    } = params;

    // Determine user location for distance filtering
    let userLat: number | undefined;
    let userLon: number | undefined;

    if (userPostcode) {
      try {
        const geo = await geocodePostcode(userPostcode);
        userLat = geo.latitude;
        userLon = geo.longitude;
      } catch (error) {
        console.error("Geocoding error:", error);
        // Continue without distance filtering
      }
    } else if (userLatitude && userLongitude) {
      userLat = userLatitude;
      userLon = userLongitude;
    }

    // Build filters object
    const filters: VehicleFilters = {
      status: params.status,
      makeId: params.makeId,
      makeIds: params.makeIds,
      modelId: params.modelId,
      collectionIds: params.collectionIds,
      exteriorColors: params.exteriorColors,
      interiorColors: params.interiorColors,
      yearFrom: params.yearFrom,
      yearTo: params.yearTo,
      priceFrom: params.priceFrom,
      priceTo: params.priceTo,
      ownerId: params.ownerId,
      vehicleIds: params.vehicleIds, // Add vehicleIds filter
      numberOfSeats: params.numberOfSeats,
      gearboxTypes: params.gearboxTypes,
      steeringIds: params.steeringIds,
      countryIds: params.countryIds,
      counties: params.counties,
      search: params.search,
    };

    // Check if we should use distance filtering
    const useDistanceFilter = userLat && userLon && maxDistanceMiles;
    const effectiveLimitValue = limit ?? 50; // Default limit

    let vehicles: VehicleWithRelations[];
    let totalCount: number | undefined;

    if (useDistanceFilter) {
      // Use distance-based query
      const result = await this.listWithDistance(
        userLat!,
        userLon!,
        maxDistanceMiles,
        filters,
        effectiveLimitValue,
        skip,
        sortBy,
        sortOrder,
        sortByDistance,
        includeTotalCount
      );
      vehicles = result.vehicles;
      totalCount = result.totalCount;
    } else {
      // Use standard Prisma query
      const result = await this.listStandard(
        filters,
        effectiveLimitValue,
        skip,
        cursor,
        sortBy,
        sortOrder,
        includeTotalCount
      );
      vehicles = result.vehicles;
      totalCount = result.totalCount;
    }

    // Determine next cursor
    let nextCursor: string | undefined;
    if (vehicles.length > effectiveLimitValue) {
      const nextItem = vehicles.pop();
      nextCursor = nextItem?.id;
    }

    return {
      vehicles,
      items: vehicles,
      nextCursor,
      totalCount,
    };
  }

  /**
   * List vehicles with distance filtering (PostGIS)
   */
  private async listWithDistance(
    userLat: number,
    userLon: number,
    maxDistanceMiles: number,
    filters: VehicleFilters,
    limit: number,
    skip = 0,
    sortBy = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
    sortByDistance = false,
    includeTotalCount = false
  ): Promise<{ vehicles: VehicleWithRelations[]; totalCount?: number }> {
    // Build and execute distance query
    const query = this.queryBuilder.buildDistanceQuery({
      userLatitude: userLat,
      userLongitude: userLon,
      maxDistanceMiles,
      filters,
      limit,
      skip,
      sortBy,
      sortOrder,
      sortByDistance,
    });

    const rawVehicles = await this.repository.queryRaw<{ id: string; distance: number }>(query);

    // Fetch related data for each vehicle
    const vehicleIds = rawVehicles.map((v) => v.id);
    let vehicles: (VehicleWithRelations & { distance: number })[] = [];
    
    if (vehicleIds.length > 0) {
      const vehiclesWithRelations = await this.repository.findManyByIds(vehicleIds);

      // Merge distance data with relations, maintaining order
      const vehicleMap = new Map(vehiclesWithRelations.map((v) => [v.id, v]));
      vehicles = rawVehicles
        .map((rv) => {
          const vehicle = vehicleMap.get(rv.id);
          return vehicle ? { ...vehicle, distance: rv.distance } : null;
        })
        .filter((v) => v !== null);
    }

    // Get total count if requested
    let totalCount: number | undefined;
    if (includeTotalCount) {
      const countQuery = this.queryBuilder.buildDistanceCountQuery(
        userLat,
        userLon,
        maxDistanceMiles,
        filters
      );
      const countResult = await this.repository.queryRaw<{ count: bigint }>(countQuery);
      totalCount = Number(countResult[0]?.count ?? 0);
    }

    return { vehicles, totalCount };
  }

  /**
   * List vehicles without distance filtering (standard Prisma)
   */
  private async listStandard(
    filters: VehicleFilters,
    limit: number,
    skip = 0,
    cursor?: string,
    sortBy = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
    includeTotalCount = false
  ): Promise<{ vehicles: VehicleWithRelations[]; totalCount?: number }> {
    // Build Prisma where clause
    const where = this.queryBuilder.buildPrismaWhere(filters);

    // Add cursor if provided
    if (cursor) {
      where.id = { lt: cursor };
    }

    // Build orderBy
    const orderBy =
      sortBy === "name"
        ? { name: sortOrder }
        : sortBy === "price"
        ? { price: sortOrder }
        : { [sortBy]: sortOrder };

    // Fetch vehicles
    const vehicles = await this.repository.findMany(where, {
      take: limit + 1,
      skip,
      orderBy,
    });

    // Get total count if requested
    let totalCount: number | undefined;
    if (includeTotalCount) {
      totalCount = await this.repository.count(where);
    }

    return { vehicles, totalCount };
  }

  /**
   * Get vehicle by ID with full details
   */
  async getVehicleById(id: string) {
    // Try cache first
    const cacheKey = CacheKeys.vehicleDetail(id);
    const cached = this.cache.get<VehicleWithRelations>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database in parallel
    const [vehicle, media, sources, specifications, collections] = await Promise.all([
      this.repository.findById(id),
      this.repository.findMediaByVehicleId(id),
      this.repository.findSourcesByVehicleId(id),
      this.repository.findSpecificationsByVehicleId(id),
      this.repository.findCollectionsByVehicleId(id),
    ]);

    const result = {
      ...vehicle,
      media,
      sources,
      specifications,
      collections,
    };

    // Cache for 1 minute
    this.cache.set(cacheKey, result, CacheTTL.SHORT);

    return result;
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(id: string, status: VehicleStatus) {
    // Check if vehicle exists
    const exists = await this.repository.findById(id);
    if (!exists) {
      throw new VehicleNotFoundError(id);
    }

    // Update status
    const updatedVehicle = await this.repository.updateStatus(id, status);

    // Invalidate caches
    this.cache.delete(CacheKeys.vehicleDetail(id));
    this.cache.invalidateByPattern("vehicle:list:");
    this.cache.delete(CacheKeys.vehicleFilterOptions());

    return updatedVehicle;
  }

  /**
   * Delete vehicle (soft delete)
   */
  async deleteVehicle(id: string) {
    // Check if vehicle exists
    const exists = await this.repository.findById(id);
    if (!exists) {
      throw new VehicleNotFoundError(id);
    }

    // Soft delete
    const deletedVehicle = await this.repository.softDelete(id);

    // Invalidate caches
    this.cache.delete(CacheKeys.vehicleDetail(id));
    this.cache.invalidateByPattern("vehicle:list:");
    this.cache.delete(CacheKeys.vehicleFilterOptions());

    return deletedVehicle;
  }
}
