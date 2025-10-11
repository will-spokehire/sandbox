"use client";

import { z } from "zod";
import { useURLFilters, createFilterSchema } from "./useURLFilters";

/**
 * Deal-specific filter schema
 * 
 * Defines all possible filters for the deals list page
 * This demonstrates how the reusable filter architecture
 * can be applied to other list pages
 */
export const dealFiltersSchema = createFilterSchema.combine(
  createFilterSchema.search(),
  createFilterSchema.pagination(),
  createFilterSchema.sorting(),
  createFilterSchema.viewMode(),
  z.object({
    // Deal status
    status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED", "ALL"]).default("ALL"),
    
    // Date range filters
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    
    // Deal attributes
    location: z.string().optional(),
    feeRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    
    // Creator filter
    createdById: z.string().optional(),
    
    // Vehicle count range
    vehicleCountRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  })
);

export type DealFilters = z.infer<typeof dealFiltersSchema>;

/**
 * Default deal filter values
 */
export const defaultDealFilters: DealFilters = {
  search: undefined,
  status: "ALL",
  dateFrom: undefined,
  dateTo: undefined,
  location: undefined,
  feeRange: undefined,
  createdById: undefined,
  vehicleCountRange: undefined,
  sortBy: "createdAt",
  sortOrder: "desc",
  viewMode: "table",
  page: 1,
};

/**
 * Deal filters hook using the generic URL filters system
 * 
 * @example
 * ```typescript
 * const { filters, updateFilters, clearFilters, hasActiveFilters } = useDealFilters();
 * 
 * // Filter by status
 * updateFilters({ status: "ACTIVE" });
 * 
 * // Filter by date range
 * updateFilters({ 
 *   dateFrom: "2025-01-01", 
 *   dateTo: "2025-12-31" 
 * });
 * 
 * // Filter by fee range
 * updateFilters({ 
 *   feeRange: { min: 500, max: 1000 } 
 * });
 * ```
 */
export function useDealFilters() {
  return useURLFilters(
    dealFiltersSchema,
    defaultDealFilters,
    "/admin/deals"
  );
}
