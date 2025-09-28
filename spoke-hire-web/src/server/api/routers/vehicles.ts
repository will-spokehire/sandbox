import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type VehicleData, type VehicleCatalog, type VehicleStats, type VehicleFilters } from "~/types/vehicle";
import { normalizeRegistrationNumber, sortVehicles } from "~/lib/vehicles";
import { readFileSync } from "fs";
import { join } from "path";

// Helper function to load vehicle data
function loadVehicleData(): VehicleCatalog {
  try {
    const dataPath = join(process.cwd(), "public", "data", "vehicle-catalog.json");
    const fileContent = readFileSync(dataPath, "utf-8");
    const catalog = JSON.parse(fileContent) as VehicleCatalog;
    
    // Remove duplicate records based on ID
    const uniqueRecords = catalog.records.reduce((acc, record) => {
      if (!acc.find(r => r.id === record.id)) {
        acc.push(record);
      }
      return acc;
    }, [] as VehicleData[]);
    
    return {
      ...catalog,
      records: uniqueRecords,
      metadata: {
        ...catalog.metadata,
        totalRecords: uniqueRecords.length
      }
    };
  } catch (error) {
    console.error("Error loading vehicle data:", error);
    throw new Error("Failed to load vehicle data");
  }
}

// Helper function to calculate statistics
function calculateStats(records: VehicleData[]): VehicleStats {
  return {
    totalRecords: records.length,
    publishedRecords: records.filter(r => r.vehicle.published).length,
    multiSourceRecords: records.filter(r => r.sources.length > 1).length,
    withImages: records.filter(r => r.images && r.images.urls && r.images.urls.length > 0).length,
    withContact: records.filter(r => r.owner && (
      r.owner.firstName || 
      r.owner.lastName || 
      r.owner.phone || 
      r.owner.email
    )).length,
    withAddress: records.filter(r => r.owner && r.owner.address && (
      r.owner.address.street || 
      r.owner.address.city || 
      r.owner.address.county || 
      r.owner.address.postcode
    )).length,
    withRegistration: records.filter(r => r.vehicle.registration && r.vehicle.registration.trim() !== "").length,
  };
}

