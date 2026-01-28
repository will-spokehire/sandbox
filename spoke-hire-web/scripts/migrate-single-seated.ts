#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script for Issue #92: Single-Seater Value Missing
 * 
 * This script:
 * 1. Adds "Single Seated" steering type to the database
 * 2. Updates existing motorbike/scooter vehicles to use this steering type
 */
async function migrateSingleSeated() {
  console.log('🔄 Migrating Single Seated steering type...\n');

  try {
    // Step 1: Create the "Single Seated" steering type
    console.log('1️⃣  Creating "Single Seated" steering type...');
    
    const singleSeatedSteering = await prisma.steeringType.upsert({
      where: { code: 'SS' },
      update: {
        name: 'Single Seated',
        description: 'Motorbikes and scooters without a steering wheel',
      },
      create: {
        name: 'Single Seated',
        code: 'SS',
        description: 'Motorbikes and scooters without a steering wheel',
      },
    });
    
    console.log(`   ✅ Created/updated steering type: ${singleSeatedSteering.name} (${singleSeatedSteering.code})`);
    console.log(`   ID: ${singleSeatedSteering.id}\n`);

    // Step 2: Find vehicles in the "Motorbikes" collection that don't have steering set
    console.log('2️⃣  Finding vehicles in Motorbikes collection...');
    
    const motorbikesCollection = await prisma.collection.findFirst({
      where: {
        OR: [
          { slug: 'motorbikes' },
          { name: { contains: 'Motorbike', mode: 'insensitive' } },
        ],
      },
    });

    if (!motorbikesCollection) {
      console.log('   ⚠️  Motorbikes collection not found. Skipping collection-based update.\n');
    } else {
      console.log(`   Found collection: ${motorbikesCollection.name} (${motorbikesCollection.slug})\n`);
      
      // Find vehicles in this collection without steering or with null steering
      const vehiclesInMotorbikes = await prisma.vehicle.findMany({
        where: {
          collections: {
            some: {
              collectionId: motorbikesCollection.id,
            },
          },
          steeringId: null,
        },
        select: {
          id: true,
          name: true,
          steeringId: true,
        },
      });

      console.log(`   Found ${vehiclesInMotorbikes.length} vehicles without steering in Motorbikes collection`);

      if (vehiclesInMotorbikes.length > 0) {
        console.log('   Updating vehicles...\n');
        
        let updated = 0;
        for (const vehicle of vehiclesInMotorbikes) {
          await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { steeringId: singleSeatedSteering.id },
          });
          updated++;
          console.log(`   ✅ Updated: ${vehicle.name}`);
        }
        
        console.log(`\n   Updated ${updated} vehicles to use "Single Seated" steering\n`);
      }
    }

    // Step 3: Also check for vehicles that may have "Single-Seater" in their source data
    console.log('3️⃣  Checking for vehicles with "Single-Seater" in source data...');
    
    const vehiclesWithSourceData = await prisma.vehicle.findMany({
      where: {
        steeringId: null,
      },
      include: {
        sources: {
          where: {
            sourceType: 'processed_catalog',
          },
        },
      },
    });

    let updatedFromSource = 0;
    for (const vehicle of vehiclesWithSourceData) {
      const catalogSource = vehicle.sources.find(s => s.sourceType === 'processed_catalog');
      
      if (!catalogSource?.rawData || typeof catalogSource.rawData !== 'object') {
        continue;
      }

      const rawData = catalogSource.rawData as Record<string, unknown>;
      
      // Check various possible locations for steering data
      let steeringValue: string | undefined;
      
      // Try originalRecord.vehicle.steering
      const originalRecord = rawData.originalRecord as Record<string, unknown> | undefined;
      if (originalRecord) {
        const vehicleData = originalRecord.vehicle as Record<string, unknown> | undefined;
        if (vehicleData?.steering && typeof vehicleData.steering === 'string') {
          steeringValue = vehicleData.steering;
        }
        
        // Also try catalogData.steering
        const catalogData = originalRecord.catalogData as Record<string, unknown> | undefined;
        if (!steeringValue && catalogData?.steering && typeof catalogData.steering === 'string') {
          steeringValue = catalogData.steering;
        }
      }
      
      // Check if it's a single-seater type
      if (steeringValue) {
        const steeringLower = steeringValue.toLowerCase();
        if (steeringLower.includes('single') || steeringLower.includes('bike') || steeringLower.includes('scooter')) {
          await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { steeringId: singleSeatedSteering.id },
          });
          updatedFromSource++;
          console.log(`   ✅ Updated from source data: ${vehicle.name} (was: "${steeringValue}")`);
        }
      }
    }

    console.log(`\n   Updated ${updatedFromSource} vehicles from source data\n`);

    // Step 4: Show final statistics
    console.log('4️⃣  Final Statistics:');
    
    const steeringStats = await prisma.steeringType.findMany({
      include: {
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log('   Steering Type Distribution:');
    for (const st of steeringStats) {
      console.log(`   ${st.name.padEnd(20)} (${st.code}): ${st._count.vehicles} vehicles`);
    }

    // Count vehicles without steering
    const noSteeringCount = await prisma.vehicle.count({
      where: { steeringId: null },
    });
    console.log(`   ${'No Steering'.padEnd(20)}     : ${noSteeringCount} vehicles`);

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateSingleSeated();
