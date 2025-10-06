import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { VehicleStatus, Prisma } from "@prisma/client";
import { geocodePostcode } from "~/lib/services/geocoding";
import { getPostGISDistanceSQL, getPostGISDWithinFilter } from "~/lib/services/distance";

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
  numberOfSeats: z.array(z.number()).optional(), // Multiple seat counts with OR logic
  gearboxTypes: z.array(z.string()).optional(), // Multiple gearbox types with OR logic
  steeringIds: z.array(z.string()).optional(), // Multiple steering types with OR logic
  
  // Distance filtering (NEW)
  userPostcode: z.string().optional(),
  userLatitude: z.number().optional(),
  userLongitude: z.number().optional(),
  maxDistanceMiles: z.number().min(1).max(500).optional(),
  sortByDistance: z.boolean().optional(),
  
  // Sorting
  sortBy: z.enum(["createdAt", "updatedAt", "price", "year", "name", "distance"]).default("createdAt"),
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
        numberOfSeats,
        gearboxTypes,
        steeringIds,
        userPostcode,
        userLatitude,
        userLongitude,
        maxDistanceMiles,
        sortByDistance,
        sortBy,
        sortOrder,
      } = input;

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

      // Number of seats filter with OR logic
      if (numberOfSeats && numberOfSeats.length > 0) {
        where.numberOfSeats = { in: numberOfSeats };
      }

      // Gearbox filter with OR logic
      if (gearboxTypes && gearboxTypes.length > 0) {
        where.gearbox = { in: gearboxTypes };
      }

      // Steering filter with OR logic
      if (steeringIds && steeringIds.length > 0) {
        where.steeringId = { in: steeringIds };
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

      // Check if we should use distance filtering
      const useDistanceFilter = userLat && userLon && maxDistanceMiles;
      
      if (useDistanceFilter) {
        // Add requirement that owner has geolocation data
        where.owner = {
          ...where.owner,
          latitude: { not: null },
          longitude: { not: null },
        };
      }

      // Build orderBy
      const orderBy: any = 
        sortBy === "name"
          ? { name: sortOrder }
          : sortBy === "price"
          ? { price: sortOrder }
          : { [sortBy]: sortOrder };

      // Fetch vehicles with distance filtering if applicable
      let vehicles: any[];
      
      if (useDistanceFilter) {
        // Use raw SQL with PostGIS for distance filtering
        const distanceSQL = getPostGISDistanceSQL(userLat!, userLon!, "miles", "u");
        const dwithinFilter = getPostGISDWithinFilter(userLat!, userLon!, maxDistanceMiles!, "miles", "u");

        // Build WHERE conditions for all filters
        const statusCondition = status ? Prisma.sql`AND v.status = ${status}::text::"VehicleStatus"` : Prisma.empty;
        const makeCondition = makeIds && makeIds.length > 0 
          ? Prisma.sql`AND v."makeId" = ANY(${makeIds}::text[])` 
          : makeId 
          ? Prisma.sql`AND v."makeId" = ${makeId}` 
          : Prisma.empty;
        const modelCondition = modelId ? Prisma.sql`AND v."modelId" = ${modelId}` : Prisma.empty;
        
        // Color filters
        const exteriorColorCondition = exteriorColors && exteriorColors.length > 0
          ? Prisma.sql`AND v."exteriorColour" = ANY(${exteriorColors}::text[])`
          : Prisma.empty;
        const interiorColorCondition = interiorColors && interiorColors.length > 0
          ? Prisma.sql`AND v."interiorColour" = ANY(${interiorColors}::text[])`
          : Prisma.empty;
        
        // Year range filter
        const yearFromCondition = yearFrom ? Prisma.sql`AND v.year >= ${yearFrom}` : Prisma.empty;
        const yearToCondition = yearTo ? Prisma.sql`AND v.year <= ${yearTo}` : Prisma.empty;
        
        // Price range filter
        const priceFromCondition = priceFrom !== undefined ? Prisma.sql`AND v.price >= ${priceFrom}` : Prisma.empty;
        const priceToCondition = priceTo !== undefined ? Prisma.sql`AND v.price <= ${priceTo}` : Prisma.empty;
        
        // Owner filter
        const ownerCondition = ownerId ? Prisma.sql`AND v."ownerId" = ${ownerId}` : Prisma.empty;
        
        // Number of seats filter
        const seatsCondition = numberOfSeats && numberOfSeats.length > 0
          ? Prisma.sql`AND v."numberOfSeats" = ANY(${numberOfSeats}::integer[])`
          : Prisma.empty;
        
        // Gearbox filter
        const gearboxCondition = gearboxTypes && gearboxTypes.length > 0
          ? Prisma.sql`AND v.gearbox = ANY(${gearboxTypes}::text[])`
          : Prisma.empty;
        
        // Steering filter
        const steeringCondition = steeringIds && steeringIds.length > 0
          ? Prisma.sql`AND v."steeringId" = ANY(${steeringIds}::text[])`
          : Prisma.empty;
        
        // Collection filter - needs a subquery since it's a many-to-many relationship
        const collectionCondition = collectionIds && collectionIds.length > 0
          ? Prisma.sql`AND EXISTS (
              SELECT 1 FROM "VehicleCollection" vc 
              WHERE vc."vehicleId" = v.id 
              AND vc."collectionId" = ANY(${collectionIds}::text[])
            )`
          : Prisma.empty;
        
        // Search filter - needs OR logic across multiple fields
        const searchCondition = search && search.trim()
          ? Prisma.sql`AND (
              v.name ILIKE ${`%${search}%`}
              OR v.registration ILIKE ${`%${search}%`}
              OR v.description ILIKE ${`%${search}%`}
              OR EXISTS (SELECT 1 FROM "Make" m WHERE m.id = v."makeId" AND m.name ILIKE ${`%${search}%`})
              OR EXISTS (SELECT 1 FROM "Model" mo WHERE mo.id = v."modelId" AND mo.name ILIKE ${`%${search}%`})
              OR u.email ILIKE ${`%${search}%`}
              OR u."firstName" ILIKE ${`%${search}%`}
              OR u."lastName" ILIKE ${`%${search}%`}
              OR u.phone ILIKE ${`%${search}%`}
            )`
          : Prisma.empty;
        
        // Build ORDER BY clause
        let orderByClause;
        if (sortBy === "distance" || sortByDistance) {
          orderByClause = Prisma.sql`distance ASC`;
        } else if (sortBy === "name") {
          orderByClause = sortOrder === "asc" ? Prisma.sql`v.name ASC` : Prisma.sql`v.name DESC`;
        } else if (sortBy === "price") {
          orderByClause = sortOrder === "asc" ? Prisma.sql`v.price ASC NULLS LAST` : Prisma.sql`v.price DESC NULLS LAST`;
        } else if (sortBy === "year") {
          orderByClause = sortOrder === "asc" ? Prisma.sql`v.year ASC NULLS LAST` : Prisma.sql`v.year DESC NULLS LAST`;
        } else if (sortBy === "updatedAt") {
          orderByClause = sortOrder === "asc" ? Prisma.sql`v."updatedAt" ASC` : Prisma.sql`v."updatedAt" DESC`;
        } else {
          // Default to createdAt
          orderByClause = sortOrder === "asc" ? Prisma.sql`v."createdAt" ASC` : Prisma.sql`v."createdAt" DESC`;
        }
        
        // Execute raw query with PostGIS
        const rawVehicles = await ctx.db.$queryRaw<Array<any>>`
          SELECT 
            v.*,
            (${Prisma.raw(distanceSQL)}) as distance
          FROM "Vehicle" v
          INNER JOIN "User" u ON v."ownerId" = u.id
          WHERE 
            u."latitude" IS NOT NULL 
            AND u."longitude" IS NOT NULL
            AND ${Prisma.raw(dwithinFilter)}
            ${statusCondition}
            ${makeCondition}
            ${modelCondition}
            ${exteriorColorCondition}
            ${interiorColorCondition}
            ${yearFromCondition}
            ${yearToCondition}
            ${priceFromCondition}
            ${priceToCondition}
            ${ownerCondition}
            ${seatsCondition}
            ${gearboxCondition}
            ${steeringCondition}
            ${collectionCondition}
            ${searchCondition}
          ORDER BY ${orderByClause}
          LIMIT ${limit + 1}
          OFFSET ${skip ?? 0}
        `;

        // Fetch related data for each vehicle
        const vehicleIds = rawVehicles.map((v: any) => v.id);
        
        if (vehicleIds.length > 0) {
          const vehiclesWithRelations = await ctx.db.vehicle.findMany({
            where: { id: { in: vehicleIds } },
            include: {
              make: { select: { id: true, name: true } },
              model: { select: { id: true, name: true } },
              owner: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  postcode: true,
                  city: true,
                  latitude: true,
                  longitude: true,
                  country: { select: { id: true, name: true } },
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
              _count: { select: { media: true } },
            },
          });

          // Merge distance data with relations, maintaining order
          const vehicleMap = new Map(vehiclesWithRelations.map(v => [v.id, v]));
          vehicles = rawVehicles.map((rv: any) => {
            const vehicle = vehicleMap.get(rv.id);
            return vehicle ? { ...vehicle, distance: rv.distance } : null;
          }).filter(Boolean);
        } else {
          vehicles = [];
        }
      } else {
        // Standard Prisma query without distance filtering
        vehicles = await ctx.db.vehicle.findMany({
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
                latitude: true,
                longitude: true,
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
      }

      // Determine if there's a next page
      let nextCursor: string | undefined = undefined;
      if (vehicles.length > limit) {
        const nextItem = vehicles.pop(); // Remove the extra item
        nextCursor = nextItem?.id;
      }

      // OPTIMIZATION: Only get total count if requested (expensive query)
      let totalCount: number | undefined = undefined;
      
      if (input.includeTotalCount) {
        if (useDistanceFilter && userLat && userLon && maxDistanceMiles) {
          // Use raw SQL count query with PostGIS distance filter
          const dwithinFilter = getPostGISDWithinFilter(userLat, userLon, maxDistanceMiles, "miles", "u");
          
          // Build WHERE conditions for count query (same as main query)
          const statusCondition = status ? Prisma.sql`AND v.status = ${status}::text::"VehicleStatus"` : Prisma.empty;
          const makeCondition = makeIds && makeIds.length > 0 
            ? Prisma.sql`AND v."makeId" = ANY(${makeIds}::text[])` 
            : makeId 
            ? Prisma.sql`AND v."makeId" = ${makeId}` 
            : Prisma.empty;
          const modelCondition = modelId ? Prisma.sql`AND v."modelId" = ${modelId}` : Prisma.empty;
          
          const exteriorColorCondition = exteriorColors && exteriorColors.length > 0
            ? Prisma.sql`AND v."exteriorColour" = ANY(${exteriorColors}::text[])`
            : Prisma.empty;
          const interiorColorCondition = interiorColors && interiorColors.length > 0
            ? Prisma.sql`AND v."interiorColour" = ANY(${interiorColors}::text[])`
            : Prisma.empty;
          
          const yearFromCondition = yearFrom ? Prisma.sql`AND v.year >= ${yearFrom}` : Prisma.empty;
          const yearToCondition = yearTo ? Prisma.sql`AND v.year <= ${yearTo}` : Prisma.empty;
          
          const priceFromCondition = priceFrom !== undefined ? Prisma.sql`AND v.price >= ${priceFrom}` : Prisma.empty;
          const priceToCondition = priceTo !== undefined ? Prisma.sql`AND v.price <= ${priceTo}` : Prisma.empty;
          
          const ownerCondition = ownerId ? Prisma.sql`AND v."ownerId" = ${ownerId}` : Prisma.empty;
          
          const seatsCondition = numberOfSeats && numberOfSeats.length > 0
            ? Prisma.sql`AND v."numberOfSeats" = ANY(${numberOfSeats}::integer[])`
            : Prisma.empty;
          
          const gearboxCondition = gearboxTypes && gearboxTypes.length > 0
            ? Prisma.sql`AND v.gearbox = ANY(${gearboxTypes}::text[])`
            : Prisma.empty;
          
          const steeringCondition = steeringIds && steeringIds.length > 0
            ? Prisma.sql`AND v."steeringId" = ANY(${steeringIds}::text[])`
            : Prisma.empty;
          
          const collectionCondition = collectionIds && collectionIds.length > 0
            ? Prisma.sql`AND EXISTS (
                SELECT 1 FROM "VehicleCollection" vc 
                WHERE vc."vehicleId" = v.id 
                AND vc."collectionId" = ANY(${collectionIds}::text[])
              )`
            : Prisma.empty;
          
          const searchCondition = search && search.trim()
            ? Prisma.sql`AND (
                v.name ILIKE ${`%${search}%`}
                OR v.registration ILIKE ${`%${search}%`}
                OR v.description ILIKE ${`%${search}%`}
                OR EXISTS (SELECT 1 FROM "Make" m WHERE m.id = v."makeId" AND m.name ILIKE ${`%${search}%`})
                OR EXISTS (SELECT 1 FROM "Model" mo WHERE mo.id = v."modelId" AND mo.name ILIKE ${`%${search}%`})
                OR u.email ILIKE ${`%${search}%`}
                OR u."firstName" ILIKE ${`%${search}%`}
                OR u."lastName" ILIKE ${`%${search}%`}
                OR u.phone ILIKE ${`%${search}%`}
              )`
            : Prisma.empty;
          
          const countResult = await ctx.db.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*) as count
            FROM "Vehicle" v
            INNER JOIN "User" u ON v."ownerId" = u.id
            WHERE 
              u."latitude" IS NOT NULL 
              AND u."longitude" IS NOT NULL
              AND ${Prisma.raw(dwithinFilter)}
              ${statusCondition}
              ${makeCondition}
              ${modelCondition}
              ${exteriorColorCondition}
              ${interiorColorCondition}
              ${yearFromCondition}
              ${yearToCondition}
              ${priceFromCondition}
              ${priceToCondition}
              ${ownerCondition}
              ${seatsCondition}
              ${gearboxCondition}
              ${steeringCondition}
              ${collectionCondition}
              ${searchCondition}
          `;
          
          totalCount = Number(countResult[0]?.count ?? 0);
        } else {
          // Standard Prisma count without distance filtering
          totalCount = await ctx.db.vehicle.count({ where });
        }
      }

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
      // WITH Prisma Accelerate caching for better performance
      const [vehicle, media, sources, specifications, vehicleCollections] = 
        await Promise.all([
          // Main vehicle with simple relations (single query)
          // Cached for 60 seconds (data changes less frequently)
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
                  street: true,
                  city: true,
                  county: true,
                  postcode: true,
                  country: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              steering: true,
            },
            cacheStrategy: { ttl: 60, swr: 30 }, // 1 min cache, 30s stale-while-revalidate
          }),
          
          // Fetch media separately with limit
          // Cached for 2 minutes (images don't change often)
          ctx.db.media.findMany({
            where: { vehicleId: input.id },
            orderBy: { order: "asc" },
            take: 100,
            cacheStrategy: { ttl: 120 }, // 2 minutes
          }),
          
          // Fetch sources separately with limit
          // Cached for 5 minutes (rarely changes)
          ctx.db.vehicleSource.findMany({
            where: { vehicleId: input.id },
            take: 20,
            cacheStrategy: { ttl: 300 }, // 5 minutes
          }),
          
          // Fetch specifications separately with limit
          // Cached for 2 minutes
          ctx.db.vehicleSpecification.findMany({
            where: { vehicleId: input.id },
            orderBy: { category: "asc" },
            take: 200,
            cacheStrategy: { ttl: 120 }, // 2 minutes
          }),
          
          // Fetch collections with nested data
          // Cached for 5 minutes (rarely changes)
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
            cacheStrategy: { ttl: 300 }, // 5 minutes
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
    // WITH Prisma Accelerate caching (5 min TTL)
    const [
      makes,
      collections,
      exteriorColorsData,
      interiorColorsData,
      years,
      statusCounts,
      seatsData,
      gearboxData,
      steeringTypes,
    ] = await Promise.all([
      // Get all makes - Cached by Accelerate
      ctx.db.make.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
        cacheStrategy: { ttl: 300 }, // 5 minutes
      }),

      // Get all collections - Cached by Accelerate
      ctx.db.collection.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
        },
        cacheStrategy: { ttl: 300 }, // 5 minutes
      }),

      // OPTIMIZATION: Use raw SQL for DISTINCT queries (much faster)
      // Note: Raw queries with cacheStrategy require tags
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

      // Get status counts - Cached by Accelerate
      ctx.db.vehicle.groupBy({
        by: ["status"],
        _count: true,
        cacheStrategy: { ttl: 300 }, // 5 minutes
      }),

      // Get distinct number of seats
      ctx.db.$queryRaw<Array<{ numberOfSeats: number }>>`
        SELECT DISTINCT "numberOfSeats"
        FROM "Vehicle"
        WHERE "numberOfSeats" IS NOT NULL
        ORDER BY "numberOfSeats" ASC
      `,

      // Get distinct gearbox types
      ctx.db.$queryRaw<Array<{ gearbox: string }>>`
        SELECT DISTINCT gearbox
        FROM "Vehicle"
        WHERE gearbox IS NOT NULL
        ORDER BY gearbox ASC
      `,

      // Get all steering types
      ctx.db.steeringType.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
        },
        cacheStrategy: { ttl: 300 }, // 5 minutes
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
      statusCounts: statusCounts.map((sc: any) => ({
        status: sc.status as VehicleStatus,
        count: sc._count as number,
      })),
      seats: seatsData
        .map((v) => v.numberOfSeats)
        .filter((s): s is number => s !== null),
      gearboxTypes: gearboxData
        .map((v) => v.gearbox)
        .filter((g): g is string => g !== null),
      steeringTypes,
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
   * Cached with Prisma Accelerate (5 min TTL)
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
        cacheStrategy: { ttl: 300, swr: 60 }, // 5 min cache, 1 min stale-while-revalidate
      });

      return models;
    }),
});

