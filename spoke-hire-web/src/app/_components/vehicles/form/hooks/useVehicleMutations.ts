"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { RegistrationError } from "~/types/vehicle-form";
import { parseRegistrationError } from "../utils/form-helpers";

interface UseVehicleMutationsOptions {
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}

interface MutationHookResult<T> {
  mutate: (data: T) => void;
  isPending: boolean;
}

/**
 * Hook to manage vehicle mutations with registration error handling
 */
export function useVehicleMutations({
  onSuccess,
  onOpenChange,
}: UseVehicleMutationsOptions) {
  const [registrationError, setRegistrationError] = useState<RegistrationError | null>(null);

  /**
   * Create a mutation wrapper with registration error handling
   */
  const createMutationHandler = <T,>(
    mutation: MutationHookResult<T>,
    successMessage: string = "Vehicle updated successfully"
  ) => {
    return {
      ...mutation,
      mutate: (data: T) => {
        setRegistrationError(null); // Clear previous errors
        mutation.mutate(data);
      },
      onError: (error: Error) => {
        // Try to parse registration error
        const regError = parseRegistrationError(error.message);
        if (regError) {
          setRegistrationError(regError);
          return;
        }

        // Default error handling
        toast.error("Failed to update vehicle", {
          description: error.message,
        });
      },
      onSuccess: () => {
        toast.success(successMessage);
        setRegistrationError(null);
        onSuccess();
        onOpenChange(false);
      },
    };
  };

  return {
    registrationError,
    setRegistrationError,
    createMutationHandler,
  };
}

