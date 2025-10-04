#!/usr/bin/env tsx
/**
 * Verify Production Database Script
 * 
 * Performs comprehensive checks on production database:
 * - Record counts
 * - Data integrity
 * - Relationships
 * - Orphaned records
 * 
 * Usage:
 * ```bash
 * # Verify current DATABASE_URL
 * npm run verify-production
 * 
 * # Verify specific database
 * DATABASE_URL="postgresql://..." npm run verify-production
 * ```
 */

import { PrismaClient } from '@prisma/client';

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: string;
}

async function verifyRecordCounts(prisma: PrismaClient): Promise<void> {
  console.log('📊 Record Counts:\n');

  const counts = {
    'Countries': await prisma.country.count(),
    'Steering Types': await prisma.steeringType.count(),
    'Makes': await prisma.make.count(),
    'Models': await prisma.model.count(),
    'Collections': await prisma.collection.count(),
    'Users': await prisma.user.count(),
    'Vehicles': await prisma.vehicle.count(),
    'Media': await prisma.media.count(),
    'Vehicle Collections': await prisma.vehicleCollection.count(),
    'Vehicle Sources': await prisma.vehicleSource.count(),
    'Vehicle Specifications': await prisma.vehicleSpecification.count(),
  };

  Object.entries(counts).forEach(([name, count]) => {
    console.log(`   ${name.padEnd(25)} ${count.toString().padStart(6)}`);
  });

  console.log('');
}

async function verifyDataIntegrity(prisma: PrismaClient): Promise<VerificationResult[]> {
  console.log('🔍 Data Integrity Checks:\n');

  const results: VerificationResult[] = [];

  // Check for orphaned vehicles (vehicles without owners)
  const orphanedVehicles = await prisma.vehicle.count({
    where: {
      ownerId: null,
    },
  });
  results.push({
    passed: orphanedVehicles === 0,
    message: `Orphaned vehicles (without owner)`,
    details: `${orphanedVehicles} found`,
  });

  // Check for vehicles with invalid owner references
  const vehiclesWithInvalidOwner = await prisma.vehicle.count({
    where: {
      ownerId: {
        not: null,
      },
      owner: null,
    },
  });
  results.push({
    passed: vehiclesWithInvalidOwner === 0,
    message: `Vehicles with invalid owner`,
    details: `${vehiclesWithInvalidOwner} found`,
  });

  // Check for orphaned media (media without vehicles)
  const orphanedMedia = await prisma.media.count({
    where: {
      vehicleId: null,
    },
  });
  results.push({
    passed: orphanedMedia === 0,
    message: `Orphaned media (without vehicle)`,
    details: `${orphanedMedia} found`,
  });

  // Check for media with invalid vehicle references
  const mediaWithInvalidVehicle = await prisma.media.count({
    where: {
      vehicleId: {
        not: null,
      },
      vehicle: null,
    },
  });
  results.push({
    passed: mediaWithInvalidVehicle === 0,
    message: `Media with invalid vehicle`,
    details: `${mediaWithInvalidVehicle} found`,
  });

  // Check for models without makes
  const modelsWithoutMake = await prisma.model.count({
    where: {
      make: null,
    },
  });
  results.push({
    passed: modelsWithoutMake === 0,
    message: `Models without make`,
    details: `${modelsWithoutMake} found`,
  });

  // Check for vehicles with invalid make/model
  const vehiclesWithInvalidMake = await prisma.vehicle.count({
    where: {
      make: null,
    },
  });
  results.push({
    passed: vehiclesWithInvalidMake === 0,
    message: `Vehicles with invalid make`,
    details: `${vehiclesWithInvalidMake} found`,
  });

  const vehiclesWithInvalidModel = await prisma.vehicle.count({
    where: {
      model: null,
    },
  });
  results.push({
    passed: vehiclesWithInvalidModel === 0,
    message: `Vehicles with invalid model`,
    details: `${vehiclesWithInvalidModel} found`,
  });

  // Display results
  results.forEach(result => {
    const icon = result.passed ? '✅' : '⚠️';
    console.log(`   ${icon} ${result.message.padEnd(35)} ${result.details}`);
  });

  console.log('');
  return results;
}

async function verifyVehicleStatus(prisma: PrismaClient): Promise<void> {
  console.log('📋 Vehicles by Status:\n');

  const statusCounts = await prisma.vehicle.groupBy({
    by: ['status'],
    _count: true,
  });

  statusCounts.forEach(item => {
    console.log(`   ${item.status.padEnd(15)} ${item._count.toString().padStart(6)}`);
  });

  console.log('');
}

