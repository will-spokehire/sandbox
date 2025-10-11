"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useVehicleFilters } from "~/hooks/useVehicleFilters";
import type { VehicleFilters, VehicleFiltersUpdate } from "~/hooks/useVehicleFilters";

interface VehicleFiltersContextValue {
  filters: VehicleFilters;
  updateFilters: (updates: VehicleFiltersUpdate) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const VehicleFiltersContext = createContext<VehicleFiltersContextValue | undefined>(undefined);

interface VehicleFiltersProviderProps {
  children: ReactNode;
}

/**
 * Vehicle Filters Context Provider
 * 
 * Provides filter state and actions to all child components,
 * eliminating the need for props drilling through multiple levels.
 * 
 * @example
 * ```tsx
 * <VehicleFiltersProvider>
 *   <VehicleFilters />
 *   <FilterGrid />
 *   <VehicleListTable />
 * </VehicleFiltersProvider>
 * ```
 */
export function VehicleFiltersProvider({ children }: VehicleFiltersProviderProps) {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useVehicleFilters();

  const value: VehicleFiltersContextValue = {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };

  return (
    <VehicleFiltersContext.Provider value={value}>
      {children}
    </VehicleFiltersContext.Provider>
  );
}

/**
 * Hook to access vehicle filters context
 * 
 * @throws Error if used outside VehicleFiltersProvider
 * 
 * @example
 * ```tsx
 * const { filters, updateFilters, clearFilters } = useVehicleFiltersContext();
 * 
 * // Update a filter
 * updateFilters({ search: "BMW" });
 * 
 * // Clear all filters
 * clearFilters();
 * ```
 */
export function useVehicleFiltersContext() {
  const context = useContext(VehicleFiltersContext);
  if (context === undefined) {
    throw new Error('useVehicleFiltersContext must be used within a VehicleFiltersProvider');
  }
  return context;
}
