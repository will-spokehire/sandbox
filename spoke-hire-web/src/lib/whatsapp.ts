/**
 * WhatsApp Utility Functions
 * 
 * Helper functions for generating WhatsApp URLs and messages
 */

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
 * Generate templated deal message for WhatsApp
 */
export function generateDealMessage(params: {
  dealName: string;
  dealDescription?: string | null | undefined;
  vehicleName: string;
  ownerName: string;
}): string {
  const { dealName, dealDescription, vehicleName, ownerName } = params;
  
  let message = `Hi ${ownerName},\n\n`;
  message += `I'm reaching out regarding the deal: *${dealName}*\n\n`;
  
  if (dealDescription) {
    message += `${dealDescription}\n\n`;
  }
  
  message += `This includes your vehicle: ${vehicleName}\n\n`;
  message += `Please let me know if you have any questions.\n\n`;
  message += `Best regards`;
  
  return message;
}

