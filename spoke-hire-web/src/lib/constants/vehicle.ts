/**
 * Vehicle Constants
 * 
 * Predefined values for vehicle attributes like colors and gearbox types.
 * These are standard options that don't need to be fetched from the database.
 */

/**
 * Standard vehicle colors
 * Used for both exterior and interior color options
 */
export const VEHICLE_COLORS = [
  "Beige",
  "Black",
  "Blue",
  "Brown",
  "Cream",
  "Gold",
  "Green",
  "Grey",
  "Maroon",
  "Orange",
  "Pink",
  "Purple",
  "Red",
  "Silver",
  "White",
  "Yellow",
] as const;

export type VehicleColor = typeof VEHICLE_COLORS[number];

/**
 * Standard gearbox types
 */
export const GEARBOX_TYPES = [
  "Automatic",
  "Manual",
  "Sequential",
] as const;

export type GearboxType = typeof GEARBOX_TYPES[number];

