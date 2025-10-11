/**
 * Deal Service
 * 
 * Business logic for deal management:
 * - Create and manage deals
 * - Send deals to users via email
 * - Track delivery status
 * 
 * REFACTORED: Now uses dependency injection and shared types.
 */

import { TRPCError } from "@trpc/server";
import { DealStatus, RecipientStatus, type Prisma } from "@prisma/client";
import { DealNotFoundError } from "../errors/app-errors";
import {
  MAX_VEHICLES_PER_DEAL,
  MAX_RECIPIENTS_PER_DEAL,
  DEAL_VALIDATION_MESSAGES,
  DEAL_NAME_MIN_LENGTH,
  DEAL_NAME_MAX_LENGTH,
} from "../constants/deals";
import { EmailService } from "./email.service";
import { DealRepository } from "../repositories/deal.repository";
import type {
  CreateDealParams,
  UpdateDealParams,
  AddVehiclesToDealParams,
  ListDealsParams,
  DealWithDetails,
} from "~/server/types";

/**
 * Deal Service Class
 */
export class DealService {
  constructor(private repository: DealRepository) {}

  /**
   * List deals with pagination
   */
  async listDeals(params: ListDealsParams) {
    const { limit = 50, cursor, status, createdById } = params;

    const where: Prisma.DealWhereInput = {};
    
    if (status) {
      where.status = status;
    }
    
    if (createdById) {
      where.createdById = createdById;
    }

    const deals = await this.repository.findManyWithPagination(where, limit, cursor);

    let nextCursor: string | undefined = undefined;
    if (deals.length > limit) {
      const nextItem = deals.pop();
      nextCursor = nextItem?.id;
    }

    return {
      deals,
      nextCursor,
    };
  }

  /**
   * Get deal by ID with full details
   */
  async getDealById(dealId: string): Promise<DealWithDetails> {
    return await this.repository.findByIdWithDetails(dealId);
  }

