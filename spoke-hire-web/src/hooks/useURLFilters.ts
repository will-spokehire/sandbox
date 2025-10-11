"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

/**
 * Generic URL-based filter management hook
 * 
 * Provides a reusable pattern for managing filter state in URL search parameters
 * across all list pages (vehicles, deals, users, etc.)
 * 
 * @template T - The filter state type
 * @param schema - Zod schema for validating filter state
 * @param defaults - Default filter values
 * @param basePath - Base path for the page (e.g., "/admin/vehicles")
 * 
 * @example
 * ```typescript
 * const vehicleFiltersSchema = z.object({
 *   search: z.string().optional(),
 *   status: z.enum(["DRAFT", "PUBLISHED", "DECLINED", "ARCHIVED"]).optional(),
 *   makeIds: z.array(z.string()).optional(),
 *   page: z.number().min(1).default(1),
 * });
 * 
 * const defaultVehicleFilters = {
 *   status: "PUBLISHED" as const,
 *   page: 1,
 * };
 * 
 * const { filters, updateFilters, clearFilters, hasActiveFilters } = useURLFilters(
 *   vehicleFiltersSchema,
 *   defaultVehicleFilters,
 *   "/admin/vehicles"
 * );
 * ```
 */
export function useURLFilters<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  defaults: T,
  basePath: string
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL with validation
  const filters: T = useMemo(() => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      const parsed: Record<string, unknown> = {};

      // Parse each parameter based on its type
      for (const [key, value] of params.entries()) {
        if (value === "") continue; // Skip empty values

        // Try to parse as JSON first (for arrays/objects)
        try {
          parsed[key] = JSON.parse(value);
        } catch {
          // If not JSON, try to parse as number
          const numValue = Number(value);
          if (!isNaN(numValue) && value !== "") {
            parsed[key] = numValue;
          } else {
            // Keep as string
            parsed[key] = value;
          }
        }
      }

      // Merge with defaults and validate
      const merged = { ...defaults, ...parsed };
      return schema.parse(merged);
    } catch (error) {
      console.warn("Failed to parse URL filters, using defaults:", error);
      return defaults;
    }
  }, [searchParams, schema, defaults]);

  // Update filters in URL
  const updateFilters = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Apply updates
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            params.delete(key);
          } else {
            params.set(key, JSON.stringify(value));
          }
        } else if (typeof value === "object") {
          params.set(key, JSON.stringify(value));
        } else {
          params.set(key, String(value));
        }
      }

      // Remove default values from URL to keep it clean
      for (const [key, defaultValue] of Object.entries(defaults)) {
        const currentValue = params.get(key);
        if (currentValue !== null) {
          try {
            const parsedValue = JSON.parse(currentValue);
            if (JSON.stringify(parsedValue) === JSON.stringify(defaultValue)) {
              params.delete(key);
            }
          } catch {
            if (currentValue === String(defaultValue)) {
              params.delete(key);
            }
          }
        }
      }

      // When filters change (excluding page), reset to page 1
      const isFilterChange = Object.keys(updates).some(
        (key) => key !== "page" && key !== "sortBy" && key !== "sortOrder" && key !== "viewMode"
      );
      if (isFilterChange && !("page" in updates)) {
        params.delete("page");
      }

      const newUrl = params.toString() ? `${basePath}?${params.toString()}` : basePath;
      router.push(newUrl, { scroll: false });
    },
    [router, searchParams, defaults, basePath]
  );

  // Clear all filters (reset to defaults)
  const clearFilters = useCallback(() => {
    router.push(basePath, { scroll: false });
  }, [router, basePath]);

  // Check if any non-default filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some((key) => {
      const value = filters[key];
      const defaultValue = defaults[key];
      
      if (value === undefined || value === null) return false;
      if (defaultValue === undefined || defaultValue === null) return true;
      
      return JSON.stringify(value) !== JSON.stringify(defaultValue);
    });
  }, [filters, defaults]);

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };
}

/**
 * Helper function to create filter schemas with common patterns
 */
export const createFilterSchema = {
  /**
   * Create a pagination schema
   */
  pagination: () => z.object({
    page: z.number().min(1).default(1),
  }),

  /**
   * Create a search schema
   */
  search: () => z.object({
    search: z.string().optional(),
  }),

  /**
   * Create a sorting schema
   */
  sorting: () => z.object({
    sortBy: z.string().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),

  /**
   * Create a view mode schema
   */
  viewMode: () => z.object({
    viewMode: z.enum(["table", "cards"]).default("table"),
  }),

  /**
   * Combine multiple schemas
   */
  combine: (...schemas: z.ZodObject<any, any>[]) => {
    return schemas.reduce((acc, schema) => acc.merge(schema), z.object({}));
  },
};
