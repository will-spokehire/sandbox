#!/usr/bin/env tsx

/**
 * Find Missing Vehicles Script
 * 
 * This script compares the Cleansed Database CSV file against the database
 * to identify which vehicles have not been added yet.
 * 
 * Matching is done by:
 * 1. Wix ID (via VehicleSource table)
 * 2. Owner email + similar vehicle (make/model/year)
 * 3. Registration number (normalized)
 * 
 * Usage:
 *   npx tsx scripts/find-missing-vehicles.ts
 *   npx tsx scripts/find-missing-vehicles.ts --limit=10
 *   npx tsx scripts/find-missing-vehicles.ts --wix-id=727
 *   npx tsx scripts/find-missing-vehicles.ts --export-csv
 *   npx tsx scripts/find-missing-vehicles.ts --strict   # Only match by Wix ID
 * 
 * Options:
 *   --limit=N       Only process first N records from CSV
 *   --wix-id=ID     Check a specific Wix ID only
 *   --export-csv    Export results to CSV file
 *   --show-found    Also show vehicles that were found in DB
 *   --strict        Only match by Wix ID (skip email/registration matching)
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
  CSV_FILE: path.join(__dirname, '../data/Cleansed Database.xlsx - Cleansed Database.csv'),
  OUTPUT_DIR: path.join(__dirname, '../data'),
  
  // CLI options
  LIMIT: getArg('limit') ? parseInt(getArg('limit')!) : undefined,
  WIX_ID: getArg('wix-id'),
  EXPORT_CSV: hasFlag('export-csv'),
  SHOW_FOUND: hasFlag('show-found'),
  STRICT: hasFlag('strict'), // Only match by Wix ID
};

// Types
interface CSVRow {
  'Wix ID': string;
  'Submission time': string;
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
  'Year of manufacture': string;
  'Make': string;
  'Model': string;
  'Engine capacity': string;
  'Number of seats': string;
  'Steering': string;
  'Gearbox': string;
  'Exterior Colour': string;
  'Interior Colour': string;
  'Describe the condition': string;
  'Upload vehicle images': string;
  'Is this vehicle road legal?': string;
  'I confirm I am the legal owner of this vehicle.': string;
  'Image Titles': string;
}

interface VehicleRecord {
  wixId: string;
  submissionTime: string;
  ownerEmail: string;
  ownerName: string;
  phone: string;
  registration: string;
  year: string;
  make: string;
  model: string;
  engineCapacity: string;
  seats: string;
  steering: string;
  gearbox: string;
  exteriorColour: string;
  interiorColour: string;
  condition: string;
  hasImages: boolean;
  isRoadLegal: string;
  postcode: string;
  city: string;
  county: string;
  country: string;
  matchedBy?: 'wixId' | 'email' | 'registration'; // How was this vehicle matched
  hasInvalidWixId?: boolean; // True if Wix ID is not numeric (e.g., "Listed")
}

interface DBVehicleInfo {
  id: string;
  name: string;
  registration: string | null;
  year: string;
  ownerEmail: string;
  makeName: string;
  modelName: string;
}

interface Stats {
  totalInCSV: number;
  foundInDB: number;
  foundByWixId: number;
  foundByEmail: number;
  foundByRegistration: number;
  missingFromDB: number;
  invalidWixIdCount: number; // Records with non-numeric Wix ID (e.g., "Listed")
  errors: string[];
}

interface Result {
  missing: VehicleRecord[];
  found: VehicleRecord[];
}

/**
 * Required fields for vehicle submission based on the validation schema
 */
interface RequiredFieldsAnalysis {
  // Owner/Profile fields
  ownerEmail: boolean;
  ownerName: boolean;
  phone: boolean;
  postcode: boolean;
  county: boolean;
  // Basic info fields
  make: boolean;
  model: boolean;
  year: boolean;
  registration: boolean;
  // Technical details
  engineCapacity: boolean;
  seats: boolean;
  steering: boolean;
  gearbox: boolean;
  exteriorColour: boolean;
  interiorColour: boolean;
  condition: boolean;
  isRoadLegal: boolean;
  // Media
  hasImages: boolean;
}

interface MissingFieldsSummary {
  fieldName: string;
  missingCount: number;
  percentage: number;
}

/**
 * Analyze which required fields are missing from a vehicle record
 */
