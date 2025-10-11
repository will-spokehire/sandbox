/**
 * Common Types
 * 
 * Shared types for pagination, filtering, and sorting patterns.
 * Used across multiple services and repositories.
 */

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  cursor?: string;
  skip?: number;
}

/**
 * Standard pagination result
 */
export interface PaginationResult<T> {
  items: T[];
  nextCursor?: string;
  totalCount?: number;
}

/**
 * Sort order
 */
export type SortOrder = "asc" | "desc";

/**
 * Standard sorting parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

/**
 * Standard list parameters (pagination + sorting)
 */
export interface ListParams extends PaginationParams, SortParams {
  includeTotalCount?: boolean;
}

/**
 * Standard list result
 */
export type ListResult<T> = PaginationResult<T>;

/**
 * Search parameters
 */
export interface SearchParams {
  search?: string;
}

/**
 * Filter parameters base
 */
export interface FilterParams extends SearchParams {
  status?: string;
}

/**
 * Standard CRUD operation result
 */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * ID parameter
 */
export interface IdParam {
  id: string;
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  from?: Date | string;
  to?: Date | string;
}

/**
 * Numeric range filter
 */
export interface NumericRangeFilter {
  min?: number;
  max?: number;
}

