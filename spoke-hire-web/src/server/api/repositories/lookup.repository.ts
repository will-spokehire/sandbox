/**
 * Lookup Repository
 * 
 * Data access layer for lookup tables (Make, Model, Collection, SteeringType, Country).
 * Handles all Prisma queries related to reference data.
 */

import { type PrismaClient } from "@prisma/client";
import { DatabaseError } from "../errors/app-errors";

// Use the proper Prisma client type
type DbClient = PrismaClient;

export class LookupRepository {
  constructor(private db: DbClient) {}

  /**
   * Get all active makes
   */
  async getAllMakes() {
    try {
      return await this.db.make.findMany({
        where: { isActive: true },
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
   * Get distinct exterior colors
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
      throw new DatabaseError("Failed to fetch exterior colors", error);
    }
  }

  /**
   * Get distinct interior colors
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
      throw new DatabaseError("Failed to fetch interior colors", error);
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
}
