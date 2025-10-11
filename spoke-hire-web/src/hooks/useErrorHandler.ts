"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";

/**
 * Comprehensive error handling hook
 * 
 * Provides centralized error handling for tRPC errors, network failures,
 * and other common error scenarios with appropriate user feedback.
 * 
 * @example
 * ```typescript
 * const { handleError, handleTRPCError, handleNetworkError } = useErrorHandler();
 * 
 * try {
 *   await someMutation();
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */
export function useErrorHandler() {
  // Handle tRPC-specific errors
  const handleTRPCError = useCallback((error: TRPCClientError<any>) => {
    console.error("tRPC Error:", error);
    
    // Extract error message
    const message = error.message || "An unexpected error occurred";
    
    // Handle specific error codes
    switch (error.data?.code) {
      case "UNAUTHORIZED":
        toast.error("You are not authorized to perform this action");
        break;
      case "FORBIDDEN":
        toast.error("Access denied. Please check your permissions");
        break;
      case "NOT_FOUND":
        toast.error("The requested resource was not found");
        break;
      case "CONFLICT":
        toast.error("This action conflicts with existing data");
        break;
      case "TOO_MANY_REQUESTS":
        toast.error("Too many requests. Please try again later");
        break;
      case "PAYLOAD_TOO_LARGE":
        toast.error("The request is too large");
        break;
      case "UNPROCESSABLE_CONTENT":
        toast.error("Invalid data provided. Please check your input");
        break;
      case "INTERNAL_SERVER_ERROR":
        toast.error("Server error. Please try again later");
        break;
      default:
        toast.error(message);
    }
  }, []);

  // Handle network errors
  const handleNetworkError = useCallback((error: any) => {
    console.error("Network Error:", error);
    
    if (error.name === "NetworkError" || error.message?.includes("fetch")) {
      toast.error("Network error. Please check your connection and try again");
    } else if (error.name === "TimeoutError") {
      toast.error("Request timed out. Please try again");
    } else if (error.message?.includes("CORS")) {
      toast.error("Network configuration error. Please contact support");
    } else {
      toast.error("Network error. Please try again");
    }
  }, []);

  // Handle validation errors
  const handleValidationError = useCallback((error: any) => {
    console.error("Validation Error:", error);
    
    if (error.issues && Array.isArray(error.issues)) {
      // Zod validation errors
      const firstError = error.issues[0];
      if (firstError) {
        toast.error(firstError.message || "Validation error");
      } else {
        toast.error("Invalid data provided");
      }
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error("Invalid data provided");
    }
  }, []);

  // Handle authentication errors
  const handleAuthError = useCallback((error: any) => {
    console.error("Auth Error:", error);
    
    if (error.message?.includes("session") || error.message?.includes("token")) {
      toast.error("Your session has expired. Please sign in again");
      // Could trigger a redirect to login here
    } else if (error.message?.includes("permission") || error.message?.includes("role")) {
      toast.error("You don't have permission to perform this action");
    } else {
      toast.error("Authentication error. Please sign in again");
    }
  }, []);

  // Generic error handler that tries to determine error type
  const handleError = useCallback((error: any) => {
    console.error("Error:", error);
    
    // Check if it's a tRPC error
    if (error instanceof TRPCClientError) {
      handleTRPCError(error);
      return;
    }
    
    // Check for network errors
    if (error.name === "NetworkError" || 
        error.message?.includes("fetch") || 
        error.message?.includes("network") ||
        error.message?.includes("timeout")) {
      handleNetworkError(error);
      return;
    }
    
    // Check for validation errors (Zod)
    if (error.issues || error.name === "ZodError") {
      handleValidationError(error);
      return;
    }
    
    // Check for authentication errors
    if (error.message?.includes("auth") || 
        error.message?.includes("session") || 
        error.message?.includes("token") ||
        error.message?.includes("permission")) {
      handleAuthError(error);
      return;
    }
    
    // Fallback to generic error message
    const message = error.message || error.toString() || "An unexpected error occurred";
    toast.error(message);
  }, [handleTRPCError, handleNetworkError, handleValidationError, handleAuthError]);

  // Handle errors with custom message
  const handleErrorWithMessage = useCallback((error: any, customMessage: string) => {
    console.error("Error:", error);
    toast.error(customMessage);
  }, []);

  // Handle errors silently (for background operations)
  const handleErrorSilently = useCallback((error: any) => {
    console.error("Silent Error:", error);
    // No toast notification, just log the error
  }, []);

  return {
    handleError,
    handleTRPCError,
    handleNetworkError,
    handleValidationError,
    handleAuthError,
    handleErrorWithMessage,
    handleErrorSilently,
  };
}
