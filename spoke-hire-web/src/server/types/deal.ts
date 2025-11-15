/**
 * Deal Types
 * 
 * Types related to deal operations, creation, and management.
 */

import { type DealStatus, type RecipientStatus, type DealVehicleStatus, type DealType } from "@prisma/client";
import { type ListParams } from "./common";

/**
 * Create deal parameters
 */
export interface CreateDealParams {
  name: string;
  dealType: DealType;
  date?: string;
  time?: string;
  location?: string;
  brief?: string;
  fee?: string;
  clientContactId?: string;
  fullQuote?: number;
  spokeFee?: number;
  notes?: string;
  vehicleIds: string[];
  recipientIds: string[];
  createdById: string;
}

/**
 * Update deal parameters
 */
export interface UpdateDealParams {
  name?: string;
  dealType?: DealType;
  date?: string;
  time?: string;
  location?: string;
  brief?: string;
  fee?: string;
  clientContactId?: string;
  fullQuote?: number;
  spokeFee?: number;
  notes?: string;
  status?: DealStatus;
}

/**
 * Update deal vehicle status parameters
 */
export interface UpdateDealVehicleStatusParams {
  dealId: string;
  vehicleId: string;
  status: DealVehicleStatus;
}

/**
 * Update deal vehicle fee parameters
 */
export interface UpdateDealVehicleFeeParams {
  dealId: string;
  vehicleId: string;
  ownerRequestedFee: number | null;
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
  sendEmails?: boolean; // Whether to send email notifications (default: false)
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
  status: DealVehicleStatus;
  ownerRequestedFee: string | number | null;
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
  userId: string;
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
    company: string | null;
  };
}

/**
 * Deal with full details
 */
export interface DealWithDetails {
  id: string;
  name: string;
  dealType: DealType;
  date: string | null;
  time: string | null;
  location: string | null;
  brief: string | null;
  fee: string | null;
  clientContactId: string | null;
  clientContact: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    company: string | null;
  } | null;
  fullQuote: string | number | null;
  spokeFee: string | number | null;
  notes: string | null;
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
  dealType: DealType;
  status: DealStatus;
  clientContact: {
    company: string | null;
  } | null;
  fullQuote: string | number | null;
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

/**
 * User enquiry input (from public-facing enquiry form)
 */
export interface CreateUserEnquiryInput {
  // Personal information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  // Enquiry details
  dealType: DealType;
  date?: string;
  time?: string;
  location?: string;
  brief?: string;
  // Optional vehicle association
  vehicleId?: string;
}

/**
 * User enquiry creation result
 */
export interface UserEnquiryResult {
  success: boolean;
  dealId: string;
  message: string;
}

