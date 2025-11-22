/**
 * Make Router
 * 
 * Handles all vehicle make-related operations for the admin interface.
 * All procedures require admin authentication.
 */

import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { ServiceFactory } from "../services/service-factory";

// ============================================================================
// Input Validation Schemas
// ============================================================================

const listMakesInputSchema = z.object({
  // Pagination
  limit: z.number().min(1).max(1000).default(30), // Allow up to 1000 for dropdown filters
  skip: z.number().min(0).default(0),

  // Search
  search: z.string().optional(),

  // Filters
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),

  // Sorting
  sortBy: z.enum(["name", "createdAt", "updatedAt", "vehicleCount"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),

  // Performance
  includeTotalCount: z.boolean().default(false),
});

const getMakeByIdInputSchema = z.object({
  id: z.string(),
});

const createMakeInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(true),
});

const updateMakeInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
});

const mergeMakesInputSchema = z.object({
  primaryMakeId: z.string(),
  secondaryMakeIds: z.array(z.string()).min(1, "At least one secondary make is required"),
});

const deleteMakeInputSchema = z.object({
  id: z.string(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const makeRouter = createTRPCRouter({
  /**
   * List makes with pagination, filters, and search
   */
  list: adminProcedure
    .input(listMakesInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createMakeService(ctx.db);
      return await service.listMakes(input);
    }),

  /**
   * Get a single make by ID
   */
  getById: adminProcedure
    .input(getMakeByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createMakeService(ctx.db);
      const make = await service.getMakeById(input.id);

      if (!make) {
        throw new Error("Make not found");
      }

      return make;
    }),

  /**
   * Create a new make
   */
  create: adminProcedure
    .input(createMakeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createMakeService(ctx.db);
      return await service.createMake(input);
    }),

  /**
   * Update a make
   */
  update: adminProcedure
    .input(updateMakeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createMakeService(ctx.db);
      return await service.updateMake(input);
    }),

  /**
   * Merge multiple makes into a primary make
   */
  merge: adminProcedure
    .input(mergeMakesInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createMakeService(ctx.db);
      return await service.mergeMakes(input);
    }),

  /**
   * Delete a make (only if it has no vehicles)
   */
  delete: adminProcedure
    .input(deleteMakeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createMakeService(ctx.db);
      await service.deleteMake(input.id);
      return { success: true };
    }),
});

