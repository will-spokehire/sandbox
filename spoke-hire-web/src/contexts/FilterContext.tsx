"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useURLFilters, createFilterSchema } from "~/hooks/useURLFilters";
import { z } from "zod";

/**
 * Generic filter context value
 * 
 * @template T - The filter state type
 */
interface FilterContextValue<T extends Record<string, unknown>> {
  filters: T;
  updateFilters: (updates: Partial<T>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const FilterContext = createContext<FilterContextValue<any> | undefined>(undefined);

/**
 * Generic filter context provider props
 * 
 * @template T - The filter state type
 */
interface FilterProviderProps<T extends Record<string, unknown>> {
  children: ReactNode;
  schema: z.ZodType<T>;
  defaults: T;
  basePath: string;
}

/**
 * Generic Filter Context Provider
 * 
 * Provides filter state and actions to all child components,
 * eliminating the need for props drilling through multiple levels.
 * This is a reusable pattern that can work with any filter type.
 * 
 * @template T - The filter state type
 * 
 * @example
 * ```tsx
 * // For vehicles
 * <FilterProvider
 *   schema={vehicleFiltersSchema}
 *   defaults={defaultVehicleFilters}
 *   basePath="/admin/vehicles"
 * >
 *   <VehicleFilters />
 *   <FilterGrid />
 *   <VehicleListTable />
 * </FilterProvider>
 * 
 * // For deals
 * <FilterProvider
 *   schema={dealFiltersSchema}
 *   defaults={defaultDealFilters}
 *   basePath="/admin/deals"
 * >
 *   <DealFilters />
 *   <DealListTable />
 * </FilterProvider>
 * ```
 */
export function FilterProvider<T extends Record<string, unknown>>({
  children,
  schema,
  defaults,
  basePath,
}: FilterProviderProps<T>) {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useURLFilters(
    schema,
    defaults,
    basePath
  );

  const value: FilterContextValue<T> = {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

/**
 * Hook to access filter context
 * 
 * @template T - The filter state type
 * @throws Error if used outside FilterProvider
 * 
 * @example
 * ```tsx
 * const { filters, updateFilters, clearFilters } = useFilterContext<VehicleFilters>();
 * 
 * // Update a filter
 * updateFilters({ search: "BMW" });
 * 
 * // Clear all filters
 * clearFilters();
 * ```
 */
export function useFilterContext<T extends Record<string, unknown>>() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context as FilterContextValue<T>;
}

/**
 * Convenience hook for vehicle filters
 * 
 * This provides a typed interface specifically for vehicle filters
 * while using the generic context system under the hood.
 */
export function useVehicleFilterContext() {
  return useFilterContext<import("~/hooks/useVehicleFiltersV2").VehicleFiltersV2>();
}

/**
 * Convenience hook for deal filters
 * 
 * This provides a typed interface specifically for deal filters
 * while using the generic context system under the hood.
 */
export function useDealFilterContext() {
  return useFilterContext<import("~/hooks/useDealFilters").DealFilters>();
}
