"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { api } from "~/trpc/react";
import type { VehicleDetail, FilterOptions, ModelsByMake } from "~/types/vehicle";
import { VEHICLE_COLORS, GEARBOX_TYPES } from "~/lib/constants/vehicle";
import { Combobox, type ComboboxOption } from "~/components/ui/combobox";
import { generateVehicleName as generateStandardVehicleName } from "~/lib/vehicle-name-generator";

// User status options (users can view IN_REVIEW but shouldn't manually set DECLINED)
const USER_VEHICLE_STATUSES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
type UserVehicleStatus = typeof USER_VEHICLE_STATUSES[number];

// Validation schema matching backend - users can view/edit IN_REVIEW vehicles
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
  const router = useRouter();
  const [selectedMakeId, setSelectedMakeId] = useState<string>(vehicle.makeId);
  const [registrationError, setRegistrationError] = useState<{
    vehicleId: string;
    vehicleName: string;
    isOwnVehicle: boolean;
  } | null>(null);
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
    mode: "onChange", // Validate on change to show errors immediately
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
      setRegistrationError(null); // Clear any previous errors
    }
  }, [open, vehicle, form]);

  // Fetch filter options for dropdowns
  const { data: filterOptions } = api.userVehicle.getFilterOptions.useQuery(undefined, {
    enabled: open,
    staleTime: 60 * 1000, // 1 minute - shorter because users can create new makes/models
  }) as { data: FilterOptions | undefined };

  // Fetch models when make is selected
  const { data: models, isLoading: isLoadingModels } = api.userVehicle.getModelsByMake.useQuery(
    { makeId: selectedMakeId },
    { 
      enabled: open && !!selectedMakeId,
      staleTime: 60 * 1000, // 1 minute - shorter because users can create new models
    }
  ) as { data: ModelsByMake[] | undefined, isLoading: boolean };

  // Convert models to combobox options
  const modelOptions: ComboboxOption[] = React.useMemo(() => {
    const options = models?.map((model) => ({
      value: model.id,
      label: model.name,
    })) ?? [];
    
    // Always include the current vehicle's model if not already in the list
    // This ensures it displays correctly while models are loading
    if (vehicle.model && !options.some(opt => opt.value === vehicle.modelId)) {
      options.unshift({
        value: vehicle.modelId,
        label: vehicle.model.name,
      });
    }
    
    return options;
  }, [models, vehicle.model, vehicle.modelId]);

  // Convert makes to combobox options
  const makeOptions: ComboboxOption[] = React.useMemo(() => {
    const options = filterOptions?.makes.map((make) => ({
      value: make.id,
      label: make.name,
    })) ?? [];
    
    // Always include the current vehicle's make if not already in the list
    // This ensures it displays correctly while filter options are loading
    if (vehicle.make && !options.some(opt => opt.value === vehicle.makeId)) {
      options.unshift({
        value: vehicle.makeId,
        label: vehicle.make.name,
      });
    }
    
    return options;
  }, [filterOptions?.makes, vehicle.make, vehicle.makeId]);

  // Update mutation
  const updateMutation = api.userVehicle.updateMyVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
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
      // Try to parse registration error
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.code === "REGISTRATION_EXISTS") {
          setRegistrationError({
            vehicleId: errorData.vehicleId,
            vehicleName: errorData.vehicleName,
            isOwnVehicle: errorData.isOwnVehicle,
          });
          return;
        }
      } catch {
        // Not a JSON error, fall through to default handling
      }

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

  // Helper function to generate vehicle name from make, model, and year
  const generateVehicleName = (makeId: string, modelId: string, year: string): string => {
    // Get make name
    const make = filterOptions?.makes.find(m => m.id === makeId);
    const makeName = make?.name || '';
    
    // Get model name
    const model = models?.find(m => m.id === modelId);
    const modelName = model?.name || '';
    
    if (!makeName || !modelName || !year) {
      return form.getValues('name'); // Return current if can't generate
    }
    
    return generateStandardVehicleName(year, makeName, modelName);
  };

  // Watch for changes to make, model, or year and update name
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      // Only regenerate if make, model, or year changed
      if (fieldName === 'makeId' || fieldName === 'modelId' || fieldName === 'year') {
        const makeId = value.makeId;
        const modelId = value.modelId;
        const year = value.year;
        
        if (makeId && modelId && year) {
          const newName = generateVehicleName(makeId, modelId, year);
          // Use setValue with shouldValidate and shouldDirty to ensure it's tracked
          form.setValue('name', newName, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, filterOptions, models]);

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
                <Label>Vehicle Name</Label>
                <div className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm min-h-[40px] flex items-center">
                  {form.watch("name") || "Auto-generated from make, model, and year"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Name is automatically generated based on year, make, and model
                </p>
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

              {/* Registration Error Alert */}
              {registrationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Registration Number Already Exists</AlertTitle>
                  <AlertDescription>
                    {registrationError.isOwnVehicle ? (
                      <div className="space-y-3">
                        <p>
                          You already have a vehicle with this registration: <strong>{registrationError.vehicleName}</strong>
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/user/vehicles/${registrationError.vehicleId}`)}
                        >
                          View Your Vehicle
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p>
                          This registration number is already associated with another vehicle in our system.
                        </p>
                        <p>
                          If you believe this is an error, please contact our support team at{" "}
                          <a 
                            href="mailto:hello@spokehire.com" 
                            className="underline font-medium hover:text-destructive-foreground"
                          >
                            hello@spokehire.com
                          </a>
                        </p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
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
              <Label htmlFor="price">Agreed Value (£)</Label>
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

