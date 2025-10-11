/**
 * Deal Repository
 * 
 * Data access layer for Deal entity.
 * Handles all Prisma queries related to deals, vehicles, and recipients.
 */

import { type Prisma, type DealStatus, RecipientStatus } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { DatabaseError, DealNotFoundError } from "../errors/app-errors";

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
      price: Prisma.Decimal | null;
      registration: string | null;
      ownerId: string;
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

export interface CreateDealData {
  name: string;
  date?: string;
  time?: string;
  location?: string;
  brief?: string;
  fee?: string;
  status: DealStatus;
  createdById: string;
  vehicleIds: string[];
  recipientIds: string[];
}

export class DealRepository extends BaseRepository {
  protected get model() {
    return this.db.deal;
  }

  protected readonly entityName = "Deal" as const;

  /**
   * Find deal by ID with full details
   */
  async findByIdWithDetails(dealId: string): Promise<DealWithDetails> {
    try {
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

      return deal as unknown as DealWithDetails;
    } catch (error) {
      if (error instanceof DealNotFoundError) {
        throw error;
      }
      throw new DatabaseError("Failed to fetch deal with details", error);
    }
  }

  /**
   * Find many deals with pagination
   */
  async findManyWithPagination(
    where: Prisma.DealWhereInput,
    limit: number,
    cursor?: string
  ) {
    try {
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

      return deals;
    } catch (error) {
      throw new DatabaseError("Failed to fetch deals", error);
    }
  }

  /**
   * Create deal with vehicles and recipients
   */
  async createWithRelations(data: CreateDealData) {
    try {
      const deal = await this.db.deal.create({
        data: {
          name: data.name,
          date: data.date,
          time: data.time,
          location: data.location,
          brief: data.brief,
          fee: data.fee,
          status: data.status,
          createdById: data.createdById,
          vehicles: data.vehicleIds.length > 0 ? {
            create: data.vehicleIds.map((vehicleId, index) => ({
              vehicleId,
              order: index,
            })),
          } : undefined,
          recipients: data.recipientIds.length > 0 ? {
            create: data.recipientIds.map((userId) => ({
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
    } catch (error) {
      throw new DatabaseError("Failed to create deal", error);
    }
  }

  /**
   * Update deal status
   */
  async updateStatus(dealId: string, status: DealStatus) {
    try {
      return await this.db.deal.update({
        where: { id: dealId },
        data: { status },
      });
    } catch (error) {
      throw new DatabaseError("Failed to update deal status", error);
    }
  }

  /**
   * Update deal details
   */
  async updateDetails(
    dealId: string,
    data: {
      name?: string;
      date?: string;
      time?: string;
      location?: string;
      brief?: string;
      fee?: string;
    }
  ) {
    try {
      return await this.db.deal.update({
        where: { id: dealId },
        data,
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
    } catch (error) {
      throw new DatabaseError("Failed to update deal", error);
    }
  }

  /**
   * Get existing vehicle IDs and recipient IDs for a deal
   */
  async getExistingRelations(dealId: string) {
    try {
      const [existingVehicles, existingRecipients] = await Promise.all([
        this.db.dealVehicle.findMany({
          where: { dealId },
          select: { vehicleId: true },
        }),
        this.db.dealRecipient.findMany({
          where: { dealId },
          select: { userId: true },
        }),
      ]);

      return {
        vehicleIds: existingVehicles.map((v) => v.vehicleId),
        recipientIds: existingRecipients.map((r) => r.userId),
      };
    } catch (error) {
      throw new DatabaseError("Failed to fetch existing deal relations", error);
    }
  }

  /**
   * Get max order for vehicles in a deal
   */
  async getMaxVehicleOrder(dealId: string): Promise<number> {
    try {
      const maxOrder = await this.db.dealVehicle.findFirst({
        where: { dealId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      return maxOrder?.order ?? -1;
    } catch (error) {
      throw new DatabaseError("Failed to get max vehicle order", error);
    }
  }

  /**
   * Add vehicles and recipients to existing deal
   */
  async addVehiclesAndRecipients(
    dealId: string,
    vehicleIds: string[],
    recipientIds: string[],
    startOrder: number
  ) {
    try {
      // Use upsert to handle potential duplicates gracefully
      const vehiclePromises = vehicleIds.map((vehicleId, index) =>
        this.db.dealVehicle.upsert({
          where: {
            dealId_vehicleId: {
              dealId,
              vehicleId,
            },
          },
          update: {
            order: startOrder + index,
          },
          create: {
            dealId,
            vehicleId,
            order: startOrder + index,
          },
        })
      );

      const recipientPromises = recipientIds.map((userId) =>
        this.db.dealRecipient.upsert({
          where: {
            dealId_userId: {
              dealId,
              userId,
            },
          },
          update: {
            // Keep existing status if already exists
          },
          create: {
            dealId,
            userId,
            status: RecipientStatus.PENDING,
          },
        })
      );

      // Execute all upserts in parallel
      await Promise.all([...vehiclePromises, ...recipientPromises]);
    } catch (error) {
      throw new DatabaseError("Failed to add vehicles and recipients to deal", error);
    }
  }

  /**
   * Get vehicles for a deal
   */
  async findDealVehicles(dealId: string) {
    try {
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
                  lastName: true,
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
                  originalUrl: true,
                },
              },
            },
          },
        },
      }) as unknown as Array<{
        vehicle: {
          id: string;
          name: string;
          ownerId: string;
          make: { name: string };
          model: { name: string };
          owner: { id: string; email: string; firstName: string | null; lastName: string | null };
          media: Array<{ id: string; publishedUrl: string | null; originalUrl: string }>;
        };
      }>;

      // Map to extract just the vehicle data
      return dealVehicles.map((dv) => dv.vehicle);
    } catch (error) {
      throw new DatabaseError("Failed to fetch deal vehicles", error);
    }
  }

  /**
   * Get recipients for a deal
   */
  async findDealRecipients(dealId: string, recipientIds?: string[]) {
    try {
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
    } catch (error) {
      throw new DatabaseError("Failed to fetch deal recipients", error);
    }
  }

  /**
   * Update recipient status
   */
  async updateRecipientStatus(
    recipientId: string,
    status: RecipientStatus,
    errorMessage?: string
  ) {
    try {
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
    } catch (error) {
      throw new DatabaseError("Failed to update recipient status", error);
    }
  }

  /**
   * Validate vehicles exist
   */
  async validateVehiclesExist(vehicleIds: string[]): Promise<boolean> {
    try {
      const count = await this.db.vehicle.count({
        where: {
          id: { in: vehicleIds },
        },
      });

      return count === vehicleIds.length;
    } catch (error) {
      throw new DatabaseError("Failed to validate vehicles", error);
    }
  }

  /**
   * Validate users exist
   */
  async validateUsersExist(userIds: string[]): Promise<boolean> {
    try {
      const count = await this.db.user.count({
        where: {
          id: { in: userIds },
        },
      });

      return count === userIds.length;
    } catch (error) {
      throw new DatabaseError("Failed to validate users", error);
    }
  }

  /**
   * Get new vehicles and owners for a deal (for duplicate filtering)
   */
  async getNewVehiclesAndOwners(dealId: string, vehicleIds: string[]) {
    try {
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
    } catch (error) {
      if (error instanceof DealNotFoundError) {
        throw error;
      }
      throw new DatabaseError("Failed to get new vehicles and owners", error);
    }
  }
}

