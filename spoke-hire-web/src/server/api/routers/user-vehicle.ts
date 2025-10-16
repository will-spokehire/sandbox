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
});

