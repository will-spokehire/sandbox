/**
 * Deal Service
 * 
 * Business logic for deal management:
 * - Create and manage deals
 * - Send deals to users via email
 * - Track delivery status
 */

import { TRPCError } from "@trpc/server";
import { type PrismaClient, DealStatus, RecipientStatus, type Prisma } from "@prisma/client";
import { DealNotFoundError } from "../errors/app-errors";
import {
  MAX_VEHICLES_PER_DEAL,
  MAX_RECIPIENTS_PER_DEAL,
  DEAL_VALIDATION_MESSAGES,
  DEAL_NAME_MIN_LENGTH,
  DEAL_NAME_MAX_LENGTH,
} from "../constants/deals";
import { EmailService } from "./email.service";

// Use PrismaClient directly as the type
type DbClient = PrismaClient;

/**
 * Deal Service Parameters
 */
export interface CreateDealParams {
  name: string;
  date?: string;
  time?: string;
  location?: string;
  brief?: string;
  fee?: string;
  vehicleIds: string[];
  recipientIds: string[];
  createdById: string;
}

export interface SendDealParams {
  dealId: string;
  recipientIds?: string[]; // Optional: send to specific recipients, or all if not provided
}

export interface AddVehiclesToDealParams {
  dealId: string;
  vehicleIds: string[];
  recipientIds: string[]; // New recipients to add
}

export interface UpdateDealParams {
  name?: string;
  date?: string;
  time?: string;
  location?: string;
  brief?: string;
  fee?: string;
}

export interface ListDealsParams {
  limit?: number;
  cursor?: string;
  status?: DealStatus;
  createdById?: string;
}

export interface DealWithDetails {
  id: string;
  name: string;
  date: string | null;
  time: string | null;
  location: string | null;
  brief: string | null;
  fee: string | null;
  status: DealStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  vehicles: Array<{
    id: string;
    order: number;
    vehicle: {
      id: string;
      name: string;
      year: string;
      price: string | number | null;
      registration: string | null;
      make: { name: string };
      model: { name: string };
      owner: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
      };
      media: Array<{
        id: string;
        publishedUrl: string | null;
        isPrimary: boolean;
      }>;
    };
  }>;
  recipients: Array<{
    id: string;
    status: RecipientStatus;
    emailSentAt: Date | null;
    emailOpenedAt: Date | null;
    emailClickedAt: Date | null;
    errorMessage: string | null;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
    };
  }>;
  _count: {
    vehicles: number;
    recipients: number;
  };
}

/**
 * Deal Service Class
 */
export class DealService {
  constructor(private db: DbClient) {}

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

