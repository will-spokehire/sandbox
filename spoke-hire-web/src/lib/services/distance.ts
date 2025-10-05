/**
 * Distance calculation utilities using PostgreSQL PostGIS
 * 
 * Provides both client-side (Haversine) and server-side (PostGIS) distance calculations
 */

export type DistanceUnit = "miles" | "kilometers";

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate distance between two points using Haversine formula
 * Used for client-side calculations or when PostGIS is not available
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @param unit - Distance unit (miles or kilometers)
 * @returns Distance in specified unit
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: DistanceUnit = "miles"
): number {
  const R = unit === "miles" ? 3959 : 6371; // Earth radius in miles or km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate PostGIS distance query fragment
 * Returns SQL for calculating distance in specified unit
 * 
 * Uses ST_Distance with geography type for accurate geodesic distance
 * 
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @param unit - Distance unit (miles or kilometers)
 * @param tableAlias - Table alias for User table (default: "User")
 * @returns SQL fragment for distance calculation
 */
export function getPostGISDistanceSQL(
  userLat: number,
  userLon: number,
  unit: DistanceUnit = "miles",
  tableAlias: string = "User"
): string {
  // ST_Distance with geography type returns meters
  // Convert to miles (0.000621371) or km (0.001)
  const conversionFactor = unit === "miles" ? 0.000621371 : 0.001;

  // Note: ST_MakePoint takes (longitude, latitude) - not (lat, lon)!
  return `
    ST_Distance(
      ${tableAlias}."geoPoint"::geography,
      ST_SetSRID(ST_MakePoint(${userLon}, ${userLat}), 4326)::geography
    ) * ${conversionFactor}
  `;
}

/**
 * Generate PostGIS distance filter for WHERE clause
 * Filters records within specified radius
 * 
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @param maxDistance - Maximum distance in specified unit
 * @param unit - Distance unit (miles or kilometers)
 * @returns SQL fragment for WHERE clause
 */
export function getPostGISDistanceFilter(
  userLat: number,
  userLon: number,
  maxDistance: number,
  unit: DistanceUnit = "miles"
): string {
  const distanceSQL = getPostGISDistanceSQL(userLat, userLon, unit);
  return `(${distanceSQL}) <= ${maxDistance}`;
}

/**
 * Generate PostGIS bounding box filter (faster pre-filter)
 * Creates a square bounding box around the point
 * This is much faster than distance calculation and can be used as a pre-filter
 * 
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @param maxDistance - Maximum distance in specified unit
 * @param unit - Distance unit (miles or kilometers)
 * @returns SQL fragment for bounding box filter
 */
export function getPostGISBoundingBoxFilter(
  userLat: number,
  userLon: number,
  maxDistance: number,
  unit: DistanceUnit = "miles"
): string {
  // Approximate degrees per mile/km at this latitude
  // This is a rough approximation but good enough for a bounding box
  const degreesPerUnit = unit === "miles" ? 1 / 69 : 1 / 111;
  const latDelta = maxDistance * degreesPerUnit;
  const lonDelta = maxDistance * degreesPerUnit / Math.cos(toRad(userLat));

  return `
    "User"."latitude" BETWEEN ${userLat - latDelta} AND ${userLat + latDelta}
    AND "User"."longitude" BETWEEN ${userLon - lonDelta} AND ${userLon + lonDelta}
  `;
}

/**
 * Generate PostGIS DWithin filter (optimized for spatial index)
 * Uses ST_DWithin which is optimized to use spatial indexes
 * This is the most efficient way to filter by distance
 * 
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @param maxDistance - Maximum distance in specified unit
 * @param unit - Distance unit (miles or kilometers)
 * @param tableAlias - Table alias for User table (default: "User")
 * @returns SQL fragment using ST_DWithin
 */
export function getPostGISDWithinFilter(
  userLat: number,
  userLon: number,
  maxDistance: number,
  unit: DistanceUnit = "miles",
  tableAlias: string = "User"
): string {
  // Convert distance to meters for ST_DWithin
  const distanceMeters = unit === "miles" ? maxDistance * 1609.34 : maxDistance * 1000;

  return `
    ST_DWithin(
      ${tableAlias}."geoPoint"::geography,
      ST_SetSRID(ST_MakePoint(${userLon}, ${userLat}), 4326)::geography,
      ${distanceMeters}
    )
  `;
}

/**
 * Format distance for display
 * 
 * @param distance - Distance value
 * @param unit - Distance unit
 * @param decimals - Number of decimal places
 * @returns Formatted distance string
 */
export function formatDistance(
  distance: number,
  unit: DistanceUnit = "miles",
  decimals: number = 1
): string {
  const formatted = distance.toFixed(decimals);
  const unitLabel = unit === "miles" ? "mi" : "km";
  return `${formatted} ${unitLabel}`;
}
