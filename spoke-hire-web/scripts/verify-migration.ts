#!/usr/bin/env tsx

/**
 * Migration verification script
 * Run with: npm run verify-migration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Verifying migration results...\n');
  
  try {
    // Check user counts
    const userStats = await prisma.user.groupBy({
      by: ['userType'],
      _count: { userType: true }
    });
    
    console.log('👥 User Statistics:');
    for (const stat of userStats) {
      console.log(`  ${stat.userType}: ${stat._count.userType}`);
    }
    
    const totalUsers = await prisma.user.count();
    console.log(`  Total Users: ${totalUsers}\n`);
    
    // Check vehicle distribution
    const vehicleStats = await prisma.vehicle.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    console.log('🚗 Vehicle Statistics:');
    for (const stat of vehicleStats) {
      console.log(`  ${stat.status}: ${stat._count.status}`);
    }
    
    const totalVehicles = await prisma.vehicle.count();
    console.log(`  Total Vehicles: ${totalVehicles}\n`);
    
    // Check media distribution
    const mediaStats = await prisma.media.groupBy({
      by: ['type'],
      _count: { type: true }
    });
    
    console.log('📸 Media Statistics:');
    for (const stat of mediaStats) {
      console.log(`  ${stat.type}: ${stat._count.type}`);
    }
    
    const totalMedia = await prisma.media.count();
    console.log(`  Total Media: ${totalMedia}\n`);
    
    // Check vehicles with media
    const vehiclesWithMedia = await prisma.vehicle.count({
      where: {
        media: {
          some: {}
        }
      }
    });
    
    console.log('📊 Data Relationships:');
    console.log(`  Vehicles with Media: ${vehiclesWithMedia}/${totalVehicles}`);
    
    // Check source tracking
    const sourceStats = await prisma.vehicleSource.groupBy({
      by: ['sourceType'],
      _count: { sourceType: true }
    });
    
    console.log('\n📋 Source Tracking:');
    for (const stat of sourceStats) {
      console.log(`  ${stat.sourceType}: ${stat._count.sourceType}`);
    }
    
    const totalSources = await prisma.vehicleSource.count();
    console.log(`  Total Source Records: ${totalSources}\n`);
    
    // Check collections
    const collectionCount = await prisma.collection.count();
    const vehicleCollections = await prisma.vehicleCollection.count();
    
    console.log('🏷️ Collections:');
    console.log(`  Total Collections: ${collectionCount}`);
    console.log(`  Vehicle-Collection Links: ${vehicleCollections}\n`);
    
    // Check steering types
    const steeringCount = await prisma.steeringType.count();
    console.log('🔧 Reference Data:');
    console.log(`  Steering Types: ${steeringCount}\n`);
    
    // Sample data check
    console.log('🔍 Sample Data:');
    
    const sampleVehicle = await prisma.vehicle.findFirst({
      include: {
        owner: true,
        media: true,
        steering: true,
        collections: {
          include: { collection: true }
        }
      }
    });
    
    if (sampleVehicle) {
      console.log(`  Sample Vehicle: ${sampleVehicle.name}`);
      console.log(`  Owner: ${sampleVehicle.owner?.firstName} ${sampleVehicle.owner?.lastName}`);
      console.log(`  Media Count: ${sampleVehicle.media.length}`);
      console.log(`  Steering: ${sampleVehicle.steering?.name || 'Not set'}`);
      console.log(`  Collections: ${sampleVehicle.collections.map(c => c.collection.name).join(', ') || 'None'}`);
    }
    
    console.log('\n✅ Migration verification completed successfully!');
    console.log('\n🌐 View your data at: http://localhost:5555 (Prisma Studio)');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
