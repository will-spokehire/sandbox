#!/usr/bin/env tsx

/**
 * Analysis script to identify vehicles that were not imported during migration
 * and categorize the reasons why they were excluded.
 * 
 * Run with: npm run analyze-non-imported
 */

import * as fs from 'fs';
import * as path from 'path';

// Type definitions matching the migration script
interface ProcessedVehicleRecord {
  id: string;
  primarySource: string;
  sources: string[];
  vehicle: {
    name: string;
    make: string;
    model: string;
    year: string;
    registration?: string;
    engineCapacity?: string;
    numberOfSeats?: string;
    steering?: string;
    gearbox?: string;
    exteriorColour?: string;
    interiorColour?: string;
    condition?: string;
    isRoadLegal?: string;
    price?: number | null;
    collection?: string;
    visible: boolean;
    published: boolean;
    inventory?: string;
  };
  owner?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      county?: string;
      postcode?: string;
      country?: string;
    };
  };
  images?: {
    urls: string[];
    titles?: string[];
  };
}

interface ProcessedVehicleCatalog {
  metadata: {
    generatedAt: string;
    totalRecords: number;
    [key: string]: any;
  };
  records: ProcessedVehicleRecord[];
}

interface AnalysisResult {
  totalRecords: number;
  wouldBeImported: number;
  publishedVehicles: number;
  draftVehicles: number;
  excludedVehicles: number;
  exclusionReasons: {
    noOwnerEmail: number;
    emptyMake: number;
    emptyModel: number;
    invalidMakePattern: number;
    missingRequiredFields: number;
  };
  excludedSamples: Array<{
    id: string;
    name: string;
    make: string;
    model: string;
    reason: string;
    missingFields?: string[];
  }>;
}

/**
 * Check if make has an invalid pattern
 */
function hasInvalidMakePattern(make: string): boolean {
  if (!make) return false;
  
  return (
    make.includes('#') || 
    make.startsWith('#') ||
    /^\d+$/.test(make) || // Pure numbers like "8", "123"
    make.length <= 2 || // Very short strings like "8", "AB"
    make.includes(':') || // Color codes like "red:blue"
    make.toLowerCase().includes('color') // Contains word "color"
  );
}

/**
 * Get list of missing required fields
 */
function getMissingRequiredFields(record: ProcessedVehicleRecord): string[] {
  const vehicle = record.vehicle;
  const requiredFields = [
    'make', 'model', 'year', 'registration',
    'engineCapacity', 'numberOfSeats', 'steering',
    'gearbox', 'isRoadLegal'
  ];

  const missing: string[] = [];
  
  for (const field of requiredFields) {
    const value = vehicle[field as keyof typeof vehicle];
    if (value === null || value === undefined || value === '' || value === 'null') {
      missing.push(field);
    }
  }
  
  return missing;
}

/**
 * Check if a record has complete car information for PUBLISHED status
 */
function hasCompleteCarInfo(record: ProcessedVehicleRecord): boolean {
  const vehicle = record.vehicle;

  // Must have user email (already filtered by requireUserContact)
  if (!record.owner?.email) return false;

  // Must have all required car fields
  return getMissingRequiredFields(record).length === 0;
}

/**
 * Check if a record has basic car information for DRAFT status
 */
function hasBasicCarInfo(record: ProcessedVehicleRecord): boolean {
  const vehicle = record.vehicle;

  // Must have user email (already filtered by requireUserContact)
  if (!record.owner?.email) return false;

  // Must have at least make and model
  return !!(vehicle.make && vehicle.model &&
           vehicle.make !== 'null' && vehicle.model !== 'null' &&
           vehicle.make !== '' && vehicle.model !== '');
}

/**
 * Try to fix invalid make by extracting from vehicle name
 * Returns [make, model] if fixable, null if not
 */
function tryFixInvalidMake(record: ProcessedVehicleRecord): [string, string] | null {
  const name = record.vehicle.name;
  
  if (!name) {
    return null;
  }
  
  const nameWords = name.trim().split(/\s+/);
  if (nameWords.length >= 2) {
    const make = nameWords[0];
    const model = nameWords.slice(1).join(' ');
    return [make, model];
  }
  
  return null;
}

