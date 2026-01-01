"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
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
import { PhoneInput } from "~/components/ui/phone-input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Combobox } from "~/components/ui/combobox";
import { api } from "~/trpc/react";
import { profileSchema, type ProfileFormData } from "~/app/user/vehicles/new/_components/validation";
import { UK_CITIES, UK_COUNTIES } from "~/lib/constants/uk-locations";

interface ProfileFormProps {
  defaultValues?: Partial<ProfileFormData>;
  onSubmit: (data: ProfileFormData & { latitude?: number; longitude?: number }) => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
  // Optional: expose submit function to parent
  onSubmitRefReady?: (submitFn: () => void) => void;
}

/**
 * Reusable Profile Form Component
 * 
 * Used in:
 * - User profile edit page
 * - Vehicle wizard profile step
 * 
 * Features:
 * - Form validation with Zod
 * - Postcode lookup with auto-fill
 * - Geo location capture
 * - Flexible submission handling
 */
export function ProfileForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitButtonText = "Save",
  showCancelButton = false,
  onCancel,
  onSubmitRefReady,
}: ProfileFormProps) {
  const utils = api.useUtils();
  
  // Postcode lookup state
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [geoData, setGeoData] = useState<{ latitude: number; longitude: number } | null>(null);
  const lastLookedUpPostcode = useRef<string>(defaultValues?.postcode ?? "");
  const isUserTyping = useRef(false);

  // Fetch countries for dropdown
  const { data: filterOptions, isLoading: isLoadingCountries } =
    api.userVehicle.getFilterOptions.useQuery();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      phone: defaultValues?.phone ?? "",
      street: defaultValues?.street ?? "",
      city: defaultValues?.city ?? "",
      county: defaultValues?.county ?? "",
      postcode: defaultValues?.postcode ?? "",
      countryId: defaultValues?.countryId ?? "",
    },
  });

  // Reset form when defaultValues change (but not during submission to avoid flickering)
  useEffect(() => {
    if (defaultValues && !isSubmitting) {
      form.reset({
        firstName: defaultValues.firstName ?? "",
        lastName: defaultValues.lastName ?? "",
        phone: defaultValues.phone ?? "",
        street: defaultValues.street ?? "",
        city: defaultValues.city ?? "",
        county: defaultValues.county ?? "",
        postcode: defaultValues.postcode ?? "",
        countryId: defaultValues.countryId ?? "",
      });
      // Update last looked up postcode to prevent auto-lookup on initial load
      if (defaultValues.postcode) {
        lastLookedUpPostcode.current = defaultValues.postcode.replace(/\s+/g, "").toUpperCase();
      }
    }
  }, [defaultValues, form, isSubmitting]);

  // Watch postcode field for auto-lookup
  const postcodeValue = form.watch("postcode");

  // Postcode lookup handler
  const handlePostcodeLookup = useCallback(async (silent = false) => {
    const normalized = postcodeValue?.replace(/\s+/g, "").toUpperCase() ?? "";
    
    if (!normalized) {
      if (!silent) toast.error("Please enter a postcode");
      return;
    }

    if (normalized.length < 5) {
      if (!silent) {
        toast.error("Invalid postcode format", {
          description: "Please enter a valid UK postcode (e.g., SW1A 1AA)",
        });
      }
      return;
    }

    setIsLookingUp(true);

    try {
      const result = await utils.client.userVehicle.lookupPostcode.query({ 
        postcode: normalized 
      });

      if (result.success && result.data) {
        // Auto-fill address fields
        form.setValue("postcode", result.data.postcode);
        form.setValue("city", result.data.city);
        form.setValue("county", result.data.county ?? "");
        
        // Set country if found
        if (result.data.countryId) {
          form.setValue("countryId", result.data.countryId);
        }
        
        // Store geo data in state for later submission
        setGeoData({
          latitude: result.data.latitude,
          longitude: result.data.longitude,
        });
        
        if (!silent) {
          toast.success("Postcode found!", {
            description: `${result.data.city}${result.data.county ? `, ${result.data.county}` : ""}`,
          });
        }
      } else {
        if (!silent) {
          toast.error("Postcode not found", {
            description: result.error ?? "Please check the postcode and try again",
          });
        }
      }
    } catch {
      if (!silent) {
        toast.error("Failed to lookup postcode", {
          description: "Please check your internet connection and try again",
        });
      }
    } finally {
      setIsLookingUp(false);
    }
  }, [postcodeValue, form, utils.client.userVehicle.lookupPostcode]);

  // Auto-lookup when user types a valid postcode
  useEffect(() => {
    // Only auto-lookup if user is actively typing
    if (!isUserTyping.current || isLookingUp) {
      return;
    }

    const normalized = postcodeValue?.replace(/\s+/g, "").toUpperCase() ?? "";
    
    // Only auto-lookup if valid and different from last lookup
    if (
      normalized &&
      normalized.length >= 5 &&
      normalized !== lastLookedUpPostcode.current &&
      /^[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2}$/i.test(normalized)
    ) {
      const timer = setTimeout(() => {
        // Mark as looked up BEFORE calling API to prevent duplicate calls
        lastLookedUpPostcode.current = normalized;
        void handlePostcodeLookup(true);
      }, 800);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcodeValue, isLookingUp]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handlePostcodeLookup();
    }
  };

  // Submit handler
  const handleSubmit = useCallback((data: ProfileFormData) => {
    // Include geo data if available from postcode lookup
    const submitData = geoData ? { ...data, ...geoData } : data;
    onSubmit(submitData);
  }, [onSubmit, geoData]);

  // Expose submit function to parent if callback provided
  useEffect(() => {
    if (onSubmitRefReady) {
      const submitFn = () => {
        void form.handleSubmit(handleSubmit)();
      };
      onSubmitRefReady(submitFn);
    }
  }, [form, handleSubmit, onSubmitRefReady]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <PhoneInput
                  placeholder="7123 456789"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                For UK numbers, enter without the leading 0 (e.g., 7123 456789). We&apos;ll use this to contact you about opportunities.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Address</h3>

          {/* Postcode */}
          <FormField
            control={form.control}
            name="postcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postcode *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="SW1A 1AA"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      field.onChange(value);
                      isUserTyping.current = true; // Mark that user is typing
                    }}
                    onKeyDown={handleKeyDown}
                    className="uppercase"
                    disabled={isLookingUp}
                  />
                </FormControl>
                <FormDescription>
                  Address will auto-fill as you type a valid postcode
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Street Address */}
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123 High Street"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City and County */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Combobox
                      options={UK_CITIES.map((city) => ({
                        value: city,
                        label: city,
                      }))}
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      placeholder="Select city..."
                      searchPlaceholder="Search cities..."
                      emptyText="No city found."
                      allowCustomValue={false}
                      disabled={isLookingUp}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="county"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>County *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={UK_COUNTIES.map((county) => ({
                        value: county,
                        label: county,
                      }))}
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      placeholder="Select county..."
                      searchPlaceholder="Search counties..."
                      emptyText="No county found."
                      allowCustomValue={false}
                      disabled={isLookingUp}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Country */}
          <FormField
            control={form.control}
            name="countryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingCountries ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      (filterOptions?.countries as Array<{ id: string; name: string }> | undefined)?.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Action Buttons - Only show if needed */}
        {(submitButtonText || showCancelButton) && (
          <div className="flex items-center justify-center gap-4 pt-6">
            {showCancelButton && onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full max-w-[230px]"
              >
                cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full max-w-[230px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {submitButtonText.toLowerCase()}
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

