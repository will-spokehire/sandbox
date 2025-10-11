/**
 * Vehicle Repository
 * 
 * Data access layer for Vehicle entity.
 * Handles all Prisma queries related to vehicles.
 */

import { type Prisma, type VehicleStatus } from "@prisma/client";
import { DatabaseError, VehicleNotFoundError } from "../errors/app-errors";
import { type db } from "~/server/db";

// Use the actual DB client type (with extensions)
type DbClient = typeof db;

export interface FindManyOptions {
  take?: number;
  skip?: number;
  cursor?: string;
  orderBy?: Prisma.VehicleOrderByWithRelationInput;
}

export interface VehicleWithRelations {
  id: string;
  name: string;
  status: VehicleStatus;
  price: Prisma.Decimal | null;
  year: string;
  registration: string | null;
  make: { id: string; name: string };
  model: { id: string; name: string };
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    postcode: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    country: { id: string; name: string } | null;
  };
  media: Array<{
    id: string;
    publishedUrl: string | null;
    originalUrl: string;
    type: string;
  }>;
  _count: {
    media: number;
  };
}

export class VehicleRepository {
  constructor(private db: DbClient) {}

  /**
   * Find many vehicles with filters and pagination
   */
  async findMany(
    where: Prisma.VehicleWhereInput,
    options: FindManyOptions = {}
  ) {
    try {
      const vehicles = await this.db.vehicle.findMany({
        where,
        take: options.take,
        skip: options.skip,
        orderBy: options.orderBy,
        include: {
          make: {
            select: {
              id: true,
              name: true,
            },
          },
          model: {
            select: {
              id: true,
              name: true,
            },
          },
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              postcode: true,
              city: true,
              latitude: true,
              longitude: true,
              country: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          media: {
            where: {
              isPrimary: true,
              isVisible: true,
              status: "READY",
            },
            take: 1,
            select: {
              id: true,
              publishedUrl: true,
              originalUrl: true,
              type: true,
            },
          },
          _count: {
            select: {
              media: true,
            },
          },
        },
      });

      return vehicles;
    } catch (error) {
      throw new DatabaseError("Failed to fetch vehicles", error);
    }
  }

  /**
   * Count vehicles matching filter
   */
  async count(where: Prisma.VehicleWhereInput): Promise<number> {
    try {
      return await this.db.vehicle.count({ where });
    } catch (error) {
      throw new DatabaseError("Failed to count vehicles", error);
    }
  }

  /**
   * Find vehicle by ID with full details
   */
  async findById(id: string) {
    try {
      const vehicle = await this.db.vehicle.findUnique({
        where: { id },
        include: {
          make: true,
          model: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              userType: true,
              status: true,
              street: true,
              city: true,
              county: true,
              postcode: true,
              country: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          steering: true,
        },
      });

      if (!vehicle) {
        throw new VehicleNotFoundError(id);
      }

      return vehicle;
    } catch (error) {
      if (error instanceof VehicleNotFoundError) {
        throw error;
      }
      throw new DatabaseError("Failed to fetch vehicle", error);
    }
  }

  /**
   * Find vehicle media
   */
  async findMediaByVehicleId(vehicleId: string, limit = 100) {
    try {
      return await this.db.media.findMany({
        where: { vehicleId },
        orderBy: { order: "asc" },
        take: limit,
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch vehicle media", error);
    }
  }

  /**
   * Find vehicle sources
   */
  async findSourcesByVehicleId(vehicleId: string, limit = 20) {
    try {
      return await this.db.vehicleSource.findMany({
        where: { vehicleId },
        take: limit,
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch vehicle sources", error);
    }
  }

  /**
   * Find vehicle specifications
   */
  async findSpecificationsByVehicleId(vehicleId: string, limit = 200) {
    try {
      return await this.db.vehicleSpecification.findMany({
        where: { vehicleId },
        orderBy: { category: "asc" },
        take: limit,
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch vehicle specifications", error);
    }
  }

  /**
   * Find vehicle collections
   */
  async findCollectionsByVehicleId(vehicleId: string) {
    try {
      return await this.db.vehicleCollection.findMany({
        where: { vehicleId },
        include: {
          collection: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch vehicle collections", error);
    }
  }

  /**
   * Update vehicle status
   */
  async updateStatus(id: string, status: VehicleStatus) {
    try {
      const vehicle = await this.db.vehicle.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          make: true,
          model: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return vehicle;
    } catch (error) {
      throw new DatabaseError("Failed to update vehicle status", error);
    }
  }

  /**
   * Soft delete vehicle (archive)
   */
  async softDelete(id: string) {
    try {
      return await this.db.vehicle.update({
        where: { id },
        data: {
          status: "ARCHIVED",
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to delete vehicle", error);
    }
  }

  /**
   * Execute raw SQL query
   */
  async queryRaw<T = unknown>(query: Prisma.Sql): Promise<T[]> {
    try {
      return await this.db.$queryRaw<T[]>(query);
    } catch (error) {
      throw new DatabaseError("Failed to execute raw query", error);
    }
  }

  /**
   * Get vehicles with relations by IDs (for merging with raw query results)
   */
  async findManyByIds(ids: string[]) {
    if (ids.length === 0) return [];

    try {
      const vehicles = await this.db.vehicle.findMany({
        where: { id: { in: ids } },
        include: {
          make: { select: { id: true, name: true } },
          model: { select: { id: true, name: true } },
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              postcode: true,
              city: true,
              latitude: true,
              longitude: true,
              country: { select: { id: true, name: true } },
            },
          },
          media: {
            where: {
              isPrimary: true,
              isVisible: true,
              status: "READY",
            },
            take: 1,
            select: {
              id: true,
              publishedUrl: true,
              originalUrl: true,
              type: true,
            },
          },
          _count: { select: { media: true } },
        },
      });

      return vehicles;
    } catch (error) {
      throw new DatabaseError("Failed to fetch vehicles by IDs", error);
    }
  }
}
