/**
 * Deal Router
 * 
 * Handles deal/job offer operations:
 * - List deals
 * - Get deal details
 * - Create deals
 * - Send deals to users via email
 * - Track deal status
 * 
 * REFACTORED: Now uses ServiceFactory for consistent service creation.
 */

import { z } from "zod";
import { RecipientStatus,  type Prisma } from "@prisma/client";
import { createTRPCRouter, adminProcedure, protectedProcedure } from "~/server/api/trpc";
import { ServiceFactory } from "~/server/api/services/service-factory";
import { EmailService } from "~/server/api/services/email.service";
import { getDealTypeLabel } from "~/lib/deals";
import {
  MAX_VEHICLES_PER_DEAL,
  MAX_RECIPIENTS_PER_DEAL,
  DEALS_PAGE_LIMIT,
  DEALS_DROPDOWN_LIMIT,
  DEAL_NAME_MIN_LENGTH,
  DEAL_NAME_MAX_LENGTH,
  MIN_FINANCIAL_AMOUNT,
  MAX_FINANCIAL_AMOUNT,
  MAX_NOTES_LENGTH,
} from "~/server/api/constants/deals";

/**
 * Input validation schemas
 */
const listDealsInputSchema = z.object({
  limit: z.number().min(1).max(DEALS_DROPDOWN_LIMIT).optional().default(DEALS_PAGE_LIMIT),
  cursor: z.string().optional(),
  status: z.enum(["OPTIONS", "CONTRACTS_INVOICE", "COMPLETE", "POSTPONED", "ABANDONED", "ARCHIVED"]).optional(),
});

const getDealByIdInputSchema = z.object({
  id: z.string().cuid(),
});

const createDealInputSchema = z.object({
  name: z.string().min(DEAL_NAME_MIN_LENGTH).max(DEAL_NAME_MAX_LENGTH),
  dealType: z.enum(["PERSONAL_HIRE", "PRODUCTION"]),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  brief: z.string().optional(),
  fee: z.string().optional(),
  clientContactId: z.string().cuid().optional(),
  fullQuote: z.number().min(MIN_FINANCIAL_AMOUNT).max(MAX_FINANCIAL_AMOUNT).optional(),
  spokeFee: z.number().min(MIN_FINANCIAL_AMOUNT).max(MAX_FINANCIAL_AMOUNT).optional(),
  baselineFee: z.number().min(MIN_FINANCIAL_AMOUNT).max(MAX_FINANCIAL_AMOUNT).optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  vehicleIds: z.array(z.string().cuid()).max(MAX_VEHICLES_PER_DEAL).optional().default([]),
  recipientIds: z.array(z.string().cuid()).max(MAX_RECIPIENTS_PER_DEAL).optional().default([]),
});

const sendDealInputSchema = z.object({
  dealId: z.string().cuid(),
  recipientIds: z.array(z.string().cuid()).optional(), // If not provided, send to all recipients
});

const addVehiclesToDealInputSchema = z.object({
  dealId: z.string().cuid(),
  vehicleIds: z.array(z.string().cuid()).min(1).max(MAX_VEHICLES_PER_DEAL),
  recipientIds: z.array(z.string().cuid()).min(1).max(MAX_RECIPIENTS_PER_DEAL),
  sendEmails: z.boolean().default(false),
});

const updateDealInputSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(DEAL_NAME_MIN_LENGTH).max(DEAL_NAME_MAX_LENGTH).optional(),
  dealType: z.enum(["PERSONAL_HIRE", "PRODUCTION"]).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  brief: z.string().optional(),
  fee: z.string().optional(),
  clientContactId: z.string().cuid().nullable().optional(),
  fullQuote: z.number().min(MIN_FINANCIAL_AMOUNT).max(MAX_FINANCIAL_AMOUNT).nullable().optional(),
  spokeFee: z.number().min(MIN_FINANCIAL_AMOUNT).max(MAX_FINANCIAL_AMOUNT).nullable().optional(),
  baselineFee: z.number().min(MIN_FINANCIAL_AMOUNT).max(MAX_FINANCIAL_AMOUNT).nullable().optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  status: z.enum(["OPTIONS", "CONTRACTS_INVOICE", "COMPLETE", "POSTPONED", "ABANDONED", "ARCHIVED"]).optional(),
});

const updateDealStatusInputSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["OPTIONS", "CONTRACTS_INVOICE", "COMPLETE", "POSTPONED", "ABANDONED", "ARCHIVED"]),
});

const archiveDealInputSchema = z.object({
  id: z.string().cuid(),
});

const unarchiveDealInputSchema = z.object({
  id: z.string().cuid(),
});

const deleteDealInputSchema = z.object({
  id: z.string().cuid(),
});

const updateVehicleStatusInputSchema = z.object({
  dealId: z.string().cuid(),
  vehicleId: z.string().cuid(),
  status: z.enum(["ACTIVE", "REMOVED", "WINNER"]),
});

const updateVehicleFeeInputSchema = z.object({
  dealId: z.string().cuid(),
  vehicleId: z.string().cuid(),
  ownerRequestedFee: z.number().min(MIN_FINANCIAL_AMOUNT).max(MAX_FINANCIAL_AMOUNT).nullable(),
});

const createUserEnquiryInputSchema = z.object({
  // Personal information
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required").max(50),
  company: z.string().max(200).optional(),
  // Enquiry details
  dealType: z.enum(["PERSONAL_HIRE", "PRODUCTION"]),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  brief: z.string().optional(),
  // Optional vehicle association
  vehicleId: z.string().cuid().optional(),
});

/**
 * Deal Router
 */
