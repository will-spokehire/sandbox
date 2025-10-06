/**
 * Vehicle Query Builder
 * 
 * Builds complex SQL queries for vehicle filtering, especially for PostGIS distance queries.
 * Centralizes SQL building logic to avoid duplication and improve maintainability.
 */

import { Prisma, type VehicleStatus } from "@prisma/client";
import { getPostGISDistanceSQL, getPostGISDWithinFilter } from "~/lib/services/distance";

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
  numberOfSeats?: number[];
  gearboxTypes?: string[];
  steeringIds?: string[];
  search?: string;
}

export interface DistanceQueryParams {
  userLatitude: number;
  userLongitude: number;
  maxDistanceMiles: number;
  filters: VehicleFilters;
  limit: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  sortByDistance?: boolean;
}

export class VehicleQueryBuilder {
  /**
   * Build WHERE conditions for SQL queries
   */
  buildWhereConditions(filters: VehicleFilters): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = [];

    // Status filter
    if (filters.status) {
      conditions.push(
        Prisma.sql`v.status = ${filters.status}::text::"VehicleStatus"`
      );
    }

    // Make filter (supports both single and multiple)
    if (filters.makeIds && filters.makeIds.length > 0) {
      conditions.push(Prisma.sql`v."makeId" = ANY(${filters.makeIds}::text[])`);
    } else if (filters.makeId) {
      conditions.push(Prisma.sql`v."makeId" = ${filters.makeId}`);
    }

    // Model filter
    if (filters.modelId) {
      conditions.push(Prisma.sql`v."modelId" = ${filters.modelId}`);
    }

    // Exterior color filter
    if (filters.exteriorColors && filters.exteriorColors.length > 0) {
      conditions.push(
        Prisma.sql`v."exteriorColour" = ANY(${filters.exteriorColors}::text[])`
      );
    }

    // Interior color filter
    if (filters.interiorColors && filters.interiorColors.length > 0) {
      conditions.push(
        Prisma.sql`v."interiorColour" = ANY(${filters.interiorColors}::text[])`
      );
    }

    // Year range filter
    if (filters.yearFrom) {
      conditions.push(Prisma.sql`v.year >= ${filters.yearFrom}`);
    }
    if (filters.yearTo) {
      conditions.push(Prisma.sql`v.year <= ${filters.yearTo}`);
    }

    // Price range filter
    if (filters.priceFrom !== undefined) {
      conditions.push(Prisma.sql`v.price >= ${filters.priceFrom}`);
    }
    if (filters.priceTo !== undefined) {
      conditions.push(Prisma.sql`v.price <= ${filters.priceTo}`);
    }

    // Owner filter
    if (filters.ownerId) {
      conditions.push(Prisma.sql`v."ownerId" = ${filters.ownerId}`);
    }

    // Number of seats filter
    if (filters.numberOfSeats && filters.numberOfSeats.length > 0) {
      conditions.push(
        Prisma.sql`v."numberOfSeats" = ANY(${filters.numberOfSeats}::integer[])`
      );
    }

    // Gearbox filter
    if (filters.gearboxTypes && filters.gearboxTypes.length > 0) {
      conditions.push(
        Prisma.sql`v.gearbox = ANY(${filters.gearboxTypes}::text[])`
      );
    }

    // Steering filter
    if (filters.steeringIds && filters.steeringIds.length > 0) {
      conditions.push(
        Prisma.sql`v."steeringId" = ANY(${filters.steeringIds}::text[])`
      );
    }

    // Collection filter (many-to-many)
    if (filters.collectionIds && filters.collectionIds.length > 0) {
      conditions.push(
        Prisma.sql`EXISTS (
          SELECT 1 FROM "VehicleCollection" vc 
          WHERE vc."vehicleId" = v.id 
          AND vc."collectionId" = ANY(${filters.collectionIds}::text[])
        )`
      );
    }

