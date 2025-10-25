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
import { geocodePostcode } from "~/lib/services/geocoding";
import { generateVehicleName } from "~/lib/vehicle-name-generator";

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
}).optional().default({});

const updateMyVehicleInputSchema = z.object({
  id: z.string(),
  name: z.string().min(3).optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(), // Users can edit IN_REVIEW vehicles but can't set DECLINED
  price: z.number().min(1, "Agreed value must be greater than 0").optional(),
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
  collectionIds: z.array(z.string()).optional(),
});

const createMyVehicleInputSchema = z.object({
  makeId: z.string().min(1, "Make is required"),
  modelId: z.string().min(1, "Model is required"),
  name: z.string().min(3, "Vehicle name must be at least 3 characters"),
  year: z.string().min(1, "Year is required"),
  registration: z.string().min(1, "Registration is required"),
  price: z.number().min(1, "Agreed value is required and must be greater than 0"),
  exteriorColour: z.string().min(1, "Exterior colour is required"),
  interiorColour: z.string().min(1, "Interior colour is required"),
  gearbox: z.string().min(1, "Gearbox is required"),
  engineCapacity: z.number().min(1, "Engine capacity is required"),
  numberOfSeats: z.number().min(1).max(20, "Number of seats must be between 1 and 20"),
  steeringId: z.string().min(1, "Steering type is required"),
  condition: z.string().min(1, "Condition is required"),
  isRoadLegal: z.boolean().default(true),
  description: z.string().optional(),
  collectionIds: z.array(z.string()).optional(),
});

const updateMyProfileInputSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  street: z.string().optional(),
  city: z.string().min(1, "City is required").optional(),
  county: z.string().optional(),
  postcode: z.string().min(1, "Postcode is required").optional(),
  countryId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const lookupPostcodeInputSchema = z.object({
  postcode: z.string().min(1, "Postcode is required"),
});

const checkRegistrationInputSchema = z.object({
  registration: z.string().min(1, "Registration is required"),
  excludeVehicleId: z.string().optional(),
});