export const dealRouter = createTRPCRouter({
  /**
   * List all deals with pagination
   */
  list: adminProcedure
    .input(listDealsInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      return await service.listDeals({
        limit: input.limit,
        cursor: input.cursor,
        status: input.status as any,
      });
    }),

  /**
   * Get deal by ID with full details
   */
  getById: adminProcedure
    .input(getDealByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      return await service.getDealById(input.id);
    }),

  /**
   * Create a new deal
   */
  create: adminProcedure
    .input(createDealInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      
      // Get current user ID from context
      const userId = ctx.user.id;

      return await service.createDeal({
        name: input.name,
        dealType: input.dealType,
        date: input.date,
        time: input.time,
        location: input.location,
        brief: input.brief,
        fee: input.fee,
        vehicleIds: input.vehicleIds,
        recipientIds: input.recipientIds,
        createdById: userId,
      });
    }),

  /**
   * Send deal to recipients via email (Manual Resend)
   * 
   * Note: This endpoint is primarily for manual intervention/resending.
   * Emails are automatically sent when deals are created or vehicles are added.
   */
  send: adminProcedure
    .input(sendDealInputSchema)
    .mutation(async ({ ctx, input }) => {
      const dealService = ServiceFactory.createDealService(ctx.db);
      const emailService = new EmailService();

      // Get deal details
      const deal = await dealService.getDealById(input.dealId);

      // Get vehicles for the deal
      const vehicles = await dealService.getDealVehicles(input.dealId);

      // Get recipients to send to
      const recipients = await dealService.getDealRecipients(
        input.dealId,
        input.recipientIds
      );

      // Prepare emails for bulk sending - personalized per recipient
      const emails = recipients.map((recipient) => {
        // Filter vehicles to only include those owned by this recipient
        const recipientVehicles = vehicles.filter(
          (vehicle) => vehicle.ownerId === recipient.userId
        );
        
        // Format vehicle names as comma-separated string
        const vehicleNames = recipientVehicles.map((v) => v.name).join(", ");
        
        // Get user name (firstName or fallback to email username)
        const userName = recipient.user.firstName ?? "Owner";
        
        // Convert deal type enum to readable label
        const dealTypeLabel = getDealTypeLabel(deal.dealType).toLowerCase();
        
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
          await dealService.updateRecipientStatus(
            recipient.id,
            RecipientStatus.SENT
          );
        } else {
          await dealService.updateRecipientStatus(
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
      const results = await Promise.all(statusUpdates);

      // Count successes and failures
      const successCount = results.filter((r) => r?.success).length;
      const failureCount = results.filter((r) => !r?.success).length;

      return {
        success: successCount > 0,
        total: recipients.length,
        sent: successCount,
        failed: failureCount,
        results,
      };
    }),

  /**
   * Add vehicles to an existing deal
   */
  addVehiclesToDeal: adminProcedure
    .input(addVehiclesToDealInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      return await service.addVehiclesToDeal({
        dealId: input.dealId,
        vehicleIds: input.vehicleIds,
        recipientIds: input.recipientIds,
        sendEmails: input.sendEmails,
      });
    }),

  /**
   * Update deal details
   */
  update: adminProcedure
    .input(updateDealInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      const { id, clientContactId, fullQuote, spokeFee, baselineFee, notes, status, ...restParams } = input;
      return await service.updateDeal(id, {
        ...restParams,
        clientContactId: clientContactId ?? undefined,
        fullQuote: fullQuote ?? undefined,
        spokeFee: spokeFee ?? undefined,
        baselineFee: baselineFee ?? undefined,
        notes: notes ?? undefined,
        status: status as any,
      });
    }),

  /**
   * Update deal status
   */
  updateStatus: adminProcedure
    .input(updateDealStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      if (input.status === "ARCHIVED") {
        return await service.archiveDeal(input.id);
      } else {
        return await service.unarchiveDeal(input.id);
      }
    }),

  /**
   * Archive deal
   */
  archive: adminProcedure
    .input(archiveDealInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      return await service.archiveDeal(input.id);
    }),

  /**
   * Unarchive deal
   */
  unarchive: adminProcedure
    .input(unarchiveDealInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      return await service.unarchiveDeal(input.id);
    }),

  /**
   * Delete deal (soft delete)
   */
  delete: adminProcedure
    .input(deleteDealInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      return await service.deleteDeal(input.id);
    }),

  /**
   * Get available users (for recipient selection)
   */
  getAvailableUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        userType: z.enum(["OWNER_ONLY", "REGISTERED", "ADMIN"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.UserWhereInput = {
        status: "ACTIVE",
      };

      // Filter by search term
      if (input.search && input.search.length > 0) {
        where.OR = [
          { email: { contains: input.search, mode: "insensitive" } },
          { firstName: { contains: input.search, mode: "insensitive" } },
          { lastName: { contains: input.search, mode: "insensitive" } },
          { phone: { contains: input.search, mode: "insensitive" } },
        ];
      }

      // Filter by user type
      if (input.userType) {
        where.userType = input.userType;
      }

      const users = await ctx.db.user.findMany({
        where,
        take: input.limit,
        orderBy: [
          { lastName: "asc" },
          { firstName: "asc" },
          { email: "asc" },
        ],
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          userType: true,
          _count: {
            select: {
              vehicles: true,
            },
          },
        },
      });

      return users;
    }),

  /**
   * Get new vehicles and owners for a deal (duplicate filtering)
   */
  getNewVehiclesAndOwners: adminProcedure
    .input(
      z.object({
        dealId: z.string().cuid(),
        vehicleIds: z.array(z.string().cuid()),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      return await service.getNewVehiclesAndOwners(input.dealId, input.vehicleIds);
    }),

  /**
   * Update vehicle status in deal
   */
  updateVehicleStatus: adminProcedure
    .input(updateVehicleStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      return await service.updateDealVehicleStatus({
        dealId: input.dealId,
        vehicleId: input.vehicleId,
        status: input.status,
      });
    }),

  /**
   * Update vehicle fee in deal
   */
  updateVehicleFee: adminProcedure
    .input(updateVehicleFeeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      return await service.updateDealVehicleFee({
        dealId: input.dealId,
        vehicleId: input.vehicleId,
        ownerRequestedFee: input.ownerRequestedFee,
      });
    }),

  /**
   * Create a new enquiry from a user (public-facing)
   * Non-admin users can submit enquiries that create deals
   */
  createUserEnquiry: protectedProcedure
    .input(createUserEnquiryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createDealService(ctx.db);
      
      // Get current user ID from context
      const userId = ctx.user.id;

      return await service.createUserEnquiry({
        ...input,
        userId,
      });
    }),
});

