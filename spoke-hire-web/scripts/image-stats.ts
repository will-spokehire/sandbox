#!/usr/bin/env tsx

/**
 * Image Statistics Script
 * Shows quick statistics about images in /public/car-images vs database
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Get all image files in the car-images directory
 */
function getImageFiles(): string[] {
  const carImagesDir = path.join(process.cwd(), 'public', 'car-images');
  
  if (!fs.existsSync(carImagesDir)) {
    return [];
  }
  
  const files = fs.readdirSync(carImagesDir);
  
  // Filter for image files only
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'].includes(ext);
  });
  
  return imageFiles;
}

/**
 * Get media statistics from database
 */
async function getMediaStats(): Promise<{
  total: number;
  ready: number;
  processing: number;
  uploading: number;
  failed: number;
}> {
  const total = await prisma.media.count({ where: { type: 'IMAGE' } });
  const ready = await prisma.media.count({ where: { type: 'IMAGE', status: 'READY' } });
  const processing = await prisma.media.count({ where: { type: 'IMAGE', status: 'PROCESSING' } });
  const uploading = await prisma.media.count({ where: { type: 'IMAGE', status: 'UPLOADING' } });
  const failed = await prisma.media.count({ where: { type: 'IMAGE', status: 'FAILED' } });
  
  return { total, ready, processing, uploading, failed };
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('📊 Image Statistics\n');
  
  try {
    // Get file statistics
    const imageFiles = getImageFiles();
    const dbStats = await getMediaStats();
    
    // Calculate orphaned files
    const dbFilenames = await prisma.media.findMany({
      where: { type: 'IMAGE' },
      select: { filename: true }
    });
    
    const dbFilenameSet = new Set(dbFilenames.map(m => m.filename));
    const orphanedFiles = imageFiles.filter(filename => !dbFilenameSet.has(filename));
    
    // Display statistics
    console.log('📁 File System:');
    console.log(`  Total image files: ${imageFiles.length}`);
    console.log(`  Orphaned files: ${orphanedFiles.length}`);
    console.log(`  Files with DB records: ${imageFiles.length - orphanedFiles.length}`);
    
    console.log('\n🗄️ Database:');
    console.log(`  Total media records: ${dbStats.total}`);
    console.log(`  Ready: ${dbStats.ready}`);
    console.log(`  Processing: ${dbStats.processing}`);
    console.log(`  Uploading: ${dbStats.uploading}`);
    console.log(`  Failed: ${dbStats.failed}`);
    
    console.log('\n📈 Summary:');
    if (orphanedFiles.length > 0) {
      console.log(`  ⚠️ ${orphanedFiles.length} orphaned files need cleanup`);
      console.log(`  💡 Run: npm run cleanup-orphaned-images`);
    } else {
      console.log(`  ✅ No orphaned files found`);
    }
    
    if (dbStats.uploading > 0) {
      console.log(`  🔄 ${dbStats.uploading} images need downloading`);
      console.log(`  💡 Run: npm run download-images`);
    }
    
    if (dbStats.processing > 0) {
      console.log(`  📁 ${dbStats.processing} images ready for processing`);
      console.log(`  💡 Run: npm run mark-images-ready (after processing)`);
    }
    
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