function analyzeMissingFields(record: VehicleRecord): string[] {
  const missing: string[] = [];
  
  // Owner/Profile fields
  if (!record.ownerEmail || record.ownerEmail.trim() === '') missing.push('ownerEmail');
  if (!record.ownerName || record.ownerName.trim() === '') missing.push('ownerName');
  if (!record.phone || record.phone.trim() === '') missing.push('phone');
  if (!record.postcode || record.postcode.trim() === '' || record.postcode.toLowerCase() === 'na') missing.push('postcode');
  if (!record.county || record.county.trim() === '') missing.push('county');
  
  // Basic info fields
  if (!record.make || record.make.trim() === '') missing.push('make');
  if (!record.model || record.model.trim() === '') missing.push('model');
  if (!record.year || record.year.trim() === '' || !/^\d{4}$/.test(record.year)) missing.push('year');
  if (!record.registration || record.registration.trim() === '' || 
      record.registration.toLowerCase() === 'na' || record.registration.toLowerCase() === 'tba') missing.push('registration');
  
  // Technical details
  if (!record.engineCapacity || record.engineCapacity.trim() === '') missing.push('engineCapacity');
  if (!record.seats || record.seats.trim() === '' || record.seats === '0') missing.push('seats');
  if (!record.steering || record.steering.trim() === '') missing.push('steering');
  if (!record.gearbox || record.gearbox.trim() === '') missing.push('gearbox');
  if (!record.exteriorColour || record.exteriorColour.trim() === '') missing.push('exteriorColour');
  if (!record.interiorColour || record.interiorColour.trim() === '') missing.push('interiorColour');
  if (!record.condition || record.condition.trim() === '') missing.push('condition');
  if (!record.isRoadLegal || record.isRoadLegal.trim() === '') missing.push('isRoadLegal');
  
  // Media
  if (!record.hasImages) missing.push('images');
  
  return missing;
}

/**
 * Aggregate missing fields analysis for all missing vehicles
 */
function aggregateMissingFields(missingVehicles: VehicleRecord[]): MissingFieldsSummary[] {
  const fieldCounts: Record<string, number> = {
    ownerEmail: 0,
    ownerName: 0,
    phone: 0,
    postcode: 0,
    county: 0,
    make: 0,
    model: 0,
    year: 0,
    registration: 0,
    engineCapacity: 0,
    seats: 0,
    steering: 0,
    gearbox: 0,
    exteriorColour: 0,
    interiorColour: 0,
    condition: 0,
    isRoadLegal: 0,
    images: 0,
  };
  
  for (const vehicle of missingVehicles) {
    const missingFields = analyzeMissingFields(vehicle);
    for (const field of missingFields) {
      if (field in fieldCounts && fieldCounts[field] !== undefined) {
        fieldCounts[field] = fieldCounts[field]! + 1;
      }
    }
  }
  
  const total = missingVehicles.length;
  const summaries: MissingFieldsSummary[] = [];
  
  for (const [fieldName, count] of Object.entries(fieldCounts)) {
    if (count > 0) {
      summaries.push({
        fieldName,
        missingCount: count,
        percentage: Math.round((count / total) * 100),
      });
    }
  }
  
  // Sort by missing count descending
  summaries.sort((a, b) => b.missingCount - a.missingCount);
  
  return summaries;
}

/**
 * Parse a CSV row into a VehicleRecord
 */
function parseCSVRow(row: CSVRow): VehicleRecord {
  return {
    wixId: row['Wix ID'],
    submissionTime: row['Submission time'],
    ownerEmail: row['Email'] || '',
    ownerName: `${row['First name'] || ''} ${row['Last name'] || ''}`.trim(),
    phone: row['Phone'] || '',
    registration: row['Registration'] || '',
    year: row['Year of manufacture'] || '',
    make: row['Make'] || '',
    model: row['Model'] || '',
    engineCapacity: row['Engine capacity'] || '',
    seats: row['Number of seats'] || '',
    steering: row['Steering'] || '',
    gearbox: row['Gearbox'] || '',
    exteriorColour: row['Exterior Colour'] || '',
    interiorColour: row['Interior Colour'] || '',
    condition: row['Describe the condition'] || '',
    hasImages: !!(row['Upload vehicle images'] || row['Image Titles']),
    isRoadLegal: row['Is this vehicle road legal?'] || '',
    postcode: row['Postcode'] || '',
    city: row['City'] || '',
    county: row['County'] || '',
    country: row['Country'] || '',
  };
}

