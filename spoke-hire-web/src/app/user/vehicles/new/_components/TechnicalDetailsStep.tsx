import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "~/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import { technicalDetailsSchema, type TechnicalDetailsFormData, type TechnicalDetailsSubmitData } from "./validation";
import { VEHICLE_COLORS, GEARBOX_TYPES, COLOR_HEX_MAP } from "~/lib/constants/vehicle";
import type { FilterOptions, SteeringItem } from "./types";

interface TechnicalDetailsStepProps {
  onComplete: (data: TechnicalDetailsSubmitData) => void;
  defaultValues?: Partial<TechnicalDetailsSubmitData>;
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * Technical Details Step Component
 * 
 * Collects detailed technical specifications:
 * - Engine, seats, steering, gearbox
 * - Colors, condition
 * - Road legal status and description
 */
export function TechnicalDetailsStep({
  onComplete,
  defaultValues,
  onValidationChange,
}: TechnicalDetailsStepProps) {
  // Fetch filter options
  const { data: filterOptions, isLoading: isLoadingFilters } =
    api.userVehicle.getFilterOptions.useQuery();

  const form = useForm<TechnicalDetailsFormData>({
    resolver: zodResolver(technicalDetailsSchema),
    defaultValues: {
      engineCapacity: defaultValues?.engineCapacity ? String(defaultValues.engineCapacity) : "",
      numberOfSeats: defaultValues?.numberOfSeats ?? 4,
      steeringId: defaultValues?.steeringId ?? "",
      gearbox: defaultValues?.gearbox ?? "",
      exteriorColour: defaultValues?.exteriorColour ?? "",
      interiorColour: defaultValues?.interiorColour ?? "",
      condition: defaultValues?.condition ?? "",
      isRoadLegal: defaultValues?.isRoadLegal ?? true,
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
    (window as any).__currentStepSubmit = () => {
      form.handleSubmit((data) => {
        // Convert engineCapacity string to number before submitting
        const submittedData: TechnicalDetailsSubmitData = {
          ...data,
          engineCapacity: Number(data.engineCapacity),
        };
        onComplete(submittedData);
      })();
    };
    return () => {
      delete (window as any).__currentStepSubmit;
    };
  }, [form, onComplete]);

  // Seats options (1-20)
  const seatOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  // Condition options
  const conditionOptions = [
    "Excellent",
    "Very Good",
    "Good",
    "Fair",
    "Restoration",
  ];

  // Convert steering types to options
  const steeringOptions: SteeringItem[] = useMemo(() => {
    const steering = filterOptions?.steeringTypes as SteeringItem[] | undefined;
    return steering ?? [];
  }, [filterOptions?.steeringTypes]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Technical Details</h2>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Provide specifications and condition information
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Engine Capacity */}
            <FormField
              control={form.control}
              name="engineCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm md:text-base">Engine Capacity (CC) *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="2000"
                      className="h-11 md:h-10 text-base md:text-sm"
                      {...field}
                      onChange={(e) => {
                        // Allow only numbers
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription className="min-h-[20px] text-xs md:text-sm">
                    Engine size in cubic centimeters
                  </FormDescription>
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
                  <FormLabel className="text-sm md:text-base">Number of Seats *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                        <SelectValue placeholder="Select seats" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {seatOptions.map((seats) => (
                        <SelectItem key={seats} value={seats.toString()}>
                          {seats} {seats === 1 ? "seat" : "seats"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="min-h-[20px] text-xs md:text-sm">
                    Total seating capacity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Steering Type */}
            <FormField
              control={form.control}
              name="steeringId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm md:text-base">Steering *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingFilters}
                      className="flex flex-wrap gap-2"
                    >
                      {steeringOptions.map((steering) => (
                        <label
                          key={steering.id}
                          className="cursor-pointer"
                        >
                          <RadioGroupItem
                            value={steering.id}
                            className="sr-only peer"
                          />
                          <div className="px-3 md:px-4 py-2 rounded-md border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-colors text-sm md:text-base">
                            {steering.name}
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="min-h-[20px] text-xs md:text-sm">
                    Left or right hand drive
                  </FormDescription>
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
                  <FormLabel className="text-sm md:text-base">Gearbox *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-wrap gap-2"
                    >
                      {GEARBOX_TYPES.map((gearbox) => (
                        <label
                          key={gearbox}
                          className="cursor-pointer"
                        >
                          <RadioGroupItem
                            value={gearbox}
                            className="sr-only peer"
                          />
                          <div className="px-3 md:px-4 py-2 rounded-md border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-colors text-sm md:text-base">
                            {gearbox}
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="min-h-[20px] text-xs md:text-sm">
                    Transmission type
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Exterior Colour */}
          <FormField
            control={form.control}
            name="exteriorColour"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm md:text-base">Exterior Colour *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-wrap gap-1.5 md:gap-2"
                  >
                    {VEHICLE_COLORS.map((color) => (
                      <label
                        key={color}
                        className="cursor-pointer"
                      >
                        <RadioGroupItem
                          value={color}
                          className="sr-only peer"
                        />
                        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-md border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-colors text-xs md:text-sm">
                          <span 
                            className="inline-block w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border border-gray-300"
                            style={{ backgroundColor: COLOR_HEX_MAP[color] }}
                          />
                          <span>{color}</span>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription className="min-h-[20px] text-xs md:text-sm">
                  Exterior paint colour
                </FormDescription>
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
                <FormLabel className="text-sm md:text-base">Interior Colour *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-wrap gap-1.5 md:gap-2"
                  >
                    {VEHICLE_COLORS.map((color) => (
                      <label
                        key={color}
                        className="cursor-pointer"
                      >
                        <RadioGroupItem
                          value={color}
                          className="sr-only peer"
                        />
                        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-md border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-colors text-xs md:text-sm">
                          <span 
                            className="inline-block w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border border-gray-300"
                            style={{ backgroundColor: COLOR_HEX_MAP[color] }}
                          />
                          <span>{color}</span>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription className="min-h-[20px] text-xs md:text-sm">
                  Interior upholstery colour
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Condition */}
          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm md:text-base">Condition *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-wrap gap-2"
                  >
                    {conditionOptions.map((condition) => (
                      <label
                        key={condition}
                        className="cursor-pointer"
                      >
                        <RadioGroupItem
                          value={condition}
                          className="sr-only peer"
                        />
                        <div className="px-3 md:px-4 py-2 rounded-md border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-colors text-sm md:text-base">
                          {condition}
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription className="min-h-[20px] text-xs md:text-sm">
                  Current physical condition of the vehicle
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Road Legal */}
          <FormField
            control={form.control}
            name="isRoadLegal"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 md:p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm md:text-base cursor-pointer">Road Legal</FormLabel>
                  <FormDescription className="text-xs md:text-sm">
                    I confirm this vehicle is legal to drive on public roads
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
