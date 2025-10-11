"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

/**
 * Deal mutations hook
 * 
 * Encapsulates all deal-related mutations with proper error handling,
 * success notifications, and query invalidation.
 * 
 * @example
 * ```typescript
 * const { create, update, deleteDeal, addVehicles, removeVehicles } = useDealMutations();
 * 
 * // Create a new deal
 * await create({
 *   name: "BMW Commercial",
 *   date: "2025-03-15",
 *   vehicleIds: ["vehicle1", "vehicle2"]
 * });
 * 
 * // Add vehicles to existing deal
 * await addVehicles("deal-id", ["vehicle3", "vehicle4"]);
 * ```
 */
export function useDealMutations() {
  const utils = api.useUtils();

  // Create deal mutation
  const createMutation = api.deal.create.useMutation({
    onSuccess: () => {
      toast.success("Deal created successfully");
      void utils.deal.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create deal");
    },
  });

  // Update deal mutation
  const updateMutation = api.deal.update.useMutation({
    onSuccess: () => {
      toast.success("Deal updated successfully");
      void utils.deal.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update deal");
    },
  });

  // Delete deal mutation
  const deleteMutation = api.deal.delete.useMutation({
    onSuccess: () => {
      toast.success("Deal deleted successfully");
      void utils.deal.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete deal");
    },
  });

  // Add vehicles to deal mutation
  const addVehiclesMutation = api.deal.addVehiclesToDeal.useMutation({
    onSuccess: () => {
      toast.success("Vehicles added to deal successfully");
      void utils.deal.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add vehicles to deal");
    },
  });

  // Archive deal mutation
  const archiveMutation = api.deal.archive.useMutation({
    onSuccess: () => {
      toast.success("Deal archived successfully");
      void utils.deal.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to archive deal");
    },
  });

  // Unarchive deal mutation
  const unarchiveMutation = api.deal.unarchive.useMutation({
    onSuccess: () => {
      toast.success("Deal unarchived successfully");
      void utils.deal.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to unarchive deal");
    },
  });

  // Wrapper functions with proper typing
  const create = useCallback(
    async (data: {
      name: string;
      date?: string;
      time?: string;
      location?: string;
      brief?: string;
      fee?: string;
      vehicleIds?: string[];
      recipientIds?: string[];
    }) => {
      return createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const update = useCallback(
    async (dealId: string, data: {
      name?: string;
      date?: string;
      time?: string;
      location?: string;
      brief?: string;
      fee?: string;
    }) => {
      return updateMutation.mutateAsync({ id: dealId, ...data });
    },
    [updateMutation]
  );

  const deleteDeal = useCallback(
    async (dealId: string) => {
      return deleteMutation.mutateAsync({ id: dealId });
    },
    [deleteMutation]
  );

  const addVehicles = useCallback(
    async (dealId: string, vehicleIds: string[], recipientIds?: string[]) => {
      return addVehiclesMutation.mutateAsync({
        dealId,
        vehicleIds,
        recipientIds: recipientIds || [],
      });
    },
    [addVehiclesMutation]
  );

  const archive = useCallback(
    async (dealId: string) => {
      return archiveMutation.mutateAsync({ id: dealId });
    },
    [archiveMutation]
  );

  const unarchive = useCallback(
    async (dealId: string) => {
      return unarchiveMutation.mutateAsync({ id: dealId });
    },
    [unarchiveMutation]
  );

  // Bulk operations
  const deleteBulk = useCallback(
    async (dealIds: string[]) => {
      const results = await Promise.allSettled(
        dealIds.map(id => deleteMutation.mutateAsync({ id }))
      );
      
      const successCount = results.filter(r => r.status === "fulfilled").length;
      const failureCount = results.length - successCount;
      
      if (successCount > 0) {
        toast.success(`${successCount} deal${successCount !== 1 ? "s" : ""} deleted successfully`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} deal${failureCount !== 1 ? "s" : ""} failed to delete`);
      }
      
      return results;
    },
    [deleteMutation]
  );

  return {
    // Individual mutations
    create,
    update,
    deleteDeal,
    addVehicles,
    archive,
    unarchive,
    
    // Bulk operations
    deleteBulk,
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAddingVehicles: addVehiclesMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isUnarchiving: unarchiveMutation.isPending,
    
    // Any mutation is pending
    isAnyPending: createMutation.isPending || 
                  updateMutation.isPending || 
                  deleteMutation.isPending || 
                  addVehiclesMutation.isPending || 
                  archiveMutation.isPending || 
                  unarchiveMutation.isPending,
  };
}
