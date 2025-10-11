/**
 * Data validation utilities for migration
 * Detects common data quality issues before importing to database
 */

interface VehicleData {
  name?: string;
  model?: string;
  make?: string;
}

interface RecordWithVehicle {
  id: string;
  vehicle?: VehicleData;
}

/**
 * Check if a string contains URLs or file paths
 */
export function containsUrls(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  
  const urlPatterns = [
    /https?:\/\//i,        // http:// or https://
    /www\./i,               // www.
    /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)/i, // Image/video extensions
    /~mv2\./i,              // Wix image pattern
    /[a-f0-9]{6}_[a-f0-9]{32}~mv2/i  // Wix image ID pattern
  ];
  
  return urlPatterns.some(pattern => pattern.test(value));
}

/**
 * Validate vehicle data fields
 */
export function validateVehicleFields(
  vehicle: VehicleData,
  recordId: string | number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check vehicle name for URLs
  if (vehicle.name && containsUrls(vehicle.name)) {
    errors.push(
      `Record ${recordId}: Vehicle name contains URLs: "${vehicle.name.substring(0, 100)}..."`
    );
  }

  // Check model for URLs
  if (vehicle.model && containsUrls(vehicle.model)) {
    errors.push(
      `Record ${recordId}: Model field contains URLs: "${vehicle.model.substring(0, 100)}..."`
    );
  }

  // Check make for URLs (less common but possible)
  if (vehicle.make && containsUrls(vehicle.make)) {
    errors.push(
      `Record ${recordId}: Make field contains URLs: "${vehicle.make}"`
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Clean a field that may contain URLs by extracting the non-URL part
 * Returns 'Unknown' if the field is entirely URLs or cannot be cleaned
 */
export function cleanFieldWithUrls(value: string, fieldType: 'name' | 'model' = 'name'): string {
  if (!value || !containsUrls(value)) return value;
  
  // Try to extract the part before URLs
  const parts = value.split(/\s+https?:/);
  if (parts.length > 0 && parts[0].trim()) {
    return parts[0].trim();
  }
  
  // If we can't extract anything meaningful, return 'Unknown' for models
  return fieldType === 'model' ? 'Unknown' : value;
}

/**
 * Validate and optionally fix a batch of vehicle records
 */
export function validateVehicleBatch(
  records: Array<RecordWithVehicle>,
  options: { autoFix?: boolean } = {}
): {
  valid: number;
  errors: number;
  fixed: number;
  issues: Array<{ recordId: string; field: string; message: string }>;
} {
  const stats = {
    valid: 0,
    errors: 0,
    fixed: 0,
    issues: [] as Array<{ recordId: string; field: string; message: string }>
  };

  for (const record of records) {
    if (!record.vehicle) {
      stats.valid++;
      continue;
    }

    const validation = validateVehicleFields(record.vehicle, record.id);

    if (validation.valid) {
      stats.valid++;
      continue;
    }

    stats.errors++;

    // Log all errors
    for (const error of validation.errors) {
      const regex = /(.+?): (.+?) contains URLs/;
      const match = regex.exec(error);
      if (match) {
        stats.issues.push({
          recordId: record.id,
          field: match[2] ?? '',
          message: error
        });
      }
    }

    // Auto-fix if enabled
    if (options.autoFix) {
      if (record.vehicle.name && containsUrls(record.vehicle.name)) {
        const cleaned = cleanFieldWithUrls(record.vehicle.name, 'name');
        if (cleaned !== record.vehicle.name) {
          record.vehicle.name = cleaned;
          stats.fixed++;
        }
      }

      if (record.vehicle.model && containsUrls(record.vehicle.model)) {
        const cleaned = cleanFieldWithUrls(record.vehicle.model, 'model');
        if (cleaned !== record.vehicle.model) {
          record.vehicle.model = cleaned;
          stats.fixed++;
        }
      }
    }
  }

  return stats;
}

