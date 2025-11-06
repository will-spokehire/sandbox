/**
 * Email Service
 * 
 * Handles email sending via Loops
 * https://loops.so
 * 
 * REFACTORED: Now uses shared types where applicable.
 */

/**
 * Loops-specific deal email parameters
 * (Different from shared SendDealEmailParams which is more comprehensive)
 */
export interface LoopsDealEmailParams {
  to: string;
  userName: string;
  dealName: string;
  dealType: string;
  date: string | null;
  time: string | null;
  location: string | null;
  brief: string | null;
  fee: string | null;
  vehicleNames: string;
  dealUrl?: string;
}

/**
 * Vehicle published email parameters
 */
export interface VehiclePublishedEmailParams {
  to: string;
  ownerName: string;
  vehicleName: string;
  vehicleUrl: string;
  dashboardUrl: string;
}

/**
 * Vehicle declined email parameters
 */
export interface VehicleDeclinedEmailParams {
  to: string;
  ownerName: string;
  vehicleName: string;
  declinedReason: string;
  dashboardUrl: string;
}

/**
 * Vehicle in review email parameters (to admin)
 */
export interface VehicleInReviewEmailParams {
  to: string;
  vehicleName: string;
  ownerName: string;
  vehicleUrl: string;
}

/**
 * Email Service Class
 */
export class EmailService {
  private apiKey: string;
  private transactionalId: string;
  private apiUrl = "https://app.loops.so/api/v1";
  private isDebugMode: boolean;
  private testEmailOverride: string | undefined;

  constructor() {
    this.apiKey = process.env.LOOPS_API_KEY ?? "";
    this.transactionalId = process.env.LOOPS_TRANSACTIONAL_ID ?? "deal-notification";
    // Only enable debug mode if explicitly set to "true", not in all development
    this.isDebugMode = process.env.EMAIL_DEBUG === "true";
    // Test email override - if set, all emails will be sent to this address
    this.testEmailOverride = process.env.TEST_EMAIL_OVERRIDE?.trim() ?? undefined;
    
    if (!this.apiKey) {
      console.warn("⚠️ LOOPS_API_KEY not configured. Email sending will be simulated.");
    }

    if (!this.transactionalId) {
      console.warn("⚠️ LOOPS_TRANSACTIONAL_ID not configured. Using default: 'deal-notification'");
    }
    
    if (this.isDebugMode) {
      console.log("🐛 EMAIL DEBUG MODE: Emails will be logged to console instead of being sent");
    }
    
    if (this.testEmailOverride) {
      console.log(`🧪 TEST EMAIL OVERRIDE: All deal emails will be sent to: ${this.testEmailOverride}`);
    }
  }

  /**
   * Send deal notification email
   */
  async sendDealEmail(params: LoopsDealEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, userName, dealName, dealType, date, time, location, brief, fee, vehicleNames, dealUrl } = params;
    
    // Determine actual recipient email (use override if set)
    const originalRecipient = to;
    const actualRecipient = this.testEmailOverride ?? to;
    const isOverrideActive = this.testEmailOverride && this.testEmailOverride !== to;

