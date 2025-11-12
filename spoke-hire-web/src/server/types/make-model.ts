/**
 * Make and Model Types
 * 
 * Types for vehicle makes and models management.
 */

import type { Make, Model } from "@prisma/client";
import type { ListParams, SearchParams, SortParams } from "./common";

/**
 * Make with vehicle count
 */
export interface MakeWithCount extends Make {
  _count: {
    vehicles: number;
    models: number;
  };
}

/**
 * Model with vehicle count and make details
 */
export interface ModelWithDetails extends Model {
  make: Make;
  _count: {
    vehicles: number;
  };
}

/**
 * Parameters for listing makes
 */
export interface ListMakesParams extends ListParams, SearchParams {
  isActive?: boolean;
  isPublished?: boolean;
}

/**
 * Parameters for listing models
 */
export interface ListModelsParams extends ListParams, SearchParams {
  makeId?: string;
  isActive?: boolean;
  isPublished?: boolean;
}

/**
 * Result for listing makes
 */
export interface ListMakesResult {
  makes: MakeWithCount[];
  totalCount?: number;
  nextCursor?: string;
}

/**
 * Result for listing models
 */
export interface ListModelsResult {
  models: ModelWithDetails[];
  totalCount?: number;
  nextCursor?: string;
}

/**
 * Parameters for updating a make
 */
export interface UpdateMakeParams {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
}

/**
 * Parameters for updating a model
 */
export interface UpdateModelParams {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
}

/**
 * Parameters for merging makes
 */
export interface MergeMakesParams {
  primaryMakeId: string;
  secondaryMakeIds: string[];
}

/**
 * Parameters for merging models
 */
export interface MergeModelsParams {
  primaryModelId: string;
  secondaryModelIds: string[];
}

/**
 * Result for merge operation
 */
export interface MergeResult {
  success: boolean;
  vehiclesUpdated: number;
  itemsDeleted: number;
  message: string;
}

