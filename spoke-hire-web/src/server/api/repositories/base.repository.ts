/**
 * Base Repository
 * 
 * Abstract base class for all repositories.
 * Provides common CRUD operations, error handling, and transaction support.
 */

import { DatabaseError } from "../errors/app-errors";
import type { DbClient, PaginationResult } from "~/server/types";
import type { Prisma } from "@prisma/client";

// Re-export DbClient for use in other repositories
export type { DbClient };

export interface FindManyOptions {
  take?: number;
  skip?: number;
  cursor?: string;
  orderBy?: unknown;
}

/**
 * Helper type for Prisma model delegates
 * This represents any Prisma model delegate (e.g., db.user, db.vehicle, etc.)
 * Using a more flexible type to accommodate Prisma's complex type system
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaModelDelegate = any;

/**
 * Abstract base repository with common data access patterns
 */
export abstract class BaseRepository<T = unknown> {
  constructor(protected db: DbClient) {}

  /**
   * Get the Prisma model for this repository
   * Must be implemented by concrete repositories
   */
  protected abstract get model(): PrismaModelDelegate;
  
  /**
   * Get the entity name for error messages
   * Must be implemented by concrete repositories
   */
  protected abstract get entityName(): string;

  /**
   * Find a single record by ID
   */
  async findById(id: string, include?: Record<string, unknown>): Promise<T | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await this.model.findUnique({
        where: { id },
        ...(include && { include }),
      });
      return result as T | null;
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.entityName} by ID`, error);
    }
  }

  /**
   * Find many records with filters and pagination
   */
  async findMany(where: Record<string, unknown>, options: FindManyOptions = {}): Promise<T[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await this.model.findMany({
        where,
        take: options.take,
        skip: options.skip,
        orderBy: options.orderBy,
      });
      return result as T[];
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.entityName} records`, error);
    }
  }

  /**
   * Count records matching filter
   */
  async count(where: Record<string, unknown> = {}): Promise<number> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return await this.model.count({ where });
    } catch (error) {
      throw new DatabaseError(`Failed to count ${this.entityName} records`, error);
    }
  }

  /**
   * Create a new record
   */
  async create(data: Record<string, unknown>, include?: Record<string, unknown>): Promise<T> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await this.model.create({
        data,
        ...(include && { include }),
      });
      return result as T;
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.entityName}`, error);
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Record<string, unknown>, include?: Record<string, unknown>): Promise<T> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await this.model.update({
        where: { id },
        data,
        ...(include && { include }),
      });
      return result as T;
    } catch (error) {
      throw new DatabaseError(`Failed to update ${this.entityName}`, error);
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<T> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await this.model.delete({
        where: { id },
      });
      return result as T;
    } catch (error) {
      throw new DatabaseError(`Failed to delete ${this.entityName}`, error);
    }
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const count = await this.model.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check ${this.entityName} existence`, error);
    }
  }

  /**
   * Execute a raw SQL query
   * Use with caution - prefer Prisma queries when possible
   */
  async queryRaw<R = Record<string, unknown>>(query: Prisma.Sql): Promise<R[]> {
    try {
      const result = await this.db.$queryRaw(query);
      return result as R[];
    } catch (error) {
      throw new DatabaseError(`Failed to execute raw query for ${this.entityName}`, error);
    }
  }

  /**
   * Execute operations within a transaction
   * 
   * @example
   * await repository.transaction(async (tx) => {
   *   await tx.vehicle.create({ ... });
   *   await tx.media.create({ ... });
   * });
   */
  async transaction<R>(
    callback: (tx: DbClient) => Promise<R>
  ): Promise<R> {
    try {
      // Type assertion needed because Prisma's $transaction has complex type constraints
      // The callback signature matches but TypeScript can't infer the relationship with extended client
      const result = await this.db.$transaction(callback as never);
      return result as R;
    } catch (error) {
      throw new DatabaseError(`Transaction failed for ${this.entityName}`, error);
    }
  }

  /**
   * Find many with pagination support
   * Returns items, nextCursor, and optionally totalCount
   */
  async findManyPaginated(
    where: Record<string, unknown>,
    options: FindManyOptions & { includeTotalCount?: boolean } = {}
  ): Promise<PaginationResult<T>> {
    const { take = 20, skip = 0, orderBy, includeTotalCount = false } = options;

    try {
      // Fetch one extra item to determine if there's a next page
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const items = await this.model.findMany({
        where,
        take: take + 1,
        skip,
        orderBy,
      });

      // Determine next cursor
      let nextCursor: string | undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (items.length > take) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const nextItem = items.pop();
        // Type assertion needed because we know the item has an id property
        nextCursor = (nextItem as { id: string })?.id;
      }

      // Get total count if requested
      let totalCount: number | undefined;
      if (includeTotalCount) {
        totalCount = await this.count(where);
      }

      return {
        items: items as T[],
        nextCursor,
        totalCount,
      };
    } catch (error) {
      throw new DatabaseError(`Failed to paginate ${this.entityName} records`, error);
    }
  }
}

