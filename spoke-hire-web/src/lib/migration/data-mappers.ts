/**
 * Data mapping utilities for migrating existing vehicle data to new schema
 */

export interface SourceRecord {
  // Catalog source
  handleId?: string;
  name?: string;
  productImageUrl?: string;
  productOptionDescription1?: string; // Make
  productOptionDescription3?: string; // Steering
  productOptionDescription4?: string; // Gearbox
  productOptionDescription5?: string; // Color
  productOptionDescription6?: string; // Seats
  additionalInfoDescription1?: string; // Contains year, registration, engine
  price?: number;
  visible?: boolean;
  collection?: string;
  inventory?: string;
  
  // Cleansed source
  wixId?: string;
  owner?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      county?: string;
      postcode?: string;
      country?: string;
    };
  };
  vehicle?: {
    make?: string;
    model?: string;
    yearOfManufacture?: string;
    registration?: string;
    engineCapacity?: string;
    numberOfSeats?: string;
    steering?: string;
    gearbox?: string;
    exteriorColour?: string;
    interiorColour?: string;
    condition?: string;
    isRoadLegal?: string;
  };
  images?: {
    urls?: string[];
    titles?: string[];
    count?: number;
  };
  
  // Submission source
  call_time?: string;
  first_name_1?: string;
  last_name_de76?: string;
  email_4bec?: string;
  phone_bc17?: string;
  your_address?: string;
  city_1?: string;
  county_1?: string;
  postcode?: string;
  country?: string;
  make_1?: string;
  location_1?: string; // Model
  year_of_manufacture_1?: string;
  engine_capacity?: string;
  number_of_seats_1?: string;
  steering_1?: string;
  gearbox_1?: string;
  exterior_colour_1?: string;
  interior_colour_1?: string;
  project_brief_1?: string; // Condition
  is_this_vehicle_road_legal?: string;
  upload_vehicle_images?: string[];
}

export interface MappedUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
}

export interface MappedVehicleData {
  name: string;
  make: string;
  model: string;
  year: string;
  registration?: string;
  engineCapacity?: number | null; // in CC
  numberOfSeats?: number | null;
  steering?: string;
  gearbox?: string;
  exteriorColour?: string;
  interiorColour?: string;
  condition?: string;
  isRoadLegal: boolean;
  price?: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'DECLINED' | 'ARCHIVED';
  description?: string;
}

export interface MappedMediaData {
  type: 'IMAGE' | 'VIDEO';
  originalUrl: string;
  filename: string;
  mimeType: string;
  format: string;
  order: number;
  isPrimary: boolean;
}

/**
 * Extract email from different source types
 */
export function extractEmail(record: SourceRecord, sourceType: string): string | null {
  switch (sourceType) {
    case 'catalog':
      return null; // Catalog doesn't have owner emails
    case 'cleansed':
      return record.owner?.email ?? null;
    case 'submission':
      return record.email_4bec ?? null;
    default:
      return null;
  }
}

/**
 * Extract and map user data from source record
 */
export function extractUserData(record: SourceRecord, sourceType: string): MappedUserData | null {
  const email = extractEmail(record, sourceType);
  if (!email) return null;

  switch (sourceType) {
    case 'cleansed':
      return {
        email,
        firstName: record.owner?.firstName,
        lastName: record.owner?.lastName,
        phone: record.owner?.phone,
        street: record.owner?.address?.street,
        city: record.owner?.address?.city,
        county: record.owner?.address?.county,
        postcode: record.owner?.address?.postcode,
        country: record.owner?.address?.country,
      };
    
    case 'submission':
      return {
        email,
        firstName: record.first_name_1,
        lastName: record.last_name_de76,
        phone: record.phone_bc17,
        street: record.your_address,
        city: record.city_1,
        county: record.county_1,
        postcode: record.postcode,
        country: record.country,
      };
    
    default:
      return { email };
  }
}

/**
 * Convert engine capacity string to CC integer
 */
export function convertEngineCapacity(capacity?: string): number | null {
  if (!capacity) return null;
  
  // Handle various formats: "1.8L", "1800cc", "2.5", "6700cc"
  const capacityRegex = /(\d+(?:\.\d+)?)\s*(?:L|cc|litre|liter)/i;
  const match = capacityRegex.exec(capacity);
  if (match?.[1]) {
    const value = parseFloat(match[1]);
    return capacity.toLowerCase().includes('l') ? Math.round(value * 1000) : Math.round(value);
  }
  
  // Try to extract just numbers for cases like "1.8" or "2500"
  const numbersRegex = /\d+(?:\.\d+)?/;
  const numbers = numbersRegex.exec(capacity);
  if (numbers?.[0]) {
    const value = parseFloat(numbers[0]);
    // If value is less than 10, assume it's in liters
    return value < 10 ? Math.round(value * 1000) : Math.round(value);
  }
  
  return null;
}

