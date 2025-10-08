/**
 * Email Service
 * 
 * Handles email sending via Loops
 * https://loops.so
 */

import { TRPCError } from "@trpc/server";

/**
 * Vehicle data for email
 */
export interface EmailVehicleData {
  id: string;
  name: string;
  year: string;
  price: string;
  registration: string | null;
  make: string;
  model: string;
  imageUrl: string | null;
}

/**
 * Deal email parameters
 */
export interface SendDealEmailParams {
  to: string;
  dealName: string;
  dealDescription: string | null;
  vehicles: EmailVehicleData[];
  dealUrl?: string;
}

/**
 * Email Service Class
 */
export class EmailService {
  private apiKey: string;
  private transactionalId: string;
  private apiUrl = "https://app.loops.so/api/v1";
  private isDebugMode: boolean;

  constructor() {
    this.apiKey = process.env.LOOPS_API_KEY || "";
    this.transactionalId = process.env.LOOPS_TRANSACTIONAL_ID || "deal-notification";
    // Only enable debug mode if explicitly set to "true", not in all development
    this.isDebugMode = process.env.EMAIL_DEBUG === "true";
    
    if (!this.apiKey) {
      console.warn("⚠️ LOOPS_API_KEY not configured. Email sending will be simulated.");
    }

    if (!this.transactionalId) {
      console.warn("⚠️ LOOPS_TRANSACTIONAL_ID not configured. Using default: 'deal-notification'");
    }
    
    if (this.isDebugMode) {
      console.log("🐛 EMAIL DEBUG MODE: Emails will be logged to console instead of being sent");
    }
  }

  /**
   * Send deal notification email
   */
  async sendDealEmail(params: SendDealEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, dealName, dealDescription, vehicles, dealUrl } = params;

    // If debug mode or no API key, log instead of sending
    if (this.isDebugMode || !this.apiKey) {
      console.log("\n" + "=".repeat(80));
      console.log("📧 [EMAIL DEBUG] Email Details:");
      console.log("=".repeat(80));
      console.log("To:", to);
      console.log("Deal Name:", dealName);
      console.log("Deal Description:", dealDescription || "(none)");
      console.log("Deal URL:", dealUrl || "(none)");
      console.log("Number of Vehicles:", vehicles.length);
      console.log("\nVehicles:");
      vehicles.forEach((v, idx) => {
        console.log(`  ${idx + 1}. ${v.year} ${v.make} ${v.model} - ${v.price}`);
        console.log(`     Registration: ${v.registration || "N/A"}`);
        console.log(`     Image: ${v.imageUrl || "(no image)"}`);
      });
      console.log("=".repeat(80) + "\n");
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `debug_${Date.now()}`,
      };
    }

    try {
      // Format vehicles for email template
      const vehiclesList = vehicles.map(v => ({
        name: v.name,
        year: v.year,
        make: v.make,
        model: v.model,
        price: v.price,
        registration: v.registration || "N/A",
        imageUrl: v.imageUrl || "",
      }));

      // Send via Loops transactional API
      const response = await fetch(`${this.apiUrl}/transactional`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          transactionalId: this.transactionalId,
          email: to,
          dataVariables: {
            dealName,
            dealDescription: dealDescription || "",
            vehiclesCount: vehicles.length,
            vehicles: vehiclesList,
            dealUrl: dealUrl || "",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = `Loops API error: ${response.status} - ${JSON.stringify(data)}`;
        console.error(errorMessage);
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send email";
      console.error("Failed to send email via Loops:", error);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send bulk emails with Promise.allSettled for better performance
   */
  async sendBulkEmails(
    emails: SendDealEmailParams[]
  ): Promise<Array<{ email: string; success: boolean; error?: string; messageId?: string }>> {
    // Use Promise.allSettled for concurrent sending
    const promises = emails.map(async (emailParams) => {
      try {
        const result = await this.sendDealEmail(emailParams);
        return {
          email: emailParams.to,
          success: result.success,
          error: result.error,
          messageId: result.messageId,
        };
      } catch (error) {
        return {
          email: emailParams.to,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          email: emails[index]!.to,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : "Unknown error",
        };
      }
    });
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      console.warn("No LOOPS_API_KEY configured");
      return false;
    }

    try {
      // Test API key by making a simple request
      const response = await fetch(`${this.apiUrl}/api-key`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to test Loops connection:", error);
      return false;
    }
  }
}

/**
 * Helper to format price
 */
export function formatPrice(price: any): string {
  if (!price) return "POA";
  
  const numPrice = typeof price === "string" ? parseFloat(price) : Number(price);
  
  if (isNaN(numPrice)) return "POA";
  
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