/**
 * Normalize registration for comparison
 * Returns empty string for invalid values (NA, TBA, N/A, too short)
 */
function normalizeRegistration(reg: string | null | undefined): string {
  if (!reg) return '';
  const normalized = reg.toUpperCase().replace(/[\s\-]/g, '');
  // Filter out invalid values
  if (normalized === 'NA' || normalized === 'TBA' || normalized === 'N/A' || normalized.length < 2) {
    return '';
  }
  return normalized;
}

/**
 * Normalize email for comparison
 */
function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Get all existing source IDs from the database
 */
async function getExistingSourceIds(): Promise<Set<string>> {
  console.log('📥 Fetching existing vehicle sources from database...');
  
  const sources = await prisma.vehicleSource.findMany({
    where: {
      sourceType: {
        in: ['processed_catalog', 'catalog', 'cleansed', 'cleansed_import'],
      },
    },
    select: {
      sourceId: true,
    },
  });
  
  const sourceIds = new Set(sources.map(s => s.sourceId));
  console.log(`   Found ${sourceIds.size} existing source records\n`);
  
  return sourceIds;
}

/**
 * Get all vehicles from the database with owner info for email/registration matching
 */
async function getExistingVehicles(): Promise<DBVehicleInfo[]> {
  console.log('📥 Fetching existing vehicles with owner info...');
  
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      name: true,
      registration: true,
      year: true,
      make: {
        select: { name: true },
      },
      model: {
        select: { name: true },
      },
      owner: {
        select: { email: true },
      },
    },
  });
  
  const result = vehicles.map(v => ({
    id: v.id,
    name: v.name,
    registration: v.registration,
    year: v.year,
    ownerEmail: v.owner?.email ?? '',
    makeName: v.make?.name ?? '',
    modelName: v.model?.name ?? '',
  }));
  
  console.log(`   Found ${result.length} vehicles in database\n`);
  
  return result;
}

/**
 * Build lookup maps for efficient matching
 */
function buildLookupMaps(vehicles: DBVehicleInfo[]): {
  byEmail: Map<string, DBVehicleInfo[]>;
  byRegistration: Map<string, DBVehicleInfo>;
} {
  const byEmail = new Map<string, DBVehicleInfo[]>();
  const byRegistration = new Map<string, DBVehicleInfo>();
  
  for (const vehicle of vehicles) {
    // Index by email
    const email = normalizeEmail(vehicle.ownerEmail);
    if (email) {
      const existing = byEmail.get(email) || [];
      existing.push(vehicle);
      byEmail.set(email, existing);
    }
    
    // Index by registration
    const reg = normalizeRegistration(vehicle.registration);
    if (reg && reg.length >= 3) { // Skip very short registrations
      byRegistration.set(reg, vehicle);
    }
  }
  
  return { byEmail, byRegistration };
}

/**
 * Check if a CSV vehicle matches a DB vehicle by make/model/year
 */
function isSimilarVehicle(csvRecord: VehicleRecord, dbVehicle: DBVehicleInfo): boolean {
  const csvMake = csvRecord.make.toLowerCase().trim();
  const csvModel = csvRecord.model.toLowerCase().trim();
  const csvYear = csvRecord.year.trim();
  
  const dbMake = dbVehicle.makeName.toLowerCase().trim();
  const dbModel = dbVehicle.modelName.toLowerCase().trim();
  const dbYear = dbVehicle.year.trim();
  
  // Match if make and model are similar (or one contains the other)
  const makeMatch = csvMake === dbMake || 
                    csvMake.includes(dbMake) || 
                    dbMake.includes(csvMake);
  
  const modelMatch = csvModel === dbModel || 
                     csvModel.includes(dbModel) || 
                     dbModel.includes(csvModel);
  
  const yearMatch = csvYear === dbYear;
  
  return makeMatch && modelMatch && yearMatch;
}

/**
 * Read and parse the CSV file
 */
