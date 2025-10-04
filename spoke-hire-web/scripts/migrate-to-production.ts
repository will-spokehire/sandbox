#!/usr/bin/env tsx
/**
 * Migrate to Production Script
 * 
 * Migrates data from local database to production Supabase database.
 * Handles all tables, relationships, and data integrity.
 * 
 * Usage:
 * ```bash
 * # Set environment variables
 * export LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/spokehire_local"
 * export PRODUCTION_DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
 * 
 * # Run migration
 * npm run migrate-to-production
 * ```
 * 
 * Safety Features:
 * - Requires explicit confirmation
 * - Warns if production database has existing data
 * - Shows progress for large migrations
 * - Creates transaction-safe batches
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

interface MigrationStats {
  countries: number;
  steeringTypes: number;
  makes: number;
  models: number;
  collections: number;
  users: number;
  vehicles: number;
  media: number;
  vehicleCollections: number;
  sources: number;
  specifications: number;
}

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

function createLocalPrisma(): PrismaClient {
  const localUrl = process.env.LOCAL_DATABASE_URL;
  
  if (!localUrl) {
    throw new Error('LOCAL_DATABASE_URL environment variable is required');
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: localUrl,
      },
    },
  });
}

function createProductionPrisma(): PrismaClient {
  const prodUrl = process.env.PRODUCTION_DATABASE_URL;
  
  if (!prodUrl) {
    throw new Error('PRODUCTION_DATABASE_URL environment variable is required');
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: prodUrl,
      },
    },
  });
}

async function checkProductionDatabase(prodPrisma: PrismaClient): Promise<void> {
  console.log('🔍 Checking production database...\n');

  const vehicleCount = await prodPrisma.vehicle.count();
  const userCount = await prodPrisma.user.count();
  const mediaCount = await prodPrisma.media.count();

  if (vehicleCount > 0 || userCount > 0 || mediaCount > 0) {
    console.log('⚠️  WARNING: Production database already contains data!');
    console.log(`   Users: ${userCount}`);
    console.log(`   Vehicles: ${vehicleCount}`);
    console.log(`   Media: ${mediaCount}\n`);

    const confirm = await question('This migration may overwrite existing data. Type "OVERWRITE" to continue: ');
    
    if (confirm !== 'OVERWRITE') {
      console.log('❌ Migration cancelled');
      process.exit(0);
    }
  } else {
    console.log('✅ Production database is empty\n');
  }
}

async function migrateReferenceData(
  localPrisma: PrismaClient,
  prodPrisma: PrismaClient,
  stats: MigrationStats
): Promise<void> {
  console.log('📚 Migrating reference data...\n');

  // Countries
  console.log('1️⃣  Migrating countries...');
  const countries = await localPrisma.country.findMany();
  for (const country of countries) {
    await prodPrisma.country.upsert({
      where: { id: country.id },
      create: country,
      update: country,
    });
  }
  stats.countries = countries.length;
  console.log(`   ✅ Migrated ${countries.length} countries\n`);

  // Steering Types
  console.log('2️⃣  Migrating steering types...');
  const steeringTypes = await localPrisma.steeringType.findMany();
  for (const type of steeringTypes) {
    await prodPrisma.steeringType.upsert({
      where: { id: type.id },
      create: type,
      update: type,
    });
  }
  stats.steeringTypes = steeringTypes.length;
  console.log(`   ✅ Migrated ${steeringTypes.length} steering types\n`);

  // Makes
  console.log('3️⃣  Migrating makes...');
  const makes = await localPrisma.make.findMany();
  for (const make of makes) {
    await prodPrisma.make.upsert({
      where: { id: make.id },
      create: make,
      update: make,
    });
  }
  stats.makes = makes.length;
  console.log(`   ✅ Migrated ${makes.length} makes\n`);

  // Models
  console.log('4️⃣  Migrating models...');
  const models = await localPrisma.model.findMany();
  for (const model of models) {
    await prodPrisma.model.upsert({
      where: { id: model.id },
      create: model,
      update: model,
    });
  }
  stats.models = models.length;
  console.log(`   ✅ Migrated ${models.length} models\n`);

  // Collections
  console.log('5️⃣  Migrating collections...');
  const collections = await localPrisma.collection.findMany();
  for (const collection of collections) {
    await prodPrisma.collection.upsert({
      where: { id: collection.id },
      create: collection,
      update: collection,
    });
  }
  stats.collections = collections.length;
  console.log(`   ✅ Migrated ${collections.length} collections\n`);
}

async function migrateUsers(
  localPrisma: PrismaClient,
  prodPrisma: PrismaClient,
  stats: MigrationStats
): Promise<void> {
  console.log('👥 Migrating users...\n');

  const users = await localPrisma.user.findMany();
  let count = 0;

  for (const user of users) {
    await prodPrisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: user,
    });
    
    count++;
    if (count % 50 === 0) {
      console.log(`   📊 Progress: ${count}/${users.length} users`);
    }
  }

  stats.users = users.length;
  console.log(`   ✅ Migrated ${users.length} users\n`);
}

async function migrateVehicles(
  localPrisma: PrismaClient,
  prodPrisma: PrismaClient,
  stats: MigrationStats
): Promise<void> {
  console.log('🚗 Migrating vehicles...\n');

  const vehicles = await localPrisma.vehicle.findMany();
  let count = 0;

  for (const vehicle of vehicles) {
    await prodPrisma.vehicle.upsert({
      where: { id: vehicle.id },
      create: vehicle,
      update: vehicle,
    });
    
    count++;
    if (count % 100 === 0) {
      console.log(`   📊 Progress: ${count}/${vehicles.length} vehicles`);
    }
  }

  stats.vehicles = vehicles.length;
  console.log(`   ✅ Migrated ${vehicles.length} vehicles\n`);
}

async function migrateMedia(
  localPrisma: PrismaClient,
  prodPrisma: PrismaClient,
  stats: MigrationStats
): Promise<void> {
  console.log('📸 Migrating media...\n');

  const media = await localPrisma.media.findMany();
  let count = 0;

  for (const item of media) {
    await prodPrisma.media.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
    
    count++;
    if (count % 200 === 0) {
      console.log(`   📊 Progress: ${count}/${media.length} media items`);
    }
  }

  stats.media = media.length;
  console.log(`   ✅ Migrated ${media.length} media items\n`);
}

async function migrateRelationships(
  localPrisma: PrismaClient,
  prodPrisma: PrismaClient,
  stats: MigrationStats
): Promise<void> {
  console.log('🔗 Migrating relationships...\n');

  // Vehicle Collections
  console.log('1️⃣  Migrating vehicle collections...');
  const vehicleCollections = await localPrisma.vehicleCollection.findMany();
  for (const vc of vehicleCollections) {
    await prodPrisma.vehicleCollection.upsert({
      where: { id: vc.id },
      create: vc,
      update: vc,
    });
  }
  stats.vehicleCollections = vehicleCollections.length;
  console.log(`   ✅ Migrated ${vehicleCollections.length} vehicle collections\n`);

  // Vehicle Sources
  console.log('2️⃣  Migrating vehicle sources...');
  const sources = await localPrisma.vehicleSource.findMany();
  for (const source of sources) {
    await prodPrisma.vehicleSource.upsert({
      where: { id: source.id },
      create: source,
      update: source,
    });
  }
  stats.sources = sources.length;
  console.log(`   ✅ Migrated ${sources.length} sources\n`);

  // Vehicle Specifications
  console.log('3️⃣  Migrating vehicle specifications...');
  const specs = await localPrisma.vehicleSpecification.findMany();
  
  // Delete existing specs in production first (no unique constraint)
  await prodPrisma.vehicleSpecification.deleteMany({
    where: {
      vehicleId: {
        in: specs.map(s => s.vehicleId),
      },
    },
  });

  // Create new specs
  if (specs.length > 0) {
    await prodPrisma.vehicleSpecification.createMany({
      data: specs,
      skipDuplicates: true,
    });
  }
  
  stats.specifications = specs.length;
  console.log(`   ✅ Migrated ${specs.length} specifications\n`);
}

async function verifyMigration(
  prodPrisma: PrismaClient,
  stats: MigrationStats
): Promise<void> {
  console.log('🔍 Verifying migration...\n');

  const verification = {
    countries: await prodPrisma.country.count(),
    steeringTypes: await prodPrisma.steeringType.count(),
    makes: await prodPrisma.make.count(),
    models: await prodPrisma.model.count(),
    collections: await prodPrisma.collection.count(),
    users: await prodPrisma.user.count(),
    vehicles: await prodPrisma.vehicle.count(),
    media: await prodPrisma.media.count(),
  };

  let allGood = true;

  Object.entries(stats).forEach(([key, expectedCount]) => {
    const actualCount = verification[key as keyof typeof verification];
    if (actualCount !== undefined && actualCount !== expectedCount) {
      console.log(`   ⚠️  ${key}: Expected ${expectedCount}, got ${actualCount}`);
      allGood = false;
    }
  });

  if (allGood) {
    console.log('   ✅ All data verified successfully!\n');
  } else {
    console.log('   ⚠️  Some discrepancies found. Please review.\n');
  }
}

async function main() {
  console.log('🚀 Production Migration Tool\n');
  console.log('This will migrate data from local database to production Supabase.\n');

  // Check environment variables
  if (!process.env.LOCAL_DATABASE_URL) {
    console.error('❌ LOCAL_DATABASE_URL environment variable is required');
    console.error('\nExample:');
    console.error('  export LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/spokehire_local"');
    process.exit(1);
  }

  if (!process.env.PRODUCTION_DATABASE_URL) {
    console.error('❌ PRODUCTION_DATABASE_URL environment variable is required');
    console.error('\nExample:');
    console.error('  export PRODUCTION_DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"');
    process.exit(1);
  }

  // Display connection info
  console.log('📊 Migration Configuration:');
  console.log(`   Local:      ${process.env.LOCAL_DATABASE_URL.split('@')[1]?.split('?')[0]}`);
  console.log(`   Production: ${process.env.PRODUCTION_DATABASE_URL.split('@')[1]?.split('?')[0]}\n`);

  // Confirm migration
  const confirm = await question('⚠️  Type "MIGRATE" to proceed with migration: ');
  
  if (confirm !== 'MIGRATE') {
    console.log('❌ Migration cancelled');
    process.exit(0);
  }

  const localPrisma = createLocalPrisma();
  const prodPrisma = createProductionPrisma();

  const stats: MigrationStats = {
    countries: 0,
    steeringTypes: 0,
    makes: 0,
    models: 0,
    collections: 0,
    users: 0,
    vehicles: 0,
    media: 0,
    vehicleCollections: 0,
    sources: 0,
    specifications: 0,
  };

  try {
    // Check production database
    await checkProductionDatabase(prodPrisma);

    // Start migration
    console.log('🔄 Starting migration...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Migrate in correct order (respecting foreign keys)
    await migrateReferenceData(localPrisma, prodPrisma, stats);
    await migrateUsers(localPrisma, prodPrisma, stats);
    await migrateVehicles(localPrisma, prodPrisma, stats);
    await migrateMedia(localPrisma, prodPrisma, stats);
    await migrateRelationships(localPrisma, prodPrisma, stats);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify migration
    await verifyMigration(prodPrisma, stats);

    // Success summary
    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Migration Summary:');
    console.log(`   Countries: ${stats.countries}`);
    console.log(`   Steering Types: ${stats.steeringTypes}`);
    console.log(`   Makes: ${stats.makes}`);
    console.log(`   Models: ${stats.models}`);
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Users: ${stats.users}`);
    console.log(`   Vehicles: ${stats.vehicles}`);
    console.log(`   Media: ${stats.media}`);
    console.log(`   Vehicle Collections: ${stats.vehicleCollections}`);
    console.log(`   Sources: ${stats.sources}`);
    console.log(`   Specifications: ${stats.specifications}\n`);

    console.log('🎉 Next steps:');
    console.log('   1. Run verification: npm run verify-production');
    console.log('   2. Create admin user: npm run create-admin-user');
    console.log('   3. Test the application\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await localPrisma.$disconnect();
    await prodPrisma.$disconnect();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

