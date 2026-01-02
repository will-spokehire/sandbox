#!/usr/bin/env tsx

/**
 * Check Vehicle Geo Data
 * 
 * This script analyzes the geo data completeness for vehicles and their owners.
 * It checks:
 * - User address fields (street, city, county, postcode, country)
 * - Geocoding data (latitude, longitude, geoPoint)
 * - Data completeness and quality
 * 
 * Helps identify which vehicles need geo data enrichment.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
};
const hasFlag = (name: string) => args.includes(`--${name}`);

// Configuration
const CONFIG = {
  LIMIT: getArg('limit') ? parseInt(getArg('limit')!) : undefined,
  EXPORT_CSV: hasFlag('export-csv'),
  EXPORT_JSON: hasFlag('export-json'),
  SHOW_COMPLETE: hasFlag('show-complete'),
  SHOW_MISSING_ONLY: hasFlag('missing-only'),
  SOURCE_TYPE: getArg('source-type'), // Filter by source type
};

// Types
interface GeoDataCheck {
  vehicleId: string;
  vehicleName: string;
  registration: string;
  userId: string;
  userEmail: string;
  userName: string;
  sourceType: string | null;
  sourceId: string | null;
  
  // Address fields
  hasStreet: boolean;
  hasCity: boolean;
  hasCounty: boolean;
  hasPostcode: boolean;
  hasCountry: boolean;
  
  // Geo coordinates
  hasLatitude: boolean;
  hasLongitude: boolean;
  hasGeoPoint: boolean;
  
  // Raw values
  street: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  countryCode: string | null;
  countryName: string | null;
  latitude: number | null;
  longitude: number | null;
  geoSource: string | null;
  geoUpdatedAt: Date | null;
  
  // Completeness metrics
  addressComplete: boolean;
  geoComplete: boolean;
  fullyComplete: boolean;
  completenessScore: number; // 0-100
}

interface Stats {
  totalVehicles: number;
  totalUsers: number;
  
  // Address completeness
  withStreet: number;
  withCity: number;
  withCounty: number;
  withPostcode: number;
  withCountry: number;
  withFullAddress: number;
  
  // Geo completeness
  withLatLng: number;
  withGeoPoint: number;
  withGeoSource: number;
  withFullGeo: number;
  
  // Overall
  fullyComplete: number;
  partiallyComplete: number;
  missingAddress: number;
  missingGeo: number;
  missingEverything: number;
  
  // By source type
  bySourceType: Record<string, {
    count: number;
    fullyComplete: number;
    missingGeo: number;
  }>;
}

/**
 * Calculate completeness score (0-100)
 */
function calculateCompletenessScore(check: GeoDataCheck): number {
  const weights = {
    postcode: 25,   // Most important for UK geocoding
    city: 15,
    county: 10,
    street: 10,
    country: 10,
    latitude: 15,
    longitude: 15,
  };
  
  let score = 0;
  if (check.hasPostcode) score += weights.postcode;
  if (check.hasCity) score += weights.city;
  if (check.hasCounty) score += weights.county;
  if (check.hasStreet) score += weights.street;
  if (check.hasCountry) score += weights.country;
  if (check.hasLatitude) score += weights.latitude;
  if (check.hasLongitude) score += weights.longitude;
  
  return score;
}

/**
 * Check a single vehicle's geo data
 */
