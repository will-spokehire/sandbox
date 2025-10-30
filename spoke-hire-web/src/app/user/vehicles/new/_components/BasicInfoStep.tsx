"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Combobox, type ComboboxOption } from "~/components/ui/combobox";
import { api } from "~/trpc/react";
import { basicInfoSchema, type BasicInfoFormData, type BasicInfoSubmitData } from "./validation";
import type { FilterOptions, MakeItem, ModelItem } from "./types";

interface BasicInfoStepProps {
  onComplete: (data: BasicInfoSubmitData) => void;
  defaultValues?: Partial<BasicInfoSubmitData>;
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * Basic Info Step Component
 * 
 * Collects essential vehicle information:
 * - Make and Model (with cascading selection)
 * - Year, Name, Registration, Price
 */
export function BasicInfoStep({ onComplete, defaultValues, onValidationChange }: BasicInfoStepProps) {
  const router = useRouter();
  const [selectedMakeId, setSelectedMakeId] = useState<string | undefined>(
    defaultValues?.makeId
  );
  const [registrationError, setRegistrationError] = useState<{
    vehicleId: string;
    vehicleName: string;
    isOwnVehicle: boolean;
  } | null>(null);

  // Fetch filter options (makes, colors, etc.)
  const { data: filterOptions, isLoading: isLoadingFilters } =
    api.userVehicle.getFilterOptions.useQuery();

  // Fetch models for selected make
  const { data: models, isLoading: isLoadingModels} =
    api.userVehicle.getModelsByMake.useQuery(
      { makeId: selectedMakeId ?? "" },
      { enabled: !!selectedMakeId }
    );

  // Convert makes to combobox options
  const makeOptions: ComboboxOption[] = useMemo(() => {
    const makes = filterOptions?.makes as MakeItem[] | undefined;
    return makes?.map((make: MakeItem) => ({
      value: make.id,
      label: make.name,
    })) ?? [];
  }, [filterOptions?.makes]);

  // Convert models to combobox options
  const modelOptions: ComboboxOption[] = useMemo(() => {
    const modelList = models as ModelItem[] | undefined;
    return modelList?.map((model: ModelItem) => ({
      value: model.id,
      label: model.name,
    })) ?? [];
  }, [models]);

  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      makeId: defaultValues?.makeId ?? "",
      modelId: defaultValues?.modelId ?? "",
      year: defaultValues?.year ?? "",
      registration: defaultValues?.registration ?? "",
      price: defaultValues?.price ? String(defaultValues.price) : "",
    },
  });

  // Watch form validity and notify parent
  useEffect(() => {
    const subscription = form.watch(() => {
      const isValid = form.formState.isValid;
      onValidationChange?.(isValid);
    });
    return () => subscription.unsubscribe();
  }, [form, onValidationChange]);

  // Expose submit function to parent via ref (for Next button)
  useEffect(() => {
    (window as any).__currentStepSubmit = async () => {
      // Clear previous registration errors
      setRegistrationError(null);

      // First validate the form
      const isValid = await form.trigger();
      if (!isValid) return;

      const formData = form.getValues();

      // Check registration uniqueness
      try {
        const checkResult = await fetch(`/api/trpc/userVehicle.checkRegistration?input=${encodeURIComponent(JSON.stringify({ registration: formData.registration }))}`)
          .then(res => res.json());

        // Handle tRPC response format
        const result = checkResult.result?.data;
        
        if (result && !result.available && result.existingVehicle) {
          setRegistrationError({
            vehicleId: result.existingVehicle.id,
            vehicleName: result.existingVehicle.name,
            isOwnVehicle: result.existingVehicle.isOwnVehicle,
          });
          return; // Don't proceed
        }

        // Convert price string to number before submitting
        const submittedData: BasicInfoSubmitData = {
          ...formData,
          price: Number(formData.price),
        };
        onComplete(submittedData);
      } catch (error) {
        console.error("Registration check failed:", error);
        // Proceed anyway if check fails (backend will catch it)
        const submittedData: BasicInfoSubmitData = {
          ...formData,
          price: Number(formData.price),
        };
        onComplete(submittedData);
      }
    };
    return () => {
      delete (window as any).__currentStepSubmit;
    };
  }, [form, onComplete]);

  const watchMake = form.watch("makeId");
  const watchModel = form.watch("modelId");

  // Update selected make when it changes
  useEffect(() => {
    if (watchMake && watchMake !== selectedMakeId) {
      setSelectedMakeId(watchMake);
      // Reset model when make changes
      form.setValue("modelId", "");
    }
  }, [watchMake, selectedMakeId, form]);

  // Generate year options (current year down to 1900)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, i) =>
    (currentYear - i).toString()
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Basic Vehicle Information</h2>
        <p className="text-muted-foreground mt-1">
          Tell us about your vehicle
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Make */}
            <FormField
              control={form.control}
              name="makeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Make *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={makeOptions}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedMakeId(value);
                        // Reset model when make changes
                        form.setValue("modelId", "");
                      }}
                      placeholder="Select or type make"
                      searchPlaceholder="Search makes..."
                      emptyText="No make found."
                      allowCustomValue={true}
                      disabled={isLoadingFilters}
                    />
                  </FormControl>
                  <FormDescription className="min-h-[20px]">
                    {/* Reserved space for consistency */}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Model */}
            <FormField
              control={form.control}
              name="modelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={modelOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select or type model"
                      searchPlaceholder="Search models..."
                      emptyText="No model found."
                      disabled={!selectedMakeId || isLoadingModels}
                      allowCustomValue={true}
                    />
                  </FormControl>
                  <FormDescription className="min-h-[20px]">
                    {!selectedMakeId && "Select a make first"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Year */}
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px]">
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="min-h-[20px]">
                  {/* Reserved space for consistency */}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Registration */}
          <FormField
            control={form.control}
            name="registration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="E.g., AB12 CDE"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="min-h-[20px]">
                  Vehicle registration number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      onClick={() => router.push(`/user/vehicles/${registrationError.vehicleId}?from=registration`)}
                    >
                      View This Vehicle
                    </Button>
                  </div>
                ) : (
                  <p>
                    This registration is already in use. If this is your vehicle, please contact support.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agreed Value (£) *</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="25000"
                    {...field}
                    onChange={(e) => {
                      // Allow only numbers and decimal point
                      const value = e.target.value.replace(/[^0-9.]/g, "");
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription className="min-h-[20px]">
                  Estimated agreed value of your vehicle
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}

