"use client";

import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
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
  FormMessage,
} from "~/components/ui/form";
import { VEHICLE_COLORS, GEARBOX_TYPES } from "~/lib/constants/vehicle";
import type { FormFieldComponentProps } from "~/types/vehicle-form";

export function VehicleSpecificationFields({
  form,
  filterOptions,
}: FormFieldComponentProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Specifications</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Engine Capacity */}
        <FormField
          control={form.control}
          name="engineCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Engine Capacity (CC)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="2000"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Number of Seats */}
        <FormField
          control={form.control}
          name="numberOfSeats"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Seats</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="5"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Steering */}
        <FormField
          control={form.control}
          name="steeringId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Steering</FormLabel>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select steering (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filterOptions?.steeringTypes.map((steering) => (
                    <SelectItem key={steering.id} value={steering.id}>
                      {steering.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gearbox */}
        <FormField
          control={form.control}
          name="gearbox"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gearbox</FormLabel>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gearbox (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GEARBOX_TYPES.map((gearbox) => (
                    <SelectItem key={gearbox} value={gearbox}>
                      {gearbox}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Exterior Colour */}
        <FormField
          control={form.control}
          name="exteriorColour"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exterior Colour</FormLabel>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select colour (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Interior Colour */}
        <FormField
          control={form.control}
          name="interiorColour"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interior Colour</FormLabel>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select colour (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Road Legal Checkbox */}
      <FormField
        control={form.control}
        name="isRoadLegal"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="cursor-pointer font-normal">
              Road Legal
            </FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
}

