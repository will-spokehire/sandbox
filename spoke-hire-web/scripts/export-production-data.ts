#!/usr/bin/env tsx
/**
 * Export Production Data Script
 * 
 * Downloads a subset of production data for preview/dev environments:
 * - 100 users (sanitized email/phone)
 * - 100 vehicles with their relationships
 * - Max 2 images per vehicle
 * - All lookup tables (Make, Model, Collection, etc.)
 * - Recent deals
 * 
 * Uses raw SQL queries to be schema-version independent.
 * Works even if local schema has columns that don't exist in production.
 * 
 * Output: Saves to data/migration/ directory
 * 
 * Usage:
 * ```bash
 * # Using .env.production file
 * env $(grep -v '^#' .env.production | grep -v '^$' | xargs) npm run export-production-data
 * 
 * # Or export variables manually
 * export DATABASE_URL="postgresql://..."
 * export NEXT_PUBLIC_SUPABASE_URL="https://..."
 * export SUPABASE_SERVICE_ROLE_KEY="..."
 * npm run export-production-data
 * ```
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Configuration
const CONFIG = {
  MAX_USERS: 100,
  MAX_VEHICLES: 100,
  MAX_IMAGES_PER_VEHICLE: 2,
  MAX_DEALS: 20,
  OUTPUT_DIR: path.join(process.cwd(), 'data', 'migration'),
  IMAGES_DIR: path.join(process.cwd(), 'data', 'migration', 'images'),
};

// Types
interface ExportedData {
  metadata: {
    exportDate: string;
    productionUrl: string;
    version: string;
    counts: {
      users: number;
      vehicles: number;
      media: number;
      deals: number;
      images: number;
    };
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

/**
 * Create Prisma client for production
 */
function createProductionPrisma(): PrismaClient {
  const prodUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!prodUrl) {
    throw new Error('DIRECT_URL or DATABASE_URL environment variable is required');
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: prodUrl,
      },
    },
  });
}

/**
 * Create Supabase client for production storage
 */
function createProductionSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Sanitize email - replace with placeholder but keep uniqueness
 */
function sanitizeEmail(originalEmail: string, index: number): string {
  const hash = crypto.createHash('md5').update(originalEmail).digest('hex').substring(0, 8);
  return `user-${index}-${hash}@preview.spokehire.com`;
}

/**
 * Sanitize phone - replace with placeholder UK format
 */
function sanitizePhone(originalPhone: string | null, index: number): string | null {
  if (!originalPhone) return null;
  // UK format: +44 7XXX XXXXXX
  const lastFour = String(index).padStart(4, '0');
  return `+44 7700 ${lastFour}`;
}

/**
 * Export lookup tables
 * Using raw SQL to avoid schema version mismatches
 */
async function exportLookupTables(prisma: PrismaClient) {
  console.log('📚 Exporting lookup tables...');

  // Use raw SQL to get all columns regardless of schema version
  const [countries, steeringTypes, makes, models, collections] = await Promise.all([
    prisma.$queryRaw<any[]>`SELECT * FROM "Country"`,
    prisma.$queryRaw<any[]>`SELECT * FROM "SteeringType"`,
    prisma.$queryRaw<any[]>`SELECT * FROM "Make"`,
    prisma.$queryRaw<any[]>`SELECT * FROM "Model"`,
    prisma.$queryRaw<any[]>`SELECT * FROM "Collection"`,
  ]);

  console.log(`   ✅ Countries: ${countries.length}`);
  console.log(`   ✅ Steering Types: ${steeringTypes.length}`);
  console.log(`   ✅ Makes: ${makes.length}`);
  console.log(`   ✅ Models: ${models.length}`);
  console.log(`   ✅ Collections: ${collections.length}\n`);

  return { countries, steeringTypes, makes, models, collections };
}

/**
 * Export users with sanitization
 * Using raw SQL to avoid schema version mismatches
 */
