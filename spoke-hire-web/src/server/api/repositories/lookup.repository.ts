/**
 * Lookup Repository
 * 
 * Data access layer for lookup tables (Make, Model, Collection, SteeringType, Country).
 * Handles all Prisma queries related to reference data.
 */

import { DatabaseError } from "../errors/app-errors";
import { BaseRepository } from "./base.repository";

export class LookupRepository extends BaseRepository {
  // Lookup repository doesn't have a single model, so we return null
  protected readonly model = null;

  protected readonly entityName = "Lookup" as const;

  /**
   * Get all active makes
   */
  async getAllMakes() {
    try {
      return await this.db.make.findMany({
        where: { 
          isActive: true,
          isPublished: true, // Only show published makes to users
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch makes", error);
    }
  }

  /**
   * Get models by make ID
   */
  async getModelsByMake(makeId: string) {
    try {
      return await this.db.model.findMany({
        where: {
          makeId,
          isActive: true,
          isPublished: true, // Only show published models to users
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch models", error);
    }
  }

  /**
   * Get all active collections
   */
  async getAllCollections() {
    try {
      return await this.db.collection.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch collections", error);
    }
  }

  /**
   * Get all steering types
   */
  async getAllSteeringTypes() {
    try {
      return await this.db.steeringType.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch steering types", error);
    }
  }

  /**
   * Get distinct exterior colours
   */
  async getDistinctExteriorColors(): Promise<string[]> {
    try {
      const result = await this.db.$queryRaw<Array<{ exteriorColour: string }>>`
        SELECT DISTINCT "exteriorColour"
        FROM "Vehicle"
        WHERE "exteriorColour" IS NOT NULL
        ORDER BY "exteriorColour" ASC
      `;
      return result.map((r) => r.exteriorColour).filter(Boolean);
    } catch (error) {
      throw new DatabaseError("Failed to fetch exterior colours", error);
    }
  }

  /**
   * Get distinct interior colours
   */
  async getDistinctInteriorColors(): Promise<string[]> {
    try {
      const result = await this.db.$queryRaw<Array<{ interiorColour: string }>>`
        SELECT DISTINCT "interiorColour"
        FROM "Vehicle"
        WHERE "interiorColour" IS NOT NULL
        ORDER BY "interiorColour" ASC
      `;
      return result.map((r) => r.interiorColour).filter(Boolean);
    } catch (error) {
      throw new DatabaseError("Failed to fetch interior colours", error);
    }
  }

  /**
   * Get distinct years
   */
  async getDistinctYears(): Promise<string[]> {
    try {
      const result = await this.db.$queryRaw<Array<{ year: string }>>`
        SELECT DISTINCT "year"
        FROM "Vehicle"
        ORDER BY "year" DESC
      `;
      return result.map((r) => r.year);
    } catch (error) {
      throw new DatabaseError("Failed to fetch years", error);
    }
  }

  /**
   * Get distinct number of seats
   */
  async getDistinctSeats(): Promise<number[]> {
    try {
      const result = await this.db.$queryRaw<Array<{ numberOfSeats: number }>>`
        SELECT DISTINCT "numberOfSeats"
        FROM "Vehicle"
        WHERE "numberOfSeats" IS NOT NULL
        ORDER BY "numberOfSeats" ASC
      `;
      return result.map((r) => r.numberOfSeats).filter((s) => s !== null);
    } catch (error) {
      throw new DatabaseError("Failed to fetch seat counts", error);
    }
  }

  /**
   * Get distinct gearbox types
   */
  async getDistinctGearboxTypes(): Promise<string[]> {
    try {
      const result = await this.db.$queryRaw<Array<{ gearbox: string }>>`
        SELECT DISTINCT gearbox
        FROM "Vehicle"
        WHERE gearbox IS NOT NULL
        ORDER BY gearbox ASC
      `;
      return result.map((r) => r.gearbox).filter(Boolean);
    } catch (error) {
      throw new DatabaseError("Failed to fetch gearbox types", error);
    }
  }

  /**
   * Get vehicle status counts
   */
  async getStatusCounts() {
    try {
      return await this.db.vehicle.groupBy({
        by: ["status"],
        _count: true,
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch status counts", error);
    }
  }

  /**
   * Get all active countries
   */
  async getAllCountries() {
    try {
      return await this.db.country.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch countries", error);
    }
  }

  /**
   * Get distinct counties from users
   */
  async getDistinctCounties(): Promise<string[]> {
    try {
      const result = await this.db.$queryRaw<Array<{ county: string }>>`
        SELECT DISTINCT u.county
        FROM "User" u
        INNER JOIN "Vehicle" v ON v."ownerId" = u.id
        WHERE u.county IS NOT NULL
        ORDER BY u.county ASC
      `;
      return result.map((r) => r.county).filter(Boolean);
    } catch (error) {
      throw new DatabaseError("Failed to fetch counties", error);
    }
  }

  /**
   * Get makes that have at least one published vehicle
   */
  async getMakesWithPublishedVehicles() {
    try {
      return await this.db.make.findMany({
        where: {
          isActive: true,
          isPublished: true,
          vehicles: {
            some: {
              status: "PUBLISHED",
            },
          },
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch makes with published vehicles", error);
    }
  }

  /**
   * Get models by make ID that have at least one published vehicle
   */
  async getModelsByMakeWithPublishedVehicles(makeId: string) {
    try {
      return await this.db.model.findMany({
        where: {
          makeId,
          isActive: true,
          isPublished: true,
          vehicles: {
            some: {
              status: "PUBLISHED",
            },
          },
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch models with published vehicles", error);
    }
  }

  /**
   * Get collections that have at least one published vehicle
   */
  async getCollectionsWithPublishedVehicles() {
    try {
      return await this.db.collection.findMany({
        where: {
          isActive: true,
          vehicles: {
            some: {
              vehicle: {
                status: "PUBLISHED",
              },
            },
          },
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch collections with published vehicles", error);
    }
  }

  /**
   * Get countries that have at least one published vehicle
   */
  async getCountriesWithPublishedVehicles() {
    try {
      return await this.db.country.findMany({
        where: {
          isActive: true,
          users: {
            some: {
              vehicles: {
                some: {
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch countries with published vehicles", error);
    }
  }

  /**
   * Get distinct counties that have at least one published vehicle
   */
  async getCountiesWithPublishedVehicles(): Promise<string[]> {
    try {
      const result = await this.db.$queryRaw<Array<{ county: string }>>`
        SELECT DISTINCT u.county
        FROM "User" u
        INNER JOIN "Vehicle" v ON v."ownerId" = u.id
        WHERE u.county IS NOT NULL
          AND v.status = 'PUBLISHED'
        ORDER BY u.county ASC
      `;
      return result.map((r) => r.county).filter(Boolean);
    } catch (error) {
      throw new DatabaseError("Failed to fetch counties with published vehicles", error);
    }
  }

  /**
   * Get filter options based on current filters (cascading filters)
   * Only returns options that would yield results given current filter state
   */
  async getPublicFilterOptions(filters: {
    makeIds?: string[];
    modelId?: string;
    collectionIds?: string[];
    yearFrom?: string;
    yearTo?: string;
    countryIds?: string[];
    counties?: string[];
  }) {
    // Helper to build WHERE clause excluding specific filter
    const buildWhereClause = (excludeFilter?: 'make' | 'model' | 'collection' | 'country' | 'county') => {
      const conditions: any[] = [{ status: "PUBLISHED" }];

      if (excludeFilter !== 'make' && filters.makeIds && filters.makeIds.length > 0) {
        conditions.push({ makeId: { in: filters.makeIds } });
      }
      if (excludeFilter !== 'model' && filters.modelId) {
        conditions.push({ modelId: filters.modelId });
      }
      if (excludeFilter !== 'collection' && filters.collectionIds && filters.collectionIds.length > 0) {
        conditions.push({
          collections: {
            some: {
              collectionId: { in: filters.collectionIds },
            },
          },
        });
      }
      if (filters.yearFrom || filters.yearTo) {
        const yearConditions: any = {};
        if (filters.yearFrom) yearConditions.gte = filters.yearFrom;
        if (filters.yearTo) yearConditions.lte = filters.yearTo;
        conditions.push({ year: yearConditions });
      }
      if (excludeFilter !== 'country' && filters.countryIds && filters.countryIds.length > 0) {
        conditions.push({
          owner: {
            countryId: { in: filters.countryIds },
          },
        });
      }
      if (excludeFilter !== 'county' && filters.counties && filters.counties.length > 0) {
        conditions.push({
          owner: {
            county: { in: filters.counties },
          },
        });
      }

      return { AND: conditions };
    };

    try {
      // Fetch distinct values in parallel
      const [makes, models, collections, countries, counties] = await Promise.all([
        // Get makes - exclude make filter so selected makes are still visible
        this.db.make.findMany({
          where: {
            isActive: true,
            isPublished: true,
            vehicles: {
              some: buildWhereClause('make'),
            },
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),

        // Get models - filter by makeIds but exclude model filter
        this.db.model.findMany({
          where: {
            isActive: true,
            isPublished: true,
            ...(filters.makeIds && filters.makeIds.length > 0 ? { makeId: { in: filters.makeIds } } : {}),
            vehicles: {
              some: buildWhereClause('model'),
            },
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),

        // Get collections - exclude collection filter so selected collections are still visible
        this.db.collection.findMany({
          where: {
            isActive: true,
            vehicles: {
              some: {
                vehicle: buildWhereClause('collection'),
              },
            },
          },
          select: { id: true, name: true, color: true },
          orderBy: { name: "asc" },
        }),

        // Get countries - exclude country filter so selected countries are still visible
        this.db.country.findMany({
          where: {
            isActive: true,
            users: {
              some: {
                vehicles: {
                  some: buildWhereClause('country'),
                },
              },
            },
          },
          select: { id: true, name: true, code: true },
          orderBy: { name: "asc" },
        }),

        // Get counties - exclude county filter so selected counties are still visible
        (async () => {
          const conditions: string[] = ['v.status = \'PUBLISHED\'', 'u.county IS NOT NULL'];
          
          if (filters.makeIds && filters.makeIds.length > 0) {
            const makeIdList = filters.makeIds.map(id => `'${id}'`).join(',');
            conditions.push(`v."makeId" IN (${makeIdList})`);
          }
          if (filters.modelId) {
            conditions.push(`v."modelId" = '${filters.modelId}'`);
          }
          if (filters.yearFrom) {
            conditions.push(`v.year >= '${filters.yearFrom}'`);
          }
          if (filters.yearTo) {
            conditions.push(`v.year <= '${filters.yearTo}'`);
          }
          if (filters.countryIds && filters.countryIds.length > 0) {
            const countryIdList = filters.countryIds.map(id => `'${id}'`).join(',');
            conditions.push(`u."countryId" IN (${countryIdList})`);
          }
          // Exclude county filter - don't filter by county when fetching counties

          const whereClause = conditions.join(' AND ');
          
          const query = `
            SELECT DISTINCT u.county
            FROM "User" u
            INNER JOIN "Vehicle" v ON v."ownerId" = u.id
            WHERE ${whereClause}
            ORDER BY u.county ASC
          `;

          const result = await this.db.$queryRawUnsafe<Array<{ county: string }>>(query);
          return result.map((r) => r.county).filter(Boolean);
        })(),
      ]);

      return {
        makes,
        models,
        collections,
        countries,
        counties,
      };
    } catch (error) {
      throw new DatabaseError("Failed to fetch dynamic filter options", error);
    }
  }
}