/**
 * Convert number of seats string to integer
 */
export function convertNumberOfSeats(seats?: string): number | null {
  if (!seats) return null;
  const seatsRegex = /\d+/;
  const match = seatsRegex.exec(seats);
  return match?.[0] ? parseInt(match[0]) : null;
}

/**
 * Convert road legal status to boolean
 */
export function convertRoadLegalStatus(status?: string): boolean {
  if (!status) return true; // Default to true
  return status.toLowerCase().includes('yes') || status.toLowerCase().includes('true');
}

/**
 * Map visibility/inventory to vehicle status
 */
export function mapVisibilityToStatus(visible?: boolean, inventory?: string): 'DRAFT' | 'PUBLISHED' | 'DECLINED' | 'ARCHIVED' {
  if (visible === true && inventory !== 'OutOfStock') {
    return 'PUBLISHED';
  }
  return 'DRAFT';
}

/**
 * Extract year from description text
 */
export function extractYearFromDescription(description?: string): string {
  if (!description) return '';
  
  // Look for 4-digit year pattern
  const yearRegex = /\b(19|20)\d{2}\b/;
  const yearMatch = yearRegex.exec(description);
  return yearMatch?.[0] ?? '';
}

/**
 * Extract registration from description text
 */
export function extractRegistrationFromDescription(description?: string): string {
  if (!description) return '';
  
  // UK registration patterns: ABC 123D, A123 BCD, etc.
  const regRegex = /\b[A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{1,3}\b/i;
  const regMatch = regRegex.exec(description);
  return regMatch?.[0] ?? '';
}

/**
 * Extract engine capacity from description text
 */
export function extractEngineFromDescription(description?: string): string {
  if (!description) return '';
  
  // Look for engine patterns: 2.0L, 1800cc, etc.
  const engineRegex = /\d+(?:\.\d+)?\s*(?:L|cc|litre)/i;
  const engineMatch = engineRegex.exec(description);
  return engineMatch?.[0] ?? '';
}

/**
 * Extract color from description or option
 */
export function extractColorFromDescription(colorOption?: string, description?: string): string {
  if (colorOption && colorOption !== '') return colorOption;
  
  if (!description) return '';
  
  // Common colors
  const colors = ['red', 'blue', 'green', 'black', 'white', 'silver', 'grey', 'gray', 'yellow', 'orange'];
  const colorRegex = new RegExp(`\\b(${colors.join('|')})\\b`);
  const colorMatch = colorRegex.exec(description.toLowerCase());
  return colorMatch?.[1] ?? '';
}

/**
 * Extract vehicle data from source record
 */
export function extractVehicleData(record: SourceRecord, sourceType: string): MappedVehicleData | null {
  switch (sourceType) {
    case 'catalog':
      return {
        name: record.name ?? '',
        make: record.productOptionDescription1 ?? '',
        model: record.name ?? '',
        year: extractYearFromDescription(record.additionalInfoDescription1),
        registration: extractRegistrationFromDescription(record.additionalInfoDescription1),
        engineCapacity: convertEngineCapacity(extractEngineFromDescription(record.additionalInfoDescription1)),
        numberOfSeats: convertNumberOfSeats(record.productOptionDescription6),
        steering: record.productOptionDescription3,
        gearbox: record.productOptionDescription4,
        exteriorColour: extractColorFromDescription(record.productOptionDescription5, record.additionalInfoDescription1),
        interiorColour: '',
        condition: '',
        isRoadLegal: true,
        price: record.price,
        status: mapVisibilityToStatus(record.visible, record.inventory),
        description: record.additionalInfoDescription1,
      };
    
    case 'cleansed':
      return {
        name: `${record.vehicle?.yearOfManufacture} ${record.vehicle?.make} ${record.vehicle?.model}`,
        make: record.vehicle?.make ?? '',
        model: record.vehicle?.model ?? '',
        year: record.vehicle?.yearOfManufacture ?? '',
        registration: record.vehicle?.registration,
        engineCapacity: convertEngineCapacity(record.vehicle?.engineCapacity),
        numberOfSeats: convertNumberOfSeats(record.vehicle?.numberOfSeats),
        steering: record.vehicle?.steering,
        gearbox: record.vehicle?.gearbox,
        exteriorColour: record.vehicle?.exteriorColour,
        interiorColour: record.vehicle?.interiorColour,
        condition: record.vehicle?.condition,
        isRoadLegal: convertRoadLegalStatus(record.vehicle?.isRoadLegal),
        price: null,
        status: 'DRAFT',
        description: record.vehicle?.condition,
      };
    
    case 'submission':
      return {
        name: `${record.year_of_manufacture_1} ${record.make_1} ${record.location_1}`,
        make: record.make_1 ?? '',
        model: record.location_1 ?? '',
        year: record.year_of_manufacture_1 ?? '',
        registration: record.call_time, // Using call_time as registration for submissions
        engineCapacity: convertEngineCapacity(record.engine_capacity),
        numberOfSeats: convertNumberOfSeats(record.number_of_seats_1),
        steering: record.steering_1,
        gearbox: record.gearbox_1,
        exteriorColour: record.exterior_colour_1,
        interiorColour: record.interior_colour_1,
        condition: record.project_brief_1,
        isRoadLegal: convertRoadLegalStatus(record.is_this_vehicle_road_legal),
        price: null,
        status: 'DRAFT',
        description: record.project_brief_1,
      };
    
    default:
      return null;
  }
}

/**
 * Determine media type from URL/filename
 */
export function determineMediaType(url: string): 'IMAGE' | 'VIDEO' {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.flv'];
  const extension = url.toLowerCase().substring(url.lastIndexOf('.'));
  return videoExtensions.includes(extension) ? 'VIDEO' : 'IMAGE';
}

/**
 * Determine MIME type from URL/filename
 */
export function determineMimeType(url: string): string {
  const extension = url.toLowerCase().substring(url.lastIndexOf('.'));
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
  };
  return mimeTypes[extension] ?? 'application/octet-stream';
}