// Helper function to filter vehicles
function filterVehicles(records: VehicleData[], filters: VehicleFilters): VehicleData[] {
  let filtered = [...records];

  // Search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(record => {
      const vehicle = record.vehicle;
      const owner = record.owner;
      return (
        vehicle.name.toLowerCase().includes(searchTerm) ||
        vehicle.make.toLowerCase().includes(searchTerm) ||
        vehicle.model.toLowerCase().includes(searchTerm) ||
        vehicle.year.includes(searchTerm) ||
        vehicle.registration.toLowerCase().includes(searchTerm) ||
        (owner && (
          owner.firstName.toLowerCase().includes(searchTerm) ||
          owner.lastName.toLowerCase().includes(searchTerm) ||
          owner.email.toLowerCase().includes(searchTerm)
        ))
      );
    });
  }

  // Source filter
  if (filters.source && filters.source !== 'all') {
    if (filters.source === 'multi') {
      filtered = filtered.filter(record => record.sources.length > 1);
    } else if (filters.source === 'published') {
      filtered = filtered.filter(record => record.vehicle.published);
    } else if (filters.source === 'has-submission') {
      filtered = filtered.filter(record => record.sources.includes('submission'));
    } else if (filters.source === 'has-cleansed') {
      filtered = filtered.filter(record => record.sources.includes('cleansed'));
    } else {
      filtered = filtered.filter(record => {
        if (filters.source === 'catalog') {
          return record.sources.includes('catalog') && !record.sources.includes('cleansed') && !record.sources.includes('submission');
        }
        return record.sources.includes(filters.source!);
      });
    }
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter(record => {
      const status = record.vehicle.published ? "published" : "unpublished";
      return status === filters.status;
    });
  }

  // Published filter
  if (filters.published !== undefined) {
    filtered = filtered.filter(record => record.vehicle.published === filters.published);
  }

  // Has images filter
  if (filters.hasImages !== undefined) {
    filtered = filtered.filter(record => {
      const hasImages = record.images && record.images.urls && record.images.urls.length > 0;
      return filters.hasImages ? hasImages : !hasImages;
    });
  }

  // Has contact filter
  if (filters.hasContact !== undefined) {
    filtered = filtered.filter(record => {
      const hasContact = record.owner && (
        record.owner.firstName || 
        record.owner.lastName || 
        record.owner.phone || 
        record.owner.email
      );
      return filters.hasContact ? hasContact : !hasContact;
    });
  }

  // Has address filter
  if (filters.hasAddress !== undefined) {
    filtered = filtered.filter(record => {
      const hasAddress = record.owner && record.owner.address && (
        record.owner.address.street ||
        record.owner.address.city ||
        record.owner.address.county ||
        record.owner.address.postcode ||
        record.owner.address.country
      );
      return filters.hasAddress ? hasAddress : !hasAddress;
    });
  }

  // Has registration filter
  if (filters.hasRegistration !== undefined) {
    filtered = filtered.filter(record => {
      const hasRegistration = record.vehicle.registration && record.vehicle.registration.trim() !== '';
      return filters.hasRegistration ? hasRegistration : !hasRegistration;
    });
  }

  // Catalog filter
  if (filters.catalogFilter) {
    if (filters.catalogFilter === 'include') {
      // Records that include catalog data (but may have other sources too)
      filtered = filtered.filter(record => record.sources.includes('catalog'));
    } else if (filters.catalogFilter === 'only') {
      // Records that ONLY have catalog data
      filtered = filtered.filter(record => 
        record.sources.length === 1 && record.sources.includes('catalog')
      );
    }
  }

  // Cleansed filter
  if (filters.cleansedFilter === 'only') {
    filtered = filtered.filter(record => 
      record.sources.length === 1 && record.sources.includes('cleansed')
    );
  }

  // Submission filter
  if (filters.submissionFilter === 'only') {
    filtered = filtered.filter(record => 
      record.sources.length === 1 && record.sources.includes('submission')
    );
  }

  // Duplicate filter
  if (filters.duplicateFilter) {
    if (filters.duplicateFilter === 'duplicates') {
      filtered = filtered.filter(record => record.duplicate === true);
    } else if (filters.duplicateFilter === 'unique') {
      filtered = filtered.filter(record => record.duplicate !== true && record.hasDuplicates !== true);
    }
  }

  // Registration duplicate filter
  if (filters.regDuplicateFilter) {
    if (filters.regDuplicateFilter === 'reg-duplicates') {
      // Find records with duplicate registration numbers
      const regGroups = new Map<string, VehicleData[]>();
      
      filtered.forEach(record => {
        const reg = record.vehicle.registration;
        if (reg && reg.trim()) {
          const normalized = normalizeRegistrationNumber(reg);
          if (normalized) {
            if (!regGroups.has(normalized)) {
              regGroups.set(normalized, []);
            }
            regGroups.get(normalized)!.push(record);
          }
        }
      });
      
      // Filter to only records that have duplicate registrations
      const duplicateRegs = Array.from(regGroups.values()).filter(group => group.length > 1);
      const duplicateRegRecords = duplicateRegs.flat();
      filtered = filtered.filter(record => duplicateRegRecords.includes(record));
      
    } else if (filters.regDuplicateFilter === 'reg-unique') {
      // Find records with unique registration numbers
      const regGroups = new Map<string, VehicleData[]>();
      
      filtered.forEach(record => {
        const reg = record.vehicle.registration;
        if (reg && reg.trim()) {
          const normalized = normalizeRegistrationNumber(reg);
          if (normalized) {
            if (!regGroups.has(normalized)) {
              regGroups.set(normalized, []);
            }
            regGroups.get(normalized)!.push(record);
          }
        }
      });
      
      // Filter to only records that have unique registrations
      const uniqueRegs = Array.from(regGroups.values()).filter(group => group.length === 1);
      const uniqueRegRecords = uniqueRegs.flat();
      filtered = filtered.filter(record => uniqueRegRecords.includes(record));
    }
  }

  return filtered;
}

