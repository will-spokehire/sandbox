/**
 * Main migration runner for converting existing vehicle data to new schema
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import type {
  SourceRecord,
  MappedUserData,
  MappedVehicleData,
  MappedMediaData,
} from './data-mappers.js';
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
} from './data-mappers.js';

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

/**
 * Load data from JSON files
 */
async function loadDataSources(): Promise<DataSources> {
  const dataDir = path.join(process.cwd(), '../../data-analitics/data');
  
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
    }
    
    // Load cleansed data
    const cleansedPath = path.join(dataDir, 'cleansed_database.json');
    if (fs.existsSync(cleansedPath)) {
      sources.cleansed = JSON.parse(fs.readFileSync(cleansedPath, 'utf8'));
      console.log(`✅ Loaded ${sources.cleansed.length} cleansed records`);
    }
    
    // Load submission data
    const submissionPath = path.join(dataDir, 'submission.from.1march.2025.json');
    if (fs.existsSync(submissionPath)) {
      sources.submission = JSON.parse(fs.readFileSync(submissionPath, 'utf8'));
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
  for (const [sourceName, records] of Object.entries(sources)) {
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
  console.log(`  Total Records: ${Object.values(sources).reduce((sum, records) => sum + records.length, 0)}`);
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
 * Migrate users
 */
async function migrateUsers(sources: DataSources, stats: MigrationStats): Promise<Map<string, string>> {
  console.log('\n👥 Migrating users...');
  
  const userMap = new Map<string, string>();
  const processedEmails = new Set<string>();
  
  // Process all sources to find unique users
  for (const [sourceName, records] of Object.entries(sources)) {
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
              firstName: userData.firstName || existingUser.firstName,
              lastName: userData.lastName || existingUser.lastName,
              phone: userData.phone || existingUser.phone,
              street: userData.street || existingUser.street,
              city: userData.city || existingUser.city,
              county: userData.county || existingUser.county,
              postcode: userData.postcode || existingUser.postcode,
              country: userData.country || existingUser.country,
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
              country: userData.country,
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
        const errorMsg = `Error processing user ${userData.email}: ${error}`;
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
  collectionMap: Record<string, string>,
  stats: MigrationStats
): Promise<Map<string, string>> {
  console.log('\n🚗 Migrating vehicles...');
  
  const vehicleMap = new Map<string, string>();
  
  for (const [sourceName, records] of Object.entries(sources)) {
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
        
        // Create vehicle
        const vehicle = await prisma.vehicle.create({
          data: {
            name: vehicleData.name,
            make: vehicleData.make,
            model: vehicleData.model,
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
        
        // Add collections if from catalog
        if (sourceName === 'catalog' && record.collection) {
          const collections = parseCollections(record.collection);
          for (const collectionName of collections) {
            const collectionId = collectionMap[collectionName];
            if (collectionId) {
              await prisma.vehicleCollection.create({
                data: {
                  vehicleId: vehicle.id,
                  collectionId: collectionId,
                },
              });
            }
          }
        }
        
        console.log(`✅ Created vehicle: ${vehicle.name} (${vehicle.id})`);
        
      } catch (error) {
        const errorMsg = `Error creating vehicle ${originalId}: ${error}`;
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
  
  for (const [sourceName, records] of Object.entries(sources)) {
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
          const errorMsg = `Error creating media ${media.filename}: ${error}`;
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
  
  for (const [sourceName, records] of Object.entries(sources)) {
    console.log(`\n📋 Processing ${sourceName} sources...`);
    
    for (const record of records) {
      const originalId = extractOriginalId(record, sourceName);
      const vehicleKey = `${sourceName}:${originalId}`;
      const vehicleId = vehicleMap.get(vehicleKey);
      
      if (!vehicleId || !originalId) {
        continue; // Skip if no vehicle was created or no original ID
      }
      
      try {
        await prisma.vehicleSource.create({
          data: {
            vehicleId: vehicleId,
            sourceType: sourceName,
            sourceId: originalId,
            rawData: record,
          },
        });
        
        stats.sourcesCreated++;
        console.log(`✅ Created source tracking: ${sourceName}:${originalId} for vehicle ${vehicleId}`);
        
      } catch (error) {
        const errorMsg = `Error creating source tracking ${sourceName}:${originalId}: ${error}`;
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
  
  console.log(`  Users: ${userCount}`);
  console.log(`  Vehicles: ${vehicleCount}`);
  console.log(`  Media: ${mediaCount}`);
  console.log(`  Sources: ${sourceCount}`);
  console.log(`  Collections: ${collectionCount}`);
  console.log(`  Steering Types: ${steeringTypeCount}`);
}

/**
 * Main migration function
 */
export async function runMigration(): Promise<void> {
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
    const sources = await loadDataSources();
    
    // Analyze data
    await analyzeData(sources);
    
    // Setup reference data
    const steeringMap = await setupSteeringTypes();
    const collectionMap = await setupCollections(sources);
    
    // Migrate users
    const userMap = await migrateUsers(sources, stats);
    
    // Migrate vehicles
    const vehicleMap = await migrateVehicles(sources, userMap, steeringMap, collectionMap, stats);
    
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

// Run migration if this file is executed directly
// Note: In ES modules, we can't use require.main === module
// This check is handled by the separate script files instead
