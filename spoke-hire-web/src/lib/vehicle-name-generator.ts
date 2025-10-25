/**
 * Vehicle Name Generator Utility
 * 
 * Centralized logic for generating vehicle names
 * Format: Year Make Model (e.g., "2015 BMW M3")
 */

/**
 * Generate standardized vehicle name from year, make, and model
 * @param year - Vehicle year
 * @param make - Make name (e.g., "BMW")
 * @param model - Model name (e.g., "M3")
 * @returns Formatted vehicle name (e.g., "2015 BMW M3")
 */
export function generateVehicleName(year: string, make: string, model: string): string {
  return `${year} ${make} ${model}`;
}

