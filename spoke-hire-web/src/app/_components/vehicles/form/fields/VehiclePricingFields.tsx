"use client";

import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import type { FormFieldComponentProps } from "~/types/vehicle-form";

export function VehiclePricingFields({ form }: FormFieldComponentProps) {
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
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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