    const deals = await this.db.deal.findMany({
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            vehicles: true,
            recipients: true,
          },
        },
      },
    });

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
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        vehicles: {
          orderBy: { order: "asc" },
          include: {
            vehicle: {
              include: {
                make: { select: { name: true } },
                model: { select: { name: true } },
                owner: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
                media: {
                  where: {
                    status: "READY",
                    isVisible: true,
                  },
                  orderBy: [
                    { isPrimary: "desc" },
                    { order: "asc" },
                  ],
                  take: 1,
                  select: {
                    id: true,
                    publishedUrl: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
        },
        recipients: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        _count: {
          select: {
            vehicles: true,
            recipients: true,
          },
        },
      },
    });

    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    return deal as DealWithDetails;
  }

  /**
   * Create a new deal
   */
  async createDeal(params: CreateDealParams) {
    const { name, date, time, location, brief, fee, vehicleIds, recipientIds, createdById } = params;

    // Validate deal name
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
    const deal = await this.db.$transaction(async (tx) => {
      // Validate vehicles exist (only if there are vehicles to validate)
      if (vehicleIds.length > 0) {
        const vehicles = await tx.vehicle.findMany({
          where: {
            id: { in: vehicleIds },
          },
          select: { id: true },
        });

        if (vehicles.length !== vehicleIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some vehicles not found",
          });
        }
      }

      // Validate recipients exist (only if there are recipients to validate)
      if (recipientIds.length > 0) {
        const users = await tx.user.findMany({
          where: {
            id: { in: recipientIds },
          },
          select: { id: true },
        });

        if (users.length !== recipientIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some recipients not found",
          });
        }
      }

      // Create deal with vehicles and recipients
      const deal = await tx.deal.create({
        data: {
          name,
          date,
          time,
          location,
          brief,
          fee,
          status: DealStatus.ACTIVE,
          createdById,
          vehicles: vehicleIds.length > 0 ? {
            create: vehicleIds.map((vehicleId, index) => ({
              vehicleId,
              order: index,
            })),
          } : undefined,
          recipients: recipientIds.length > 0 ? {
            create: recipientIds.map((userId) => ({
              userId,
              status: RecipientStatus.PENDING,
            })),
          } : undefined,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              vehicles: true,
              recipients: true,
            },
          },
        },
      });

      return deal;
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
   * Add vehicles to an existing deal
   */
  async addVehiclesToDeal(params: AddVehiclesToDealParams) {
    const { dealId, vehicleIds, recipientIds } = params;

    // Use transaction for consistency
    const result = await this.db.$transaction(async (tx) => {
      // Validate deal exists and is not archived
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        throw new DealNotFoundError(dealId);
      }

      if (deal.status === DealStatus.ARCHIVED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot add vehicles to archived deals",
        });
      }

      // Validate vehicles exist
      const vehicles = await tx.vehicle.findMany({
        where: {
          id: { in: vehicleIds },
        },
        select: { id: true },
      });

      if (vehicles.length !== vehicleIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some vehicles not found",
        });
      }

      // Get current max order
      const maxOrder = await tx.dealVehicle.findFirst({
        where: { dealId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const startOrder = (maxOrder?.order ?? -1) + 1;

      // Get existing vehicle IDs and recipient IDs to avoid duplicates (OPTIMIZED)
      const [existingVehicles, existingRecipients] = await Promise.all([
        tx.dealVehicle.findMany({
          where: {
            dealId,
            vehicleId: { in: vehicleIds },
          },
          select: { vehicleId: true },
        }),
        tx.dealRecipient.findMany({
          where: {
            dealId,
            userId: { in: recipientIds },
          },
          select: { userId: true },
        }),
      ]);

      const existingVehicleIds = new Set(existingVehicles.map((v) => v.vehicleId));
      const newVehicleIds = vehicleIds.filter((id) => !existingVehicleIds.has(id));

      // Validate recipients exist
      const users = await tx.user.findMany({
        where: {
          id: { in: recipientIds },
        },
        select: { id: true },
      });

      if (users.length !== recipientIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some recipients not found",
        });
      }

      const existingRecipientIds = new Set(existingRecipients.map((r) => r.userId));
      const newRecipientIds = recipientIds.filter((id) => !existingRecipientIds.has(id));

      // Add new vehicles and recipients
      await tx.deal.update({
        where: { id: dealId },
        data: {
          vehicles: {
            create: newVehicleIds.map((vehicleId, index) => ({
              vehicleId,
              order: startOrder + index,
            })),
          },
          recipients: {
            create: newRecipientIds.map((userId) => ({
              userId,
              status: RecipientStatus.PENDING,
            })),
          },
        },
      });

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
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    // Validate name if provided
    if (name !== undefined && name.length < DEAL_NAME_MIN_LENGTH) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Deal name must be at least ${DEAL_NAME_MIN_LENGTH} characters`,
      });
    }

    if (name !== undefined && name.length > DEAL_NAME_MAX_LENGTH) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Deal name must be less than ${DEAL_NAME_MAX_LENGTH} characters`,
      });
    }

    // Update deal with provided fields
    const updatedDeal = await this.db.deal.update({
      where: { id: dealId },
      data: {
        ...(name !== undefined && { name }),
        ...(date !== undefined && { date }),
        ...(time !== undefined && { time }),
        ...(location !== undefined && { location }),
        ...(brief !== undefined && { brief }),
        ...(fee !== undefined && { fee }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            vehicles: true,
            recipients: true,
          },
        },
      },
    });

    return updatedDeal;
  }

  /**
   * Archive a deal
   */
  async archiveDeal(dealId: string) {
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    return await this.db.deal.update({
      where: { id: dealId },
      data: { status: DealStatus.ARCHIVED },
    });
  }

  /**
   * Unarchive a deal
   */
  async unarchiveDeal(dealId: string) {
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    return await this.db.deal.update({
      where: { id: dealId },
      data: { status: DealStatus.ACTIVE },
    });
  }

  /**
   * Delete deal (soft delete by archiving)
   */
  async deleteDeal(dealId: string) {
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
    });

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
    const dealVehicles = await this.db.dealVehicle.findMany({
      where: { dealId },
      orderBy: { order: "asc" },
      include: {
        vehicle: {
          include: {
            make: { select: { name: true } },
            model: { select: { name: true } },
            owner: { 
              select: { 
                id: true, 
                email: true, 
                firstName: true, 
                lastName: true 
              } 
            },
            media: {
              where: {
                status: "READY",
                isVisible: true,
              },
              orderBy: [
                { isPrimary: "desc" },
                { order: "asc" },
              ],
              take: 1,
            },
          },
        },
      },
    });

    return dealVehicles.map((dv) => dv.vehicle);
  }

  /**
   * Get recipients for deal
   */
  async getDealRecipients(dealId: string, recipientIds?: string[]) {
    const where: Prisma.DealRecipientWhereInput = { dealId };
    
    if (recipientIds && recipientIds.length > 0) {
      where.userId = { in: recipientIds };
    }

    return await this.db.dealRecipient.findMany({
      where,
      include: {
        user: true,
      },
    });
  }

  /**
   * Update recipient status after sending
   */
  async updateRecipientStatus(
    recipientId: string,
    status: RecipientStatus,
    errorMessage?: string
  ) {
    const data: Prisma.DealRecipientUpdateInput = {
      status,
      sentAt: new Date(),
    };

    if (status === RecipientStatus.SENT) {
      data.emailSentAt = new Date();
    }

    if (errorMessage) {
      data.errorMessage = errorMessage;
    }

    return await this.db.dealRecipient.update({
      where: { id: recipientId },
      data,
    });
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
      const userName = recipient.user.firstName ?? recipient.user.email.split("@")[0];
      
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
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
      include: {
        vehicles: {
          select: { vehicleId: true },
        },
        recipients: {
          select: { userId: true },
        },
      },
    });

    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    // Get existing IDs
    const existingVehicleIds = new Set(deal.vehicles.map((v) => v.vehicleId));
    const existingRecipientIds = new Set(deal.recipients.map((r) => r.userId));

    // Filter to get only new vehicles
    const newVehicleIds = vehicleIds.filter((id) => !existingVehicleIds.has(id));

    // Get owners of new vehicles
    const vehicles = await this.db.vehicle.findMany({
      where: {
        id: { in: newVehicleIds },
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

    // Get unique owner IDs that are not already recipients
    const ownerIds = [...new Set(vehicles.map((v) => v.ownerId))];
    const newOwnerIds = ownerIds.filter((id) => !existingRecipientIds.has(id));

    return {
      newVehicleIds,
      newVehicleCount: newVehicleIds.length,
      newOwnerIds,
      newOwnerCount: newOwnerIds.length,
      existingVehicleCount: vehicleIds.length - newVehicleIds.length,
      existingOwnerCount: ownerIds.length - newOwnerIds.length,
    };
  }
}

