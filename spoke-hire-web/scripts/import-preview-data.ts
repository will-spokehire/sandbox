#!/usr/bin/env tsx
/**
 * Import Preview Data Script
 * 
 * Imports previously exported production data into preview/local environment:
 * - Reads from data/migration/ directory
 * - Imports all tables in correct order
 * - Uploads images to Supabase Storage
 * - Verifies data integrity
 * 
 * Usage:
 * ```bash
 * # For preview environment
 * export $(grep -v '^#' .env.preview | grep -v '^$' | xargs)
 * npm run import-preview-data
 * 
 * # For local environment
 * npm run import-preview-data -- --local
 * ```
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
  DATA_FILE: path.join(process.cwd(), 'data', 'migration', 'exported-data.json'),
  IMAGES_DIR: path.join(process.cwd(), 'data', 'migration', 'images'),
  BATCH_SIZE: 50,
};

// Types
interface ExportedData {
  metadata: {
    exportDate: string;
    productionUrl: string;
    version: string;
    counts: Record<string, number>;
  };
  lookupTables: {
    countries: any[];
    steeringTypes: any[];
    makes: any[];
    models: any[];
    collections: any[];
  };
  users: any[];
  vehicles: any[];
  media: any[];
  vehicleCollections: any[];
  vehicleSources: any[];
  vehicleSpecifications: any[];
  deals: any[];
  dealVehicles: any[];
  dealRecipients: any[];
  imageManifest: Array<{
    mediaId: string;
    vehicleId: string;
    filename: string;
    storagePath: string;
    localPath: string;
    order: number;
  }>;
}

interface ImportStats {
  countries: number;
  steeringTypes: number;
  makes: number;
  models: number;
  collections: number;
  users: number;
  vehicles: number;
  media: number;
  images: number;
  deals: number;
  errors: number;
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const isLocal = process.argv.includes('--local');
  return { isLocal };
}

/**
 * Create database client
 */
function createDatabaseClient(isLocal: boolean): PrismaClient {
  if (isLocal) {
    return new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
        },
      },
    });
  }

  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL or DIRECT_URL is required');
  }

  return new PrismaClient();
}

/**
 * Create Supabase client
 */
