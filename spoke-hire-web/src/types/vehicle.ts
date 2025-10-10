import {
  type Vehicle,
  type Make,
  type Model,
  type User,
  type Media,
  type VehicleStatus,
  type SteeringType,
  type VehicleSource,
  type VehicleSpecification,
} from "@prisma/client";

/**
 * Vehicle type with relations for list view
 */
export type VehicleListItem = Vehicle & {
  make: Pick<Make, "id" | "name">;
  model: Pick<Model, "id" | "name">;
  owner: Pick<User, "id" | "email" | "firstName" | "lastName" | "phone" | "postcode" | "city"> & {
    country: { id: string; name: string } | null;
  };
  media: Pick<Media, "id" | "publishedUrl" | "originalUrl" | "type">[];
  _count: {
    media: number;
  };
  distance?: number; // Distance in miles (when filtering by location)
};

/**
 * Vehicle with full details for detail view
 */
export type VehicleDetail = Vehicle & {
  make: Make;
  model: Model;
  owner: Pick<User, "id" | "email" | "firstName" | "lastName" | "phone" | "userType" | "status" | "street" | "city" | "county" | "postcode"> & {
    country: { id: string; name: string } | null;
  };
  steering: SteeringType | null;
  media: Media[];
  sources: VehicleSource[];
  specifications: VehicleSpecification[];
  collections: {
    collection: {
      id: string;
      name: string;
      color: string | null;
    };
  }[];
};

/**
 * Filters for vehicle list
 */
export interface VehicleFilters {
  search?: string;
  status?: VehicleStatus;
  makeId?: string;
  modelId?: string;
  yearFrom?: string;
  yearTo?: string;
  priceFrom?: number;
  priceTo?: number;
  ownerId?: string;
}

/**
 * Sort options for vehicle list
 */
export type VehicleSortBy = "createdAt" | "updatedAt" | "price" | "year" | "name";
export type VehicleSortOrder = "asc" | "desc";

export interface VehicleSort {
  sortBy: VehicleSortBy;
  sortOrder: VehicleSortOrder;
}

/**
 * Pagination info
 */
export interface VehiclePagination {
  limit: number;
  cursor?: string;
}

/**
 * Filter options response from API
 */
export interface FilterOptions {
  makes: Array<{ id: string; name: string }>;
  collections: Array<{ id: string; name: string; color: string | null }>;
  exteriorColors: string[];
  interiorColors: string[];
  years: string[];
  statusCounts: Array<{ status: VehicleStatus; count: number }>;
  seats: number[];
  gearboxTypes: string[];
  steeringTypes: Array<{ id: string; name: string; code: string }>;
  countries: Array<{ id: string; name: string; code: string | null }>;
  counties: string[];
}

/**
 * Models by make response from API
 */
export interface ModelsByMake {
  id: string;
  name: string;
}

/**
 * Postcodes.io API response
 */
export interface PostcodeResponse {
  status: number;
  result?: {
    postcode: string;
    admin_district: string;
    region: string;
    [key: string]: any;
  };
}

