import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { VehicleStatus } from "@prisma/client";

/**
 * Vehicle Router
 * 
 * Handles all vehicle-related operations for the admin interface.
 * All procedures require admin authentication.
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Caching for filter options (5 min TTL)
 * - Parallel queries where possible
 * - Optional total count in list query
 * - Raw SQL for DISTINCT queries
 * - Limited media/specs in detail view
 */

// Cache for filter options (5 minutes TTL)
const FILTER_OPTIONS_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
let filterOptionsCache: {
  data: any;
  timestamp: number;
} | null = null;

/**
 * Invalidate filter options cache
 * Call this when vehicles, makes, models, or collections are updated
 */
export function invalidateFilterOptionsCache() {
  filterOptionsCache = null;
}

// Input validation schemas
const listVehiclesInputSchema = z.object({
  // Pagination
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(), // Vehicle ID for cursor-based pagination
  skip: z.number().min(0).optional(), // For offset-based pagination
  
  // Search
  search: z.string().optional(),
  
  // Filters
  status: z.nativeEnum(VehicleStatus).optional(),
  makeId: z.string().optional(), // Single make (deprecated, use makeIds)
  makeIds: z.array(z.string()).optional(), // Multiple makes with OR logic
  modelId: z.string().optional(),
  collectionIds: z.array(z.string()).optional(), // Multiple collections with OR logic
  exteriorColors: z.array(z.string()).optional(), // Multiple exterior colors with OR logic
  interiorColors: z.array(z.string()).optional(), // Multiple interior colors with OR logic
  yearFrom: z.string().optional(),
  yearTo: z.string().optional(),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  ownerId: z.string().optional(),
  
  // Sorting
  sortBy: z.enum(["createdAt", "updatedAt", "price", "year", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  
  // OPTIMIZATION: Make total count optional (expensive query)
  includeTotalCount: z.boolean().default(false),
});

const getByIdInputSchema = z.object({
  id: z.string(),
});

const updateStatusInputSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(VehicleStatus),
});

const deleteVehicleInputSchema = z.object({
  id: z.string(),
});

