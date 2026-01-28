#!/usr/bin/env tsx

/**
 * Update Missing Geo Data from Cleansed CSV
 * 
 * This script updates ONLY empty fields in the database with data from 
 * the cleansed CSV. It will NOT overwrite existing data.
 * 
 * Safety features:
 * - Dry-run mode by default
 * - Only updates empty/null fields
 * - Shows before/after for each update
 * - Detailed logging of all changes
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
  WIX_ID: getArg('wix-id'),
  DRY_RUN: !hasFlag('execute'), // Default to dry-run for safety
  EXPORT_LOG: hasFlag('export-log'),
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

interface UpdateResult {
  wixId: string;
  vehicleName: string;
  userEmail: string;
  userId: string;
  foundInDB: boolean;
  fieldsUpdated: string[];
  changes: {
    field: string;
    before: string | null;
    after: string;
  }[];
  success: boolean;
  error?: string;
}

interface Stats {
  totalRecords: number;
  foundInDB: number;
  notFoundInDB: number;
  usersUpdated: number;
  totalFieldsUpdated: number;
  streetUpdates: number;
  cityUpdates: number;
  countyUpdates: number;
  postcodeUpdates: number;
  countryUpdates: number;
  errors: number;
}

/**
 * Check if value is empty (null, undefined, or empty string)
 */
function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim() === '';
}

/**
 * Process a single record
 */
