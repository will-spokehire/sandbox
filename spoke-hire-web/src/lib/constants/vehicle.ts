/**
 * Vehicle Constants
 * 
 * Predefined values for vehicle attributes like colors and gearbox types.
 * These are standard options that don't need to be fetched from the database.
 */

/**
 * Standard vehicle colors
 * Used for both exterior and interior colour options
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
 * Color to hex mapping for visual swatches
 * Maps vehicle color names to their hex representations
 */
export const COLOR_HEX_MAP: Record<VehicleColor, string> = {
  Beige: "#F5F5DC",
  Black: "#000000",
  Blue: "#0000FF",
  Brown: "#8B4513",
  Cream: "#FFFDD0",
  Gold: "#FFD700",
  Green: "#008000",
  Grey: "#808080",
  Maroon: "#800000",
  Orange: "#FFA500",
  Pink: "#FFC0CB",
  Purple: "#800080",
  Red: "#FF0000",
  Silver: "#C0C0C0",
  White: "#FFFFFF",
  Yellow: "#FFFF00",
};

/**
 * Standard gearbox types
 */
export const GEARBOX_TYPES = [
  "Automatic",
  "Manual",
  "Sequential",
] as const;

export type GearboxType = typeof GEARBOX_TYPES[number];

/**
 * Standard vehicle condition options
 */
export const VEHICLE_CONDITIONS = [
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
  "Restoration",
] as const;

export type VehicleCondition = typeof VEHICLE_CONDITIONS[number];

