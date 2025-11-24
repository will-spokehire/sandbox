#!/usr/bin/env tsx

/**
 * Compare Cleansed CSV Geo Data with Database
 * 
 * This script compares the geo data from the cleansed CSV with what's 
 * currently in the database to identify:
 * - Data that was lost during migration
 * - Data that differs between CSV and DB
 * - Missing data that was in CSV but not imported
 * - Completeness comparison
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  CSV_FILE: path.join(__dirname, '../../data-analytics/data/cleansed_database.csv'),
  LIMIT: getArg('limit') ? parseInt(getArg('limit')!) : undefined,
  SHOW_MATCHES: hasFlag('show-matches'),
  SHOW_MISMATCHES_ONLY: hasFlag('mismatches-only'),
  SHOW_DATA_LOST_ONLY: hasFlag('data-lost-only'),
  EXPORT_CSV: hasFlag('export-csv'),
  WIX_ID: getArg('wix-id'),
};

// Types
interface CSVRow {
  'Wix ID': string;
  'First name': string;
  'Last name': string;
  'Email': string;
  'Phone': string;
  'Street address': string;
  'City': string;
  'County': string;
  'Postcode': string;
  'Country': string;
  'Registration': string;
  'Make': string;
  'Model': string;
}

interface ComparisonResult {
  wixId: string;
  vehicleName: string;
  registration: string;
  userEmail: string;
  foundInDB: boolean;
  
  // CSV data
  csvStreet: string;
  csvCity: string;
  csvCounty: string;
  csvPostcode: string;
  csvCountry: string;
  
  // DB data
  dbStreet: string | null;
  dbCity: string | null;
  dbCounty: string | null;
  dbPostcode: string | null;
  dbCountryName: string | null;
  dbLatitude: number | null;
  dbLongitude: number | null;
  dbGeoSource: string | null;
  
  // Comparison
  streetMatch: boolean;
  cityMatch: boolean;
  countyMatch: boolean;
  postcodeMatch: boolean;
  countryMatch: boolean;
  hasGeoData: boolean;
  
  // Status
  dataLost: boolean;        // Data in CSV but not in DB
  dataAdded: boolean;       // Data in DB but not in CSV (e.g., geocoding)
  fullyMatched: boolean;    // All fields match
  
  issues: string[];
}

interface Stats {
  totalInCSV: number;
  foundInDB: number;
  notFoundInDB: number;
  
  // Field completeness
  csvWithStreet: number;
  csvWithCity: number;
  csvWithCounty: number;
  csvWithPostcode: number;
  csvWithCountry: number;
  
  dbWithStreet: number;
  dbWithCity: number;
  dbWithCounty: number;
  dbWithPostcode: number;
  dbWithCountry: number;
  dbWithGeo: number;
  
  // Match rates
  streetMatches: number;
  cityMatches: number;
  countyMatches: number;
  postcodeMatches: number;
  countryMatches: number;
  
  // Data quality
  dataLostCount: number;
  dataAddedCount: number;
  fullyMatchedCount: number;
  partialMatchCount: number;
}

/**
 * Normalize string for comparison
 */