async function processRecord(
  csvRow: CSVRow,
  stats: Stats
): Promise<UpdateResult> {
  const wixId = csvRow['Wix ID'];
  const result: UpdateResult = {
    wixId,
    vehicleName: `${csvRow['Make']} ${csvRow['Model']}`,
    userEmail: csvRow['Email'],
    userId: '',
    foundInDB: false,
    fieldsUpdated: [],
    changes: [],
    success: false,
  };

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
    result.error = 'Vehicle not found in database';
    return result;
  }

  result.foundInDB = true;
  result.userId = vehicleSource.vehicle.ownerId;
  stats.foundInDB++;

  const user = vehicleSource.vehicle.owner;
  const updates: Record<string, any> = {};

  // Check each field and prepare updates for empty fields only
  
  // Street
  if (isEmpty(user.street) && !isEmpty(csvRow['Street address'])) {
    updates.street = csvRow['Street address'].trim();
    result.fieldsUpdated.push('street');
    result.changes.push({
      field: 'street',
      before: user.street,
      after: csvRow['Street address'].trim(),
    });
    stats.streetUpdates++;
  }

  // City
  if (isEmpty(user.city) && !isEmpty(csvRow['City'])) {
    updates.city = csvRow['City'].trim();
    result.fieldsUpdated.push('city');
    result.changes.push({
      field: 'city',
      before: user.city,
      after: csvRow['City'].trim(),
    });
    stats.cityUpdates++;
  }

  // County
  if (isEmpty(user.county) && !isEmpty(csvRow['County'])) {
    updates.county = csvRow['County'].trim();
    result.fieldsUpdated.push('county');
    result.changes.push({
      field: 'county',
      before: user.county,
      after: csvRow['County'].trim(),
    });
    stats.countyUpdates++;
  }

  // Postcode
  if (isEmpty(user.postcode) && !isEmpty(csvRow['Postcode'])) {
    updates.postcode = csvRow['Postcode'].trim();
    result.fieldsUpdated.push('postcode');
    result.changes.push({
      field: 'postcode',
      before: user.postcode,
      after: csvRow['Postcode'].trim(),
    });
    stats.postcodeUpdates++;
  }

  // Country - need to find country by name
  if (!user.countryId && !isEmpty(csvRow['Country'])) {
    const countryName = csvRow['Country'].trim();
    const country = await prisma.country.findFirst({
      where: {
        name: {
          equals: countryName,
          mode: 'insensitive',
        },
      },
    });

    if (country) {
      updates.countryId = country.id;
      result.fieldsUpdated.push('country');
      result.changes.push({
        field: 'country',
        before: user.country?.name ?? null,
        after: countryName,
      });
      stats.countryUpdates++;
    }
  }

  // If no updates needed, return
  if (Object.keys(updates).length === 0) {
    result.success = true;
    return result;
  }

  stats.totalFieldsUpdated += Object.keys(updates).length;

  // Perform update if not dry-run
  if (!CONFIG.DRY_RUN) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
      result.success = true;
      stats.usersUpdated++;
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      stats.errors++;
    }
  } else {
    result.success = true;
  }

  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Update Missing Geo Data from Cleansed CSV\n');
  console.log('Configuration:');
  console.log(`  CSV File: ${CONFIG.CSV_FILE}`);
  console.log(`  Limit: ${CONFIG.LIMIT ?? 'all'}`);
  console.log(`  Wix ID Filter: ${CONFIG.WIX_ID ?? 'all'}`);
  console.log(`  Mode: ${CONFIG.DRY_RUN ? '🔍 DRY RUN (no changes)' : '✍️  EXECUTE (will update database)'}`);
  console.log(`  Export Log: ${CONFIG.EXPORT_LOG ? 'yes' : 'no'}`);
  console.log('');

  if (CONFIG.DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made to the database');
    console.log('   Use --execute flag to actually perform updates\n');
  } else {
    console.log('⚠️  EXECUTE MODE - Database WILL be updated!');
    console.log('   Press Ctrl+C to cancel...\n');
    // Give user 3 seconds to cancel
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Check CSV exists
  if (!fs.existsSync(CONFIG.CSV_FILE)) {
    throw new Error(`CSV file not found: ${CONFIG.CSV_FILE}`);
  }

  // Initialize stats
  const stats: Stats = {
    totalRecords: 0,
    foundInDB: 0,
    notFoundInDB: 0,
    usersUpdated: 0,
    totalFieldsUpdated: 0,
    streetUpdates: 0,
    cityUpdates: 0,
    countyUpdates: 0,
    postcodeUpdates: 0,
    countryUpdates: 0,
    errors: 0,
  };

  const results: UpdateResult[] = [];

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
    stats.totalRecords++;
    
    try {
      const result = await processRecord(row, stats);
      results.push(result);

      // Display if there were changes
      if (result.changes.length > 0) {
        console.log(`\n🚗 Wix ID ${result.wixId}: ${result.vehicleName}`);
        console.log(`   Email: ${result.userEmail}`);
        console.log(`   User ID: ${result.userId}`);
        console.log(`   ${CONFIG.DRY_RUN ? 'Would update' : 'Updated'} ${result.changes.length} field(s):`);
        
        result.changes.forEach((change) => {
          console.log(`     ${change.field}:`);
          console.log(`       Before: "${change.before ?? '(empty)'}"`);
          console.log(`       After:  "${change.after}"`);
        });

        if (!CONFIG.DRY_RUN) {
          if (result.success) {
            console.log(`   ✅ Updated successfully`);
          } else {
            console.log(`   ❌ Update failed: ${result.error}`);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Error processing Wix ID ${row['Wix ID']}: ${errorMessage}`);
      stats.errors++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY\n');
  
  console.log(`Total CSV Records: ${stats.totalRecords}`);
  console.log(`Found in DB: ${stats.foundInDB}`);
  console.log(`Not Found in DB: ${stats.notFoundInDB}`);
  console.log('');
  
  if (CONFIG.DRY_RUN) {
    console.log('Would Update:');
  } else {
    console.log('Updated:');
  }
  console.log(`  Users: ${stats.usersUpdated}`);
  console.log(`  Total Fields: ${stats.totalFieldsUpdated}`);
  console.log('');
  
  console.log('Field Updates:');
  console.log(`  Street:   ${stats.streetUpdates}`);
  console.log(`  City:     ${stats.cityUpdates}`);
  console.log(`  County:   ${stats.countyUpdates}`);
  console.log(`  Postcode: ${stats.postcodeUpdates}`);
  console.log(`  Country:  ${stats.countryUpdates}`);
  
  if (stats.errors > 0) {
    console.log('');
    console.log(`❌ Errors: ${stats.errors}`);
  }

  // Export log if requested
  if (CONFIG.EXPORT_LOG) {
    const logPath = path.join(process.cwd(), 'geodata-update-log.json');
    fs.writeFileSync(logPath, JSON.stringify({ 
      config: CONFIG,
      stats, 
      results: results.filter(r => r.changes.length > 0) // Only export records with changes
    }, null, 2));
    console.log(`\n💾 Log exported to: ${logPath}`);
  }

  if (CONFIG.DRY_RUN) {
    console.log('\n💡 To actually perform these updates, run with --execute flag');
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