export const vehicleRouter = createTRPCRouter({
  /**
   * List vehicles with pagination, search, and filters
   */
  list: adminProcedure
    .input(listVehiclesInputSchema)
    .query(async ({ ctx, input }) => {
      const {
        limit,
        cursor,
        skip,
        search,
        status,
        makeId,
        makeIds,
        modelId,
        collectionIds,
        exteriorColors,
        interiorColors,
        yearFrom,
        yearTo,
        priceFrom,
        priceTo,
        ownerId,
        sortBy,
        sortOrder,
      } = input;

      // Build where clause
      const where: any = {};

      // Status filter
      if (status) {
        where.status = status;
      }

      // Make/Model filters with OR logic
      if (makeIds && makeIds.length > 0) {
        // Multiple makes: use OR logic (makeId IN makeIds)
        where.makeId = { in: makeIds };
      } else if (makeId) {
        // Single make (backward compatibility)
        where.makeId = makeId;
      }
      
      if (modelId) {
        where.modelId = modelId;
      }

      // Collection filter with OR logic
      if (collectionIds && collectionIds.length > 0) {
        // Vehicles that have ANY of the selected collections
        where.collections = {
          some: {
            collectionId: { in: collectionIds }
          }
        };
      }

      // Exterior color filter with OR logic
      if (exteriorColors && exteriorColors.length > 0) {
        where.exteriorColour = { in: exteriorColors };
      }

      // Interior color filter with OR logic
      if (interiorColors && interiorColors.length > 0) {
        where.interiorColour = { in: interiorColors };
      }

      // Year range filter
      if (yearFrom || yearTo) {
        where.year = {};
        if (yearFrom) where.year.gte = yearFrom;
        if (yearTo) where.year.lte = yearTo;
      }

      // Price range filter
      if (priceFrom !== undefined || priceTo !== undefined) {
        where.price = {};
        if (priceFrom !== undefined) where.price.gte = priceFrom;
        if (priceTo !== undefined) where.price.lte = priceTo;
      }

      // Owner filter
      if (ownerId) {
        where.ownerId = ownerId;
      }

      // Search across multiple fields including owner information
      if (search && search.trim()) {
        where.OR = [
          // Vehicle fields
          { name: { contains: search, mode: "insensitive" } },
          { registration: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { make: { name: { contains: search, mode: "insensitive" } } },
          { model: { name: { contains: search, mode: "insensitive" } } },
          // Owner fields
          { owner: { email: { contains: search, mode: "insensitive" } } },
          { owner: { firstName: { contains: search, mode: "insensitive" } } },
          { owner: { lastName: { contains: search, mode: "insensitive" } } },
          { owner: { phone: { contains: search, mode: "insensitive" } } },
        ];
      }

      // Cursor pagination
      if (cursor) {
        where.id = { lt: cursor };
      }

      // Build orderBy
      const orderBy: any = {};
      if (sortBy === "name" || sortBy === "year") {
        orderBy[sortBy] = sortOrder;
      } else if (sortBy === "price") {
        orderBy.price = sortOrder;
      } else {
        orderBy[sortBy] = sortOrder;
      }

      // Fetch vehicles
      const vehicles = await ctx.db.vehicle.findMany({
        where,
        take: limit + 1, // Fetch one extra to determine if there's a next page
        skip: skip ?? undefined, // Use skip for offset-based pagination
        orderBy,
        include: {
          make: {
            select: {
              id: true,
              name: true,
            },
          },
          model: {
            select: {
              id: true,
              name: true,
            },
          },
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              postcode: true,
              city: true,
              country: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          media: {
            where: {
              isPrimary: true,
              isVisible: true,
              status: "READY",
            },
            take: 1,
            select: {
              id: true,
              publishedUrl: true,
              originalUrl: true,
              type: true,
            },
          },
          _count: {
            select: {
              media: true,
            },
          },
        },
      });

      // Determine if there's a next page
      let nextCursor: string | undefined = undefined;
      if (vehicles.length > limit) {
        const nextItem = vehicles.pop(); // Remove the extra item
        nextCursor = nextItem?.id;
      }

      // OPTIMIZATION: Only get total count if requested (expensive query)
      const totalCount = input.includeTotalCount
        ? await ctx.db.vehicle.count({ where })
        : undefined;

      return {
        vehicles,
        nextCursor,
        totalCount,
      };
    }),

  /**
   * Get a single vehicle by ID with full details
   * OPTIMIZED: Uses parallel queries to reduce latency from N+1 problem
   */
  getById: adminProcedure
    .input(getByIdInputSchema)
    .query(async ({ ctx, input }) => {
      // OPTIMIZATION: Execute base vehicle query and relations in parallel
      // This reduces the total query time by fetching data concurrently
      const [vehicle, media, sources, specifications, vehicleCollections] = 
        await Promise.all([
          // Main vehicle with simple relations (single query)
          ctx.db.vehicle.findUnique({
            where: { id: input.id },
            include: {
              make: true,
              model: true,
              owner: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  userType: true,
                  status: true,
                },
              },
              steering: true,
            },
          }),
          
          // Fetch media separately with limit
          ctx.db.media.findMany({
            where: { vehicleId: input.id },
            orderBy: { order: "asc" },
            take: 100,
          }),
          
          // Fetch sources separately with limit
          ctx.db.vehicleSource.findMany({
            where: { vehicleId: input.id },
            take: 20,
          }),
          
          // Fetch specifications separately with limit
          ctx.db.vehicleSpecification.findMany({
            where: { vehicleId: input.id },
            orderBy: { category: "asc" },
            take: 200,
          }),
          
          // Fetch collections with nested data
          ctx.db.vehicleCollection.findMany({
            where: { vehicleId: input.id },
            include: {
              collection: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          }),
        ]);

      if (!vehicle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vehicle not found",
        });
      }

      // Combine the results to match the expected structure
      return {
        ...vehicle,
        media,
        sources,
        specifications,
        collections: vehicleCollections,
      };
    }),

  /**
   * Update vehicle status
   */
  updateStatus: adminProcedure
    .input(updateStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const vehicle = await ctx.db.vehicle.findUnique({
        where: { id: input.id },
      });

      if (!vehicle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vehicle not found",
        });
      }

      const updatedVehicle = await ctx.db.vehicle.update({
        where: { id: input.id },
        data: {
          status: input.status,
          updatedAt: new Date(),
        },
        include: {
          make: true,
          model: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Invalidate cache since status counts changed
      invalidateFilterOptionsCache();

      return updatedVehicle;
    }),

  /**
   * Delete vehicle (soft delete by setting status to ARCHIVED)
   */
  delete: adminProcedure
    .input(deleteVehicleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const vehicle = await ctx.db.vehicle.findUnique({
        where: { id: input.id },
      });

      if (!vehicle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vehicle not found",
        });
      }

      // Soft delete by archiving
      const deletedVehicle = await ctx.db.vehicle.update({
        where: { id: input.id },
        data: {
          status: VehicleStatus.ARCHIVED,
          updatedAt: new Date(),
        },
      });

      // Invalidate cache since status counts changed
      invalidateFilterOptionsCache();

      return deletedVehicle;
    }),

  /**
   * Get filter options (makes, models, years, etc.)
   * OPTIMIZED: Cached for 5 minutes, uses parallel queries and raw SQL
   */
  getFilterOptions: adminProcedure.query(async ({ ctx }) => {
    // Check cache first
    const now = Date.now();
    if (
      filterOptionsCache &&
      now - filterOptionsCache.timestamp < FILTER_OPTIONS_CACHE_TIME
    ) {
      return filterOptionsCache.data;
    }

    // OPTIMIZATION: Execute all queries in parallel for better performance
    const [
      makes,
      collections,
      exteriorColorsData,
      interiorColorsData,
      years,
      statusCounts,
    ] = await Promise.all([
      // Get all makes
      ctx.db.make.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      }),

      // Get all collections
      ctx.db.collection.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
        },
      }),

      // OPTIMIZATION: Use raw SQL for DISTINCT queries (much faster)
      ctx.db.$queryRaw<Array<{ exteriorColour: string }>>`
        SELECT DISTINCT "exteriorColour"
        FROM "Vehicle"
        WHERE "exteriorColour" IS NOT NULL
        ORDER BY "exteriorColour" ASC
      `,

      ctx.db.$queryRaw<Array<{ interiorColour: string }>>`
        SELECT DISTINCT "interiorColour"
        FROM "Vehicle"
        WHERE "interiorColour" IS NOT NULL
        ORDER BY "interiorColour" ASC
      `,

      ctx.db.$queryRaw<Array<{ year: string }>>`
        SELECT DISTINCT "year"
        FROM "Vehicle"
        ORDER BY "year" DESC
      `,

      // Get status counts
      ctx.db.vehicle.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const result = {
      makes,
      collections,
      exteriorColors: exteriorColorsData
        .map((v) => v.exteriorColour)
        .filter((c): c is string => c !== null),
      interiorColors: interiorColorsData
        .map((v) => v.interiorColour)
        .filter((c): c is string => c !== null),
      years: years.map((v) => v.year),
      statusCounts: statusCounts.map((sc) => ({
        status: sc.status,
        count: sc._count,
      })),
    };

    // Update cache
    filterOptionsCache = {
      data: result,
      timestamp: now,
    };

    return result;
  }),

  /**
   * Get models by make ID
   */
  getModelsByMake: adminProcedure
    .input(z.object({ makeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const models = await ctx.db.model.findMany({
        where: {
          makeId: input.makeId,
          isActive: true,
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      });

      return models;
    }),
});