async function exportUsers(prisma: PrismaClient) {
  console.log(`👥 Exporting users (max ${CONFIG.MAX_USERS})...`);

  // Get users with most vehicles using raw SQL
  // Use SELECT * but handle geometry columns that can't be deserialized
  const usersRaw = await prisma.$queryRaw<any[]>`
    SELECT 
      u.id, u."createdAt", u."updatedAt", u."supabaseId", u.email,
      u."firstName", u."lastName", u.phone, u."userType", u.status,
      u.street, u.city, u.postcode, u."countryId",
      ST_AsText(u."geoPoint") as "geoPointText",
      u.latitude, u.longitude
    FROM "User" u
    LEFT JOIN "Vehicle" v ON u.id = v."ownerId"
    GROUP BY u.id
    ORDER BY COUNT(v.id) DESC
    LIMIT ${CONFIG.MAX_USERS}
  `;

  // Sanitize sensitive data and rename geoPointText back to geoPoint
  const sanitizedUsers = usersRaw.map((user, index) => {
    const { geoPointText, ...rest } = user;
    return {
      ...rest,
      geoPoint: geoPointText, // Rename back for consistency
      email: sanitizeEmail(user.email, index),
      phone: sanitizePhone(user.phone, index),
    };
  });

  console.log(`   ✅ Exported ${sanitizedUsers.length} users (sanitized)\n`);

  return { users: sanitizedUsers, userIds: usersRaw.map(u => u.id) };
}

/**
 * Export vehicles for selected users
 * Using raw SQL to avoid schema version mismatches
 */
async function exportVehicles(prisma: PrismaClient, userIds: string[]) {
  console.log(`🚗 Exporting vehicles (max ${CONFIG.MAX_VEHICLES})...`);

  // Use raw SQL with parameterized query
  const vehicles = await prisma.$queryRaw<any[]>`
    SELECT *
    FROM "Vehicle"
    WHERE "ownerId" = ANY(${userIds}::text[])
    ORDER BY "createdAt" DESC
    LIMIT ${CONFIG.MAX_VEHICLES}
  `;

  console.log(`   ✅ Exported ${vehicles.length} vehicles\n`);

  return { vehicles, vehicleIds: vehicles.map(v => v.id) };
}

/**
 * Export media records (max 2 per vehicle)
 * Using raw SQL to avoid schema version mismatches
 */
async function exportMedia(prisma: PrismaClient, vehicleIds: string[]) {
  console.log(`📸 Exporting media (max ${CONFIG.MAX_IMAGES_PER_VEHICLE} per vehicle)...`);

  // Get media using raw SQL with window function to limit per vehicle
  const allMedia = await prisma.$queryRaw<any[]>`
    WITH ranked_media AS (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY "vehicleId" 
          ORDER BY "isPrimary" DESC, "order" ASC, "createdAt" ASC
        ) as rn
      FROM "Media"
      WHERE "vehicleId" = ANY(${vehicleIds}::text[])
        AND status = 'READY'
    )
    SELECT *
    FROM ranked_media
    WHERE rn <= ${CONFIG.MAX_IMAGES_PER_VEHICLE}
    ORDER BY "vehicleId", "isPrimary" DESC, "order" ASC
  `;

  // Remove the row_number column added by the query
  const selectedMedia = allMedia.map(({ rn, ...media }) => media);

  console.log(`   ✅ Exported ${selectedMedia.length} media records\n`);

  return selectedMedia;
}

/**
 * Export vehicle relationships
 * Using raw SQL to avoid schema version mismatches
 */
