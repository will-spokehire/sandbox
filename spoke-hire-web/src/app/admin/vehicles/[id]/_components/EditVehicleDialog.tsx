"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
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
import { Badge } from "~/components/ui/badge";
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
import { VehicleStatus } from "@prisma/client";
import { VEHICLE_COLORS, GEARBOX_TYPES } from "~/lib/constants/vehicle";
import { Combobox, type ComboboxOption } from "~/components/ui/combobox";

// Validation schema matching backend
const editVehicleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  status: z.nativeEnum(VehicleStatus),
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

  const form = useForm<EditVehicleFormData>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: {
      name: vehicle.name,
      status: vehicle.status,
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
        status: vehicle.status,
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
  const { data: filterOptions } = api.vehicle.getFilterOptions.useQuery(undefined, {
    enabled: open,
    staleTime: 5 * 60 * 1000,
  }) as { data: FilterOptions | undefined };

  // Fetch models when make is selected
  const { data: models, isLoading: isLoadingModels } = api.vehicle.getModelsByMake.useQuery(
    { makeId: selectedMakeId },
    { 
      enabled: open && !!selectedMakeId,
      staleTime: 5 * 60 * 1000,
    }
  ) as { data: ModelsByMake[] | undefined, isLoading: boolean };

  // Convert makes to combobox options
  const makeOptions: ComboboxOption[] = React.useMemo(() => {
    const options = filterOptions?.makes.map((make) => ({
      value: make.id,
      label: make.name,
    })) ?? [];
    
    // Add the vehicle's current make if it's not in the list (unpublished)
    const currentMakeInList = options.some(opt => opt.value === vehicle.makeId);
    if (!currentMakeInList) {
      options.unshift({
        value: vehicle.makeId,
        label: vehicle.make.name,
      });
    }
    
    return options;
  }, [filterOptions?.makes, vehicle.makeId, vehicle.make.name]);

  // Convert models to combobox options
  const modelOptions: ComboboxOption[] = React.useMemo(() => {
    const options = models?.map((model) => ({
      value: model.id,
      label: model.name,
    })) ?? [];
    
    // Add the vehicle's current model if it's not in the list (unpublished)
    // and if it belongs to the current make
    if (vehicle.makeId === selectedMakeId) {
      const currentModelInList = options.some(opt => opt.value === vehicle.modelId);
      if (!currentModelInList) {
        options.unshift({
          value: vehicle.modelId,
          label: vehicle.model.name,
        });
      }
    }
    
    return options;
  }, [models, vehicle.modelId, vehicle.model.name, vehicle.makeId, selectedMakeId]);

  // Update mutation
  const updateMutation = api.vehicle.update.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      void utils.vehicle.getById.invalidate({ id: vehicle.id });
      void utils.vehicle.list.invalidate();
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
      
      toast.success("Vehicle approved and published", {
        description: messages.length > 0 
          ? messages.join(". ") + ". Owner has been notified."
          : "Vehicle has been published and owner notified",
      });
      void utils.vehicle.getById.invalidate({ id: vehicle.id });
      void utils.vehicle.list.invalidate();
      void utils.vehicle.getFilterOptions.invalidate(); // Invalidate filter options
      setRegistrationError(null);
      onSuccess();
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to approve vehicle", {
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

  const handleApproveAndPublish = () => {
    const formData = form.getValues();
    // Use the current form values for make/model
    approveWithMakeModelMutation.mutate({
      vehicleId: vehicle.id,
      makeId: formData.makeId,
      makeName: makeOptions.find(m => m.value === formData.makeId)?.label ?? formData.makeId,
      modelId: formData.modelId,
      modelName: modelOptions.find(m => m.value === formData.modelId)?.label ?? formData.modelId,
    });
  };

  // Handle make change
  const handleMakeChange = (makeId: string) => {
    setSelectedMakeId(makeId);
    form.setValue("makeId", makeId);
    // Reset model when make changes
    form.setValue("modelId", "");
  };

  // Check if make/model are unpublished
  const makeIsUnpublished = (vehicle.make as unknown as { isPublished?: boolean })?.isPublished === false;
  const modelIsUnpublished = (vehicle.model as unknown as { isPublished?: boolean })?.isPublished === false;
  const hasUnpublishedMakeModel = makeIsUnpublished || modelIsUnpublished;
  const isInReview = vehicle.status === "IN_REVIEW";

  const isSubmitting = updateMutation.isPending || approveWithMakeModelMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update vehicle information. All fields are optional except name, make, model, and year.
          </DialogDescription>
        </DialogHeader>

        {/* Unpublished Make/Model Warning */}
        {hasUnpublishedMakeModel && isInReview && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-300">User-Created {makeIsUnpublished && modelIsUnpublished ? "Make & Model" : makeIsUnpublished ? "Make" : "Model"}</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              <p className="text-sm">
                Edit the name below if needed, then click &quot;Approve & Publish&quot; to publish together.
              </p>
            </AlertDescription>
          </Alert>
        )}

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
                  <div className="flex items-center gap-2">
                    <Label htmlFor="make">Make *</Label>
                    {makeIsUnpublished && (
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600 dark:text-yellow-400">
                        Unpublished
                      </Badge>
                    )}
                  </div>
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
                  {makeIsUnpublished && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Type to edit
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="model">Model *</Label>
                    {modelIsUnpublished && (
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600 dark:text-yellow-400">
                        Unpublished
                      </Badge>
                    )}
                  </div>
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
                  {modelIsUnpublished && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Type to edit
                    </p>
                  )}
                  {!selectedMakeId && !modelIsUnpublished && (
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
                          onClick={() => router.push(`/admin/vehicles/${registrationError.vehicleId}`)}
                        >
                          View This Vehicle
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p>
                          This registration number is already associated with another vehicle owner.
                        </p>
                        <p>
                          If you believe this is an error, please contact the vehicle owner or support at{" "}
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

          <Separator />

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Status</h3>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as VehicleStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
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
            {hasUnpublishedMakeModel && isInReview ? (
              <>
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
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Save Only
                    </>
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
              </>
            ) : (
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
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

