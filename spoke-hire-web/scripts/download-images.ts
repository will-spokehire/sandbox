#!/usr/bin/env tsx

/**
 * Image Download Migration Script
 * Downloads vehicle images to /public/car-images if they don't already exist
 * Marks downloaded and existing images as PROCESSING status (ready for image processing)
 * Marks images as FAILED if they have invalid URLs or no proper image extensions
 * Skips images that are already downloaded
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const prisma = new PrismaClient();

interface DownloadStats {
  totalImages: number;
  alreadyExists: number;
  downloaded: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * Check if image file exists in the /public/car-images folder
 */
function checkImageExists(imageUrl: string): boolean {
  try {
    // Extract filename from URL
    const filename = imageUrl.split('/').pop();
    if (!filename) return false;
    
    // Check in public/car-images folder (relative to project root)
    const imagePath = path.join(process.cwd(), 'public', 'car-images', filename);
    return fs.existsSync(imagePath);
  } catch (error) {
    console.warn(`⚠️ Error checking image existence for ${imageUrl}:`, error);
    return false;
  }
}

/**
 * Download image from URL to local file
 */
async function downloadImage(imageUrl: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Ensure the car-images directory exists
    const carImagesDir = path.join(process.cwd(), 'public', 'car-images');
    if (!fs.existsSync(carImagesDir)) {
      fs.mkdirSync(carImagesDir, { recursive: true });
    }
    
    const filePath = path.join(carImagesDir, filename);
    
    // Download the file
    const fileStream = createWriteStream(filePath);
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }
    
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) {
        fileStream.end();
        return;
      }
      fileStream.write(value);
      return pump();
    };
    
    await pump();
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to download ${imageUrl}:`, error);
    return false;
  }
}

/**
 * Get all media records that need image downloads
 */
async function getMediaToDownload(): Promise<Array<{ id: string; originalUrl: string; filename: string; vehicleId: string }>> {
  console.log('📋 Fetching media records that need image downloads...');
  
  const mediaRecords = await prisma.media.findMany({
    where: {
      type: 'IMAGE',
      status: {
        in: ['UPLOADING', 'PROCESSING'] // These are the ones that need downloads
      }
    },
    select: {
      id: true,
      originalUrl: true,
      filename: true,
      vehicleId: true
    }
  });
  
  console.log(`📊 Found ${mediaRecords.length} media records that may need downloads`);
  return mediaRecords;
}

/**
 * Update media status in database
 */
async function updateMediaStatus(mediaId: string, status: 'PROCESSING' | 'READY' | 'FAILED'): Promise<void> {
  try {
    // First check if the media record exists
    const existingMedia = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { id: true, status: true }
    });
    
    if (!existingMedia) {
      console.warn(`⚠️ Media record ${mediaId} not found, skipping status update`);
      return;
    }
    
    await prisma.media.update({
      where: { id: mediaId },
      data: { status }
    });
  } catch (error) {
    console.error(`❌ Failed to update media status for ${mediaId}:`, error);
  }
}

/**
 * Main download function
 */
async function downloadImages(): Promise<DownloadStats> {
  console.log('🚀 Starting image download migration...\n');
  
  const stats: DownloadStats = {
    totalImages: 0,
    alreadyExists: 0,
    downloaded: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  try {
    // Get all media records that might need downloads
    const mediaRecords = await getMediaToDownload();
    stats.totalImages = mediaRecords.length;
    
    if (mediaRecords.length === 0) {
      console.log('✅ No images need downloading!');
      return stats;
    }
    
    console.log(`\n📸 Processing ${mediaRecords.length} images...\n`);
    
    for (let i = 0; i < mediaRecords.length; i++) {
      const media = mediaRecords[i];
      const progress = `[${i + 1}/${mediaRecords.length}]`;
      
      try {
        // Double-check that the media record still exists before processing
        const currentMedia = await prisma.media.findUnique({
          where: { id: media.id },
          select: { id: true, status: true, originalUrl: true, filename: true }
        });
        
        if (!currentMedia) {
          console.log(`${progress} ⚠️ Media record no longer exists, skipping: ${media?.filename || 'unknown'}`);
          stats.skipped++;
          continue;
        }
        
        // Check if image already exists
        if (checkImageExists(currentMedia.originalUrl)) {
          console.log(`${progress} ✅ Already exists: ${currentMedia.filename}`);
          stats.alreadyExists++;
          
          // Update status to PROCESSING since image exists but needs processing
          await updateMediaStatus(currentMedia.id, 'PROCESSING');
          continue;
        }
        
        // Validate URL
        if (!currentMedia.originalUrl || !currentMedia.originalUrl.startsWith('http')) {
          console.log(`${progress} ⚠️ Skipped invalid URL: ${currentMedia.originalUrl}`);
          stats.skipped++;
          await updateMediaStatus(currentMedia.id, 'FAILED');
          continue;
        }
        
        // Check if filename has a proper image extension
        const filename = currentMedia.filename;
        const hasValidExtension = filename && /\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/i.test(filename);
        
        if (!hasValidExtension) {
          console.log(`${progress} ❌ No valid image extension: ${filename}`);
          stats.failed++;
          await updateMediaStatus(currentMedia.id, 'FAILED');
          continue;
        }
        
        // Download the image
        console.log(`${progress} 🔄 Downloading: ${currentMedia.filename}`);
        const downloadSuccess = await downloadImage(currentMedia.originalUrl, currentMedia.filename);
        
        if (downloadSuccess) {
          console.log(`${progress} ✅ Downloaded: ${currentMedia.filename}`);
          stats.downloaded++;
          await updateMediaStatus(currentMedia.id, 'PROCESSING');
        } else {
          console.log(`${progress} ❌ Failed: ${currentMedia.filename}`);
          stats.failed++;
          await updateMediaStatus(currentMedia.id, 'FAILED');
        }
        
      } catch (error) {
        const errorMsg = `Error processing ${media?.filename || 'unknown'}: ${error}`;
        console.error(`${progress} ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
        stats.failed++;
        if (media?.id) {
          await updateMediaStatus(media.id, 'FAILED');
        }
      }
    }
    
  } catch (error) {
    const errorMsg = `Fatal error during image download: ${error}`;
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
    console.log(`  Processing: ${processingMedia} (downloaded/existing images ready for processing)`);
    console.log(`  Uploading: ${uploadingMedia}`);
    console.log(`  Failed: ${failedMedia}`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting image download migration script...\n');
  
  try {
    // Download images
    const stats = await downloadImages();
    
    // Final statistics
    await getFinalStatistics();
    
    console.log('\n✅ Image download migration completed!');
    console.log('\n📊 Download Summary:');
    console.log(`  Total Images Processed: ${stats.totalImages}`);
    console.log(`  Downloaded: ${stats.downloaded} (marked as PROCESSING)`);
    console.log(`  Already Existed: ${stats.alreadyExists} (marked as PROCESSING)`);
    console.log(`  Failed: ${stats.failed} (invalid URLs, no extensions, download errors)`);
    console.log(`  Skipped: ${stats.skipped} (missing records, invalid URLs)`);
    console.log(`  Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
  } catch (error) {
    console.error('\n❌ Image download migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
