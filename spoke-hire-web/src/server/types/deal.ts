/**
 * Deal Types
 * 
 * Types related to deal operations, creation, and management.
 */

import { type DealStatus, type RecipientStatus } from "@prisma/client";
import { type ListParams } from "./common";

/**
 * Create deal parameters
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

/**
 * Update deal parameters
 */
export interface UpdateDealParams {
  name?: string;
  date?: string;
  time?: string;
  location?: string;
  brief?: string;
  fee?: string;
}

/**
 * Send deal parameters
 */
export interface SendDealParams {
  dealId: string;
  recipientIds?: string[]; // Optional: send to specific recipients, or all if not provided
}

/**
 * Add vehicles to deal parameters
 */
export interface AddVehiclesToDealParams {
  dealId: string;
  vehicleIds: string[];
  recipientIds: string[]; // New recipients to add
}

/**
 * List deals parameters
 */
export interface ListDealsParams extends ListParams {
  status?: DealStatus;
  createdById?: string;
}

/**
 * Deal vehicle relation
 */
export interface DealVehicle {
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
}

/**
 * Deal recipient relation
 */
export interface DealRecipient {
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
}

/**
 * Deal with full details
 */
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
  vehicles: DealVehicle[];
  recipients: DealRecipient[];
  _count: {
    vehicles: number;
    recipients: number;
  };
}

/**
 * Deal summary (for lists)
 */
export interface DealSummary {
  id: string;
  name: string;
  status: DealStatus;
  createdAt: Date;
  vehicleCount: number;
  recipientCount: number;
  createdBy: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

/**
 * Deal creation result
 */
export interface CreateDealResult {
  deal: DealWithDetails;
  warnings?: string[];
}

/**
 * Deal email sending result
 */
export interface SendDealResult {
  successCount: number;
  failureCount: number;
  errors?: Array<{
    recipientId: string;
    email: string;
    error: string;
  }>;
}

/**
 * Deal statistics
 */
export interface DealStats {
  totalDeals: number;
  activeDeals: number;
  sentDeals: number;
  archivedDeals: number;
}