async function exportVehicleRelationships(prisma: PrismaClient, vehicleIds: string[]) {
  console.log('🔗 Exporting vehicle relationships...');

  const [vehicleCollections, vehicleSources, vehicleSpecifications] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT * FROM "VehicleCollection"
      WHERE "vehicleId" = ANY(${vehicleIds}::text[])
    `,
    prisma.$queryRaw<any[]>`
      SELECT * FROM "VehicleSource"
      WHERE "vehicleId" = ANY(${vehicleIds}::text[])
    `,
    prisma.$queryRaw<any[]>`
      SELECT * FROM "VehicleSpecification"
      WHERE "vehicleId" = ANY(${vehicleIds}::text[])
    `,
  ]);

  console.log(`   ✅ Vehicle Collections: ${vehicleCollections.length}`);
  console.log(`   ✅ Vehicle Sources: ${vehicleSources.length}`);
  console.log(`   ✅ Vehicle Specifications: ${vehicleSpecifications.length}\n`);

  return { vehicleCollections, vehicleSources, vehicleSpecifications };
}

/**
 * Export deals
 * Using raw SQL to avoid schema version mismatches
 */
async function exportDeals(prisma: PrismaClient, userIds: string[], vehicleIds: string[]) {
  console.log(`💼 Exporting deals (max ${CONFIG.MAX_DEALS})...`);

  // Get deals using raw SQL
  const deals = await prisma.$queryRaw<any[]>`
    SELECT *
    FROM "Deal"
    WHERE status = 'ACTIVE'
    ORDER BY "createdAt" DESC
    LIMIT ${CONFIG.MAX_DEALS}
  `;

  const dealIds = deals.map(d => d.id);

  // Get related deal vehicles and recipients
  const [dealVehicles, dealRecipients] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT *
      FROM "DealVehicle"
      WHERE "dealId" = ANY(${dealIds}::text[])
        AND "vehicleId" = ANY(${vehicleIds}::text[])
    `,
    prisma.$queryRaw<any[]>`
      SELECT *
      FROM "DealRecipient"
      WHERE "dealId" = ANY(${dealIds}::text[])
        AND "userId" = ANY(${userIds}::text[])
    `,
  ]);

  console.log(`   ✅ Deals: ${deals.length}`);
  console.log(`   ✅ Deal Vehicles: ${dealVehicles.length}`);
  console.log(`   ✅ Deal Recipients: ${dealRecipients.length}\n`);

  return { deals, dealVehicles, dealRecipients };
}

/**
 * Download images from Supabase Storage
 */
