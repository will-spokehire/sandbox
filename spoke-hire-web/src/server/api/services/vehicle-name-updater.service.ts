/**
 * Vehicle Name Updater Service
 * 
 * Shared utility for regenerating vehicle names when make/model data changes.
 * Centralizes the logic to avoid code duplication across Make and Model services.
 */

import { generateVehicleName } from "~/lib/vehicle-name-generator";
import { CacheService, CacheKeys } from "./cache.service";
import type { DbClient } from "~/server/types";

interface VehicleWithMakeModel {
  id: string;
  name: string;
  year: string;
  make: { name: string };
  model: { name: string };
}

/**
 * Service for updating vehicle names in bulk
 */
export class VehicleNameUpdaterService {
  constructor(
    private db: DbClient,
    private cache: CacheService
  ) {}

  /**
   * Regenerate and update vehicle names for a list of vehicles
   * 
   * @param vehicles - Array of vehicles with make and model included
   * @param context - Description for logging (e.g., "Make name change", "Model name change")
   * @returns Number of vehicles updated
   */
  async regenerateVehicleNames(
    vehicles: VehicleWithMakeModel[],
    context: string
  ): Promise<number> {
    if (vehicles.length === 0) {
      return 0;
    }

    console.log(`🔄 ${context}: Found ${vehicles.length} vehicle(s) to update`);
    
    let updatedCount = 0;

    for (const vehicle of vehicles) {
      const newName = generateVehicleName(
        vehicle.year,
        vehicle.make.name,
        vehicle.model.name
      );
      
      // Skip if name hasn't actually changed (edge case)
      if (newName === vehicle.name) {
        continue;
      }

      await this.db.vehicle.update({
        where: { id: vehicle.id },
        data: { name: newName },
      });
      
      console.log(`✅ Updated vehicle ${vehicle.id}: "${vehicle.name}" → "${newName}"`);
      
      // Invalidate individual vehicle cache
      this.cache.delete(CacheKeys.vehicleDetail(vehicle.id));
      
      updatedCount++;
    }
    
    // Invalidate vehicle list caches once at the end
    if (updatedCount > 0) {
      this.cache.invalidateByPattern("vehicle:list:");
      console.log(`✨ Successfully updated ${updatedCount} vehicle name(s)`);
    }

    return updatedCount;
  }

  /**
   * Regenerate vehicle names for all vehicles using a specific model
   * 
   * @param modelId - Model ID
   * @param newModelName - New model name to use
   * @param context - Description for logging
   * @returns Number of vehicles updated
   */
  async regenerateForModel(
    modelId: string,
    newModelName: string,
    context: string = "Model update"
  ): Promise<number> {
    const vehicles = await this.db.vehicle.findMany({
      where: { modelId },
      include: { make: true, model: true },
    });

    // Override model name with the new one
    const vehiclesWithNewName = vehicles.map(v => ({
      ...v,
      model: { name: newModelName },
    }));

    return this.regenerateVehicleNames(vehiclesWithNewName, context);
  }

  /**
   * Regenerate vehicle names for all vehicles using a specific make
   * 
   * @param makeId - Make ID
   * @param newMakeName - New make name to use
   * @param context - Description for logging
   * @returns Number of vehicles updated
   */
  async regenerateForMake(
    makeId: string,
    newMakeName: string,
    context: string = "Make update"
  ): Promise<number> {
    const vehicles = await this.db.vehicle.findMany({
      where: { makeId },
      include: { make: true, model: true },
    });

    // Override make name with the new one
    const vehiclesWithNewName = vehicles.map(v => ({
      ...v,
      make: { name: newMakeName },
    }));

    return this.regenerateVehicleNames(vehiclesWithNewName, context);
  }
}

