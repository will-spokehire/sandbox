#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { parseCollections, generateCollectionSlug } from '../src/lib/migration/data-mappers.js';

const prisma = new PrismaClient();

/**
 * Update existing vehicles with their collection assignments
 * based on the collection field in their source data
 */
async function updateVehicleCollections() {
  console.log('🔄 Updating vehicle collections from source data...\n');

  try {
    // Get all vehicles with catalog source data
    const vehicles = await prisma.vehicle.findMany({
      include: {
        sources: {
          where: {
            sourceType: 'processed_catalog',
          },
        },
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    console.log(`Found ${vehicles.length} vehicles to process\n`);

    // Step 1: Extract and create all unique collections
    const collectionNames = new Set<string>();
    let vehiclesWithCollections = 0;
    let vehiclesWithoutSource = 0;
    let vehiclesWithEmptyCollection = 0;
    
    for (const vehicle of vehicles) {
      const catalogSource = vehicle.sources.find(s => s.sourceType === 'processed_catalog');
      
      if (!catalogSource) {
        vehiclesWithoutSource++;
        continue;
      }
      
      if (catalogSource?.rawData && typeof catalogSource.rawData === 'object') {
        const rawData = catalogSource.rawData as any;
        
        // Try to get collection from catalogData
        let collectionString: string | undefined;
        
        if (rawData.originalRecord?.catalogData?.collection) {
          collectionString = rawData.originalRecord.catalogData.collection;
        } else if (rawData.originalRecord?.vehicle?.collection) {
          collectionString = rawData.originalRecord.vehicle.collection;
        }
        
        if (collectionString && collectionString.trim() !== '') {
          const collections = parseCollections(collectionString);
          collections.forEach(name => collectionNames.add(name));
          vehiclesWithCollections++;
          if (vehiclesWithCollections <= 3) {
            console.log(`Example: ${vehicle.name} → "${collectionString}" → [${collections.join(', ')}]`);
          }
        } else {
          vehiclesWithEmptyCollection++;
        }
      }
    }
    
    console.log(`\nVehicles with sources: ${vehicles.length - vehiclesWithoutSource}`);
    console.log(`Vehicles with collections: ${vehiclesWithCollections}`);
    console.log(`Vehicles with empty collection: ${vehiclesWithEmptyCollection}`);
    console.log(`Vehicles without source: ${vehiclesWithoutSource}`);

    console.log(`📋 Found ${collectionNames.size} unique collections`);
    
    // Create/update collections
    const collectionMap: Record<string, string> = {};
    
    for (const name of collectionNames) {
      const slug = generateCollectionSlug(name);
      const created = await prisma.collection.upsert({
        where: { slug },
        update: { name },
        create: {
          name,
          slug,
          isActive: true,
        },
      });
      collectionMap[name] = created.id;
      console.log(`✅ Collection: ${name} (${slug})`);
    }

    console.log('');

    // Step 2: Update vehicle-collection relationships
    let updated = 0;
    let skipped = 0;
    let added = 0;

    for (const vehicle of vehicles) {
      const catalogSource = vehicle.sources.find(s => s.sourceType === 'processed_catalog');
      
      if (!catalogSource?.rawData || typeof catalogSource.rawData !== 'object') {
        skipped++;
        continue;
      }

      const rawData = catalogSource.rawData as any;
      
      // Try to get collection from catalogData
      let collectionString: string | undefined;
      
      if (rawData.originalRecord?.catalogData?.collection) {
        collectionString = rawData.originalRecord.catalogData.collection;
      } else if (rawData.originalRecord?.vehicle?.collection) {
        collectionString = rawData.originalRecord.vehicle.collection;
      }
      
      if (!collectionString) {
        skipped++;
        continue;
      }

      const collections = parseCollections(collectionString);
      
      if (collections.length === 0) {
        skipped++;
        continue;
      }

      // Get existing collection assignments
      const existingCollectionIds = vehicle.collections.map(c => c.collectionId);

      // Assign new collections
      for (const collectionName of collections) {
        const collectionId = collectionMap[collectionName];
        
        if (!collectionId) {
          console.warn(`⚠️ Collection "${collectionName}" not found in map`);
          continue;
        }

        // Skip if already assigned
        if (existingCollectionIds.includes(collectionId)) {
          continue;
        }

        try {
          await prisma.vehicleCollection.create({
            data: {
              vehicleId: vehicle.id,
              collectionId: collectionId,
            },
          });
          added++;
          console.log(`✅ ${vehicle.name} → ${collectionName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to assign "${collectionName}" to ${vehicle.name}: ${error}`);
        }
      }

      updated++;
    }

    console.log('\n📊 Update Summary:');
    console.log(`  Collections created/updated: ${collectionNames.size}`);
    console.log(`  Vehicles processed: ${updated}`);
    console.log(`  Vehicles skipped: ${skipped}`);
    console.log(`  Collection assignments added: ${added}`);

    // Show final statistics
    const finalStats = await prisma.collection.findMany({
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

    console.log('\n📋 Final Collection Statistics:');
    finalStats.forEach(c => {
      console.log(`  ${c.name.padEnd(20)} - ${c._count.vehicles} vehicles`);
    });

  } catch (error) {
    console.error('❌ Error updating vehicle collections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVehicleCollections();

