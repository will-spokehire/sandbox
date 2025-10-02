import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { VehicleStatus } from "@prisma/client";

/**
 * Vehicle Router
 * 
 * Handles all vehicle-related operations for the admin interface.
 * All procedures require admin authentication.
 */

// Input validation schemas
const listVehiclesInputSchema = z.object({
  // Pagination
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(), // Vehicle ID for cursor-based pagination
  
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

      // Get total count for statistics (optional, can be expensive)
      const totalCount = await ctx.db.vehicle.count({ where });

      return {
        vehicles,
        nextCursor,
        totalCount,
      };
    }),

  /**
   * Get a single vehicle by ID with full details
   */
  getById: adminProcedure
    .input(getByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const vehicle = await ctx.db.vehicle.findUnique({
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
          media: {
            orderBy: { order: "asc" },
          },
          sources: true,
          specifications: {
            orderBy: { category: "asc" },
          },
          collections: {
            include: {
              collection: true,
            },
          },
        },
      });

      if (!vehicle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vehicle not found",
        });
      }

      return vehicle;
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

      return deletedVehicle;
    }),

  /**
   * Get filter options (makes, models, years, etc.)
   */
  getFilterOptions: adminProcedure.query(async ({ ctx }) => {
    // Get all makes
    const makes = await ctx.db.make.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    // Get all collections
    const collections = await ctx.db.collection.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    // Get unique exterior colors
    const exteriorColorsData = await ctx.db.vehicle.findMany({
      where: {
        exteriorColour: { not: null },
      },
      distinct: ["exteriorColour"],
      select: { exteriorColour: true },
      orderBy: { exteriorColour: "asc" },
    });
    const exteriorColors = exteriorColorsData
      .map((v) => v.exteriorColour)
      .filter((c): c is string => c !== null);

    // Get unique interior colors
    const interiorColorsData = await ctx.db.vehicle.findMany({
      where: {
        interiorColour: { not: null },
      },
      distinct: ["interiorColour"],
      select: { interiorColour: true },
      orderBy: { interiorColour: "asc" },
    });
    const interiorColors = interiorColorsData
      .map((v) => v.interiorColour)
      .filter((c): c is string => c !== null);

    // Get unique years
    const years = await ctx.db.vehicle.findMany({
      distinct: ["year"],
      orderBy: { year: "desc" },
      select: { year: true },
    });

    // Get status counts
    const statusCounts = await ctx.db.vehicle.groupBy({
      by: ["status"],
      _count: true,
    });

    return {
      makes,
      collections,
      exteriorColors,
      interiorColors,
      years: years.map((v) => v.year),
      statusCounts: statusCounts.map((sc) => ({
        status: sc.status,
        count: sc._count,
      })),
    };
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

