export interface VehicleData {
  id: string;
  primarySource: string;
  sources: string[];
  matchScore?: number;
  matchType?: string;
  metadata?: any;
  // Duplicate handling fields
  duplicate?: boolean;
  originalId?: string;
  duplicateIndex?: number;
  hasDuplicates?: boolean;
  duplicateCount?: number;
  vehicle: {
    name: string;
    make: string;
    model: string;
    year: string;
    registration: string;
    engineCapacity: string;
    numberOfSeats: string;
    steering: string;
    gearbox: string;
    exteriorColour: string;
    interiorColour: string;
    condition: string;
    isRoadLegal: string;
    price: number | null;
    collection: string;
    visible: boolean;
    inventory: string;
    published: boolean;
    description?: string;
  };
  images?: {
    urls: string[];
    count: number;
  };
  owner?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      county: string;
      postcode: string;
      country: string;
    };
  };
  catalogData?: any;
  cleansedData?: any;
  submissionData?: any;
}

export interface VehicleCatalogMetadata {
  generatedAt: string;
  totalRecords: number;
  stats: {
    catalogRecords: number;
    cleansedRecords: number;
    submissionRecords: number;
    matchedRecords: number;
    unmatchedCatalog: number;
    unmatchedCleansed: number;
    unmatchedSubmission: number;
  };
  sources: {
    catalog: string;
    cleansed: string;
    submission: string;
  };
}

export interface VehicleCatalog {
  metadata: VehicleCatalogMetadata;
  records: VehicleData[];
}

export interface VehicleStats {
  totalRecords: number;
  publishedRecords: number;
  multiSourceRecords: number;
  withImages: number;
  withContact: number;
  withAddress: number;
  withRegistration: number;
}

export interface VehicleFilters {
  search?: string;
  source?: string;
  status?: string;
  published?: boolean;
  hasImages?: boolean;
  hasContact?: boolean;
  hasAddress?: boolean;
  hasRegistration?: boolean;
  catalogFilter?: 'all' | 'include' | 'only';
  cleansedFilter?: 'all' | 'only';
  submissionFilter?: 'all' | 'only';
  duplicateFilter?: 'all' | 'duplicates' | 'unique';
  regDuplicateFilter?: 'all' | 'reg-duplicates' | 'reg-unique';
  sortBy?: 'name' | 'registration' | 'year' | 'make' | 'model';
  sortOrder?: 'asc' | 'desc';
}

export type VehicleSource = 'catalog' | 'cleansed' | 'submission' | 'multi' | 'all';
