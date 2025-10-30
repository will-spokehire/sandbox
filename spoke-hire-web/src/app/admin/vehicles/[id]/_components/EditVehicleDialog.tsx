"use client";

import { useEffect } from "react";
import { z } from "zod";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { api } from "~/trpc/react";
import type { VehicleDetail, FilterOptions, ModelsByMake } from "~/types/vehicle";
import { VehicleStatus } from "@prisma/client";
import { BaseVehicleEditDialog } from "~/app/_components/vehicles/form/BaseVehicleEditDialog";
import { useVehicleForm } from "~/app/_components/vehicles/form/hooks/useVehicleForm";
import { useVehicleFormData } from "~/app/_components/vehicles/form/hooks/useVehicleFormData";
import { useVehicleMutations } from "~/app/_components/vehicles/form/hooks/useVehicleMutations";
import { transformFormData, isMakeUnpublished, isModelUnpublished } from "~/app/_components/vehicles/form/utils/form-helpers";
import type { VehicleFormData } from "~/types/vehicle-form";

// Validation schema matching backend
const editVehicleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  status: z.nativeEnum(VehicleStatus),
  price: z.number().min(1, "Agreed value is required and must be greater than 0"),
  hourlyRate: z.number().min(0, "Hourly rate must be a positive number").nullable().optional(),
  dailyRate: z.number().min(0, "Daily rate must be a positive number").nullable().optional(),
  year: z.string()
    .min(1, "Year is required")
    .refine(
      (val) => /^\d{4}$/.test(val),
      "Year must be exactly 4 digits"
    )
    .refine(
      (val) => {
        const year = parseInt(val, 10);
        const currentYear = new Date().getFullYear();
        return year >= 1900 && year <= currentYear;
      },
      (val) => ({
        message: `Year must be between 1900 and ${new Date().getFullYear()}`,
      })
    ),
  registration: z.string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || /^[A-Z0-9]+$/.test(val),
      "Registration must contain only uppercase letters and numbers"
    ),
  makeId: z.string().min(1, "Make is required"),
  modelId: z.string().min(1, "Model is required"),
  engineCapacity: z.number().min(0).nullable().optional(),
  numberOfSeats: z.number().min(1).max(10).nullable().optional(),
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
  const router = useRouter();
  const utils = api.useUtils();

  // Form state
  const form = useVehicleForm({
    vehicle,
    validationSchema: editVehicleSchema,
    open,
  });

  // Data fetching
  const { data: filterOptions } = api.vehicle.getFilterOptions.useQuery(undefined, {
    enabled: open,
    staleTime: 5 * 60 * 1000,
  }) as { data: FilterOptions | undefined };

  const {
    makeOptions,
    modelOptions,
    selectedMakeId,
    setSelectedMakeId,
    handleMakeChange,
    models,
    isLoadingModels,
  } = useVehicleFormData({
    vehicle,
    filterOptions,
    models: undefined,
    form,
  });

  const { data: modelsData, isLoading: isModelsLoading } = api.vehicle.getModelsByMake.useQuery(
    { makeId: selectedMakeId },
    { 
      enabled: open && !!selectedMakeId,
      staleTime: 5 * 60 * 1000,
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
  const updateMutation = api.vehicle.update.useMutation({
    onSuccess: () => {
      void utils.vehicle.getById.invalidate({ id: vehicle.id });
      void utils.vehicle.list.invalidate();
      setRegistrationError(null);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      const regError = JSON.parse(error.message) as { code?: string; vehicleId?: string; vehicleName?: string; isOwnVehicle?: boolean };
      if (regError.code === "REGISTRATION_EXISTS") {
          setRegistrationError({
          vehicleId: regError.vehicleId ?? "",
          vehicleName: regError.vehicleName ?? "",
          isOwnVehicle: regError.isOwnVehicle ?? false,
        });
      }
    },
  });

  // Approve vehicle with make/model mutation
  const approveWithMakeModelMutation = api.vehicle.approveVehicleWithMakeModel.useMutation({
    onSuccess: (result) => {
      const messages: string[] = [];
      if (result.makeWasReused) {
        messages.push("Make matched with existing published make");
      }
      if (result.modelWasReused) {
        messages.push("Model matched with existing published model");
      }
      
      void utils.vehicle.getById.invalidate({ id: vehicle.id });
      void utils.vehicle.list.invalidate();
      void utils.vehicle.getFilterOptions.invalidate();
      setRegistrationError(null);
      onSuccess();
      onOpenChange(false);
      router.refresh();
    },
    onError: () => {
      // Error handling done by toast in mutation
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    const transformed = transformFormData(data, vehicle.id);
    updateMutation.mutate({
      ...transformed,
      status: transformed.status as VehicleStatus,
    });
  };

  const handleApproveAndPublish = () => {
    const formData = form.getValues();
    approveWithMakeModelMutation.mutate({
      vehicleId: vehicle.id,
      makeId: formData.makeId,
      makeName: formDataWithModels.makeOptions.find(m => m.value === formData.makeId)?.label ?? formData.makeId,
      modelId: formData.modelId,
      modelName: formDataWithModels.modelOptions.find(m => m.value === formData.modelId)?.label ?? formData.modelId,
    });
  };

  const makeIsUnpublished = isMakeUnpublished(vehicle);
  const modelIsUnpublished = isModelUnpublished(vehicle);
  const hasUnpublishedMakeModel = makeIsUnpublished || modelIsUnpublished;
  const isInReview = vehicle.status === "IN_REVIEW";
  const isSubmitting = updateMutation.isPending || approveWithMakeModelMutation.isPending;

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
      isAdmin={true}
      renderAdditionalAlerts={() => (
        <>
        {hasUnpublishedMakeModel && isInReview && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-300">
                User-Created {makeIsUnpublished && modelIsUnpublished ? "Make & Model" : makeIsUnpublished ? "Make" : "Model"}
              </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              <p className="text-sm">
                Edit the name below if needed, then click &quot;Approve & Publish&quot; to publish together.
              </p>
            </AlertDescription>
          </Alert>
        )}
        </>
      )}
      renderAdditionalActions={() => (
        <>
          <Separator />

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Status</h3>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
              <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as VehicleStatus)}
              >
                    <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                    </FormControl>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                  <SelectItem value="ARCHIVED">Deactivated</SelectItem>
                </SelectContent>
              </Select>
                </FormItem>
              )}
            />
          </div>

          {/* Custom Action Buttons */}
          {hasUnpublishedMakeModel && isInReview && (
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  variant="outline"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                  "Save Only"
                  )}
                </Button>
                <Button 
                  type="button" 
                  onClick={handleApproveAndPublish}
                  disabled={isSubmitting}
                >
                  {approveWithMakeModelMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve & Publish
                    </>
                  )}
                </Button>
            </div>
          )}
                  </>
                )}
    />
  );
}
