/**
 * Vehicle Status Service
 * 
 * Handles vehicle status transitions, validation, permissions, and email notifications.
 */

import { type VehicleStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type DbClient } from "~/server/types";
import { EmailService } from "./email.service";
import { getAppUrl } from "~/lib/app-url";
import { env } from "~/env";

/**
 * Status transition validation result
 */
export interface StatusTransitionValidation {
  allowed: boolean;
  reason?: string;
  missingFields?: string[];
}

/**
 * Vehicle Status Service
 */
export class VehicleStatusService {
  constructor(
    private db: DbClient,
    private emailService: EmailService
  ) {}

  /**
   * Check if user can change vehicle status
   */
  async canUserChangeStatus(
    vehicleId: string,
    newStatus: VehicleStatus,
    userId: string,
    isAdmin: boolean
  ): Promise<StatusTransitionValidation> {
    // Fetch vehicle with owner
    const vehicle = await this.db.vehicle.findUnique({
      where: { id: vehicleId },
      include: { owner: true },
    });

    if (!vehicle) {
      return {
        allowed: false,
        reason: "Vehicle not found",
      };
    }

    // Check ownership
    const isOwner = vehicle.ownerId === userId;

    // Admin can change to any status
    if (isAdmin) {
      return { allowed: true };
    }

    // User must be the owner
    if (!isOwner) {
      return {
        allowed: false,
        reason: "You don't have permission to modify this vehicle",
      };
    }

    // User transitions allowed:
    // DRAFT, DECLINED, or ARCHIVED → IN_REVIEW (via submitForReview)
    // Any status → ARCHIVED (deactivate)
    if (newStatus === "ARCHIVED") {
      return { allowed: true };
    }

    if (newStatus === "IN_REVIEW") {
      if (vehicle.status === "DRAFT" || vehicle.status === "DECLINED" || vehicle.status === "ARCHIVED") {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Cannot submit for review from ${vehicle.status} status`,
      };
    }

    // Users cannot transition to PUBLISHED or directly set DECLINED
    return {
      allowed: false,
      reason: "Only admins can publish or decline vehicles",
    };
  }

  /**
   * Validate vehicle has all required fields for publishing
   */
  async validateVehicleForPublish(vehicleId: string): Promise<StatusTransitionValidation> {
    const vehicle = await this.db.vehicle.findUnique({
      where: { id: vehicleId },
      include: { media: true },
    });

    if (!vehicle) {
      return {
        allowed: false,
        reason: "Vehicle not found",
      };
    }

    const missingFields: string[] = [];

    // Check for photos
    if (vehicle.media.length === 0) {
      missingFields.push("At least one photo");
    }

    // Check basic required fields
    if (!vehicle.name) missingFields.push("Vehicle name");
    if (!vehicle.makeId) missingFields.push("Make");
    if (!vehicle.modelId) missingFields.push("Model");
    if (!vehicle.year) missingFields.push("Year");
    if (!vehicle.price) missingFields.push("Agreed Value");

    // Check technical details
    if (!vehicle.engineCapacity) missingFields.push("Engine capacity");
    if (!vehicle.numberOfSeats) missingFields.push("Number of seats");
    if (!vehicle.steeringId) missingFields.push("Steering type");
    if (!vehicle.gearbox) missingFields.push("Gearbox");
    if (!vehicle.exteriorColour) missingFields.push("Exterior colour");
    if (!vehicle.interiorColour) missingFields.push("Interior colour");
    if (!vehicle.condition) missingFields.push("Condition");

    if (missingFields.length > 0) {
      return {
        allowed: false,
        reason: "Vehicle is missing required information",
        missingFields,
      };
    }

    return { allowed: true };
  }

  /**
   * Change vehicle status with validation and email notifications
   */
  async changeVehicleStatus(
    vehicleId: string,
    newStatus: VehicleStatus,
    userId: string,
    isAdmin: boolean,
    declinedReason?: string
  ): Promise<void> {
    // Check permissions
    const canChange = await this.canUserChangeStatus(vehicleId, newStatus, userId, isAdmin);
    
    if (!canChange.allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: canChange.reason ?? "Not allowed to change status",
      });
    }

    // If submitting for review, validate vehicle
    if (newStatus === "IN_REVIEW") {
      const validation = await this.validateVehicleForPublish(vehicleId);
      if (!validation.allowed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.reason ?? "Vehicle validation failed",
          cause: { missingFields: validation.missingFields },
        });
      }
    }

    // Fetch vehicle with full details for emails
    const vehicle = await this.db.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        owner: true,
        make: true,
        model: true,
      },
    });

    if (!vehicle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vehicle not found",
      });
    }

    const oldStatus = vehicle.status;

    // Update vehicle status
    const updateData: { status: VehicleStatus; declinedReason?: string | null } = {
      status: newStatus,
    };

    // Set or clear declined reason
    if (newStatus === "DECLINED" && declinedReason) {
      updateData.declinedReason = declinedReason;
    } else if (newStatus !== "DECLINED") {
      // Clear declined reason if changing from DECLINED to another status
      updateData.declinedReason = null;
    }

    await this.db.vehicle.update({
      where: { id: vehicleId },
      data: updateData,
    });

    // Send email notifications based on status change
    await this.sendStatusChangeEmails(vehicle, oldStatus, newStatus, declinedReason);
  }

  /**
   * Send appropriate email notifications for status changes
   */
  private async sendStatusChangeEmails(
    vehicle: {
      id: string;
      name: string;
      owner: { email: string; firstName: string | null };
      make: { name: string };
      model: { name: string };
    },
    oldStatus: VehicleStatus,
    newStatus: VehicleStatus,
    declinedReason?: string
  ): Promise<void> {
    const ownerName = vehicle.owner.firstName ?? "Vehicle Owner";
    const vehicleName = vehicle.name;
    
    // Get base URL (auto-detects Vercel preview URLs)
    const baseUrl = getAppUrl();
    const dashboardUrl = `${baseUrl}/user/vehicles`;
    const userVehicleUrl = `${baseUrl}/user/vehicles/${vehicle.id}`;
    const adminVehicleUrl = `${baseUrl}/admin/vehicles/${vehicle.id}`;

    try {
      // Send email to owner when vehicle is PUBLISHED
      if (newStatus === "PUBLISHED") {
        await this.emailService.sendVehiclePublishedEmail({
          to: vehicle.owner.email,
          ownerName,
          vehicleName,
          vehicleUrl: userVehicleUrl,
          dashboardUrl,
        });
      }

      // Send email to owner when vehicle is DECLINED
      if (newStatus === "DECLINED" && declinedReason) {
        await this.emailService.sendVehicleDeclinedEmail({
          to: vehicle.owner.email,
          ownerName,
          vehicleName,
          declinedReason,
          dashboardUrl,
        });
      }

      // Send email to admin when vehicle goes to IN_REVIEW
      if (newStatus === "IN_REVIEW") {
        const adminEmail = env.ADMIN_NOTIFICATION_EMAIL;
        if (adminEmail) {
          await this.emailService.sendVehicleInReviewEmail({
            to: adminEmail,
            vehicleName,
            ownerName,
            vehicleUrl: adminVehicleUrl,
          });
        } else {
          console.warn("ADMIN_NOTIFICATION_EMAIL not configured - skipping admin notification");
        }
      }
    } catch (error) {
      // Log error but don't fail the status change
      console.error("Failed to send status change email:", error);
    }
  }

  /**
   * Get validation errors for a vehicle (for UI display)
   */
  async getValidationErrors(vehicleId: string): Promise<string[]> {
    const validation = await this.validateVehicleForPublish(vehicleId);
    if (validation.allowed) {
      return [];
    }
    return validation.missingFields ?? [validation.reason ?? "Unknown validation error"];
  }
}

