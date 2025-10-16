/**
 * Media Router
 * 
 * Handles vehicle media operations:
 * - Reorder images (drag-and-drop support)
 * - Delete images (from DB and storage)
 * - Create media records after upload
 * 
 * Uses ServiceFactory for consistent service creation.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ServiceFactory } from "~/server/api/services/service-factory";

/**
 * Input validation schemas
 */
const reorderImagesInputSchema = z.object({
  vehicleId: z.string().cuid(),
  imageUpdates: z.array(
    z.object({
      id: z.string().cuid(),
      order: z.number().int().positive(),
    })
  ).min(1),
});

const deleteImageInputSchema = z.object({
  imageId: z.string().cuid(),
  vehicleId: z.string().cuid(),
});

const createMediaInputSchema = z.object({
  vehicleId: z.string().cuid(),
  filename: z.string().min(1),
  publishedUrl: z.string().url(),
  fileSize: z.bigint().optional(),
  mimeType: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().optional(),
});

const getVehicleImagesInputSchema = z.object({
  vehicleId: z.string().cuid(),
});

/**
 * Media Router
 */
export const mediaRouter = createTRPCRouter({
  /**
   * Reorder images for a vehicle
   * Automatically sets first image (order=1) as primary
   */
  reorderImages: protectedProcedure
    .input(reorderImagesInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createMediaService(ctx.db);
      return await service.reorderImages(input, ctx.user);
    }),

  /**
   * Delete an image from database and Supabase storage
   */
  deleteImage: protectedProcedure
    .input(deleteImageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createMediaService(ctx.db);
      return await service.deleteImage(input, ctx.user);
    }),

  /**
   * Create a media record after successful upload
   */
  createMedia: protectedProcedure
    .input(createMediaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createMediaService(ctx.db);
      return await service.createMediaRecord(input, ctx.user);
    }),

  /**
   * Get all images for a vehicle
   */
  getVehicleImages: protectedProcedure
    .input(getVehicleImagesInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createMediaService(ctx.db);
      return await service.getVehicleImages(input.vehicleId, ctx.user);
    }),
});