function checkVehicleGeoData(
  vehicle: any,
  user: any,
  vehicleSource: any
): GeoDataCheck {
  const check: GeoDataCheck = {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    registration: vehicle.registration ?? 'N/A',
    userId: user.id,
    userEmail: user.email,
    userName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A',
    sourceType: vehicleSource?.sourceType ?? null,
    sourceId: vehicleSource?.sourceId ?? null,
    
    // Check address fields
    hasStreet: !!user.street?.trim(),
    hasCity: !!user.city?.trim(),
    hasCounty: !!user.county?.trim(),
    hasPostcode: !!user.postcode?.trim(),
    hasCountry: !!user.country,
    
    // Check geo coordinates
    hasLatitude: user.latitude !== null,
    hasLongitude: user.longitude !== null,
    hasGeoPoint: user.geoPoint !== null,
    
    // Raw values
    street: user.street,
    city: user.city,
    county: user.county,
    postcode: user.postcode,
    countryCode: user.country?.code ?? null,
    countryName: user.country?.name ?? null,
    latitude: user.latitude,
    longitude: user.longitude,
    geoSource: user.geoSource,
    geoUpdatedAt: user.geoUpdatedAt,
    
    // Completeness
    addressComplete: false,
    geoComplete: false,
    fullyComplete: false,
    completenessScore: 0,
  };
  
  // Address is complete if has postcode at minimum (city/county recommended)
  check.addressComplete = check.hasPostcode && check.hasCity;
  
  // Geo is complete if has lat/lng
  check.geoComplete = check.hasLatitude && check.hasLongitude;
  
  // Fully complete if both address and geo are complete
  check.fullyComplete = check.addressComplete && check.geoComplete;
  
  // Calculate score
  check.completenessScore = calculateCompletenessScore(check);
  
  return check;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Checking Vehicle Geo Data\n');
  console.log('Configuration:');
  console.log(`  Limit: ${CONFIG.LIMIT ?? 'all'}`);
  console.log(`  Source Type Filter: ${CONFIG.SOURCE_TYPE ?? 'all'}`);
  console.log(`  Show Complete: ${CONFIG.SHOW_COMPLETE ? 'yes' : 'no'}`);
  console.log(`  Missing Only: ${CONFIG.SHOW_MISSING_ONLY ? 'yes' : 'no'}`);
  console.log(`  Export CSV: ${CONFIG.EXPORT_CSV ? 'yes' : 'no'}`);
  console.log(`  Export JSON: ${CONFIG.EXPORT_JSON ? 'yes' : 'no'}`);
  console.log('');

  // Fetch vehicles with user and source data
  const vehicles = await prisma.vehicle.findMany({
    take: CONFIG.LIMIT,
    include: {
      owner: {
        include: {
          country: true,
        },
      },
      sources: {
        take: 1, // Get primary source
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📋 Found ${vehicles.length} vehicles\n`);
  console.log('='.repeat(80));

  // Initialize stats
  const stats: Stats = {
    totalVehicles: vehicles.length,
    totalUsers: new Set(vehicles.map((v) => v.ownerId)).size,
    withStreet: 0,
    withCity: 0,
    withCounty: 0,
    withPostcode: 0,
    withCountry: 0,
    withFullAddress: 0,
    withLatLng: 0,
    withGeoPoint: 0,
    withGeoSource: 0,
    withFullGeo: 0,
    fullyComplete: 0,
    partiallyComplete: 0,
    missingAddress: 0,
    missingGeo: 0,
    missingEverything: 0,
    bySourceType: {},
  };

  const results: GeoDataCheck[] = [];

  // Check each vehicle
  for (const vehicle of vehicles) {
    const vehicleSource = vehicle.sources[0];
    
    // Apply source type filter
    if (CONFIG.SOURCE_TYPE && vehicleSource?.sourceType !== CONFIG.SOURCE_TYPE) {
      continue;
    }
    
    const check = checkVehicleGeoData(vehicle, vehicle.owner, vehicleSource);
    results.push(check);
    
    // Update stats
    if (check.hasStreet) stats.withStreet++;
    if (check.hasCity) stats.withCity++;
    if (check.hasCounty) stats.withCounty++;
    if (check.hasPostcode) stats.withPostcode++;
    if (check.hasCountry) stats.withCountry++;
    if (check.addressComplete) stats.withFullAddress++;
    if (check.hasLatitude && check.hasLongitude) stats.withLatLng++;
    if (check.hasGeoPoint) stats.withGeoPoint++;
    if (check.geoSource) stats.withGeoSource++;
    if (check.geoComplete) stats.withFullGeo++;
    
    if (check.fullyComplete) {
      stats.fullyComplete++;
    } else if (check.addressComplete || check.geoComplete) {
      stats.partiallyComplete++;
    } else if (!check.addressComplete && !check.geoComplete) {
      stats.missingEverything++;
    }
    
    if (!check.addressComplete) stats.missingAddress++;
    if (!check.geoComplete) stats.missingGeo++;
    
    // Track by source type
    const sourceType = check.sourceType ?? 'unknown';
    if (!stats.bySourceType[sourceType]) {
      stats.bySourceType[sourceType] = {
        count: 0,
        fullyComplete: 0,
        missingGeo: 0,
      };
    }
    stats.bySourceType[sourceType]!.count++;
    if (check.fullyComplete) stats.bySourceType[sourceType]!.fullyComplete++;
    if (!check.geoComplete) stats.bySourceType[sourceType]!.missingGeo++;
    
    // Display individual results
    const shouldDisplay = 
      (!CONFIG.SHOW_MISSING_ONLY && !CONFIG.SHOW_COMPLETE) ||
      (CONFIG.SHOW_MISSING_ONLY && !check.fullyComplete) ||
      (CONFIG.SHOW_COMPLETE && check.fullyComplete);
    
    if (shouldDisplay) {
      console.log(`\n🚗 ${check.vehicleName} (${check.registration})`);
      console.log(`   User: ${check.userName} (${check.userEmail})`);
      console.log(`   Source: ${check.sourceType ?? 'N/A'} (${check.sourceId ?? 'N/A'})`);
      console.log(`   Score: ${check.completenessScore}/100`);
      
      // Address
      console.log(`   Address:`);
      console.log(`     ${check.hasPostcode ? '✓' : '✗'} Postcode: ${check.postcode ?? 'missing'}`);
      console.log(`     ${check.hasCity ? '✓' : '✗'} City: ${check.city ?? 'missing'}`);
      console.log(`     ${check.hasCounty ? '✓' : '✗'} County: ${check.county ?? 'missing'}`);
      console.log(`     ${check.hasStreet ? '✓' : '✗'} Street: ${check.street ?? 'missing'}`);
      console.log(`     ${check.hasCountry ? '✓' : '✗'} Country: ${check.countryName ?? 'missing'}`);
      
      // Geo
      console.log(`   Geo:`);
      console.log(`     ${check.hasLatitude ? '✓' : '✗'} Latitude: ${check.latitude ?? 'missing'}`);
      console.log(`     ${check.hasLongitude ? '✓' : '✗'} Longitude: ${check.longitude ?? 'missing'}`);
      console.log(`     ${check.hasGeoPoint ? '✓' : '✗'} GeoPoint: ${check.hasGeoPoint ? 'yes' : 'missing'}`);
      console.log(`     Source: ${check.geoSource ?? 'none'}`);
      console.log(`     Updated: ${check.geoUpdatedAt?.toISOString() ?? 'never'}`);
      
      // Status
      if (check.fullyComplete) {
        console.log(`   ✅ FULLY COMPLETE`);
      } else if (check.addressComplete && !check.geoComplete) {
        console.log(`   ⚠️  NEEDS GEOCODING`);
      } else if (check.geoComplete && !check.addressComplete) {
        console.log(`   ⚠️  HAS GEO BUT MISSING ADDRESS`);
      } else {
        console.log(`   ❌ MISSING DATA`);
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY\n');
  
  console.log(`Vehicles: ${stats.totalVehicles}`);
  console.log(`Unique Users: ${stats.totalUsers}`);
  console.log('');
  
  console.log('Address Data:');
  console.log(`  With Postcode: ${stats.withPostcode} (${((stats.withPostcode / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  With City: ${stats.withCity} (${((stats.withCity / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  With County: ${stats.withCounty} (${((stats.withCounty / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  With Street: ${stats.withStreet} (${((stats.withStreet / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  With Country: ${stats.withCountry} (${((stats.withCountry / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  Full Address: ${stats.withFullAddress} (${((stats.withFullAddress / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log('');
  
  console.log('Geo Data:');
  console.log(`  With Lat/Lng: ${stats.withLatLng} (${((stats.withLatLng / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  With GeoPoint: ${stats.withGeoPoint} (${((stats.withGeoPoint / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  With Source: ${stats.withGeoSource} (${((stats.withGeoSource / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  Full Geo: ${stats.withFullGeo} (${((stats.withFullGeo / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log('');
  
  console.log('Completeness:');
  console.log(`  Fully Complete: ${stats.fullyComplete} (${((stats.fullyComplete / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  Partially Complete: ${stats.partiallyComplete} (${((stats.partiallyComplete / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  Missing Address: ${stats.missingAddress} (${((stats.missingAddress / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  Missing Geo: ${stats.missingGeo} (${((stats.missingGeo / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log(`  Missing Everything: ${stats.missingEverything} (${((stats.missingEverything / stats.totalVehicles) * 100).toFixed(1)}%)`);
  console.log('');
  
  console.log('By Source Type:');
  Object.entries(stats.bySourceType)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([sourceType, data]) => {
      console.log(`  ${sourceType}:`);
      console.log(`    Total: ${data.count}`);
      console.log(`    Fully Complete: ${data.fullyComplete} (${((data.fullyComplete / data.count) * 100).toFixed(1)}%)`);
      console.log(`    Missing Geo: ${data.missingGeo} (${((data.missingGeo / data.count) * 100).toFixed(1)}%)`);
    });

  // Export results if requested
  if (CONFIG.EXPORT_CSV) {
    const csvPath = path.join(process.cwd(), 'geodata-check-results.csv');
    const csvLines = [
      'Vehicle ID,Vehicle Name,Registration,User Email,User Name,Source Type,Source ID,' +
      'Has Postcode,Has City,Has County,Has Street,Has Country,' +
      'Has Lat,Has Lng,Has GeoPoint,Geo Source,Geo Updated,' +
      'Address Complete,Geo Complete,Fully Complete,Score,' +
      'Postcode,City,County,Street,Country,Latitude,Longitude',
    ];
    
    results.forEach((r) => {
      csvLines.push([
        r.vehicleId,
        `"${r.vehicleName}"`,
        `"${r.registration}"`,
        r.userEmail,
        `"${r.userName}"`,
        r.sourceType ?? '',
        r.sourceId ?? '',
        r.hasPostcode ? 'Y' : 'N',
        r.hasCity ? 'Y' : 'N',
        r.hasCounty ? 'Y' : 'N',
        r.hasStreet ? 'Y' : 'N',
        r.hasCountry ? 'Y' : 'N',
        r.hasLatitude ? 'Y' : 'N',
        r.hasLongitude ? 'Y' : 'N',
        r.hasGeoPoint ? 'Y' : 'N',
        r.geoSource ?? '',
        r.geoUpdatedAt?.toISOString() ?? '',
        r.addressComplete ? 'Y' : 'N',
        r.geoComplete ? 'Y' : 'N',
        r.fullyComplete ? 'Y' : 'N',
        r.completenessScore.toString(),
        `"${r.postcode ?? ''}"`,
        `"${r.city ?? ''}"`,
        `"${r.county ?? ''}"`,
        `"${r.street ?? ''}"`,
        `"${r.countryName ?? ''}"`,
        r.latitude?.toString() ?? '',
        r.longitude?.toString() ?? '',
      ].join(','));
    });
    
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`\n💾 CSV exported to: ${csvPath}`);
  }
  
  if (CONFIG.EXPORT_JSON) {
    const jsonPath = path.join(process.cwd(), 'geodata-check-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ stats, results }, null, 2));
    console.log(`💾 JSON exported to: ${jsonPath}`);
  }
  
  console.log('\n✅ Done!\n');
  
  await prisma.$disconnect();
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Script failed:', error);
  prisma.$disconnect();
  process.exit(1);
});






