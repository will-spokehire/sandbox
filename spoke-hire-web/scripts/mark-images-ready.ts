#!/usr/bin/env tsx

/**
 * Mark Images as Ready Script
 * Marks all PROCESSING images as READY (after they've been processed/resized/optimized)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MarkReadyStats {
  totalProcessing: number;
  markedReady: number;
  errors: string[];
}

/**
 * Mark all PROCESSING images as READY
 */
async function markImagesAsReady(): Promise<MarkReadyStats> {
  console.log('🚀 Starting mark images as ready script...\n');
  
  const stats: MarkReadyStats = {
    totalProcessing: 0,
    markedReady: 0,
    errors: []
  };
  
  try {
    // Get all media records with PROCESSING status
    const processingMedia = await prisma.media.findMany({
      where: {
        type: 'IMAGE',
        status: 'PROCESSING'
      },
      select: {
        id: true,
        filename: true,
        originalUrl: true
      }
    });
    
    stats.totalProcessing = processingMedia.length;
    
    if (processingMedia.length === 0) {
      console.log('✅ No images with PROCESSING status found!');
      return stats;
    }
    
    console.log(`📸 Found ${processingMedia.length} images with PROCESSING status`);
    console.log('🔄 Marking all as READY...\n');
    
    // Update all PROCESSING images to READY
    const updateResult = await prisma.media.updateMany({
      where: {
        type: 'IMAGE',
        status: 'PROCESSING'
      },
      data: {
        status: 'READY'
      }
    });
    
    stats.markedReady = updateResult.count;
    
    console.log(`✅ Successfully marked ${stats.markedReady} images as READY`);
    
  } catch (error) {
    const errorMsg = `Error marking images as ready: ${error}`;
    console.error(`❌ ${errorMsg}`);
    stats.errors.push(errorMsg);
  }
  
  return stats;
}

/**
 * Get final statistics
 */
async function getFinalStatistics(): Promise<void> {
  console.log('\n📊 Final Media Statistics:');
  
  const totalMedia = await prisma.media.count();
  const readyMedia = await prisma.media.count({ where: { status: 'READY' } });
  const processingMedia = await prisma.media.count({ where: { status: 'PROCESSING' } });
  const uploadingMedia = await prisma.media.count({ where: { status: 'UPLOADING' } });
  const failedMedia = await prisma.media.count({ where: { status: 'FAILED' } });
  
  console.log(`  Total Media: ${totalMedia}`);
  console.log(`  Ready: ${readyMedia}`);
  console.log(`  Processing: ${processingMedia}`);
  console.log(`  Uploading: ${uploadingMedia}`);
  console.log(`  Failed: ${failedMedia}`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting mark images as ready script...\n');
  
  try {
    // Mark images as ready
    const stats = await markImagesAsReady();
    
    // Final statistics
    await getFinalStatistics();
    
    console.log('\n✅ Mark images as ready completed!');
    console.log('\n📊 Summary:');
    console.log(`  Total Processing Images: ${stats.totalProcessing}`);
    console.log(`  Marked as Ready: ${stats.markedReady}`);
    console.log(`  Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
  } catch (error) {
    console.error('\n❌ Mark images as ready failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
