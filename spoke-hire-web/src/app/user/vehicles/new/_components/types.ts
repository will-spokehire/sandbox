// Types for filter options returned from the API
export interface FilterOptions {
  makes: Array<{ id: string; name: string; slug: string }>;
  models?: Array<{ id: string; name: string; slug: string; makeId: string }>;
  collections: Array<{ id: string; name: string; slug: string; color?: string | null }>;
  exteriorColors: string[];
  interiorColors: string[];
  years: string[];
  statusCounts: Array<{ status: string; count: number }>;
  seats: number[];
  gearboxTypes: string[];
  steeringTypes: Array<{ id: string; name: string; code: string }>;
  countries: Array<{ id: string; name: string; code?: string | null }>;
  counties: string[];
}

export interface MakeItem {
  id: string;
  name: string;
  slug: string;
}

export interface ModelItem {
  id: string;
  name: string;
  slug: string;
  makeId: string;
}

export interface SteeringItem {
  id: string;
  name: string;
  code: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
}
