#!/usr/bin/env tsx

/**
 * Upload Missing Images from Cleansed CSV Data
 * 
 * This script:
 * - Reads cleansed CSV and parses image titles (with malformed filename fixes)
 * - Finds vehicles in database by Wix ID via VehicleSource
 * - Checks which images are already uploaded
 * - Uploads only missing images from data-analytics/car-images to Supabase Storage
 * - Creates Media records in database
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
};
const hasFlag = (name: string) => args.includes(`--${name}`);

// Configuration
const CONFIG = {
  CSV_FILE: path.join(__dirname, '../../data-analytics/data/cleansed_database.csv'),
  CAR_IMAGES_DIR: path.join(__dirname, '../../data-analytics/car-images'),
  RESULTS_FILE: 'upload-missing-cleansed-results.json',
  BUCKET_NAME: 'vehicle-images',
  MAX_SIZE_MB: 3,
  RESIZE_WIDTH: 1920,
  
  // CLI options
  LIMIT: getArg('limit') ? parseInt(getArg('limit')!) : undefined,
  WIX_ID: getArg('wix-id'),
  DRY_RUN: hasFlag('dry-run'),
  RESIZE: hasFlag('resize'),
  SKIP_EXISTING: hasFlag('skip-existing'),
};

// Types
interface CSVRow {
  'Wix ID': string;
  'Registration': string;
  'Make': string;
  'Model': string;
  'Upload vehicle images': string;
  'Image Titles': string;
}

interface ProcessResult {
  wixId: string;
  registration: string;
  make: string;
  model: string;
  vehicleId: string | null;
  vehicleFound: boolean;
  totalImages: number;
  alreadyUploaded: number;
  uploaded: number;
  failed: number;
  skipped: number;
  images: ImageResult[];
}

interface ImageResult {
  filename: string;
  originalUrl: string;
  action: 'already_uploaded' | 'uploaded' | 'failed' | 'not_found' | 'skipped';
  supabaseUrl?: string;
  error?: string;
  sizeMB?: number;
  wasResized?: boolean;
}

interface UploadStats {
  totalRecords: number;
  vehiclesFound: number;
  vehiclesNotFound: number;
  vehiclesSkipped: number;
  totalImagesChecked: number;
  alreadyUploaded: number;
  uploaded: number;
  failed: number;
  filesNotFound: number;
  totalSizeMB: number;
  results: ProcessResult[];
  errors: string[];
}

/**
 * Initialize Supabase client with service role key (bypasses RLS)
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  console.log('  ℹ️  Using Supabase service role key (bypasses RLS)\n');

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Fix malformed filenames (semicolon splits)
 */
function fixMalformedFilenames(filenames: string[]): string[] {
  const fixed: string[] = [];
  let i = 0;
  
  while (i < filenames.length) {
    const current = filenames[i]!;
    
    if (i < filenames.length - 1) {
      const next = filenames[i + 1]!;
      
      // If current is short hex and next starts with pattern, merge them
      if (current.length < 10 && 
          /^[a-f0-9]+$/.test(current) && 
          /^[a-z0-9_]+~mv2\./.test(next)) {
        fixed.push(current + next);
        i += 2;
        continue;
      }
    }
    
    fixed.push(current);
    i++;
  }
  
  return fixed;
}

/**
 * Parse CSV and extract image data
 */
function parseImageData(row: CSVRow): { urls: string[]; filenames: string[] } {
  const imageUrlsStr = row['Upload vehicle images'] || '';
  const imageTitlesStr = row['Image Titles'] || '';
  
  if (!imageUrlsStr || !imageTitlesStr) {
    return { urls: [], filenames: [] };
  }

  const urls = imageUrlsStr.split(';').map((u) => u.trim()).filter((u) => u);
  let filenames = imageTitlesStr.split(';').map((f) => f.trim()).filter((f) => f);
  
  // Fix malformed filenames
  filenames = fixMalformedFilenames(filenames);
  
  return { urls, filenames };
}

/**
 * Check if image file exists in car-images directory
 */
