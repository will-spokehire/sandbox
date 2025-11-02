"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePublicVehicleFilters } from "~/hooks/usePublicVehicleFilters";
import type { PublicVehicleFilters, PublicVehicleFiltersUpdate } from "~/hooks/usePublicVehicleFilters";

interface PublicVehicleFiltersContextValue {
  filters: PublicVehicleFilters;
  updateFilters: (updates: PublicVehicleFiltersUpdate) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const PublicVehicleFiltersContext = createContext<PublicVehicleFiltersContextValue | undefined>(undefined);

interface PublicVehicleFiltersProviderProps {
  children: ReactNode;
}

/**
 * Public Vehicle Filters Context Provider
 * 
 * Provides filter state and actions for the public vehicle catalog.
 * URL-based state management for shareable links and SEO.
 * 
 * @example
 * ```tsx
 * <PublicVehicleFiltersProvider>
 *   <PublicVehicleFilters />
 *   <PublicVehicleGrid />
 * </PublicVehicleFiltersProvider>
 * ```
 */
export function PublicVehicleFiltersProvider({ children }: PublicVehicleFiltersProviderProps) {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = usePublicVehicleFilters();

  const value: PublicVehicleFiltersContextValue = {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };

  return (
    <PublicVehicleFiltersContext.Provider value={value}>
      {children}
    </PublicVehicleFiltersContext.Provider>
  );
}

/**
 * Hook to access public vehicle filters context
 * 
 * @throws Error if used outside PublicVehicleFiltersProvider
 * 
 * @example
 * ```tsx
 * const { filters, updateFilters, clearFilters } = usePublicVehicleFiltersContext();
 * 
 * // Update a filter
 * updateFilters({ search: "Ferrari" });
 * 
 * // Clear all filters
 * clearFilters();
 * ```
 */
export function usePublicVehicleFiltersContext() {
  const context = useContext(PublicVehicleFiltersContext);
  if (context === undefined) {
    throw new Error('usePublicVehicleFiltersContext must be used within a PublicVehicleFiltersProvider');
  }
  return context;
}

