/**
 * Model Service
 * 
 * Business logic for vehicle model operations including merge functionality.
 */

import type { Model } from "@prisma/client";
import type {
  DbClient,
  ListModelsParams,
  ListModelsResult,
  ModelWithDetails,
  UpdateModelParams,
  MergeModelsParams,
  MergeResult,
} from "~/server/types";
import { TRPCError } from "@trpc/server";

/**
 * Service for managing vehicle models
 */
export class ModelService {
  constructor(private db: DbClient) {}

  /**
   * List models with optional filters, search, pagination
   */
  async listModels(params: ListModelsParams): Promise<ListModelsResult> {
    const {
      limit = 30,
      skip = 0,
      search,
      makeId,
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

    if (makeId) {
      where.makeId = makeId;
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
    } else if (sortBy === "makeName") {
      orderBy.make = { name: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Execute queries in parallel
    const [models, totalCount] = await Promise.all([
      this.db.model.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          make: true,
          _count: {
            select: {
              vehicles: true,
            },
          },
        },
      }),
      includeTotalCount ? this.db.model.count({ where }) : Promise.resolve(undefined),
    ]);

    return {
      models: models as ModelWithDetails[],
      totalCount,
    };
  }

  /**
   * Get a single model by ID
   */
  async getModelById(id: string): Promise<ModelWithDetails | null> {
    const model = await this.db.model.findUnique({
      where: { id },
      include: {
        make: true,
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    });

    return model as ModelWithDetails | null;
  }

  /**
   * Create a new model
   */
  async createModel(data: { makeId: string; name: string; description?: string | null; isActive?: boolean; isPublished?: boolean }): Promise<Model> {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if name already exists for this make
    const existingByName = await this.db.model.findFirst({
      where: {
        makeId: data.makeId,
        name: data.name,
      },
    });

    if (existingByName) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `A model with name "${data.name}" already exists for this make`,
      });
    }

    // Check if slug already exists for this make
    const existingBySlug = await this.db.model.findFirst({
      where: {
        makeId: data.makeId,
        slug,
      },
    });

    if (existingBySlug) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `A model with slug "${slug}" already exists for this make`,
      });
    }

    try {
      const created = await this.db.model.create({
        data: {
          makeId: data.makeId,
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
        message: `Failed to create model: ${String(error)}`,
      });
    }
  }

  /**
   * Update a model
   */
  async updateModel(params: UpdateModelParams): Promise<Model> {
    const { id, ...data } = params;

    // Get the model to know its makeId
    const existingModel = await this.db.model.findUnique({
      where: { id },
    });

    if (!existingModel) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Model not found",
      });
    }

    // If slug is being updated, check for uniqueness within the same make
    if (data.slug) {
      const existing = await this.db.model.findFirst({
        where: {
          makeId: existingModel.makeId,
          slug: data.slug,
          NOT: { id },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A model with slug "${data.slug}" already exists for this make`,
        });
      }
    }

    // If name is being updated, check for uniqueness within the same make
    if (data.name) {
      const existing = await this.db.model.findFirst({
        where: {
          makeId: existingModel.makeId,
          name: data.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A model with name "${data.name}" already exists for this make`,
        });
      }
    }

    try {
      const updated = await this.db.model.update({
        where: { id },
        data,
      });

      return updated;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to update model: ${String(error)}`,
      });
    }
  }

  /**
   * Merge multiple models into a primary model
   * 
   * This function:
   * 1. Validates that all models exist and belong to the same make
   * 2. Reassigns all vehicles from secondary models to primary model
   * 3. Deletes secondary models
   */
  async mergeModels(params: MergeModelsParams): Promise<MergeResult> {
    const { primaryModelId, secondaryModelIds } = params;

    // Validate that primary model exists
    const primaryModel = await this.db.model.findUnique({
      where: { id: primaryModelId },
      include: { make: true },
    });

    if (!primaryModel) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Primary model not found",
      });
    }

    // Validate that all secondary models exist
    const secondaryModels = await this.db.model.findMany({
      where: {
        id: { in: secondaryModelIds },
      },
      include: { make: true },
    });

    if (secondaryModels.length !== secondaryModelIds.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "One or more secondary models not found",
      });
    }

    // Validate that all models belong to the same make
    const differentMake = secondaryModels.find(
      (m) => m.makeId !== primaryModel.makeId
    );

    if (differentMake) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot merge models from different makes. Model "${differentMake.name}" belongs to "${differentMake.make.name}", but primary model belongs to "${primaryModel.make.name}"`,
      });
    }

    // Perform merge in a transaction
    try {
      const result = await this.db.$transaction(async (tx) => {
        let vehiclesUpdated = 0;

        // For each secondary model
        for (const secondaryModel of secondaryModels) {
          // Count vehicles with this model
          const vehicleCount = await tx.vehicle.count({
            where: { modelId: secondaryModel.id },
          });

          // Update all vehicles to use the primary model
          await tx.vehicle.updateMany({
            where: { modelId: secondaryModel.id },
            data: { modelId: primaryModelId },
          });

          vehiclesUpdated += vehicleCount;

          // Delete the secondary model
          await tx.model.delete({
            where: { id: secondaryModel.id },
          });
        }

        return {
          success: true,
          vehiclesUpdated,
          itemsDeleted: secondaryModels.length,
          message: `Successfully merged ${secondaryModels.length} model(s) into ${primaryModel.name}. Updated ${vehiclesUpdated} vehicle(s).`,
        };
      });

      return result;
    } catch (error) {
      console.error("Error merging models:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to merge models: ${String(error)}`,
      });
    }
  }

  /**
   * Delete a model (only if it has no vehicles)
   */
  async deleteModel(id: string): Promise<void> {
    // Check if model has vehicles
    const vehicleCount = await this.db.vehicle.count({
      where: { modelId: id },
    });

    if (vehicleCount > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot delete model: ${vehicleCount} vehicle(s) are using this model`,
      });
    }

    try {
      await this.db.model.delete({
        where: { id },
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to delete model: ${String(error)}`,
      });
    }
  }
}

