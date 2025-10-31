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
  DbClient,
} from "~/server/types";

export class VehicleService {
  constructor(
    private repository: VehicleRepository,
    private queryBuilder: VehicleQueryBuilder,
    private cache: CacheService,
    private db: DbClient
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
    try {
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
    } catch (error) {
      // Check if it's a PostGIS-related error (function not found, extension not installed, etc.)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isPostGISError = 
        errorMessage.includes('postgis') ||
        errorMessage.includes('ST_Distance') ||
        errorMessage.includes('ST_MakePoint') ||
        errorMessage.includes('ST_DWithin') ||
        errorMessage.includes('function st_') ||
        errorMessage.includes('geometry') && errorMessage.includes('does not exist');

      if (isPostGISError) {
        console.warn('PostGIS not available, falling back to standard query without distance filtering');
        // Fallback to standard query without distance filtering
        return await this.listStandard(
          filters,
          limit,
          skip,
          undefined,
          sortBy === "distance" ? "createdAt" : sortBy, // Can't sort by distance without PostGIS
          sortOrder,
          includeTotalCount
        );
      }

      // Re-throw non-PostGIS errors
      throw error;
    }
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
   * Update vehicle
   * Supports creating new Make/Model records if string names are provided instead of IDs
   */
  async updateVehicle(id: string, data: import("~/server/types").UpdateVehicleData) {
    // Check if vehicle exists
    const exists = await this.repository.findById(id);
    if (!exists) {
      throw new VehicleNotFoundError(id);
    }

    // Helper function to check if a string is an ID (UUID or cuid format)
    const isId = (str: string): boolean => {
      // Check for UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      // Check for cuid format: starts with 'c' followed by 24 alphanumeric chars (25 total)
      const cuidRegex = /^c[a-z0-9]{24}$/i;
      return uuidRegex.test(str) || cuidRegex.test(str);
    };

    // Helper function to generate slug from name
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove non-word chars
        .replace(/[\s_-]+/g, '-')  // Replace spaces/underscores with -
        .replace(/^-+|-+$/g, '');   // Remove leading/trailing -
    };

    // Process makeId - create new make if string name provided
    let finalMakeId = data.makeId ?? exists.makeId;
    if (data.makeId && !isId(data.makeId)) {
      // User provided a make name, not an ID - create or find make
      const makeName = data.makeId.trim();
      
      // Check if make already exists (case-insensitive)
      let make = await this.db.make.findFirst({
        where: { 
          name: { 
            equals: makeName,
            mode: 'insensitive'
          } 
        },
      });

      // Create new make if it doesn't exist
      if (!make) {
        make = await this.db.make.create({
          data: {
            name: makeName,
            slug: generateSlug(makeName),
            isActive: true,
          },
        });
        
        // Invalidate makes cache
        this.cache.delete(CacheKeys.makes());
        this.cache.delete(CacheKeys.vehicleFilterOptions());
      }
      
      finalMakeId = make.id;
    }

    // Process modelId - create new model if string name provided
    let finalModelId = data.modelId ?? exists.modelId;
    if (data.modelId && !isId(data.modelId)) {
      // User provided a model name, not an ID - create or find model
      const modelName = data.modelId.trim();
      
      // Check if model already exists for this make (case-insensitive)
      let model = await this.db.model.findFirst({
        where: { 
          name: { 
            equals: modelName,
            mode: 'insensitive'
          },
          makeId: finalMakeId,
        },
      });

      // Create new model if it doesn't exist
      if (!model) {
        model = await this.db.model.create({
          data: {
            name: modelName,
            slug: generateSlug(modelName),
            makeId: finalMakeId,
            isActive: true,
          },
        });
        
        // Invalidate models cache for this make
        this.cache.delete(CacheKeys.modelsByMake(finalMakeId));
        this.cache.delete(CacheKeys.vehicleFilterOptions());
      }
      
      finalModelId = model.id;
    }

    // Validate make/model relationship
    if (finalMakeId && finalModelId) {
      const model = await this.db.model.findUnique({
        where: { id: finalModelId },
        select: { makeId: true },
      });

      if (!model || model.makeId !== finalMakeId) {
        throw new Error("Invalid make/model combination");
      }
    }

    // Check registration uniqueness if registration is being updated
    if (data.registration !== undefined && data.registration !== null && data.registration !== exists.registration) {
      // Check 1: Current owner's vehicles (ALL statuses)
      const ownVehicleWithReg = await this.db.vehicle.findFirst({
        where: {
          registration: {
            equals: data.registration,
            mode: "insensitive" as const,
          },
          ownerId: exists.ownerId,
          id: {
            not: id, // Exclude current vehicle
          },
        },
        select: {
          id: true,
          name: true,
          ownerId: true,
          status: true,
        },
      });

      if (ownVehicleWithReg) {
        throw new Error(
          JSON.stringify({
            code: "REGISTRATION_EXISTS",
            vehicleId: ownVehicleWithReg.id,
            vehicleName: ownVehicleWithReg.name,
            isOwnVehicle: true,
            status: ownVehicleWithReg.status,
          })
        );
      }

      // Check 2: Other users' vehicles (PUBLISHED only)
      const otherVehicleWithReg = await this.db.vehicle.findFirst({
        where: {
          registration: {
            equals: data.registration,
            mode: "insensitive" as const,
          },
          ownerId: {
            not: exists.ownerId,
          },
          status: "PUBLISHED",
        },
        select: {
          id: true,
          name: true,
          ownerId: true,
          status: true,
        },
      });

      if (otherVehicleWithReg) {
        throw new Error(
          JSON.stringify({
            code: "REGISTRATION_EXISTS",
            vehicleId: otherVehicleWithReg.id,
            vehicleName: otherVehicleWithReg.name,
            isOwnVehicle: false,
            status: otherVehicleWithReg.status,
          })
        );
      }
    }

    // Update vehicle with final IDs
    const updatedVehicle = await this.db.vehicle.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
        ...(data.dailyRate !== undefined && { dailyRate: data.dailyRate }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.registration !== undefined && { registration: data.registration }),
        makeId: finalMakeId,
        modelId: finalModelId,
        ...(data.engineCapacity !== undefined && { engineCapacity: data.engineCapacity }),
        ...(data.numberOfSeats !== undefined && { numberOfSeats: data.numberOfSeats }),
        ...(data.steeringId !== undefined && { steeringId: data.steeringId }),
        ...(data.gearbox !== undefined && { gearbox: data.gearbox }),
        ...(data.exteriorColour !== undefined && { exteriorColour: data.exteriorColour }),
        ...(data.interiorColour !== undefined && { interiorColour: data.interiorColour }),
        ...(data.condition !== undefined && { condition: data.condition }),
        ...(data.isRoadLegal !== undefined && { isRoadLegal: data.isRoadLegal }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        make: { select: { id: true, name: true } },
        model: { select: { id: true, name: true } },
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Update collections if provided
    if (data.collectionIds !== undefined) {
      // Delete existing collections
      await this.db.vehicleCollection.deleteMany({
        where: { vehicleId: id },
      });

      // Create new collections
      if (data.collectionIds.length > 0) {
        await this.db.vehicleCollection.createMany({
          data: data.collectionIds.map(collectionId => ({
            vehicleId: id,
            collectionId: collectionId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Invalidate caches
    this.cache.delete(CacheKeys.vehicleDetail(id));
    this.cache.invalidateByPattern("vehicle:list:");

    return updatedVehicle;
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