function findImageFile(filename: string): { exists: boolean; fullPath: string | null } {
  if (!filename || filename.length < 10 || !filename.includes('~mv2.')) {
    return { exists: false, fullPath: null };
  }

  const imagePath = path.join(CONFIG.CAR_IMAGES_DIR, filename);
  
  if (fs.existsSync(imagePath)) {
    return { exists: true, fullPath: imagePath };
  }
  
  return { exists: false, fullPath: null };
}

/**
 * Sanitize filename for Supabase Storage
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/~/g, '-')
    .replace(/[<>:"|?*]/g, '')
    .replace(/\s+/g, '_');
}

/**
 * Resize image if needed
 */
async function resizeImageIfNeeded(
  filePath: string,
  shouldResize: boolean
): Promise<{ buffer: Buffer; wasResized: boolean; sizeMB: number }> {
  const stats = fs.statSync(filePath);
  const originalSizeMB = stats.size / (1024 * 1024);
  
  const isPng = filePath.toLowerCase().endsWith('.png');
  
  if (!shouldResize || originalSizeMB <= CONFIG.MAX_SIZE_MB) {
    // No resize, just apply EXIF rotation
    let sharpInstance = sharp(filePath).rotate();
    
    if (isPng) {
      sharpInstance = sharpInstance.png({ quality: 90, compressionLevel: 9 });
    } else {
      sharpInstance = sharpInstance.jpeg({ quality: 90, progressive: true });
    }
    
    const buffer = await sharpInstance.toBuffer();
    const sizeMB = buffer.length / (1024 * 1024);
    
    return { buffer, wasResized: false, sizeMB };
  }
  
  // Resize to HD width
  console.log(`    🔄 Resizing ${originalSizeMB.toFixed(2)}MB → HD...`);
  
  let sharpInstance = sharp(filePath)
    .rotate()
    .resize(CONFIG.RESIZE_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });
  
  if (isPng) {
    sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
  } else {
    sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
  }
  
  const buffer = await sharpInstance.toBuffer();
  const sizeMB = buffer.length / (1024 * 1024);
  
  console.log(`    ✅ Resized to ${sizeMB.toFixed(2)}MB`);
  
  return { buffer, wasResized: true, sizeMB };
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToSupabase(
  supabase: ReturnType<typeof createSupabaseClient>,
  filename: string,
  buffer: Buffer,
  vehicleId: string
): Promise<{ success: boolean; publicUrl: string | null; error: string | null }> {
  try {
    const sanitizedFilename = sanitizeFilename(filename);
    const storagePath = `vehicles/${vehicleId}/${sanitizedFilename}`;
    
    const isPng = filename.toLowerCase().endsWith('.png');
    const contentType = isPng ? 'image/png' : 'image/jpeg';
    
    const { data, error } = await supabase.storage
      .from(CONFIG.BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(CONFIG.BUCKET_NAME)
      .getPublicUrl(storagePath);
    
    return {
      success: true,
      publicUrl: urlData.publicUrl,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      publicUrl: null,
      error: errorMessage,
    };
  }
}

/**
 * Process a single vehicle record
 */
async function processVehicleRecord(
  row: CSVRow,
  supabase: ReturnType<typeof createSupabaseClient>,
  stats: UploadStats
): Promise<ProcessResult> {
  const wixId = row['Wix ID'];
  const result: ProcessResult = {
    wixId,
    registration: row['Registration'],
    make: row['Make'],
    model: row['Model'],
    vehicleId: null,
    vehicleFound: false,
    totalImages: 0,
    alreadyUploaded: 0,
    uploaded: 0,
    failed: 0,
    skipped: 0,
    images: [],
  };

  console.log(`\n🚗 Processing Wix ID ${wixId}: ${row['Make']} ${row['Model']} (${row['Registration']})`);

  // Find vehicle in database by Wix ID
  // Check all possible source types: processed_catalog, catalog, cleansed
  let vehicleSource = await prisma.vehicleSource.findFirst({
    where: {
      sourceId: wixId,
      sourceType: {
        in: ['processed_catalog', 'catalog', 'cleansed'],
      },
    },
    include: {
      vehicle: {
        include: {
          media: true,
        },
      },
    },
  });

  if (!vehicleSource) {
    console.log(`  ❌ Vehicle not found in database`);
    stats.vehiclesNotFound++;
    return result;
  }

  console.log(`  ✓ Found vehicle ID: ${vehicleSource.vehicleId} (sourceType: ${vehicleSource.sourceType})`);

  result.vehicleFound = true;
  result.vehicleId = vehicleSource.vehicleId;
  stats.vehiclesFound++;

  // Parse image data from CSV
  const { urls, filenames } = parseImageData(row);
  result.totalImages = Math.min(urls.length, filenames.length);
  
  if (result.totalImages === 0) {
    console.log(`  ℹ️  No images in CSV`);
    return result;
  }

  console.log(`  📸 Found ${result.totalImages} images in CSV`);

  // Get existing media records
  const existingMedia = vehicleSource.vehicle.media;
  console.log(`  📁 Vehicle has ${existingMedia.length} existing media records`);

  // Check if vehicle already has all images
  if (CONFIG.SKIP_EXISTING && existingMedia.length >= result.totalImages) {
    console.log(`  ⏭️  Skipping: Vehicle already has ${existingMedia.length} images`);
    stats.vehiclesSkipped++;
    result.skipped = result.totalImages;
    return result;
  }

  // Process each image
  for (let i = 0; i < result.totalImages; i++) {
    const url = urls[i]!;
    const filename = filenames[i]!;
    
    console.log(`  [${i + 1}/${result.totalImages}] ${filename}`);
    stats.totalImagesChecked++;

    const imageResult: ImageResult = {
      filename,
      originalUrl: url,
      action: 'skipped',
    };

    // Check if already uploaded
    const existingImage = existingMedia.find(
      (m) => m.filename === filename || m.originalUrl.includes(filename)
    );

    if (existingImage) {
      console.log(`    ✓ Already uploaded`);
      imageResult.action = 'already_uploaded';
      result.alreadyUploaded++;
      stats.alreadyUploaded++;
      result.images.push(imageResult);
      continue;
    }

    // Check if file exists locally
    const { exists, fullPath } = findImageFile(filename);
    
    if (!exists || !fullPath) {
      console.log(`    ❌ File not found in car-images`);
      imageResult.action = 'not_found';
      result.failed++;
      stats.filesNotFound++;
      result.images.push(imageResult);
      continue;
    }

    // Dry run - don't actually upload
    if (CONFIG.DRY_RUN) {
      console.log(`    🔍 DRY RUN: Would upload`);
      imageResult.action = 'skipped';
      result.skipped++;
      result.images.push(imageResult);
      continue;
    }

    try {
      // Resize if needed
      const { buffer, wasResized, sizeMB } = await resizeImageIfNeeded(fullPath, CONFIG.RESIZE);
      
      // Upload to Supabase
      const uploadResult = await uploadToSupabase(supabase, filename, buffer, vehicleSource.vehicleId);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error ?? 'Upload failed');
      }

      console.log(`    ✅ Uploaded to Supabase`);

      // Get image dimensions
      const metadata = await sharp(buffer).metadata();
      
      // Get next order number
      const maxOrder = existingMedia.reduce((max, m) => Math.max(max, m.order), 0);
      const nextOrder = maxOrder + 1;
      
      // Check if this should be primary (first image)
      const isPrimary = existingMedia.length === 0 && i === 0;

      // Create Media record
      await prisma.media.create({
        data: {
          type: 'IMAGE',
          vehicleId: vehicleSource.vehicleId,
          filename,
          originalUrl: url,
          publishedUrl: uploadResult.publicUrl!,
          fileSize: BigInt(buffer.length),
          mimeType: metadata.format === 'png' ? 'image/png' : 'image/jpeg',
          width: metadata.width ?? null,
          height: metadata.height ?? null,
          format: metadata.format ?? 'jpeg',
          order: nextOrder,
          isPrimary,
          status: 'READY',
          isVisible: true,
        },
      });

      console.log(`    💾 Created Media record`);

      imageResult.action = 'uploaded';
      imageResult.supabaseUrl = uploadResult.publicUrl!;
      imageResult.sizeMB = sizeMB;
      imageResult.wasResized = wasResized;
      
      result.uploaded++;
      stats.uploaded++;
      stats.totalSizeMB += sizeMB;
      
      // Add to existing media for next iteration
      existingMedia.push({
        id: 'new',
        filename,
        originalUrl: url,
        order: nextOrder,
      } as any);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`    ❌ Failed: ${errorMessage}`);
      
      imageResult.action = 'failed';
      imageResult.error = errorMessage;
      result.failed++;
      stats.failed++;
      stats.errors.push(`${wixId}/${filename}: ${errorMessage}`);
    }

    result.images.push(imageResult);
  }

  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Upload Missing Images from Cleansed CSV\n');
  console.log('Configuration:');
  console.log(`  CSV File: ${CONFIG.CSV_FILE}`);
  console.log(`  Images Dir: ${CONFIG.CAR_IMAGES_DIR}`);
  console.log(`  Limit: ${CONFIG.LIMIT ?? 'none'}`);
  console.log(`  Wix ID Filter: ${CONFIG.WIX_ID ?? 'all'}`);
  console.log(`  Dry Run: ${CONFIG.DRY_RUN ? 'YES' : 'no'}`);
  console.log(`  Resize: ${CONFIG.RESIZE ? 'YES' : 'no'}`);
  console.log(`  Skip Existing: ${CONFIG.SKIP_EXISTING ? 'YES' : 'no'}`);
  console.log('');

  // Check directories exist
  if (!fs.existsSync(CONFIG.CSV_FILE)) {
    throw new Error(`CSV file not found: ${CONFIG.CSV_FILE}`);
  }
  
  if (!fs.existsSync(CONFIG.CAR_IMAGES_DIR)) {
    throw new Error(`Car images directory not found: ${CONFIG.CAR_IMAGES_DIR}`);
  }

  // Initialize Supabase
  const supabase = CONFIG.DRY_RUN ? null : createSupabaseClient();
  
  // Initialize stats
  const stats: UploadStats = {
    totalRecords: 0,
    vehiclesFound: 0,
    vehiclesNotFound: 0,
    vehiclesSkipped: 0,
    totalImagesChecked: 0,
    alreadyUploaded: 0,
    uploaded: 0,
    failed: 0,
    filesNotFound: 0,
    totalSizeMB: 0,
    results: [],
    errors: [],
  };

  // Read and process CSV
  const records: CSVRow[] = [];
  
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(CONFIG.CSV_FILE)
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        // Stop at limit if specified
        if (CONFIG.LIMIT && records.length >= CONFIG.LIMIT) {
          stream.destroy();
          return;
        }
        
        // Filter by Wix ID if specified
        if (CONFIG.WIX_ID && row['Wix ID'] !== CONFIG.WIX_ID) {
          return;
        }
        
        records.push(row);
      })
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .on('close', () => resolve());
  });

  console.log(`📋 Found ${records.length} records to process\n`);
  console.log('='.repeat(60));

  // Process each record
  for (const row of records) {
    stats.totalRecords++;
    
    try {
      const result = await processVehicleRecord(row, supabase!, stats);
      stats.results.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Error processing Wix ID ${row['Wix ID']}: ${errorMessage}`);
      stats.errors.push(`${row['Wix ID']}: ${errorMessage}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY\n');
  console.log(`Records:`);
  console.log(`  Total processed: ${stats.totalRecords}`);
  console.log(`  Vehicles found: ${stats.vehiclesFound}`);
  console.log(`  Vehicles not found: ${stats.vehiclesNotFound}`);
  console.log(`  Vehicles skipped: ${stats.vehiclesSkipped}`);
  console.log('');
  console.log(`Images:`);
  console.log(`  Total checked: ${stats.totalImagesChecked}`);
  console.log(`  Already uploaded: ${stats.alreadyUploaded}`);
  console.log(`  Newly uploaded: ${stats.uploaded}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Files not found: ${stats.filesNotFound}`);
  
  if (stats.uploaded > 0) {
    console.log(`  Total size: ${stats.totalSizeMB.toFixed(2)} MB`);
  }

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors (${stats.errors.length}):`);
    stats.errors.slice(0, 10).forEach((err) => console.log(`  - ${err}`));
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more`);
    }
  }

  // Save results to file
  const resultsPath = path.join(process.cwd(), CONFIG.RESULTS_FILE);
  fs.writeFileSync(resultsPath, JSON.stringify(stats, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);
  
  console.log('\n✅ Done!\n');
  
  await prisma.$disconnect();
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Script failed:', error);
  prisma.$disconnect();
  process.exit(1);
});

