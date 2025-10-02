/**
 * Migration runner for processed vehicle catalog
 * Uses the processed vehicle-catalog.json instead of raw source files
 * Validates image extensions and skips media without proper extensions
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parseCollections, generateCollectionSlug, mapSteeringToType } from './data-mappers.js';

const prisma = new PrismaClient();

/**
 * Normalize registration number by uppercasing and removing spaces
 */
function normalizeRegistration(registration: string): string {
  if (!registration) return '';
  return registration.toUpperCase().replace(/\s+/g, '');
}

/**
 * Check if two registration numbers are similar (for deduplication)
 */
function areRegistrationsSimilar(reg1: string, reg2: string): boolean {
  const normalized1 = normalizeRegistration(reg1);
  const normalized2 = normalizeRegistration(reg2);

  // Exact match after normalization
  if (normalized1 === normalized2) return true;

  // Check if one is contained in the other (e.g., "ABC123" vs "ABC 123")
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;

  // Check for common typos (e.g., "O" vs "0", "I" vs "1")
  const clean1 = normalized1.replace(/[O0]/g, '0').replace(/[I1]/g, '1');
  const clean2 = normalized2.replace(/[O0]/g, '0').replace(/[I1]/g, '1');

  return clean1 === clean2;
}

/**
 * Get ISO country code from country name
 */
function getCountryCode(countryName: string): string | null {
  // Simple mapping for common countries found in the data
  // Only return codes for countries that have unique ISO codes
  const countryCodeMap: Record<string, string> = {
    'USA': 'US',
    'United States': 'US',
    'America': 'US',
    'Germany': 'DE',
    'Deutschland': 'DE',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Ireland': 'IE',
    'Portugal': 'PT',
    'Greece': 'GR',
    'Poland': 'PL',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Slovakia': 'SK',
    'Slovenia': 'SI',
    'Croatia': 'HR',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Estonia': 'EE',
    'Latvia': 'LV',
    'Lithuania': 'LT',
    'Luxembourg': 'LU',
    'Malta': 'MT',
    'Cyprus': 'CY',
    // Don't set codes for UK countries since they all map to GB
    // and we want unique names instead
  };

  return countryCodeMap[countryName] || null;
}

/**
 * Check if a record has complete car information for PUBLISHED status
 */
