"use client";

import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
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
  FormDescription,
} from "~/components/ui/form";
import { VEHICLE_COLORS, GEARBOX_TYPES, VEHICLE_CONDITIONS } from "~/lib/constants/vehicle";
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
              <FormLabel>Engine Capacity (CC) *</FormLabel>
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
              <FormLabel>Number of Seats *</FormLabel>
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
              <FormLabel>Steering *</FormLabel>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select steering" />
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
              <FormLabel>Gearbox *</FormLabel>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gearbox" />
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
              <FormLabel>Exterior Colour *</FormLabel>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select colour" />
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
              <FormLabel>Interior Colour *</FormLabel>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select colour" />
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

      {/* Condition */}
      <FormField
        control={form.control}
        name="condition"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Condition *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value ?? undefined}
                className="flex flex-wrap gap-2"
              >
                {VEHICLE_CONDITIONS.map((condition) => (
                  <label
                    key={condition}
                    className="cursor-pointer"
                  >
                    <RadioGroupItem
                      value={condition}
                      className="sr-only peer"
                    />
                    <div className="px-3 md:px-4 py-2 rounded-md border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-colors text-sm">
                      {condition}
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormDescription className="text-xs">
              Current physical condition of the vehicle
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

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

