/**
 * Deal Management Constants
 * 
 * Centralized configuration values for deal management
 */

/**
 * Maximum number of vehicles allowed in a single deal
 */
export const MAX_VEHICLES_PER_DEAL = 20;

/**
 * Maximum number of recipients (owners) allowed in a single deal
 */
export const MAX_RECIPIENTS_PER_DEAL = 100;

/**
 * Default page limit for deals list
 */
export const DEALS_PAGE_LIMIT = 50;

/**
 * Maximum deals to show in dropdown/selection lists
 */
export const DEALS_DROPDOWN_LIMIT = 100;

/**
 * Validation messages
 */
export const DEAL_VALIDATION_MESSAGES = {
  EMPTY_VEHICLES: "Deal must contain at least one vehicle",
  TOO_MANY_VEHICLES: `Deal cannot contain more than ${MAX_VEHICLES_PER_DEAL} vehicles`,
  EMPTY_RECIPIENTS: "Deal must have at least one recipient",
  TOO_MANY_RECIPIENTS: `Deal cannot have more than ${MAX_RECIPIENTS_PER_DEAL} recipients`,
  EMPTY_NAME: "Deal name is required",
  NAME_TOO_SHORT: "Deal name must be at least 3 characters",
  NAME_TOO_LONG: "Deal name must be less than 200 characters",
  ARCHIVED_DEAL: "Cannot modify archived deals",
  DEAL_NOT_FOUND: "Deal not found",
} as const;

/**
 * Deal name constraints
 */
export const DEAL_NAME_MIN_LENGTH = 3;
export const DEAL_NAME_MAX_LENGTH = 200;

