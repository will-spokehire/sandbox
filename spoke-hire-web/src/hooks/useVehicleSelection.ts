"use client";

import { useState, useCallback } from "react";

/**
 * Hook for managing vehicle selection state
 * 
 * Provides functionality for selecting/deselecting individual vehicles
 * and managing bulk selection operations. Used in the vehicles list
 * for enabling deal creation workflows.
 * 
 * @example
 * ```tsx
 * const { 
 *   selectedIds, 
 *   toggleVehicle, 
 *   toggleAll, 
 *   clearSelection,
 *   isSelected,
 *   isAllSelected,
 *   isPartiallySelected 
 * } = useVehicleSelection();
 * 
 * // Toggle individual vehicle
 * toggleVehicle("vehicle-id");
 * 
 * // Select/deselect all vehicles
 * toggleAll(true);
 * 
 * // Check if vehicle is selected
 * if (isSelected("vehicle-id")) {
 *   // Show selected state
 * }
 * ```
 */
export function useVehicleSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /**
   * Toggle selection of a single vehicle
   */
  const toggleVehicle = useCallback((vehicleId: string) => {
    setSelectedIds((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId]
    );
  }, []);

  /**
   * Toggle selection of all vehicles
   */
  const toggleAll = useCallback((checked: boolean, allVehicleIds: string[]) => {
    if (checked) {
      setSelectedIds(allVehicleIds);
    } else {
      setSelectedIds([]);
    }
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  /**
   * Check if a specific vehicle is selected
   */
  const isSelected = useCallback((vehicleId: string) => {
    return selectedIds.includes(vehicleId);
  }, [selectedIds]);

  /**
   * Check if all vehicles are selected
   */
  const isAllSelected = useCallback((allVehicleIds: string[]) => {
    return allVehicleIds.length > 0 && allVehicleIds.every(id => selectedIds.includes(id));
  }, [selectedIds]);

  /**
   * Check if some (but not all) vehicles are selected
   */
  const isPartiallySelected = useCallback((allVehicleIds: string[]) => {
    const selectedCount = allVehicleIds.filter(id => selectedIds.includes(id)).length;
    return selectedCount > 0 && selectedCount < allVehicleIds.length;
  }, [selectedIds]);

  /**
   * Get count of selected vehicles
   */
  const selectedCount = selectedIds.length;

  return {
    selectedIds,
    selectedCount,
    toggleVehicle,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartiallySelected,
  };
}
