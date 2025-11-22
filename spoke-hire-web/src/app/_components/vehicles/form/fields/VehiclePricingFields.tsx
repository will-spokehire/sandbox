"use client";

import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Info } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import type { FormFieldComponentProps } from "~/types/vehicle-form";
import { calculateDefaultPricing, formatPricingRate } from "~/lib/pricing";
import { useEffect, useMemo } from "react";

export function VehiclePricingFields({ form, isEditMode = false }: FormFieldComponentProps) {
  // Watch the price field to calculate defaults
  const watchPrice = form.watch("price");
  
  // Calculate default pricing based on agreed value
  const defaultPricing = useMemo(() => {
    if (watchPrice && watchPrice > 0) {
      return calculateDefaultPricing(watchPrice);
    }
    return null;
  }, [watchPrice]);

  // Update pricing fields when price changes (only if they're empty and NOT in edit mode)
  useEffect(() => {
    // Don't auto-populate defaults when editing existing vehicles
    if (isEditMode) {
      return;
    }
    
    if (defaultPricing) {
      const currentHourlyRate = form.getValues("hourlyRate");
      const currentDailyRate = form.getValues("dailyRate");
      
      // Only set defaults if fields are empty/null
      if (!currentHourlyRate) {
        form.setValue("hourlyRate", defaultPricing.hourlyRate);
      }
      if (!currentDailyRate) {
        form.setValue("dailyRate", defaultPricing.dailyRate);
      }
    }
  }, [defaultPricing, form, isEditMode]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Pricing & Description</h3>

      {/* Price Field */}
      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Agreed Value (£) *</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="25000"
                value={field.value === 0 ? "" : field.value}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === "" ? 0 : Number(val));
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Hire Pricing Section */}
      <div className="space-y-4 pt-2">
        <div>
          <h4 className="text-sm font-medium">Hire Rates</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Set hourly and daily hire rates for your vehicle
          </p>
        </div>

        {/* Pricing Tier Info */}
        {defaultPricing && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Based on the information you provided, we suggest £{defaultPricing.hourlyRate}/hour and £{defaultPricing.dailyRate}/day.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hourly Rate */}
          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hourly Rate (£)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      placeholder={defaultPricing?.hourlyRate.toString() ?? "60"}
                      className="pl-7"
                      value={field.value === 0 || field.value === null ? "" : field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? null : Number(val));
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Per hour rate in GBP
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Daily Rate */}
          <FormField
            control={form.control}
            name="dailyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Rate (£)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      placeholder={defaultPricing?.dailyRate.toString() ?? "300"}
                      className="pl-7"
                      value={field.value === 0 || field.value === null ? "" : field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? null : Number(val));
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Up to 12 hours in GBP
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Description Field */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="Add vehicle description..."
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

