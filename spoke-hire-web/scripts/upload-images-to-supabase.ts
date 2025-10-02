#!/usr/bin/env tsx

/**
 * Supabase Image Upload Migration Script
 * 
 * This script:
 * - Fetches media records from database
 * - Finds images in /public/images-by-coverage folders
 * - Resizes images > 3MB to HD resolution (1920px width)
 * - Uploads to Supabase Storage
 * - Generates results JSON for later database update
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  LIMIT: undefined,                    // undefined = process ALL images
  MAX_SIZE_MB: 3,                      // Resize if larger than 3MB
  RESIZE_WIDTH: 1920,                  // HD width for resizing
  BUCKET_NAME: 'vehicle-images',       // Supabase storage bucket name
  COVERAGE_FOLDERS: ['high-coverage', 'medium-coverage', 'low-coverage', 'to-review'],
  RESULTS_FILE: 'upload-results.json', // Output file for results
  OVERWRITE_EXISTING: false,           // true = re-upload READY (excludes FAILED); false = skip READY and FAILED
};

// Types
interface MediaRecord {
  id: string;
  filename: string;
  vehicleId: string;
  originalUrl: string;
}

interface ImageLocation {
  exists: boolean;
  fullPath: string | null;
  coverageType: string | null;
}

interface ImageSizeInfo {
  sizeBytes: number;
  sizeMB: number;
}

interface ResizeResult {
  buffer: Buffer;
  wasResized: boolean;
  originalSizeMB: number;
  newSizeMB: number;
}

interface UploadResult {
  mediaId: string;
  filename: string;
  sanitizedFilename: string;
  vehicleId: string;
  localPath: string;
  coverageGrade: string;
  originalSizeMB: number;
  wasResized: boolean;
  uploadedSizeMB: number;
  supabaseUrl: string | null;
  storagePath: string | null;
  success: boolean;
  databaseUpdated: boolean;
  error?: string;
}

interface UploadStats {
  totalRecords: number;
  filesFound: number;
  filesNotFound: number;
  resized: number;
  uploadedSuccessfully: number;
  uploadFailed: number;
  databaseUpdated: number;
  totalSizeSavedMB: number;
  results: UploadResult[];
  errors: Array<{ filename: string; error: string }>;
}

/**
 * Initialize Supabase client
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Fetch media records from database
 */
async function getMediaRecordsToUpload(limit?: number): Promise<MediaRecord[]> {
  console.log(`📋 Fetching media records from database (limit: ${limit || 'all'})...`);
  
  // Build where clause based on OVERWRITE_EXISTING setting
  const whereClause: any = {
    type: 'IMAGE',
  };
  
  if (CONFIG.OVERWRITE_EXISTING) {
    // When overwriting, include all statuses except FAILED (to fix rotated images, etc.)
    whereClause.status = {
      in: ['READY', 'PROCESSING', 'UPLOADING']
    };
    console.log(`  ℹ️  Including READY images (OVERWRITE_EXISTING is true)`);
    console.log(`  ℹ️  Excluding FAILED images`);
  } else {
    // When not overwriting, only process images that are NOT ready or failed
    whereClause.status = {
      in: ['PROCESSING', 'UPLOADING']
    };
    console.log(`  ℹ️  Skipping READY and FAILED images`);
  }
  
  const mediaRecords = await prisma.media.findMany({
    where: whereClause,
    select: {
      id: true,
      filename: true,
      vehicleId: true,
      originalUrl: true,
    },
    take: limit,
  });
  
  console.log(`📊 Found ${mediaRecords.length} media records to process\n`);
  return mediaRecords;
}

/**
 * Find image in coverage folders
 */
function findImageInCoverageFolder(filename: string): ImageLocation {
  const baseDir = path.join(process.cwd(), 'public', 'images-by-coverage');
  
  for (const folder of CONFIG.COVERAGE_FOLDERS) {
    const imagePath = path.join(baseDir, folder, filename);
    if (fs.existsSync(imagePath)) {
      return {
        exists: true,
        fullPath: imagePath,
        coverageType: folder,
      };
    }
  }
  
  return {
    exists: false,
    fullPath: null,
    coverageType: null,
  };
}

/**
 * Get image file size
 */
function getImageFileSize(filePath: string): ImageSizeInfo {
  const stats = fs.statSync(filePath);
  const sizeBytes = stats.size;
  const sizeMB = sizeBytes / (1024 * 1024);
  
  return { sizeBytes, sizeMB };
}

/**
 * Resize image if needed
 */
