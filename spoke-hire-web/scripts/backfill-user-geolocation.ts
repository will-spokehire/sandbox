import { db } from "~/server/db";
import { geocodePostcodesBatch } from "~/lib/services/geocoding";

/**
 * Backfill geolocation data for all users with postcodes
 * 
 * This script:
 * 1. Finds all users with postcodes but no geolocation data
 * 2. Geocodes them using postcodes.io API (batch mode)
 * 3. Updates the database with lat/long
 * 4. PostGIS trigger automatically updates geoPoint
 * 
 * Usage: npm run backfill-geolocation
 */
async function backfillUserGeolocation() {
  console.log("🗺️  Starting user geolocation backfill with PostGIS...\n");

  // Get all users with postcodes but no geolocation
  const users = await db.user.findMany({
    where: {
      postcode: { not: null },
      latitude: null,
    },
    select: {
      id: true,
      postcode: true,
      email: true,
    },
  });

  console.log(`Found ${users.length} users to geocode\n`);

  if (users.length === 0) {
    console.log("✅ No users need geocoding");
    return;
  }

  // Process in batches of 100 (postcodes.io limit)
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ userId: string; postcode: string; error: string }> = [];

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

      // Update users with geocoded data
      for (const user of batch) {
        if (!user.postcode) continue;

        const geo = results.get(user.postcode.replace(/\s+/g, "").toUpperCase());

        if (geo) {
          try {
            await db.user.update({
              where: { id: user.id },
              data: {
                latitude: geo.latitude,
                longitude: geo.longitude,
                // geoPoint will be auto-updated by database trigger
                geoUpdatedAt: new Date(),
                geoSource: "postcodes.io",
              },
            });
            successCount++;
            console.log(`  ✅ ${user.postcode} (${user.email}) → ${geo.latitude}, ${geo.longitude}`);
          } catch (error) {
            errorCount++;
            errors.push({
              userId: user.id,
              postcode: user.postcode,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            console.log(`  ❌ ${user.postcode} - Database update failed`);
          }
        } else {
          errorCount++;
          errors.push({
            userId: user.id,
            postcode: user.postcode,
            error: "Postcode not found in API response",
          });
          console.log(`  ❌ ${user.postcode} - Not found`);
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

  console.log("\n📊 Backfill Summary:");
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📍 Total processed: ${users.length}`);

  if (errors.length > 0) {
    console.log("\n❌ Failed Postcodes:");
    errors.slice(0, 20).forEach((err) => {
      console.log(`  ${err.postcode} (User: ${err.userId}) - ${err.error}`);
    });
    if (errors.length > 20) {
      console.log(`  ... and ${errors.length - 20} more errors`);
    }
  }

  console.log("\n✅ Backfill complete!");
  console.log("\n💡 Next steps:");
  console.log("  1. Run test-distance-filtering to verify the implementation");
  console.log("  2. Check the database to ensure geoPoint was auto-updated by trigger");
}

// Run the script
backfillUserGeolocation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