    // If debug mode or no API key, log instead of sending
    if (this.isDebugMode || !this.apiKey) {
      console.log("\n" + "=".repeat(80));
      console.log("📧 [EMAIL DEBUG] Email Details:");
      console.log("=".repeat(80));
      console.log("To:", actualRecipient);
      console.log("User Name:", userName);
      if (isOverrideActive) {
        console.log("Original Recipient:", originalRecipient);
        console.log("(Using test email override)");
      }
      console.log("Deal Name:", dealName);
      console.log("Deal Type:", dealType);
      console.log("Date:", date ?? "(none)");
      console.log("Time:", time ?? "(none)");
      console.log("Location:", location ?? "(none)");
      console.log("Brief:", brief ?? "(none)");
      console.log("Fee:", fee ?? "(none)");
      console.log("Vehicle Names:", vehicleNames);
      console.log("Deal URL:", dealUrl ?? "(none)");
      console.log("=".repeat(80) + "\n");
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `debug_${Date.now()}`,
      };
    }

    try {
      // Log when using test email override
      if (isOverrideActive) {
        console.log(`🧪 [TEST EMAIL OVERRIDE] Redirecting email from ${originalRecipient} to ${actualRecipient}`);
      }

      // Send via Loops transactional API (using actualRecipient which may be overridden)
      const response = await fetch(`${this.apiUrl}/transactional`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          transactionalId: this.transactionalId,
          email: actualRecipient,
          dataVariables: {
            userName,
            dealName,
            dealType,
            date: date ?? "",
            time: time ?? "",
            location: location ?? "",
            brief: brief ?? "",
            fee: fee ?? "",
            vehicleNames,
            dealUrl: dealUrl ?? "",
          },
        }),
      });

      const data = await response.json() as { id?: string };

      if (!response.ok) {
        // Extract first and last 4 characters of transactionalId for debugging
        const idPreview = this.transactionalId.length >= 8 
          ? `${this.transactionalId.substring(0, 4)}...${this.transactionalId.substring(this.transactionalId.length - 4)}`
          : this.transactionalId;
        
        const errorMessage = `Loops API error: ${response.status} - ${JSON.stringify(data)} (transactionalId: ${idPreview})`;
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
    emails: LoopsDealEmailParams[]
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
   * Send vehicle published notification email
   */
  async sendVehiclePublishedEmail(params: VehiclePublishedEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, ownerName, vehicleName, vehicleUrl, dashboardUrl } = params;
    
    const transactionalId = process.env.LOOPS_VEHICLE_PUBLISHED_ID ?? "vehicle-published";
    
    // Determine actual recipient email (use override if set)
    const originalRecipient = to;
    const actualRecipient = this.testEmailOverride ?? to;
    const isOverrideActive = this.testEmailOverride && this.testEmailOverride !== to;

    // If debug mode or no API key, log instead of sending
    if (this.isDebugMode || !this.apiKey) {
      console.log("\n" + "=".repeat(80));
      console.log("📧 [EMAIL DEBUG] Vehicle Published Email:");
      console.log("=".repeat(80));
      console.log("To:", actualRecipient);
      if (isOverrideActive) {
        console.log("Original Recipient:", originalRecipient);
        console.log("(Using test email override)");
      }
      console.log("Owner Name:", ownerName);
      console.log("Vehicle Name:", vehicleName);
      console.log("Vehicle URL:", vehicleUrl);
      console.log("Dashboard URL:", dashboardUrl);
      console.log("=".repeat(80) + "\n");
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `debug_published_${Date.now()}`,
      };
    }

    try {
      if (isOverrideActive) {
        console.log(`🧪 [TEST EMAIL OVERRIDE] Redirecting email from ${originalRecipient} to ${actualRecipient}`);
      }

      const response = await fetch(`${this.apiUrl}/transactional`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          transactionalId,
          email: actualRecipient,
          dataVariables: {
            ownerName,
            vehicleName,
            vehicleUrl,
            dashboardUrl,
          },
        }),
      });

      const data = await response.json() as { id?: string };

      if (!response.ok) {
        // Extract first and last 4 characters of transactionalId for debugging
        const idPreview = transactionalId.length >= 8 
          ? `${transactionalId.substring(0, 4)}...${transactionalId.substring(transactionalId.length - 4)}`
          : transactionalId;
        
        const errorMessage = `Loops API error: ${response.status} - ${JSON.stringify(data)} (transactionalId: ${idPreview})`;
        console.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true, messageId: data.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send email";
      console.error("Failed to send vehicle published email:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send vehicle declined notification email
   */
  async sendVehicleDeclinedEmail(params: VehicleDeclinedEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, ownerName, vehicleName, declinedReason, dashboardUrl } = params;
    
    const transactionalId = process.env.LOOPS_VEHICLE_DECLINED_ID ?? "vehicle-declined";
    
    // Determine actual recipient email (use override if set)
    const originalRecipient = to;
    const actualRecipient = this.testEmailOverride ?? to;
    const isOverrideActive = this.testEmailOverride && this.testEmailOverride !== to;

    // If debug mode or no API key, log instead of sending
    if (this.isDebugMode || !this.apiKey) {
      console.log("\n" + "=".repeat(80));
      console.log("📧 [EMAIL DEBUG] Vehicle Declined Email:");
      console.log("=".repeat(80));
      console.log("To:", actualRecipient);
      if (isOverrideActive) {
        console.log("Original Recipient:", originalRecipient);
        console.log("(Using test email override)");
      }
      console.log("Owner Name:", ownerName);
      console.log("Vehicle Name:", vehicleName);
      console.log("Declined Reason:", declinedReason);
      console.log("Dashboard URL:", dashboardUrl);
      console.log("=".repeat(80) + "\n");
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `debug_declined_${Date.now()}`,
      };
    }

    try {
      if (isOverrideActive) {
        console.log(`🧪 [TEST EMAIL OVERRIDE] Redirecting email from ${originalRecipient} to ${actualRecipient}`);
      }

      const response = await fetch(`${this.apiUrl}/transactional`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          transactionalId,
          email: actualRecipient,
          dataVariables: {
            ownerName,
            vehicleName,
            declinedReason,
            dashboardUrl,
          },
        }),
      });

      const data = await response.json() as { id?: string };

      if (!response.ok) {
        // Extract first and last 4 characters of transactionalId for debugging
        const idPreview = transactionalId.length >= 8 
          ? `${transactionalId.substring(0, 4)}...${transactionalId.substring(transactionalId.length - 4)}`
          : transactionalId;
        
        const errorMessage = `Loops API error: ${response.status} - ${JSON.stringify(data)} (transactionalId: ${idPreview})`;
        console.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true, messageId: data.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send email";
      console.error("Failed to send vehicle declined email:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send vehicle in review notification email (to admin)
   */
  async sendVehicleInReviewEmail(params: VehicleInReviewEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, vehicleName, ownerName, vehicleUrl } = params;
    
    const transactionalId = process.env.LOOPS_VEHICLE_IN_REVIEW_ID ?? "vehicle-in-review";
    
    // Determine actual recipient email (use override if set)
    const originalRecipient = to;
    const actualRecipient = this.testEmailOverride ?? to;
    const isOverrideActive = this.testEmailOverride && this.testEmailOverride !== to;

    // If debug mode or no API key, log instead of sending
    if (this.isDebugMode || !this.apiKey) {
      console.log("\n" + "=".repeat(80));
      console.log("📧 [EMAIL DEBUG] Vehicle In Review Email (Admin):");
      console.log("=".repeat(80));
      console.log("To:", actualRecipient);
      if (isOverrideActive) {
        console.log("Original Recipient:", originalRecipient);
        console.log("(Using test email override)");
      }
      console.log("Vehicle Name:", vehicleName);
      console.log("Owner Name:", ownerName);
      console.log("Vehicle URL (Admin):", vehicleUrl);
      console.log("=".repeat(80) + "\n");
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `debug_in_review_${Date.now()}`,
      };
    }

    try {
      if (isOverrideActive) {
        console.log(`🧪 [TEST EMAIL OVERRIDE] Redirecting email from ${originalRecipient} to ${actualRecipient}`);
      }

      const response = await fetch(`${this.apiUrl}/transactional`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          transactionalId,
          email: actualRecipient,
          dataVariables: {
            vehicleName,
            ownerName,
            vehicleUrl,
          },
        }),
      });

      const data = await response.json() as { id?: string };

      if (!response.ok) {
        // Extract first and last 4 characters of transactionalId for debugging
        const idPreview = transactionalId.length >= 8 
          ? `${transactionalId.substring(0, 4)}...${transactionalId.substring(transactionalId.length - 4)}`
          : transactionalId;
        
        const errorMessage = `Loops API error: ${response.status} - ${JSON.stringify(data)} (transactionalId: ${idPreview})`;
        console.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true, messageId: data.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send email";
      console.error("Failed to send vehicle in review email:", error);
      return { success: false, error: errorMessage };
    }
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
export function formatPrice(price: string | number | null | undefined): string {
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

