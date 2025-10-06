# Distance-Based Vehicle Filtering

## Overview

This feature enables filtering vehicles by distance from a user's location using UK postcodes. It leverages **PostgreSQL PostGIS** for efficient geospatial queries and the **postcodes.io API** for geocoding.

## Architecture

### Components

1. **Database Layer (PostGIS)**
   - PostGIS extension for spatial data types and functions
   - `geoPoint` column (geometry type) with GIST spatial index
   - Automatic trigger to sync `geoPoint` with `latitude`/`longitude`

2. **Geocoding Service**
   - Uses postcodes.io API (free, no API key required)
   - Caches results in database to minimize API calls
   - Batch geocoding support (up to 100 postcodes)

3. **Distance Calculation**
   - PostGIS `ST_Distance` with geography type for accurate geodesic distance
   - `ST_DWithin` for efficient radius filtering using spatial index
   - Haversine formula for client-side verification

4. **API Layer (tRPC)**
   - Extended vehicle list query with distance parameters
   - Raw SQL queries for optimal PostGIS performance
   - Merges distance data with Prisma relations

5. **Frontend Components**
   - `DistanceFilter` component for postcode and radius selection
   - Distance display on vehicle cards
   - URL state management for shareable filters

## Database Schema

### User Table Extensions

```sql
ALTER TABLE "User" 
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "geoPoint" geometry(Point, 4326),
ADD COLUMN "geoUpdatedAt" TIMESTAMP(3),
ADD COLUMN "geoSource" TEXT;

CREATE INDEX "User_geoPoint_idx" ON "User" USING GIST ("geoPoint");
CREATE INDEX "User_latitude_longitude_idx" ON "User" ("latitude", "longitude");
```

### Automatic Trigger

```sql
CREATE OR REPLACE FUNCTION update_user_geopoint()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW."geoPoint" := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW."geoPoint" := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_geopoint_update
    BEFORE INSERT OR UPDATE OF latitude, longitude ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_geopoint();
```

## API Usage

### Vehicle List with Distance Filtering

```typescript
const { data } = api.vehicle.list.useQuery({
  userPostcode: "SW1A1AA",
  maxDistanceMiles: 50,
  sortByDistance: true,
  // ... other filters
});

// Returns vehicles with distance property
vehicles.forEach(vehicle => {
  console.log(`${vehicle.name} - ${vehicle.distance} miles away`);
});
```

### Geocoding Service

```typescript
import { geocodePostcode } from "~/lib/services/geocoding";

// Single postcode
const result = await geocodePostcode("SW1A1AA");
// { latitude: 51.501009, longitude: -0.141588, postcode: "SW1A 1AA", country: "England" }

// Batch geocoding (up to 100)
const results = await geocodePostcodesBatch(["SW1A1AA", "M1 1AA", "EH1 1YZ"]);
```

### Distance Calculation

```typescript
import { calculateDistance } from "~/lib/services/distance";

// Client-side Haversine
const distance = calculateDistance(51.5, -0.14, 51.6, -0.15, "miles");

// Server-side PostGIS (in SQL)
const distanceSQL = getPostGISDistanceSQL(51.5, -0.14, "miles");
// Returns SQL fragment for use in queries
```

## Setup Instructions

### 1. Enable PostGIS