/**
 * Determine the primary reason why a record would be excluded
 */
function getExclusionReason(record: ProcessedVehicleRecord): string | null {
  const vehicle = record.vehicle;

  // Check owner email first (most common filter)
  if (!record.owner?.email) {
    return 'No owner email';
  }

  // Check make field
  if (!vehicle.make || vehicle.make === '' || vehicle.make === 'null') {
    return 'Empty make field';
  }

  // Check for invalid make pattern - but try to fix it first (like migration does)
  if (hasInvalidMakePattern(vehicle.make)) {
    const fixed = tryFixInvalidMake(record);
    if (!fixed) {
      return 'Invalid make pattern';
    }
    // If fixable, continue checking with fixed values
  }

  // Check model field
  if (!vehicle.model || vehicle.model === '' || vehicle.model === 'null') {
    // Try to fix from name if make was invalid
    if (hasInvalidMakePattern(vehicle.make)) {
      const fixed = tryFixInvalidMake(record);
      if (!fixed) {
        return 'Empty model field';
      }
      // Fixed, so continue
    } else {
      return 'Empty model field';
    }
  }

  // If we get here, it passed basic checks but might be missing other required fields
  if (!hasCompleteCarInfo(record)) {
    return 'Missing required fields';
  }

  // Record would be imported
  return null;
}

/**
 * Determine if an imported vehicle would be PUBLISHED or DRAFT
 */
function getVehicleStatus(record: ProcessedVehicleRecord): 'PUBLISHED' | 'DRAFT' {
  const hasImages = record.images?.urls && record.images.urls.length > 0;
  const hasPostcode = record.owner?.address?.postcode && record.owner.address.postcode.trim() !== '';
  
  if (hasCompleteCarInfo(record) && hasImages && hasPostcode) {
    return 'PUBLISHED';
  }
  return 'DRAFT';
}

/**
 * Load the vehicle catalog
 */
function loadVehicleCatalog(): ProcessedVehicleCatalog {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(process.cwd(), '..', 'data-analytics', 'public', 'data', 'improved_vehicle_catalog.json'),
    path.join(process.cwd(), 'public', 'data', 'vehicle-catalog.json'),
    path.join(process.cwd(), 'public', 'data', 'improved_vehicle_catalog.json'),
  ];

  for (const catalogPath of possiblePaths) {
    if (fs.existsSync(catalogPath)) {
      console.log(`📥 Loading catalog from: ${catalogPath}\n`);
      const content = fs.readFileSync(catalogPath, 'utf8');
      return JSON.parse(content) as ProcessedVehicleCatalog;
    }
  }

  throw new Error('Could not find vehicle catalog file. Tried:\n' + possiblePaths.join('\n'));
}

/**
 * Analyze all records and categorize them
 */
function analyzeRecords(catalog: ProcessedVehicleCatalog): AnalysisResult {
  const result: AnalysisResult = {
    totalRecords: catalog.records.length,
    wouldBeImported: 0,
    publishedVehicles: 0,
    draftVehicles: 0,
    excludedVehicles: 0,
    exclusionReasons: {
      noOwnerEmail: 0,
      emptyMake: 0,
      emptyModel: 0,
      invalidMakePattern: 0,
      missingRequiredFields: 0,
    },
    excludedSamples: [],
  };

  for (const record of catalog.records) {
    const exclusionReason = getExclusionReason(record);

    if (exclusionReason) {
      // Vehicle would be excluded
      result.excludedVehicles++;
      
      // Categorize reason
      switch (exclusionReason) {
        case 'No owner email':
          result.exclusionReasons.noOwnerEmail++;
          break;
        case 'Empty make field':
          result.exclusionReasons.emptyMake++;
          break;
        case 'Empty model field':
          result.exclusionReasons.emptyModel++;
          break;
        case 'Invalid make pattern':
          result.exclusionReasons.invalidMakePattern++;
          break;
        case 'Missing required fields':
          result.exclusionReasons.missingRequiredFields++;
          break;
      }

      // Add all excluded vehicles (no limit)
      const excludedVehicle: any = {
        id: record.id,
        name: record.vehicle.name,
        make: record.vehicle.make || '(empty)',
        model: record.vehicle.model || '(empty)',
        reason: exclusionReason,
      };
      
      // If reason is missing required fields, specify which ones
      if (exclusionReason === 'Missing required fields') {
        excludedVehicle.missingFields = getMissingRequiredFields(record);
      }
      
      result.excludedSamples.push(excludedVehicle);
    } else {
      // Vehicle would be imported
      result.wouldBeImported++;
      
      const status = getVehicleStatus(record);
      if (status === 'PUBLISHED') {
        result.publishedVehicles++;
      } else {
        result.draftVehicles++;
      }
    }
  }

  return result;
}

