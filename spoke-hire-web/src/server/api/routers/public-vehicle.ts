/**
 * Public Vehicle Router
 * 
 * Handles all public vehicle operations (no authentication required).
 * Only exposes PUBLISHED vehicles and hides sensitive information.
 * Used for the public vehicle catalogue at /vehicles
 */

import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "~/server/api/trpc";
import { ServiceFactory } from "../services/service-factory";

// ============================================================================
// Input Validation Schemas
// ============================================================================

const listPublicVehiclesInputSchema = z.object({
  // Pagination
  limit: z.number().min(1).max(100).default(30),
  cursor: z.string().optional(),
  skip: z.number().min(0).optional(),

  // Filters - NO PRICE FILTERS OR SEARCH
  makeIds: z.array(z.string()).optional(),
  modelId: z.string().optional(),
  collectionIds: z.array(z.string()).optional(),
  yearFrom: z.string().optional(),
  yearTo: z.string().optional(),
  
  // Location filters
  countryIds: z.array(z.string()).optional(),
  counties: z.array(z.string()).optional(),

  // Distance filtering (optional - for future enhancement)
  userPostcode: z.string().optional(),
  userLatitude: z.number().optional(),
  userLongitude: z.number().optional(),
  maxDistanceMiles: z.number().min(1).max(500).optional(),
  sortByDistance: z.boolean().optional(),

  // Sorting
  sortBy: z
    .enum(["createdAt", "updatedAt", "year", "name", "distance"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  // Performance optimization
  includeTotalCount: z.boolean().default(false),
});

const getPublicVehicleByIdInputSchema = z.object({
  id: z.string(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const publicVehicleRouter = createTRPCRouter({
  /**
   * List published vehicles with pagination and filters
   * Public endpoint - no authentication required
   * Only returns PUBLISHED vehicles
   */
  list: publicProcedure
    .input(listPublicVehiclesInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createVehicleService(ctx.db);
      
      // Force status to PUBLISHED for public access
      const result = await service.listVehicles({
        ...input,
        status: "PUBLISHED", // Override - only show published vehicles
      });

      // Map to exclude sensitive owner information
      const publicVehicles = result.vehicles.map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name,
        year: vehicle.year,
        registration: vehicle.registration,
        status: vehicle.status,
        make: vehicle.make,
        model: vehicle.model,
        media: vehicle.media,
        collections: vehicle.collections,
        // Owner location only (no contact info)
        owner: {
          id: vehicle.owner.id,
          city: vehicle.owner.city,
          county: vehicle.owner.county,
          postcode: vehicle.owner.postcode,
          latitude: vehicle.owner.latitude,
          longitude: vehicle.owner.longitude,
          country: vehicle.owner.country,
        },
        // Include distance if calculated
        distance: 'distance' in vehicle ? (vehicle as any).distance : undefined,
      }));

      return {
        vehicles: publicVehicles,
        items: publicVehicles,
        nextCursor: result.nextCursor,
        totalCount: result.totalCount,
      };
    }),

  /**
   * Get a single published vehicle by ID with full details
   * Public endpoint - no authentication required
   * Only returns PUBLISHED vehicles
   */
  getById: publicProcedure
    .input(getPublicVehicleByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createVehicleService(ctx.db);
      const vehicle = await service.getVehicleById(input.id);

      // Verify vehicle is published
      if (vehicle.status !== "PUBLISHED") {
        throw new Error("Vehicle not found or not available");
      }

      // Return vehicle with limited owner information (no contact details, no names)
      return {
        id: vehicle.id,
        name: vehicle.name,
        year: vehicle.year,
        status: vehicle.status,
        engineCapacity: vehicle.engineCapacity,
        numberOfSeats: vehicle.numberOfSeats,
        gearbox: vehicle.gearbox,
        exteriorColour: vehicle.exteriorColour,
        interiorColour: vehicle.interiorColour,
        condition: vehicle.condition,
        isRoadLegal: vehicle.isRoadLegal,
        description: vehicle.description,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
        make: vehicle.make,
        model: vehicle.model,
        steering: vehicle.steering,
        media: vehicle.media,
        specifications: vehicle.specifications,
        collections: vehicle.collections,
        // Owner location only (no email, phone, names, or postcode)
        owner: {
          id: vehicle.owner.id,
          city: vehicle.owner.city,
          county: vehicle.owner.county,
          country: vehicle.owner.country,
        },
      };
    }),

  /**
   * Get filter options for public vehicle catalogue
   * Returns only makes, models, collections, etc. that have published vehicles
   * Accepts current filters to provide cascading/dependent filter options
   */
  getFilterOptions: publicProcedure
    .input(
      z.object({
        makeIds: z.array(z.string()).optional(),
        modelId: z.string().optional(),
        collectionIds: z.array(z.string()).optional(),
        yearFrom: z.string().optional(),
        yearTo: z.string().optional(),
        countryIds: z.array(z.string()).optional(),
        counties: z.array(z.string()).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const repository = new (await import("../repositories/lookup.repository")).LookupRepository(ctx.db);

      // If no filters provided, get all available options
      if (!input || Object.keys(input).length === 0) {
        const [makes, collections, countries, counties] = await Promise.all([
          repository.getMakesWithPublishedVehicles(),
          repository.getCollectionsWithPublishedVehicles(),
          repository.getCountriesWithPublishedVehicles(),
          repository.getCountiesWithPublishedVehicles(),
        ]);

        return {
          makes: makes as Array<{ id: string; name: string }>,
          models: [] as Array<{ id: string; name: string }>,
          collections: collections as Array<{ id: string; name: string; color: string | null }>,
          countries: countries as Array<{ id: string; name: string; code: string | null }>,
          counties: counties as string[],
        };
      }

      // Get dynamic filter options based on current filters
      const options = await repository.getPublicFilterOptions(input);

      return {
        makes: options.makes as Array<{ id: string; name: string }>,
        models: options.models as Array<{ id: string; name: string }>,
        collections: options.collections as Array<{ id: string; name: string; color: string | null }>,
        countries: options.countries as Array<{ id: string; name: string; code: string | null }>,
        counties: options.counties as string[],
      };
    }),

  /**
   * Get models by make ID (public)
   * Returns only models that have published vehicles
   */
  getModelsByMake: publicProcedure
    .input(z.object({ makeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repository = new (await import("../repositories/lookup.repository")).LookupRepository(ctx.db);
      const models = await repository.getModelsByMakeWithPublishedVehicles(input.makeId);
      
      return models as Array<{ id: string; name: string }>;
    }),
});