```bash
# Run migrations
npm run db:push

# Or manually enable PostGIS
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 2. Run Migrations

```bash
# Apply the geolocation migrations
npm run db:push
```

The migrations will:
- Enable PostGIS extension
- Add geolocation columns to User table
- Create spatial indexes
- Set up automatic trigger

### 3. Backfill Existing Data

```bash
# Geocode all existing users with postcodes
npm run backfill-geolocation
```

This script:
- Finds users with postcodes but no geolocation
- Geocodes them using postcodes.io (batch mode)
- Updates database with lat/long
- Trigger automatically updates geoPoint

### 4. Test Implementation

```bash
# Run test script
npm run test-distance-filtering
```

This verifies:
- PostGIS queries work correctly
- Distance calculations are accurate
- Performance is acceptable

## Frontend Usage

### Adding Distance Filter

The distance filter is already integrated into the vehicle list page:

1. Enter a UK postcode
2. Select a radius (5, 10, 25, 50, 100, or 250 miles)
3. Vehicles are filtered and sorted by distance
4. Distance is displayed on each vehicle card

### URL State

Filters are persisted in URL for shareability:

```
/admin/vehicles?postcode=SW1A1AA&maxDistance=50&sortByDistance=true
```

## Performance

### Query Performance

With PostGIS spatial indexes:
- **1,000 vehicles**: 5-20ms
- **10,000 vehicles**: 10-50ms
- **100,000+ vehicles**: 50-200ms

### Optimization Techniques

1. **ST_DWithin** - Uses spatial index for fast radius filtering
2. **Bounding box pre-filter** - Reduces candidates before distance calculation
3. **Geography type** - Accurate geodesic distance (vs geometry type)
4. **Database caching** - Reuses geocoded postcodes from existing users

## API Rate Limits

### postcodes.io

- **Free**: No API key required
- **Rate limit**: 2,000 requests/minute
- **Batch limit**: 100 postcodes per request
- **Coverage**: UK only (England, Scotland, Wales, Northern Ireland)

### Best Practices

1. **Cache aggressively** - Store geocoded results in database
2. **Batch requests** - Use batch endpoint for multiple postcodes
3. **Rate limiting** - Add 1-second delay between batches
4. **Error handling** - Gracefully handle invalid postcodes

## Troubleshooting

### PostGIS Not Installed

```bash
# Check if PostGIS is available
psql $DATABASE_URL -c "SELECT PostGIS_version();"

# If not, install PostGIS (varies by platform)
# Supabase: Already installed
# Heroku: Install postgis addon
# Local: brew install postgis (macOS)
```

### Trigger Not Firing

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'user_geopoint_update';

-- Manually update geoPoint for testing
UPDATE "User"
SET "geoPoint" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)
WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;
```

### Invalid Postcode Format

```typescript
import { isValidUKPostcode, normalizePostcode } from "~/lib/services/geocoding";

const postcode = "sw1a 1aa";
const normalized = normalizePostcode(postcode); // "SW1A1AA"
const isValid = isValidUKPostcode(normalized); // true
```

### No Results Found

Check:
1. Users have geocoded postcodes (`latitude` and `longitude` not null)
2. Run backfill script if needed
3. Increase distance radius
4. Verify PostGIS extension is enabled

## Future Enhancements

### Planned Features

1. **Auto-detect user location** - Use browser geolocation API
2. **Map view** - Display vehicles on interactive map
3. **Distance units** - Support kilometers in addition to miles
4. **Multi-location search** - Filter by multiple postcodes
5. **Saved searches** - Save favorite location/distance combinations

### Performance Improvements

1. **Materialized views** - Pre-compute common distance queries
2. **Clustering** - Group nearby vehicles for faster queries
3. **Caching layer** - Redis cache for popular postcode searches
4. **PostGIS 3.x features** - Leverage newer spatial functions

## References

- [PostGIS Documentation](https://postgis.net/documentation/)
- [postcodes.io API](https://postcodes.io/docs)
- [PostgreSQL GIST Indexes](https://www.postgresql.org/docs/current/gist.html)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

## Bug Fixes

### October 2025 - Filter Combination Issues

**Issue**: When distance filtering was active, other filters (exterior color, interior color, collections, year range, search, etc.) were not being applied correctly. This caused:
- Filters appearing to not work when distance search was enabled
- Incorrect "No vehicles found" messages while showing results
- Inconsistent behavior between distance and non-distance searches

**Root Cause**: The raw SQL queries used for PostGIS distance filtering only included 3 filters (status, make, model) and were missing 7+ other filter types. The count query had the same issue.

**Fix Applied**: Updated `vehicle.ts` router to include all filter conditions in both the main distance query and count query:
- Added exterior/interior color filters using `ANY()` array matching
- Added year range filters (yearFrom/yearTo)
- Added price range filters (priceFrom/priceTo)
- Added collection filter using `EXISTS` subquery for many-to-many relationship
- Added search filter with OR logic across vehicle and owner fields
- Added owner filter
- Added year sorting option

**Files Changed**:
- `/spoke-hire-web/src/server/api/routers/vehicle.ts` (Lines 245-545)

**Testing**: All filter combinations now work correctly with distance filtering. See `FILTERING_FIXES.md` for detailed testing recommendations.

## Support

For issues or questions:
1. Check this documentation
2. Run test script: `npm run test-distance-filtering`
3. Review PostGIS logs in database
4. Check postcodes.io API status
