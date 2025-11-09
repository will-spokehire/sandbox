/**
 * Make Service
 * 
 * Business logic for vehicle make operations including merge functionality.
 */

import type { Make } from "@prisma/client";
import type {
  DbClient,
  ListMakesParams,
  ListMakesResult,
  MakeWithCount,
  UpdateMakeParams,
  MergeMakesParams,
  MergeResult,
} from "~/server/types";
import { TRPCError } from "@trpc/server";

/**
 * Service for managing vehicle makes
 */
export class MakeService {
  constructor(private db: DbClient) {}

  /**
   * List makes with optional filters, search, pagination
   */
  async listMakes(params: ListMakesParams): Promise<ListMakesResult> {
    const {
      limit = 30,
      skip = 0,
      search,
      isActive,
      isPublished,
      sortBy = "name",
      sortOrder = "asc",
      includeTotalCount = false,
    } = params;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    // Build order by
    const orderBy: any = {};
    if (sortBy === "vehicleCount") {
      // Can't sort by count directly, will need to handle separately
      orderBy.name = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Execute queries in parallel
    const [makes, totalCount] = await Promise.all([
      this.db.make.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              vehicles: true,
              models: true,
            },
          },
        },
      }),
      includeTotalCount ? this.db.make.count({ where }) : Promise.resolve(undefined),
    ]);

    return {
      makes: makes as MakeWithCount[],
      totalCount,
    };
  }

  /**
   * Get a single make by ID
   */
  async getMakeById(id: string): Promise<MakeWithCount | null> {
    const make = await this.db.make.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehicles: true,
            models: true,
          },
        },
      },
    });

    return make as MakeWithCount | null;
  }

  /**
   * Create a new make
   */
  async createMake(data: { name: string; description?: string | null; isActive?: boolean; isPublished?: boolean }): Promise<Make> {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if name already exists
    const existingByName = await this.db.make.findFirst({
      where: { name: data.name },
    });

    if (existingByName) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `A make with name "${data.name}" already exists`,
      });
    }

    // Check if slug already exists
    const existingBySlug = await this.db.make.findFirst({
      where: { slug },
    });

    if (existingBySlug) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `A make with slug "${slug}" already exists`,
      });
    }

    try {
      const created = await this.db.make.create({
        data: {
          name: data.name,
          slug,
          description: data.description ?? null,
          isActive: data.isActive ?? true,
          isPublished: data.isPublished ?? true,
        },
      });

      return created;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create make: ${String(error)}`,
      });
    }
  }

  /**
   * Update a make
   */
  async updateMake(params: UpdateMakeParams): Promise<Make> {
    const { id, ...data } = params;

    // If name is being updated, check for uniqueness and regenerate slug
    if (data.name) {
      const existing = await this.db.make.findFirst({
        where: {
          name: data.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A make with name "${data.name}" already exists`,
        });
      }

      // Generate new slug from name
      const newSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Update with new name and slug
      const updated = await this.db.make.update({
        where: { id },
        data: {
          ...data,
          slug: newSlug,
        },
      });

      return updated;
    }

    try {
      const updated = await this.db.make.update({
        where: { id },
        data,
      });

      return updated;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to update make: ${String(error)}`,
      });
    }
  }

  /**
   * Merge multiple makes into a primary make
   * 
   * This function:
   * 1. Validates that all makes exist
   * 2. Reassigns all vehicles from secondary makes to primary make
   * 3. Tries to match models across makes and reassign vehicles to matching models
   * 4. Deletes secondary makes
   */
  async mergeMakes(params: MergeMakesParams): Promise<MergeResult> {
    const { primaryMakeId, secondaryMakeIds } = params;

    // Validate that primary make exists
    const primaryMake = await this.db.make.findUnique({
      where: { id: primaryMakeId },
      include: {
        models: true,
      },
    });

    if (!primaryMake) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Primary make not found",
      });
    }

    // Validate that all secondary makes exist
    const secondaryMakes = await this.db.make.findMany({
      where: {
        id: { in: secondaryMakeIds },
      },
      include: {
        models: true,
      },
    });

    if (secondaryMakes.length !== secondaryMakeIds.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "One or more secondary makes not found",
      });
    }

    // Perform merge in a transaction
    try {
      const result = await this.db.$transaction(async (tx) => {
        let vehiclesUpdated = 0;

        // For each secondary make
        for (const secondaryMake of secondaryMakes) {
          // Get all vehicles with this make
          const vehicles = await tx.vehicle.findMany({
            where: { makeId: secondaryMake.id },
            include: { model: true },
          });

          // For each vehicle, try to find a matching model in the primary make
          for (const vehicle of vehicles) {
            const currentModelName = vehicle.model.name;

            // Try to find a matching model in the primary make (case-insensitive)
            const matchingModel = primaryMake.models.find(
              (m) => m.name.toLowerCase() === currentModelName.toLowerCase()
            );

            if (matchingModel) {
              // Update to primary make and matching model
              await tx.vehicle.update({
                where: { id: vehicle.id },
                data: {
                  makeId: primaryMakeId,
                  modelId: matchingModel.id,
                },
              });
            } else {
              // Just update the make, keep the model (it will be orphaned)
              await tx.vehicle.update({
                where: { id: vehicle.id },
                data: {
                  makeId: primaryMakeId,
                },
              });
            }

            vehiclesUpdated++;
          }

          // Delete models of this secondary make (if they have no vehicles)
          await tx.model.deleteMany({
            where: {
              makeId: secondaryMake.id,
              vehicles: { none: {} },
            },
          });

          // Delete the secondary make
          await tx.make.delete({
            where: { id: secondaryMake.id },
          });
        }

        return {
          success: true,
          vehiclesUpdated,
          itemsDeleted: secondaryMakes.length,
          message: `Successfully merged ${secondaryMakes.length} make(s) into ${primaryMake.name}. Updated ${vehiclesUpdated} vehicle(s).`,
        };
      });

      return result;
    } catch (error) {
      console.error("Error merging makes:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to merge makes: ${String(error)}`,
      });
    }
  }

  /**
   * Delete a make (only if it has no vehicles)
   */
  async deleteMake(id: string): Promise<void> {
    // Check if make has vehicles
    const vehicleCount = await this.db.vehicle.count({
      where: { makeId: id },
    });

    if (vehicleCount > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot delete make: ${vehicleCount} vehicle(s) are using this make`,
      });
    }

    try {
      // Delete associated models first
      await this.db.model.deleteMany({
        where: { makeId: id },
      });

      // Delete the make
      await this.db.make.delete({
        where: { id },
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to delete make: ${String(error)}`,
      });
    }
  }
}

