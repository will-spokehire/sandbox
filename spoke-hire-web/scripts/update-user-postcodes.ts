import { db } from "~/server/db";
import { geocodePostcodesBatch, normalizePostcode } from "~/lib/services/geocoding";
import { UK_CITIES, UK_COUNTIES } from "~/lib/constants/uk-locations";
import type { GeocodingResult } from "~/lib/services/geocoding";

/**
 * Update city, county, and country data for OWNER_ONLY users with postcodes
 * 
 * This script:
 * 1. Finds all OWNER_ONLY users with postcodes
 * 2. Geocodes them using postcodes.io API (batch mode)
 * 3. Validates cities/counties against UK_CITIES and UK_COUNTIES lists
 * 4. Applies London/Greater London special handling
 * 5. Updates the database with validated data
 * 
 * Usage: npm run update-postcodes
 */
async function updateUserPostcodes() {
  console.log("🗺️  Starting user postcode data update...\n");

  // Get all OWNER_ONLY users with postcodes
  const users = await db.user.findMany({
    where: {
      userType: "OWNER_ONLY",
      postcode: { not: null },
    },
    select: {
      id: true,
      postcode: true,
      email: true,
      city: true,
      county: true,
      country: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`Found ${users.length} OWNER_ONLY users with postcodes\n`);

  if (users.length === 0) {
    console.log("✅ No users need updating");
    return;
  }

  // Process in batches of 100 (postcodes.io limit)
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ userId: string; postcode: string; error: string }> = [];
  const unmatchedCities = new Map<string, number>(); // city -> count
  const unmatchedCounties = new Map<string, number>(); // county -> count

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const postcodes = batch
      .map((u) => u.postcode)
      .filter((p): p is string => p !== null);

    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}...`
    );

    try {
      const results = await geocodePostcodesBatch(postcodes);

      // Update users with geocoded and validated data
      for (const user of batch) {
        if (!user.postcode) continue;

        const geo = results.get(normalizePostcode(user.postcode));

        if (geo) {
          try {
            // Process location data with London/Greater London rules and validation
            const locationData = processLocationData(geo);
            
            // Track unmatched cities and counties
            if (locationData.unmatchedCity) {
              unmatchedCities.set(
                locationData.unmatchedCity,
                (unmatchedCities.get(locationData.unmatchedCity) ?? 0) + 1
              );
            }
            if (locationData.unmatchedCounty) {
              unmatchedCounties.set(
                locationData.unmatchedCounty,
                (unmatchedCounties.get(locationData.unmatchedCounty) ?? 0) + 1
              );
            }
            
            // Look up country ID from database
            const country = await db.country.findFirst({
              where: {
                name: {
                  equals: geo.country,
                  mode: "insensitive",
                },
              },
              select: { id: true },
            });

            await db.user.update({
              where: { id: user.id },
              data: {
                city: locationData.city,
                county: locationData.county,
                countryId: country?.id ?? undefined,
                latitude: geo.latitude,
                longitude: geo.longitude,
                geoUpdatedAt: new Date(),
                geoSource: "postcodes.io",
              },
            });

            successCount++;
            const cityInfo = locationData.unmatchedCity 
              ? `"${locationData.city}" (API returned: "${locationData.unmatchedCity}" - not in UK_CITIES)`
              : `"${locationData.city}"`;
            const countyInfo = locationData.unmatchedCounty
              ? `"${locationData.county}" (API returned: "${locationData.unmatchedCounty}" - not in UK_COUNTIES)`
              : `"${locationData.county}"`;
            console.log(
              `  ✅ ${user.postcode} (${user.email}) → City: ${cityInfo}, County: ${countyInfo}, Country: ${geo.country}`
            );
          } catch (error) {
            errorCount++;
            errors.push({
              userId: user.id,
              postcode: user.postcode,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            console.log(`  ❌ ${user.postcode} - Database update failed: ${String(error)}`);
          }
        } else {
          errorCount++;
          errors.push({
            userId: user.id,
            postcode: user.postcode,
            error: "Postcode not found in API response",
          });
          console.log(`  ⚠️  ${user.postcode} - Not found in API response (keeping existing data)`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Batch geocoding failed:`, error);
      errorCount += batch.length;
      batch.forEach((user) => {
        if (user.postcode) {
          errors.push({
            userId: user.id,
            postcode: user.postcode,
            error: error instanceof Error ? error.message : "Batch API call failed",
          });
        }
      });
    }

    // Rate limiting - wait 1 second between batches
    if (i + batchSize < users.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log("\n📊 Update Summary:");
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📍 Total processed: ${users.length}`);

  if (unmatchedCities.size > 0) {
    console.log("\n🏙️  Cities not in UK_CITIES list (set to empty string):");
    const sortedCities = Array.from(unmatchedCities.entries())
      .sort((a, b) => b[1] - a[1]); // Sort by count descending
    sortedCities.forEach(([city, count]) => {
      console.log(`  "${city}" - ${count} occurrence(s)`);
    });
    console.log(`  Total unmatched cities: ${unmatchedCities.size}`);
  }

  if (unmatchedCounties.size > 0) {
    console.log("\n🏘️  Counties not in UK_COUNTIES list (set to empty string):");
    const sortedCounties = Array.from(unmatchedCounties.entries())
      .sort((a, b) => b[1] - a[1]); // Sort by count descending
    sortedCounties.forEach(([county, count]) => {
      console.log(`  "${county}" - ${count} occurrence(s)`);
    });
    console.log(`  Total unmatched counties: ${unmatchedCounties.size}`);
  }

  if (errors.length > 0) {
    console.log("\n❌ Failed Postcodes:");
    errors.slice(0, 20).forEach((err) => {
      console.log(`  ${err.postcode} (User: ${err.userId}) - ${err.error}`);
    });
    if (errors.length > 20) {
      console.log(`  ... and ${errors.length - 20} more errors`);
    }
  }

  console.log("\n✅ Update complete!");
}

/**
 * Process location data from geocoding API result
 * Applies London/Greater London rules and validates against UK_CITIES and UK_COUNTIES
 */
function processLocationData(geo: GeocodingResult): {
  city: string;
  county: string;
  unmatchedCity?: string;
  unmatchedCounty?: string;
} {
  // For London postcodes, use region as city (e.g., "London")
  // For other postcodes, use admin_district as city (e.g., "Sevenoaks")
  const cityFromApi = geo.region === "London" 
    ? "London" 
    : (geo.adminDistrict ?? "");

  // For London, use "Greater London" as county to match UK_COUNTIES list
  // For other postcodes, use admin_county
  const countyFromApi = geo.region === "London" 
    ? "Greater London" 
    : (geo.adminCounty ?? "");

  // Only populate city if it exists in our UK_CITIES list
  const cityMatches = UK_CITIES.includes(cityFromApi as typeof UK_CITIES[number]);
  const city = cityMatches ? cityFromApi : "";
  const unmatchedCity = !cityMatches && cityFromApi ? cityFromApi : undefined;

  // Only populate county if it exists in our UK_COUNTIES list
  const countyMatches = UK_COUNTIES.includes(countyFromApi as typeof UK_COUNTIES[number]);
  const county = countyMatches ? countyFromApi : "";
  const unmatchedCounty = !countyMatches && countyFromApi ? countyFromApi : undefined;

  return { city, county, unmatchedCity, unmatchedCounty };
}

// Run the script
updateUserPostcodes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });

