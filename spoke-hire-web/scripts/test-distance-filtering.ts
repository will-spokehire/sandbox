import { db } from "~/server/db";
import { geocodePostcode } from "~/lib/services/geocoding";
import { calculateDistance } from "~/lib/services/distance";

/**
 * Test distance filtering with PostGIS
 * 
 * This script tests the PostGIS distance filtering implementation by:
 * 1. Geocoding a test postcode
 * 2. Running a PostGIS distance query
 * 3. Verifying results with Haversine formula
 * 4. Displaying performance metrics
 * 
 * Usage: npm run test-distance-filtering
 */
async function testDistanceFiltering() {
  console.log("🧪 Testing PostGIS distance filtering...\n");

  // Test postcode (you can change this)
  const testPostcode = "SW1A1AA"; // London - Westminster
  const maxDistance = 50; // miles

  console.log(`Test parameters:`);
  console.log(`  Postcode: ${testPostcode}`);
  console.log(`  Max distance: ${maxDistance} miles\n`);

  // Geocode test postcode
  console.log("📍 Geocoding test postcode...");
  const userGeo = await geocodePostcode(testPostcode);
  console.log(`User location:`);
  console.log(`  Lat: ${userGeo.latitude}`);
  console.log(`  Lon: ${userGeo.longitude}`);
  console.log(`  Country: ${userGeo.country}\n`);

  // Test PostGIS query with performance timing
  console.log("🔍 Running PostGIS distance query...");
  const startTime = Date.now();

  const vehicles = await db.$queryRaw<Array<any>>`
    SELECT 
      v.id,
      v.name,
      v."makeId",
      v."modelId",
      u."postcode",
      u."latitude",
      u."longitude",
      ST_Distance(
        u."geoPoint"::geography,
        ST_SetSRID(ST_MakePoint(${userGeo.longitude}, ${userGeo.latitude}), 4326)::geography
      ) * 0.000621371 as distance_miles
    FROM "Vehicle" v
    INNER JOIN "User" u ON v."ownerId" = u.id
    WHERE 
      u."latitude" IS NOT NULL 
      AND u."longitude" IS NOT NULL
      AND ST_DWithin(
        u."geoPoint"::geography,
        ST_SetSRID(ST_MakePoint(${userGeo.longitude}, ${userGeo.latitude}), 4326)::geography,
        ${maxDistance * 1609.34}
      )
    ORDER BY distance_miles ASC
    LIMIT 10
  `;

  const queryTime = Date.now() - startTime;

  console.log(`✅ Query completed in ${queryTime}ms`);
  console.log(`Found ${vehicles.length} vehicles within ${maxDistance} miles:\n`);

  if (vehicles.length === 0) {
    console.log("⚠️  No vehicles found within the specified distance.");
    console.log("   This might mean:");
    console.log("   1. No vehicles have geocoded owners in this area");
    console.log("   2. You need to run the backfill script first");
    console.log("   3. The test postcode is in a remote area\n");
    return;
  }

  // Display results and verify with Haversine
  vehicles.forEach((v, i) => {
    console.log(`${i + 1}. ${v.name}`);
    console.log(`   Postcode: ${v.postcode}`);
    console.log(`   PostGIS Distance: ${v.distance_miles.toFixed(2)} miles`);
    
    // Verify with Haversine formula
    const haversineDistance = calculateDistance(
      userGeo.latitude,
      userGeo.longitude,
      v.latitude,
      v.longitude,
      "miles"
    );
    console.log(`   Haversine Distance: ${haversineDistance.toFixed(2)} miles`);
    
    const difference = Math.abs(v.distance_miles - haversineDistance);
    const percentDiff = (difference / v.distance_miles) * 100;
    console.log(`   Difference: ${difference.toFixed(4)} miles (${percentDiff.toFixed(2)}%)`);
    
    if (difference > 0.1) {
      console.log(`   ⚠️  Warning: Significant difference detected`);
    }
    console.log();
  });

  // Performance summary
  console.log("📊 Performance Summary:");
  console.log(`  Query time: ${queryTime}ms`);
  console.log(`  Results: ${vehicles.length} vehicles`);
  console.log(`  Avg time per result: ${(queryTime / vehicles.length).toFixed(2)}ms`);

  // Test with different distances
  console.log("\n🔬 Testing different distance thresholds...");
  const distances = [5, 10, 25, 50, 100];
  
  for (const dist of distances) {
    const count = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "Vehicle" v
      INNER JOIN "User" u ON v."ownerId" = u.id
      WHERE 
        u."latitude" IS NOT NULL 
        AND u."longitude" IS NOT NULL
        AND ST_DWithin(
          u."geoPoint"::geography,
          ST_SetSRID(ST_MakePoint(${userGeo.longitude}, ${userGeo.latitude}), 4326)::geography,
          ${dist * 1609.34}
        )
    `;
    
    console.log(`  Within ${dist} miles: ${count[0]?.count ?? 0} vehicles`);
  }

  console.log("\n✅ Test complete!");
  console.log("\n💡 Next steps:");
  console.log("  1. Test the frontend by visiting /admin/vehicles");
  console.log("  2. Try filtering by postcode and distance");
  console.log("  3. Verify distance values match expectations");
}

// Run the script
testDistanceFiltering()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
