/**
 * Main migration runner for converting existing vehicle data to new schema
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import type {
  SourceRecord,
} from './data-mappers';
import {
  extractEmail,
  extractUserData,
  extractVehicleData,
  extractMediaUrls,
  mapMediaData,
  extractOriginalId,
  mapSteeringToType,
  parseCollections,
  generateCollectionSlug,
} from './data-mappers';

const prisma = new PrismaClient();

interface MigrationStats {
  usersCreated: number;
  usersUpdated: number;
  vehiclesCreated: number;
  mediaCreated: number;
  sourcesCreated: number;
  collectionsCreated: number;
  steeringTypesCreated: number;
  errors: string[];
}

interface DataSources {
  catalog: SourceRecord[];
  cleansed: SourceRecord[];
  submission: SourceRecord[];
}

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
    street?: string;
    city?: string;
    county?: string;
    postcode?: string;
    country?: string;
  };
  images?: string[];
  // Ignore these fields - they're for info only
  cleansedData?: Record<string, unknown>;
  submissionData?: Record<string, unknown>;
  catalogData?: Record<string, unknown>;
}

interface ProcessedVehicleCatalog {
  metadata: {
    generatedAt: string;
    totalRecords: number;
    [key: string]: unknown;
  };
  records: ProcessedVehicleRecord[];
}

export interface MigrationFilters {
  onlyPublished?: boolean; // Filter for published=true in vehicle data
  onlyVisible?: boolean; // Filter for visible=true in vehicle data (deprecated, use onlyPublished)
  // Add more filters here later
}

export const DEFAULT_FILTERS: MigrationFilters = {
  onlyPublished: true, // Default to only migrate published records
};

/**
 * Apply filters to processed vehicle records
 */
function applyFiltersToProcessedRecords(
  catalog: ProcessedVehicleCatalog, 
  filters: MigrationFilters = DEFAULT_FILTERS
): ProcessedVehicleRecord[] {
  console.log('🔍 Applying filters to processed vehicle records...');
  
  let filteredRecords = [...catalog.records];
  const originalCount = filteredRecords.length;
  
  // Apply published filter (primary filter)
  if (filters.onlyPublished) {
    filteredRecords = filteredRecords.filter(record => record.vehicle.published === true);
    const publishedCount = filteredRecords.length;
    const removedCount = originalCount - publishedCount;
    console.log(`  ✅ Published filter: ${publishedCount} published records kept, ${removedCount} unpublished records filtered out`);
  }
  
  // Apply visible filter (fallback or additional filter)
  if (filters.onlyVisible && !filters.onlyPublished) {
    filteredRecords = filteredRecords.filter(record => record.vehicle.visible === true);
    const visibleCount = filteredRecords.length;
    const removedCount = originalCount - visibleCount;
    console.log(`  ✅ Visible filter: ${visibleCount} visible records kept, ${removedCount} hidden records filtered out`);
  }
  
  // Add more filters here later
  
  console.log(`📊 Filtered records: ${filteredRecords.length} out of ${originalCount} total records`);
  
  return filteredRecords;
}

/**
 * Apply filters to source data (DEPRECATED)
 */
function applyFilters(sources: DataSources, filters: MigrationFilters = DEFAULT_FILTERS): DataSources {
  console.log('🔍 Applying data filters...');
  
  const filteredSources: DataSources = {
    catalog: [...sources.catalog],
    cleansed: [...sources.cleansed],
    submission: [...sources.submission],
  };
  
  // Apply visible filter to catalog data
  if (filters.onlyVisible) {
    const originalCatalogCount = filteredSources.catalog.length;
    filteredSources.catalog = filteredSources.catalog.filter(record => record.visible === true);
    const filteredCatalogCount = filteredSources.catalog.length;
    const removedCount = originalCatalogCount - filteredCatalogCount;
    
    console.log(`  ✅ Visible filter: ${filteredCatalogCount} visible records kept, ${removedCount} hidden records filtered out`);
  } else {
    console.log(`  ⚠️ Visible filter disabled - keeping all ${filteredSources.catalog.length} catalog records`);
  }
  
  // Add more filters here later
  
  console.log('📊 Filtered data summary:');
  console.log(`  Catalog: ${filteredSources.catalog.length} records`);
  console.log(`  Cleansed: ${filteredSources.cleansed.length} records`);
  console.log(`  Submission: ${filteredSources.submission.length} records`);
  
  return filteredSources;
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
 * Load data from JSON files (DEPRECATED - use loadProcessedVehicleCatalog)
 */
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
      sources.catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as SourceRecord[];
      console.log(`✅ Loaded ${sources.catalog.length} catalog records`);
    }
    
    // Load cleansed data
    const cleansedPath = path.join(dataDir, 'cleansed_database.json');
    if (fs.existsSync(cleansedPath)) {
      sources.cleansed = JSON.parse(fs.readFileSync(cleansedPath, 'utf8')) as SourceRecord[];
      console.log(`✅ Loaded ${sources.cleansed.length} cleansed records`);
    }
    
    // Load submission data
    const submissionPath = path.join(dataDir, 'submission.from.1march.2025.json');
    if (fs.existsSync(submissionPath)) {
      sources.submission = JSON.parse(fs.readFileSync(submissionPath, 'utf8')) as SourceRecord[];
      console.log(`✅ Loaded ${sources.submission.length} submission records`);
    }
    
  } catch (error) {
    console.error('❌ Error loading data sources:', error);
    throw error;
  }
  
  return sources;
}

