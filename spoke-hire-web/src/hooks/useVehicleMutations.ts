"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

/**
 * Vehicle mutations hook
 * 
 * Encapsulates all vehicle-related mutations with proper error handling,
 * success notifications, and query invalidation.
 * 
 * @example
 * ```typescript
 * const { archive, publish, decline, deleteVehicle } = useVehicleMutations();
 * 
 * // Archive a vehicle
 * await archive("vehicle-id");
 * 
 * // Publish a vehicle
 * await publish("vehicle-id");
 * ```
 */
export function useVehicleMutations() {
  const utils = api.useUtils();

  // Update vehicle status mutation (used for archive, publish, decline)
  const updateStatusMutation = api.vehicle.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Vehicle status updated successfully");
      void utils.vehicle.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update vehicle status");
    },
  });

  // Delete vehicle mutation
  const deleteMutation = api.vehicle.delete.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      void utils.vehicle.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete vehicle");
    },
  });

  // Wrapper functions with proper typing
  const archive = useCallback(
    async (vehicleId: string) => {
      return updateStatusMutation.mutateAsync({ id: vehicleId, status: "ARCHIVED" });
    },
    [updateStatusMutation]
  );

  const publish = useCallback(
    async (vehicleId: string) => {
      return updateStatusMutation.mutateAsync({ id: vehicleId, status: "PUBLISHED" });
    },
    [updateStatusMutation]
  );

  const decline = useCallback(
    async (vehicleId: string) => {
      return updateStatusMutation.mutateAsync({ id: vehicleId, status: "DECLINED" });
    },
    [updateStatusMutation]
  );

  const deleteVehicle = useCallback(
    async (vehicleId: string) => {
      return deleteMutation.mutateAsync({ id: vehicleId });
    },
    [deleteMutation]
  );

  const updateStatus = useCallback(
    async (vehicleId: string, status: "DRAFT" | "PUBLISHED" | "DECLINED" | "ARCHIVED") => {
      return updateStatusMutation.mutateAsync({ id: vehicleId, status });
    },
    [updateStatusMutation]
  );

  // Bulk operations
  const archiveBulk = useCallback(
    async (vehicleIds: string[]) => {
      const results = await Promise.allSettled(
        vehicleIds.map(id => updateStatusMutation.mutateAsync({ id, status: "ARCHIVED" }))
      );
      
      const successCount = results.filter(r => r.status === "fulfilled").length;
      const failureCount = results.length - successCount;
      
      if (successCount > 0) {
        toast.success(`${successCount} vehicle${successCount !== 1 ? "s" : ""} archived successfully`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} vehicle${failureCount !== 1 ? "s" : ""} failed to archive`);
      }
      
      return results;
    },
    [updateStatusMutation]
  );

  const publishBulk = useCallback(
    async (vehicleIds: string[]) => {
      const results = await Promise.allSettled(
        vehicleIds.map(id => updateStatusMutation.mutateAsync({ id, status: "PUBLISHED" }))
      );
      
      const successCount = results.filter(r => r.status === "fulfilled").length;
      const failureCount = results.length - successCount;
      
      if (successCount > 0) {
        toast.success(`${successCount} vehicle${successCount !== 1 ? "s" : ""} published successfully`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} vehicle${failureCount !== 1 ? "s" : ""} failed to publish`);
      }
      
      return results;
    },
    [updateStatusMutation]
  );

  return {
    // Individual mutations
    archive,
    publish,
    decline,
    deleteVehicle,
    updateStatus,
    
    // Bulk operations
    archiveBulk,
    publishBulk,
    
    // Loading states
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Any mutation is pending
    isAnyPending: updateStatusMutation.isPending || deleteMutation.isPending,
  };
}
