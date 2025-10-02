#!/usr/bin/env tsx

/**
 * Cleanup Orphaned Images Script
 * Deletes image files in /public/car-images that don't have corresponding media records in the database
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CleanupStats {
  totalFiles: number;
  filesInDb: number;
  orphanedFiles: number;
  deletedFiles: number;
  failedDeletions: number;
  errors: string[];
}

/**
 * Get all image files in the car-images directory
 */
function getImageFiles(): string[] {
  const carImagesDir = path.join(process.cwd(), 'public', 'car-images');
  
  if (!fs.existsSync(carImagesDir)) {
    console.log('📁 /public/car-images directory does not exist');
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
 * Get all filenames from media records in database
 */
async function getMediaFilenames(): Promise<Set<string>> {
  console.log('📋 Fetching media filenames from database...');
  
  const mediaRecords = await prisma.media.findMany({
    where: {
      type: 'IMAGE'
    },
    select: {
      filename: true
    }
  });
  
  const filenames = new Set(mediaRecords.map(media => media.filename));
  console.log(`📊 Found ${filenames.size} media records in database`);
  
  return filenames;
}

/**
 * Delete a file safely
 */
function deleteFile(filename: string): boolean {
  try {
    const filePath = path.join(process.cwd(), 'public', 'car-images', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Failed to delete ${filename}:`, error);
    return false;
  }
}

/**
 * Main cleanup function
 */
async function cleanupOrphanedImages(dryRun: boolean = true): Promise<CleanupStats> {
  console.log(`🚀 Starting orphaned images cleanup (${dryRun ? 'DRY RUN' : 'LIVE RUN'})...\n`);
  
  const stats: CleanupStats = {
    totalFiles: 0,
    filesInDb: 0,
    orphanedFiles: 0,
    deletedFiles: 0,
    failedDeletions: 0,
    errors: []
  };
  
  try {
    // Get all image files in directory
    const imageFiles = getImageFiles();
    stats.totalFiles = imageFiles.length;
    
    if (imageFiles.length === 0) {
      console.log('✅ No image files found in /public/car-images');
      return stats;
    }
    
    console.log(`📁 Found ${imageFiles.length} image files in /public/car-images`);
    
    // Get all filenames from database
    const dbFilenames = await getMediaFilenames();
    stats.filesInDb = dbFilenames.size;
    
    // Find orphaned files
    const orphanedFiles = imageFiles.filter(filename => !dbFilenames.has(filename));
    stats.orphanedFiles = orphanedFiles.length;
    
    if (orphanedFiles.length === 0) {
      console.log('✅ No orphaned files found! All image files have corresponding media records.');
      return stats;
    }
    
    console.log(`\n🗑️ Found ${orphanedFiles.length} orphaned files:`);
    console.log('─'.repeat(50));
    
    // Process orphaned files
    for (let i = 0; i < orphanedFiles.length; i++) {
      const filename = orphanedFiles[i];
      const progress = `[${i + 1}/${orphanedFiles.length}]`;
      
      try {
        if (dryRun) {
          console.log(`${progress} 🔍 Would delete: ${filename}`);
          stats.deletedFiles++; // Count as would be deleted in dry run
        } else {
          console.log(`${progress} 🗑️ Deleting: ${filename}`);
          const deleted = deleteFile(filename);
          
          if (deleted) {
            console.log(`${progress} ✅ Deleted: ${filename}`);
            stats.deletedFiles++;
          } else {
            console.log(`${progress} ❌ Failed to delete: ${filename}`);
            stats.failedDeletions++;
          }
        }
      } catch (error) {
        const errorMsg = `Error processing ${filename}: ${error}`;
        console.error(`${progress} ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
        stats.failedDeletions++;
      }
    }
    
  } catch (error) {
    const errorMsg = `Fatal error during cleanup: ${error}`;
    console.error(`❌ ${errorMsg}`);
    stats.errors.push(errorMsg);
  }
  
  return stats;
}

/**
 * Get directory statistics
 */
async function getDirectoryStats(): Promise<void> {
  console.log('\n📊 Directory Statistics:');
  
  const imageFiles = getImageFiles();
  const dbFilenames = await getMediaFilenames();
  const orphanedFiles = imageFiles.filter(filename => !dbFilenames.has(filename));
  
  console.log(`  Total image files: ${imageFiles.length}`);
  console.log(`  Files in database: ${dbFilenames.size}`);
  console.log(`  Orphaned files: ${orphanedFiles.length}`);
  console.log(`  Files with records: ${imageFiles.length - orphanedFiles.length}`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--delete');
  
  console.log('🚀 Starting orphaned images cleanup script...\n');
  
  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode (no files will be deleted)');
    console.log('   Use --delete flag to actually delete orphaned files\n');
  } else {
    console.log('⚠️ Running in LIVE mode - files will be permanently deleted!');
    console.log('   This action cannot be undone!\n');
  }
  
  try {
    // Show directory statistics
    await getDirectoryStats();
    
    // Run cleanup
    const stats = await cleanupOrphanedImages(dryRun);
    
    console.log('\n✅ Cleanup completed!');
    console.log('\n📊 Cleanup Summary:');
    console.log(`  Total image files: ${stats.totalFiles}`);
    console.log(`  Files in database: ${stats.filesInDb}`);
    console.log(`  Orphaned files: ${stats.orphanedFiles}`);
    
    if (dryRun) {
      console.log(`  Would delete: ${stats.deletedFiles} files`);
      console.log(`  Failed operations: ${stats.failedDeletions}`);
    } else {
      console.log(`  Deleted: ${stats.deletedFiles} files`);
      console.log(`  Failed deletions: ${stats.failedDeletions}`);
    }
    
    console.log(`  Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (dryRun && stats.orphanedFiles > 0) {
      console.log('\n💡 To actually delete the orphaned files, run:');
      console.log('   npm run cleanup-orphaned-images -- --delete');
    }
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
