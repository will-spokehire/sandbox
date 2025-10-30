"use client";

import { Input } from "~/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Combobox } from "~/components/ui/combobox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormFieldComponentProps } from "~/types/vehicle-form";

interface VehicleBasicInfoFieldsProps extends FormFieldComponentProps {
  registrationError?: { vehicleId: string; vehicleName: string; isOwnVehicle: boolean } | null;
  isAdmin?: boolean;
  makeIsUnpublished?: boolean;
  modelIsUnpublished?: boolean;
  hideNameField?: boolean;
}

export function VehicleBasicInfoFields({
  form,
  makeOptions = [],
  modelOptions = [],
  isLoadingModels = false,
  selectedMakeId,
  onMakeChange,
  registrationError,
  isAdmin = false,
  makeIsUnpublished = false,
  modelIsUnpublished = false,
  hideNameField = false,
}: VehicleBasicInfoFieldsProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {!hideNameField && <h3 className="text-sm font-semibold">Basic Information</h3>}

      <div className="grid grid-cols-1 gap-4">
        {/* Name Field */}
        {!hideNameField && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., 2015 BMW 3 Series" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Make and Model Fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* Make Field */}
          <FormField
            control={form.control}
            name="makeId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Make *</FormLabel>
                  {makeIsUnpublished && (
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600 dark:text-yellow-400">
                      Unpublished
                    </Badge>
                  )}
                </div>
                <FormControl>
                  <Combobox
                    options={makeOptions}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      onMakeChange?.(value);
                    }}
                    placeholder="Select or type make"
                    searchPlaceholder="Search makes..."
                    emptyText="No make found."
                    allowCustomValue={true}
                  />
                </FormControl>
                {makeIsUnpublished && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Type to edit
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Model Field */}
          <FormField
            control={form.control}
            name="modelId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Model *</FormLabel>
                  {modelIsUnpublished && (
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600 dark:text-yellow-400">
                      Unpublished
                    </Badge>
                  )}
                </div>
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
                {modelIsUnpublished && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Type to edit
                  </p>
                )}
                {!selectedMakeId && !modelIsUnpublished && (
                  <p className="text-xs text-muted-foreground">Select a make first</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Year and Registration Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year *</FormLabel>
                <FormControl>
                  <Input 
                    type="text"
                    inputMode="numeric"
                    placeholder="2015"
                    {...field} 
                    onChange={(e) => {
                      // Allow only numbers, max 4 digits
                      const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="registration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="AB12CDE" 
                    {...field} 
                    value={field.value ?? ""} 
                    onChange={(e) => {
                      // Convert to uppercase and remove non-alphanumeric characters
                      const formatted = e.target.value
                        .replace(/[^A-Z0-9]/gi, "")
                        .toUpperCase();
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    onClick={() => router.push(`${isAdmin ? '/admin' : '/user'}/vehicles/${registrationError.vehicleId}?from=registration`)}
                  >
                    View {isAdmin ? 'This' : 'Your'} Vehicle
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    This registration number is already associated with another vehicle {isAdmin ? 'owner' : 'in our system'}.
                  </p>
                  <p>
                    If you believe this is an error, please contact {isAdmin ? 'the vehicle owner or ' : 'our '}support{isAdmin ? '' : ' team'} at{" "}
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
  );
}

