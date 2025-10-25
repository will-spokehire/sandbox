/**
 * Make/Model Approval Service
 * 
 * Handles approval and deduplication of user-created makes and models.
 * When a vehicle is approved, this service:
 * 1. Checks if similar published makes/models exist
 * 2. Reuses existing published records (preventing duplicates)
 * 3. Publishes new makes/models if they're genuinely unique
 * 4. Cleans up unused unpublished records
 */

import type { DbClient } from "~/server/types";

interface MakeModelData {
  id: string;
  name: string;
}

interface ApprovalResult {
  finalMakeId: string;
  finalModelId: string;
  makeWasReused: boolean;
  modelWasReused: boolean;
}

export class MakeModelApprovalService {
  constructor(private db: DbClient) {}

  /**
   * Find a published make/model by name (case-insensitive)
   */
  async findPublishedMake(name: string): Promise<{ id: string; name: string } | null> {
    return await this.db.make.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
        isPublished: true,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  /**
   * Find a published model by name and make (case-insensitive)
   */
  async findPublishedModel(
    name: string,
    makeId: string
  ): Promise<{ id: string; name: string } | null> {
    return await this.db.model.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
        makeId,
        isPublished: true,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  /**
   * Generate a slug from a name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Approve make/model for a vehicle
   * Handles deduplication and publishing
   */
  async approveMakeModel(
    vehicleId: string,
    makeData: MakeModelData,
    modelData: MakeModelData
  ): Promise<ApprovalResult> {
    // Get the vehicle to check current make/model
    const vehicle = await this.db.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        make: true,
        model: true,
      },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Process Make
    let finalMakeId = makeData.id;
    let makeWasReused = false;
    const oldMakeId = vehicle.makeId;

    // Check if there's a published make with the same name
    const existingPublishedMake = await this.findPublishedMake(makeData.name);

    if (existingPublishedMake) {
      // Reuse existing published make
      finalMakeId = existingPublishedMake.id;
      makeWasReused = true;

      // If the vehicle was using an unpublished make, we'll clean it up later
    } else {
      // Check if the make exists and is unpublished
      const currentMake = await this.db.make.findUnique({
        where: { id: makeData.id },
      });

      if (currentMake && !currentMake.isPublished) {
        // Publish the existing make
        await this.db.make.update({
          where: { id: makeData.id },
          data: {
            name: makeData.name, // Update name in case admin edited it
            slug: this.generateSlug(makeData.name),
            isPublished: true,
          },
        });
      } else if (!currentMake) {
        // Create new published make
        const newMake = await this.db.make.create({
          data: {
            name: makeData.name,
            slug: this.generateSlug(makeData.name),
            isActive: true,
            isPublished: true,
          },
        });
        finalMakeId = newMake.id;
      }
    }

    // Process Model
    let finalModelId = modelData.id;
    let modelWasReused = false;
    const oldModelId = vehicle.modelId;

    // Check if there's a published model with the same name for this make
    const existingPublishedModel = await this.findPublishedModel(
      modelData.name,
      finalMakeId
    );

    if (existingPublishedModel) {
      // Reuse existing published model
      finalModelId = existingPublishedModel.id;
      modelWasReused = true;
    } else {
      // Check if the model exists and is unpublished
      const currentModel = await this.db.model.findUnique({
        where: { id: modelData.id },
      });

      if (currentModel && !currentModel.isPublished) {
        // Publish the existing model (might need to update makeId if make was reused)
        await this.db.model.update({
          where: { id: modelData.id },
          data: {
            name: modelData.name, // Update name in case admin edited it
            slug: this.generateSlug(modelData.name),
            makeId: finalMakeId, // Update makeId if make was reused
            isPublished: true,
          },
        });
      } else if (!currentModel) {
        // Create new published model
        const newModel = await this.db.model.create({
          data: {
            name: modelData.name,
            slug: this.generateSlug(modelData.name),
            makeId: finalMakeId,
            isActive: true,
            isPublished: true,
          },
        });
        finalModelId = newModel.id;
      }
    }

    // Update vehicle with final make/model IDs
    await this.db.vehicle.update({
      where: { id: vehicleId },
      data: {
        makeId: finalMakeId,
        modelId: finalModelId,
      },
    });

    // Clean up: Delete old unpublished make/model if they were replaced and have no other vehicles
    if (makeWasReused && oldMakeId !== finalMakeId) {
      await this.cleanupUnusedMake(oldMakeId);
    }
    if (modelWasReused && oldModelId !== finalModelId) {
      await this.cleanupUnusedModel(oldModelId);
    }

    return {
      finalMakeId,
      finalModelId,
      makeWasReused,
      modelWasReused,
    };
  }

  /**
   * Clean up an unpublished make if it has no vehicles using it
   */
  private async cleanupUnusedMake(makeId: string): Promise<void> {
    const make = await this.db.make.findUnique({
      where: { id: makeId },
      include: {
        vehicles: true,
        models: true,
      },
    });

    if (!make || make.isPublished) {
      return; // Don't delete published makes
    }

    // Only delete if no vehicles and no models reference it
    if (make.vehicles.length === 0 && make.models.length === 0) {
      await this.db.make.delete({
        where: { id: makeId },
      });
    }
  }

  /**
   * Clean up an unpublished model if it has no vehicles using it
   */
  private async cleanupUnusedModel(modelId: string): Promise<void> {
    const model = await this.db.model.findUnique({
      where: { id: modelId },
      include: {
        vehicles: true,
      },
    });

    if (!model || model.isPublished) {
      return; // Don't delete published models
    }

    // Only delete if no vehicles reference it
    if (model.vehicles.length === 0) {
      await this.db.model.delete({
        where: { id: modelId },
      });
    }
  }
}

