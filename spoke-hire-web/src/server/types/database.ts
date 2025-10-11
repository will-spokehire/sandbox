/**
 * Database Types
 * 
 * Types related to database operations, clients, and repository patterns.
 */

import { type db } from "~/server/db";

/**
 * Database client type (includes Prisma extensions)
 */
export type DbClient = typeof db;

/**
 * Transaction client type (for use within transactions)
 */
export type TransactionClient = Parameters<Parameters<DbClient["$transaction"]>[0]>[0];

/**
 * Find many options for repositories
 */
export interface FindManyOptions {
  take?: number;
  skip?: number;
  cursor?: { id: string };
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
}

/**
 * Create options for repositories
 */
export interface CreateOptions {
  data: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
}

/**
 * Update options for repositories
 */
export interface UpdateOptions {
  where: { id: string };
  data: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
}

/**
 * Delete options for repositories
 */
export interface DeleteOptions {
  where: { id: string };
}

