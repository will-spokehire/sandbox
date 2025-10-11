"use client";

import { useCallback } from "react";
import { api } from "~/trpc/react";

/**
 * Query invalidation hook
 * 
 * Provides convenient methods to invalidate related queries after mutations.
 * This ensures the UI stays in sync with the server state.
 * 
 * @example
 * ```typescript
 * const { invalidateVehicles, invalidateDeals, invalidateAll } = useInvalidateQueries();
 * 
 * // After creating a vehicle
 * await createVehicle(data);
 * await invalidateVehicles();
 * 
 * // After creating a deal
 * await createDeal(data);
 * await invalidateDeals();
 * ```
 */
export function useInvalidateQueries() {
  const utils = api.useUtils();

  // Invalidate all vehicle-related queries
  const invalidateVehicles = useCallback(async () => {
    await Promise.all([
      utils.vehicle.list.invalidate(),
      utils.vehicle.getById.invalidate(),
      utils.vehicle.getFilterOptions.invalidate(),
      utils.vehicle.getModelsByMake.invalidate(),
    ]);
  }, [utils.vehicle]);

  // Invalidate all deal-related queries
  const invalidateDeals = useCallback(async () => {
    await Promise.all([
      utils.deal.list.invalidate(),
      utils.deal.getById.invalidate(),
      utils.deal.getNewVehiclesAndOwners.invalidate(),
    ]);
  }, [utils.deal]);

  // Note: User queries not available in current router

  // Invalidate all queries (use sparingly)
  const invalidateAll = useCallback(async () => {
    await utils.invalidate();
  }, [utils]);

  // Invalidate specific vehicle queries
  const invalidateVehicle = useCallback(async (vehicleId: string) => {
    await Promise.all([
      utils.vehicle.getById.invalidate({ id: vehicleId }),
      utils.vehicle.list.invalidate(), // In case the vehicle appears in lists
    ]);
  }, [utils.vehicle]);

  // Invalidate specific deal queries
  const invalidateDeal = useCallback(async (dealId: string) => {
    await Promise.all([
      utils.deal.getById.invalidate({ id: dealId }),
      utils.deal.list.invalidate(), // In case the deal appears in lists
    ]);
  }, [utils.deal]);

  // Invalidate filter options (when new data might affect filters)
  const invalidateFilterOptions = useCallback(async () => {
    await Promise.all([
      utils.vehicle.getFilterOptions.invalidate(),
      utils.vehicle.getModelsByMake.invalidate(),
    ]);
  }, [utils.vehicle]);

  return {
    // Entity-specific invalidation
    invalidateVehicles,
    invalidateDeals,
    
    // Specific item invalidation
    invalidateVehicle,
    invalidateDeal,
    
    // Filter-related invalidation
    invalidateFilterOptions,
    
    // Nuclear option
    invalidateAll,
  };
}
