"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * Retry mechanism hook
 * 
 * Provides retry functionality for failed operations with exponential backoff
 * and user feedback.
 * 
 * @example
 * ```typescript
 * const { retry, isRetrying } = useRetry();
 * 
 * const handleFailedOperation = async () => {
 *   await retry(async () => {
 *     await someRiskyOperation();
 *   }, {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *     operationName: "Save changes"
 *   });
 * };
 * ```
 */
export function useRetry() {
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options: {
        maxAttempts?: number;
        baseDelay?: number;
        operationName?: string;
        onRetry?: (attempt: number, error: any) => void;
        onSuccess?: (result: T) => void;
        onFinalFailure?: (error: any) => void;
      } = {}
    ): Promise<T> => {
      const {
        maxAttempts = 3,
        baseDelay = 1000,
        operationName = "Operation",
        onRetry,
        onSuccess,
        onFinalFailure,
      } = options;

      let lastError: any;
      setIsRetrying(true);

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await operation();
          
          if (attempt > 1) {
            toast.success(`${operationName} succeeded after ${attempt} attempts`);
          }
          
          onSuccess?.(result);
          return result;
        } catch (error) {
          lastError = error;
          
          if (attempt < maxAttempts) {
            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
            
            toast.error(
              `${operationName} failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay / 1000}s...`,
              { duration: delay }
            );
            
            onRetry?.(attempt, error);
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All attempts failed
      toast.error(`${operationName} failed after ${maxAttempts} attempts`);
      onFinalFailure?.(lastError);
      throw lastError;
    },
    []
  );

  // Retry with immediate feedback (no delay)
  const retryImmediate = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options: {
        maxAttempts?: number;
        operationName?: string;
        onRetry?: (attempt: number, error: any) => void;
        onSuccess?: (result: T) => void;
        onFinalFailure?: (error: any) => void;
      } = {}
    ): Promise<T> => {
      const {
        maxAttempts = 3,
        operationName = "Operation",
        onRetry,
        onSuccess,
        onFinalFailure,
      } = options;

      let lastError: any;
      setIsRetrying(true);

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await operation();
          
          if (attempt > 1) {
            toast.success(`${operationName} succeeded after ${attempt} attempts`);
          }
          
          onSuccess?.(result);
          return result;
        } catch (error) {
          lastError = error;
          
          if (attempt < maxAttempts) {
            toast.error(`${operationName} failed (attempt ${attempt}/${maxAttempts}). Retrying...`);
            onRetry?.(attempt, error);
          }
        }
      }

      // All attempts failed
      toast.error(`${operationName} failed after ${maxAttempts} attempts`);
      onFinalFailure?.(lastError);
      throw lastError;
    },
    []
  );

  // Retry with custom delay
  const retryWithDelay = useCallback(
    async <T>(
      operation: () => Promise<T>,
      delay: number,
      options: {
        maxAttempts?: number;
        operationName?: string;
        onRetry?: (attempt: number, error: any) => void;
        onSuccess?: (result: T) => void;
        onFinalFailure?: (error: any) => void;
      } = {}
    ): Promise<T> => {
      const {
        maxAttempts = 3,
        operationName = "Operation",
        onRetry,
        onSuccess,
        onFinalFailure,
      } = options;

      let lastError: any;
      setIsRetrying(true);

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await operation();
          
          if (attempt > 1) {
            toast.success(`${operationName} succeeded after ${attempt} attempts`);
          }
          
          onSuccess?.(result);
          return result;
        } catch (error) {
          lastError = error;
          
          if (attempt < maxAttempts) {
            toast.error(
              `${operationName} failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay / 1000}s...`,
              { duration: delay }
            );
            
            onRetry?.(attempt, error);
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All attempts failed
      toast.error(`${operationName} failed after ${maxAttempts} attempts`);
      onFinalFailure?.(lastError);
      throw lastError;
    },
    []
  );

  return {
    retry,
    retryImmediate,
    retryWithDelay,
    isRetrying,
  };
}