/**
 * Display analysis results
 */
function displayResults(result: AnalysisResult): void {
  console.log('📊 Vehicle Import Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`Total records in catalog: ${result.totalRecords}\n`);
  
  console.log(`✅ WOULD BE IMPORTED: ${result.wouldBeImported} vehicles`);
  console.log(`  📗 Published: ${result.publishedVehicles} (complete info + images + postcode)`);
  console.log(`  📝 Draft: ${result.draftVehicles} (missing postcode or images)\n`);
  
  console.log(`❌ EXCLUDED FROM IMPORT: ${result.excludedVehicles} vehicles\n`);
  
  console.log('Exclusion Reasons:');
  console.log(`  • No owner email: ${result.exclusionReasons.noOwnerEmail} vehicles`);
  console.log(`  • Empty model field: ${result.exclusionReasons.emptyModel} vehicles`);
  console.log(`  • Empty make field: ${result.exclusionReasons.emptyMake} vehicles`);
  console.log(`  • Invalid make pattern: ${result.exclusionReasons.invalidMakePattern} vehicles`);
  console.log(`  • Missing required fields: ${result.exclusionReasons.missingRequiredFields} vehicles\n`);
  
  if (result.excludedSamples.length > 0) {
    const sampleCount = Math.min(20, result.excludedSamples.length);
    console.log(`Sample Excluded Vehicles (showing first ${sampleCount} of ${result.excludedSamples.length}):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (let i = 0; i < sampleCount; i++) {
      const sample = result.excludedSamples[i];
      console.log(`ID: ${sample.id}`);
      console.log(`  Name: ${sample.name}`);
      console.log(`  Make: ${sample.make}`);
      console.log(`  Model: ${sample.model}`);
      console.log(`  Reason: ${sample.reason}`);
      if (sample.missingFields && sample.missingFields.length > 0) {
        console.log(`  Missing: ${sample.missingFields.join(', ')}`);
      }
      console.log('');
    }
  }
}

/**
 * Save results to files
 */
function saveResults(result: AnalysisResult): void {
  const outputDir = path.join(process.cwd(), 'data');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save as JSON
  const jsonPath = path.join(outputDir, 'excluded-vehicles.json');
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
  console.log(`\n💾 Saved detailed results to: ${jsonPath}`);
  
  // Save excluded vehicles as CSV
  const csvPath = path.join(outputDir, 'excluded-vehicles.csv');
  const csvLines = [
    'ID,Name,Make,Model,Reason,Missing Fields',
    ...result.excludedSamples.map(v => {
      const missingFields = v.missingFields ? v.missingFields.join('; ') : '';
      return `"${v.id}","${v.name}","${v.make}","${v.model}","${v.reason}","${missingFields}"`;
    })
  ];
  fs.writeFileSync(csvPath, csvLines.join('\n'));
  console.log(`💾 Saved excluded vehicles list to: ${csvPath}`);
  console.log(`   (${result.excludedVehicles} vehicles)\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔍 Starting vehicle import analysis...\n');
    
    const catalog = loadVehicleCatalog();
    const result = analyzeRecords(catalog);
    displayResults(result);
    saveResults(result);
    
    console.log('✅ Analysis complete!\n');
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

main();

