#!/usr/bin/env tsx

/**
 * Fix Vehicle Images Script
 * Combined script that:
 * 1. Sets isPrimary for vehicles without a primary image
 * 2. Sets status to DRAFT for vehicles without any images
 */

import { PrismaClient, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface FixImagesStats {
  totalVehicles: number;
  primaryImagesSet: number;
  vehiclesSetToDraft: number;
  errors: string[];
}

/**
 * Set primary images for vehicles without one
 */
async function setPrimaryImages(): Promise<number> {
  console.log('📸 Step 1: Setting primary images...\n');
  
  let updated = 0;
  
  // Get all vehicles
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      name: true,
      media: {
        where: {
          type: 'IMAGE',
          status: 'READY',
          isVisible: true
        },
        select: {
          id: true,
          isPrimary: true,
          order: true,
          filename: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    }
  });
  
  // Filter vehicles that don't have a primary image
  const vehiclesWithoutPrimary = vehicles.filter(v => {
    const hasImages = v.media.length > 0;
    const hasPrimary = v.media.some(m => m.isPrimary);
    return hasImages && !hasPrimary;
  });
  
  if (vehiclesWithoutPrimary.length === 0) {
    console.log('  ✅ All vehicles with images already have a primary image\n');
    return 0;
  }
  
  console.log(`  Found ${vehiclesWithoutPrimary.length} vehicles without primary images`);
  
  for (const vehicle of vehiclesWithoutPrimary) {
    const firstImage = vehicle.media[0];
    if (firstImage) {
      await prisma.media.update({
        where: { id: firstImage.id },
        data: { isPrimary: true }
      });
      console.log(`  ✅ ${vehicle.name}: Set ${firstImage.filename} as primary`);
      updated++;
    }
  }
  
  console.log(`\n  ✅ Set primary images for ${updated} vehicles\n`);
  return updated;
}

/**
 * Set draft status for vehicles without images
 */
async function setDraftForVehiclesWithoutImages(): Promise<number> {
  console.log('📝 Step 2: Setting DRAFT status for vehicles without images...\n');
  
  let updated = 0;
  
  // Get vehicles without images
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      media: {
        where: { type: 'IMAGE' },
        select: { id: true }
      }
    }
  });
  
  const vehiclesWithoutImages = vehicles.filter(v => v.media.length === 0);
  
  if (vehiclesWithoutImages.length === 0) {
    console.log('  ✅ All vehicles have at least one image\n');
    return 0;
  }
  
  const needsUpdate = vehiclesWithoutImages.filter(v => v.status !== VehicleStatus.DRAFT);
  
  if (needsUpdate.length === 0) {
    console.log(`  ℹ️  Found ${vehiclesWithoutImages.length} vehicles without images`);
    console.log('  ✅ All are already in DRAFT status\n');
    return 0;
  }
  
  console.log(`  Found ${vehiclesWithoutImages.length} vehicles without images`);
  console.log(`  ${vehiclesWithoutImages.length - needsUpdate.length} already DRAFT, ${needsUpdate.length} to update`);
  
  for (const vehicle of needsUpdate) {
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: VehicleStatus.DRAFT }
    });
    console.log(`  ✅ ${vehicle.name}: ${vehicle.status} → DRAFT`);
    updated++;
  }
  
  console.log(`\n  ✅ Set ${updated} vehicles to DRAFT status\n`);
  return updated;
}

/**
 * Get final statistics
 */
async function getFinalStatistics(): Promise<void> {
  console.log('📊 Final Statistics:\n');
  
  const totalVehicles = await prisma.vehicle.count();
  
  // Vehicles with images
  const vehiclesWithImages = await prisma.vehicle.count({
    where: {
      media: {
        some: { type: 'IMAGE', status: 'READY', isVisible: true }
      }
    }
  });
  
  // Vehicles with primary images
  const vehiclesWithPrimary = await prisma.vehicle.count({
    where: {
      media: {
        some: { type: 'IMAGE', status: 'READY', isVisible: true, isPrimary: true }
      }
    }
  });
  
  // Vehicles without images
  const vehiclesWithoutImages = await prisma.vehicle.count({
    where: {
      media: { none: { type: 'IMAGE' } }
    }
  });
  
  // Vehicles without images in DRAFT
  const vehiclesWithoutImagesDraft = await prisma.vehicle.count({
    where: {
      status: VehicleStatus.DRAFT,
      media: { none: { type: 'IMAGE' } }
    }
  });
  
  // Status breakdown
  const draftCount = await prisma.vehicle.count({ where: { status: VehicleStatus.DRAFT } });
  const publishedCount = await prisma.vehicle.count({ where: { status: VehicleStatus.PUBLISHED } });
  const declinedCount = await prisma.vehicle.count({ where: { status: VehicleStatus.DECLINED } });
  const archivedCount = await prisma.vehicle.count({ where: { status: VehicleStatus.ARCHIVED } });
  
  console.log(`  Total Vehicles: ${totalVehicles}`);
  console.log(`  Vehicles with Images: ${vehiclesWithImages}`);
  console.log(`    └─ With Primary Image: ${vehiclesWithPrimary}`);
  console.log(`  Vehicles without Images: ${vehiclesWithoutImages}`);
  console.log(`    └─ In DRAFT status: ${vehiclesWithoutImagesDraft}`);
  console.log(`\n  Status Distribution:`);
  console.log(`    ├─ DRAFT: ${draftCount}`);
  console.log(`    ├─ PUBLISHED: ${publishedCount}`);
  console.log(`    ├─ DECLINED: ${declinedCount}`);
  console.log(`    └─ ARCHIVED: ${archivedCount}`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🚀 Fix Vehicle Images Script\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    const stats: FixImagesStats = {
      totalVehicles: await prisma.vehicle.count(),
      primaryImagesSet: 0,
      vehiclesSetToDraft: 0,
      errors: []
    };
    
    console.log(`Total vehicles: ${stats.totalVehicles}\n`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Step 1: Set primary images
    try {
      stats.primaryImagesSet = await setPrimaryImages();
    } catch (error) {
      const errorMsg = `Error setting primary images: ${error}`;
      console.error(`❌ ${errorMsg}\n`);
      stats.errors.push(errorMsg);
    }
    
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Step 2: Set draft status
    try {
      stats.vehiclesSetToDraft = await setDraftForVehiclesWithoutImages();
    } catch (error) {
      const errorMsg = `Error setting draft status: ${error}`;
      console.error(`❌ ${errorMsg}\n`);
      stats.errors.push(errorMsg);
    }
    
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Final statistics
    await getFinalStatistics();
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('✅ Fix Vehicle Images Completed!\n');
    console.log('Summary:');
    console.log(`  Primary Images Set: ${stats.primaryImagesSet}`);
    console.log(`  Vehicles Set to DRAFT: ${stats.vehiclesSetToDraft}`);
    console.log(`  Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Fix vehicle images failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