/**
 * Extract filename from URL
 */
export function extractFilename(url: string): string {
  return url.split('/').pop() ?? `media_${Date.now()}`;
}

/**
 * Extract format from URL/filename
 */
export function extractFormat(url: string): string {
  const extension = url.toLowerCase().substring(url.lastIndexOf('.') + 1);
  return extension ?? 'unknown';
}

/**
 * Extract media URLs from source record
 */
export function extractMediaUrls(record: SourceRecord, sourceType: string): string[] {
  switch (sourceType) {
    case 'catalog':
      if (record.productImageUrl) {
        return record.productImageUrl.split(';').filter(url => url.trim() !== '');
      }
      return [];
    
    case 'cleansed':
      return record.images?.urls ?? [];
    
    case 'submission':
      return record.upload_vehicle_images ?? [];
    
    default:
      return [];
  }
}

/**
 * Map media URLs to media data objects
 */
export function mapMediaData(urls: string[]): MappedMediaData[] {
  return urls.map((url, index) => ({
    type: determineMediaType(url),
    originalUrl: url,
    filename: extractFilename(url),
    mimeType: determineMimeType(url),
    format: extractFormat(url),
    order: index,
    isPrimary: index === 0,
  }));
}

/**
 * Extract original ID from source record
 */
export function extractOriginalId(record: SourceRecord, sourceType: string): string {
  switch (sourceType) {
    case 'catalog':
      return record.handleId ?? '';
    case 'cleansed':
      return record.wixId ?? '';
    case 'submission':
      return record.call_time ?? '';
    default:
      return '';
  }
}

/**
 * Map steering string to steering type lookup
 */
export function mapSteeringToType(steering?: string): { name: string; code: string } | null {
  if (!steering) return null;
  
  const steeringLower = steering.toLowerCase();
  
  if (steeringLower.includes('right') || steeringLower.includes('rhd')) {
    return { name: 'Right Hand Drive', code: 'RHD' };
  }
  
  if (steeringLower.includes('left') || steeringLower.includes('lhd')) {
    return { name: 'Left Hand Drive', code: 'LHD' };
  }
  
  // Map "Single-Seater", "single seated", "bike", "scooter" to Single Seated
  if (steeringLower.includes('single') || steeringLower.includes('bike') || steeringLower.includes('scooter')) {
    return { name: 'Single Seated', code: 'SS' };
  }
  
  return null;
}

/**
 * Parse collections from collection string
 */
export function parseCollections(collectionString?: string): string[] {
  if (!collectionString) return [];
  
  return collectionString
    .split(';')
    .map(c => c.trim())
    .filter(c => c !== '' && c !== 'All Vehicles');
}

/**
 * Generate collection slug from name
 */
export function generateCollectionSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