function hasCompleteCarInfo(record: ProcessedVehicleRecord): boolean {
  const vehicle = record.vehicle;

  // Must have user email (already filtered by requireUserContact)
  if (!record.owner?.email) return false;

  // Must have all required car fields
  const requiredFields = [
    'make', 'model', 'year', 'registration',
    'engineCapacity', 'numberOfSeats', 'steering',
    'gearbox', 'isRoadLegal'
  ];

  return requiredFields.every(field => {
    const value = vehicle[field as keyof typeof vehicle];
    return value !== null && value !== undefined && value !== '' && value !== 'null';
  });
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
 * Check if image file exists in the /public/car-images folder
 */
function checkImageExists(imageUrl: string): boolean {
  try {
    // Extract filename from URL
    const filename = imageUrl.split('/').pop();
    if (!filename) return false;
    
    // Check in public/car-images folder (relative to project root)
    const imagePath = path.join(process.cwd(), 'public', 'car-images', filename);
    return fs.existsSync(imagePath);
  } catch (error) {
    console.warn(`⚠️ Error checking image existence for ${imageUrl}:`, error);
    return false;
  }
}

/**
 * Determine media status based on image availability
 */
function getMediaStatus(imageUrl: string): 'UPLOADING' | 'PROCESSING' | 'READY' {
  const imageExists = checkImageExists(imageUrl);
  
  if (imageExists) {
    return 'PROCESSING'; // Image downloaded but needs processing
  } else {
    return 'UPLOADING'; // Image needs to be downloaded
  }
}

/**
 * Clean model name by removing make name prefix if it exists
 */
function cleanModelName(modelName: string, makeName: string): string {
  if (!modelName || !makeName) return modelName;
  
  // Normalize both names for comparison (remove special characters, lowercase)
  const normalizeForComparison = (str: string) => 
    str.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const normalizedModel = normalizeForComparison(modelName);
  const normalizedMake = normalizeForComparison(makeName);
  
  // Check if model starts with make name
  if (normalizedModel.startsWith(normalizedMake)) {
    // Find the actual position in the original string where make name ends
    const makeWords = makeName.split(/\s+/);
    let remainingModel = modelName;
    
    // Try to match make words at the beginning of model name
    for (const makeWord of makeWords) {
      const normalizedMakeWord = normalizeForComparison(makeWord);
      const normalizedRemaining = normalizeForComparison(remainingModel);
      
      if (normalizedRemaining.startsWith(normalizedMakeWord)) {
        // Find where this word ends in the original string
        const regex = new RegExp(`^\\s*${makeWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
        remainingModel = remainingModel.replace(regex, '');
      }
    }
    
    // Clean up any leading/trailing whitespace and return
    const cleaned = remainingModel.trim();
    
    // If we removed everything, return the original model name
    if (!cleaned) return modelName;
    
    return cleaned;
  }
  
  return modelName;
}

export interface MigrationFilters {
  // Data completeness filters
  requireCompleteCarInfo?: boolean; // Records with all car fields (Make, Model, Year, etc.) -> set to PUBLISHED
  requireBasicCarInfo?: boolean; // Records with user info + basic car (Make, Model) -> set to DRAFT
  requireUserContact?: boolean; // Only records with owner email
}

export const DEFAULT_FILTERS: MigrationFilters = {
  requireCompleteCarInfo: true, // Default to only migrate complete car records
  requireBasicCarInfo: true, // Also migrate basic records by default
  requireUserContact: true, // Always require user contact info
};

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

interface MigrationStats {
  usersCreated: number;
  usersUpdated: number;
  vehiclesCreated: number;
  vehiclesPublished: number;
  vehiclesDraft: number;
  registrationDuplicates: number;
  mediaCreated: number;
  mediaDuplicates: number;
  mediaSkippedInvalidExtension: number;
  mediaUploading: number;
  mediaProcessing: number;
  sourcesCreated: number;
  collectionsCreated: number;
  steeringTypesCreated: number;
  countriesCreated: number;
  errors: string[];
}

/**
 * Load processed vehicle catalog
 */
async function loadProcessedVehicleCatalog(): Promise<ProcessedVehicleCatalog> {
  console.log('📥 Loading processed vehicle catalog...');
  
  const catalogPath = path.join(process.cwd(), 'public/data/vehicle-catalog.json');
  
  if (!fs.existsSync(catalogPath)) {
    throw new Error('vehicle-catalog.json not found in public/data/');
  }
  
  try {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as ProcessedVehicleCatalog;
    console.log(`✅ Loaded ${catalog.records.length} processed vehicle records`);
    console.log(`📊 Generated: ${catalog.metadata.generatedAt}`);
    
    return catalog;
  } catch (error) {
    console.error('❌ Error loading processed vehicle catalog:', error);
    throw error;
  }
}

/**
 * Apply filters to processed vehicle records
 */
function applyFilters(
  catalog: ProcessedVehicleCatalog,
  filters: MigrationFilters = DEFAULT_FILTERS
): ProcessedVehicleRecord[] {
  console.log('🔍 Applying data completeness filters to processed vehicle records...');

  let filteredRecords = [...catalog.records];
  const originalCount = filteredRecords.length;

  // Step 1: Filter out records without user contact info
  if (filters.requireUserContact) {
    const beforeCount = filteredRecords.length;
    filteredRecords = filteredRecords.filter(record => record.owner?.email);
    const afterCount = filteredRecords.length;
    const removedCount = beforeCount - afterCount;
    console.log(`  📧 User contact filter: ${afterCount} records with email kept, ${removedCount} records without email filtered out`);
  }

  // Step 2: Apply complete car info filter (for PUBLISHED status)
  if (filters.requireCompleteCarInfo) {
    const beforeCount = filteredRecords.length;
    filteredRecords = filteredRecords.filter(record => hasCompleteCarInfo(record));
    const afterCount = filteredRecords.length;
    const removedCount = beforeCount - afterCount;
    console.log(`  🚗 Complete car info filter: ${afterCount} complete records kept, ${removedCount} incomplete records filtered out`);
  }

  // Step 3: Apply basic car info filter (for DRAFT status)
  if (filters.requireBasicCarInfo) {
    const beforeCount = filteredRecords.length;
    filteredRecords = filteredRecords.filter(record => hasBasicCarInfo(record));
    const afterCount = filteredRecords.length;
    const removedCount = beforeCount - afterCount;
    console.log(`  📝 Basic car info filter: ${afterCount} basic records kept, ${removedCount} records filtered out`);
  }

  console.log(`📊 Filtered records: ${filteredRecords.length} out of ${originalCount} total records`);

  return filteredRecords;
}

/**
 * Analyze processed data
 */
async function analyzeData(records: ProcessedVehicleRecord[]): Promise<void> {
  console.log('\n📊 Analyzing processed vehicle data...');
  
  const uniqueEmails = new Set<string>();
  const uniqueVehicles = new Set<string>();
  let totalImages = 0;
  let recordsWithImages = 0;
  let recordsWithOwners = 0;
  
  for (const record of records) {
    // Extract email
    if (record.owner?.email) {
      uniqueEmails.add(record.owner.email);
      recordsWithOwners++;
    }
    
    // Count vehicles
    uniqueVehicles.add(record.id);
    
    // Count images
    if (record.images && record.images.length > 0) {
      totalImages += record.images.length;
      recordsWithImages++;
    }
  }
  
  console.log('📈 Analysis Results:');
  console.log(`  Total Records: ${records.length}`);
  console.log(`  Unique Emails: ${uniqueEmails.size}`);
  console.log(`  Records with Owners: ${recordsWithOwners}`);
  console.log(`  Unique Vehicles: ${uniqueVehicles.size}`);
  console.log(`  Total Images: ${totalImages}`);
  console.log(`  Records with Images: ${recordsWithImages}`);
}

/**
 * Setup steering types
 */
async function setupSteeringTypes(): Promise<Record<string, string>> {
  console.log('\n🔧 Setting up steering types...');
  
  const steeringTypes = [
    { name: 'Right Hand Drive', code: 'RHD', description: 'Steering wheel on the right side' },
    { name: 'Left Hand Drive', code: 'LHD', description: 'Steering wheel on the left side' },
  ];
  
  const steeringMap: Record<string, string> = {};
  
  for (const steering of steeringTypes) {
    const created = await prisma.steeringType.upsert({
      where: { code: steering.code },
      update: steering,
      create: steering,
    });
    steeringMap[steering.name] = created.id;
    console.log(`✅ Created/updated steering type: ${steering.name}`);
  }
  
  return steeringMap;
}

/**
 * Setup makes and models from processed records
 */
async function setupMakesAndModels(records: ProcessedVehicleRecord[]): Promise<{
  makeMap: Record<string, string>;
  modelMap: Record<string, string>;
}> {
  console.log('\n🏭 Setting up makes and models...');
  
  const makeNames = new Set<string>();
  const modelData = new Map<string, Set<string>>(); // make -> models
  
  // Extract makes and models from processed records
  for (const record of records) {
    let { make, model } = record.vehicle;
    const { name } = record.vehicle;
    
    // Handle invalid make data (contains # or other invalid patterns)
    const isInvalidMake = make && (
      make.includes('#') || 
      make.startsWith('#') ||
      /^\d+$/.test(make) || // Pure numbers like "8", "123"
      make.length <= 2 || // Very short strings like "8", "AB"
      make.includes(':') || // Color codes like "red:blue"
      make.toLowerCase().includes('color') // Contains word "color"
    );
    
    if (isInvalidMake) {
      // Use vehicle name and split by words - first word as make, rest as model
      if (name) {
        const nameWords = name.trim().split(/\s+/);
        if (nameWords.length >= 2) {
          make = nameWords[0];
          model = nameWords.slice(1).join(' ');
          console.log(`🔧 Fixed invalid make "${record.vehicle.make}" → using name "${name}" → Make: "${make}", Model: "${model}"`);
        } else {
          // If name has only one word, skip this record
          console.warn(`⚠️ Skipping record with invalid make "${record.vehicle.make}" and insufficient name "${name}"`);
          continue;
        }
      } else {
        console.warn(`⚠️ Skipping record with invalid make "${record.vehicle.make}" and no name`);
        continue;
      }
    }
    
    if (make && model) {
      makeNames.add(make);
      
      if (!modelData.has(make)) {
        modelData.set(make, new Set());
      }
      modelData.get(make)!.add(model);
    }
  }
  
  const makeMap: Record<string, string> = {};
  const modelMap: Record<string, string> = {};
  
  // Create makes first
  for (const makeName of makeNames) {
    const slug = makeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const created = await prisma.make.upsert({
      where: { slug },
      update: { name: makeName },
      create: {
        name: makeName,
        slug,
        isActive: true,
      },
    });
    makeMap[makeName] = created.id;
    console.log(`✅ Created/updated make: ${makeName} (${slug})`);
  }
  
  // Create models for each make
  for (const [makeName, models] of modelData.entries()) {
    const makeId = makeMap[makeName];
    if (!makeId) continue;
    
    for (const originalModelName of models) {
      // Clean model name by removing make name prefix if it exists
      const cleanedModelName = cleanModelName(originalModelName, makeName);
      const slug = cleanedModelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const modelKey = `${makeName}:${originalModelName}`; // Keep original for mapping
      
      const created = await prisma.model.upsert({
        where: {
          makeId_slug: {
            makeId,
            slug,
          },
        },
        update: { name: cleanedModelName },
        create: {
          name: cleanedModelName,
          slug,
          makeId,
          isActive: true,
        },
      });
      modelMap[modelKey] = created.id;
      
      if (cleanedModelName !== originalModelName) {
        console.log(`✅ Created/updated model: ${makeName} "${originalModelName}" → "${cleanedModelName}" (${slug})`);
      } else {
        console.log(`✅ Created/updated model: ${makeName} ${cleanedModelName} (${slug})`);
      }
    }
  }
  
  return { makeMap, modelMap };
}

/**
 * Setup collections from processed records
 */
async function setupCollections(records: ProcessedVehicleRecord[]): Promise<Record<string, string>> {
  console.log('\n🏷️ Setting up collections...');
  
  const collectionNames = new Set<string>();
  
  // Extract collections from processed records
  for (const record of records) {
    if (record.vehicle.collection) {
      const collections = parseCollections(record.vehicle.collection);
      collections.forEach(name => collectionNames.add(name));
    }
  }
  
  const collectionMap: Record<string, string> = {};
  
  for (const name of collectionNames) {
    const slug = generateCollectionSlug(name);
    const created = await prisma.collection.upsert({
      where: { slug },
      update: { name },
      create: {
        name,
        slug,
        isActive: true,
      },
    });
    collectionMap[name] = created.id;
    console.log(`✅ Created/updated collection: ${name} (${slug})`);
  }
  
  return collectionMap;
}

/**
 * Create system user for vehicles without owners
 */
async function createSystemUser(): Promise<string> {
  console.log('\n🤖 Creating system user for vehicles without owners...');
  
  const systemEmail = 'system@spokehire.com';
  
  const systemUser = await prisma.user.upsert({
    where: { email: systemEmail },
    update: {},
    create: {
      email: systemEmail,
      firstName: 'System',
      lastName: 'Catalog',
      userType: 'ADMIN',
      status: 'ACTIVE',
      profileCompleted: true,
    },
  });
  
  console.log(`✅ Created/updated system user: ${systemUser.email} (${systemUser.id})`);
  return systemUser.id;
}

/**
 * Migrate users from processed records
 */
async function migrateUsers(records: ProcessedVehicleRecord[], stats: MigrationStats): Promise<Map<string, string>> {
  console.log('\n👥 Migrating users...');
  
  const userMap = new Map<string, string>();
  const processedEmails = new Set<string>();
  const uniqueCountries = new Set<string>();

  // First pass: collect all unique countries
  for (const record of records) {
    if (record.owner?.address?.country) {
      uniqueCountries.add(record.owner.address.country);
    }
  }

  console.log(`📍 Found ${uniqueCountries.size} unique countries: ${Array.from(uniqueCountries).join(', ')}`);

  // Create country records
  const countryMap = new Map<string, string>();
  for (const countryName of uniqueCountries) {
    try {
      const createdCountry = await prisma.country.upsert({
        where: { name: countryName },
        update: {
          code: getCountryCode(countryName),
          isActive: true,
        },
        create: {
          name: countryName,
          code: getCountryCode(countryName), // Helper function to get ISO code
          isActive: true,
        },
      });
      countryMap.set(countryName, createdCountry.id);
      stats.countriesCreated++;
      console.log(`✅ Created/updated country: ${countryName}`);
    } catch (error) {
      console.warn(`⚠️ Failed to create country ${countryName}:`, error);
    }
  }

  // Create system user for vehicles without owners
  const systemUserId = await createSystemUser();
  userMap.set('SYSTEM_USER', systemUserId);
  
  // Process records to find unique users
  for (const record of records) {
    if (!record.owner?.email || processedEmails.has(record.owner.email)) {
      continue;
    }
    
    const owner = record.owner;
    
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: owner.email },
      });
      
      if (existingUser) {
        // Update existing user with any new data
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            firstName: owner.firstName || existingUser.firstName,
            lastName: owner.lastName || existingUser.lastName,
            phone: owner.phone || existingUser.phone,
            street: owner.address?.street || existingUser.street,
            city: owner.address?.city || existingUser.city,
            county: owner.address?.county || existingUser.county,
            postcode: owner.address?.postcode || existingUser.postcode,
            countryId: owner.address?.country ? countryMap.get(owner.address.country) : existingUser.countryId,
          },
        });
        
        userMap.set(owner.email, updatedUser.id);
        stats.usersUpdated++;
        console.log(`✅ Updated user: ${owner.email}`);
      } else {
        // Create new user
        const newUser = await prisma.user.create({
          data: {
            email: owner.email,
            firstName: owner.firstName,
            lastName: owner.lastName,
            phone: owner.phone,
            street: owner.address?.street,
            city: owner.address?.city,
            county: owner.address?.county,
            postcode: owner.address?.postcode,
            countryId: owner.address?.country ? countryMap.get(owner.address.country) : null,
            userType: 'OWNER_ONLY',
            status: 'ACTIVE',
            profileCompleted: true,
          },
        });
        
        userMap.set(owner.email, newUser.id);
        stats.usersCreated++;
        console.log(`✅ Created user: ${owner.email}`);
      }
      
      processedEmails.add(owner.email);
      
    } catch (error) {
      const errorMsg = `Error processing user ${owner.email}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  
  console.log(`\n📊 User migration complete: ${stats.usersCreated} created, ${stats.usersUpdated} updated`);
  return userMap;
}

/**
 * Migrate vehicles from processed records
 */
async function migrateVehicles(
  records: ProcessedVehicleRecord[],
  userMap: Map<string, string>,
  steeringMap: Record<string, string>,
  makeMap: Record<string, string>,
  modelMap: Record<string, string>,
  collectionMap: Record<string, string>,
  stats: MigrationStats
): Promise<Map<string, string>> {
  console.log('\n🚗 Migrating vehicles...');
  
  const vehicleMap = new Map<string, string>();
  
  for (const record of records) {
    const vehicle = record.vehicle;
    
    try {
      // Find user ID
      let userId: string | undefined;
      if (record.owner?.email) {
        userId = userMap.get(record.owner.email);
      } else {
        // Use system user for vehicles without owners
        userId = userMap.get('SYSTEM_USER');
      }
      
      if (!userId) {
        console.warn(`⚠️ No user found for vehicle ${record.id}, skipping`);
        continue;
      }
      
      // Map steering to steering type ID
      let steeringId: string | undefined;
      if (vehicle.steering) {
        const steeringType = mapSteeringToType(vehicle.steering);
        if (steeringType) {
          steeringId = steeringMap[steeringType.name];
        }
      }
      
      // Handle invalid make data (same logic as in setupMakesAndModels)
      let actualMake = vehicle.make;
      let actualModel = vehicle.model;
      
      const isInvalidMake = vehicle.make && (
        vehicle.make.includes('#') || 
        vehicle.make.startsWith('#') ||
        /^\d+$/.test(vehicle.make) || // Pure numbers like "8", "123"
        vehicle.make.length <= 2 || // Very short strings like "8", "AB"
        vehicle.make.includes(':') || // Color codes like "red:blue"
        vehicle.make.toLowerCase().includes('color') // Contains word "color"
      );
      
      if (isInvalidMake) {
        if (vehicle.name) {
          const nameWords = vehicle.name.trim().split(/\s+/);
          if (nameWords.length >= 2) {
            actualMake = nameWords[0];
            actualModel = nameWords.slice(1).join(' ');
          } else {
            console.warn(`⚠️ Skipping vehicle with invalid make "${vehicle.make}" and insufficient name "${vehicle.name}"`);
            continue;
          }
        } else {
          console.warn(`⚠️ Skipping vehicle with invalid make "${vehicle.make}" and no name`);
          continue;
        }
      }
      
      // Get make and model IDs using corrected values
      const makeId = makeMap[actualMake];
      const modelKey = `${actualMake}:${actualModel}`;
      const modelId = modelMap[modelKey];
      
      if (!makeId || !modelId) {
        console.warn(`⚠️ Missing make/model IDs for ${actualMake} ${actualModel}, skipping`);
        continue;
      }
      
      // Parse engine capacity
      let engineCapacity: number | undefined;
      if (vehicle.engineCapacity) {
        const capacityStr = vehicle.engineCapacity.trim();

        // Extract the numeric part first (capture full decimal number)
        const match = capacityStr.match(/(\d+(?:\.\d+)?)/);
        if (!match) {
          engineCapacity = undefined;
        } else {
          const numericValue = parseFloat(match[0]); // Use match[0] to get the full match

          // Simple logic: if < 10, treat as liters; if >= 10, treat as CC
          if (numericValue < 10) {
            engineCapacity = Math.round(numericValue * 1000); // Convert liters to CC
          } else {
            engineCapacity = Math.round(numericValue); // Already in CC
          }
        }
      }
      
      // Parse number of seats
      let numberOfSeats: number | undefined;
      if (vehicle.numberOfSeats) {
        const seats = parseInt(vehicle.numberOfSeats);
        if (!isNaN(seats)) {
          numberOfSeats = seats;
        }
      }
      
      // Normalize registration number
      const normalizedRegistration = normalizeRegistration(vehicle.registration);

      // Check for duplicate registrations
      const existingVehicles = await prisma.vehicle.findMany({
        where: {
          registration: {
            not: null,
            mode: 'insensitive'
          }
        },
        include: {
          owner: true,
          media: true
        }
      });

      // Check if this registration already exists
      let isDuplicate = false;
      let duplicateVehicle = null;

      for (const existingVehicle of existingVehicles) {
        if (areRegistrationsSimilar(vehicle.registration, existingVehicle.registration)) {
          // Found a potential duplicate - check additional criteria
          const currentHasImages = (record.images?.urls?.length || 0) > 0;
          const existingHasImages = (existingVehicle.media?.length || 0) > 0;
          const currentHasOwner = record.owner?.email;
          const existingHasOwner = existingVehicle.owner?.email;

          // Consider it a duplicate if:
          // 1. Same/similar registration
          // 2. Both have images OR both have owner contact info
          if ((currentHasImages && existingHasImages) ||
              (currentHasOwner && existingHasOwner)) {
            isDuplicate = true;
            duplicateVehicle = existingVehicle;
            break;
          }
        }
      }

      if (isDuplicate) {
        stats.registrationDuplicates++;
        console.log(`⚠️ Skipped duplicate vehicle: ${vehicle.name} (${vehicle.registration}) - matches existing vehicle ${duplicateVehicle.id}`);
        continue;
      }

      // Create vehicle
      const createdVehicle = await prisma.vehicle.create({
        data: {
          name: vehicle.name,
          makeId: makeId,
          modelId: modelId,
          year: vehicle.year,
          registration: normalizedRegistration || vehicle.registration,
          engineCapacity: engineCapacity,
          numberOfSeats: numberOfSeats,
          steeringId: steeringId,
          gearbox: vehicle.gearbox,
          exteriorColour: vehicle.exteriorColour,
          interiorColour: vehicle.interiorColour,
          condition: vehicle.condition,
          isRoadLegal: vehicle.isRoadLegal === 'Yes',
          price: vehicle.price,
          status: hasCompleteCarInfo(record) && (record.images?.urls?.length || 0) > 0 && record.owner?.address?.postcode ? 'PUBLISHED' : 'DRAFT',
          description: vehicle.condition,
          ownerId: userId,
        },
      });
      
      vehicleMap.set(record.id, createdVehicle.id);
      stats.vehiclesCreated++;

      // Track vehicle status
      if (createdVehicle.status === 'PUBLISHED') {
        stats.vehiclesPublished++;
      } else if (createdVehicle.status === 'DRAFT') {
        stats.vehiclesDraft++;
      }

      // Track vehicles without images or postcode
      if (!record.images || !record.images.urls || record.images.urls.length === 0) {
        console.log(`📷 Vehicle ${createdVehicle.id} has no images - marked as DRAFT`);
      } else if (!record.owner?.address?.postcode) {
        console.log(`📮 Vehicle ${createdVehicle.id} has no postcode - marked as DRAFT`);
      }
      
      // Assign collections if available
      if (vehicle.collection) {
        const collections = parseCollections(vehicle.collection);
        for (const collectionName of collections) {
          const collectionId = collectionMap[collectionName];
          if (collectionId) {
            try {
              await prisma.vehicleCollection.create({
                data: {
                  vehicleId: createdVehicle.id,
                  collectionId: collectionId,
                },
              });
              console.log(`✅ Assigned collection "${collectionName}" to vehicle ${vehicle.name}`);
            } catch (error) {
              console.warn(`⚠️ Failed to assign collection "${collectionName}": ${error}`);
            }
          }
        }
      }
      
      console.log(`✅ Created vehicle: ${vehicle.name} (${createdVehicle.id})`);
      
    } catch (error) {
      const errorMsg = `Error creating vehicle ${record.id}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  
  console.log(`\n📊 Vehicle migration complete: ${stats.vehiclesCreated} vehicles created`);
  return vehicleMap;
}

/**
 * Migrate media from processed records
 */
async function migrateMedia(
  records: ProcessedVehicleRecord[],
  vehicleMap: Map<string, string>,
  stats: MigrationStats
): Promise<void> {
  console.log('\n📸 Migrating media...');
  
  for (const record of records) {
    const vehicleId = vehicleMap.get(record.id);
    
    if (!vehicleId || !record.images || !record.images.urls || record.images.urls.length === 0) {
      continue; // Skip if no vehicle was created or no images
    }
    
    for (let i = 0; i < record.images.urls.length; i++) {
      const imageUrl = record.images.urls[i];
      const imageTitle = record.images.titles?.[i] || null;
      
      try {
        // Extract filename from URL
        const filename = imageUrl.split('/').pop() || `image_${i + 1}`;

        // Validate filename has a proper image extension
        const hasValidExtension = filename && /\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/i.test(filename);
        
        if (!hasValidExtension) {
          console.log(`⚠️ Skipped media with invalid extension: ${filename} (URL: ${imageUrl})`);
          stats.mediaSkippedInvalidExtension++;
          continue;
        }

        // Determine media status based on image availability
        const mediaStatus = getMediaStatus(imageUrl);
        const imageExists = checkImageExists(imageUrl);

        // Check if media already exists for this URL and vehicle
        const existingMedia = await prisma.media.findFirst({
          where: {
            originalUrl: imageUrl,
            vehicleId: vehicleId,
          },
        });

        if (existingMedia) {
          stats.mediaDuplicates++;
          console.log(`⚠️ Skipped duplicate media: ${filename} (already exists for vehicle ${vehicleId})`);
          continue;
        }

        // Create new media record using upsert to handle race conditions
        const createdMedia = await prisma.media.upsert({
          where: {
            originalUrl_vehicleId: {
              originalUrl: imageUrl,
              vehicleId: vehicleId,
            },
          },
          update: {
            // If it exists, we could update certain fields, but since we're checking above, this shouldn't happen
            status: mediaStatus,
            order: i + 1,
            isPrimary: i === 0,
          },
          create: {
            type: 'IMAGE',
            originalUrl: imageUrl,
            filename: filename,
            title: imageTitle,
            mimeType: 'image/jpeg', // Assume JPEG for now
            format: 'JPEG',
            vehicleId: vehicleId,
            order: i + 1,
            isPrimary: i === 0, // First image is primary
            status: mediaStatus,
            isVisible: true,
          },
        });

        stats.mediaCreated++;

        // Track status counts
        if (mediaStatus === 'UPLOADING') {
          stats.mediaUploading++;
        } else if (mediaStatus === 'PROCESSING') {
          stats.mediaProcessing++;
        }

        const statusIcon = imageExists ? '📁' : '🔄';
        console.log(`✅ Created media: ${filename} [${statusIcon} ${mediaStatus}] for vehicle ${vehicleId}`);
        
      } catch (error) {
        const errorMsg = `Error creating media ${imageUrl}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
  }
  
  console.log(`\n📊 Media migration complete: ${stats.mediaCreated} media items created`);
}

/**
 * Create source tracking from processed records
 */
async function createSourceTracking(
  records: ProcessedVehicleRecord[],
  vehicleMap: Map<string, string>,
  stats: MigrationStats
): Promise<void> {
  console.log('\n📋 Creating source tracking...');
  
  for (const record of records) {
    const vehicleId = vehicleMap.get(record.id);
    
    if (!vehicleId) {
      continue; // Skip if no vehicle was created
    }
    
    try {
      await prisma.vehicleSource.create({
        data: {
          vehicleId: vehicleId,
          sourceType: 'processed_catalog',
          sourceId: record.id,
          rawData: {
            primarySource: record.primarySource,
            sources: record.sources,
            originalRecord: record,
          },
        },
      });
      
      stats.sourcesCreated++;
      console.log(`✅ Created source tracking: processed_catalog:${record.id} for vehicle ${vehicleId}`);
      
    } catch (error) {
      const errorMsg = `Error creating source tracking ${record.id}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  
  console.log(`\n📊 Source tracking complete: ${stats.sourcesCreated} sources created`);
}

/**
 * Get final migration statistics
 */
async function getFinalStatistics(): Promise<void> {
  console.log('\n📊 Final Database Statistics:');
  
  const userCount = await prisma.user.count();
  const vehicleCount = await prisma.vehicle.count();
  const mediaCount = await prisma.media.count();
  const sourceCount = await prisma.vehicleSource.count();
  const collectionCount = await prisma.collection.count();
  const steeringTypeCount = await prisma.steeringType.count();
  const makeCount = await prisma.make.count();
  const modelCount = await prisma.model.count();
  
  console.log(`  Users: ${userCount}`);
  console.log(`  Vehicles: ${vehicleCount}`);
  console.log(`  Media: ${mediaCount}`);
  console.log(`  Sources: ${sourceCount}`);
  console.log(`  Collections: ${collectionCount}`);
  console.log(`  Steering Types: ${steeringTypeCount}`);
  console.log(`  Makes: ${makeCount}`);
  console.log(`  Models: ${modelCount}`);
}

/**
 * Clean all migrated data from database
 */
export async function cleanDatabase(): Promise<void> {
  console.log('🧹 Cleaning database...');
  
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.vehicleCollection.deleteMany();
    console.log('  ✅ Deleted vehicle collections');
    
    await prisma.vehicleSpecification.deleteMany();
    console.log('  ✅ Deleted vehicle specifications');
    
    await prisma.vehicleSource.deleteMany();
    console.log('  ✅ Deleted vehicle sources');
    
    await prisma.media.deleteMany();
    console.log('  ✅ Deleted media');
    
    await prisma.vehicle.deleteMany();
    console.log('  ✅ Deleted vehicles');
    
    await prisma.collection.deleteMany();
    console.log('  ✅ Deleted collections');
    
    await prisma.model.deleteMany();
    console.log('  ✅ Deleted models');
    
    await prisma.make.deleteMany();
    console.log('  ✅ Deleted makes');
    
    await prisma.steeringType.deleteMany();
    console.log('  ✅ Deleted steering types');
    
    await prisma.user.deleteMany();
    console.log('  ✅ Deleted users');
    
    console.log('🧹 Database cleaned successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

/**
 * Main migration function using processed vehicle catalog
 */
export async function runMigration(filters: MigrationFilters = DEFAULT_FILTERS): Promise<void> {
  console.log('🚀 Starting vehicle data migration from processed catalog...\n');
  
  const stats: MigrationStats = {
    usersCreated: 0,
    usersUpdated: 0,
    vehiclesCreated: 0,
    vehiclesPublished: 0,
    vehiclesDraft: 0,
    registrationDuplicates: 0,
    mediaCreated: 0,
    mediaDuplicates: 0,
    mediaSkippedInvalidExtension: 0,
    mediaUploading: 0,
    mediaProcessing: 0,
    sourcesCreated: 0,
    collectionsCreated: 0,
    steeringTypesCreated: 0,
    countriesCreated: 0,
    errors: [],
  };
  
  try {
    // Load processed vehicle catalog
    const catalog = await loadProcessedVehicleCatalog();
    
    // Apply filters
    const filteredRecords = applyFilters(catalog, filters);
    
    // Analyze filtered data
    await analyzeData(filteredRecords);
    
    // Setup reference data
    const steeringMap = await setupSteeringTypes();
    const { makeMap, modelMap } = await setupMakesAndModels(filteredRecords);
    const collectionMap = await setupCollections(filteredRecords);
    
    // Migrate users from processed records
    const userMap = await migrateUsers(filteredRecords, stats);
    
    // Migrate vehicles from processed records
    const vehicleMap = await migrateVehicles(
      filteredRecords, 
      userMap, 
      steeringMap, 
      makeMap, 
      modelMap, 
      collectionMap, 
      stats
    );
    
    // Migrate media from processed records
    await migrateMedia(filteredRecords, vehicleMap, stats);
    
    // Create source tracking for processed records
    await createSourceTracking(filteredRecords, vehicleMap, stats);
    
    // Final statistics
    await getFinalStatistics();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`  Users Created: ${stats.usersCreated}`);
    console.log(`  Users Updated: ${stats.usersUpdated}`);
    console.log(`  Countries Created: ${stats.countriesCreated}`);
    console.log(`  Vehicles Created: ${stats.vehiclesCreated}`);
    console.log(`    🚗 Published: ${stats.vehiclesPublished} (complete car info + images + postcode)`);
    console.log(`    📝 Draft: ${stats.vehiclesDraft} (incomplete data, no images, or no postcode)`);
    console.log(`    ⚠️ Registration Duplicates: ${stats.registrationDuplicates} (skipped similar registrations)`);
    console.log(`  Media Created: ${stats.mediaCreated}`);
    console.log(`    📁 Processing: ${stats.mediaProcessing} (images found in /public/car-images/)`);
    console.log(`    🔄 Uploading: ${stats.mediaUploading} (images need download)`);
    console.log(`    ⚠️ Duplicates: ${stats.mediaDuplicates} (skipped existing images)`);
    console.log(`    ❌ Invalid Extensions: ${stats.mediaSkippedInvalidExtension} (skipped images without valid extensions)`);
    console.log(`  Sources Created: ${stats.sourcesCreated}`);
    console.log(`  Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Full remigration: clean database and run migration
 */
export async function remigrate(filters: MigrationFilters = DEFAULT_FILTERS): Promise<void> {
  console.log('🔄 Starting remigration...\n');
  
  // Clean existing data
  await cleanDatabase();
  
  console.log('\n🚀 Starting fresh migration...\n');
  
  // Run migration
  return await runMigration(filters);
}
