#!/usr/bin/env tsx
/**
 * Verify Preview Database Setup
 * 
 * Checks that all database components are properly configured:
 * - PostGIS extension
 * - Schema tables
 * - RLS policies
 * - Indexes
 * - Triggers
 * - Storage bucket
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

async function verify() {
  console.log('🔍 Verifying Preview Database Setup\n');
  console.log('═'.repeat(50));
  console.log('\n');

  // Validate environment
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

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.PREVIEW_DIRECT_URL } },
  });

  const supabase = createClient(
    process.env.PREVIEW_SUPABASE_URL!,
    process.env.PREVIEW_SUPABASE_SERVICE_ROLE_KEY!
  );

  let allPassed = true;

  try {
    // 1. Check PostGIS
    console.log('1️⃣  PostGIS Extension:');
    try {
      const result = await prisma.$queryRawUnsafe<Array<{ postgis_version: string }>>(
        'SELECT PostGIS_version() as postgis_version;'
      );
      console.log(`   ✅ PostGIS ${result[0]!.postgis_version}\n`);
    } catch {
      console.log('   ❌ PostGIS not enabled\n');
      allPassed = false;
    }

    // 2. Check Tables
    console.log('2️⃣  Database Tables:');
    const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
    );
    
    const expectedTables = [
      'Collection', 'Country', 'Deal', 'DealRecipient', 'DealVehicle',
      'Make', 'Media', 'Model', 'SteeringType', 'User', 'Vehicle',
      'VehicleCollection', 'VehicleSource', 'VehicleSpecification'
    ];
    
    const foundTables = tables.map(t => t.tablename);
    const missingTables = expectedTables.filter(t => !foundTables.includes(t));
    
    if (missingTables.length === 0) {
      console.log(`   ✅ All ${expectedTables.length} required tables exist\n`);
    } else {
      console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}\n`);
      allPassed = false;
    }

    // 3. Check RLS
    console.log('3️⃣  Row Level Security:');
    const rlsStatus = await prisma.$queryRawUnsafe<
      Array<{ tablename: string; rls_enabled: boolean; policy_count: bigint }>
    >(`
      SELECT 
        t.tablename,
        t.rowsecurity as rls_enabled,
        COUNT(pol.policyname) as policy_count
      FROM pg_tables t
      LEFT JOIN pg_policies pol ON t.tablename = pol.tablename
      WHERE t.schemaname = 'public'
        AND t.tablename IN (
          'User', 'Vehicle', 'Media', 'Make', 'Model', 
          'Collection', 'SteeringType', 'Country',
          'Deal', 'DealVehicle', 'DealRecipient',
          'VehicleCollection', 'VehicleSource', 'VehicleSpecification'
        )
      GROUP BY t.tablename, t.rowsecurity
      ORDER BY t.tablename;
    `);
    
    let rlsIssues = 0;
    rlsStatus.forEach(row => {
      const status = row.rls_enabled ? '✅' : '❌';
      const policyCount = Number(row.policy_count);
      console.log(`   ${status} ${row.tablename} (${policyCount} ${policyCount === 1 ? 'policy' : 'policies'})`);
      if (!row.rls_enabled) {
        rlsIssues++;
        allPassed = false;
      }
    });
    
    if (rlsIssues === 0) {
      console.log(`   ✅ All tables have RLS enabled\n`);
    } else {
      console.log(`   ⚠️  ${rlsIssues} tables missing RLS\n`);
    }

    // 4. Check Indexes
    console.log('4️⃣  Performance Indexes:');
    const spatialIndexes = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%geoPoint%';`
    );
    
    const compositeIndexes = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
      `SELECT indexname FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND (indexname LIKE 'Vehicle_status_%' OR indexname LIKE 'Media_vehicleId_%');`
    );
    
    console.log(`   ${spatialIndexes.length > 0 ? '✅' : '❌'} Spatial indexes: ${spatialIndexes.length}`);
    console.log(`   ${compositeIndexes.length > 0 ? '✅' : '⚠️'} Composite indexes: ${compositeIndexes.length}`);
    console.log('');
    
    if (spatialIndexes.length === 0) {
      allPassed = false;
    }

    // 5. Check Triggers
    console.log('5️⃣  Database Triggers:');
    const triggers = await prisma.$queryRawUnsafe<Array<{ tgname: string }>>(
      `SELECT tgname FROM pg_trigger WHERE tgname = 'user_geopoint_update';`
    );
    
    if (triggers.length > 0) {
      console.log('   ✅ geoPoint trigger exists\n');
    } else {
      console.log('   ❌ geoPoint trigger missing\n');
      allPassed = false;
    }

    // 6. Check Storage
    console.log('6️⃣  Supabase Storage:');
    const { data: buckets } = await supabase.storage.listBuckets();
    const vehicleImagesBucket = buckets?.find(b => b.name === 'vehicle-images');
    
    if (vehicleImagesBucket) {
      const isPublic = vehicleImagesBucket.public ?? false;
      console.log(`   ✅ vehicle-images bucket exists`);
      console.log(`   ${isPublic ? '✅' : '⚠️'} Bucket is ${isPublic ? 'public' : 'private'}`);
      
      if (!isPublic) {
        console.log('   ℹ️  Bucket should be public for image display\n');
      } else {
        console.log('');
      }
    } else {
      console.log('   ❌ vehicle-images bucket not found\n');
      allPassed = false;
    }

    // 7. Check Storage RLS
    console.log('7️⃣  Storage RLS Policies:');
    try {
      const storageRls = await prisma.$queryRawUnsafe<
        Array<{ policyname: string }>
      >(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%vehicle-images%';
      `);
      
      if (storageRls.length > 0) {
        console.log(`   ✅ ${storageRls.length} storage RLS policies found`);
        storageRls.forEach(p => {
          console.log(`      - ${p.policyname}`);
        });
        console.log('');
      } else {
        console.log('   ⚠️  No storage RLS policies found\n');
      }
    } catch {
      console.log('   ⚠️  Could not check storage RLS policies\n');
    }

    // Summary
    console.log('═'.repeat(50));
    if (allPassed) {
      console.log('✅ All critical checks passed!');
      console.log('═'.repeat(50));
      console.log('\n📝 Database is ready for data migration\n');
      console.log('Next step: tsx scripts/setup-preview-environment.ts\n');
    } else {
      console.log('⚠️  Some checks failed');
      console.log('═'.repeat(50));
      console.log('\n📝 Fix the issues above before proceeding\n');
      console.log('Run: tsx scripts/setup-preview-database.ts\n');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();