export const vehiclesRouter = createTRPCRouter({
  // Get all vehicles with optional filtering
  getAll: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        source: z.string().optional(),
        status: z.string().optional(),
        published: z.boolean().optional(),
        hasImages: z.boolean().optional(),
        hasContact: z.boolean().optional(),
        hasAddress: z.boolean().optional(),
        hasRegistration: z.boolean().optional(),
        catalogFilter: z.enum(['all', 'include', 'only']).optional(),
        cleansedFilter: z.enum(['all', 'only']).optional(),
        submissionFilter: z.enum(['all', 'only']).optional(),
        duplicateFilter: z.enum(['all', 'duplicates', 'unique']).optional(),
        regDuplicateFilter: z.enum(['all', 'reg-duplicates', 'reg-unique']).optional(),
        sortBy: z.enum(['name', 'registration', 'year', 'make', 'model']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional().default({})
    )
    .query(({ input }) => {
      const catalog = loadVehicleData();
      const filters: VehicleFilters = {
        search: input.search,
        source: input.source,
        status: input.status,
        published: input.published,
        hasImages: input.hasImages,
        hasContact: input.hasContact,
        hasAddress: input.hasAddress,
        hasRegistration: input.hasRegistration,
        catalogFilter: input.catalogFilter,
        cleansedFilter: input.cleansedFilter,
        submissionFilter: input.submissionFilter,
        duplicateFilter: input.duplicateFilter,
        regDuplicateFilter: input.regDuplicateFilter,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      };

      const filtered = filterVehicles(catalog.records, filters);
      
      // Apply sorting if specified
      const sorted = filters.sortBy 
        ? sortVehicles(filtered, filters.sortBy, filters.sortOrder || 'asc')
        : filtered;
      
      const paginated = sorted.slice(input.offset, input.offset + input.limit);

      return {
        vehicles: paginated,
        total: sorted.length,
        metadata: catalog.metadata,
      };
    }),

  // Get a specific vehicle by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const catalog = loadVehicleData();
      const vehicle = catalog.records.find(record => record.id === input.id);
      
      if (!vehicle) {
        throw new Error(`Vehicle with ID ${input.id} not found`);
      }

      return vehicle;
    }),

  // Get vehicle statistics
  getStats: publicProcedure
    .query(() => {
      const catalog = loadVehicleData();
      return calculateStats(catalog.records);
    }),

  // Get catalog metadata
  getMetadata: publicProcedure
    .query(() => {
      const catalog = loadVehicleData();
      return catalog.metadata;
    }),

  // Get filter counts for UI
  getFilterCounts: publicProcedure
    .query(() => {
      const catalog = loadVehicleData();
      const records = catalog.records;

      return {
        all: records.length,
        catalog: records.filter(r => r.sources.includes('catalog') && !r.sources.includes('cleansed') && !r.sources.includes('submission')).length,
        cleansed: records.filter(r => r.sources.length === 1 && r.sources.includes('cleansed')).length,
        submission: records.filter(r => r.sources.length === 1 && r.sources.includes('submission')).length,
        'has-submission': records.filter(r => r.sources.includes('submission')).length,
        'has-cleansed': records.filter(r => r.sources.includes('cleansed')).length,
        multi: records.filter(r => r.sources.length > 1).length,
        published: records.filter(r => r.vehicle.published).length,
        withAddress: records.filter(r => {
          return r.owner && r.owner.address && (
            r.owner.address.street ||
            r.owner.address.city ||
            r.owner.address.county ||
            r.owner.address.postcode ||
            r.owner.address.country
          );
        }).length,
        withRegistration: records.filter(r => r.vehicle.registration && r.vehicle.registration.trim() !== '').length,
        withContact: records.filter(r => r.owner && (
          r.owner.firstName || 
          r.owner.lastName || 
          r.owner.phone || 
          r.owner.email
        )).length,
        withoutContact: records.filter(r => !r.owner || !(
          r.owner.firstName || 
          r.owner.lastName || 
          r.owner.phone || 
          r.owner.email
        )).length,
        withImages: records.filter(r => r.images && r.images.urls && r.images.urls.length > 0).length,
        withoutImages: records.filter(r => !r.images || !r.images.urls || r.images.urls.length === 0).length,
        duplicates: records.filter(r => r.duplicate === true).length,
        unique: records.filter(r => r.duplicate !== true && r.hasDuplicates !== true).length,
        regDuplicates: (() => {
          // Calculate registration duplicates
          const regGroups = new Map<string, VehicleData[]>();
          
          records.forEach(record => {
            const reg = record.vehicle.registration;
            if (reg && reg.trim()) {
              const normalized = normalizeRegistrationNumber(reg);
              if (normalized) {
                if (!regGroups.has(normalized)) {
                  regGroups.set(normalized, []);
                }
                regGroups.get(normalized)!.push(record);
              }
            }
          });
          
          const duplicateRegs = Array.from(regGroups.values()).filter(group => group.length > 1);
          return duplicateRegs.flat().length;
        })(),
        regUnique: (() => {
          // Calculate registration unique
          const regGroups = new Map<string, VehicleData[]>();
          
          records.forEach(record => {
            const reg = record.vehicle.registration;
            if (reg && reg.trim()) {
              const normalized = normalizeRegistrationNumber(reg);
              if (normalized) {
                if (!regGroups.has(normalized)) {
                  regGroups.set(normalized, []);
                }
                regGroups.get(normalized)!.push(record);
              }
            }
          });
          
          const uniqueRegs = Array.from(regGroups.values()).filter(group => group.length === 1);
          return uniqueRegs.flat().length;
        })(),
      };
    }),
});
