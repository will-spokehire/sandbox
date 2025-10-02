#!/usr/bin/env tsx

/**
 * Check Failed Images Script
 * Lists all images marked as FAILED and shows the reason (no extension, invalid URL, etc.)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FailedImageInfo {
  id: string;
  filename: string;
  originalUrl: string;
  reason: string;
}

/**
 * Check failed images and categorize them
 */
async function checkFailedImages(): Promise<void> {
  console.log('🔍 Checking failed images...\n');
  
  try {
    // Get all failed media records
    const failedMedia = await prisma.media.findMany({
      where: {
        type: 'IMAGE',
        status: 'FAILED'
      },
      select: {
        id: true,
        filename: true,
        originalUrl: true
      }
    });
    
    if (failedMedia.length === 0) {
      console.log('✅ No failed images found!');
      return;
    }
    
    console.log(`📊 Found ${failedMedia.length} failed images\n`);
    
    // Categorize failed images
    const failedImages: FailedImageInfo[] = failedMedia.map(media => {
      let reason = 'Unknown';
      
      // Check for invalid URL
      if (!media.originalUrl || !media.originalUrl.startsWith('http')) {
        reason = 'Invalid URL';
      }
      // Check for missing/invalid extension
      else if (!media.filename || !/\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/i.test(media.filename)) {
        reason = 'No valid image extension';
      }
      // Check for download issues (this would be determined by the download process)
      else {
        reason = 'Download failed';
      }
      
      return {
        id: media.id,
        filename: media.filename,
        originalUrl: media.originalUrl,
        reason
      };
    });
    
    // Group by reason
    const groupedByReason = failedImages.reduce((acc, image) => {
      if (!acc[image.reason]) {
        acc[image.reason] = [];
      }
      acc[image.reason].push(image);
      return acc;
    }, {} as Record<string, FailedImageInfo[]>);
    
    // Display results
    for (const [reason, images] of Object.entries(groupedByReason)) {
      console.log(`\n❌ ${reason}: ${images.length} images`);
      console.log('─'.repeat(50));
      
      // Show first 5 examples
      images.slice(0, 5).forEach(image => {
        console.log(`  ${image.id}: ${image.filename}`);
        console.log(`    URL: ${image.originalUrl}`);
      });
      
      if (images.length > 5) {
        console.log(`  ... and ${images.length - 5} more`);
      }
    }
    
    // Summary
    console.log('\n📊 Summary:');
    for (const [reason, images] of Object.entries(groupedByReason)) {
      console.log(`  ${reason}: ${images.length} images`);
    }
    
  } catch (error) {
    console.error('❌ Error checking failed images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting failed images check...\n');
  
  try {
    await checkFailedImages();
    console.log('\n✅ Failed images check completed!');
  } catch (error) {
    console.error('\n❌ Failed images check failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
