#!/usr/bin/env tsx
/**
 * Complete Preview Database Setup Script
 * 
 * Sets up a preview Supabase database with:
 * - PostGIS extension for geolocation
 * - Row Level Security (RLS) policies
 * - Database schema (via Prisma)
 * - Performance indexes
 * - Triggers for geoPoint updates
 * - Storage bucket configuration
 * 
 * Usage:
 *   # Full setup (recommended)
 *   tsx scripts/setup-preview-database.ts
 * 
 *   # Individual steps
 *   tsx scripts/setup-preview-database.ts --step postgis
 *   tsx scripts/setup-preview-database.ts --step schema
 *   tsx scripts/setup-preview-database.ts --step rls
 *   tsx scripts/setup-preview-database.ts --step indexes
 *   tsx scripts/setup-preview-database.ts --step triggers
 *   tsx scripts/setup-preview-database.ts --step storage
 * 
 * Environment Variables Required:
 *   PREVIEW_DIRECT_URL - Direct database connection (for migrations)
 *   PREVIEW_SUPABASE_URL - Supabase project URL
 *   PREVIEW_SUPABASE_SERVICE_ROLE_KEY - Service role key
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
  step?: 'all' | 'postgis' | 'schema' | 'rls' | 'indexes' | 'triggers' | 'storage';
  skipConfirmation?: boolean;
}

// ============================================
// Parse Arguments
// ============================================

function parseArgs(): SetupConfig {
  const args = process.argv.slice(2);
  const config: SetupConfig = { step: 'all', skipConfirmation: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--step':
        config.step = args[++i] as SetupConfig['step'];
        break;
      case '--yes':
      case '-y':
        config.skipConfirmation = true;
        break;
    }
  }

  return config;
}

// ============================================
// Environment Validation
// ============================================

function validateEnvironment() {
  const required = [
    'PREVIEW_DIRECT_URL',
    'PREVIEW_SUPABASE_URL',
    'PREVIEW_SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nSet these in your environment or .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables validated\n');
}

// ============================================
// Database Clients
// ============================================

function createPreviewPrismaClient() {
  return new PrismaClient({
    datasources: { db: { url: process.env.PREVIEW_DIRECT_URL } },
  });
}

function createPreviewSupabaseClient() {
  return createClient(
    process.env.PREVIEW_SUPABASE_URL!,
    process.env.PREVIEW_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

// ============================================
// Step 1: Enable PostGIS
// ============================================

async function enablePostGIS(prisma: PrismaClient) {
  console.log('🗺️  Step 1: Enabling PostGIS Extension...\n');

  try {
    // Enable PostGIS extension
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('   ✅ PostGIS extension enabled');

    // Verify PostGIS is working
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

async function pushPrismaSchema() {
  console.log('📐 Step 2: Pushing Prisma Schema...\n');

  try {
    console.log('   Running: npx prisma db push --skip-generate');
    
    execSync(
      `DATABASE_URL="${process.env.PREVIEW_DIRECT_URL}" npx prisma db push --skip-generate`,
      { stdio: 'inherit', cwd: process.cwd() }
    );

    console.log('\n✅ Prisma schema pushed successfully!\n');
  } catch (error) {
    console.error('❌ Failed to push Prisma schema:', error);
    throw error;
  }
}

// ============================================
// Step 3: Apply RLS Policies
// ============================================

async function applyRLSPolicies(prisma: PrismaClient) {
  console.log('🔒 Step 3: Applying Row Level Security Policies...\n');

  try {
    // Read the RLS SQL file
    const rlsSqlPath = path.join(process.cwd(), 'sql/setup/supabase-rls-setup.sql');
    
    if (!fs.existsSync(rlsSqlPath)) {
      throw new Error(`RLS SQL file not found: ${rlsSqlPath}`);
    }

    const rlsSql = fs.readFileSync(rlsSqlPath, 'utf8');
    console.log(`   📄 Loaded SQL from: ${rlsSqlPath}`);

    // Split SQL by statement (simple split on semicolons outside of functions)
    const statements = rlsSql
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/) // Split on semicolons not in strings
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   📝 Found ${statements.length} SQL statements`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]!;
      
      // Skip comments and empty statements
      if (stmt.startsWith('--') || stmt.length < 5) continue;

      try {
        await prisma.$executeRawUnsafe(stmt + ';');
      } catch (err) {
        // Ignore certain safe errors
        const errMsg = String(err).toLowerCase();
        if (
          errMsg.includes('already exists') ||
          errMsg.includes('does not exist') ||
          errMsg.includes('no policy')
        ) {
          // These are safe to ignore
          continue;
        }
        console.warn(`   ⚠️  Warning executing statement ${i + 1}:`, err);
      }
    }

    console.log('   ✅ RLS policies applied');

    // Verify RLS is enabled
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
          'Collection', 'SteeringType', 'Country'
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
    // Create GIST index for geoPoint (spatial queries)
    console.log('   Creating spatial index on geoPoint...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "User_geoPoint_idx" 
      ON "User" USING GIST ("geoPoint");
    `);
    console.log('   ✅ Spatial index created');

    // Create composite indexes for common queries
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
    // Create trigger function for geoPoint updates
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

    // Drop existing trigger if it exists
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS user_geopoint_update ON "User";
    `);

    // Create trigger
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER user_geopoint_update
        BEFORE INSERT OR UPDATE OF latitude, longitude ON "User"
        FOR EACH ROW
        EXECUTE FUNCTION update_user_geopoint();
    `);

    console.log('   ✅ geoPoint trigger created');

    // Verify trigger exists
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

async function setupStorage(supabase: ReturnType<typeof createPreviewSupabaseClient>) {
  console.log('📦 Step 6: Setting up Supabase Storage...\n');

  try {
    const bucketName = 'vehicle-images';

    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (!bucketExists) {
      console.log(`   Creating bucket: ${bucketName}...`);
      
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 15728640, // 15MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (createError) {
        throw createError;
      }

      console.log(`   ✅ Bucket '${bucketName}' created`);
    } else {
      console.log(`   ℹ️  Bucket '${bucketName}' already exists`);
      
      // Make sure it's public
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
      });

      if (updateError && !updateError.message.includes('already exists')) {
        console.warn('   ⚠️  Failed to update bucket:', updateError);
      }
    }

    // Apply storage RLS policies
    console.log('   Applying storage RLS policies...');
    
    // Use Prisma to execute the storage RLS SQL
    const prisma = createPreviewPrismaClient();
    const storageRlsSqlPath = path.join(process.cwd(), 'sql/setup/storage-rls-policies.sql');
    
    if (fs.existsSync(storageRlsSqlPath)) {
      const storageRlsSql = fs.readFileSync(storageRlsSqlPath, 'utf8');
      
      // Split and execute
      const statements = storageRlsSql
        .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        if (stmt.length < 5) continue;
        
        try {
          await prisma.$executeRawUnsafe(stmt + ';');
        } catch (err) {
          const errMsg = String(err).toLowerCase();
          if (
            errMsg.includes('already exists') ||
            errMsg.includes('does not exist')
          ) {
            continue;
          }
          console.warn('   ⚠️  Storage RLS warning:', err);
        }
      }
      
      await prisma.$disconnect();
      console.log('   ✅ Storage RLS policies applied');
    } else {
      console.log('   ⚠️  Storage RLS SQL file not found, skipping');
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
  console.log('🚀 Preview Database Setup\n');
  console.log('═'.repeat(50));
  console.log('\n');

  const config = parseArgs();

  // Validate environment
  validateEnvironment();

  // Display configuration
  console.log('📋 Configuration:');
  console.log(`   Step: ${config.step}`);
  console.log(`   Database: ${process.env.PREVIEW_DIRECT_URL?.split('@')[1]?.split('/')[0] ?? 'unknown'}`);
  console.log(`   Supabase: ${process.env.PREVIEW_SUPABASE_URL}`);
  console.log('\n');

  // Confirm before proceeding
  if (!config.skipConfirmation) {
    console.log('⚠️  This will modify your preview database.');
    console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  let prisma: PrismaClient | null = null;
  let supabase: ReturnType<typeof createPreviewSupabaseClient> | null = null;

  try {
    // Execute requested steps
    const shouldRunStep = (step: string) =>
      config.step === 'all' || config.step === step;

    if (shouldRunStep('postgis')) {
      prisma = prisma ?? createPreviewPrismaClient();
      await enablePostGIS(prisma);
    }

    if (shouldRunStep('schema')) {
      await pushPrismaSchema();
    }

    if (shouldRunStep('rls')) {
      prisma = prisma ?? createPreviewPrismaClient();
      await applyRLSPolicies(prisma);
    }

    if (shouldRunStep('indexes')) {
      prisma = prisma ?? createPreviewPrismaClient();
      await applyPerformanceIndexes(prisma);
    }

    if (shouldRunStep('triggers')) {
      prisma = prisma ?? createPreviewPrismaClient();
      await createTriggers(prisma);
    }

    if (shouldRunStep('storage')) {
      supabase = supabase ?? createPreviewSupabaseClient();
      await setupStorage(supabase);
    }

    // Success message
    console.log('\n' + '═'.repeat(50));
    console.log('✅ Preview Database Setup Complete!');
    console.log('═'.repeat(50));
    console.log('\n📝 Next Steps:\n');
    console.log('   1. Run data migration:');
    console.log('      tsx scripts/setup-preview-environment.ts\n');
    console.log('   2. Create admin user:');
    console.log('      tsx scripts/create-admin-user.ts\n');
    console.log('   3. Configure Vercel environment variables\n');
    console.log('   4. Deploy preview branch\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma?.$disconnect();
  }
}

main();

