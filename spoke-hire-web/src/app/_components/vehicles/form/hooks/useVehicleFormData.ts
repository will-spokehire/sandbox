"use client";

import { useMemo, useState } from "react";
import * as React from "react";
import type { VehicleDetail, FilterOptions, ModelsByMake } from "~/types/vehicle";
import type { ComboboxOption } from "~/components/ui/combobox";
import type { UseFormReturn } from "react-hook-form";
import type { VehicleFormData } from "~/types/vehicle-form";

interface UseVehicleFormDataOptions {
  vehicle: VehicleDetail;
  filterOptions?: FilterOptions;
  models?: ModelsByMake[];
  isLoadingModels?: boolean;
  form: UseFormReturn<VehicleFormData>;
}

/**
 * Hook to manage vehicle form data including make/model options
 */
export function useVehicleFormData({
  vehicle,
  filterOptions,
  models,
  isLoadingModels = false,
  form,
}: UseVehicleFormDataOptions) {
  const [selectedMakeId, setSelectedMakeId] = useState<string>(vehicle.makeId);

  // Convert makes to combobox options
  const makeOptions: ComboboxOption[] = useMemo(() => {
    const options = filterOptions?.makes.map((make) => ({
      value: make.id,
      label: make.name,
    })) ?? [];
    
    // Add the vehicle's current make if it's not in the list (unpublished)
    const currentMakeInList = options.some(opt => opt.value === vehicle.makeId);
    if (!currentMakeInList && vehicle.make) {
      options.unshift({
        value: vehicle.makeId,
        label: vehicle.make.name,
      });
    }
    
    return options;
  }, [filterOptions?.makes, vehicle.makeId, vehicle.make]);

  // Convert models to combobox options
  const modelOptions: ComboboxOption[] = useMemo(() => {
    const options = models?.map((model) => ({
      value: model.id,
      label: model.name,
    })) ?? [];
    
    // Add the vehicle's current model if it's not in the list (unpublished)
    // and if it belongs to the current make
    if (vehicle.makeId === selectedMakeId && vehicle.model) {
      const currentModelInList = options.some(opt => opt.value === vehicle.modelId);
      if (!currentModelInList) {
        options.unshift({
          value: vehicle.modelId,
          label: vehicle.model.name,
        });
      }
    }
    
    return options;
  }, [models, vehicle.modelId, vehicle.model, vehicle.makeId, selectedMakeId]);

  // Handle make change
  const handleMakeChange = (makeId: string) => {
    setSelectedMakeId(makeId);
    form.setValue("makeId", makeId);
    // Reset model when make changes
    form.setValue("modelId", "");
  };

  return {
    filterOptions,
    models,
    isLoadingModels,
    makeOptions,
    modelOptions,
    selectedMakeId,
    setSelectedMakeId,
    handleMakeChange,
  };
}

