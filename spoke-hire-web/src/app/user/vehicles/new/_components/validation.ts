import { z } from "zod";
import { isValidPhoneNumber } from "~/lib/whatsapp";

/**
 * Validation schemas for the vehicle creation wizard
 * These match the backend validation in user-vehicle.ts
 */

// Profile step validation
export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (val) => isValidPhoneNumber(val),
      "Please enter a valid phone number"
    ),
  street: z.string().optional(),
  city: z.string().min(1, "City is required"),
  county: z.string().optional(),
  postcode: z.string().min(1, "Postcode is required"),
  countryId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Basic info step validation
export const basicInfoSchema = z.object({
  makeId: z.string().min(1, "Make is required"),
  modelId: z.string().min(1, "Model is required"),
  name: z.string().min(3, "Vehicle name must be at least 3 characters"),
  year: z.string().min(1, "Year is required"),
  registration: z.string().min(1, "Registration is required"),
  price: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || (!isNaN(Number(val)) && Number(val) >= 0),
      "Price must be a valid number greater than or equal to 0"
    ),
});

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

// Type for the transformed data (after converting price to number)
export type BasicInfoSubmitData = Omit<BasicInfoFormData, 'price'> & {
  price?: number;
};

// Technical details step validation
export const technicalDetailsSchema = z.object({
  engineCapacity: z
    .string()
    .min(1, "Engine capacity is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 1,
      "Engine capacity must be a valid number greater than 0"
    ),
  numberOfSeats: z.number().min(1).max(20, "Number of seats must be between 1 and 20"),
  steeringId: z.string().min(1, "Steering type is required"),
  gearbox: z.string().min(1, "Gearbox is required"),
  exteriorColour: z.string().min(1, "Exterior colour is required"),
  interiorColour: z.string().min(1, "Interior colour is required"),
  condition: z.string().min(1, "Condition is required"),
  isRoadLegal: z.boolean(),
  description: z.string().optional(),
  collectionIds: z.array(z.string()).optional(),
});

export type TechnicalDetailsFormData = z.infer<typeof technicalDetailsSchema>;

// Type for the transformed data (after converting engineCapacity to number)
export type TechnicalDetailsSubmitData = Omit<TechnicalDetailsFormData, 'engineCapacity'> & {
  engineCapacity: number;
};

// Combined schema for full vehicle creation
export const fullVehicleSchema = basicInfoSchema.merge(technicalDetailsSchema);

export type FullVehicleFormData = z.infer<typeof fullVehicleSchema>;

// Helper function to check if profile is complete
export function isProfileComplete(user: {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  city?: string | null;
  postcode?: string | null;
}): boolean {
  return Boolean(
    user.firstName && 
    user.lastName && 
    user.phone && 
    user.city && 
    user.postcode
  );
}

