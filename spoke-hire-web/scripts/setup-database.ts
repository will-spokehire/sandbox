#!/usr/bin/env tsx
/**
 * Unified Database Setup Script
 * 
 * Sets up database for both local and preview/production environments:
 * - PostGIS extension
 * - Prisma schema
 * - Row Level Security (cloud only)
 * - Performance indexes
 * - Database triggers
 * - Storage bucket
 * 
 * Usage:
 *   # Local setup
 *   tsx scripts/setup-database.ts --local
 * 
 *   # Preview/Production setup
 *   tsx scripts/setup-database.ts
 * 
 * Environment Variables:
 *   DATABASE_URL - Pooled connection (or local connection)
 *   DIRECT_URL - Direct connection (for migrations)
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Configuration
// ============================================

interface SetupConfig {
  isLocal: boolean;
  step?: 'all' | 'postgis' | 'schema' | 'rls' | 'indexes' | 'triggers' | 'storage';
  skipConfirmation?: boolean;
  startDocker?: boolean;
}

// ============================================
// Parse Arguments
// ============================================

function parseArgs(): SetupConfig {
  const args = process.argv.slice(2);
  const config: SetupConfig = {
    isLocal: false,
    step: 'all',
    skipConfirmation: false,
    startDocker: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--local':
        config.isLocal = true;
        break;
      case '--step':
        config.step = args[++i] as SetupConfig['step'];
        break;
      case '--yes':
      case '-y':
        config.skipConfirmation = true;
        break;
      case '--no-docker':
        config.startDocker = false;
        break;
    }
  }

  return config;
}

// ============================================
// Environment Validation
// ============================================

function validateEnvironment(isLocal: boolean) {
  const required = isLocal
    ? [] // Local can work with defaults
    : ['DIRECT_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nSet these in your environment or .env file');
    process.exit(1);
  }

  if (isLocal) {
    console.log('✅ Local environment (using defaults)\n');
  } else {
    console.log('✅ Environment variables validated\n');
  }
}

// ============================================
// Local Docker Management
// ============================================

async function startSupabaseDocker() {
  console.log('🐳 Checking Docker...');
  try {
    execSync('docker info', { stdio: 'ignore' });
    console.log('   ✅ Docker is running\n');
  } catch {
    console.error('   ❌ Docker is not running');
    console.error('   Please start Docker Desktop and try again\n');
    process.exit(1);
  }

  console.log('📦 Starting Supabase services...');
  try {
    execSync('npx supabase start', { stdio: 'inherit' });
    console.log('   ✅ Supabase started\n');
  } catch (error) {
    console.error('   ⚠️  Supabase might already be running\n');
  }
}

// ============================================
// Database Client
// ============================================

function createDatabaseClient(isLocal: boolean) {
  const dbUrl = isLocal
    ? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    : process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('No database URL found');
  }

  return new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });
}

function createStorageClient(isLocal: boolean) {
  const url = isLocal
    ? 'http://127.0.0.1:54321'
    : process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key = isLocal
    ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ============================================
// Step 1: Enable PostGIS
// ============================================

async function enablePostGIS(prisma: PrismaClient) {
  console.log('🗺️  Step 1: Enabling PostGIS Extension...\n');

  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('   ✅ PostGIS extension enabled');

    const result = await prisma.$queryRawUnsafe<Array<{ postgis_version: string }>>(
      'SELECT PostGIS_version() as postgis_version;'
    );

    if (result.length > 0) {
      console.log(`   ✅ PostGIS version: ${result[0]!.postgis_version}`);
    }

    console.log('\n✅ PostGIS setup complete!\n');
  } catch (error) {
    console.error('❌ Failed to enable PostGIS:', error);
    throw error;
  }
}

// ============================================
// Step 2: Push Prisma Schema
// ============================================

async function pushPrismaSchema(isLocal: boolean) {
  console.log('📐 Step 2: Pushing Prisma Schema...\n');

  const dbUrl = isLocal
    ? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    : process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  try {
    console.log('   Running: npx prisma db push --skip-generate');
    
    execSync(
      `DATABASE_URL="${dbUrl}" npx prisma db push --skip-generate`,
      { stdio: 'inherit', cwd: process.cwd() }
    );

    console.log('\n✅ Prisma schema pushed successfully!\n');
  } catch (error) {
    console.error('❌ Failed to push Prisma schema:', error);
    throw error;
  }
}

// ============================================
// Step 3: Apply RLS Policies (Cloud Only)
// ============================================

async function applyRLSPolicies(prisma: PrismaClient) {
  console.log('🔒 Step 3: Applying Row Level Security Policies...\n');

  try {
    const rlsSqlPath = path.join(process.cwd(), 'sql/setup/supabase-rls-setup.sql');
    
    if (!fs.existsSync(rlsSqlPath)) {
      throw new Error(`RLS SQL file not found: ${rlsSqlPath}`);
    }

    console.log(`   📄 Executing SQL file: ${rlsSqlPath}`);
    
    // Use psql to execute the SQL file properly
    // This handles procedural SQL blocks (DO $$, CREATE FUNCTION, etc.)
    const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!directUrl) {
      throw new Error('DIRECT_URL or DATABASE_URL not found');
    }
    
    const { execSync } = await import('child_process');
    try {
      execSync(`psql "${directUrl}" -f "${rlsSqlPath}"`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } catch (err: any) {
      // psql might output warnings as errors, check if it's actually a problem
      if (!err.message?.includes('already exists')) {
        console.warn('   ⚠️  psql warnings (may be safe):', err.message);
      }
    }

    console.log('   ✅ RLS policies applied');

    const verification = await prisma.$queryRawUnsafe<
      Array<{ tablename: string; rls_enabled: boolean }>
    >(`
      SELECT 
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN (
          'User', 'Vehicle', 'Media', 'Make', 'Model', 
          'Collection', 'SteeringType', 'Country',
          'VehicleSource', 'VehicleSpecification', 'VehicleCollection',
          'Deal', 'DealVehicle', 'DealRecipient'
        )
      ORDER BY tablename;
    `);

    console.log('\n   📊 RLS Status:');
    verification.forEach(row => {
      const status = row.rls_enabled ? '✅' : '❌';
      console.log(`      ${status} ${row.tablename}`);
    });

    console.log('\n✅ RLS setup complete!\n');
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error);
    throw error;
  }
}

// ============================================
// Step 4: Apply Performance Indexes
// ============================================

async function applyPerformanceIndexes(prisma: PrismaClient) {
  console.log('⚡ Step 4: Applying Performance Indexes...\n');

  try {
    console.log('   Creating spatial index on geoPoint...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "User_geoPoint_idx" 
      ON "User" USING GIST ("geoPoint");
    `);
    console.log('   ✅ Spatial index created');

    console.log('   Creating composite indexes...');
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Vehicle_status_makeId_idx" 
      ON "Vehicle" ("status", "makeId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Vehicle_status_price_idx" 
      ON "Vehicle" ("status", "price");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Media_vehicleId_isPrimary_status_idx" 
      ON "Media" ("vehicleId", "isPrimary", "status");
    `);

    console.log('   ✅ Composite indexes created');

    console.log('\n✅ Performance indexes applied!\n');
  } catch (error) {
    console.error('❌ Failed to apply performance indexes:', error);
    throw error;
  }
}

// ============================================
// Step 5: Create Triggers
// ============================================

async function createTriggers(prisma: PrismaClient) {
  console.log('🔧 Step 5: Creating Database Triggers...\n');

  try {
    console.log('   Creating geoPoint update trigger...');
    
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_user_geopoint()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
          NEW."geoPoint" := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
        ELSE
          NEW."geoPoint" := NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS user_geopoint_update ON "User";
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER user_geopoint_update
        BEFORE INSERT OR UPDATE OF latitude, longitude ON "User"
        FOR EACH ROW
        EXECUTE FUNCTION update_user_geopoint();
    `);

    console.log('   ✅ geoPoint trigger created');

    const triggerCheck = await prisma.$queryRawUnsafe<
      Array<{ trigger_name: string }>
    >(`
      SELECT tgname as trigger_name
      FROM pg_trigger
      WHERE tgname = 'user_geopoint_update';
    `);

    if (triggerCheck.length > 0) {
      console.log('   ✅ Trigger verified');
    }

    console.log('\n✅ Triggers created!\n');
  } catch (error) {
    console.error('❌ Failed to create triggers:', error);
    throw error;
  }
}

// ============================================
// Step 6: Setup Storage
// ============================================

async function setupStorage(
  supabase: ReturnType<typeof createStorageClient>,
  isLocal: boolean
) {
  console.log('📦 Step 6: Setting up Supabase Storage...\n');

  try {
    const bucketName = 'vehicle-images';

    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (!bucketExists) {
      console.log(`   Creating bucket: ${bucketName}...`);
      
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });

      if (createError) {
        throw createError;
      }

      console.log(`   ✅ Bucket '${bucketName}' created`);
    } else {
      console.log(`   ℹ️  Bucket '${bucketName}' already exists`);
      
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
      });

      if (updateError && !updateError.message.includes('already exists')) {
        console.warn('   ⚠️  Failed to update bucket:', updateError);
      }
    }

    // Apply storage RLS policies (cloud only)
    if (!isLocal) {
      console.log('   Applying storage RLS policies...');
      
      const storageRlsSqlPath = path.join(process.cwd(), 'sql/setup/storage-rls-policies.sql');
      
      if (fs.existsSync(storageRlsSqlPath)) {
        const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
        if (!directUrl) {
          throw new Error('DIRECT_URL or DATABASE_URL not found');
        }
        
        const { execSync } = await import('child_process');
        try {
          execSync(`psql "${directUrl}" -f "${storageRlsSqlPath}"`, {
            stdio: 'pipe',
            encoding: 'utf8'
          });
        } catch (err: any) {
          // psql might output warnings as errors, check if it's actually a problem
          if (!err.message?.includes('already exists')) {
            console.warn('   ⚠️  psql warnings (may be safe):', err.message);
          }
        }
        
        console.log('   ✅ Storage RLS policies applied');
      }
    } else {
      console.log('   ℹ️  Skipping storage RLS (local environment)');
    }

    console.log('\n✅ Storage setup complete!\n');
  } catch (error) {
    console.error('❌ Failed to setup storage:', error);
    throw error;
  }
}

// ============================================
// Main Execution
// ============================================

async function main() {
  console.log('🚀 Database Setup\n');
  console.log('═'.repeat(50));
  console.log('\n');

  const config = parseArgs();

  // Validate environment
  validateEnvironment(config.isLocal);

  // Display configuration
  console.log('📋 Configuration:');
  console.log(`   Environment: ${config.isLocal ? 'Local (Docker)' : 'Cloud (Preview/Production)'}`);
  console.log(`   Step: ${config.step}`);
  if (!config.isLocal) {
    const dbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
    console.log(`   Database: ${dbUrl?.split('@')[1]?.split('/')[0] ?? 'unknown'}`);
    console.log(`   Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  }
  console.log('\n');

  // Confirm before proceeding
  if (!config.skipConfirmation && !config.isLocal) {
    console.log('⚠️  This will modify your database.');
    console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  let prisma: PrismaClient | null = null;
  let supabase: ReturnType<typeof createStorageClient> | null = null;

  try {
    // Start Docker for local
    if (config.isLocal && config.startDocker) {
      await startSupabaseDocker();
    }

    // Execute requested steps
    const shouldRunStep = (step: string) =>
      config.step === 'all' || config.step === step;

    if (shouldRunStep('postgis')) {
      prisma = prisma ?? createDatabaseClient(config.isLocal);
      await enablePostGIS(prisma);
    }

    if (shouldRunStep('schema')) {
      await pushPrismaSchema(config.isLocal);
    }

    if (shouldRunStep('rls')) {
      if (config.isLocal) {
        console.log('🔒 Step 3: Skipping RLS (local environment)\n');
      } else {
        prisma = prisma ?? createDatabaseClient(config.isLocal);
        await applyRLSPolicies(prisma);
      }
    }

    if (shouldRunStep('indexes')) {
      prisma = prisma ?? createDatabaseClient(config.isLocal);
      await applyPerformanceIndexes(prisma);
    }

    if (shouldRunStep('triggers')) {
      prisma = prisma ?? createDatabaseClient(config.isLocal);
      await createTriggers(prisma);
    }

    if (shouldRunStep('storage')) {
      supabase = supabase ?? createStorageClient(config.isLocal);
      await setupStorage(supabase, config.isLocal);
    }

    // Success message
    console.log('\n' + '═'.repeat(50));
    console.log(`✅ ${config.isLocal ? 'Local' : 'Cloud'} Database Setup Complete!`);
    console.log('═'.repeat(50));
    console.log('\n📝 Next Steps:\n');
    
    if (config.isLocal) {
      console.log('   1. Seed lookup tables:');
      console.log('      npm run seed-lookup-tables\n');
      console.log('   2. Create admin user:');
      console.log('      npm run create-admin-user\n');
      console.log('   3. Start the app:');
      console.log('      npm run dev\n');
    } else {
      console.log('   1. Run data migration:');
      console.log('      tsx scripts/setup-preview-environment.ts\n');
      console.log('   2. Create admin user:');
      console.log('      tsx scripts/create-admin-user.ts\n');
      console.log('   3. Configure Vercel environment variables\n');
      console.log('   4. Deploy preview branch\n');
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma?.$disconnect();
  }
}

main();