async function downloadImages(
  supabase: ReturnType<typeof createProductionSupabase>,
  media: any[]
) {
  console.log(`🖼️  Downloading images (${media.length} files)...\n`);

  // Create images directory
  if (!fs.existsSync(CONFIG.IMAGES_DIR)) {
    fs.mkdirSync(CONFIG.IMAGES_DIR, { recursive: true });
  }

  const imageManifest: ExportedData['imageManifest'] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < media.length; i++) {
    const item = media[i]!;
    
    // Extract storage path from publishedUrl if storagePath is not available
    let storagePath = item.storagePath;
    
    if (!storagePath && item.publishedUrl) {
      // Extract path from URL like:
      // https://[PROJECT].supabase.co/storage/v1/object/public/vehicle-images/vehicles/[vehicleId]/[filename]
      const match = item.publishedUrl.match(/\/vehicle-images\/(.+)$/);
      if (match) {
        storagePath = match[1];
      }
    }
    
    if (!storagePath) {
      console.log(`   ⏭️  Skipping ${item.filename} (no storage path or publishedUrl)`);
      failCount++;
      continue;
    }

    try {
      // Download from Supabase Storage
      const { data, error } = await supabase.storage
        .from('vehicle-images')
        .download(storagePath);

      if (error) throw error;

      // Save to local file
      const localFilename = `${item.id}_${item.filename}`;
      const localPath = path.join(CONFIG.IMAGES_DIR, localFilename);
      
      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(localPath, buffer);

      imageManifest.push({
        mediaId: item.id,
        vehicleId: item.vehicleId,
        filename: item.filename,
        storagePath: storagePath,
        localPath: localFilename,
        order: item.order ?? 0,
      });

      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`   📊 Progress: ${i + 1}/${media.length} images`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to download ${item.filename}:`, error);
      failCount++;
    }
  }

  console.log(`\n   ✅ Downloaded: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}\n`);

  return imageManifest;
}

/**
 * Save exported data to JSON files
 */
function saveExportedData(data: ExportedData) {
  console.log('💾 Saving exported data...');

  // Create output directory
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  // Convert BigInt to string for JSON serialization
  const dataWithConvertedBigInts = JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );

  // Save main data file
  const dataFile = path.join(CONFIG.OUTPUT_DIR, 'exported-data.json');
  fs.writeFileSync(dataFile, JSON.stringify(dataWithConvertedBigInts, null, 2));

  // Calculate sizes
  const dataSize = (fs.statSync(dataFile).size / 1024 / 1024).toFixed(2);
  
  let imagesSize = 0;
  if (fs.existsSync(CONFIG.IMAGES_DIR)) {
    const imageFiles = fs.readdirSync(CONFIG.IMAGES_DIR);
    imagesSize = imageFiles.reduce((total, file) => {
      return total + fs.statSync(path.join(CONFIG.IMAGES_DIR, file)).size;
    }, 0) / 1024 / 1024;
  }

  console.log(`   ✅ Data file: ${dataSize} MB`);
  console.log(`   ✅ Images: ${imagesSize.toFixed(2)} MB`);
  console.log(`   ✅ Total: ${(parseFloat(dataSize) + imagesSize).toFixed(2)} MB\n`);
  console.log(`   📁 Location: ${CONFIG.OUTPUT_DIR}\n`);
}

/**
 * Main export function
 */
async function main() {
  console.log('🚀 Export Production Data\n');
  console.log('═'.repeat(50));
  console.log('\n');

  // Validate environment
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL or DIRECT_URL is required');
    console.error('\nUsage:');
    console.error('  env $(grep -v \'^#\' .env.production | grep -v \'^$\' | xargs) npm run export-production-data');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    console.error('\nUsage:');
    console.error('  env $(grep -v \'^#\' .env.production | grep -v \'^$\' | xargs) npm run export-production-data');
    process.exit(1);
  }

  console.log('📊 Configuration:');
  console.log(`   Database: ${dbUrl.split('@')[1]?.split('/')[0] ?? 'unknown'}`);
  console.log(`   Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

  const prisma = createProductionPrisma();
  const supabase = createProductionSupabase();

  try {
    // Export data
    const lookupTables = await exportLookupTables(prisma);
    const { users, userIds } = await exportUsers(prisma);
    const { vehicles, vehicleIds } = await exportVehicles(prisma, userIds);
    const media = await exportMedia(prisma, vehicleIds);
    const relationships = await exportVehicleRelationships(prisma, vehicleIds);
    const { deals, dealVehicles, dealRecipients } = await exportDeals(prisma, userIds, vehicleIds);
    const imageManifest = await downloadImages(supabase, media);

    // Prepare export data
    const exportedData: ExportedData = {
      metadata: {
        exportDate: new Date().toISOString(),
        productionUrl: (process.env.DIRECT_URL || process.env.DATABASE_URL)?.split('@')[1]?.split('/')[0] ?? 'unknown',
        version: '1.0.0',
        counts: {
          users: users.length,
          vehicles: vehicles.length,
          media: media.length,
          deals: deals.length,
          images: imageManifest.length,
        },
      },
      lookupTables,
      users,
      vehicles,
      media,
      ...relationships,
      deals,
      dealVehicles,
      dealRecipients,
      imageManifest,
    };

    // Save to files
    saveExportedData(exportedData);

    console.log('═'.repeat(50));
    console.log('✅ Export Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Users: ${users.length} (sanitized)`);
    console.log(`   Vehicles: ${vehicles.length}`);
    console.log(`   Media: ${media.length}`);
    console.log(`   Images: ${imageManifest.length}`);
    console.log(`   Deals: ${deals.length}\n`);
    console.log('📝 Next Steps:');
    console.log('   1. Review exported data in data/migration/');
    console.log('   2. Run import: npm run import-preview-data\n');

  } catch (error) {
    console.error('\n❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

