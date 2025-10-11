"use client";

import { z } from "zod";
import { useURLFilters, createFilterSchema } from "./useURLFilters";
import type { VehicleStatus } from "@prisma/client";

/**
 * Vehicle-specific filter schema
 * 
 * Defines all possible filters for the vehicles list page
 */
export const vehicleFiltersSchema = createFilterSchema.combine(
  createFilterSchema.search(),
  createFilterSchema.pagination(),
  createFilterSchema.sorting(),
  createFilterSchema.viewMode(),
  z.object({
    // Status filter
    status: z.enum(["DRAFT", "PUBLISHED", "DECLINED", "ARCHIVED", "ALL"]).default("PUBLISHED"),
    
    // Vehicle attributes
    makeIds: z.array(z.string()).default([]),
    modelId: z.string().optional(),
    collectionIds: z.array(z.string()).default([]),
    exteriorColors: z.array(z.string()).default([]),
    interiorColors: z.array(z.string()).default([]),
    yearFrom: z.string().optional(),
    yearTo: z.string().optional(),
    numberOfSeats: z.array(z.number()).default([]),
    gearboxTypes: z.array(z.string()).default([]),
    steeringIds: z.array(z.string()).default([]),
    
    // Location filters
    countryIds: z.array(z.string()).default([]),
    counties: z.array(z.string()).default([]),
    postcode: z.string().optional(),
    maxDistance: z.number().optional(),
    
    // Special sorting
    sortByDistance: z.boolean().default(false),
  })
);

export type VehicleFiltersV2 = z.infer<typeof vehicleFiltersSchema>;

/**
 * Default vehicle filter values
 */
export const defaultVehicleFilters: VehicleFiltersV2 = {
  search: undefined,
  status: "PUBLISHED",
  makeIds: [],
  modelId: undefined,
  collectionIds: [],
  exteriorColors: [],
  interiorColors: [],
  yearFrom: undefined,
  yearTo: undefined,
  numberOfSeats: [],
  gearboxTypes: [],
  steeringIds: [],
  countryIds: [],
  counties: [],
  postcode: undefined,
  maxDistance: undefined,
  sortBy: "createdAt",
  sortOrder: "desc",
  sortByDistance: false,
  viewMode: "table",
  page: 1,
};

/**
 * Vehicle filters hook using the generic URL filters system
 * 
 * This is the new, reusable version that can be easily adapted
 * for other list pages (deals, users, etc.)
 * 
 * @example
 * ```typescript
 * const { filters, updateFilters, clearFilters, hasActiveFilters } = useVehicleFiltersV2();
 * 
 * // Update a filter
 * updateFilters({ search: "BMW" });
 * 
 * // Update multiple filters
 * updateFilters({ 
 *   makeIds: ["make1", "make2"], 
 *   status: "PUBLISHED" 
 * });
 * 
 * // Clear all filters
 * clearFilters();
 * ```
 */
export function useVehicleFiltersV2() {
  return useURLFilters(
    vehicleFiltersSchema,
    defaultVehicleFilters,
    "/admin/vehicles"
  );
}
