#!/usr/bin/env tsx

/**
 * Set Primary Images Script
 * Sets isPrimary to true for the first image of each vehicle that doesn't have a primary image
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SetPrimaryStats {
  totalVehicles: number;
  vehiclesWithoutPrimary: number;
  vehiclesUpdated: number;
  vehiclesSkipped: number;
  errors: string[];
}

/**
 * Get vehicles without a primary image
 */
async function getVehiclesWithoutPrimaryImage(): Promise<Array<{ id: string; name: string; mediaCount: number }>> {
  console.log('🔍 Finding vehicles without primary images...\n');
  
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
  const vehiclesWithoutPrimary = vehicles
    .filter(v => {
      const hasImages = v.media.length > 0;
      const hasPrimary = v.media.some(m => m.isPrimary);
      return hasImages && !hasPrimary;
    })
    .map(v => ({
      id: v.id,
      name: v.name,
      mediaCount: v.media.length
    }));
  
  return vehiclesWithoutPrimary;
}

/**
 * Set primary image for a vehicle
 */
async function setPrimaryImageForVehicle(vehicleId: string, vehicleName: string): Promise<boolean> {
  try {
    // Get the first image (ordered by order field) for this vehicle
    const firstImage = await prisma.media.findFirst({
      where: {
        vehicleId,
        type: 'IMAGE',
        status: 'READY',
        isVisible: true
      },
      orderBy: {
        order: 'asc'
      }
    });
    
    if (!firstImage) {
      console.log(`⚠️  No images found for vehicle: ${vehicleName} (${vehicleId})`);
      return false;
    }
    
    // Update the first image to be primary
    await prisma.media.update({
      where: {
        id: firstImage.id
      },
      data: {
        isPrimary: true
      }
    });
    
    console.log(`✅ Set primary image for vehicle: ${vehicleName} (${firstImage.filename})`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error setting primary image for vehicle ${vehicleName}: ${error}`);
    return false;
  }
}

/**
 * Set primary images for all vehicles without one
 */
async function setPrimaryImages(): Promise<SetPrimaryStats> {
  console.log('🚀 Starting set primary images script...\n');
  
  const stats: SetPrimaryStats = {
    totalVehicles: 0,
    vehiclesWithoutPrimary: 0,
    vehiclesUpdated: 0,
    vehiclesSkipped: 0,
    errors: []
  };
  
  try {
    // Get total vehicle count
    stats.totalVehicles = await prisma.vehicle.count();
    console.log(`📊 Total vehicles: ${stats.totalVehicles}\n`);
    
    // Get vehicles without primary image
    const vehiclesWithoutPrimary = await getVehiclesWithoutPrimaryImage();
    stats.vehiclesWithoutPrimary = vehiclesWithoutPrimary.length;
    
    if (vehiclesWithoutPrimary.length === 0) {
      console.log('✅ All vehicles with images already have a primary image!');
      return stats;
    }
    
    console.log(`📸 Found ${vehiclesWithoutPrimary.length} vehicles without primary images\n`);
    console.log('🔄 Setting primary images...\n');
    
    // Set primary image for each vehicle
    for (const vehicle of vehiclesWithoutPrimary) {
      const success = await setPrimaryImageForVehicle(vehicle.id, vehicle.name);
      if (success) {
        stats.vehiclesUpdated++;
      } else {
        stats.vehiclesSkipped++;
      }
    }
    
    console.log(`\n✅ Successfully set primary images for ${stats.vehiclesUpdated} vehicles`);
    if (stats.vehiclesSkipped > 0) {
      console.log(`⚠️  Skipped ${stats.vehiclesSkipped} vehicles`);
    }
    
  } catch (error) {
    const errorMsg = `Error setting primary images: ${error}`;
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
  
  // Count vehicles with images
  const vehiclesWithImages = await prisma.vehicle.count({
    where: {
      media: {
        some: {
          type: 'IMAGE',
          status: 'READY',
          isVisible: true
        }
      }
    }
  });
  
  // Count vehicles with primary images
  const vehiclesWithPrimary = await prisma.vehicle.count({
    where: {
      media: {
        some: {
          type: 'IMAGE',
          status: 'READY',
          isVisible: true,
          isPrimary: true
        }
      }
    }
  });
  
  // Count vehicles without primary images but with images
  const vehiclesWithoutPrimary = vehiclesWithImages - vehiclesWithPrimary;
  
  console.log(`  Total Vehicles: ${totalVehicles}`);
  console.log(`  Vehicles with Images: ${vehiclesWithImages}`);
  console.log(`  Vehicles with Primary Image: ${vehiclesWithPrimary}`);
  console.log(`  Vehicles without Primary Image: ${vehiclesWithoutPrimary}`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Set primary images
    const stats = await setPrimaryImages();
    
    // Final statistics
    await getFinalStatistics();
    
    console.log('\n✅ Set primary images completed!');
    console.log('\n📊 Summary:');
    console.log(`  Total Vehicles: ${stats.totalVehicles}`);
    console.log(`  Vehicles Without Primary: ${stats.vehiclesWithoutPrimary}`);
    console.log(`  Vehicles Updated: ${stats.vehiclesUpdated}`);
    console.log(`  Vehicles Skipped: ${stats.vehiclesSkipped}`);
    console.log(`  Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
  } catch (error) {
    console.error('\n❌ Set primary images failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

