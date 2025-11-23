/**
 * WhatsApp Utility Functions
 * 
 * Helper functions for generating WhatsApp URLs, messages, and phone number formatting
 */

/**
 * Format phone number for display (with country code and spacing)
 * Examples: "+44 7123 456789", "+1 (555) 123-4567"
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  // Return phone as-is (already in E.164 format)
  return phone;
}

/**
 * Validate phone number format
 * Returns true if the phone number is valid in E.164 format
 */
export function isValidPhoneNumber(phone: string | undefined): boolean {
  if (!phone) return false;
  
  // Basic E.164 validation: starts with + and has 8-15 digits
  const e164Pattern = /^\+[1-9]\d{7,14}$/;
  return e164Pattern.test(phone);
}

/**
 * Format phone number for WhatsApp (remove spaces, dashes, etc.)
 * WhatsApp expects: country code + number (no + or spaces)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '');
}

/**
 * Generate WhatsApp chat URL (blank message)
 */
export function getWhatsAppChatUrl(phone: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${formattedPhone}`;
}

/**
 * Generate WhatsApp URL with pre-filled message
 */
export function getWhatsAppMessageUrl(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Open WhatsApp chat (no message), trying app first then web
 */
export function openWhatsAppChat(phone: string): void {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  
  // Try app protocol first
  const appUrl = `whatsapp://send?phone=${formattedPhone}`;
  const webUrl = `https://wa.me/${formattedPhone}`;
  
  // Attempt to open app
  const start = Date.now();
  window.location.href = appUrl;
  
  // If app doesn't open within 1 second, fall back to web
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      window.open(webUrl, '_blank');
    }
  }, 1000);
}

/**
 * Open WhatsApp with message, trying app first then web
 */
export function openWhatsAppWithMessage(phone: string, message: string): void {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  
  // Try app protocol first
  const appUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
  const webUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
  
  // Attempt to open app
  const start = Date.now();
  window.location.href = appUrl;
  
  // If app doesn't open within 1 second, fall back to web
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      window.open(webUrl, '_blank');
    }
  }, 1000);
}

/**
 * Generate templated deal message for WhatsApp
 */
export function generateDealMessage(params: {
  vehicleName: string;
  ownerName: string;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  brief?: string | null;
  fee?: string | null;
}): string {
  const { vehicleName, ownerName, date, time, location, brief, fee } = params;
  
  // Extract first name only from ownerName
  const firstName = ownerName.split(' ')[0];
  
  let message = `Hey ${firstName}, we've got an exciting production coming up that we think your ${vehicleName} would be great for.\n\n`;
  message += `Details:\n`;
  
  if (date) {
    message += `- Date: ${date}\n`;
  }
  
  if (time) {
    message += `- Time: ${time}\n`;
  }
  
  if (location) {
    message += `- Location: ${location}\n`;
  }
  
  if (brief) {
    message += `- Brief: ${brief}\n`;
  }
  
  message += `\n`;
  
  if (fee) {
    message += `If you're interested, please let us know your availability and fee. Other vehicles are being put forward at around £${fee}, but we'll take your lead.\n\n`;
  } else {
    message += `If you're interested, please let us know your availability and fee.\n\n`;
  }
  
  message += `Cheers,\nGeorge`;
  
  return message;
}