function normalize(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Compare two values
 */
function valuesMatch(csv: string, db: string | null): boolean {
  const csvNorm = normalize(csv);
  const dbNorm = normalize(db);
  
  if (!csvNorm && !dbNorm) return true; // Both empty
  if (!csvNorm || !dbNorm) return false; // One empty
  
  return csvNorm === dbNorm;
}

/**
 * Compare CSV data with DB data
 */
async function compareData(
  csvRow: CSVRow,
  stats: Stats
): Promise<ComparisonResult> {
  const wixId = csvRow['Wix ID'];
  const result: ComparisonResult = {
    wixId,
    vehicleName: `${csvRow['Make']} ${csvRow['Model']}`,
    registration: csvRow['Registration'] || 'N/A',
    userEmail: csvRow['Email'],
    foundInDB: false,
    
    csvStreet: csvRow['Street address'],
    csvCity: csvRow['City'],
    csvCounty: csvRow['County'],
    csvPostcode: csvRow['Postcode'],
    csvCountry: csvRow['Country'],
    
    dbStreet: null,
    dbCity: null,
    dbCounty: null,
    dbPostcode: null,
    dbCountryName: null,
    dbLatitude: null,
    dbLongitude: null,
    dbGeoSource: null,
    
    streetMatch: false,
    cityMatch: false,
    countyMatch: false,
    postcodeMatch: false,
    countryMatch: false,
    hasGeoData: false,
    
    dataLost: false,
    dataAdded: false,
    fullyMatched: false,
    
    issues: [],
  };
  
  // Track CSV completeness
  if (result.csvStreet) stats.csvWithStreet++;
  if (result.csvCity) stats.csvWithCity++;
  if (result.csvCounty) stats.csvWithCounty++;
  if (result.csvPostcode) stats.csvWithPostcode++;
  if (result.csvCountry) stats.csvWithCountry++;
  
  // Find vehicle in database
  const vehicleSource = await prisma.vehicleSource.findFirst({
    where: {
      sourceId: wixId,
      sourceType: {
        in: ['processed_catalog', 'catalog', 'cleansed'],
      },
    },
    include: {
      vehicle: {
        include: {
          owner: {
            include: {
              country: true,
            },
          },
        },
      },
    },
  });
  
  if (!vehicleSource) {
    stats.notFoundInDB++;
    result.issues.push('Vehicle not found in database');
    return result;
  }
  
  result.foundInDB = true;
  stats.foundInDB++;
  
  const user = vehicleSource.vehicle.owner;
  
  // Extract DB data
  result.dbStreet = user.street;
  result.dbCity = user.city;
  result.dbCounty = user.county;
  result.dbPostcode = user.postcode;
  result.dbCountryName = user.country?.name ?? null;
  result.dbLatitude = user.latitude;
  result.dbLongitude = user.longitude;
  result.dbGeoSource = user.geoSource;
  
  // Track DB completeness
  if (result.dbStreet) stats.dbWithStreet++;
  if (result.dbCity) stats.dbWithCity++;
  if (result.dbCounty) stats.dbWithCounty++;
  if (result.dbPostcode) stats.dbWithPostcode++;
  if (result.dbCountryName) stats.dbWithCountry++;
  if (result.dbLatitude && result.dbLongitude) {
    stats.dbWithGeo++;
    result.hasGeoData = true;
    result.dataAdded = true; // Geo data added after import
  }
  
  // Compare fields
  result.streetMatch = valuesMatch(result.csvStreet, result.dbStreet);
  result.cityMatch = valuesMatch(result.csvCity, result.dbCity);
  result.countyMatch = valuesMatch(result.csvCounty, result.dbCounty);
  result.postcodeMatch = valuesMatch(result.csvPostcode, result.dbPostcode);
  result.countryMatch = valuesMatch(result.csvCountry, result.dbCountryName);
  
  // Track matches
  if (result.streetMatch) stats.streetMatches++;
  if (result.cityMatch) stats.cityMatches++;
  if (result.countyMatch) stats.countyMatches++;
  if (result.postcodeMatch) stats.postcodeMatches++;
  if (result.countryMatch) stats.countryMatches++;
  
  // Check for data loss
  const fieldsLost: string[] = [];
  if (result.csvStreet && !result.dbStreet) fieldsLost.push('street');
  if (result.csvCity && !result.dbCity) fieldsLost.push('city');
  if (result.csvCounty && !result.dbCounty) fieldsLost.push('county');
  if (result.csvPostcode && !result.dbPostcode) fieldsLost.push('postcode');
  if (result.csvCountry && !result.dbCountryName) fieldsLost.push('country');
  
  if (fieldsLost.length > 0) {
    result.dataLost = true;
    stats.dataLostCount++;
    result.issues.push(`Data lost: ${fieldsLost.join(', ')}`);
  }
  
  // Check for mismatches
  const mismatches: string[] = [];
  if (result.csvStreet && result.dbStreet && !result.streetMatch) {
    mismatches.push('street');
  }
  if (result.csvCity && result.dbCity && !result.cityMatch) {
    mismatches.push('city');
  }
  if (result.csvCounty && result.dbCounty && !result.countyMatch) {
    mismatches.push('county');
  }
  if (result.csvPostcode && result.dbPostcode && !result.postcodeMatch) {
    mismatches.push('postcode');
  }
  if (result.csvCountry && result.dbCountryName && !result.countryMatch) {
    mismatches.push('country');
  }
  
  if (mismatches.length > 0) {
    result.issues.push(`Mismatched: ${mismatches.join(', ')}`);
  }
  
  // Overall status
  result.fullyMatched = 
    result.streetMatch &&
    result.cityMatch &&
    result.countyMatch &&
    result.postcodeMatch &&
    result.countryMatch &&
    !result.dataLost;
  
  if (result.fullyMatched) {
    stats.fullyMatchedCount++;
  } else if (result.foundInDB) {
    stats.partialMatchCount++;
  }
  
  if (result.hasGeoData) {
    stats.dataAddedCount++;
  }
  
  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Comparing Cleansed CSV with Database Geo Data\n');
  console.log('Configuration:');
  console.log(`  CSV File: ${CONFIG.CSV_FILE}`);
  console.log(`  Limit: ${CONFIG.LIMIT ?? 'all'}`);
  console.log(`  Wix ID Filter: ${CONFIG.WIX_ID ?? 'all'}`);
  console.log(`  Show Matches: ${CONFIG.SHOW_MATCHES ? 'yes' : 'no'}`);
  console.log(`  Mismatches Only: ${CONFIG.SHOW_MISMATCHES_ONLY ? 'yes' : 'no'}`);
  console.log(`  Data Lost Only: ${CONFIG.SHOW_DATA_LOST_ONLY ? 'yes' : 'no'}`);
  console.log(`  Export CSV: ${CONFIG.EXPORT_CSV ? 'yes' : 'no'}`);
  console.log('');

  // Check CSV exists
  if (!fs.existsSync(CONFIG.CSV_FILE)) {
    throw new Error(`CSV file not found: ${CONFIG.CSV_FILE}`);
  }

  // Initialize stats
  const stats: Stats = {
    totalInCSV: 0,
    foundInDB: 0,
    notFoundInDB: 0,
    csvWithStreet: 0,
    csvWithCity: 0,
    csvWithCounty: 0,
    csvWithPostcode: 0,
    csvWithCountry: 0,
    dbWithStreet: 0,
    dbWithCity: 0,
    dbWithCounty: 0,
    dbWithPostcode: 0,
    dbWithCountry: 0,
    dbWithGeo: 0,
    streetMatches: 0,
    cityMatches: 0,
    countyMatches: 0,
    postcodeMatches: 0,
    countryMatches: 0,
    dataLostCount: 0,
    dataAddedCount: 0,
    fullyMatchedCount: 0,
    partialMatchCount: 0,
  };

  const results: ComparisonResult[] = [];

  // Read CSV
  const records: CSVRow[] = [];
  
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(CONFIG.CSV_FILE)
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        if (CONFIG.LIMIT && records.length >= CONFIG.LIMIT) {
          stream.destroy();
          return;
        }
        
        if (CONFIG.WIX_ID && row['Wix ID'] !== CONFIG.WIX_ID) {
          return;
        }
        
        records.push(row);
      })
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .on('close', () => resolve());
  });

  console.log(`📋 Found ${records.length} records in CSV\n`);
  console.log('='.repeat(80));

  // Process each record
  for (const row of records) {
    stats.totalInCSV++;
    
    const result = await compareData(row, stats);
    results.push(result);
    
    // Display based on filters
    const shouldDisplay = 
      (!CONFIG.SHOW_MATCHES && !CONFIG.SHOW_MISMATCHES_ONLY && !CONFIG.SHOW_DATA_LOST_ONLY) ||
      (CONFIG.SHOW_MATCHES && result.fullyMatched) ||
      (CONFIG.SHOW_MISMATCHES_ONLY && !result.fullyMatched) ||
      (CONFIG.SHOW_DATA_LOST_ONLY && result.dataLost);
    
    if (shouldDisplay) {
      console.log(`\n🚗 Wix ID ${result.wixId}: ${result.vehicleName} (${result.registration})`);
      console.log(`   Email: ${result.userEmail}`);
      console.log(`   Found in DB: ${result.foundInDB ? '✓' : '✗'}`);
      
      if (result.foundInDB) {
        console.log(`   Address Comparison:`);
        console.log(`     Street:   CSV="${result.csvStreet}" | DB="${result.dbStreet ?? ''}" ${result.streetMatch ? '✓' : '✗'}`);
        console.log(`     City:     CSV="${result.csvCity}" | DB="${result.dbCity ?? ''}" ${result.cityMatch ? '✓' : '✗'}`);
        console.log(`     County:   CSV="${result.csvCounty}" | DB="${result.dbCounty ?? ''}" ${result.countyMatch ? '✓' : '✗'}`);
        console.log(`     Postcode: CSV="${result.csvPostcode}" | DB="${result.dbPostcode ?? ''}" ${result.postcodeMatch ? '✓' : '✗'}`);
        console.log(`     Country:  CSV="${result.csvCountry}" | DB="${result.dbCountryName ?? ''}" ${result.countryMatch ? '✓' : '✗'}`);
        
        if (result.hasGeoData) {
          console.log(`   Geo Data: ✓ Lat=${result.dbLatitude}, Lng=${result.dbLongitude} (${result.dbGeoSource})`);
        } else {
          console.log(`   Geo Data: ✗ Not geocoded`);
        }
        
        if (result.issues.length > 0) {
          console.log(`   Issues:`);
          result.issues.forEach((issue) => console.log(`     - ${issue}`));
        }
        
        if (result.fullyMatched) {
          console.log(`   ✅ FULLY MATCHED`);
        } else if (result.dataLost) {
          console.log(`   ⚠️  DATA LOST`);
        } else {
          console.log(`   ⚠️  PARTIAL MATCH`);
        }
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY\n');
  
  console.log(`CSV Records: ${stats.totalInCSV}`);
  console.log(`Found in DB: ${stats.foundInDB} (${((stats.foundInDB / stats.totalInCSV) * 100).toFixed(1)}%)`);
  console.log(`Not in DB: ${stats.notFoundInDB} (${((stats.notFoundInDB / stats.totalInCSV) * 100).toFixed(1)}%)`);
  console.log('');
  
  console.log('CSV Data Completeness:');
  console.log(`  Street:   ${stats.csvWithStreet} (${((stats.csvWithStreet / stats.totalInCSV) * 100).toFixed(1)}%)`);
  console.log(`  City:     ${stats.csvWithCity} (${((stats.csvWithCity / stats.totalInCSV) * 100).toFixed(1)}%)`);
  console.log(`  County:   ${stats.csvWithCounty} (${((stats.csvWithCounty / stats.totalInCSV) * 100).toFixed(1)}%)`);
  console.log(`  Postcode: ${stats.csvWithPostcode} (${((stats.csvWithPostcode / stats.totalInCSV) * 100).toFixed(1)}%)`);
  console.log(`  Country:  ${stats.csvWithCountry} (${((stats.csvWithCountry / stats.totalInCSV) * 100).toFixed(1)}%)`);
  console.log('');
  
  if (stats.foundInDB > 0) {
    console.log('DB Data Completeness:');
    console.log(`  Street:   ${stats.dbWithStreet} (${((stats.dbWithStreet / stats.foundInDB) * 100).toFixed(1)}%)`);
    console.log(`  City:     ${stats.dbWithCity} (${((stats.dbWithCity / stats.foundInDB) * 100).toFixed(1)}%)`);
    console.log(`  County:   ${stats.dbWithCounty} (${((stats.dbWithCounty / stats.foundInDB) * 100).toFixed(1)}%)`);
    console.log(`  Postcode: ${stats.dbWithPostcode} (${((stats.dbWithPostcode / stats.foundInDB) * 100).toFixed(1)}%)`);
    console.log(`  Country:  ${stats.dbWithCountry} (${((stats.dbWithCountry / stats.foundInDB) * 100).toFixed(1)}%)`);
    console.log(`  Geocoded: ${stats.dbWithGeo} (${((stats.dbWithGeo / stats.foundInDB) * 100).toFixed(1)}%)`);
    console.log('');
    
    console.log('Match Rates (where both CSV and DB have data):');
    console.log(`  Street:   ${stats.streetMatches}`);
    console.log(`  City:     ${stats.cityMatches}`);
    console.log(`  County:   ${stats.countyMatches}`);
    console.log(`  Postcode: ${stats.postcodeMatches}`);
    console.log(`  Country:  ${stats.countryMatches}`);
    console.log('');
    
    console.log('Data Quality:');
    console.log(`  Fully Matched:   ${stats.fullyMatchedCount} (${((stats.fullyMatchedCount / stats.foundInDB) * 100).toFixed(1)}%)`);
    console.log(`  Partial Match:   ${stats.partialMatchCount} (${((stats.partialMatchCount / stats.foundInDB) * 100).toFixed(1)}%)`);
    console.log(`  Data Lost:       ${stats.dataLostCount} (${((stats.dataLostCount / stats.foundInDB) * 100).toFixed(1)}%)`);
    console.log(`  Geocoded:        ${stats.dataAddedCount} (${((stats.dataAddedCount / stats.foundInDB) * 100).toFixed(1)}%)`);
  }

  // Export CSV if requested
  if (CONFIG.EXPORT_CSV) {
    const csvPath = path.join(process.cwd(), 'geodata-comparison-results.csv');
    const csvLines = [
      'Wix ID,Vehicle Name,Registration,Email,Found in DB,' +
      'CSV Street,CSV City,CSV County,CSV Postcode,CSV Country,' +
      'DB Street,DB City,DB County,DB Postcode,DB Country,' +
      'Street Match,City Match,County Match,Postcode Match,Country Match,' +
      'Has Geo,Latitude,Longitude,Geo Source,' +
      'Data Lost,Fully Matched,Issues',
    ];
    
    results.forEach((r) => {
      csvLines.push([
        r.wixId,
        `"${r.vehicleName}"`,
        `"${r.registration}"`,
        r.userEmail,
        r.foundInDB ? 'Y' : 'N',
        `"${r.csvStreet}"`,
        `"${r.csvCity}"`,
        `"${r.csvCounty}"`,
        `"${r.csvPostcode}"`,
        `"${r.csvCountry}"`,
        `"${r.dbStreet ?? ''}"`,
        `"${r.dbCity ?? ''}"`,
        `"${r.dbCounty ?? ''}"`,
        `"${r.dbPostcode ?? ''}"`,
        `"${r.dbCountryName ?? ''}"`,
        r.streetMatch ? 'Y' : 'N',
        r.cityMatch ? 'Y' : 'N',
        r.countyMatch ? 'Y' : 'N',
        r.postcodeMatch ? 'Y' : 'N',
        r.countryMatch ? 'Y' : 'N',
        r.hasGeoData ? 'Y' : 'N',
        r.dbLatitude?.toString() ?? '',
        r.dbLongitude?.toString() ?? '',
        r.dbGeoSource ?? '',
        r.dataLost ? 'Y' : 'N',
        r.fullyMatched ? 'Y' : 'N',
        `"${r.issues.join('; ')}"`,
      ].join(','));
    });
    
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`\n💾 CSV exported to: ${csvPath}`);
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

