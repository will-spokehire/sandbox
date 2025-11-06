"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Form } from "~/components/ui/form";
import { Loader2, Pencil } from "lucide-react";
import { VehicleBasicInfoFields } from "./fields/VehicleBasicInfoFields";
import { VehicleSpecificationFields } from "./fields/VehicleSpecificationFields";
import { VehiclePricingFields } from "./fields/VehiclePricingFields";
import { isMakeUnpublished, isModelUnpublished } from "./utils/form-helpers";
import type { VehicleDetail, FilterOptions, ModelsByMake } from "~/types/vehicle";
import type { VehicleFormData, RegistrationError } from "~/types/vehicle-form";
import type { UseFormReturn } from "react-hook-form";

interface BaseVehicleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleDetail;
  form: UseFormReturn<VehicleFormData>;
  onSubmit: (data: VehicleFormData) => void;
  isSubmitting: boolean;
  filterOptions?: FilterOptions;
  models?: ModelsByMake[];
  isLoadingModels?: boolean;
  makeOptions: Array<{ value: string; label: string }>;
  modelOptions: Array<{ value: string; label: string }>;
  selectedMakeId: string;
  onMakeChange: (makeId: string) => void;
  registrationError: RegistrationError | null;
  isAdmin?: boolean;
  renderAdditionalActions?: () => React.ReactNode;
  renderAdditionalAlerts?: () => React.ReactNode;
  readOnlyName?: boolean;
}

export function BaseVehicleEditDialog({
  open,
  onOpenChange,
  vehicle,
  form,
  onSubmit,
  isSubmitting,
  filterOptions,
  models,
  isLoadingModels,
  makeOptions,
  modelOptions,
  selectedMakeId,
  onMakeChange,
  registrationError,
  isAdmin = false,
  renderAdditionalActions,
  renderAdditionalAlerts,
  readOnlyName = false,
}: BaseVehicleEditDialogProps) {
  const makeIsUnpublished = isMakeUnpublished(vehicle);
  const modelIsUnpublished = isModelUnpublished(vehicle);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update {isAdmin ? '' : 'your '}vehicle information. {isAdmin ? 'All fields are optional except name, make, model, and year.' : 'Required fields: name, make, model, year, and agreed value.'}
          </DialogDescription>
        </DialogHeader>

        {/* Additional Alerts (e.g., unpublished make/model warning) */}
        {renderAdditionalAlerts?.()}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <VehicleBasicInfoFields
              form={form}
              makeOptions={makeOptions}
              modelOptions={modelOptions}
              isLoadingModels={isLoadingModels}
              selectedMakeId={selectedMakeId}
              onMakeChange={onMakeChange}
              registrationError={registrationError}
              isAdmin={isAdmin}
              makeIsUnpublished={makeIsUnpublished}
              modelIsUnpublished={modelIsUnpublished}
              hideNameField={readOnlyName}
            />

            <Separator />

            {/* Specifications */}
            <VehicleSpecificationFields
              form={form}
              filterOptions={filterOptions}
            />

            <Separator />

            {/* Pricing & Description */}
            <VehiclePricingFields form={form} isEditMode={true} />

            {/* Additional Actions (e.g., status field, approve button) */}
            {renderAdditionalActions?.()}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

