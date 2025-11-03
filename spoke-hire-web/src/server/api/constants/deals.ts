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

/**
 * Financial field constraints (in GBP)
 */
export const MIN_FINANCIAL_AMOUNT = 0;
export const MAX_FINANCIAL_AMOUNT = 999999.99;

/**
 * Notes constraints
 */
export const MAX_NOTES_LENGTH = 2000;

/**
 * Financial validation messages
 */
export const FINANCIAL_VALIDATION_MESSAGES = {
  NEGATIVE_AMOUNT: "Financial amounts must be positive",
  AMOUNT_TOO_LARGE: `Financial amounts cannot exceed £${MAX_FINANCIAL_AMOUNT.toLocaleString()}`,
  INVALID_AMOUNT: "Invalid financial amount",
  NOTES_TOO_LONG: `Notes cannot exceed ${MAX_NOTES_LENGTH} characters`,
} as const;

/**
 * Deal status display names
 */
export const DEAL_STATUS_DISPLAY_NAMES = {
  OPTIONS: "Options",
  CONTRACTS_INVOICE: "Contracts & Invoice",
  COMPLETE: "Complete",
  POSTPONED: "Postponed",
  ABANDONED: "Abandoned",
  ARCHIVED: "Archived",
} as const;

/**
 * Deal status badge colors
 */
export const DEAL_STATUS_COLORS = {
  OPTIONS: "blue",
  CONTRACTS_INVOICE: "yellow",
  COMPLETE: "green",
  POSTPONED: "orange",
  ABANDONED: "red",
  ARCHIVED: "gray",
} as const;

