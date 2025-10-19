import { db } from "~/server/db";

/**
 * Geocoding service using postcodes.io API
 * Reference: https://postcodes.io/docs/api/lookup-postcode
 * 
 * Handles UK postcode to lat/long conversion with database caching
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  postcode: string;
  country: string;
  region?: string;
  adminDistrict?: string;
  adminCounty?: string;
}

export interface PostcodesIoResponse {
  status: number;
  result?: {
    postcode: string;
    latitude: number;
    longitude: number;
    country: string;
    region?: string;
    admin_district?: string;
    admin_county?: string;
    codes?: {
      admin_district?: string;
      admin_county?: string;
      admin_ward?: string;
    };
  };
  error?: string;
}

/**
 * Normalize UK postcode format
 * Removes spaces and converts to uppercase
 */
export function normalizePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, "").toUpperCase();
}

/**
 * Validate UK postcode format
 * Basic validation - postcodes.io will do full validation
 */
export function isValidUKPostcode(postcode: string): boolean {
  const normalized = normalizePostcode(postcode);
  // UK postcodes are 5-7 characters (without spaces)
  // Pattern: 1-2 letters, 1-2 digits, optional letter, digit, 2 letters
  return /^[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2}$/i.test(normalized);
}

/**
 * Geocode a UK postcode using postcodes.io API
 * Includes database caching to minimize API calls
 * 
 * @param postcode - UK postcode to geocode
 * @returns GeocodingResult with lat/long and metadata
 * @throws Error if postcode is invalid or API call fails
 */
export async function geocodePostcode(
  postcode: string
): Promise<GeocodingResult> {
  const normalized = normalizePostcode(postcode);

  // Validate postcode format
  if (!isValidUKPostcode(normalized)) {
    throw new Error(`Invalid UK postcode format: ${postcode}`);
  }

  // Check if we have cached geolocation data for this postcode
  // Use any user with this postcode that was geocoded in the last 90 days
  const cachedUser = await db.user.findFirst({
    where: {
      postcode: {
        equals: normalized,
        mode: "insensitive",
      },
      latitude: { not: null },
      longitude: { not: null },
      geoUpdatedAt: {
        // Only use cache if updated within last 90 days
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      latitude: true,
      longitude: true,
      postcode: true,
      country: {
        select: {
          name: true,
        },
      },
    },
  });

  if (cachedUser?.latitude && cachedUser?.longitude) {
    return {
      latitude: cachedUser.latitude,
      longitude: cachedUser.longitude,
      postcode: cachedUser.postcode ?? normalized,
      country: cachedUser.country?.name ?? "United Kingdom",
    };
  }

  // Call postcodes.io API
  const response = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(normalized)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Postcodes.io API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as PostcodesIoResponse;

  if (data.status !== 200 || !data.result) {
    throw new Error(
      data.error ?? `Failed to geocode postcode: ${postcode}`
    );
  }

  return {
    latitude: data.result.latitude,
    longitude: data.result.longitude,
    postcode: data.result.postcode,
    country: data.result.country,
    region: data.result.region,
    adminDistrict: data.result.admin_district,
    adminCounty: data.result.admin_county,
  };
}

/**
 * Batch geocode multiple postcodes
 * Uses postcodes.io bulk lookup endpoint (max 100 postcodes)
 * 
 * @param postcodes - Array of UK postcodes to geocode
 * @returns Map of normalized postcode to GeocodingResult
 * @throws Error if batch size exceeds 100 or API call fails
 */
export async function geocodePostcodesBatch(
  postcodes: string[]
): Promise<Map<string, GeocodingResult>> {
  if (postcodes.length === 0) return new Map();
  if (postcodes.length > 100) {
    throw new Error("Batch geocoding limited to 100 postcodes at a time");
  }

  const normalized = postcodes.map(normalizePostcode);

  const response = await fetch("https://api.postcodes.io/postcodes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ postcodes: normalized }),
  });

  if (!response.ok) {
    throw new Error(
      `Postcodes.io batch API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as {
    status: number;
    result: Array<{
      query: string;
      result: PostcodesIoResponse["result"] | null;
    }>;
  };

  const results = new Map<string, GeocodingResult>();

  for (const item of data.result) {
    if (item.result) {
      results.set(item.query, {
        latitude: item.result.latitude,
        longitude: item.result.longitude,
        postcode: item.result.postcode,
        country: item.result.country,
        region: item.result.region,
        adminDistrict: item.result.admin_district,
        adminCounty: item.result.admin_county,
      });
    }
  }

  return results;
}

/**
 * Update user's geolocation from their postcode
 * Calls postcodes.io API and updates database
 * The geoPoint will be automatically updated by database trigger
 * 
 * @param userId - User ID to update
 * @throws Error if user has no postcode or geocoding fails
 */
export async function updateUserGeolocation(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { postcode: true },
  });

  if (!user?.postcode) {
    throw new Error("User has no postcode");
  }

  const geo = await geocodePostcode(user.postcode);

  await db.user.update({
    where: { id: userId },
    data: {
      latitude: geo.latitude,
      longitude: geo.longitude,
      // geoPoint will be auto-updated by database trigger
      geoUpdatedAt: new Date(),
      geoSource: "postcodes.io",
    },
  });
}
