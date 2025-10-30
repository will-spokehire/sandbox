import type { VehicleStatus } from "@prisma/client";
import type { VehicleDetail, FilterOptions, ModelsByMake } from "./vehicle";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

/**
 * Base vehicle form data structure shared by admin and user forms
 */
export interface VehicleFormData {
  name: string;
  status: VehicleStatus | string; // string to allow user-specific status types
  price: number;
  hourlyRate: number | null;
  dailyRate: number | null;
  year: string;
  registration: string | null | undefined;
  makeId: string;
  modelId: string;
  engineCapacity: number | null;
  numberOfSeats: number | null;
  steeringId: string | null;
  gearbox: string | null;
  exteriorColour: string | null;
  interiorColour: string | null;
  condition: string | null;
  isRoadLegal: boolean;
  description: string | null;
}

/**
 * Registration error state
 */
export interface RegistrationError {
  vehicleId: string;
  vehicleName: string;
  isOwnVehicle: boolean;
}

/**
 * Result of form data transformation
 */
export interface TransformedFormData extends VehicleFormData {
  id: string;
}

/**
 * Props for form field components
 */
export interface FormFieldComponentProps {
  form: UseFormReturn<VehicleFormData>;
  filterOptions?: FilterOptions;
  models?: ModelsByMake[];
  isLoadingModels?: boolean;
  selectedMakeId?: string;
  onMakeChange?: (makeId: string) => void;
  vehicle?: VehicleDetail;
  readOnlyName?: boolean;
  makeOptions?: Array<{ value: string; label: string }>;
  modelOptions?: Array<{ value: string; label: string }>;
}

