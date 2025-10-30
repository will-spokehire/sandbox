/**
 * Vehicle Router (Refactored)
 * 
 * Handles all vehicle-related operations for the admin interface.
 * All procedures require admin authentication.
 * 
 * REFACTORED: Now uses ServiceFactory for consistent service creation.
 */

import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { VehicleStatus } from "@prisma/client";
import { ServiceFactory } from "../services/service-factory";
import { cacheService, CacheKeys } from "../services/cache.service";

// ============================================================================
// Input Validation Schemas
// ============================================================================

const listVehiclesInputSchema = z.object({
  // Pagination
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  skip: z.number().min(0).optional(),

  // Search
  search: z.string().optional(),

  // Filters
  status: z.nativeEnum(VehicleStatus).optional(),
  makeId: z.string().optional(),
  makeIds: z.array(z.string()).optional(),
  modelId: z.string().optional(),
  collectionIds: z.array(z.string()).optional(),
  exteriorColors: z.array(z.string()).optional(),
  interiorColors: z.array(z.string()).optional(),
  yearFrom: z.string().optional(),
  yearTo: z.string().optional(),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  ownerId: z.string().optional(),
  vehicleIds: z.array(z.string()).optional(), // Filter by specific vehicle IDs
  numberOfSeats: z.array(z.number()).optional(),
  gearboxTypes: z.array(z.string()).optional(),
  steeringIds: z.array(z.string()).optional(),
  countryIds: z.array(z.string()).optional(),
  counties: z.array(z.string()).optional(),

  // Distance filtering
  userPostcode: z.string().optional(),
  userLatitude: z.number().optional(),
  userLongitude: z.number().optional(),
  maxDistanceMiles: z.number().min(1).max(500).optional(),
  sortByDistance: z.boolean().optional(),

  // Sorting
  sortBy: z
    .enum(["createdAt", "updatedAt", "price", "year", "name", "distance"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  // Performance optimization
  includeTotalCount: z.boolean().default(false),
});

const getByIdInputSchema = z.object({
  id: z.string(),
});

const updateStatusInputSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(VehicleStatus),
  declinedReason: z.string().optional(), // Optional reason when declining
});

const updateVehicleInputSchema = z.object({
  id: z.string(),
  name: z.string().min(3).optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  price: z.number().min(1, "Agreed value must be greater than 0").optional(),
  hourlyRate: z.number().min(0, "Hourly rate must be a positive number").nullable().optional(),
  dailyRate: z.number().min(0, "Daily rate must be a positive number").nullable().optional(),
  year: z.string().optional(),
  registration: z.string().nullable().optional(),
  makeId: z.string().optional(),
  modelId: z.string().optional(),
  engineCapacity: z.number().min(0).nullable().optional(),
  numberOfSeats: z.number().min(1).max(20).nullable().optional(),
  steeringId: z.string().nullable().optional(),
  gearbox: z.string().nullable().optional(),
  exteriorColour: z.string().nullable().optional(),
  interiorColour: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  isRoadLegal: z.boolean().optional(),
  description: z.string().nullable().optional(),
  collectionIds: z.array(z.string()).optional(),
});