function createStorageClient(isLocal: boolean) {
  if (isLocal) {
    return createClient(
      'http://127.0.0.1:54321',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Load exported data
 */
function loadExportedData(): ExportedData {
  console.log('📂 Loading exported data...\n');

  if (!fs.existsSync(CONFIG.DATA_FILE)) {
    throw new Error(`Export file not found: ${CONFIG.DATA_FILE}\n\nPlease run: npm run export-production-data`);
  }

  const data = JSON.parse(fs.readFileSync(CONFIG.DATA_FILE, 'utf8')) as ExportedData;

  console.log('   📊 Export Metadata:');
  console.log(`      Date: ${new Date(data.metadata.exportDate).toLocaleString()}`);
  console.log(`      Source: ${data.metadata.productionUrl}`);
  console.log(`      Version: ${data.metadata.version}\n`);

  console.log('   📦 Data Counts:');
  Object.entries(data.metadata.counts).forEach(([key, count]) => {
    console.log(`      ${key}: ${count}`);
  });
  console.log('');

  return data;
}

/**
 * Clear existing data (optional safety check)
 */
async function checkAndClearDatabase(prisma: PrismaClient) {
  console.log('🔍 Checking database...\n');

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.vehicle.count(),
    prisma.deal.count(),
  ]);

  const [userCount, vehicleCount, dealCount] = counts;

  if (userCount > 0 || vehicleCount > 0 || dealCount > 0) {
    console.log('   ⚠️  Database contains existing data:');
    console.log(`      Users: ${userCount}`);
    console.log(`      Vehicles: ${vehicleCount}`);
    console.log(`      Deals: ${dealCount}\n`);
    console.log('   ⚠️  Import will skip existing records (upsert mode)\n');
  } else {
    console.log('   ✅ Database is empty\n');
  }
}

/**
 * Import lookup tables
 */
async function importLookupTables(
  prisma: PrismaClient,
  lookupTables: ExportedData['lookupTables'],
  stats: ImportStats
) {
  console.log('📚 Importing lookup tables...\n');

  // Countries - upsert by name (unique key)
  console.log('   1️⃣  Countries...');
  for (const country of lookupTables.countries) {
    await prisma.country.upsert({
      where: { name: country.name },
      create: country,
      update: country,
    });
  }
  stats.countries = lookupTables.countries.length;
  console.log(`      ✅ ${stats.countries}\n`);

  // Steering Types - upsert by code (unique key)
  console.log('   2️⃣  Steering Types...');
  for (const type of lookupTables.steeringTypes) {
    await prisma.steeringType.upsert({
      where: { code: type.code },
      create: type,
      update: type,
    });
  }
  stats.steeringTypes = lookupTables.steeringTypes.length;
  console.log(`      ✅ ${stats.steeringTypes}\n`);

  // Makes - upsert by slug (unique key)
  console.log('   3️⃣  Makes...');
  for (const make of lookupTables.makes) {
    await prisma.make.upsert({
      where: { slug: make.slug },
      create: make,
      update: make,
    });
  }
  stats.makes = lookupTables.makes.length;
  console.log(`      ✅ ${stats.makes}\n`);

  // Models - upsert by makeId + slug (composite unique key)
  console.log('   4️⃣  Models...');
  for (const model of lookupTables.models) {
    await prisma.model.upsert({
      where: { 
        makeId_slug: {
          makeId: model.makeId,
          slug: model.slug
        }
      },
      create: model,
      update: model,
    });
  }
  stats.models = lookupTables.models.length;
  console.log(`      ✅ ${stats.models}\n`);

  // Collections - upsert by slug (unique key)
  console.log('   5️⃣  Collections...');
  for (const collection of lookupTables.collections) {
    await prisma.collection.upsert({
      where: { slug: collection.slug },
      create: collection,
      update: collection,
    });
  }
  stats.collections = lookupTables.collections.length;
  console.log(`      ✅ ${stats.collections}\n`);
}

/**
 * Import users
 */
async function importUsers(prisma: PrismaClient, users: any[], stats: ImportStats) {
  console.log(`👥 Importing users (${users.length})...\n`);

  let count = 0;
  for (const user of users) {
    try {
      // Remove geoPoint (text format) - it will be regenerated from lat/lon
      const { geoPoint, ...userData } = user;
      
      // Upsert by email (unique key) to handle existing users
      await prisma.user.upsert({
        where: { email: userData.email },
        create: userData,
        update: userData,
      });
      count++;

      if (count % 20 === 0) {
        console.log(`   📊 Progress: ${count}/${users.length}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to import user ${user.email}:`, error);
      stats.errors++;
    }
  }

  stats.users = count;
  console.log(`   ✅ Imported ${count} users\n`);
}

/**
 * Import vehicles
 */
async function importVehicles(prisma: PrismaClient, vehicles: any[], stats: ImportStats) {
  console.log(`🚗 Importing vehicles (${vehicles.length})...\n`);

  let count = 0;
  for (const vehicle of vehicles) {
    try {
      await prisma.vehicle.upsert({
        where: { id: vehicle.id },
        create: vehicle,
        update: vehicle,
      });
      count++;

      if (count % 25 === 0) {
        console.log(`   📊 Progress: ${count}/${vehicles.length}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to import vehicle ${vehicle.id}:`, error);
      stats.errors++;
    }
  }

  stats.vehicles = count;
  console.log(`   ✅ Imported ${count} vehicles\n`);
}

/**
 * Upload images to Supabase Storage
 */
async function uploadImages(
  supabase: ReturnType<typeof createStorageClient>,
  imageManifest: ExportedData['imageManifest'],
  stats: ImportStats
) {
  console.log(`🖼️  Uploading images (${imageManifest.length})...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < imageManifest.length; i++) {
    const image = imageManifest[i]!;
    const localPath = path.join(CONFIG.IMAGES_DIR, image.localPath);

    if (!fs.existsSync(localPath)) {
      console.error(`   ❌ Image file not found: ${image.localPath}`);
      failCount++;
      continue;
    }

    try {
      // Read file
      const fileBuffer = fs.readFileSync(localPath);

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('vehicle-images')
        .upload(image.storagePath, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      successCount++;

      if ((i + 1) % 10 === 0) {
        console.log(`   📊 Progress: ${i + 1}/${imageManifest.length}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to upload ${image.filename}:`, error);
      failCount++;
    }
  }

  stats.images = successCount;
  console.log(`\n   ✅ Uploaded: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}\n`);
}

/**
 * Import media records
 */
async function importMedia(prisma: PrismaClient, media: any[], stats: ImportStats) {
  console.log(`📸 Importing media records (${media.length})...\n`);

  let count = 0;
  for (const item of media) {
    try {
      await prisma.media.upsert({
        where: { id: item.id },
        create: item,
        update: item,
      });
      count++;
    } catch (error) {
      console.error(`   ❌ Failed to import media ${item.id}:`, error);
      stats.errors++;
    }
  }

  stats.media = count;
  console.log(`   ✅ Imported ${count} media records\n`);
}

/**
 * Import vehicle relationships
 */
async function importRelationships(
  prisma: PrismaClient,
  data: Pick<ExportedData, 'vehicleCollections' | 'vehicleSources' | 'vehicleSpecifications'>
) {
  console.log('🔗 Importing vehicle relationships...\n');

  // Vehicle Collections
  console.log('   1️⃣  Vehicle Collections...');
  for (const vc of data.vehicleCollections) {
    await prisma.vehicleCollection.upsert({
      where: { id: vc.id },
      create: vc,
      update: vc,
    });
  }
  console.log(`      ✅ ${data.vehicleCollections.length}\n`);

  // Vehicle Sources
  console.log('   2️⃣  Vehicle Sources...');
  for (const source of data.vehicleSources) {
    await prisma.vehicleSource.upsert({
      where: { id: source.id },
      create: source,
      update: source,
    });
  }
  console.log(`      ✅ ${data.vehicleSources.length}\n`);

  // Vehicle Specifications
  console.log('   3️⃣  Vehicle Specifications...');
  // Delete existing specs first (no unique constraint)
  const vehicleIds = data.vehicleSpecifications.map(s => s.vehicleId);
  await prisma.vehicleSpecification.deleteMany({
    where: { vehicleId: { in: vehicleIds } },
  });
  // Create new specs
  if (data.vehicleSpecifications.length > 0) {
    await prisma.vehicleSpecification.createMany({
      data: data.vehicleSpecifications,
      skipDuplicates: true,
    });
  }
  console.log(`      ✅ ${data.vehicleSpecifications.length}\n`);
}

/**
 * Import deals
 */
async function importDeals(
  prisma: PrismaClient,
  deals: any[],
  dealVehicles: any[],
  dealRecipients: any[],
  stats: ImportStats
) {
  console.log(`💼 Importing deals (${deals.length})...\n`);

  let dealCount = 0;
  
  // Import deals (skip if createdById doesn't exist)
  for (const deal of deals) {
    try {
      // Check if createdBy user exists
      if (deal.createdById) {
        const userExists = await prisma.user.findUnique({
          where: { id: deal.createdById },
          select: { id: true },
        });
        
        if (!userExists) {
          console.log(`   ⏭️  Skipping deal "${deal.name}" (creator not found)`);
          continue;
        }
      }
      
      await prisma.deal.upsert({
        where: { id: deal.id },
        create: deal,
        update: deal,
      });
      dealCount++;
    } catch (error) {
      console.error(`   ❌ Failed to import deal ${deal.name}:`, error);
      stats.errors++;
    }
  }
  stats.deals = dealCount;

  // Import deal vehicles (only for successfully imported deals)
  for (const dv of dealVehicles) {
    try {
      await prisma.dealVehicle.upsert({
        where: { id: dv.id },
        create: dv,
        update: dv,
      });
    } catch (error) {
      // Skip silently if deal or vehicle doesn't exist
      continue;
    }
  }

  // Import deal recipients (only for successfully imported deals)
  for (const dr of dealRecipients) {
    try {
      await prisma.dealRecipient.upsert({
        where: { id: dr.id },
        create: dr,
        update: dr,
      });
    } catch (error) {
      // Skip silently if deal or user doesn't exist
      continue;
    }
  }

  console.log(`   ✅ Deals: ${dealCount}`);
  console.log(`   ✅ Deal Vehicles: ${dealVehicles.length} attempted`);
  console.log(`   ✅ Deal Recipients: ${dealRecipients.length} attempted\n`);
}

/**
 * Verify import
 */
async function verifyImport(prisma: PrismaClient, stats: ImportStats) {
  console.log('🔍 Verifying import...\n');

  const counts = {
    users: await prisma.user.count(),
    vehicles: await prisma.vehicle.count(),
    media: await prisma.media.count(),
    deals: await prisma.deal.count(),
  };

  console.log('   📊 Database Counts:');
  Object.entries(counts).forEach(([key, count]) => {
    const expected = stats[key as keyof ImportStats];
    const status = count >= expected ? '✅' : '⚠️';
    console.log(`      ${status} ${key}: ${count} (expected ${expected})`);
  });
  console.log('');
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Import Preview Data\n');
  console.log('═'.repeat(50));
  console.log('\n');

  const { isLocal } = parseArgs();

  console.log('📋 Configuration:');
  console.log(`   Environment: ${isLocal ? 'Local (Docker)' : 'Cloud (Preview)'}`);
  console.log(`   Data file: ${CONFIG.DATA_FILE}\n`);

  // Load data
  const data = loadExportedData();

  // Create clients
  const prisma = createDatabaseClient(isLocal);
  const supabase = createStorageClient(isLocal);

  const stats: ImportStats = {
    countries: 0,
    steeringTypes: 0,
    makes: 0,
    models: 0,
    collections: 0,
    users: 0,
    vehicles: 0,
    media: 0,
    images: 0,
    deals: 0,
    errors: 0,
  };

  try {
    // Check database
    await checkAndClearDatabase(prisma);

    // Import in correct order
    await importLookupTables(prisma, data.lookupTables, stats);
    await importUsers(prisma, data.users, stats);
    await importVehicles(prisma, data.vehicles, stats);
    await importRelationships(prisma, data);
    await uploadImages(supabase, data.imageManifest, stats);
    await importMedia(prisma, data.media, stats);
    await importDeals(prisma, data.deals, data.dealVehicles, data.dealRecipients, stats);

    // Verify
    await verifyImport(prisma, stats);

    console.log('═'.repeat(50));
    console.log('✅ Import Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Users: ${stats.users}`);
    console.log(`   Vehicles: ${stats.vehicles}`);
    console.log(`   Media: ${stats.media}`);
    console.log(`   Images: ${stats.images}`);
    console.log(`   Deals: ${stats.deals}`);
    console.log(`   Errors: ${stats.errors}\n`);

    if (stats.errors > 0) {
      console.log('⚠️  Some errors occurred. Check logs above.\n');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