async function verifyUserTypes(prisma: PrismaClient): Promise<void> {
  console.log('👥 Users by Type:\n');

  const userCounts = await prisma.user.groupBy({
    by: ['userType'],
    _count: true,
  });

  userCounts.forEach(item => {
    console.log(`   ${item.userType.padEnd(15)} ${item._count.toString().padStart(6)}`);
  });

  // Check for admin users
  const adminCount = await prisma.user.count({
    where: {
      userType: 'ADMIN',
    },
  });

  if (adminCount === 0) {
    console.log('\n   ⚠️  No admin users found! Run: npm run create-admin-user');
  }

  console.log('');
}

async function verifyMediaStatus(prisma: PrismaClient): Promise<void> {
  console.log('📸 Media by Status:\n');

  const mediaCounts = await prisma.media.groupBy({
    by: ['status'],
    _count: true,
  });

  mediaCounts.forEach(item => {
    console.log(`   ${item.status.padEnd(15)} ${item._count.toString().padStart(6)}`);
  });

  console.log('');
}

async function verifyMediaTypes(prisma: PrismaClient): Promise<void> {
  console.log('🎬 Media by Type:\n');

  const typeCounts = await prisma.media.groupBy({
    by: ['type'],
    _count: true,
  });

  typeCounts.forEach(item => {
    console.log(`   ${item.type.padEnd(15)} ${item._count.toString().padStart(6)}`);
  });

  console.log('');
}

async function verifyVehiclesWithMedia(prisma: PrismaClient): Promise<void> {
  console.log('📷 Vehicles and Media:\n');

  const vehiclesWithMedia = await prisma.vehicle.count({
    where: {
      media: {
        some: {},
      },
    },
  });

  const vehiclesWithoutMedia = await prisma.vehicle.count({
    where: {
      media: {
        none: {},
      },
    },
  });

  const vehiclesWithPrimaryMedia = await prisma.vehicle.count({
    where: {
      media: {
        some: {
          isPrimary: true,
        },
      },
    },
  });

  const totalVehicles = await prisma.vehicle.count();

  console.log(`   Vehicles with media:         ${vehiclesWithMedia.toString().padStart(6)}`);
  console.log(`   Vehicles without media:      ${vehiclesWithoutMedia.toString().padStart(6)}`);
  console.log(`   Vehicles with primary media: ${vehiclesWithPrimaryMedia.toString().padStart(6)}`);
  console.log(`   Total vehicles:              ${totalVehicles.toString().padStart(6)}`);

  const percentageWithMedia = ((vehiclesWithMedia / totalVehicles) * 100).toFixed(1);
  console.log(`   Coverage:                    ${percentageWithMedia}%`);

  console.log('');
}

async function verifyTopMakes(prisma: PrismaClient): Promise<void> {
  console.log('🚗 Top 10 Makes by Vehicle Count:\n');

  const makes = await prisma.make.findMany({
    include: {
      _count: {
        select: { vehicles: true },
      },
    },
    orderBy: {
      vehicles: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  makes.forEach((make, index) => {
    console.log(`   ${(index + 1).toString().padStart(2)}. ${make.name.padEnd(20)} ${make._count.vehicles.toString().padStart(6)} vehicles`);
  });

  console.log('');
}

async function verifyCollections(prisma: PrismaClient): Promise<void> {
  console.log('🏷️  Collections:\n');

  const collections = await prisma.collection.findMany({
    include: {
      _count: {
        select: { vehicles: true },
      },
    },
    orderBy: {
      vehicles: {
        _count: 'desc',
      },
    },
  });

  collections.forEach(collection => {
    console.log(`   ${collection.name.padEnd(20)} ${collection._count.vehicles.toString().padStart(6)} vehicles`);
  });

  console.log('');
}

async function verifyDatabaseConnection(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Production Database Verification\n');

  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('\nPlease set DATABASE_URL in your .env file or provide it:');
    console.error('  DATABASE_URL="postgresql://..." npm run verify-production');
    process.exit(1);
  }

  // Show which database we're verifying
  const dbInfo = databaseUrl.split('@')[1]?.split('?')[0];
  console.log(`📊 Verifying: ${dbInfo}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const prisma = new PrismaClient();

  try {
    // Test connection
    const connected = await verifyDatabaseConnection(prisma);
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Run verification checks
    await verifyRecordCounts(prisma);
    const integrityResults = await verifyDataIntegrity(prisma);
    await verifyVehicleStatus(prisma);
    await verifyUserTypes(prisma);
    await verifyMediaStatus(prisma);
    await verifyMediaTypes(prisma);
    await verifyVehiclesWithMedia(prisma);
    await verifyTopMakes(prisma);
    await verifyCollections(prisma);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    const failedChecks = integrityResults.filter(r => !r.passed).length;
    
    if (failedChecks === 0) {
      console.log('✅ All integrity checks passed!\n');
      console.log('🎉 Database is healthy and ready for production.\n');
    } else {
      console.log(`⚠️  ${failedChecks} integrity check(s) failed.\n`);
      console.log('Please review the issues above before deploying to production.\n');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

