#!/usr/bin/env tsx
/**
 * Check Missing Tables Script
 * 
 * Checks which tables exist in production and which are missing.
 * Helps diagnose partial migration issues.
 */

import { PrismaClient } from '@prisma/client';

const expectedTables = [
  'Country',
  'User',
  'SteeringType',
  'Make',
  'Model',
  'Collection',
  'Vehicle',
  'Media',
  'VehicleSource',
  'VehicleSpecification',
  'VehicleCollection',
  '_prisma_migrations',
];

async function checkTables() {
  console.log('🔍 Checking Production Database Tables\n');

  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL or DIRECT_URL environment variable is required');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // Query actual tables in database
    const result = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    const existingTables = result.map(r => r.tablename);

    console.log('📊 Tables Found in Database:\n');
    existingTables.forEach(table => {
      console.log(`   ✅ ${table}`);
    });

    console.log('\n📋 Expected Tables Check:\n');

    const missingTables: string[] = [];
    expectedTables.forEach(table => {
      const exists = existingTables.includes(table);
      const icon = exists ? '✅' : '❌';
      console.log(`   ${icon} ${table}`);
      if (!exists) {
        missingTables.push(table);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (missingTables.length === 0) {
      console.log('✅ All expected tables exist!\n');
    } else {
      console.log(`⚠️  ${missingTables.length} table(s) missing:\n`);
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('\n💡 Solution: Re-run migrations to create missing tables\n');
      console.log('Run these commands:');
      console.log('   1. npx prisma generate');
      console.log('   2. npx prisma db push --skip-generate');
      console.log('   or');
      console.log('   3. npx prisma migrate deploy\n');
    }

    // Check for extra tables
    const extraTables = existingTables.filter(
      t => !expectedTables.includes(t) && !t.startsWith('_')
    );

    if (extraTables.length > 0) {
      console.log('📦 Additional tables found (might be okay):\n');
      extraTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkTables().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

