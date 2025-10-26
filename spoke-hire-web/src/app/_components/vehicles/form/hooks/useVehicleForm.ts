"use client";

import { useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import type { VehicleDetail } from "~/types/vehicle";
import type { VehicleFormData } from "~/types/vehicle-form";
import { getFormDefaults } from "../utils/form-helpers";

interface UseVehicleFormOptions {
  vehicle: VehicleDetail;
  validationSchema: z.AnyZodObject;
  open: boolean;
  mode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
  getInitialStatus?: (vehicle: VehicleDetail) => string;
}

/**
 * Hook to manage vehicle form state and validation
 */
export function useVehicleForm({
  vehicle,
  validationSchema,
  open,
  mode = "onSubmit",
  getInitialStatus,
}: UseVehicleFormOptions): UseFormReturn<VehicleFormData> {
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(validationSchema) as any,
    mode,
    defaultValues: getFormDefaults(vehicle),
  });

  // Reset form when vehicle changes or dialog opens
  useEffect(() => {
    if (open) {
      const defaults = getFormDefaults(vehicle);
      
      // Override status if custom getter is provided
      if (getInitialStatus) {
        defaults.status = getInitialStatus(vehicle);
      }
      
      form.reset(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle.id]); // Only depend on open and vehicle.id, not the entire form or getInitialStatus

  return form;
}

