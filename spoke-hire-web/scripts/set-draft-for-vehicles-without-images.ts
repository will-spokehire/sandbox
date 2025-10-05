#!/usr/bin/env tsx

/**
 * Set Draft Status for Vehicles Without READY Images
 * Sets status to DRAFT for vehicles that don't have any images with status: READY
 * This ensures only vehicles with properly uploaded and processed images are published
 */

import { PrismaClient, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface SetDraftStats {
  totalVehicles: number;
  vehiclesWithoutReadyImages: number;
  vehiclesAlreadyDraft: number;
  vehiclesUpdated: number;
  errors: string[];
}

/**
 * Get vehicles without any READY images
 */
async function getVehiclesWithoutReadyImages(): Promise<Array<{ 
  id: string; 
  name: string; 
  status: VehicleStatus;
  totalImages: number;
  readyImages: number;
}>> {
  console.log('🔍 Finding vehicles without READY images...\n');
  
  // Get all vehicles with their media
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      media: {
        where: {
          type: 'IMAGE'
        },
        select: {
          id: true,
          status: true
        }
      }
    }
  });
  
  // Filter vehicles that don't have any READY images
  const vehiclesWithoutReadyImages = vehicles
    .map(v => {
      const totalImages = v.media.length;
      const readyImages = v.media.filter(m => m.status === 'READY').length;
      
      return {
        id: v.id,
        name: v.name,
        status: v.status,
        totalImages,
        readyImages
      };
    })
    .filter(v => v.readyImages === 0); // No READY images
  
  return vehiclesWithoutReadyImages;
}

/**
 * Set vehicle status to DRAFT
 */
async function setVehicleStatusToDraft(vehicleId: string, vehicleName: string, currentStatus: VehicleStatus): Promise<boolean> {
  try {
    await prisma.vehicle.update({
      where: {
        id: vehicleId
      },
      data: {
        status: VehicleStatus.DRAFT
      }
    });
    
    console.log(`✅ Set to DRAFT: ${vehicleName} (was ${currentStatus})`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error updating vehicle ${vehicleName}: ${error}`);
    return false;
  }
}

/**
 * Set draft status for vehicles without READY images
 */
async function setDraftForVehiclesWithoutReadyImages(): Promise<SetDraftStats> {
  console.log('🚀 Starting set draft status script...\n');
  console.log('📋 This script sets vehicles to DRAFT if they have no images with status: READY\n');
  
  const stats: SetDraftStats = {
    totalVehicles: 0,
    vehiclesWithoutReadyImages: 0,
    vehiclesAlreadyDraft: 0,
    vehiclesUpdated: 0,
    errors: []
  };
  
  try {
    // Get total vehicle count
    stats.totalVehicles = await prisma.vehicle.count();
    console.log(`📊 Total vehicles: ${stats.totalVehicles}\n`);
    
    // Get vehicles without READY images
    const vehiclesWithoutReadyImages = await getVehiclesWithoutReadyImages();
    stats.vehiclesWithoutReadyImages = vehiclesWithoutReadyImages.length;
    
    if (vehiclesWithoutReadyImages.length === 0) {
      console.log('✅ All vehicles have at least one READY image!');
      return stats;
    }
    
    console.log(`📸 Found ${vehiclesWithoutReadyImages.length} vehicles without READY images\n`);
    
    // Show breakdown
    console.log('Breakdown:');
    vehiclesWithoutReadyImages.forEach(v => {
      console.log(`  - ${v.name}: ${v.totalImages} total images, ${v.readyImages} READY (Status: ${v.status})`);
    });
    console.log('');
    
    // Separate already-draft from needs-update
    const needsUpdate = vehiclesWithoutReadyImages.filter(v => v.status !== VehicleStatus.DRAFT);
    stats.vehiclesAlreadyDraft = vehiclesWithoutReadyImages.length - needsUpdate.length;
    
    if (stats.vehiclesAlreadyDraft > 0) {
      console.log(`ℹ️  ${stats.vehiclesAlreadyDraft} vehicle(s) already in DRAFT status\n`);
    }
    
    if (needsUpdate.length === 0) {
      console.log('✅ All vehicles without READY images are already in DRAFT status!');
      return stats;
    }
    
    console.log(`🔄 Setting ${needsUpdate.length} vehicle(s) to DRAFT status...\n`);
    
    // Set status to DRAFT for each vehicle
    for (const vehicle of needsUpdate) {
      const success = await setVehicleStatusToDraft(vehicle.id, vehicle.name, vehicle.status);
      if (success) {
        stats.vehiclesUpdated++;
      }
    }
    
    console.log(`\n✅ Successfully set ${stats.vehiclesUpdated} vehicles to DRAFT status`);
    
  } catch (error) {
    const errorMsg = `Error setting draft status: ${error}`;
    console.error(`❌ ${errorMsg}`);
    stats.errors.push(errorMsg);
  }
  
  return stats;
}

/**
 * Get final statistics
 */
async function getFinalStatistics(): Promise<void> {
  console.log('\n📊 Final Statistics:');
  
  const totalVehicles = await prisma.vehicle.count();
  
  // Count vehicles without images
  const vehiclesWithoutImages = await prisma.vehicle.count({
    where: {
      media: {
        none: {
          type: 'IMAGE'
        }
      }
    }
  });
  
  // Count vehicles without images that are DRAFT
  const vehiclesWithoutImagesDraft = await prisma.vehicle.count({
    where: {
      status: VehicleStatus.DRAFT,
      media: {
        none: {
          type: 'IMAGE'
        }
      }
    }
  });
  
  // Count vehicles without images that are NOT DRAFT
  const vehiclesWithoutImagesNotDraft = vehiclesWithoutImages - vehiclesWithoutImagesDraft;
  
  // Status breakdown for all vehicles
  const draftCount = await prisma.vehicle.count({ where: { status: VehicleStatus.DRAFT } });
  const publishedCount = await prisma.vehicle.count({ where: { status: VehicleStatus.PUBLISHED } });
  const declinedCount = await prisma.vehicle.count({ where: { status: VehicleStatus.DECLINED } });
  const archivedCount = await prisma.vehicle.count({ where: { status: VehicleStatus.ARCHIVED } });
  
  console.log(`  Total Vehicles: ${totalVehicles}`);
  console.log(`  Vehicles Without Images: ${vehiclesWithoutImages}`);
  console.log(`    ├─ DRAFT: ${vehiclesWithoutImagesDraft}`);
  console.log(`    └─ Other Status: ${vehiclesWithoutImagesNotDraft}`);
  console.log(`\n  Status Breakdown (All Vehicles):`);
  console.log(`    ├─ DRAFT: ${draftCount}`);
  console.log(`    ├─ PUBLISHED: ${publishedCount}`);
  console.log(`    ├─ DECLINED: ${declinedCount}`);
  console.log(`    └─ ARCHIVED: ${archivedCount}`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Set draft status for vehicles without READY images
    const stats = await setDraftForVehiclesWithoutReadyImages();
    
    // Final statistics
    await getFinalStatistics();
    
    console.log('\n✅ Set draft status completed!');
    console.log('\n📊 Summary:');
    console.log(`  Total Vehicles: ${stats.totalVehicles}`);
    console.log(`  Vehicles Without READY Images: ${stats.vehiclesWithoutReadyImages}`);
    console.log(`  Already in DRAFT: ${stats.vehiclesAlreadyDraft}`);
    console.log(`  Updated to DRAFT: ${stats.vehiclesUpdated}`);
    console.log(`  Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
  } catch (error) {
    console.error('\n❌ Set draft status failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

