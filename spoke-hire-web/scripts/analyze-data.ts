#!/usr/bin/env tsx

/**
 * Data analysis script - analyze existing data without migrating
 * Run with: npm run analyze-data
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SourceRecord } from '../src/lib/migration/data-mappers.js';
import {
  extractEmail,
  extractUserData,
  extractVehicleData,
  extractMediaUrls,
  extractOriginalId,
  convertEngineCapacity,
  convertNumberOfSeats,
} from '../src/lib/migration/data-mappers.js';

interface DataSources {
  catalog: SourceRecord[];
  cleansed: SourceRecord[];
  submission: SourceRecord[];
}

interface AnalysisResult {
  totalRecords: number;
  uniqueEmails: Set<string>;
  uniqueVehicles: Set<string>;
  totalMedia: number;
  recordsWithMedia: number;
  engineCapacities: Map<string, number>;
  seatCounts: Map<number, number>;
  makes: Map<string, number>;
  years: Map<string, number>;
  fieldCompleteness: Record<string, number>;
}

async function loadDataSources(): Promise<DataSources> {
  const dataDir = path.join(process.cwd(), '../data-analitics/data');
  
  console.log('📥 Loading data sources...');
  
  const sources: DataSources = {
    catalog: [],
    cleansed: [],
    submission: [],
  };
  
  try {
    // Load catalog data
    const catalogPath = path.join(dataDir, 'catalog_products.json');
    if (fs.existsSync(catalogPath)) {
      sources.catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      console.log(`✅ Loaded ${sources.catalog.length} catalog records`);
    } else {
      console.log('⚠️ Catalog data not found');
    }
    
    // Load cleansed data
    const cleansedPath = path.join(dataDir, 'cleansed_database.json');
    if (fs.existsSync(cleansedPath)) {
      sources.cleansed = JSON.parse(fs.readFileSync(cleansedPath, 'utf8'));
      console.log(`✅ Loaded ${sources.cleansed.length} cleansed records`);
    } else {
      console.log('⚠️ Cleansed data not found');
    }
    
    // Load submission data
    const submissionPath = path.join(dataDir, 'submission.from.1march.2025.json');
    if (fs.existsSync(submissionPath)) {
      sources.submission = JSON.parse(fs.readFileSync(submissionPath, 'utf8'));
      console.log(`✅ Loaded ${sources.submission.length} submission records`);
    } else {
      console.log('⚠️ Submission data not found');
    }
    
  } catch (error) {
    console.error('❌ Error loading data sources:', error);
    throw error;
  }
  
  return sources;
}

function analyzeSource(records: SourceRecord[], sourceName: string): AnalysisResult {
  const result: AnalysisResult = {
    totalRecords: records.length,
    uniqueEmails: new Set(),
    uniqueVehicles: new Set(),
    totalMedia: 0,
    recordsWithMedia: 0,
    engineCapacities: new Map(),
    seatCounts: new Map(),
    makes: new Map(),
    years: new Map(),
    fieldCompleteness: {},
  };
  
  for (const record of records) {
    // Extract basic info
    const email = extractEmail(record, sourceName);
    const userData = extractUserData(record, sourceName);
    const vehicleData = extractVehicleData(record, sourceName);
    const mediaUrls = extractMediaUrls(record, sourceName);
    const originalId = extractOriginalId(record, sourceName);
    
    // Count unique emails
    if (email) result.uniqueEmails.add(email);
    
    // Count unique vehicles
    if (originalId) result.uniqueVehicles.add(`${sourceName}:${originalId}`);
    
    // Count media
    result.totalMedia += mediaUrls.length;
    if (mediaUrls.length > 0) result.recordsWithMedia++;
    
    // Analyze vehicle data
    if (vehicleData) {
      // Engine capacities
      if (vehicleData.engineCapacity) {
        const capacity = vehicleData.engineCapacity.toString();
        result.engineCapacities.set(capacity, (result.engineCapacities.get(capacity) || 0) + 1);
      }
      
      // Seat counts
      if (vehicleData.numberOfSeats) {
        result.seatCounts.set(vehicleData.numberOfSeats, (result.seatCounts.get(vehicleData.numberOfSeats) || 0) + 1);
      }
      
      // Makes
      if (vehicleData.make) {
        result.makes.set(vehicleData.make, (result.makes.get(vehicleData.make) || 0) + 1);
      }
      
      // Years
      if (vehicleData.year) {
        result.years.set(vehicleData.year, (result.years.get(vehicleData.year) || 0) + 1);
      }
    }
    
    // Field completeness
    const fields = [
      'email', 'firstName', 'lastName', 'phone', 'street', 'city', 'county', 'postcode', 'country',
      'make', 'model', 'year', 'registration', 'engineCapacity', 'numberOfSeats', 'steering',
      'gearbox', 'exteriorColour', 'interiorColour', 'condition', 'isRoadLegal', 'price'
    ];
    
    for (const field of fields) {
      let hasValue = false;
      
      if (userData && (userData as any)[field]) hasValue = true;
      if (vehicleData && (vehicleData as any)[field]) hasValue = true;
      
      if (hasValue) {
        result.fieldCompleteness[field] = (result.fieldCompleteness[field] || 0) + 1;
      }
    }
  }
  
  return result;
}

function printAnalysis(sourceName: string, analysis: AnalysisResult): void {
  console.log(`\n📊 ${sourceName.toUpperCase()} Analysis:`);
  console.log(`  Total Records: ${analysis.totalRecords}`);
  console.log(`  Unique Emails: ${analysis.uniqueEmails.size}`);
  console.log(`  Unique Vehicles: ${analysis.uniqueVehicles.size}`);
  console.log(`  Total Media: ${analysis.totalMedia}`);
  console.log(`  Records with Media: ${analysis.recordsWithMedia}`);
  
  // Top makes
  const topMakes = Array.from(analysis.makes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log(`  Top Makes: ${topMakes.map(([make, count]) => `${make}(${count})`).join(', ')}`);
  
  // Engine capacity distribution
  const topCapacities = Array.from(analysis.engineCapacities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log(`  Engine Capacities: ${topCapacities.map(([cap, count]) => `${cap}cc(${count})`).join(', ')}`);
  
  // Seat distribution
  const seatDist = Array.from(analysis.seatCounts.entries())
    .sort((a, b) => a[0] - b[0]);
  console.log(`  Seat Distribution: ${seatDist.map(([seats, count]) => `${seats}seats(${count})`).join(', ')}`);
  
  // Year range
  const years = Array.from(analysis.years.keys())
    .filter(year => year && year !== '')
    .map(year => parseInt(year))
    .filter(year => !isNaN(year))
    .sort((a, b) => a - b);
  
  if (years.length > 0) {
    console.log(`  Year Range: ${years[0]} - ${years[years.length - 1]}`);
  }
  
  // Field completeness (top 10)
  const topFields = Object.entries(analysis.fieldCompleteness)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log(`  Field Completeness:`);
  for (const [field, count] of topFields) {
    const percentage = ((count / analysis.totalRecords) * 100).toFixed(1);
    console.log(`    ${field}: ${count}/${analysis.totalRecords} (${percentage}%)`);
  }
}

function printOverallAnalysis(sources: DataSources): void {
  const totalRecords = Object.values(sources).reduce((sum, records) => sum + records.length, 0);
  const allEmails = new Set<string>();
  const allVehicles = new Set<string>();
  let totalMedia = 0;
  let recordsWithMedia = 0;
  
  for (const [sourceName, records] of Object.entries(sources)) {
    for (const record of records) {
      const email = extractEmail(record, sourceName);
      const originalId = extractOriginalId(record, sourceName);
      const mediaUrls = extractMediaUrls(record, sourceName);
      
      if (email) allEmails.add(email);
      if (originalId) allVehicles.add(`${sourceName}:${originalId}`);
      
      totalMedia += mediaUrls.length;
      if (mediaUrls.length > 0) recordsWithMedia++;
    }
  }
  
  console.log('\n🌍 OVERALL Analysis:');
  console.log(`  Total Records Across All Sources: ${totalRecords}`);
  console.log(`  Unique Emails Across All Sources: ${allEmails.size}`);
  console.log(`  Unique Vehicles Across All Sources: ${allVehicles.size}`);
  console.log(`  Total Media Across All Sources: ${totalMedia}`);
  console.log(`  Records with Media Across All Sources: ${recordsWithMedia}`);
  
  // Potential duplicates
  const emailDuplicates = allEmails.size < totalRecords;
  const vehicleDuplicates = allVehicles.size < totalRecords;
  
  console.log(`  Potential Email Duplicates: ${emailDuplicates ? 'Yes' : 'No'}`);
  console.log(`  Potential Vehicle Duplicates: ${vehicleDuplicates ? 'Yes' : 'No'}`);
}

async function main() {
  console.log('🔍 Starting data analysis...\n');
  
  try {
    // Load data sources
    const sources = await loadDataSources();
    
    // Analyze each source
    for (const [sourceName, records] of Object.entries(sources)) {
      if (records.length > 0) {
        const analysis = analyzeSource(records, sourceName);
        printAnalysis(sourceName, analysis);
      }
    }
    
    // Overall analysis
    printOverallAnalysis(sources);
    
    console.log('\n✅ Data analysis completed!');
    
  } catch (error) {
    console.error('❌ Data analysis failed:', error);
    process.exit(1);
  }
}

main();
