#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSources() {
  console.log('🔍 Checking Vehicle Sources...\n');

  try {
    // Check vehicles by source type
    const sourceStats = await prisma.vehicleSource.groupBy({
      by: ['sourceType'],
      _count: {
        sourceType: true
      }
    });

    console.log('📊 Vehicles by Source Type:');
    sourceStats.forEach(stat => {
      console.log(`  - ${stat.sourceType}: ${stat._count.sourceType} vehicles`);
    });

    // Check if any catalog vehicles exist
    const catalogVehicles = await prisma.vehicle.findMany({
      where: {
        sources: {
          some: {
            sourceType: 'catalog'
          }
        }
      },
      take: 5,
      include: {
        sources: {
          where: {
            sourceType: 'catalog'
          }
        }
      }
    });

    console.log(`\n📦 Catalog Vehicles Found: ${catalogVehicles.length}`);
    if (catalogVehicles.length > 0) {
      console.log('Sample catalog vehicles:');
      catalogVehicles.forEach(v => {
        console.log(`  - ${v.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSources();
