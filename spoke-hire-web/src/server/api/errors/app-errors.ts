/**
 * Custom Application Errors
 * 
 * Centralized error definitions for consistent error handling across the API.
 * All errors extend TRPCError for proper tRPC integration.
 */

import { TRPCError } from "@trpc/server";

/**
 * Base class for application errors
 */
export class AppError extends TRPCError {
  constructor(code: TRPCError["code"], message: string, cause?: unknown) {
    super({ code, message, cause });
  }
}

// ============================================================================
// Vehicle Errors
// ============================================================================

export class VehicleNotFoundError extends TRPCError {
  constructor(id: string) {
    super({
      code: "NOT_FOUND",
      message: `Vehicle with ID '${id}' not found`,
    });
  }
}

export class VehicleValidationError extends TRPCError {
  constructor(message: string, cause?: unknown) {
    super({
      code: "BAD_REQUEST",
      message: `Vehicle validation failed: ${message}`,
      cause,
    });
  }
}

// ============================================================================
// User/Auth Errors
// ============================================================================

export class UserNotFoundError extends TRPCError {
  constructor(identifier: string) {
    super({
      code: "NOT_FOUND",
      message: `User '${identifier}' not found`,
    });
  }
}

export class UnauthorizedError extends TRPCError {
  constructor(message = "You must be logged in to access this resource") {
    super({
      code: "UNAUTHORIZED",
      message,
    });
  }
}

export class ForbiddenError extends TRPCError {
  constructor(message = "You don't have permission to access this resource") {
    super({
      code: "FORBIDDEN",
      message,
    });
  }
}

export class AdminRequiredError extends TRPCError {
  constructor() {
    super({
      code: "FORBIDDEN",
      message: "Admin privileges required to access this resource",
    });
  }
}

export class AccountInactiveError extends TRPCError {
  constructor() {
    super({
      code: "FORBIDDEN",
      message: "Account is not active. Please contact support.",
    });
  }
}

export class OTPError extends TRPCError {
  constructor(message: string, cause?: unknown) {
    super({
      code: "BAD_REQUEST",
      message: `OTP error: ${message}`,
      cause,
    });
  }
}

export class RateLimitError extends TRPCError {
  constructor(retryAfter?: number) {
    super({
      code: "TOO_MANY_REQUESTS",
      message: retryAfter
        ? `Too many requests. Please wait ${retryAfter} seconds before trying again.`
        : "Too many requests. Please wait a moment before trying again.",
    });
  }
}

// ============================================================================
// Data Errors
// ============================================================================

export class CollectionNotFoundError extends TRPCError {
  constructor(id: string) {
    super({
      code: "NOT_FOUND",
      message: `Collection with ID '${id}' not found`,
    });
  }
}

export class MakeNotFoundError extends TRPCError {
  constructor(id: string) {
    super({
      code: "NOT_FOUND",
      message: `Make with ID '${id}' not found`,
    });
  }
}

export class ModelNotFoundError extends TRPCError {
  constructor(id: string) {
    super({
      code: "NOT_FOUND",
      message: `Model with ID '${id}' not found`,
    });
  }
}

// ============================================================================
// Geocoding Errors
// ============================================================================

export class GeocodingError extends TRPCError {
  constructor(message: string, cause?: unknown) {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message: `Geocoding failed: ${message}`,
      cause,
    });
  }
}

export class InvalidPostcodeError extends TRPCError {
  constructor(postcode: string) {
    super({
      code: "BAD_REQUEST",
      message: `Invalid postcode: ${postcode}`,
    });
  }
}

// ============================================================================
// Generic Errors
// ============================================================================

export class DatabaseError extends TRPCError {
  constructor(message: string, cause?: unknown) {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message: `Database error: ${message}`,
      cause,
    });
  }
}

export class ValidationError extends TRPCError {
  constructor(message: string, cause?: unknown) {
    super({
      code: "BAD_REQUEST",
      message: `Validation error: ${message}`,
      cause,
    });
  }
}

export class ExternalServiceError extends TRPCError {
  constructor(service: string, message: string, cause?: unknown) {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message: `${service} error: ${message}`,
      cause,
    });
  }
}