const deleteVehicleInputSchema = z.object({
  id: z.string(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const vehicleRouter = createTRPCRouter({
  /**
   * List vehicles with pagination, search, and filters
   */
  list: adminProcedure
    .input(listVehiclesInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createVehicleService(ctx.db);
      return await service.listVehicles(input);
    }),

  /**
   * Get a single vehicle by ID with full details
   */
  getById: adminProcedure
    .input(getByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createVehicleService(ctx.db);
      return await service.getVehicleById(input.id);
    }),

  /**
   * Update vehicle status
   * Admin can change to any status with optional decline reason
   */
  updateStatus: adminProcedure
    .input(updateStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const statusService = ServiceFactory.createVehicleStatusService(ctx.db);
      
      // Use status service for proper validation and email notifications
      await statusService.changeVehicleStatus(
        input.id,
        input.status,
        ctx.user.id,
        true, // isAdmin
        input.declinedReason
      );

      // Invalidate cache
      cacheService.delete(CacheKeys.vehicleDetail(input.id));
      cacheService.invalidateByPattern("vehicle:list:");

      // Return updated vehicle
      const service = ServiceFactory.createVehicleService(ctx.db);
      return await service.getVehicleById(input.id);
    }),

  /**
   * Approve vehicle (IN_REVIEW → PUBLISHED)
   * Convenience endpoint with email notification
   */
  approveVehicle: adminProcedure
    .input(z.object({ vehicleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const statusService = ServiceFactory.createVehicleStatusService(ctx.db);
      
      await statusService.changeVehicleStatus(
        input.vehicleId,
        "PUBLISHED",
        ctx.user.id,
        true // isAdmin
      );

      // Invalidate cache
      cacheService.delete(CacheKeys.vehicleDetail(input.vehicleId));
      cacheService.invalidateByPattern("vehicle:list:");

      return { success: true };
    }),

  /**
   * Approve vehicle with make/model approval and deduplication
   * Admin can edit make/model names during approval
   * System checks for existing published makes/models to prevent duplicates
   */
  approveVehicleWithMakeModel: adminProcedure
    .input(z.object({
      vehicleId: z.string(),
      makeId: z.string(),
      makeName: z.string().min(1),
      modelId: z.string(),
      modelName: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // First, approve make/model (handles deduplication)
      const approvalService = ServiceFactory.createMakeModelApprovalService(ctx.db);
      
      const result = await approvalService.approveMakeModel(
        input.vehicleId,
        { id: input.makeId, name: input.makeName },
        { id: input.modelId, name: input.modelName }
      );

      // Then approve the vehicle
      const statusService = ServiceFactory.createVehicleStatusService(ctx.db);
      
      await statusService.changeVehicleStatus(
        input.vehicleId,
        "PUBLISHED",
        ctx.user.id,
        true // isAdmin
      );

      // Invalidate caches
      cacheService.delete(CacheKeys.vehicleDetail(input.vehicleId));
      cacheService.invalidateByPattern("vehicle:list:");
      cacheService.delete(CacheKeys.vehicleFilterOptions());
      cacheService.delete(CacheKeys.makes());
      cacheService.invalidateByPattern("models:by-make:"); // Invalidate all model caches

      return { 
        success: true,
        makeWasReused: result.makeWasReused,
        modelWasReused: result.modelWasReused,
      };
    }),

  /**
   * Decline vehicle (IN_REVIEW → DECLINED)
   * Requires decline reason for email notification
   */
  declineVehicle: adminProcedure
    .input(z.object({
      vehicleId: z.string(),
      declinedReason: z.string().min(10, "Decline reason must be at least 10 characters"),
    }))
    .mutation(async ({ ctx, input }) => {
      const statusService = ServiceFactory.createVehicleStatusService(ctx.db);
      
      await statusService.changeVehicleStatus(
        input.vehicleId,
        "DECLINED",
        ctx.user.id,
        true, // isAdmin
        input.declinedReason
      );

      // Invalidate cache
      cacheService.delete(CacheKeys.vehicleDetail(input.vehicleId));
      cacheService.invalidateByPattern("vehicle:list:");

      return { success: true };
    }),

  /**
   * Update vehicle
   */
  update: adminProcedure
    .input(updateVehicleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createVehicleService(ctx.db);
      const { id, ...data } = input;
      return await service.updateVehicle(id, data);
    }),

  /**
   * Delete vehicle (soft delete by archiving)
   */
  delete: adminProcedure
    .input(deleteVehicleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createVehicleService(ctx.db);
      return await service.deleteVehicle(input.id);
    }),

  /**
   * Get filter options (makes, models, years, etc.)
   */
  getFilterOptions: adminProcedure.query(async ({ ctx }) => {
    const service = ServiceFactory.createLookupService(ctx.db);
    return await service.getFilterOptions();
  }),

  /**
   * Get models by make ID
   */
  getModelsByMake: adminProcedure
    .input(z.object({ makeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createLookupService(ctx.db);
      return await service.getModelsByMake(input.makeId);
    }),
});

/**
 * Export function to invalidate vehicle caches
 * For backward compatibility with existing code
 */
export function invalidateFilterOptionsCache() {
  // This function is for backward compatibility
  // Directly invalidate the caches without needing a database client
  cacheService.delete(CacheKeys.vehicleFilterOptions());
  cacheService.invalidateByPattern("models:by-make:");
  cacheService.delete(CacheKeys.makes());
  cacheService.delete(CacheKeys.collections());
  cacheService.delete(CacheKeys.steeringTypes());
}
