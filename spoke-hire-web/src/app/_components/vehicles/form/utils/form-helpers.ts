import type { VehicleDetail } from "~/types/vehicle";
import type { VehicleFormData, RegistrationError } from "~/types/vehicle-form";

/**
 * Helper to safely convert Decimal or number to number
 */
function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof value.toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber();
  }
  return null;
}

/**
 * Get default form values from a vehicle
 */
export function getFormDefaults(vehicle: VehicleDetail): VehicleFormData {
  return {
    name: vehicle.name,
    status: vehicle.status,
    price: vehicle.price ? Number(vehicle.price) : 0,
    hourlyRate: toNumber(vehicle.hourlyRate) ?? 0,
    dailyRate: toNumber(vehicle.dailyRate) ?? 0,
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
  };
}

/**
 * Transform form data for submission (convert empty strings to null)
 */
export function transformFormData(
  data: VehicleFormData,
  vehicleId: string
): VehicleFormData & { id: string } {
  return {
    id: vehicleId,
    ...data,
    // Ensure pricing values are properly handled (never null)
    hourlyRate: data.hourlyRate,
    dailyRate: data.dailyRate,
    registration: data.registration || null,
    steeringId: data.steeringId || null,
    gearbox: data.gearbox || null,
    exteriorColour: data.exteriorColour || null,
    interiorColour: data.interiorColour || null,
    condition: data.condition || null,
    description: data.description || null,
  };
}

/**
 * Parse registration error from API response
 */
export function parseRegistrationError(errorMessage: string): RegistrationError | null {
  try {
    const errorData = JSON.parse(errorMessage) as {
      code?: string;
      vehicleId?: string;
      vehicleName?: string;
      isOwnVehicle?: boolean;
    };
    
    if (errorData.code === "REGISTRATION_EXISTS") {
      return {
        vehicleId: errorData.vehicleId ?? "",
        vehicleName: errorData.vehicleName ?? "",
        isOwnVehicle: errorData.isOwnVehicle ?? false,
      };
    }
  } catch {
    // Not a JSON error or not a registration error
  }
  return null;
}

/**
 * Check if make is unpublished
 */
export function isMakeUnpublished(vehicle: VehicleDetail): boolean {
  return (vehicle.make as unknown as { isPublished?: boolean })?.isPublished === false;
}

/**
 * Check if model is unpublished
 */
export function isModelUnpublished(vehicle: VehicleDetail): boolean {
  return (vehicle.model as unknown as { isPublished?: boolean })?.isPublished === false;
}

