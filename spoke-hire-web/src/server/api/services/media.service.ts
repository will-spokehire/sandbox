/**
 * Media Service
 * 
 * Business logic for vehicle media management:
 * - Reorder images with automatic primary assignment
 * - Delete images from database and storage
 * - Create media records after upload
 * 
 * Uses dependency injection pattern with MediaRepository
 */

import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MediaRepository } from "../repositories/media.repository";
import { type CacheService, CacheKeys } from "./cache.service";
import type {
  ReorderImagesInput,
  DeleteImageInput,
  CreateMediaInput,
} from "~/server/types";
import type { Media, User } from "@prisma/client";

const BUCKET_NAME = "vehicle-images";

/**
 * Media Service Class
 */
export class MediaService {
  constructor(
    private repository: MediaRepository,
    private supabaseClient: SupabaseClient,
    private cache: CacheService,
    private db: any // DbClient type
  ) {}

  /**
   * Validate that a user owns a vehicle or is an admin
   */
  private async validateVehicleOwnership(
    vehicleId: string,
    user: User
  ): Promise<void> {
    const vehicle = await this.db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { ownerId: true },
    });

    if (!vehicle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vehicle not found",
      });
    }

    // Admins can edit any vehicle's images
    if (user.userType === "ADMIN") {
      return;
    }

    // Non-admins must own the vehicle
    if (vehicle.ownerId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to modify this vehicle's images",
      });
    }
  }

  /**
   * Reorder images for a vehicle
   * Automatically sets first image (order=1) as primary
   */
  async reorderImages(
    params: ReorderImagesInput,
    user: User
  ): Promise<{ success: boolean; updatedCount: number }> {
    const { vehicleId, imageUpdates } = params;

    // Validate ownership
    await this.validateVehicleOwnership(vehicleId, user);

    // Validate that all images belong to this vehicle
    const vehicleImages = await this.repository.getVehicleImages(vehicleId);
    const vehicleImageIds = new Set(vehicleImages.map((img) => img.id));

    for (const update of imageUpdates) {
      if (!vehicleImageIds.has(update.id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Image ${update.id} does not belong to vehicle ${vehicleId}`,
        });
      }
    }

    // Determine which image should be primary (order = 1)
    const sortedUpdates = [...imageUpdates].sort((a, b) => a.order - b.order);
    const primaryImageId = sortedUpdates[0]?.id;

    // Prepare batch updates with isPrimary flags
    const batchUpdates = imageUpdates.map((update) => ({
      id: update.id,
      order: update.order,
      isPrimary: update.id === primaryImageId,
    }));

    // Execute batch update
    await this.repository.batchUpdateOrders(batchUpdates);

    // Invalidate vehicle cache to ensure fresh data on next fetch
    this.cache.delete(CacheKeys.vehicleDetail(vehicleId));
    this.cache.invalidateByPattern("vehicle:list:");

    return {
      success: true,
      updatedCount: batchUpdates.length,
    };
  }

  /**
   * Delete an image from database and Supabase storage
   */
  async deleteImage(
    params: DeleteImageInput,
    user: User
  ): Promise<{ success: boolean; deletedImageId: string }> {
    const { imageId, vehicleId } = params;

    // Validate ownership
    await this.validateVehicleOwnership(vehicleId, user);

    // Get the image to verify it belongs to the vehicle
    const image = await this.repository.getMediaById(imageId);

    if (!image) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Image not found",
      });
    }

    if (image.vehicleId !== vehicleId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Image does not belong to the specified vehicle",
      });
    }

    // Extract storage path from publishedUrl or construct it
    let storagePath: string | null = null;
    if (image.publishedUrl) {
      // Extract path from URL (format: https://.../storage/v1/object/public/vehicle-images/vehicles/...)
      const urlParts = image.publishedUrl.split("/vehicle-images/");
      if (urlParts.length > 1) {
        storagePath = urlParts[1]!;
      }
    }

    // If we couldn't extract path, construct it from vehicleId and filename
    if (!storagePath) {
      const sanitizedFilename = this.sanitizeFilename(image.filename);
      storagePath = `vehicles/${vehicleId}/${sanitizedFilename}`;
    }

    // Delete from Supabase storage
    try {
      const { error: storageError } = await this.supabaseClient.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (storageError) {
        console.error("Failed to delete from Supabase storage:", storageError);
        // Continue with database deletion even if storage deletion fails
      }
    } catch (error) {
      console.error("Error deleting from Supabase storage:", error);
      // Continue with database deletion
    }

    // Delete from database
    await this.repository.deleteImage(imageId);

    // If this was the primary image, set another image as primary
    if (image.isPrimary) {
      const remainingImages = await this.repository.getVehicleImages(vehicleId);
      if (remainingImages.length > 0) {
        // Set the first remaining image as primary
        await this.repository.setPrimaryImage(
          vehicleId,
          remainingImages[0]!.id
        );
      }
    }

    // Invalidate vehicle cache to ensure fresh data on next fetch
    this.cache.delete(CacheKeys.vehicleDetail(vehicleId));
    this.cache.invalidateByPattern("vehicle:list:");

    return {
      success: true,
      deletedImageId: imageId,
    };
  }

  /**
   * Create a new media record after successful upload
   */
  async createMediaRecord(
    params: CreateMediaInput,
    user: User
  ): Promise<Media> {
    const { vehicleId, filename, publishedUrl, fileSize, mimeType, width, height, format } = params;

    // Validate ownership
    await this.validateVehicleOwnership(vehicleId, user);

    // Get the next order number
    const maxOrder = await this.repository.getMaxOrderForVehicle(vehicleId);
    const nextOrder = maxOrder + 1;

    // Check if this is the first image (should be primary)
    const existingImages = await this.repository.getVehicleImages(vehicleId);
    const isPrimary = existingImages.length === 0;

    // Create the media record
    const media = await this.repository.createMedia({
      type: "IMAGE",
      vehicleId,
      filename,
      publishedUrl,
      fileSize,
      mimeType,
      width,
      height,
      format,
      order: nextOrder,
      isPrimary,
      status: "READY",
      isVisible: true,
    });

    // Invalidate vehicle cache to ensure fresh data on next fetch
    this.cache.delete(CacheKeys.vehicleDetail(vehicleId));
    this.cache.invalidateByPattern("vehicle:list:");

    return media;
  }

  /**
   * Sanitize filename for storage paths
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/~/g, "-")
      .replace(/[<>:"|?*]/g, "")
      .replace(/\s+/g, "_");
  }

  /**
   * Get all images for a vehicle
   */
  async getVehicleImages(vehicleId: string, user: User): Promise<Media[]> {
    // Validate ownership
    await this.validateVehicleOwnership(vehicleId, user);

    return await this.repository.getVehicleImages(vehicleId);
  }
}

