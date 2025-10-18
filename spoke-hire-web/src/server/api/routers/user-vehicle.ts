/**
 * User Vehicle Router
 * 
 * Handles vehicle-related operations for regular users (non-admin).
 * Users can view their own vehicles.
 * 
 * All procedures require authentication but not admin role.
 */

import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { VehicleStatus } from "@prisma/client";
import { ServiceFactory } from "../services/service-factory";

// ============================================================================
// Input Validation Schemas
// ============================================================================

const listMyVehiclesInputSchema = z.object({
  // Pagination
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),

  // Optional status filter
  status: z.nativeEnum(VehicleStatus).optional(),
  
  // Dev only: Test with different owner ID (requires admin)
  testOwnerId: z.string().optional(),
});

const myVehicleCountsInputSchema = z.object({
  // Dev only: Test with different owner ID (requires admin)
  testOwnerId: z.string().optional(),
});

const updateMyVehicleInputSchema = z.object({
  id: z.string(),
  name: z.string().min(3).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(), // Users can't set DECLINED
  price: z.number().min(0).nullable().optional(),
  year: z.string().optional(),
  registration: z.string().nullable().optional(),
  makeId: z.string().optional(),
  modelId: z.string().optional(),
  engineCapacity: z.number().min(0).nullable().optional(),
  numberOfSeats: z.number().min(1).max(20).nullable().optional(),
  steeringId: z.string().nullable().optional(),
  gearbox: z.string().nullable().optional(),
  exteriorColour: z.string().nullable().optional(),
  interiorColour: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  isRoadLegal: z.boolean().optional(),
  description: z.string().nullable().optional(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const userVehicleRouter = createTRPCRouter({
  /**
   * Get vehicles owned by the current user
   * For dev/testing: admins can pass testOwnerId to view other users' vehicles
   */
  myVehicles: protectedProcedure
    .input(listMyVehiclesInputSchema)
    .query(async ({ ctx, input }): Promise<{ vehicles: any[], nextCursor: string | undefined }> => {
      const { limit, cursor, status, testOwnerId } = input;

      // Determine which user's vehicles to fetch
      // Allow admins to test with different owner IDs in dev mode
      const ownerId = (testOwnerId && ctx.user.userType === 'ADMIN') 
        ? testOwnerId 
        : ctx.user.id;

      // Build where clause
      const where = {
        ownerId,
        ...(status && { status }),
      };

      // Fetch vehicles
      const vehicles = await ctx.db.vehicle.findMany({
        where,
        take: limit + 1, // Take one extra to determine if there are more
        ...(cursor && {
          cursor: {
            id: cursor,
          },
          skip: 1, // Skip the cursor
        }),
        orderBy: {
          createdAt: "desc",
        },
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
              altText: true,
            },
          },
          _count: {
            select: {
              media: true,
            },
          },
        },
      });

      // Check if there are more results
      let nextCursor: string | undefined = undefined;
      if (vehicles.length > limit) {
        const nextItem = vehicles.pop();
        nextCursor = nextItem?.id;
      }

      return {
        vehicles,
        nextCursor,
      };
    }),

  /**
   * Get count of user's vehicles by status
   * For dev/testing: admins can pass testOwnerId to view other users' vehicle counts
   */
  myVehicleCounts: protectedProcedure
    .input(myVehicleCountsInputSchema)
    .query(async ({ ctx, input }): Promise<{ total: number; published: number; draft: number; declined: number; archived: number }> => {
      // Determine which user's vehicles to count
      // Allow admins to test with different owner IDs in dev mode
      const ownerId = (input.testOwnerId && ctx.user.userType === 'ADMIN') 
        ? input.testOwnerId 
        : ctx.user.id;
    
      const [total, published, draft, declined, archived] = await Promise.all([
        ctx.db.vehicle.count({
          where: { ownerId },
        }),
        ctx.db.vehicle.count({
          where: { ownerId, status: "PUBLISHED" },
        }),
        ctx.db.vehicle.count({
          where: { ownerId, status: "DRAFT" },
        }),
        ctx.db.vehicle.count({
          where: { ownerId, status: "DECLINED" },
        }),
        ctx.db.vehicle.count({
          where: { ownerId, status: "ARCHIVED" },
        }),
      ]);

    return {
      total,
      published,
      draft,
      declined,
      archived,
    };
  }),

  /**
   * Get a single vehicle by ID (owner only)
   * Security: Only the vehicle owner can access their vehicle
   * For dev/testing: admins can pass testOwnerId to view any vehicle
   */
  myVehicleById: protectedProcedure
    .input(z.object({
      id: z.string(),
      // Dev only: Test with different owner ID (requires admin)
      testOwnerId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { id, testOwnerId } = input;

      // Determine which user's vehicles to fetch
      // Allow admins to test with different owner IDs in dev mode
      const ownerId = (testOwnerId && ctx.user.userType === 'ADMIN') 
        ? testOwnerId 
        : ctx.user.id;

      // Fetch vehicle with ownership check at DB level
      const vehicle = await ctx.db.vehicle.findFirst({
        where: {
          id,
          ownerId, // ✅ Authorization enforced at DB level
        },
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
          steering: {
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
              phone: true,
            },
          },
          media: {
            where: {
              isVisible: true,
              status: "READY",
            },
            orderBy: [
              { isPrimary: "desc" },
              { order: "asc" },
            ],
            select: {
              id: true,
              type: true,
              originalUrl: true,
              publishedUrl: true,
              isPrimary: true,
              order: true,
              status: true,
              isVisible: true,
            },
          },
          collections: {
            include: {
              collection: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      // If not found, throw error
      if (!vehicle) {
        throw new Error('Vehicle not found or you do not have permission to view it');
      }

      return vehicle;
    }),

  /**
   * Update vehicle (owner only)
   * Security: Only the vehicle owner can update their vehicle
   * Status restrictions: Users cannot set status to DECLINED
   * Supports creating new Make/Model records if string names are provided instead of IDs
   */
  updateMyVehicle: protectedProcedure
    .input(updateMyVehicleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // First verify ownership
      const vehicle = await ctx.db.vehicle.findFirst({
        where: {
          id,
          ownerId: ctx.user.id, // ✅ Authorization enforced
        },
      });

      if (!vehicle) {
        throw new Error('Vehicle not found or you do not have permission to edit it');
      }

      // Helper function to check if a string is a UUID
      const isUUID = (str: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
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
      let finalMakeId = data.makeId ?? vehicle.makeId;
      if (data.makeId && !isUUID(data.makeId)) {
        // User provided a make name, not an ID - create or find make
        const makeName = data.makeId.trim();
        
        // Check if make already exists (case-insensitive)
        let make = await ctx.db.make.findFirst({
          where: { 
            name: { 
              equals: makeName,
              mode: 'insensitive'
            } 
          },
        });

        // Create new make if it doesn't exist
        if (!make) {
          make = await ctx.db.make.create({
            data: {
              name: makeName,
              slug: generateSlug(makeName),
              isActive: true,
            },
          });
        }
        
        finalMakeId = make.id;
      }

      // Process modelId - create new model if string name provided
      let finalModelId = data.modelId ?? vehicle.modelId;
      if (data.modelId && !isUUID(data.modelId)) {
        // User provided a model name, not an ID - create or find model
        const modelName = data.modelId.trim();
        
        // Check if model already exists for this make (case-insensitive)
        let model = await ctx.db.model.findFirst({
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
          model = await ctx.db.model.create({
            data: {
              name: modelName,
              slug: generateSlug(modelName),
              makeId: finalMakeId,
              isActive: true,
            },
          });
        }
        
        finalModelId = model.id;
      }

      // Validate make/model relationship
      if (finalMakeId && finalModelId) {
        const model = await ctx.db.model.findUnique({
          where: { id: finalModelId },
          select: { makeId: true },
        });

        if (!model || model.makeId !== finalMakeId) {
          throw new Error("Invalid make/model combination");
        }
      }

      // Update vehicle with final IDs
      const updatedVehicle = await ctx.db.vehicle.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.price !== undefined && { price: data.price }),
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
          steering: { select: { id: true, name: true } },
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          media: {
            where: { isVisible: true, status: "READY" },
            orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
          },
          collections: {
            include: {
              collection: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      });

      return updatedVehicle;
    }),

  /**
   * Get list of users who own vehicles (for testing/dev purposes)
   * Only accessible by admins
   */
  getUsersWithVehicles: protectedProcedure
    .query(async ({ ctx }) => {
      // Only admins can access this
      if (ctx.user.userType !== 'ADMIN') {
        throw new Error('Admin access required');
      }

      // Get users who have vehicles
      const usersWithVehicles = await ctx.db.user.findMany({
        where: {
          vehicles: {
            some: {},
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          _count: {
            select: {
              vehicles: true,
            },
          },
        },
        orderBy: {
          email: 'asc',
        },
      });

      return usersWithVehicles;
    }),

  /**
   * Get filter options (makes, models, years, colors, etc.)
   * Used by user vehicle editing forms
   */
  getFilterOptions: protectedProcedure.query(async ({ ctx }) => {
    const service = ServiceFactory.createLookupService(ctx.db);
    return await service.getFilterOptions();
  }),

  /**
   * Get models by make ID
   * Used when user selects a make in vehicle forms
   */
  getModelsByMake: protectedProcedure
    .input(z.object({ makeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createLookupService(ctx.db);
      return await service.getModelsByMake(input.makeId);
    }),
});