    // Search filter (across multiple fields)
    if (filters.search && filters.search.trim()) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        Prisma.sql`(
          v.name ILIKE ${searchTerm}
          OR v.registration ILIKE ${searchTerm}
          OR v.description ILIKE ${searchTerm}
          OR EXISTS (SELECT 1 FROM "Make" m WHERE m.id = v."makeId" AND m.name ILIKE ${searchTerm})
          OR EXISTS (SELECT 1 FROM "Model" mo WHERE mo.id = v."modelId" AND mo.name ILIKE ${searchTerm})
          OR u.email ILIKE ${searchTerm}
          OR u."firstName" ILIKE ${searchTerm}
          OR u."lastName" ILIKE ${searchTerm}
          OR u.phone ILIKE ${searchTerm}
        )`
      );
    }

    return conditions;
  }

  /**
   * Build ORDER BY clause
   */
  buildOrderByClause(
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
    sortByDistance = false
  ): Prisma.Sql {
    if (sortBy === "distance" || sortByDistance) {
      return Prisma.sql`distance ASC`;
    }

    if (sortBy === "name") {
      return sortOrder === "asc"
        ? Prisma.sql`v.name ASC`
        : Prisma.sql`v.name DESC`;
    }

    if (sortBy === "price") {
      return sortOrder === "asc"
        ? Prisma.sql`v.price ASC NULLS LAST`
        : Prisma.sql`v.price DESC NULLS LAST`;
    }

    if (sortBy === "year") {
      return sortOrder === "asc"
        ? Prisma.sql`v.year ASC NULLS LAST`
        : Prisma.sql`v.year DESC NULLS LAST`;
    }

    if (sortBy === "updatedAt") {
      return sortOrder === "asc"
        ? Prisma.sql`v."updatedAt" ASC`
        : Prisma.sql`v."updatedAt" DESC`;
    }

    // Default to createdAt
    return sortOrder === "asc"
      ? Prisma.sql`v."createdAt" ASC`
      : Prisma.sql`v."createdAt" DESC`;
  }

  /**
   * Build complete distance-based query
   */
  buildDistanceQuery(params: DistanceQueryParams): Prisma.Sql {
    const {
      userLatitude,
      userLongitude,
      maxDistanceMiles,
      filters,
      limit,
      skip = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
      sortByDistance = false,
    } = params;

    // Build PostGIS distance calculation
    const distanceSQL = getPostGISDistanceSQL(
      userLatitude,
      userLongitude,
      "miles",
      "u"
    );
    const dwithinFilter = getPostGISDWithinFilter(
      userLatitude,
      userLongitude,
      maxDistanceMiles,
      "miles",
      "u"
    );

    // Build WHERE conditions
    const conditions = this.buildWhereConditions(filters);
    const whereClause =
      conditions.length > 0
        ? Prisma.sql`AND ${Prisma.join(conditions, " AND ")}`
        : Prisma.empty;

    // Build ORDER BY clause
    const orderByClause = this.buildOrderByClause(
      sortBy,
      sortOrder,
      sortByDistance
    );

    // Construct complete query
    return Prisma.sql`
      SELECT 
        v.*,
        (${Prisma.raw(distanceSQL)}) as distance
      FROM "Vehicle" v
      INNER JOIN "User" u ON v."ownerId" = u.id
      WHERE 
        u."latitude" IS NOT NULL 
        AND u."longitude" IS NOT NULL
        AND ${Prisma.raw(dwithinFilter)}
        ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT ${limit + 1}
      OFFSET ${skip}
    `;
  }

  /**
   * Build count query for distance filtering
   */
  buildDistanceCountQuery(
    userLatitude: number,
    userLongitude: number,
    maxDistanceMiles: number,
    filters: VehicleFilters
  ): Prisma.Sql {
    const dwithinFilter = getPostGISDWithinFilter(
      userLatitude,
      userLongitude,
      maxDistanceMiles,
      "miles",
      "u"
    );

    const conditions = this.buildWhereConditions(filters);
    const whereClause =
      conditions.length > 0
        ? Prisma.sql`AND ${Prisma.join(conditions, " AND ")}`
        : Prisma.empty;

    return Prisma.sql`
      SELECT COUNT(*) as count
      FROM "Vehicle" v
      INNER JOIN "User" u ON v."ownerId" = u.id
      WHERE 
        u."latitude" IS NOT NULL 
        AND u."longitude" IS NOT NULL
        AND ${Prisma.raw(dwithinFilter)}
        ${whereClause}
    `;
  }

  /**
   * Build Prisma where clause (for non-distance queries)
   */
  buildPrismaWhere(filters: VehicleFilters): any {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.makeIds && filters.makeIds.length > 0) {
      where.makeId = { in: filters.makeIds };
    } else if (filters.makeId) {
      where.makeId = filters.makeId;
    }

    if (filters.modelId) {
      where.modelId = filters.modelId;
    }

    if (filters.collectionIds && filters.collectionIds.length > 0) {
      where.collections = {
        some: {
          collectionId: { in: filters.collectionIds },
        },
      };
    }

    if (filters.exteriorColors && filters.exteriorColors.length > 0) {
      where.exteriorColour = { in: filters.exteriorColors };
    }

    if (filters.interiorColors && filters.interiorColors.length > 0) {
      where.interiorColour = { in: filters.interiorColors };
    }

    if (filters.yearFrom || filters.yearTo) {
      where.year = {};
      if (filters.yearFrom) where.year.gte = filters.yearFrom;
      if (filters.yearTo) where.year.lte = filters.yearTo;
    }

    if (filters.priceFrom !== undefined || filters.priceTo !== undefined) {
      where.price = {};
      if (filters.priceFrom !== undefined) where.price.gte = filters.priceFrom;
      if (filters.priceTo !== undefined) where.price.lte = filters.priceTo;
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.numberOfSeats && filters.numberOfSeats.length > 0) {
      where.numberOfSeats = { in: filters.numberOfSeats };
    }

    if (filters.gearboxTypes && filters.gearboxTypes.length > 0) {
      where.gearbox = { in: filters.gearboxTypes };
    }

    if (filters.steeringIds && filters.steeringIds.length > 0) {
      where.steeringId = { in: filters.steeringIds };
    }

    if (filters.search && filters.search.trim()) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { registration: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { make: { name: { contains: filters.search, mode: "insensitive" } } },
        { model: { name: { contains: filters.search, mode: "insensitive" } } },
        { owner: { email: { contains: filters.search, mode: "insensitive" } } },
        { owner: { firstName: { contains: filters.search, mode: "insensitive" } } },
        { owner: { lastName: { contains: filters.search, mode: "insensitive" } } },
        { owner: { phone: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    return where;
  }
}