const generateVehicleContentInputSchema = z.object({
  makeId: z.string().min(1, "Make is required"),
  modelId: z.string().min(1, "Model is required"),
  year: z.string().min(1, "Year is required"),
  engineCapacity: z.number().min(1, "Engine capacity is required"),
  numberOfSeats: z.number().min(1).max(20, "Number of seats must be between 1 and 20"),
  steeringId: z.string().min(1, "Steering type is required"),
  gearbox: z.string().min(1, "Gearbox is required"),
  exteriorColour: z.string().min(1, "Exterior colour is required"),
  interiorColour: z.string().min(1, "Interior colour is required"),
  isRoadLegal: z.boolean(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a string is a database ID (cUID or UUID format)
 * Used to determine if makeId/modelId is an actual ID or a user-entered name
 */
function isId(str: string): boolean {
  return str.length === 25 || str.includes('-');
}

/**
 * Generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
      // When no status is provided, exclude archived vehicles (show all active)
      const where = {
        ownerId,
        ...(status 
          ? { status } 
          : { status: { not: VehicleStatus.ARCHIVED } }
        ),
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
          updatedAt: "desc",
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
    
      // Count vehicles by status
      // Total excludes archived to match the "Active" filter
      const [total, published, draft, declined, archived] = await Promise.all([
        ctx.db.vehicle.count({
          where: { 
            ownerId,
            status: { not: VehicleStatus.ARCHIVED }
          },
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
   * Validates IDs or creates new Make/Model from names
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

      // Helper to check if string is a cUID (25 chars) or UUID (with dashes)
      const isId = (str: string): boolean => {
        return str.length === 25 || str.includes('-');
      };

      // Helper to generate slug from name
      const generateSlug = (name: string): string => {
        return name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };

      // Process makeId if provided - validate if ID, create if name
      let finalMakeId = vehicle.makeId; // Default to existing
      if (data.makeId) {
        if (isId(data.makeId)) {
          // It's an ID - validate it exists
          const make = await ctx.db.make.findUnique({
            where: { id: data.makeId },
          });
          
          if (!make) {
            throw new Error(`Make not found. Please select a valid make from the list.`);
          }
          finalMakeId = make.id;
        } else {
          // It's a name - create or find it
          const makeName = data.makeId.trim();
          
          let make = await ctx.db.make.findFirst({
            where: { 
              name: { 
                equals: makeName,
                mode: 'insensitive'
              } 
            },
          });

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
      }

      // Process modelId if provided - validate if ID, create if name
      let finalModelId = vehicle.modelId; // Default to existing
      if (data.modelId) {
        if (isId(data.modelId)) {
          // It's an ID - validate it exists
          const model = await ctx.db.model.findUnique({
            where: { id: data.modelId },
          });
          
          if (!model) {
            throw new Error(`Model not found. Please select a valid model from the list.`);
          }
          
          if (model.makeId !== finalMakeId) {
            throw new Error(`The selected model does not belong to the selected make.`);
          }
          
          finalModelId = model.id;
        } else {
          // It's a name - create or find it
          const modelName = data.modelId.trim();
          
          let model = await ctx.db.model.findFirst({
            where: { 
              name: { 
                equals: modelName,
                mode: 'insensitive'
              },
              makeId: finalMakeId,
            },
          });

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
      }

      // Auto-regenerate vehicle name if make, model, or year changed
      let finalName = data.name;
      const didMakeModelYearChange = 
        (data.makeId && finalMakeId !== vehicle.makeId) ||
        (data.modelId && finalModelId !== vehicle.modelId) ||
        (data.year && data.year !== vehicle.year);

      if (didMakeModelYearChange) {
        // Fetch the names to generate new vehicle name
        const make = await ctx.db.make.findUnique({
          where: { id: finalMakeId },
          select: { name: true },
        });
        
        const model = await ctx.db.model.findUnique({
          where: { id: finalModelId },
          select: { name: true },
        });
        
        const year = data.year ?? vehicle.year;
        
        if (make && model) {
          finalName = generateVehicleName(year, make.name, model.name);
        }
      }

      // Check registration uniqueness if registration is being updated
      if (data.registration !== undefined && data.registration !== null && data.registration !== vehicle.registration) {
        const existingVehicleWithReg = await ctx.db.vehicle.findFirst({
          where: {
            registration: {
              equals: data.registration,
              mode: "insensitive",
            },
            id: {
              not: id, // Exclude current vehicle
            },
          },
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        });

        if (existingVehicleWithReg) {
          const isOwnVehicle = existingVehicleWithReg.ownerId === ctx.user.id;
          throw new Error(
            JSON.stringify({
              code: "REGISTRATION_EXISTS",
              vehicleId: existingVehicleWithReg.id,
              vehicleName: existingVehicleWithReg.name,
              isOwnVehicle,
            })
          );
        }
      }

      // Update vehicle with final IDs
      const updatedVehicle = await ctx.db.vehicle.update({
        where: { id },
        data: {
          ...(finalName !== undefined && { name: finalName }),
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

      // Update collections if provided
      if (data.collectionIds !== undefined) {
        // Delete existing collections
        await ctx.db.vehicleCollection.deleteMany({
          where: { vehicleId: id },
        });

        // Create new collections
        if (data.collectionIds.length > 0) {
          await ctx.db.vehicleCollection.createMany({
            data: data.collectionIds.map(collectionId => ({
              vehicleId: id,
              collectionId: collectionId,
            })),
            skipDuplicates: true,
          });
        }
      }

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

  /**
   * Create a new vehicle owned by the current user
   * Vehicle starts in DRAFT status
   * Validates IDs or creates new Make/Model from names
   */
  createMyVehicle: protectedProcedure
    .input(createMyVehicleInputSchema)
    .mutation(async ({ ctx, input }) => {

      // Process makeId - validate if ID, create if name
      let finalMakeId: string;
      if (isId(input.makeId)) {
        // It's an ID - validate it exists
        const make = await ctx.db.make.findUnique({
          where: { id: input.makeId },
        });
        
        if (!make) {
          throw new Error(`Make not found. Please select a valid make from the list.`);
        }
        finalMakeId = make.id;
      } else {
        // It's a name - create or find it
        const makeName = input.makeId.trim();
        
        let make = await ctx.db.make.findFirst({
          where: { 
            name: { 
              equals: makeName,
              mode: 'insensitive'
            } 
          },
        });

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

      // Process modelId - validate if ID, create if name
      let finalModelId: string;
      if (isId(input.modelId)) {
        // It's an ID - validate it exists
        const model = await ctx.db.model.findUnique({
          where: { id: input.modelId },
        });
        
        if (!model) {
          throw new Error(`Model not found. Please select a valid model from the list.`);
        }
        
        if (model.makeId !== finalMakeId) {
          throw new Error(`The selected model does not belong to the selected make.`);
        }
        
        finalModelId = model.id;
      } else {
        // It's a name - create or find it
        const modelName = input.modelId.trim();
        
        let model = await ctx.db.model.findFirst({
          where: { 
            name: { 
              equals: modelName,
              mode: 'insensitive'
            },
            makeId: finalMakeId,
          },
        });

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

      // Check registration uniqueness
      // Check 1: User's own vehicles (ALL statuses)
      const ownVehicleWithReg = await ctx.db.vehicle.findFirst({
        where: {
          registration: {
            equals: input.registration,
            mode: "insensitive",
          },
          ownerId: ctx.user.id,
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
      const otherVehicleWithReg = await ctx.db.vehicle.findFirst({
        where: {
          registration: {
            equals: input.registration,
            mode: "insensitive",
          },
          ownerId: {
            not: ctx.user.id,
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

      // Create the vehicle
      const vehicle = await ctx.db.vehicle.create({
        data: {
          name: input.name,
          makeId: finalMakeId,
          modelId: finalModelId,
          year: input.year,
          registration: input.registration,
          price: input.price,
          exteriorColour: input.exteriorColour,
          interiorColour: input.interiorColour,
          gearbox: input.gearbox,
          engineCapacity: input.engineCapacity,
          numberOfSeats: input.numberOfSeats,
          steeringId: input.steeringId,
          condition: input.condition,
          isRoadLegal: input.isRoadLegal,
          description: input.description ?? null,
          status: "DRAFT",
          ownerId: ctx.user.id,
        },
        include: {
          make: { select: { id: true, name: true } },
          model: { select: { id: true, name: true } },
          steering: { select: { id: true, name: true } },
          owner: { 
            select: { 
              id: true, 
              email: true, 
              firstName: true, 
              lastName: true 
            } 
          },
        },
      });

      // Assign collections if provided
      if (input.collectionIds && input.collectionIds.length > 0) {
        await ctx.db.vehicleCollection.createMany({
          data: input.collectionIds.map(collectionId => ({
            vehicleId: vehicle.id,
            collectionId: collectionId,
          })),
          skipDuplicates: true,
        });
      }

      return vehicle;
    }),

  /**
   * Update current user's profile
   * Sets profileCompleted to true when required fields are present
   */
  updateMyProfile: protectedProcedure
    .input(updateMyProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if profile will be complete after this update
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          city: true,
          postcode: true,
        },
      });

      if (!currentUser) {
        throw new Error("User not found");
      }

      // Determine final values after update
      const finalFirstName = input.firstName ?? currentUser.firstName;
      const finalLastName = input.lastName ?? currentUser.lastName;
      const finalPhone = input.phone ?? currentUser.phone;
      const finalCity = input.city ?? currentUser.city;
      const finalPostcode = input.postcode ?? currentUser.postcode;

      // Check if all required fields will be present
      const profileCompleted = Boolean(
        finalFirstName && 
        finalLastName && 
        finalPhone && 
        finalCity && 
        finalPostcode
      );

      // Update user profile
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: {
          ...(input.firstName !== undefined && { firstName: input.firstName }),
          ...(input.lastName !== undefined && { lastName: input.lastName }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.street !== undefined && { street: input.street }),
          ...(input.city !== undefined && { city: input.city }),
          ...(input.county !== undefined && { county: input.county }),
          ...(input.postcode !== undefined && { postcode: input.postcode }),
          ...(input.countryId !== undefined && { countryId: input.countryId || null }),
          ...(input.latitude !== undefined && { 
            latitude: input.latitude,
            geoUpdatedAt: new Date(),
            geoSource: "postcodes.io",
          }),
          ...(input.longitude !== undefined && { longitude: input.longitude }),
          profileCompleted,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          street: true,
          city: true,
          county: true,
          postcode: true,
          countryId: true,
          profileCompleted: true,
        },
      });

      return updatedUser;
    }),

  /**
   * Lookup postcode to get address and geo data
   * Uses postcodes.io API via geocoding service
   */
  lookupPostcode: protectedProcedure
    .input(lookupPostcodeInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        const result = await geocodePostcode(input.postcode);
        
        // For London postcodes, use region as city (e.g., "London")
        // For other postcodes, use admin_district as city (e.g., "Sevenoaks")
        const city = result.region === "London" 
          ? "London" 
          : (result.adminDistrict ?? "");
        
        // For London, use region as county; otherwise use admin_county
        const county = result.region === "London" 
          ? "London" 
          : (result.adminCounty ?? "");
        
        // Look up country ID from the database
        const country = await ctx.db.country.findFirst({
          where: { 
            name: { 
              equals: result.country,
              mode: "insensitive"
            }
          },
          select: { id: true }
        });
        
        return {
          success: true,
          data: {
            postcode: result.postcode,
            city,
            county,
            latitude: result.latitude,
            longitude: result.longitude,
            country: result.country,
            countryId: country?.id ?? null,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to lookup postcode",
        };
      }
    }),

  /**
   * Check if a registration number is available
   * Used for validation before creating/updating vehicles
   */
  checkRegistration: protectedProcedure
    .input(checkRegistrationInputSchema)
    .query(async ({ ctx, input }) => {
      // Check 1: User's own vehicles (ALL statuses)
      const ownVehicleWhere: {
        registration: { equals: string; mode: "insensitive" };
        ownerId: string;
        id?: { not: string };
      } = {
        registration: {
          equals: input.registration,
          mode: "insensitive",
        },
        ownerId: ctx.user.id,
      };

      // Exclude specific vehicle if provided (for edit scenarios)
      if (input.excludeVehicleId) {
        ownVehicleWhere.id = { not: input.excludeVehicleId };
      }

      const ownVehicle = await ctx.db.vehicle.findFirst({
        where: ownVehicleWhere,
        select: {
          id: true,
          name: true,
          ownerId: true,
          registration: true,
          status: true,
        },
      });

      if (ownVehicle) {
        return {
          available: false,
          existingVehicle: {
            id: ownVehicle.id,
            name: ownVehicle.name,
            ownerId: ownVehicle.ownerId,
            isOwnVehicle: true,
            status: ownVehicle.status,
          },
        };
      }

      // Check 2: Other users' vehicles (PUBLISHED only)
      const otherVehicle = await ctx.db.vehicle.findFirst({
        where: {
          registration: {
            equals: input.registration,
            mode: "insensitive",
          },
          ownerId: {
            not: ctx.user.id,
          },
          status: "PUBLISHED",
        },
        select: {
          id: true,
          name: true,
          ownerId: true,
          registration: true,
          status: true,
        },
      });

      if (otherVehicle) {
        return {
          available: false,
          existingVehicle: {
            id: otherVehicle.id,
            name: otherVehicle.name,
            ownerId: otherVehicle.ownerId,
            isOwnVehicle: false,
            status: otherVehicle.status,
          },
        };
      }

      return {
        available: true,
      };
    }),

  /**
   * Generate AI-powered vehicle name and description
   * Uses Google Gemini to create marketing content
   * Handles both existing IDs and new make/model names
   */
  generateVehicleContent: protectedProcedure
    .input(generateVehicleContentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const aiService = ServiceFactory.createAIVehicleGeneratorService();

      // Resolve make name - handle both ID and name string
      let makeName: string;
      if (isId(input.makeId)) {
        // It's an ID - look it up in database
        const make = await ctx.db.make.findUnique({
          where: { id: input.makeId },
          select: { name: true },
        });
        if (!make) {
          throw new Error("Invalid make ID");
        }
        makeName = make.name;
      } else {
        // It's a name string - use directly
        makeName = input.makeId.trim();
      }

      // Resolve model name - handle both ID and name string
      let modelName: string;
      if (isId(input.modelId)) {
        // It's an ID - look it up in database
        const model = await ctx.db.model.findUnique({
          where: { id: input.modelId },
          select: { name: true },
        });
        if (!model) {
          throw new Error("Invalid model ID");
        }
        modelName = model.name;
      } else {
        // It's a name string - use directly
        modelName = input.modelId.trim();
      }

      // Resolve steering name - always an ID
      const steering = await ctx.db.steeringType.findUnique({
        where: { id: input.steeringId },
        select: { name: true },
      });

      if (!steering) {
        throw new Error("Invalid steering type ID");
      }

      // Get user's city for location
      const userCity = ctx.user.city ?? "UK";

      // Prepare data for AI generation
      const vehicleData = {
        make: makeName,
        model: modelName,
        year: input.year,
        engineCapacity: input.engineCapacity,
        numberOfSeats: input.numberOfSeats,
        steering: steering.name,
        gearbox: input.gearbox,
        exteriorColour: input.exteriorColour,
        interiorColour: input.interiorColour,
        isRoadLegal: input.isRoadLegal,
        location: userCity,
      };

      // Generate content
      const generated = await aiService.generateVehicleContent(vehicleData);

      return generated;
    }),

  /**
   * Submit vehicle for review (DRAFT/DECLINED → IN_REVIEW)
   * Validates vehicle has all required fields and photos
   */
  submitForReview: protectedProcedure
    .input(z.object({ vehicleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const statusService = ServiceFactory.createVehicleStatusService(ctx.db);

      // Verify ownership
      const vehicle = await ctx.db.vehicle.findUnique({
        where: { id: input.vehicleId },
        select: { ownerId: true, status: true },
      });

      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      if (vehicle.ownerId !== ctx.user.id) {
        throw new Error("You don't have permission to modify this vehicle");
      }

      // Change status to IN_REVIEW (service validates and sends emails)
      await statusService.changeVehicleStatus(
        input.vehicleId,
        "IN_REVIEW",
        ctx.user.id,
        false // isAdmin
      );

      return { success: true };
    }),

  /**
   * Archive vehicle (any status → ARCHIVED)
   */
  archiveMyVehicle: protectedProcedure
    .input(z.object({ vehicleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const statusService = ServiceFactory.createVehicleStatusService(ctx.db);

      // Verify ownership
      const vehicle = await ctx.db.vehicle.findUnique({
        where: { id: input.vehicleId },
        select: { ownerId: true },
      });

      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      if (vehicle.ownerId !== ctx.user.id) {
        throw new Error("You don't have permission to modify this vehicle");
      }

      // Change status to ARCHIVED
      await statusService.changeVehicleStatus(
        input.vehicleId,
        "ARCHIVED",
        ctx.user.id,
        false // isAdmin
      );

      return { success: true };
    }),

  /**
   * Get validation errors for a vehicle
   * Used to show user what's missing before they can submit for review
   */
  getValidationErrors: protectedProcedure
    .input(z.object({ vehicleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const statusService = ServiceFactory.createVehicleStatusService(ctx.db);

      // Verify ownership
      const vehicle = await ctx.db.vehicle.findUnique({
        where: { id: input.vehicleId },
        select: { ownerId: true },
      });

      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      if (vehicle.ownerId !== ctx.user.id) {
        throw new Error("You don't have permission to view this vehicle");
      }

      const errors = await statusService.getValidationErrors(input.vehicleId);
      return { errors };
    }),
});

