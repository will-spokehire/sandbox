#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCollections() {
  console.log('🔍 Checking Collections and Vehicle-Collection Relationships...\n');

  try {
    // Check all collections
    const collections = await prisma.collection.findMany();
    console.log('📋 All Collections:');
    collections.forEach(c => {
      console.log(`  - ${c.name} (${c.slug}) - ID: ${c.id}`);
    });
    console.log(`Total Collections: ${collections.length}\n`);

    // Check vehicle-collection links
    const vehicleCollections = await prisma.vehicleCollection.findMany({
      include: {
        vehicle: { select: { name: true } },
        collection: { select: { name: true } }
      }
    });
    
    console.log('🔗 Vehicle-Collection Links:');
    if (vehicleCollections.length === 0) {
      console.log('  ❌ No vehicle-collection relationships found!');
    } else {
      vehicleCollections.forEach(vc => {
        console.log(`  - ${vc.vehicle.name} → ${vc.collection.name}`);
      });
    }
    console.log(`Total Vehicle-Collection Links: ${vehicleCollections.length}\n`);

    // Check vehicles from catalog source (should have collections)
    const catalogVehicles = await prisma.vehicle.findMany({
      where: {
        sources: {
          some: {
            sourceType: 'catalog'
          }
        }
      },
      include: {
        sources: {
          where: {
            sourceType: 'catalog'
          }
        },
        collections: {
          include: {
            collection: true
          }
        }
      },
      take: 10
    });

    console.log('📦 Sample Catalog Vehicles (should have collections):');
    catalogVehicles.forEach(v => {
      console.log(`  - ${v.name}`);
      console.log(`    Collections: ${v.collections.length > 0 ? v.collections.map(c => c.collection.name).join(', ') : 'None'}`);
      
      // Check raw data for collection field
      const catalogSource = v.sources.find(s => s.sourceType === 'catalog');
      if (catalogSource?.rawData && typeof catalogSource.rawData === 'object') {
        const rawData = catalogSource.rawData as any;
        console.log(`    Raw collection data: ${rawData.collection || 'None'}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCollections();
