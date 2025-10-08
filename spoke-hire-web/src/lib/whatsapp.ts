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
  vehicleName: string;
  ownerName: string;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  brief?: string | null;
  fee?: string | null;
}): string {
  const { vehicleName, ownerName, date, time, location, brief, fee } = params;
  
  let message = `Hey ${ownerName}, we've got an exciting production coming up that we think your ${vehicleName} would be great for.\n\n`;
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
    message += `If you're interested, please let us know your availability and fee. Other vehicles are being put forward at around ${fee}, but we'll take your lead.\n\n`;
  } else {
    message += `If you're interested, please let us know your availability and fee.\n\n`;
  }
  
  message += `Cheers,\nGeorge`;
  
  return message;
}