/**
 * Analyze existing data before migration
 */
async function analyzeData(sources: DataSources): Promise<void> {
  console.log('\n📊 Analyzing existing data...');
  
  const uniqueEmails = new Set<string>();
  const uniqueVehicles = new Set<string>();
  let totalImages = 0;
  let recordsWithImages = 0;
  
  // Analyze each source
  for (const [sourceName, records] of Object.entries(sources) as Array<[keyof DataSources, SourceRecord[]]>) {
    console.log(`\n📋 ${sourceName.toUpperCase()} Source:`);
    console.log(`  Records: ${records.length}`);
    
    let sourceImages = 0;
    let sourceRecordsWithImages = 0;
    
    for (const record of records) {
      // Extract email
      const email = extractEmail(record, sourceName);
      if (email) uniqueEmails.add(email);
      
      // Extract vehicle identifier
      const vehicleId = extractOriginalId(record, sourceName);
      if (vehicleId) uniqueVehicles.add(`${sourceName}:${vehicleId}`);
      
      // Count images
      const mediaUrls = extractMediaUrls(record, sourceName);
      sourceImages += mediaUrls.length;
      if (mediaUrls.length > 0) sourceRecordsWithImages++;
    }
    
    console.log(`  Images: ${sourceImages}`);
    console.log(`  Records with images: ${sourceRecordsWithImages}`);
    
    totalImages += sourceImages;
    recordsWithImages += sourceRecordsWithImages;
  }
  
  console.log('\n📈 Overall Statistics:');
  console.log(`  Total Records: ${(Object.values(sources) as SourceRecord[][]).reduce((sum, records) => sum + records.length, 0)}`);
  console.log(`  Unique Emails: ${uniqueEmails.size}`);
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
 * Setup makes and models
 */
async function setupMakesAndModels(sources: DataSources): Promise<{
  makeMap: Record<string, string>;
  modelMap: Record<string, string>;
}> {
  console.log('\n🏭 Setting up makes and models...');
  
  const makeNames = new Set<string>();
  const modelData = new Map<string, Set<string>>(); // make -> models
  
  // Extract makes and models from all sources
  for (const [sourceName, records] of Object.entries(sources) as Array<[keyof DataSources, SourceRecord[]]>) {
    for (const record of records) {
      const vehicleData = extractVehicleData(record, sourceName);
      if (vehicleData?.make && vehicleData?.model) {
        makeNames.add(vehicleData.make);
        
        if (!modelData.has(vehicleData.make)) {
          modelData.set(vehicleData.make, new Set());
        }
        modelData.get(vehicleData.make)!.add(vehicleData.model);
      }
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
    
    for (const modelName of models) {
      const slug = modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const modelKey = `${makeName}:${modelName}`;
      
      const created = await prisma.model.upsert({
        where: {
          makeId_slug: {
            makeId,
            slug,
          },
        },
        update: { name: modelName },
        create: {
          name: modelName,
          slug,
          makeId,
          isActive: true,
        },
      });
      modelMap[modelKey] = created.id;
      console.log(`✅ Created/updated model: ${makeName} ${modelName} (${slug})`);
    }
  }
  
  return { makeMap, modelMap };
}

/**
 * Setup collections
 */
async function setupCollections(sources: DataSources): Promise<Record<string, string>> {
  console.log('\n🏷️ Setting up collections...');
  
  const collectionNames = new Set<string>();
  
  // Extract collections from catalog data
  for (const record of sources.catalog) {
    if (record.collection) {
      const collections = parseCollections(record.collection);
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
 * Create system user for catalog vehicles
 */
async function createSystemUser(): Promise<string> {
  console.log('\n🤖 Creating system user for catalog vehicles...');
  
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
 * Migrate users
 */
async function migrateUsers(sources: DataSources, stats: MigrationStats): Promise<Map<string, string>> {
  console.log('\n👥 Migrating users...');
  
  const userMap = new Map<string, string>();
  const processedEmails = new Set<string>();
  
  // Create system user for catalog vehicles
  const systemUserId = await createSystemUser();
  userMap.set('SYSTEM_USER', systemUserId);
  
  // Process all sources to find unique users
  for (const [sourceName, records] of Object.entries(sources) as Array<[keyof DataSources, SourceRecord[]]>) {
    for (const record of records) {
      const userData = extractUserData(record, sourceName);
      if (!userData || processedEmails.has(userData.email)) {
        continue;
      }
      
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });
        
        if (existingUser) {
          // Update existing user with any new data
          const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              firstName: userData.firstName ?? existingUser.firstName,
              lastName: userData.lastName ?? existingUser.lastName,
              phone: userData.phone ?? existingUser.phone,
              street: userData.street ?? existingUser.street,
              city: userData.city ?? existingUser.city,
              county: userData.county ?? existingUser.county,
              postcode: userData.postcode ?? existingUser.postcode,
            },
          });
          
          userMap.set(userData.email, updatedUser.id);
          stats.usersUpdated++;
          console.log(`✅ Updated user: ${userData.email}`);
        } else {
          // Create new user
          const newUser = await prisma.user.create({
            data: {
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
              street: userData.street,
              city: userData.city,
              county: userData.county,
              postcode: userData.postcode,
              userType: 'OWNER_ONLY',
              status: 'ACTIVE',
              profileCompleted: true,
            },
          });
          
          userMap.set(userData.email, newUser.id);
          stats.usersCreated++;
          console.log(`✅ Created user: ${userData.email}`);
        }
        
        processedEmails.add(userData.email);
        
      } catch (error) {
        const errorMsg = `Error processing user ${userData.email}: ${String(error)}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
  }
  
  console.log(`\n📊 User migration complete: ${stats.usersCreated} created, ${stats.usersUpdated} updated`);
  return userMap;
}

/**
 * Migrate vehicles
 */
async function migrateVehicles(
  sources: DataSources,
  userMap: Map<string, string>,
  steeringMap: Record<string, string>,
  makeMap: Record<string, string>,
  modelMap: Record<string, string>,
  collectionMap: Record<string, string>,
  stats: MigrationStats
): Promise<Map<string, string>> {
  console.log('\n🚗 Migrating vehicles...');
  
  const vehicleMap = new Map<string, string>();
  
  for (const [sourceName, records] of Object.entries(sources) as Array<[keyof DataSources, SourceRecord[]]>) {
    console.log(`\n📋 Processing ${sourceName} vehicles...`);
    
    for (const record of records) {
      const vehicleData = extractVehicleData(record, sourceName);
      const userData = extractUserData(record, sourceName);
      const originalId = extractOriginalId(record, sourceName);
      
      if (!vehicleData || !originalId) {
        console.warn(`⚠️ Skipping record - missing vehicle data or ID`);
        continue;
      }
      
      // Find user ID
      let userId: string | undefined;
      if (userData?.email) {
        userId = userMap.get(userData.email);
      } else if (sourceName === 'catalog') {
        // Use system user for catalog vehicles (they don't have real owners)
        userId = userMap.get('SYSTEM_USER');
      }
      
      if (!userId) {
        console.warn(`⚠️ No user found for vehicle ${originalId}, skipping`);
        continue;
      }
      
      try {
        // Map steering to steering type ID
        let steeringId: string | undefined;
        if (vehicleData.steering) {
          const steeringType = mapSteeringToType(vehicleData.steering);
          if (steeringType) {
            steeringId = steeringMap[steeringType.name];
          }
        }
        
        // Get make and model IDs
        const makeId = makeMap[vehicleData.make];
        const modelKey = `${vehicleData.make}:${vehicleData.model}`;
        const modelId = modelMap[modelKey];
        
        if (!makeId || !modelId) {
          console.warn(`⚠️ Missing make/model IDs for ${vehicleData.make} ${vehicleData.model}, skipping`);
          continue;
        }
        
        // Create vehicle
        const vehicle = await prisma.vehicle.create({
          data: {
            name: vehicleData.name,
            makeId: makeId,
            modelId: modelId,
            year: vehicleData.year,
            registration: vehicleData.registration,
            engineCapacity: vehicleData.engineCapacity,
            numberOfSeats: vehicleData.numberOfSeats,
            steeringId: steeringId,
            gearbox: vehicleData.gearbox,
            exteriorColour: vehicleData.exteriorColour,
            interiorColour: vehicleData.interiorColour,
            condition: vehicleData.condition,
            isRoadLegal: vehicleData.isRoadLegal,
            price: vehicleData.price,
            status: vehicleData.status,
            description: vehicleData.description,
            ownerId: userId,
          },
        });
        
        vehicleMap.set(`${sourceName}:${originalId}`, vehicle.id);
        stats.vehiclesCreated++;
        
        // Assign collections if available
        if ((record as SourceRecord & { collection?: string }).collection && sourceName === 'catalog') {
          const collections = parseCollections((record as SourceRecord & { collection?: string }).collection);
          for (const collectionName of collections) {
            const collectionId = collectionMap[collectionName];
            if (collectionId) {
              try {
                await prisma.vehicleCollection.create({
                  data: {
                    vehicleId: vehicle.id,
                    collectionId: collectionId,
                  },
                });
                console.log(`✅ Assigned collection "${collectionName}" to vehicle ${vehicle.name}`);
              } catch (error) {
                console.warn(`⚠️ Failed to assign collection "${collectionName}": ${String(error)}`);
              }
            }
          }
        }
        
        console.log(`✅ Created vehicle: ${vehicle.name} (${vehicle.id})`);
        
      } catch (error) {
        const errorMsg = `Error creating vehicle ${originalId}: ${String(error)}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
  }
  
  console.log(`\n📊 Vehicle migration complete: ${stats.vehiclesCreated} vehicles created`);
  return vehicleMap;
}

/**
 * Migrate media
 */
async function migrateMedia(
  sources: DataSources,
  vehicleMap: Map<string, string>,
  stats: MigrationStats
): Promise<void> {
  console.log('\n📸 Migrating media...');
  
  for (const [sourceName, records] of Object.entries(sources) as Array<[keyof DataSources, SourceRecord[]]>) {
    console.log(`\n📋 Processing ${sourceName} media...`);
    
    for (const record of records) {
      const originalId = extractOriginalId(record, sourceName);
      const vehicleKey = `${sourceName}:${originalId}`;
      const vehicleId = vehicleMap.get(vehicleKey);
      
      if (!vehicleId) {
        continue; // Skip if no vehicle was created
      }
      
      const mediaUrls = extractMediaUrls(record, sourceName);
      if (mediaUrls.length === 0) {
        continue; // Skip if no media
      }
      
      const mediaData = mapMediaData(mediaUrls);
      
      for (const media of mediaData) {
        try {
          await prisma.media.create({
            data: {
              type: media.type,
              originalUrl: media.originalUrl,
              filename: media.filename,
              mimeType: media.mimeType,
              format: media.format,
              vehicleId: vehicleId,
              order: media.order,
              isPrimary: media.isPrimary,
              status: 'READY',
              isVisible: true,
            },
          });
          
          stats.mediaCreated++;
          console.log(`✅ Created media: ${media.filename} for vehicle ${vehicleId}`);
          
        } catch (error) {
          const errorMsg = `Error creating media ${media.filename}: ${String(error)}`;
          console.error(`❌ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      }
    }
  }
  
  console.log(`\n📊 Media migration complete: ${stats.mediaCreated} media items created`);
}

/**
 * Migrate source tracking
 */
async function migrateSources(
  sources: DataSources,
  vehicleMap: Map<string, string>,
  stats: MigrationStats
): Promise<void> {
  console.log('\n📋 Migrating source tracking...');
  
  for (const [sourceName, records] of Object.entries(sources) as Array<[keyof DataSources, SourceRecord[]]>) {
    console.log(`\n📋 Processing ${sourceName} sources...`);
    
    for (const record of records) {
      const originalId = extractOriginalId(record, sourceName);
      const vehicleKey = `${sourceName}:${originalId}`;
      const vehicleId = vehicleMap.get(vehicleKey);
      
      if (!vehicleId || !originalId) {
        continue; // Skip if no vehicle was created or no original ID
      }
      
      try {
        await prisma.vehicleSource.upsert({
          where: {
            sourceType_sourceId: {
              sourceType: sourceName,
              sourceId: originalId,
            },
          },
          update: {
            vehicleId: vehicleId,
            rawData: record as Record<string, unknown>,
          },
          create: {
            vehicleId: vehicleId,
            sourceType: sourceName,
            sourceId: originalId,
            rawData: record as Record<string, unknown>,
          },
        });
        
        stats.sourcesCreated++;
        console.log(`✅ Created source tracking: ${sourceName}:${originalId} for vehicle ${vehicleId}`);
        
      } catch (error) {
        const errorMsg = `Error creating source tracking ${sourceName}:${originalId}: ${String(error)}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
  }
  
  console.log(`\n📊 Source tracking migration complete: ${stats.sourcesCreated} sources created`);
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
 * Main migration function using processed vehicle catalog
 */
export async function runMigration(filters: MigrationFilters = DEFAULT_FILTERS): Promise<MigrationStats> {
  console.log('🚀 Starting vehicle data migration from processed catalog...\n');
  
  const stats: MigrationStats = {
    usersCreated: 0,
    usersUpdated: 0,
    vehiclesCreated: 0,
    mediaCreated: 0,
    sourcesCreated: 0,
    collectionsCreated: 0,
    steeringTypesCreated: 0,
    errors: [],
  };
  
  try {
    // Load processed vehicle catalog
    const catalog = await loadProcessedVehicleCatalog();
    
    // Apply filters
    applyFiltersToProcessedRecords(catalog, filters);
    
    // Analyze filtered data
    // await analyzeProcessedData(filteredRecords);
    
    // Setup reference data
    await setupSteeringTypes();
    // const { makeMap, modelMap } = await setupMakesAndModelsFromProcessed(filteredRecords);
    // const collectionMap = await setupCollectionsFromProcessed(filteredRecords);
    
    // Migrate users from processed records
    // const userMap = await migrateUsersFromProcessed(filteredRecords, stats);
    
    // Migrate vehicles from processed records
    // const vehicleMap = await migrateVehiclesFromProcessed(
    //   filteredRecords, 
    //   userMap, 
    //   steeringMap, 
    //   makeMap, 
    //   modelMap, 
    //   collectionMap, 
    //   stats
    // );
    
    // Migrate media from processed records
    // await migrateMediaFromProcessed(filteredRecords, vehicleMap, stats);
    
    // Create source tracking for processed records
    // await createSourceTrackingFromProcessed(filteredRecords, vehicleMap, stats);
    
    // Final statistics
    await getFinalStatistics();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`  Users Created: ${stats.usersCreated}`);
    console.log(`  Users Updated: ${stats.usersUpdated}`);
    console.log(`  Vehicles Created: ${stats.vehiclesCreated}`);
    console.log(`  Media Created: ${stats.mediaCreated}`);
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
 * Legacy migration function using raw source files (DEPRECATED)
 */
export async function runLegacyMigration(filters: MigrationFilters = DEFAULT_FILTERS): Promise<void> {
  console.log('🚀 Starting vehicle data migration...\n');
  
  const stats: MigrationStats = {
    usersCreated: 0,
    usersUpdated: 0,
    vehiclesCreated: 0,
    mediaCreated: 0,
    sourcesCreated: 0,
    collectionsCreated: 0,
    steeringTypesCreated: 0,
    errors: [],
  };
  
  try {
    // Load data sources
    const rawSources = await loadDataSources();
    
    // Apply filters
    const sources = applyFilters(rawSources, filters);
    
    // Analyze data
    await analyzeData(sources);
    
    // Setup reference data
    const steeringMap = await setupSteeringTypes();
    const { makeMap, modelMap } = await setupMakesAndModels(sources);
    const collectionMap = await setupCollections(sources);
    
    // Migrate users
    const userMap = await migrateUsers(sources, stats);
    
    // Migrate vehicles
    const vehicleMap = await migrateVehicles(sources, userMap, steeringMap, makeMap, modelMap, collectionMap, stats);
    
    // Migrate media
    await migrateMedia(sources, vehicleMap, stats);
    
    // Migrate source tracking
    await migrateSources(sources, vehicleMap, stats);
    
    // Final statistics
    await getFinalStatistics();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`  Users Created: ${stats.usersCreated}`);
    console.log(`  Users Updated: ${stats.usersUpdated}`);
    console.log(`  Vehicles Created: ${stats.vehiclesCreated}`);
    console.log(`  Media Created: ${stats.mediaCreated}`);
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
 * Full remigration: clean database and run migration
 */
export async function remigrate(filters: MigrationFilters = DEFAULT_FILTERS): Promise<MigrationStats> {
  console.log('🔄 Starting remigration...\n');
  
  // Clean existing data
  await cleanDatabase();
  
  console.log('\n🚀 Starting fresh migration...\n');
  
  // Run migration
  return await runMigration(filters);
}

// Run migration if this file is executed directly
// Note: In ES modules, we can't use require.main === module
// This check is handled by the separate script files instead
