/**
 * Media Repository
 * 
 * Handles database operations for vehicle media (images/videos)
 */

import { BaseRepository } from "./base.repository";
import { DatabaseError } from "../errors/app-errors";
import type { DbClient } from "~/server/types";
import type { Media } from "@prisma/client";

/**
 * Data for creating a new media record
 */
export interface CreateMediaData {
  type: "IMAGE" | "VIDEO";
  vehicleId: string;
  filename: string;
  publishedUrl: string;
  fileSize?: bigint;
  mimeType?: string;
  width?: number;
  height?: number;
  format?: string;
  order: number;
  isPrimary: boolean;
  status?: "UPLOADING" | "PROCESSING" | "READY" | "FAILED" | "DELETED";
  isVisible?: boolean;
}

/**
 * Data for updating image order
 */
export interface UpdateOrderData {
  id: string;
  order: number;
  isPrimary: boolean;
}

/**
 * Repository for Media operations
 */
export class MediaRepository extends BaseRepository<Media> {
  protected get model() {
    return this.db.media;
  }

  protected get entityName(): string {
    return "Media";
  }

  /**
   * Get all images for a vehicle, sorted by order
   */
  async getVehicleImages(vehicleId: string): Promise<Media[]> {
    try {
      return await this.db.media.findMany({
        where: {
          vehicleId,
          type: "IMAGE",
          isVisible: true,
        },
        orderBy: [
          { isPrimary: "desc" },
          { order: "asc" },
        ],
      });
    } catch (error) {
      throw new DatabaseError("Failed to get vehicle images", error);
    }
  }

  /**
   * Update the order of a single image
   */
  async updateImageOrder(imageId: string, order: number): Promise<Media> {
    try {
      return await this.db.media.update({
        where: { id: imageId },
        data: { order },
      });
    } catch (error) {
      throw new DatabaseError("Failed to update image order", error);
    }
  }

  /**
   * Batch update multiple image orders
   */
  async batchUpdateOrders(updates: UpdateOrderData[]): Promise<void> {
    try {
      await this.transaction(async (tx) => {
        for (const update of updates) {
          await tx.media.update({
            where: { id: update.id },
            data: {
              order: update.order,
              isPrimary: update.isPrimary,
            },
          });
        }
      });
    } catch (error) {
      throw new DatabaseError("Failed to batch update image orders", error);
    }
  }

  /**
   * Set an image as primary and unset others for the vehicle
   */
  async setPrimaryImage(vehicleId: string, imageId: string): Promise<void> {
    try {
      await this.transaction(async (tx) => {
        // First, unset all primary images for this vehicle
        await tx.media.updateMany({
          where: { vehicleId },
          data: { isPrimary: false },
        });

        // Then set the specified image as primary
        await tx.media.update({
          where: { id: imageId },
          data: { isPrimary: true },
        });
      });
    } catch (error) {
      throw new DatabaseError("Failed to set primary image", error);
    }
  }

  /**
   * Delete an image by ID
   */
  async deleteImage(imageId: string): Promise<Media> {
    try {
      return await this.db.media.delete({
        where: { id: imageId },
      });
    } catch (error) {
      throw new DatabaseError("Failed to delete image", error);
    }
  }

  /**
   * Create a new media record
   */
  async createMedia(data: CreateMediaData): Promise<Media> {
    try {
      return await this.db.media.create({
        data: {
          type: data.type,
          vehicleId: data.vehicleId,
          filename: data.filename,
          originalUrl: data.publishedUrl, // For new uploads, original = published
          publishedUrl: data.publishedUrl,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          width: data.width,
          height: data.height,
          format: data.format,
          order: data.order,
          isPrimary: data.isPrimary,
          status: data.status ?? "READY",
          isVisible: data.isVisible ?? true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to create media record", error);
    }
  }

  /**
   * Get a media item by ID
   */
  async getMediaById(mediaId: string): Promise<Media | null> {
    try {
      return await this.db.media.findUnique({
        where: { id: mediaId },
      });
    } catch (error) {
      throw new DatabaseError("Failed to get media by ID", error);
    }
  }

  /**
   * Get the vehicle ID for a media item
   */
  async getVehicleIdForMedia(mediaId: string): Promise<string | null> {
    try {
      const media = await this.db.media.findUnique({
        where: { id: mediaId },
        select: { vehicleId: true },
      });
      return media?.vehicleId ?? null;
    } catch (error) {
      throw new DatabaseError("Failed to get vehicle ID for media", error);
    }
  }

  /**
   * Get the highest order number for a vehicle's images
   */
  async getMaxOrderForVehicle(vehicleId: string): Promise<number> {
    try {
      const result = await this.db.media.findFirst({
        where: {
          vehicleId,
          type: "IMAGE",
        },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      return result?.order ?? 0;
    } catch (error) {
      throw new DatabaseError("Failed to get max order for vehicle", error);
    }
  }
}

