/**
 * Email Types
 * 
 * Types related to email operations and sending.
 */

/**
 * Email vehicle data (simplified for email templates)
 */
export interface EmailVehicleData {
  id: string;
  name: string;
  year: string;
  make: string;
  model: string;
  price: string | null;
  registration: string | null;
  imageUrl: string | null;
  owner: {
    name: string | null;
    email: string;
    phone: string | null;
  };
}

/**
 * Email recipient data
 */
export interface EmailRecipientData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Send deal email parameters
 */
export interface SendDealEmailParams {
  dealId: string;
  dealName: string;
  date?: string;
  time?: string;
  location?: string;
  brief?: string;
  fee?: string;
  vehicles: EmailVehicleData[];
  recipient: EmailRecipientData;
  sender: {
    email: string;
    name: string | null;
  };
}

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email template data
 */
export interface EmailTemplateData {
  subject: string;
  html: string;
  text: string;
}

/**
 * Email configuration
 */
export interface EmailConfig {
  from: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

