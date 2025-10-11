"use client";

import { useCallback } from "react";

export interface PaginationConfig {
  itemsPerPage: number;
  totalCount: number;
  currentPage: number;
}

export interface PaginationResult {
  totalPages: number;
  skip: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  handlePageChange: (page: number) => void;
  handleNextPage: () => void;
  handlePreviousPage: () => void;
}

/**
 * Hook for managing vehicle list pagination
 * 
 * Provides pagination calculations and navigation handlers.
 * Integrates with the URL-based filter system to maintain
 * pagination state in the URL.
 * 
 * @example
 * ```tsx
 * const { 
 *   totalPages, 
 *   skip, 
 *   hasNextPage, 
 *   handlePageChange 
 * } = useVehiclePagination({
 *   itemsPerPage: 30,
 *   totalCount: 150,
 *   currentPage: 2
 * });
 * 
 * // Navigate to specific page
 * handlePageChange(3);
 * 
 * // Use skip for API calls
 * const { data } = api.vehicle.list.useQuery({
 *   skip,
 *   limit: itemsPerPage,
 *   // ... other filters
 * });
 * ```
 */
export function useVehiclePagination(
  config: PaginationConfig,
  onPageChange: (page: number) => void
): PaginationResult {
  const { itemsPerPage, totalCount, currentPage } = config;

  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const skip = (currentPage - 1) * itemsPerPage;
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  /**
   * Handle page change with scroll to top
   */
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      // Scroll to top of list smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage, totalPages, onPageChange]);

  /**
   * Navigate to next page
   */
  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  }, [hasNextPage, currentPage, handlePageChange]);

  /**
   * Navigate to previous page
   */
  const handlePreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      handlePageChange(currentPage - 1);
    }
  }, [hasPreviousPage, currentPage, handlePageChange]);

  return {
    totalPages,
    skip,
    hasNextPage,
    hasPreviousPage,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
  };
}
