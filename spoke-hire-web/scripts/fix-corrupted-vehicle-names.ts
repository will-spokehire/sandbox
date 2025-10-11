#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FixStats {
  vehiclesChecked: number;
  vehiclesFixed: number;
  modelsFixed: number;
  errors: string[];
}

/**
 * Fix vehicles that have URLs in their name or model fields
 */
async function fixCorruptedVehicleNames() {
  console.log('🔧 Fixing corrupted vehicle names...\n');

  const stats: FixStats = {
    vehiclesChecked: 0,
    vehiclesFixed: 0,
    modelsFixed: 0,
    errors: []
  };

  try {
    // Find all vehicles
    const vehicles = await prisma.vehicle.findMany({
      select: {
        id: true,
        name: true,
        make: {
          select: {
            id: true,
            name: true
          }
        },
        model: {
          select: {
            id: true,
            name: true
          }
        },
        sources: {
          select: {
            sourceType: true,
            sourceId: true,
            rawData: true
          }
        }
      }
    });

    console.log(`Found ${vehicles.length} vehicles to check\n`);

    for (const vehicle of vehicles) {
      stats.vehiclesChecked++;

      // Check if name or model contains URLs
      const hasUrlInName = vehicle.name.includes('http://') || 
                          vehicle.name.includes('https://') || 
                          vehicle.name.includes('.jpg') || 
                          vehicle.name.includes('.jpeg') ||
                          vehicle.name.includes('.png');

      const hasUrlInModel = vehicle.model.name.includes('http://') || 
                           vehicle.model.name.includes('https://') || 
                           vehicle.model.name.includes('.jpg') || 
                           vehicle.model.name.includes('.jpeg') ||
                           vehicle.model.name.includes('.png');

      if (!hasUrlInName && !hasUrlInModel) {
        continue;
      }

      console.log(`\n🚨 Found corrupted vehicle: ${vehicle.id}`);
      console.log(`   Current name: ${vehicle.name.substring(0, 100)}...`);
      console.log(`   Current model: ${vehicle.model.name.substring(0, 100)}...`);
      console.log(`   Make: ${vehicle.make.name}`);

      // Try to fix the vehicle name and model
      let newName = vehicle.name;
      let newModelName: string | null = null;
      let shouldFixModel = false;

      // Extract the make from the corrupted name (usually the first word before URLs)
      if (hasUrlInName) {
        const parts = vehicle.name.split(/\s+https?:/);
        if (parts.length > 0 && parts[0].trim()) {
          newName = parts[0].trim();
          console.log(`   Extracted clean name: ${newName}`);
        }
      }

      // Try to get the correct model name from catalog source data
      const catalogSource = vehicle.sources.find(s => s.sourceType === 'catalog');
      if (catalogSource && catalogSource.rawData) {
        const rawData = catalogSource.rawData as any;
        // The catalog usually has the full name like "Porsche 928s4"
        if (rawData.name && typeof rawData.name === 'string' && !rawData.name.includes('http')) {
          const catalogName = rawData.name.trim();
          console.log(`   Found catalog name: ${catalogName}`);
          
          // Extract model from catalog name (everything after the make)
          const makePrefix = vehicle.make.name.toLowerCase();
          const catalogNameLower = catalogName.toLowerCase();
          
          if (catalogNameLower.startsWith(makePrefix)) {
            newModelName = catalogName.substring(vehicle.make.name.length).trim();
            if (newModelName) {
              shouldFixModel = true;
              console.log(`   Extracted model from catalog: ${newModelName}`);
            }
          } else {
            // Use the full catalog name as the model if we can't parse it
            newModelName = catalogName;
            shouldFixModel = true;
          }

          // Also update the vehicle name if it was corrupted
          if (hasUrlInName) {
            newName = catalogName;
            console.log(`   Using catalog name for vehicle: ${newName}`);
          }
        }
      }

      // If we still don't have a good model, try to construct one
      if (!newModelName || hasUrlInModel) {
        // Check if we have a cleansed source with better data
        const cleansedSource = vehicle.sources.find(s => s.sourceType === 'cleansed');
        if (cleansedSource && cleansedSource.rawData) {
          const rawData = cleansedSource.rawData as any;
          const cleansedModel = rawData.vehicle?.model || rawData.model;
          
          // Only use if it doesn't contain URLs
          if (cleansedModel && typeof cleansedModel === 'string' && 
              !cleansedModel.includes('http') && !cleansedModel.includes('.jpg')) {
            newModelName = cleansedModel;
            shouldFixModel = true;
            console.log(`   Found clean model from cleansed source: ${newModelName}`);
          }
        }
      }

      // If still no good model name, use "Unknown"
      if (!newModelName) {
        newModelName = 'Unknown';
        shouldFixModel = true;
        console.log(`   Using fallback model name: ${newModelName}`);
      }

      // Update the vehicle name
      if (hasUrlInName && newName !== vehicle.name) {
        try {
          await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { name: newName }
          });
          console.log(`   ✅ Updated vehicle name to: ${newName}`);
          stats.vehiclesFixed++;
        } catch (error: any) {
          const errorMsg = `Failed to update vehicle ${vehicle.id} name: ${error.message}`;
          console.error(`   ❌ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      }

      // Update or create the model if needed
      if (shouldFixModel && newModelName) {
        try {
          // First check if a model with this name exists for this make
          let modelRecord = await prisma.model.findFirst({
            where: {
              name: newModelName,
              makeId: vehicle.make.id
            }
          });

          // If not, create it
          if (!modelRecord) {
            // Generate a slug from the model name
            const slug = newModelName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            
            modelRecord = await prisma.model.create({
              data: {
                name: newModelName,
                slug: slug,
                makeId: vehicle.make.id
              }
            });
            console.log(`   ✅ Created new model: ${newModelName} (slug: ${slug})`);
          }

          // Update the vehicle to use the correct model
          if (modelRecord.id !== vehicle.model.id) {
            await prisma.vehicle.update({
              where: { id: vehicle.id },
              data: { modelId: modelRecord.id }
            });
            console.log(`   ✅ Updated vehicle model to: ${newModelName}`);
            stats.modelsFixed++;
          }
        } catch (error: any) {
          const errorMsg = `Failed to update model for vehicle ${vehicle.id}: ${error.message}`;
          console.error(`   ❌ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Fix Summary');
    console.log('='.repeat(60));
    console.log(`Vehicles checked:       ${stats.vehiclesChecked}`);
    console.log(`Vehicle names fixed:    ${stats.vehiclesFixed}`);
    console.log(`Models fixed:           ${stats.modelsFixed}`);
    console.log(`Errors:                 ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n✅ Fix completed!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixCorruptedVehicleNames();

