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
  MIN_FINANCIAL_AMOUNT,
  MAX_FINANCIAL_AMOUNT,
  FINANCIAL_VALIDATION_MESSAGES,
  MAX_NOTES_LENGTH,
} from "../constants/deals";
import { EmailService } from "./email.service";
import { DealRepository } from "../repositories/deal.repository";
import { UserRepository } from "../repositories/user.repository";
import { getDealTypeLabel } from "~/lib/deals";
import { env } from "~/env";
import type {
  CreateDealParams,
  UpdateDealParams,
  AddVehiclesToDealParams,
  ListDealsParams,
  DealWithDetails,
  UpdateDealVehicleStatusParams,
  UpdateDealVehicleFeeParams,
  CreateUserEnquiryInput,
  UserEnquiryResult,
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
    const { name, dealType, date, time, location, brief, fee, clientContactId, fullQuote, spokeFee, notes, vehicleIds, recipientIds, createdById } = params;

    // Validate deal name
    this.validateDealName(name);
    
    // Validate financial fields if provided
    this.validateFinancialFields({ fullQuote, spokeFee });
    
    // Validate client contact if provided
    if (clientContactId) {
      await this.validateClientContact(clientContactId);
    }
    
    // Validate notes length if provided
    if (notes && notes.length > MAX_NOTES_LENGTH) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: FINANCIAL_VALIDATION_MESSAGES.NOTES_TOO_LONG,
      });
    }

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
        dealType,
        date,
        time,
        location,
        brief,
        fee,
        clientContactId,
        fullQuote,
        spokeFee,
        notes,
        status: "OPTIONS" as DealStatus,
        createdById,
        vehicleIds,
        recipientIds,
      });
    });
    
    // After transaction completes, send emails to all recipients (only if there are recipients)
    // Note: Emails are sent AFTER the transaction to avoid holding locks
    if (recipientIds.length > 0) {
      // Validate email fields before sending
      const missingFields = this.validateDealEmailFields(deal);
      
      if (missingFields.length > 0) {
        // Log warning but don't fail deal creation - emails can be sent later
        console.warn(`Cannot send emails for deal ${deal.id}. Missing fields: ${missingFields.join(", ")}`);
      } else {
        try {
          await this.sendDealEmails(deal.id, recipientIds);
        } catch (error) {
          // Log error but don't fail the deal creation
          // The deal is created successfully, email sending can be retried
          console.error(`Failed to send emails for deal ${deal.id}:`, error);
        }
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
   * Validate deal email fields
   * Returns array of missing field names (empty if all fields are present)
   * @private
   */
  private validateDealEmailFields(deal: {
    fee?: string | null;
    date?: string | null;
    time?: string | null;
    location?: string | null;
    brief?: string | null;
  }): string[] {
    const missingFields: string[] = [];
    
    if (!deal.fee || deal.fee.trim().length === 0) {
      missingFields.push("Fee");
    }
    if (!deal.date || deal.date.trim().length === 0) {
      missingFields.push("Date");
    }
    if (!deal.time || deal.time.trim().length === 0) {
      missingFields.push("Time");
    }
    if (!deal.location || deal.location.trim().length === 0) {
      missingFields.push("Location");
    }
    if (!deal.brief || deal.brief.trim().length === 0) {
      missingFields.push("Brief");
    }
    
    return missingFields;
  }
  
  /**
   * Validate financial fields
   * @private
   */
  private validateFinancialFields(fields: { 
    fullQuote?: number; 
    spokeFee?: number; 
  }) {
    const { fullQuote, spokeFee } = fields;
    
    if (fullQuote !== undefined) {
      if (fullQuote < MIN_FINANCIAL_AMOUNT || fullQuote > MAX_FINANCIAL_AMOUNT) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: fullQuote < MIN_FINANCIAL_AMOUNT 
            ? FINANCIAL_VALIDATION_MESSAGES.NEGATIVE_AMOUNT 
            : FINANCIAL_VALIDATION_MESSAGES.AMOUNT_TOO_LARGE,
        });
      }
    }
    
    if (spokeFee !== undefined) {
      if (spokeFee < MIN_FINANCIAL_AMOUNT || spokeFee > MAX_FINANCIAL_AMOUNT) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: spokeFee < MIN_FINANCIAL_AMOUNT 
            ? FINANCIAL_VALIDATION_MESSAGES.NEGATIVE_AMOUNT 
            : FINANCIAL_VALIDATION_MESSAGES.AMOUNT_TOO_LARGE,
        });
      }
    }
  }
  
  /**
   * Validate client contact exists
   * @private
   */
  private async validateClientContact(clientContactId: string) {
    // Access db through repository's transaction API or directly through the getter
    const repo = this.repository;
    const user = await (repo as any).db.user.findUnique({
      where: { id: clientContactId },
      select: { id: true },
    });
    
    if (!user) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Client contact not found",
      });
    }
  }

  /**
   * Add vehicles to an existing deal
   */
  async addVehiclesToDeal(params: AddVehiclesToDealParams) {
    const { dealId, vehicleIds, recipientIds, sendEmails = false } = params;

    console.log(`Adding ${vehicleIds.length} vehicles and ${recipientIds.length} recipients to deal ${dealId}${sendEmails ? ' (with emails)' : ' (without emails)'}`);
    // Use transaction for consistency
    const result = await this.repository.transaction(async (tx) => {
      const repo = new DealRepository(tx);
      
      // Validate deal exists and is not archived
      const deal = await repo.findById(dealId) as { status: DealStatus } | null;

      if (!deal) {
        throw new DealNotFoundError(dealId);
      }

      if (deal.status === ("ARCHIVED" as DealStatus)) {
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

      // Get existing relations to track what's new
      const existing = await repo.getExistingRelations(dealId);
      const existingVehicleIds = new Set(existing.vehicleIds);
      const existingRecipientIds = new Set(existing.recipientIds);

      const newVehicleIds = vehicleIds.filter((id) => !existingVehicleIds.has(id));
      const newRecipientIds = recipientIds.filter((id) => !existingRecipientIds.has(id));

      console.log(`Deal ${dealId}: Found ${existingVehicleIds.size} existing vehicles, ${existingRecipientIds.size} existing recipients`);
      console.log(`Deal ${dealId}: Adding ${newVehicleIds.length} new vehicles, ${newRecipientIds.length} new recipients`);

      // Get max order for vehicles
      const maxOrder = await repo.getMaxVehicleOrder(dealId);
      const startOrder = maxOrder + 1;

      // Add vehicles and recipients (repository now uses upsert to handle duplicates gracefully)
      await repo.addVehiclesAndRecipients(dealId, vehicleIds, recipientIds, startOrder);

      // Store newRecipientIds for email sending after transaction
      return { dealId, newRecipientIds };
    });
    
    // After transaction completes, send emails ONLY to new recipients (if sendEmails is true)
    // Note: Emails are sent AFTER the transaction to avoid holding locks
    if (sendEmails && result.newRecipientIds.length > 0) {
      // Validate and send emails - throw validation errors to UI
      await this.sendDealEmails(result.dealId, result.newRecipientIds);
    } else if (!sendEmails) {
      console.log(`Skipping email notifications for deal ${result.dealId} as requested`);
    }
    
    // Return updated deal for client
    return await this.getDealById(result.dealId);
  }

  /**
   * Update deal details
   */
  async updateDeal(dealId: string, params: UpdateDealParams) {
    const { name, dealType, date, time, location, brief, fee, clientContactId, fullQuote, spokeFee, notes, status } = params;

    // Validate deal exists
    const deal = await this.repository.findById(dealId);

    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    // Validate name if provided
    if (name !== undefined) {
      this.validateDealName(name);
    }
    
    // Validate financial fields if provided
    this.validateFinancialFields({ fullQuote, spokeFee });
    
    // Validate client contact if provided
    if (clientContactId !== undefined) {
      if (clientContactId) {
        await this.validateClientContact(clientContactId);
      }
    }
    
    // Validate notes length if provided
    if (notes !== undefined && notes && notes.length > MAX_NOTES_LENGTH) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: FINANCIAL_VALIDATION_MESSAGES.NOTES_TOO_LONG,
      });
    }

    // Update deal with provided fields
    return await this.repository.updateDetails(dealId, {
      name,
      dealType,
      date,
      time,
      location,
      brief,
      fee,
      clientContactId,
      fullQuote,
      spokeFee,
      notes,
      status,
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

    return await this.repository.updateStatus(dealId, "OPTIONS" as any);
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
    
    // Validate email fields before sending
    const missingFields = this.validateDealEmailFields(deal);
    
    if (missingFields.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot send emails. Please fill in the following fields: ${missingFields.join(", ")}`,
      });
    }
    
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
      
      // Convert deal type enum to readable label
      const dealTypeLabel = getDealTypeLabel(deal.dealType);
      
      return {
        to: recipient.user.email,
        userName,
        dealName: deal.name,
        dealType: dealTypeLabel,
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

  /**
   * Update deal vehicle status
   */
  async updateDealVehicleStatus(params: UpdateDealVehicleStatusParams) {
    const { dealId, vehicleId, status } = params;

    // Validate deal exists
    const deal = await this.repository.findById(dealId);
    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    // Find the specific DealVehicle record
    const dealVehicle = await (this.repository as any).db.dealVehicle.findUnique({
      where: {
        dealId_vehicleId: {
          dealId,
          vehicleId,
        },
      },
    });

    if (!dealVehicle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vehicle not found in this deal",
      });
    }

    // Update the status
    return await (this.repository as any).db.dealVehicle.update({
      where: {
        id: dealVehicle.id,
      },
      data: {
        status,
      },
    });
  }

  /**
   * Update deal vehicle fee
   */
  async updateDealVehicleFee(params: UpdateDealVehicleFeeParams) {
    const { dealId, vehicleId, ownerRequestedFee } = params;

    // Validate deal exists
    const deal = await this.repository.findById(dealId);
    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    // Validate fee if provided
    if (ownerRequestedFee !== null) {
      if (ownerRequestedFee < MIN_FINANCIAL_AMOUNT || ownerRequestedFee > MAX_FINANCIAL_AMOUNT) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ownerRequestedFee < MIN_FINANCIAL_AMOUNT 
            ? FINANCIAL_VALIDATION_MESSAGES.NEGATIVE_AMOUNT 
            : FINANCIAL_VALIDATION_MESSAGES.AMOUNT_TOO_LARGE,
        });
      }
    }

    // Find the specific DealVehicle record
    const dealVehicle = await (this.repository as any).db.dealVehicle.findUnique({
      where: {
        dealId_vehicleId: {
          dealId,
          vehicleId,
        },
      },
    });

    if (!dealVehicle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vehicle not found in this deal",
      });
    }

    // Update the fee
    return await (this.repository as any).db.dealVehicle.update({
      where: {
        id: dealVehicle.id,
      },
      data: {
        ownerRequestedFee,
      },
    });
  }

  /**
   * Create a user enquiry (public-facing enquiry form)
   * Creates a deal, optionally associates a vehicle, and sends notifications
   * Also updates user profile with enquiry data
   */
  async createUserEnquiry(params: CreateUserEnquiryInput & { userId: string }): Promise<UserEnquiryResult> {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      company,
      dealType, 
      date, 
      time, 
      location, 
      brief, 
      vehicleId,
      userId
    } = params;

    // Create deal name from user info
    const dealName = `Enquiry from ${firstName} ${lastName}`;

    // Use transaction to ensure data consistency
    const deal = await this.repository.transaction(async (tx) => {
      const dealRepo = new DealRepository(tx);
      const userRepo = new UserRepository(tx);
      
      // Update user profile with enquiry data (always updates to reflect changes)
      const { updatedFields } = await userRepo.updateProfileFields(userId, {
        firstName,
        lastName,
        phone,
        company,
      });

      if (updatedFields.length > 0) {
        console.log(`[Enquiry] Updated user profile fields: ${updatedFields.join(", ")}`);
      }
      
      // Validate vehicle exists and get owner if provided
      let vehicleOwnerId: string | undefined;
      if (vehicleId) {
        const vehicleExists = await dealRepo.validateVehiclesExist([vehicleId]);
        if (!vehicleExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Vehicle not found",
          });
        }
        
        // Get the vehicle owner to add as recipient
        const vehicle = await tx.vehicle.findUnique({
          where: { id: vehicleId },
          select: { ownerId: true },
        });
        
        if (vehicle) {
          vehicleOwnerId = vehicle.ownerId;
          console.log(`[Enquiry] Adding vehicle owner ${vehicleOwnerId} as recipient for deal`);
        }
      }

      // Create deal with optional vehicle and owner as recipient
      return await dealRepo.createWithRelations({
        name: dealName,
        dealType,
        date,
        time,
        location,
        brief,
        fee: undefined,
        clientContactId: userId, // Set the enquirer as the client contact
        fullQuote: undefined,
        spokeFee: undefined,
        notes: undefined,
        status: "OPTIONS" as DealStatus,
        createdById: userId,
        vehicleIds: vehicleId ? [vehicleId] : [],
        recipientIds: vehicleOwnerId ? [vehicleOwnerId] : [], // Add vehicle owner as recipient
      });
    });

    // Send email notifications (don't block on email failures)
    try {
      // Log server-side analytics event for successful enquiry
      console.log('[Analytics] enquiry_success', {
        dealId: deal.id,
        dealType: deal.dealType,
        hasVehicle: !!vehicleId,
        vehicleId: vehicleId ?? undefined,
      });
      
      const emailService = new EmailService();
      
      // Get admin email from environment
      const adminEmail = env.ADMIN_NOTIFICATION_EMAIL;
      
      // Send admin notification
      if (adminEmail) {
        await emailService.sendAdminEnquiryNotification({
          to: adminEmail,
          userName: `${firstName} ${lastName}`,
          userEmail: email,
          userPhone: phone,
          userCompany: company ?? null,
          dealName,
          dealType: getDealTypeLabel(dealType),
          date: date ?? null,
          time: time ?? null,
          location: location ?? null,
          brief: brief ?? null,
          vehicleName: vehicleId ? "Vehicle attached" : null, // We could fetch vehicle name if needed
          dealUrl: `${env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/deals/${deal.id}`,
        });
      } else {
        console.warn("ADMIN_NOTIFICATION_EMAIL not configured - skipping admin notification");
      }

      // Send user confirmation
      await emailService.sendUserEnquiryConfirmation({
        to: email,
        userName: firstName,
        dealType: getDealTypeLabel(dealType),
      });
    } catch (error) {
      // Log error but don't fail the enquiry creation
      console.error(`Failed to send enquiry notification emails:`, error);
    }

    return {
      success: true,
      dealId: deal.id,
      message: "Enquiry submitted successfully! We'll get back to you soon.",
    };
  }
}