async function resizeImageIfNeeded(filePath: string, maxSizeMB: number): Promise<ResizeResult> {
  try {
    const { sizeMB: originalSizeMB } = getImageFileSize(filePath);
    const isPng = filePath.toLowerCase().endsWith('.png');
    
    if (originalSizeMB <= maxSizeMB) {
      // No resize needed, but still apply EXIF rotation correction
      let sharpInstance = sharp(filePath).rotate(); // Auto-rotate based on EXIF orientation
      
      // Use appropriate format
      if (isPng) {
        sharpInstance = sharpInstance.png({ quality: 90, compressionLevel: 9 });
      } else {
        sharpInstance = sharpInstance.jpeg({ quality: 90, progressive: true });
      }
      
      const buffer = await sharpInstance.toBuffer();
      const newSizeMB = buffer.length / (1024 * 1024);
      
      return {
        buffer,
        wasResized: false,
        originalSizeMB,
        newSizeMB,
      };
    }
    
    // Resize image to HD width while maintaining aspect ratio
    console.log(`  🔄 Resizing image (${originalSizeMB.toFixed(2)}MB > ${maxSizeMB}MB)...`);
    
    let sharpInstance = sharp(filePath)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(CONFIG.RESIZE_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    
    // Convert PNG to JPEG for better compression (unless transparency is needed)
    if (isPng) {
      sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
    } else {
      sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
    }
    
    const buffer = await sharpInstance.toBuffer();
    
    const newSizeMB = buffer.length / (1024 * 1024);
    
    console.log(`  ✅ Resized to ${newSizeMB.toFixed(2)}MB (saved ${(originalSizeMB - newSizeMB).toFixed(2)}MB)`);
    
    return {
      buffer,
      wasResized: true,
      originalSizeMB,
      newSizeMB,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Image processing failed: ${errorMessage}`);
  }
}

/**
 * Mark image as FAILED in database
 */
async function markImageAsFailed(mediaId: string, errorReason: string): Promise<void> {
  try {
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        status: 'FAILED',
      },
    });
    console.log(`  💾 Marked as FAILED in database`);
  } catch (dbError) {
    console.log(`  ⚠️  Failed to update database status: ${dbError}`);
  }
}

/**
 * Sanitize filename for Supabase Storage
 * Removes/replaces characters that are not allowed in storage paths
 */
function sanitizeFilename(filename: string): string {
  // Replace ~ with - and remove other problematic characters
  return filename
    .replace(/~/g, '-')           // Replace tilde with dash
    .replace(/[<>:"|?*]/g, '')    // Remove other invalid characters
    .replace(/\s+/g, '_');        // Replace spaces with underscore
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToSupabase(
  supabase: ReturnType<typeof createSupabaseClient>,
  filename: string,
  buffer: Buffer,
  vehicleId: string
): Promise<{ success: boolean; publicUrl: string | null; storagePath: string | null; error: string | null }> {
  try {
    // Sanitize filename for Supabase Storage
    const sanitizedFilename = sanitizeFilename(filename);
    const storagePath = `vehicles/${vehicleId}/${sanitizedFilename}`;
    
    // Determine content type
    const isPng = filename.toLowerCase().endsWith('.png');
    const contentType = isPng ? 'image/png' : 'image/jpeg';
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(CONFIG.BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType,
        upsert: CONFIG.OVERWRITE_EXISTING, // Overwrite if config says so
      });
    
    if (error) {
      // If file already exists and we're not overwriting
      if (!CONFIG.OVERWRITE_EXISTING && (error.message.includes('already exists') || error.message.includes('409'))) {
        console.log(`  ⏭️  File already exists in Supabase, getting URL...`);
        
        const { data: urlData } = supabase.storage
          .from(CONFIG.BUCKET_NAME)
          .getPublicUrl(storagePath);
        
        return {
          success: true,
          publicUrl: urlData.publicUrl,
          storagePath,
          error: null,
        };
      }
      
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(CONFIG.BUCKET_NAME)
      .getPublicUrl(storagePath);
    
    return {
      success: true,
      publicUrl: urlData.publicUrl,
      storagePath,
      error: null,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      publicUrl: null,
      storagePath: null,
      error: errorMessage,
    };
  }
}

/**
 * Process and upload a single image
 */
async function processImage(
  supabase: ReturnType<typeof createSupabaseClient>,
  media: MediaRecord,
  index: number,
  total: number
): Promise<UploadResult> {
  const progress = `[${index + 1}/${total}]`;
  console.log(`\n${progress} Processing: ${media.filename}`);
  
  try {
    // Find image in coverage folders
    const imageLocation = findImageInCoverageFolder(media.filename);
    
    if (!imageLocation.exists || !imageLocation.fullPath) {
      console.log(`  ❌ File not found in coverage folders`);
      
      // Mark as FAILED in database
      await markImageAsFailed(media.id, 'File not found in coverage folders');
      
      return {
        mediaId: media.id,
        filename: media.filename,
        sanitizedFilename: sanitizeFilename(media.filename),
        vehicleId: media.vehicleId,
        localPath: '',
        coverageGrade: '',
        originalSizeMB: 0,
        wasResized: false,
        uploadedSizeMB: 0,
        supabaseUrl: null,
        storagePath: null,
        success: false,
        databaseUpdated: false,
        error: 'File not found in coverage folders',
      };
    }
    
    console.log(`  📁 Found in: ${imageLocation.coverageType}`);
    
    // Get file size
    const { sizeMB: originalSizeMB } = getImageFileSize(imageLocation.fullPath);
    console.log(`  📊 Original size: ${originalSizeMB.toFixed(2)}MB`);
    
    // Resize if needed
    let resizeResult: ResizeResult;
    try {
      resizeResult = await resizeImageIfNeeded(imageLocation.fullPath, CONFIG.MAX_SIZE_MB);
    } catch (resizeError) {
      const errorMsg = resizeError instanceof Error ? resizeError.message : String(resizeError);
      console.log(`  ❌ Image processing failed: ${errorMsg}`);
      
      // Mark as FAILED in database
      await markImageAsFailed(media.id, `Image processing error: ${errorMsg}`);
      
      return {
        mediaId: media.id,
        filename: media.filename,
        sanitizedFilename: sanitizeFilename(media.filename),
        vehicleId: media.vehicleId,
        localPath: imageLocation.fullPath,
        coverageGrade: imageLocation.coverageType || '',
        originalSizeMB,
        wasResized: false,
        uploadedSizeMB: 0,
        supabaseUrl: null,
        storagePath: null,
        success: false,
        databaseUpdated: false,
        error: errorMsg,
      };
    }
  
  // Check if filename needs sanitization
  const sanitizedFilename = sanitizeFilename(media.filename);
  if (sanitizedFilename !== media.filename) {
    console.log(`  🔧 Sanitized filename: ${media.filename} → ${sanitizedFilename}`);
  }
  
  // Upload to Supabase
  console.log(`  ☁️  Uploading to Supabase...`);
  const uploadResult = await uploadToSupabase(
    supabase,
    media.filename,
    resizeResult.buffer,
    media.vehicleId
  );
  
    let databaseUpdated = false;
    
    if (uploadResult.success) {
      console.log(`  ✅ Uploaded successfully: ${uploadResult.publicUrl}`);
      
      // Update database with published URL and mark as READY
      try {
        await prisma.media.update({
          where: { id: media.id },
          data: {
            publishedUrl: uploadResult.publicUrl,
            fileSize: BigInt(Math.floor(resizeResult.newSizeMB * 1024 * 1024)),
            status: 'READY', // Mark as ready after successful upload
          },
        });
        console.log(`  💾 Database updated: URL saved, status set to READY`);
        databaseUpdated = true;
      } catch (dbError) {
        console.log(`  ⚠️  Failed to update database: ${dbError}`);
      }
    } else {
      console.log(`  ❌ Upload failed: ${uploadResult.error}`);
    }
    
    return {
      mediaId: media.id,
      filename: media.filename,
      sanitizedFilename: sanitizeFilename(media.filename),
      vehicleId: media.vehicleId,
      localPath: imageLocation.fullPath,
      coverageGrade: imageLocation.coverageType || '',
      originalSizeMB: resizeResult.originalSizeMB,
      wasResized: resizeResult.wasResized,
      uploadedSizeMB: resizeResult.newSizeMB,
      supabaseUrl: uploadResult.publicUrl,
      storagePath: uploadResult.storagePath,
      success: uploadResult.success,
      databaseUpdated,
      error: uploadResult.error || undefined,
    };
  } catch (error) {
    // Catch any unexpected errors and mark as FAILED
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ Unexpected error: ${errorMsg}`);
    
    // Mark as FAILED in database
    await markImageAsFailed(media.id, `Unexpected error: ${errorMsg}`);
    
    return {
      mediaId: media.id,
      filename: media.filename,
      sanitizedFilename: sanitizeFilename(media.filename),
      vehicleId: media.vehicleId,
      localPath: '',
      coverageGrade: '',
      originalSizeMB: 0,
      wasResized: false,
      uploadedSizeMB: 0,
      supabaseUrl: null,
      storagePath: null,
      success: false,
      databaseUpdated: false,
      error: errorMsg,
    };
  }
}

/**
 * Main migration function
 */
async function uploadImagesToSupabase(): Promise<void> {
  console.log('🚀 Starting Supabase Image Upload Migration\n');
  console.log('📋 Configuration:');
  console.log(`  - Limit: ${CONFIG.LIMIT} images`);
  console.log(`  - Max size before resize: ${CONFIG.MAX_SIZE_MB}MB`);
  console.log(`  - Resize width: ${CONFIG.RESIZE_WIDTH}px`);
  console.log(`  - Bucket: ${CONFIG.BUCKET_NAME}`);
  console.log(`  - Overwrite existing: ${CONFIG.OVERWRITE_EXISTING ? 'YES (will fix rotated images)' : 'NO'}`);
  console.log(`  - Coverage folders: ${CONFIG.COVERAGE_FOLDERS.join(', ')}\n`);
  
  const stats: UploadStats = {
    totalRecords: 0,
    filesFound: 0,
    filesNotFound: 0,
    resized: 0,
    uploadedSuccessfully: 0,
    uploadFailed: 0,
    databaseUpdated: 0,
    totalSizeSavedMB: 0,
    results: [],
    errors: [],
  };
  
  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();
    console.log('✅ Supabase client initialized\n');
    
    // Fetch media records
    const mediaRecords = await getMediaRecordsToUpload(CONFIG.LIMIT);
    stats.totalRecords = mediaRecords.length;
    
    if (mediaRecords.length === 0) {
      console.log('⚠️  No media records found to process');
      return;
    }
    
    // Process each image
    for (let i = 0; i < mediaRecords.length; i++) {
      const media = mediaRecords[i]!;
      const result = await processImage(supabase, media, i, mediaRecords.length);
      
      stats.results.push(result);
      
      if (result.success) {
        stats.uploadedSuccessfully++;
        if (result.localPath) {
          stats.filesFound++;
        }
        if (result.wasResized) {
          stats.resized++;
          stats.totalSizeSavedMB += result.originalSizeMB - result.uploadedSizeMB;
        }
        if (result.databaseUpdated) {
          stats.databaseUpdated++;
        }
      } else {
        stats.uploadFailed++;
        if (!result.localPath) {
          stats.filesNotFound++;
        }
        if (result.error) {
          stats.errors.push({ filename: result.filename, error: result.error });
        }
      }
    }
    
    // Save results to JSON file
    const resultsPath = path.join(process.cwd(), 'data', CONFIG.RESULTS_FILE);
    
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const resultsData = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      stats: {
        totalRecords: stats.totalRecords,
        filesFound: stats.filesFound,
        filesNotFound: stats.filesNotFound,
        resized: stats.resized,
        uploadedSuccessfully: stats.uploadedSuccessfully,
        uploadFailed: stats.uploadFailed,
        databaseUpdated: stats.databaseUpdated,
        totalSizeSavedMB: Number(stats.totalSizeSavedMB.toFixed(2)),
      },
      results: stats.results,
      errors: stats.errors,
    };
    
    fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2));
    
    // Print summary
    console.log('\n\n📊 ═══════════════════════════════════════════════════════');
    console.log('📊 UPLOAD SUMMARY');
    console.log('📊 ═══════════════════════════════════════════════════════\n');
    
    console.log('📈 Statistics:');
    console.log(`  Total records processed: ${stats.totalRecords}`);
    console.log(`  Files found: ${stats.filesFound}`);
    console.log(`  Files not found: ${stats.filesNotFound}`);
    console.log(`  Images resized: ${stats.resized}`);
    console.log(`  Uploaded successfully: ${stats.uploadedSuccessfully}`);
    console.log(`  Upload failed: ${stats.uploadFailed}`);
    console.log(`  Database updated: ${stats.databaseUpdated}`);
    console.log(`  Total size saved: ${stats.totalSizeSavedMB.toFixed(2)}MB\n`);
    
    if (stats.errors.length > 0) {
      console.log('❌ Errors:');
      stats.errors.forEach(({ filename, error }) => {
        console.log(`  - ${filename}: ${error}`);
      });
      console.log('');
    }
    
    console.log(`💾 Results saved to: ${resultsPath}`);
    console.log('\n✅ Migration completed!');
    console.log('\n💡 Next steps:');
    console.log('  1. Review the results in upload-results.json');
    console.log('  2. Check uploaded images in Supabase Storage dashboard');
    console.log('  3. Images marked as READY are available for use');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
uploadImagesToSupabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

