/**
 * Vehicle Types
 * 
 * Types related to vehicle operations, filtering, and data structures.
 */

import { type VehicleStatus, type Prisma } from "@prisma/client";
import { type ListParams, type ListResult } from "./common";

/**
 * Vehicle list filters
 */
export interface VehicleFilters {
  status?: VehicleStatus;
  makeId?: string;
  makeIds?: string[];
  modelId?: string;
  collectionIds?: string[];
  exteriorColors?: string[];
  interiorColors?: string[];
  yearFrom?: string;
  yearTo?: string;
  priceFrom?: number;
  priceTo?: number;
  ownerId?: string;
  vehicleIds?: string[];
  numberOfSeats?: number[];
  gearboxTypes?: string[];
  steeringIds?: string[];
  countryIds?: string[];
  counties?: string[];
}

/**
 * Location-based filters for vehicle search
 */
export interface VehicleLocationFilters {
  userPostcode?: string;
  userLatitude?: number;
  userLongitude?: number;
  maxDistanceMiles?: number;
  sortByDistance?: boolean;
}

/**
 * Complete vehicle list parameters
 */
export interface ListVehiclesParams extends ListParams, VehicleFilters, VehicleLocationFilters {
  search?: string;
}

/**
 * Vehicle with all relations loaded
 */
export interface VehicleWithRelations {
  id: string;
  name: string;
  year: string;
  price: Prisma.Decimal | string | number | null;
  registration: string | null;
  status: VehicleStatus;
  ownerId: string;
  make: {
    id: string;
    name: string;
  };
  model: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
  media: Array<{
    id: string;
    publishedUrl: string | null;
    originalUrl: string;
    isPrimary?: boolean;
    order?: number;
    type?: string;
  }>;
  sources?: Array<{
    id: string;
    sourceId: string;
    platform: string;
  }>;
  specifications?: Array<{
    id: string;
    category: string;
    label: string;
    value: string;
  }>;
  collections?: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Vehicle list result
 */
export interface ListVehiclesResult extends ListResult<VehicleWithRelations> {
  vehicles: VehicleWithRelations[]; // Alias for convenience
}

/**
 * Vehicle update data
 */
export interface UpdateVehicleData {
  name?: string;
  status?: VehicleStatus;
  price?: number | null;
  year?: string;
  registration?: string | null;
}

/**
 * Vehicle filter options (for UI dropdowns)
 */
export interface VehicleFilterOptions {
  makes: Array<{ id: string; name: string; vehicleCount: number }>;
  models: Array<{ id: string; name: string; makeId: string }>;
  collections: Array<{ id: string; name: string; vehicleCount: number }>;
  exteriorColors: string[];
  interiorColors: string[];
  seats: number[];
  gearboxTypes: string[];
  steeringTypes: Array<{ id: string; name: string }>;
  countries: Array<{ id: string; name: string }>;
  counties: string[];
}

