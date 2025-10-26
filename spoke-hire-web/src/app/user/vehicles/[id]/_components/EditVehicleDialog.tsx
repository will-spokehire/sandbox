"use client";

import { useEffect } from "react";
import { z } from "zod";
import { api } from "~/trpc/react";
import type { VehicleDetail } from "~/types/vehicle";
import { BaseVehicleEditDialog } from "~/app/_components/vehicles/form/BaseVehicleEditDialog";
import { useVehicleForm } from "~/app/_components/vehicles/form/hooks/useVehicleForm";
import { useVehicleFormData } from "~/app/_components/vehicles/form/hooks/useVehicleFormData";
import { useVehicleMutations } from "~/app/_components/vehicles/form/hooks/useVehicleMutations";
import { transformFormData } from "~/app/_components/vehicles/form/utils/form-helpers";
import { generateVehicleName as generateStandardVehicleName } from "~/lib/vehicle-name-generator";
import type { VehicleFormData } from "~/types/vehicle-form";
import type { FilterOptions, ModelsByMake } from "~/types/vehicle";

// User status options (users can view IN_REVIEW but shouldn't manually set DECLINED)
const USER_VEHICLE_STATUSES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
type UserVehicleStatus = typeof USER_VEHICLE_STATUSES[number];

// Validation schema matching backend - users can view/edit IN_REVIEW vehicles
const editVehicleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  status: z.enum(USER_VEHICLE_STATUSES),
  price: z.number().min(1, "Agreed value is required and must be greater than 0"),
  year: z.string().min(4, "Year required"),
  registration: z.string().nullable().optional(),
  makeId: z.string().min(1, "Make is required"),
  modelId: z.string().min(1, "Model is required"),
  engineCapacity: z.number().min(0).nullable().optional(),
  numberOfSeats: z.number().min(1).max(20).nullable().optional(),
  steeringId: z.string().nullable().optional(),
  gearbox: z.string().nullable().optional(),
  exteriorColour: z.string().nullable().optional(),
  interiorColour: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  isRoadLegal: z.boolean(),
  description: z.string().nullable().optional(),
});

interface EditVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleDetail;
  onSuccess: () => void;
}

export function EditVehicleDialog({
  open,
  onOpenChange,
  vehicle,
  onSuccess,
}: EditVehicleDialogProps) {
  const utils = api.useUtils();

  // Get initial status (default to DRAFT if currently DECLINED)
  const getInitialStatus = (vehicle: VehicleDetail): string => {
    if (vehicle.status === 'DECLINED') {
      return 'DRAFT'; // Users can't set DECLINED, so default to DRAFT
    }
    return vehicle.status;
  };

  // Form state
  const form = useVehicleForm({
    vehicle,
    validationSchema: editVehicleSchema,
    open,
    mode: "onChange", // Validate on change to show errors immediately
    getInitialStatus,
  });

  // Data fetching
  const { data: filterOptions } = api.userVehicle.getFilterOptions.useQuery(undefined, {
    enabled: open,
    staleTime: 60 * 1000, // 1 minute - shorter because users can create new makes/models
  }) as { data: FilterOptions | undefined };

  const {
    makeOptions,
    modelOptions,
    selectedMakeId,
    setSelectedMakeId,
    handleMakeChange,
  } = useVehicleFormData({
    vehicle,
    filterOptions,
    models: undefined,
    form,
  });

  const { data: modelsData, isLoading: isModelsLoading } = api.userVehicle.getModelsByMake.useQuery(
    { makeId: selectedMakeId },
    { 
      enabled: open && !!selectedMakeId,
      staleTime: 60 * 1000, // 1 minute - shorter because users can create new models
    }
  ) as { data: ModelsByMake[] | undefined; isLoading: boolean };

  // Update form data hook with models
  const formDataWithModels = useVehicleFormData({
    vehicle,
    filterOptions,
    models: modelsData,
    isLoadingModels: isModelsLoading,
    form,
  });

  // Sync selectedMakeId when vehicle changes
  useEffect(() => {
    if (open) {
      setSelectedMakeId(vehicle.makeId);
    }
  }, [open, vehicle.makeId, setSelectedMakeId]);

  // Mutations
  const { registrationError, setRegistrationError } = useVehicleMutations({
    onSuccess,
    onOpenChange,
  });

  // Update mutation
  const updateMutation = api.userVehicle.updateMyVehicle.useMutation({
    onSuccess: () => {
      void utils.userVehicle.myVehicleById.invalidate({ id: vehicle.id });
      void utils.userVehicle.myVehicles.invalidate();
      void utils.userVehicle.myVehicleCounts.invalidate();
      
      // Invalidate filter options and models cache in case new make/model was created
      void utils.userVehicle.getFilterOptions.invalidate();
      void utils.userVehicle.getModelsByMake.invalidate();
      
      setRegistrationError(null);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      try {
        const errorData = JSON.parse(error.message) as { code?: string; vehicleId?: string; vehicleName?: string; isOwnVehicle?: boolean };
        if (errorData.code === "REGISTRATION_EXISTS") {
          setRegistrationError({
            vehicleId: errorData.vehicleId ?? "",
            vehicleName: errorData.vehicleName ?? "",
            isOwnVehicle: errorData.isOwnVehicle ?? false,
          });
          return;
        }
      } catch {
        // Not a JSON error, fall through to default handling
      }
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    const transformed = transformFormData(data, vehicle.id);
    updateMutation.mutate({
      ...transformed,
      status: transformed.status as UserVehicleStatus,
    });
  };

  // NOTE: Auto-generation disabled to prevent infinite render loop
  // TODO: Implement auto-generation using a different approach (e.g., onBlur handler)

  const isSubmitting = updateMutation.isPending;

  return (
    <BaseVehicleEditDialog
      open={open}
      onOpenChange={onOpenChange}
      vehicle={vehicle}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      filterOptions={filterOptions}
      models={modelsData}
      isLoadingModels={isModelsLoading}
      makeOptions={formDataWithModels.makeOptions}
      modelOptions={formDataWithModels.modelOptions}
      selectedMakeId={selectedMakeId}
      onMakeChange={handleMakeChange}
      registrationError={registrationError}
      isAdmin={false}
      readOnlyName={true}
    />
  );
}
