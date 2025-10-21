/**
 * Service Factory
 * 
 * Centralized factory for creating service instances with proper dependency injection.
 * Uses singleton pattern to ensure consistent service instances across requests.
 * 
 * Benefits:
 * - Consistent dependency injection
 * - Easy to test (can inject mock dependencies)
 * - Centralized service creation logic
 * - Lazy initialization
 */

import { type DbClient } from "../repositories/base.repository";
import { VehicleService } from "./vehicle.service";
import { DealService } from "./deal.service";
import { LookupService } from "./lookup.service";
import { AuthService } from "./auth.service";
import { MediaService } from "./media.service";
import { AIVehicleGeneratorService } from "./ai-vehicle-generator.service";
import { VehicleRepository } from "../repositories/vehicle.repository";
import { UserRepository } from "../repositories/user.repository";
import { LookupRepository } from "../repositories/lookup.repository";
import { DealRepository } from "../repositories/deal.repository";
import { MediaRepository } from "../repositories/media.repository";
import { VehicleQueryBuilder } from "../builders/vehicle-query.builder";
import { cacheService } from "./cache.service";
import { type SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "~/lib/supabase/server";

/**
 * Service Factory Class
 * 
 * Creates service instances with their dependencies properly injected.
 * Implements full dependency injection pattern for all services.
 */
export class ServiceFactory {
  /**
   * Create VehicleService with dependencies
   */
  static createVehicleService(db: DbClient): VehicleService {
    const repository = new VehicleRepository(db);
    const queryBuilder = new VehicleQueryBuilder();
    
    return new VehicleService(repository, queryBuilder, cacheService, db);
  }

  /**
   * Create DealService with dependencies
   */
  static createDealService(db: DbClient): DealService {
    const repository = new DealRepository(db);
    return new DealService(repository);
  }

  /**
   * Create LookupService with dependencies
   */
  static createLookupService(db: DbClient): LookupService {
    const repository = new LookupRepository(db);
    return new LookupService(repository, cacheService);
  }

  /**
   * Create AuthService with dependencies
   */
  static createAuthService(db: DbClient, supabase: SupabaseClient): AuthService {
    const repository = new UserRepository(db);
    return new AuthService(repository, supabase);
  }

  /**
   * Create MediaService with dependencies
   */
  static createMediaService(db: DbClient): MediaService {
    const repository = new MediaRepository(db);
    const supabaseClient = createAdminClient();
    return new MediaService(repository, supabaseClient, cacheService, db);
  }

  /**
   * Create AIVehicleGeneratorService
   */
  static createAIVehicleGeneratorService(): AIVehicleGeneratorService {
    return new AIVehicleGeneratorService();
  }

  /**
   * Create VehicleRepository
   */
  static createVehicleRepository(db: DbClient): VehicleRepository {
    return new VehicleRepository(db);
  }

  /**
   * Create DealRepository
   */
  static createDealRepository(db: DbClient): DealRepository {
    return new DealRepository(db);
  }

  /**
   * Create UserRepository
   */
  static createUserRepository(db: DbClient): UserRepository {
    return new UserRepository(db);
  }

  /**
   * Create LookupRepository
   */
  static createLookupRepository(db: DbClient): LookupRepository {
    return new LookupRepository(db);
  }

  /**
   * Get cache service singleton
   */
  static getCacheService() {
    return cacheService;
  }
}

/**
 * Helper function to create all services for a request
 * Useful for contexts where multiple services are needed
 */
export function createServices(db: DbClient, supabase?: SupabaseClient) {
  return {
    vehicle: ServiceFactory.createVehicleService(db),
    deal: ServiceFactory.createDealService(db),
    lookup: ServiceFactory.createLookupService(db),
    ...(supabase && { auth: ServiceFactory.createAuthService(db, supabase) }),
  };
}

/**
 * Helper function to create all repositories for a request
 * Useful for service constructors that need multiple repositories
 */
export function createRepositories(db: DbClient) {
  return {
    vehicle: ServiceFactory.createVehicleRepository(db),
    deal: ServiceFactory.createDealRepository(db),
    user: ServiceFactory.createUserRepository(db),
    lookup: ServiceFactory.createLookupRepository(db),
  };
}