async function readCSV(): Promise<VehicleRecord[]> {
  return new Promise((resolve, reject) => {
    const records: VehicleRecord[] = [];
    let processedCount = 0;
    
    console.log(`📄 Reading CSV file: ${CONFIG.CSV_FILE}\n`);
    
    if (!fs.existsSync(CONFIG.CSV_FILE)) {
      reject(new Error(`CSV file not found: ${CONFIG.CSV_FILE}`));
      return;
    }
    
    fs.createReadStream(CONFIG.CSV_FILE)
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        // Skip if we've hit the limit
        if (CONFIG.LIMIT && processedCount >= CONFIG.LIMIT) {
          return;
        }
        
        // Skip if filtering by specific Wix ID
        if (CONFIG.WIX_ID && row['Wix ID'] !== CONFIG.WIX_ID) {
          return;
        }
        
        // Skip rows without Wix ID
        if (!row['Wix ID']) {
          return;
        }
        
        const record = parseCSVRow(row);
        
        // Flag records with non-numeric Wix ID (e.g., "Listed" instead of a number)
        // These are status markers, not real IDs, so they can't be matched by ID
        record.hasInvalidWixId = !/^\d+$/.test(record.wixId);
        
        records.push(record);
        processedCount++;
      })
      .on('end', () => {
        console.log(`   Parsed ${records.length} records from CSV\n`);
        resolve(records);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Compare CSV records against database using multiple matching strategies
 */
function compareRecords(
  csvRecords: VehicleRecord[],
  existingIds: Set<string>,
  lookupMaps: { byEmail: Map<string, DBVehicleInfo[]>; byRegistration: Map<string, DBVehicleInfo> },
  stats: Stats
): Result {
  const missing: VehicleRecord[] = [];
  const found: VehicleRecord[] = [];
  
  for (const record of csvRecords) {
    let matched = false;
    let matchType: 'wixId' | 'email' | 'registration' | undefined;
    
    // Strategy 1: Match by Wix ID (via VehicleSource)
    // Skip this for records with invalid Wix IDs (e.g., "Listed" instead of a number)
    if (!record.hasInvalidWixId && existingIds.has(record.wixId)) {
      matched = true;
      matchType = 'wixId';
      stats.foundByWixId++;
    }
    
    // Strategy 2: Match by email + similar vehicle (if not in strict mode)
    if (!matched && !CONFIG.STRICT) {
      const email = normalizeEmail(record.ownerEmail);
      if (email) {
        const ownerVehicles = lookupMaps.byEmail.get(email);
        if (ownerVehicles) {
          // Check if any of owner's vehicles match this one
          for (const dbVehicle of ownerVehicles) {
            if (isSimilarVehicle(record, dbVehicle)) {
              matched = true;
              matchType = 'email';
              stats.foundByEmail++;
              break;
            }
          }
        }
      }
    }
    
    // Strategy 3: Match by registration (if not in strict mode)
    if (!matched && !CONFIG.STRICT) {
      const reg = normalizeRegistration(record.registration);
      if (reg && reg.length >= 3) {
        const dbVehicle = lookupMaps.byRegistration.get(reg);
        if (dbVehicle) {
          matched = true;
          matchType = 'registration';
          stats.foundByRegistration++;
        }
      }
    }
    
    if (matched) {
      found.push({ ...record, matchedBy: matchType });
    } else {
      missing.push(record);
    }
  }
  
  return { missing, found };
}

/**
 * Display results summary
 */
function displayResults(result: Result, stats: Stats): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULTS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`Total vehicles in CSV:     ${stats.totalInCSV}`);
  if (stats.invalidWixIdCount > 0) {
    console.log(`  (${stats.invalidWixIdCount} have non-numeric Wix ID like "Listed")`);
  }
  console.log(`Found in database:         ${stats.foundInDB} ✓`);
  if (!CONFIG.STRICT) {
    console.log(`  - By Wix ID:             ${stats.foundByWixId}`);
    console.log(`  - By Email + Vehicle:    ${stats.foundByEmail}`);
    console.log(`  - By Registration:       ${stats.foundByRegistration}`);
  }
  console.log(`Missing from database:     ${stats.missingFromDB} ✗\n`);
  
  if (result.missing.length > 0) {
    // Analyze missing fields across all missing vehicles
    const missingFieldsSummary = aggregateMissingFields(result.missing);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 MISSING REQUIRED FIELDS ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Fields missing from the vehicles not in database:\n');
    console.log('Field              | Missing | % of Missing Vehicles');
    console.log('-------------------|---------|----------------------');
    
    for (const summary of missingFieldsSummary) {
      const fieldPadded = summary.fieldName.padEnd(18);
      const countPadded = String(summary.missingCount).padStart(7);
      const pctPadded = String(summary.percentage).padStart(3);
      console.log(`${fieldPadded} | ${countPadded} | ${pctPadded}%`);
    }
    console.log('');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ MISSING VEHICLES (Details)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Show first 20 missing vehicles with their missing fields
    const displayCount = Math.min(20, result.missing.length);
    for (let i = 0; i < displayCount; i++) {
      const v = result.missing[i]!;
      const invalidIdMarker = v.hasInvalidWixId ? ' ⚠️ (non-numeric ID)' : '';
      const missingFields = analyzeMissingFields(v);
      
      console.log(`[${i + 1}] Wix ID: ${v.wixId}${invalidIdMarker}`);
      console.log(`    ${v.year} ${v.make} ${v.model}`);
      console.log(`    Registration: ${v.registration || 'N/A'}`);
      console.log(`    Owner: ${v.ownerName} (${v.ownerEmail})`);
      console.log(`    Has Images: ${v.hasImages ? 'Yes' : 'No'}`);
      if (missingFields.length > 0) {
        console.log(`    ⚠️  Missing fields: ${missingFields.join(', ')}`);
      } else {
        console.log(`    ✓ All required fields present`);
      }
      console.log('');
    }
    
    if (result.missing.length > 20) {
      console.log(`... and ${result.missing.length - 20} more vehicles\n`);
    }
  }
  
  if (CONFIG.SHOW_FOUND && result.found.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ FOUND VEHICLES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const displayCount = Math.min(10, result.found.length);
    for (let i = 0; i < displayCount; i++) {
      const v = result.found[i]!;
      const matchLabel = v.matchedBy === 'wixId' ? '[ID]' : 
                         v.matchedBy === 'email' ? '[EMAIL]' : 
                         v.matchedBy === 'registration' ? '[REG]' : '';
      console.log(`[${i + 1}] ${matchLabel} Wix ID: ${v.wixId} - ${v.year} ${v.make} ${v.model}`);
    }
    
    if (result.found.length > 10) {
      console.log(`... and ${result.found.length - 10} more vehicles\n`);
    }
  }
}

/**
 * Save results to files
 */
function saveResults(result: Result, stats: Stats): void {
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }
  
  // Deduplicate missing vehicles by normalized registration
  // Keep the first occurrence (most complete data usually comes first)
  const seenRegistrations = new Set<string>();
  const deduplicatedMissing = result.missing.filter(v => {
    const normalizedReg = normalizeRegistration(v.registration);
    if (normalizedReg && seenRegistrations.has(normalizedReg)) {
      return false; // Skip duplicate
    }
    if (normalizedReg) {
      seenRegistrations.add(normalizedReg);
    }
    return true;
  });
  
  const duplicatesRemoved = result.missing.length - deduplicatedMissing.length;
  if (duplicatesRemoved > 0) {
    console.log(`ℹ️  Removed ${duplicatesRemoved} duplicate vehicles (same registration)\n`);
  }
  
  // Analyze missing fields
  const missingFieldsSummary = aggregateMissingFields(deduplicatedMissing);
  
  // Add missing fields to each vehicle record
  const missingVehiclesWithAnalysis = deduplicatedMissing.map(v => ({
    ...v,
    missingRequiredFields: analyzeMissingFields(v),
  }));
  
  // Save JSON
  const jsonPath = path.join(CONFIG.OUTPUT_DIR, 'missing-vehicles.json');
  const jsonData = {
    generatedAt: new Date().toISOString(),
    stats: {
      totalInCSV: stats.totalInCSV,
      foundInDB: stats.foundInDB,
      foundByWixId: stats.foundByWixId,
      foundByEmail: stats.foundByEmail,
      foundByRegistration: stats.foundByRegistration,
      missingFromDB: deduplicatedMissing.length, // Use deduplicated count
      duplicatesRemoved,
      invalidWixIdCount: stats.invalidWixIdCount,
    },
    missingFieldsSummary,
    missingVehicles: missingVehiclesWithAnalysis,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  console.log(`💾 Saved JSON results to: ${jsonPath}`);
  
  // Save CSV if requested
  if (CONFIG.EXPORT_CSV) {
    const csvPath = path.join(CONFIG.OUTPUT_DIR, 'missing-vehicles.csv');
    const headers = [
      'Wix ID',
      'Submission Time',
      'Make',
      'Model',
      'Year',
      'Registration',
      'Owner Name',
      'Owner Email',
      'Phone',
      'City',
      'County',
      'Postcode',
      'Country',
      'Engine Capacity',
      'Seats',
      'Steering',
      'Gearbox',
      'Exterior Colour',
      'Interior Colour',
      'Condition',
      'Has Images',
      'Road Legal',
      'Invalid Wix ID',
      'Missing Required Fields',
    ];
    
    const csvLines = [headers.join(',')];
    
    for (const v of result.missing) {
      const missingFields = analyzeMissingFields(v);
      const row = [
        v.wixId,
        `"${v.submissionTime}"`,
        `"${v.make}"`,
        `"${v.model}"`,
        v.year,
        `"${v.registration}"`,
        `"${v.ownerName}"`,
        `"${v.ownerEmail}"`,
        `"${v.phone}"`,
        `"${v.city}"`,
        `"${v.county}"`,
        `"${v.postcode}"`,
        `"${v.country}"`,
        `"${v.engineCapacity}"`,
        v.seats,
        `"${v.steering}"`,
        `"${v.gearbox}"`,
        `"${v.exteriorColour}"`,
        `"${v.interiorColour}"`,
        `"${v.condition.replace(/"/g, '""')}"`,
        v.hasImages ? 'Yes' : 'No',
        `"${v.isRoadLegal}"`,
        v.hasInvalidWixId ? 'Yes' : 'No',
        `"${missingFields.join('; ')}"`,
      ];
      csvLines.push(row.join(','));
    }
    
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`💾 Saved CSV results to: ${csvPath}`);
  }
  
  console.log('');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('\n🔍 Find Missing Vehicles Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Configuration:');
  console.log(`  CSV File: ${CONFIG.CSV_FILE}`);
  console.log(`  Limit: ${CONFIG.LIMIT ?? 'all'}`);
  console.log(`  Wix ID Filter: ${CONFIG.WIX_ID ?? 'all'}`);
  console.log(`  Export CSV: ${CONFIG.EXPORT_CSV ? 'yes' : 'no'}`);
  console.log(`  Show Found: ${CONFIG.SHOW_FOUND ? 'yes' : 'no'}`);
  console.log(`  Strict Mode: ${CONFIG.STRICT ? 'yes (Wix ID only)' : 'no (also match by email/registration)'}`);
  console.log('');
  
  const stats: Stats = {
    totalInCSV: 0,
    foundInDB: 0,
    foundByWixId: 0,
    foundByEmail: 0,
    foundByRegistration: 0,
    missingFromDB: 0,
    invalidWixIdCount: 0,
    errors: [],
  };
  
  try {
    // Get existing source IDs from database
    const existingIds = await getExistingSourceIds();
    
    // Get existing vehicles for email/registration matching (unless strict mode)
    let lookupMaps: { byEmail: Map<string, DBVehicleInfo[]>; byRegistration: Map<string, DBVehicleInfo> } = {
      byEmail: new Map(),
      byRegistration: new Map(),
    };
    
    if (!CONFIG.STRICT) {
      const existingVehicles = await getExistingVehicles();
      lookupMaps = buildLookupMaps(existingVehicles);
      console.log(`   Built lookup maps: ${lookupMaps.byEmail.size} emails, ${lookupMaps.byRegistration.size} registrations\n`);
    }
    
    // Read and parse CSV
    const csvRecords = await readCSV();
    stats.totalInCSV = csvRecords.length;
    
    // Count records with invalid Wix IDs
    stats.invalidWixIdCount = csvRecords.filter(r => r.hasInvalidWixId).length;
    if (stats.invalidWixIdCount > 0) {
      console.log(`⚠️  Found ${stats.invalidWixIdCount} records with non-numeric Wix ID (e.g., "Listed")\n`);
    }
    
    // Compare records
    console.log('🔄 Comparing CSV records against database...\n');
    const result = compareRecords(csvRecords, existingIds, lookupMaps, stats);
    
    stats.foundInDB = result.found.length;
    stats.missingFromDB = result.missing.length;
    
    // Display and save results
    displayResults(result, stats);
    saveResults(result, stats);
    
    console.log('✅ Analysis complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
