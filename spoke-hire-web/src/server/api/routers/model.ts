/**
 * Model Router
 * 
 * Handles all vehicle model-related operations for the admin interface.
 * All procedures require admin authentication.
 */

import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { ServiceFactory } from "../services/service-factory";

// ============================================================================
// Input Validation Schemas
// ============================================================================

const listModelsInputSchema = z.object({
  // Pagination
  limit: z.number().min(1).max(1000).default(30), // Allow up to 1000 for dropdown filters
  skip: z.number().min(0).default(0),

  // Search
  search: z.string().optional(),

  // Filters
  makeId: z.string().optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),

  // Sorting
  sortBy: z.enum(["name", "makeName", "createdAt", "updatedAt", "vehicleCount"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),

  // Performance
  includeTotalCount: z.boolean().default(false),
});

const getModelByIdInputSchema = z.object({
  id: z.string(),
});

const createModelInputSchema = z.object({
  makeId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(true),
});

const updateModelInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
});

const mergeModelsInputSchema = z.object({
  primaryModelId: z.string(),
  secondaryModelIds: z.array(z.string()).min(1, "At least one secondary model is required"),
});

const deleteModelInputSchema = z.object({
  id: z.string(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const modelRouter = createTRPCRouter({
  /**
   * List models with pagination, filters, and search
   */
  list: adminProcedure
    .input(listModelsInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createModelService(ctx.db);
      return await service.listModels(input);
    }),

  /**
   * Get a single model by ID
   */
  getById: adminProcedure
    .input(getModelByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createModelService(ctx.db);
      const model = await service.getModelById(input.id);

      if (!model) {
        throw new Error("Model not found");
      }

      return model;
    }),

  /**
   * Create a new model
   */
  create: adminProcedure
    .input(createModelInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createModelService(ctx.db);
      return await service.createModel(input);
    }),

  /**
   * Update a model
   */
  update: adminProcedure
    .input(updateModelInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createModelService(ctx.db);
      return await service.updateModel(input);
    }),

  /**
   * Merge multiple models into a primary model
   */
  merge: adminProcedure
    .input(mergeModelsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createModelService(ctx.db);
      return await service.mergeModels(input);
    }),

  /**
   * Delete a model (only if it has no vehicles)
   */
  delete: adminProcedure
    .input(deleteModelInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createModelService(ctx.db);
      await service.deleteModel(input.id);
      return { success: true };
    }),
});

