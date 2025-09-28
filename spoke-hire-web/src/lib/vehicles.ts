import { type VehicleData, type VehicleCatalog, type VehicleStats } from "~/types/vehicle";

/**
 * Utility functions for vehicle data operations
 */

export function getVehicleName(vehicle: VehicleData): string {
  return vehicle.vehicle.name || "Unknown Vehicle";
}

export function getMake(vehicle: VehicleData): string {
  return vehicle.vehicle.make || "Unknown";
}

export function getModel(vehicle: VehicleData): string {
  return vehicle.vehicle.model || "Unknown";
}

export function getYear(vehicle: VehicleData): string | null {
  const year = vehicle.vehicle.year;
  return year && year.trim() !== "" ? year : null;
}

export function getRegistration(vehicle: VehicleData): string | null {
  const reg = vehicle.vehicle.registration;
  return reg && reg.trim() !== "" ? reg : null;
}

export function getOwnerName(vehicle: VehicleData): string | null {
  if (!vehicle.owner) return null;
  const { firstName, lastName } = vehicle.owner;
  return `${firstName} ${lastName}`.trim() || null;
}

export function getStatus(vehicle: VehicleData): string {
  return vehicle.vehicle.published ? "published" : "unpublished";
}

export function getPrice(vehicle: VehicleData): number | null {
  const price = vehicle.vehicle.price;
  return price && price > 0 ? price : null;
}

export function getImages(vehicle: VehicleData): string[] {
  return vehicle.images?.urls || [];
}

export function hasImages(vehicle: VehicleData): boolean {
  return (vehicle.images?.urls?.length || 0) > 0;
}

export function hasContact(vehicle: VehicleData): boolean {
  if (!vehicle.owner) return false;
  return !!(vehicle.owner.firstName || vehicle.owner.lastName || vehicle.owner.phone || vehicle.owner.email);
}

export function isPublished(vehicle: VehicleData): boolean {
  return vehicle.vehicle.published === true;
}

export function getSourceBadges(vehicle: VehicleData): string[] {
  return vehicle.sources || [];
}

export function isMultiSource(vehicle: VehicleData): boolean {
  return (vehicle.sources?.length || 0) > 1;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Format vehicle display name
 */
export function formatVehicleName(vehicle: VehicleData): string {
  const make = getMake(vehicle);
  const model = getModel(vehicle);
  const year = getYear(vehicle);
  
  let name = `${make} ${model}`;
  if (year) {
    name += ` (${year})`;
  }
  
  return name;
}

/**
 * Get vehicle status color for UI
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'published':
      return 'bg-green-100 text-green-800';
    case 'unpublished':
      return 'bg-gray-100 text-gray-800';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get source badge color for UI
 */
export function getSourceColor(source: string): string {
  switch (source.toLowerCase()) {
    case 'catalog':
      return 'bg-blue-100 text-blue-800';
    case 'cleansed':
      return 'bg-green-100 text-green-800';
    case 'submission':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Normalize registration number for comparison
 * Removes spaces, converts to uppercase, and handles common variations
 */
export function normalizeRegistrationNumber(reg: string | undefined | null): string {
  if (!reg) return '';
  
  return reg
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[^A-Z0-9]/g, '') // Keep only letters and numbers
    .replace(/O/g, '0') // Replace O with 0
    .replace(/I/g, '1') // Replace I with 1
    .replace(/S/g, '5'); // Replace S with 5 (common in UK plates)
}

/**
 * Check if two registration numbers are the same after normalization
 */
export function areRegistrationNumbersEqual(reg1: string | undefined | null, reg2: string | undefined | null): boolean {
  const normalized1 = normalizeRegistrationNumber(reg1);
  const normalized2 = normalizeRegistrationNumber(reg2);
  
  if (!normalized1 || !normalized2) return false;
  
  return normalized1 === normalized2;
}

/**
 * Generate URL for filtering vehicles by registration number
 */
export function getRegistrationFilterUrl(registration: string | undefined | null): string {
  if (!registration || !registration.trim()) {
    return '/vehicles';
  }
  
  const searchParams = new URLSearchParams({
    search: registration.trim()
  });
  
  return `/vehicles?${searchParams.toString()}`;
}

/**
 * Get full vehicle name for sorting (Make + Model + Year)
 */
export function getFullVehicleName(vehicle: VehicleData): string {
  const make = getMake(vehicle) || '';
  const model = getModel(vehicle) || '';
  const year = getYear(vehicle) || '';
  
  return `${make} ${model} ${year}`.trim();
}

/**
 * Sort vehicles by specified criteria
 */
export function sortVehicles(vehicles: VehicleData[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): VehicleData[] {
  return [...vehicles].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';
    
    switch (sortBy) {
      case 'name':
        aValue = getFullVehicleName(a).toLowerCase();
        bValue = getFullVehicleName(b).toLowerCase();
        break;
      case 'registration':
        aValue = (getRegistration(a) || '').toLowerCase();
        bValue = (getRegistration(b) || '').toLowerCase();
        break;
      case 'year':
        aValue = parseInt(getYear(a) || '0') || 0;
        bValue = parseInt(getYear(b) || '0') || 0;
        break;
      case 'make':
        aValue = (getMake(a) || '').toLowerCase();
        bValue = (getMake(b) || '').toLowerCase();
        break;
      case 'model':
        aValue = (getModel(a) || '').toLowerCase();
        bValue = (getModel(b) || '').toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}
