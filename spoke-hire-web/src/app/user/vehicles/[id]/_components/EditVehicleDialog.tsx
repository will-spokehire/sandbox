"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";
import type { VehicleDetail, FilterOptions, ModelsByMake } from "~/types/vehicle";
import { VEHICLE_COLORS, GEARBOX_TYPES } from "~/lib/constants/vehicle";
import { Combobox, type ComboboxOption } from "~/components/ui/combobox";

// User status options (excluding DECLINED)
const USER_VEHICLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
type UserVehicleStatus = typeof USER_VEHICLE_STATUSES[number];

// Validation schema matching backend - users can't set DECLINED status
const editVehicleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  status: z.enum(USER_VEHICLE_STATUSES),
  price: z.number().min(0, "Price must be positive").nullable().optional(),
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

type EditVehicleFormData = z.infer<typeof editVehicleSchema>;

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
  const [selectedMakeId, setSelectedMakeId] = useState<string>(vehicle.makeId);
  const utils = api.useUtils();

  // Get initial status (default to DRAFT if currently DECLINED)
  const getInitialStatus = (): UserVehicleStatus => {
    if (vehicle.status === 'DECLINED') {
      return 'DRAFT'; // Users can't set DECLINED, so default to DRAFT
    }
    return vehicle.status as UserVehicleStatus;
  };

  const form = useForm<EditVehicleFormData>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: {
      name: vehicle.name,
      status: getInitialStatus(),
      price: vehicle.price ? Number(vehicle.price) : null,
      year: vehicle.year,
      registration: vehicle.registration ?? "",
      makeId: vehicle.makeId,
      modelId: vehicle.modelId,
      engineCapacity: vehicle.engineCapacity ?? null,
      numberOfSeats: vehicle.numberOfSeats ?? null,
      steeringId: vehicle.steeringId ?? "",
      gearbox: vehicle.gearbox ?? "",
      exteriorColour: vehicle.exteriorColour ?? "",
      interiorColour: vehicle.interiorColour ?? "",
      condition: vehicle.condition ?? "",
      isRoadLegal: vehicle.isRoadLegal,
      description: vehicle.description ?? "",
    },
  });

  // Reset form when vehicle changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: vehicle.name,
        status: getInitialStatus(),
        price: vehicle.price ? Number(vehicle.price) : null,
        year: vehicle.year,
        registration: vehicle.registration ?? "",
        makeId: vehicle.makeId,
        modelId: vehicle.modelId,
        engineCapacity: vehicle.engineCapacity ?? null,
        numberOfSeats: vehicle.numberOfSeats ?? null,
        steeringId: vehicle.steeringId ?? "",
        gearbox: vehicle.gearbox ?? "",
        exteriorColour: vehicle.exteriorColour ?? "",
        interiorColour: vehicle.interiorColour ?? "",
        condition: vehicle.condition ?? "",
        isRoadLegal: vehicle.isRoadLegal,
        description: vehicle.description ?? "",
      });
      setSelectedMakeId(vehicle.makeId);
    }
  }, [open, vehicle, form]);

  // Fetch filter options for dropdowns
  const { data: filterOptions } = api.userVehicle.getFilterOptions.useQuery(undefined, {
    enabled: open,
    staleTime: 5 * 60 * 1000,
  }) as { data: FilterOptions | undefined };

  // Fetch models when make is selected
  const { data: models, isLoading: isLoadingModels } = api.userVehicle.getModelsByMake.useQuery(
    { makeId: selectedMakeId },
    { 
      enabled: open && !!selectedMakeId,
      staleTime: 5 * 60 * 1000,
    }
  ) as { data: ModelsByMake[] | undefined, isLoading: boolean };

  // Convert models to combobox options
  const modelOptions: ComboboxOption[] = React.useMemo(() => {
    return models?.map((model) => ({
      value: model.id,
      label: model.name,
    })) ?? [];
  }, [models]);

  // Convert makes to combobox options
  const makeOptions: ComboboxOption[] = React.useMemo(() => {
    return filterOptions?.makes.map((make) => ({
      value: make.id,
      label: make.name,
    })) ?? [];
  }, [filterOptions?.makes]);

  // Update mutation
  const updateMutation = api.userVehicle.updateMyVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      void utils.userVehicle.myVehicleById.invalidate({ id: vehicle.id });
      void utils.userVehicle.myVehicles.invalidate();
      void utils.userVehicle.myVehicleCounts.invalidate();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to update vehicle", {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: EditVehicleFormData) => {
    updateMutation.mutate({
      id: vehicle.id,
      ...data,
      // Convert empty strings to null
      registration: data.registration || null,
      steeringId: data.steeringId || null,
      gearbox: data.gearbox || null,
      exteriorColour: data.exteriorColour || null,
      interiorColour: data.interiorColour || null,
      condition: data.condition || null,
      description: data.description || null,
    });
  };

  // Handle make change
  const handleMakeChange = (makeId: string) => {
    setSelectedMakeId(makeId);
    form.setValue("makeId", makeId);
    // Reset model when make changes
    form.setValue("modelId", "");
  };

  const isSubmitting = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update your vehicle information. All fields are optional except name, make, model, and year.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g., 2015 BMW 3 Series"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Combobox
                    options={makeOptions}
                    value={selectedMakeId}
                    onValueChange={handleMakeChange}
                    placeholder="Select or type make"
                    searchPlaceholder="Search makes..."
                    emptyText="No make found."
                    allowCustomValue={true}
                  />
                  {form.formState.errors.makeId && (
                    <p className="text-sm text-red-500">{form.formState.errors.makeId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Combobox
                    options={modelOptions}
                    value={form.watch("modelId")}
                    onValueChange={(value) => form.setValue("modelId", value)}
                    placeholder="Select or type model"
                    searchPlaceholder="Search models..."
                    emptyText="No model found."
                    disabled={!selectedMakeId || isLoadingModels}
                    allowCustomValue={true}
                  />
                  {form.formState.errors.modelId && (
                    <p className="text-sm text-red-500">{form.formState.errors.modelId.message}</p>
                  )}
                  {!selectedMakeId && (
                    <p className="text-xs text-muted-foreground">Select a make first</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    {...form.register("year")}
                    placeholder="2015"
                  />
                  {form.formState.errors.year && (
                    <p className="text-sm text-red-500">{form.formState.errors.year.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration">Registration</Label>
                  <Input
                    id="registration"
                    {...form.register("registration")}
                    placeholder="AB12 CDE"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Specifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Specifications</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="engineCapacity">Engine Capacity (CC)</Label>
                <Input
                  id="engineCapacity"
                  type="number"
                  {...form.register("engineCapacity", { valueAsNumber: true })}
                  placeholder="2000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfSeats">Number of Seats</Label>
                <Input
                  id="numberOfSeats"
                  type="number"
                  {...form.register("numberOfSeats", { valueAsNumber: true })}
                  placeholder="5"
                />
                {form.formState.errors.numberOfSeats && (
                  <p className="text-sm text-red-500">{form.formState.errors.numberOfSeats.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="steering">Steering</Label>
                <Select
                  value={form.watch("steeringId") ?? undefined}
                  onValueChange={(value) => form.setValue("steeringId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select steering (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.steeringTypes.map((steering) => (
                      <SelectItem key={steering.id} value={steering.id}>
                        {steering.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gearbox">Gearbox</Label>
                <Select
                  value={form.watch("gearbox") ?? undefined}
                  onValueChange={(value) => form.setValue("gearbox", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gearbox (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {GEARBOX_TYPES.map((gearbox) => (
                      <SelectItem key={gearbox} value={gearbox}>
                        {gearbox}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exteriorColour">Exterior Color</Label>
                <Select
                  value={form.watch("exteriorColour") ?? undefined}
                  onValueChange={(value) => form.setValue("exteriorColour", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interiorColour">Interior Color</Label>
                <Select
                  value={form.watch("interiorColour") ?? undefined}
                  onValueChange={(value) => form.setValue("interiorColour", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRoadLegal"
                checked={form.watch("isRoadLegal")}
                onCheckedChange={(checked) => form.setValue("isRoadLegal", !!checked)}
              />
              <Label htmlFor="isRoadLegal" className="cursor-pointer">
                Road Legal
              </Label>
            </div>
          </div>

          <Separator />

          {/* Pricing & Description */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Pricing & Description</h3>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (£)</Label>
              <Input
                id="price"
                type="number"
                {...form.register("price", { 
                  valueAsNumber: true,
                  setValueAs: (v) => v === "" ? null : Number(v)
                })}
                placeholder="25000"
              />
              {form.formState.errors.price && (
                <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Add vehicle description..."
                rows={4}
              />
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Status</h3>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as UserVehicleStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: Admin reviews are required before vehicles can be published.
              </p>
            </div>
          </div>

          {/* Actions */}
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
      </DialogContent>
    </Dialog>
  );
}