  /**
   * Create a new deal
   */
  async createDeal(params: CreateDealParams) {
    const { name, date, time, location, brief, fee, vehicleIds, recipientIds, createdById } = params;

    // Validate deal name
    this.validateDealName(name);

    // Validate vehicles count (allow empty for deals created without vehicles)
    if (vehicleIds.length > MAX_VEHICLES_PER_DEAL) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: DEAL_VALIDATION_MESSAGES.TOO_MANY_VEHICLES,
      });
    }

    // Validate recipients count (allow empty for deals created without recipients)
    if (recipientIds.length > MAX_RECIPIENTS_PER_DEAL) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: DEAL_VALIDATION_MESSAGES.TOO_MANY_RECIPIENTS,
      });
    }

    // Use transaction to ensure data consistency
    const deal = await this.repository.transaction(async (tx) => {
      const repo = new DealRepository(tx);
      
      // Validate vehicles exist (only if there are vehicles to validate)
      if (vehicleIds.length > 0) {
        const valid = await repo.validateVehiclesExist(vehicleIds);
        if (!valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some vehicles not found",
          });
        }
      }

      // Validate recipients exist (only if there are recipients to validate)
      if (recipientIds.length > 0) {
        const valid = await repo.validateUsersExist(recipientIds);
        if (!valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some recipients not found",
          });
        }
      }

      // Create deal with vehicles and recipients
      return await repo.createWithRelations({
        name,
        date,
        time,
        location,
        brief,
        fee,
        status: DealStatus.ACTIVE,
        createdById,
        vehicleIds,
        recipientIds,
      });
    });
    
    // After transaction completes, send emails to all recipients (only if there are recipients)
    // Note: Emails are sent AFTER the transaction to avoid holding locks
    if (recipientIds.length > 0) {
      try {
        await this.sendDealEmails(deal.id, recipientIds);
      } catch (error) {
        // Log error but don't fail the deal creation
        // The deal is created successfully, email sending can be retried
        console.error(`Failed to send emails for deal ${deal.id}:`, error);
      }
    }
    
    return deal;
  }

  /**
   * Validate deal name
   * @private
   */
  private validateDealName(name: string) {
    if (!name || name.trim().length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: DEAL_VALIDATION_MESSAGES.EMPTY_NAME,
      });
    }

    if (name.length < DEAL_NAME_MIN_LENGTH) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: DEAL_VALIDATION_MESSAGES.NAME_TOO_SHORT,
      });
    }

    if (name.length > DEAL_NAME_MAX_LENGTH) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: DEAL_VALIDATION_MESSAGES.NAME_TOO_LONG,
      });
    }
  }

  /**
   * Add vehicles to an existing deal
   */
  async addVehiclesToDeal(params: AddVehiclesToDealParams) {
    const { dealId, vehicleIds, recipientIds } = params;

    // Use transaction for consistency
    const result = await this.repository.transaction(async (tx) => {
      const repo = new DealRepository(tx);
      
      // Validate deal exists and is not archived
      const deal = await repo.findById(dealId) as { status: DealStatus } | null;

      if (!deal) {
        throw new DealNotFoundError(dealId);
      }

      if (deal.status === DealStatus.ARCHIVED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot add vehicles to archived deals",
        });
      }

      // Validate vehicles and users exist
      const [vehiclesValid, usersValid] = await Promise.all([
        repo.validateVehiclesExist(vehicleIds),
        repo.validateUsersExist(recipientIds),
      ]);

      if (!vehiclesValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some vehicles not found",
        });
      }

      if (!usersValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some recipients not found",
        });
      }

      // Get existing relations to avoid duplicates
      const existing = await repo.getExistingRelations(dealId);
      const existingVehicleIds = new Set(existing.vehicleIds);
      const existingRecipientIds = new Set(existing.recipientIds);

      const newVehicleIds = vehicleIds.filter((id) => !existingVehicleIds.has(id));
      const newRecipientIds = recipientIds.filter((id) => !existingRecipientIds.has(id));

      // Get max order for vehicles
      const maxOrder = await repo.getMaxVehicleOrder(dealId);
      const startOrder = maxOrder + 1;

      // Add new vehicles and recipients
      await repo.addVehiclesAndRecipients(dealId, newVehicleIds, newRecipientIds, startOrder);

      // Store newRecipientIds for email sending after transaction
      return { dealId, newRecipientIds };
    });
    
    // After transaction completes, send emails ONLY to new recipients
    // Note: Emails are sent AFTER the transaction to avoid holding locks
    if (result.newRecipientIds.length > 0) {
      try {
        await this.sendDealEmails(result.dealId, result.newRecipientIds);
      } catch (error) {
        // Log error but don't fail the operation
        console.error(`Failed to send emails for deal ${result.dealId}:`, error);
      }
    }
    
    // Return updated deal for client
    return await this.getDealById(result.dealId);
  }

  /**
   * Update deal details
   */
  async updateDeal(dealId: string, params: UpdateDealParams) {
    const { name, date, time, location, brief, fee } = params;

    // Validate deal exists
    const deal = await this.repository.findById(dealId);

    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    // Validate name if provided
    if (name !== undefined) {
      this.validateDealName(name);
    }

    // Update deal with provided fields
    return await this.repository.updateDetails(dealId, {
      name,
      date,
      time,
      location,
      brief,
      fee,
    });
  }

  /**
   * Archive a deal
   */
  async archiveDeal(dealId: string) {
    const deal = await this.repository.findById(dealId);

    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    return await this.repository.updateStatus(dealId, DealStatus.ARCHIVED);
  }

  /**
   * Unarchive a deal
   */
  async unarchiveDeal(dealId: string) {
    const deal = await this.repository.findById(dealId);

    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    return await this.repository.updateStatus(dealId, DealStatus.ACTIVE);
  }

  /**
   * Delete deal (soft delete by archiving)
   */
  async deleteDeal(dealId: string) {
    const deal = await this.repository.findById(dealId);

    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    // Soft delete by archiving
    return await this.archiveDeal(dealId);
  }

  /**
   * Get vehicles for deal (for sending emails)
   */
  async getDealVehicles(dealId: string) {
    return await this.repository.findDealVehicles(dealId);
  }

  /**
   * Get recipients for deal
   */
  async getDealRecipients(dealId: string, recipientIds?: string[]) {
    return await this.repository.findDealRecipients(dealId, recipientIds);
  }

  /**
   * Update recipient status after sending
   */
  async updateRecipientStatus(
    recipientId: string,
    status: RecipientStatus,
    errorMessage?: string
  ) {
    return await this.repository.updateRecipientStatus(recipientId, status, errorMessage);
  }

  /**
   * Send deal emails to specified recipients (internal helper)
   * This is called automatically by createDeal and addVehiclesToDeal
   */
  private async sendDealEmails(dealId: string, recipientIds: string[]) {
    const emailService = new EmailService();
    
    // Get deal details
    const deal = await this.getDealById(dealId);
    
    // Get vehicles for the deal
    const vehicles = await this.getDealVehicles(dealId);
    
    // Get recipients to send to
    const recipients = await this.getDealRecipients(dealId, recipientIds);
    
    // Prepare emails for bulk sending - personalized per recipient
    const emails = recipients.map((recipient) => {
      // Filter vehicles to only include those owned by this recipient
      const recipientVehicles = vehicles.filter(
        (vehicle) => vehicle.ownerId === recipient.userId
      );
      
      // Format vehicle names as comma-separated string
      const vehicleNames = recipientVehicles.map((v) => v.name).join(", ");
      
      // Get user name (firstName or fallback to email username)
      const userName = recipient.user.firstName ?? "User";      
      return {
        to: recipient.user.email,
        userName,
        dealName: deal.name,
        date: deal.date,
        time: deal.time,
        location: deal.location,
        brief: deal.brief,
        fee: deal.fee,
        vehicleNames,
        dealUrl: undefined,
      };
    });
    
    // Send emails in bulk (parallel)
    const emailResults = await emailService.sendBulkEmails(emails);
    
    // Update recipient statuses based on results
    const statusUpdates = emailResults.map(async (result, index) => {
      const recipient = recipients[index];
      if (!recipient) return null;
      
      if (result.success) {
        await this.updateRecipientStatus(
          recipient.id,
          RecipientStatus.SENT
        );
      } else {
        await this.updateRecipientStatus(
          recipient.id,
          RecipientStatus.FAILED,
          result.error
        );
      }
      
      return {
        userId: recipient.userId,
        email: recipient.user.email,
        success: result.success,
        error: result.error,
        messageId: result.messageId,
      };
    });
    
    // Wait for all status updates to complete
    await Promise.all(statusUpdates);
  }

  /**
   * Get new vehicles and owners for a deal (PHASE 2 - Backend duplicate filtering)
   */
  async getNewVehiclesAndOwners(dealId: string, vehicleIds: string[]) {
    return await this.repository.getNewVehiclesAndOwners(dealId, vehicleIds);
  }
}

