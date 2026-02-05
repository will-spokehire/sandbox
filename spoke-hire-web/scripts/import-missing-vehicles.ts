#!/usr/bin/env tsx

/**
 * Import Missing Vehicles Script
 * 
 * This script imports vehicles that were identified as missing from the database.
 * It reads from the missing-vehicles.json file and:
 * 1. Creates/finds users by email
 * 2. Creates/finds makes and models
 * 3. Creates vehicles with appropriate status (DRAFT/PUBLISHED)
 * 4. Downloads and uploads images to Supabase Storage
 * 5. Creates Media records
 * 
 * Status Logic:
 * - DRAFT if: no postcode, no images, or no registration
 * - PUBLISHED if: all required fields present + has images + has postcode
 * 
 * Default Values:
 * - condition: Always set to "Good"
 * - description: Uses original condition text from CSV
 * - steering: Defaults to RHD if not specified
 * - numberOfSeats: Defaults to 4 if not specified (unless single-seater)
 * - isRoadLegal: Defaults to true if empty
 * 
 * Usage:
 *   npx tsx scripts/import-missing-vehicles.ts
 *   npx tsx scripts/import-missing-vehicles.ts --dry-run
 *   npx tsx scripts/import-missing-vehicles.ts --limit=10
 *   npx tsx scripts/import-missing-vehicles.ts --wix-id=648
 * 
 * Options:
 *   --dry-run       Don't make any changes, just show what would happen
 *   --limit=N       Only process first N vehicles
 *   --wix-id=ID     Only process a specific Wix ID
 *   --skip-images   Skip image download/upload
 */

import { PrismaClient, VehicleStatus } from '@prisma/client';
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
  CSV_FILE: path.join(__dirname, '../data/Cleansed Database.xlsx - Cleansed Database.csv'),
  MISSING_VEHICLES_FILE: path.join(__dirname, '../data/missing-vehicles.json'),
  TEMP_IMAGES_DIR: path.join(__dirname, '../data/temp-images'),
  BUCKET_NAME: 'vehicle-images',
  MAX_IMAGE_SIZE_MB: 3,
  RESIZE_WIDTH: 1920,
  
  // CLI options
  DRY_RUN: hasFlag('dry-run'),
  LIMIT: getArg('limit') ? parseInt(getArg('limit')!) : undefined,
  WIX_ID: getArg('wix-id'),
  SKIP_IMAGES: hasFlag('skip-images'),
};

// Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Types
interface MissingVehicle {
  wixId: string;
  submissionTime: string;
  ownerEmail: string;
  ownerName: string;
  phone: string;
  registration: string;
  year: string;
  make: string;
  model: string;
  engineCapacity: string;
  seats: string;
  steering: string;
  gearbox: string;
  exteriorColour: string;
  interiorColour: string;
  condition: string;
  hasImages: boolean;
  isRoadLegal: string;
  postcode: string;
  city: string;
  county: string;
  country: string;
  hasInvalidWixId?: boolean;
  missingRequiredFields?: string[];
}

interface CSVRow {
  'Wix ID': string;
  'Upload vehicle images': string;
  'Image Titles': string;
  [key: string]: string;
}

interface ImportStats {
  totalProcessed: number;
  usersCreated: number;
  usersFound: number;
  makesCreated: number;
  modelsCreated: number;
  vehiclesCreated: number;
  vehiclesSkipped: number;
  imagesDownloaded: number;
  imagesUploaded: number;
  imagesFailed: number;
  errors: string[];
}

/**
 * Load missing vehicles from JSON file
 */
function loadMissingVehicles(): MissingVehicle[] {
  if (!fs.existsSync(CONFIG.MISSING_VEHICLES_FILE)) {
    throw new Error(`Missing vehicles file not found: ${CONFIG.MISSING_VEHICLES_FILE}`);
  }
  
  const data = JSON.parse(fs.readFileSync(CONFIG.MISSING_VEHICLES_FILE, 'utf8'));
  return data.missingVehicles as MissingVehicle[];
}

/**
 * Convert Wix image slug to downloadable URL
 * Wix slugs like "909f4f_32c400a7981d4a669d0a97b3976e1abd~mv2.jpg" 
 * become "https://static.wixstatic.com/media/909f4f_32c400a7981d4a669d0a97b3976e1abd~mv2.jpg"
 */
function wixSlugToUrl(slug: string): string {
  // Remove any path prefix and get just the filename
  const filename = slug.split('/').pop() ?? slug;
  return `https://static.wixstatic.com/media/${filename}`;
}

/**
 * Parse Wix JSON image format
 * Format: [{"slug":"909f4f_xxx~mv2.jpg","src":"wix:image://v1/...","title":"image.jpg",...}]
 */
function parseWixJsonImages(jsonStr: string): string[] {
  try {
    const images = JSON.parse(jsonStr) as Array<{
      slug?: string;
      src?: string;
      title?: string;
    }>;
    
    const urls: string[] = [];
    
    for (const img of images) {
      if (img.slug) {
        // Use slug to construct URL
        urls.push(wixSlugToUrl(img.slug));
      } else if (img.src && img.src.startsWith('wix:image://')) {
        // Parse the wix:image:// protocol
        // Format: wix:image://v1/FILENAME/TITLE#params
        const match = img.src.match(/wix:image:\/\/v1\/([^/]+)\//);
        if (match && match[1]) {
          urls.push(wixSlugToUrl(match[1]));
        }
      }
    }
    
    return urls;
  } catch {
    return [];
  }
}

/**
 * Extract image URLs from CSV row data
 * Handles both formats:
 * 1. Standard URLs: "https://static.wixstatic.com/media/xxx; https://..."
 * 2. JSON format: [{"slug":"xxx","src":"wix:image://..."}]
 */
function extractImageUrls(imageData: string): string[] {
  if (!imageData) return [];
  
  const trimmed = imageData.trim();
  
  // Check if it's JSON format (starts with '[')
  if (trimmed.startsWith('[')) {
    return parseWixJsonImages(trimmed);
  } else {
    // Standard semicolon-separated URLs
    const urls: string[] = [];
    const parsedUrls = trimmed.split(';').map(url => url.trim()).filter(url => url.length > 0);
    for (const url of parsedUrls) {
      if (url.startsWith('http') && !url.includes('/video/')) {
        urls.push(url);
      }
    }
    return urls;
  }
}

/**
 * Load image URLs from CSV for a specific vehicle
 * Matches by Wix ID, but for non-unique IDs (like "Listed"), also matches by email + make/model
 */
async function getImageUrlsForVehicle(vehicle: MissingVehicle): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const urls: string[] = [];
    let found = false;
    
    const normalizeStr = (s: string) => s?.toLowerCase().trim() ?? '';
    
    fs.createReadStream(CONFIG.CSV_FILE)
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        if (found) return;
        
        const rowWixId = row['Wix ID'];
        const rowEmail = normalizeStr(row['Email'] as string);
        const rowMake = normalizeStr(row['Make'] as string);
        const rowModel = normalizeStr(row['Model'] as string);
        const rowYear = normalizeStr(row['Year of manufacture'] as string);
        
        // For numeric Wix IDs, match by ID only
        if (!vehicle.hasInvalidWixId && rowWixId === vehicle.wixId) {
          found = true;
          urls.push(...extractImageUrls(row['Upload vehicle images']));
          return;
        }
        
        // For non-numeric IDs (like "Listed"), match by email + make/model/year
        if (vehicle.hasInvalidWixId && 
            rowWixId === vehicle.wixId &&
            rowEmail === normalizeStr(vehicle.ownerEmail) &&
            rowMake === normalizeStr(vehicle.make) &&
            rowModel === normalizeStr(vehicle.model) &&
            rowYear === normalizeStr(vehicle.year)) {
          found = true;
          urls.push(...extractImageUrls(row['Upload vehicle images']));
          return;
        }
      })
      .on('end', () => resolve(urls))
      .on('error', reject);
  });
}

/**
 * Normalize registration number
 */
function normalizeRegistration(reg: string | null | undefined): string | null {
  if (!reg) return null;
  const normalized = reg.toUpperCase().replace(/[\s\-]/g, '');
  // Check for invalid values
  if (normalized === 'NA' || normalized === 'TBA' || normalized === 'N/A' || normalized.length < 2) {
    return null;
  }
  return normalized;
}

/**
 * Parse engine capacity to integer (in CC)
 */
function parseEngineCapacity(capacity: string): number | null {
  if (!capacity) return null;
  
  // Remove non-numeric except decimal point
  const cleaned = capacity.toLowerCase().replace(/[^0-9.]/g, '');
  const value = parseFloat(cleaned);
  
  if (isNaN(value)) return null;
  
  // If value is small (like 1.6, 2.0), it's in liters - convert to CC
  if (value < 100) {
    return Math.round(value * 1000);
  }
  
  return Math.round(value);
}

/**
 * Parse number of seats
 */
function parseSeats(seats: string): number | null {
  if (!seats) return null;
  const value = parseInt(seats);
  return isNaN(value) || value <= 0 ? null : value;
}

/**
 * Create slug from name
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Get or create a Make
 */
async function getOrCreateMake(name: string, stats: ImportStats): Promise<string> {
  const slug = createSlug(name);
  
  let make = await prisma.make.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: 'insensitive' } },
        { slug },
      ],
    },
  });
  
  if (!make) {
    if (CONFIG.DRY_RUN) {
      console.log(`  📦 Would create make: ${name}`);
      return 'dry-run-make-id';
    }
    
    make = await prisma.make.create({
      data: {
        name,
        slug,
        isActive: true,
        isPublished: true,
      },
    });
    stats.makesCreated++;
    console.log(`  📦 Created make: ${name}`);
  }
  
  return make.id;
}

/**
 * Get or create a Model
 */
async function getOrCreateModel(name: string, makeId: string, stats: ImportStats): Promise<string> {
  const slug = createSlug(name);
  
  let model = await prisma.model.findFirst({
    where: {
      makeId,
      OR: [
        { name: { equals: name, mode: 'insensitive' } },
        { slug },
      ],
    },
  });
  
  if (!model) {
    if (CONFIG.DRY_RUN) {
      console.log(`  📦 Would create model: ${name}`);
      return 'dry-run-model-id';
    }
    
    model = await prisma.model.create({
      data: {
        name,
        slug,
        makeId,
        isActive: true,
        isPublished: true,
      },
    });
    stats.modelsCreated++;
    console.log(`  📦 Created model: ${name}`);
  }
  
  return model.id;
}

/**
 * Get steering type ID
 * Maps CSV values to database steering types:
 * - "Right Hand Drive" -> RHD
 * - "Left Hand Drive" -> LHD  
 * - "Single-Seater" -> SS (Bike/Scooter)
 */
async function getSteeringId(steering: string): Promise<string | null> {
  if (!steering) return null;
  
  const normalized = steering.toLowerCase().trim();
  
  // Map CSV values to codes
  let code: string | null = null;
  if (normalized.includes('right')) {
    code = 'RHD';
  } else if (normalized.includes('left')) {
    code = 'LHD';
  } else if (normalized.includes('single') || normalized.includes('seater')) {
    code = 'SS';
  }
  
  if (!code) return null;
  
  const steeringType = await prisma.steeringType.findFirst({
    where: { code },
  });
  
  return steeringType?.id ?? null;
}

/**
 * Get country ID
 */
async function getCountryId(country: string): Promise<string | null> {
  if (!country) return null;
  
  const countryRecord = await prisma.country.findFirst({
    where: {
      OR: [
        { name: { contains: country, mode: 'insensitive' } },
        { code: { equals: country, mode: 'insensitive' } },
      ],
    },
  });
  
  return countryRecord?.id ?? null;
}

interface GeoResult {
  latitude: number;
  longitude: number;
}

/**
 * Geocode a UK postcode using postcodes.io API
 */
async function geocodePostcode(postcode: string): Promise<GeoResult | null> {
  if (!postcode) return null;
  
  const cleanPostcode = postcode.trim().toUpperCase().replace(/\s+/g, '');
  if (cleanPostcode.length < 3 || cleanPostcode.toLowerCase() === 'na') {
    return null;
  }
  
  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as {
      status: number;
      result?: {
        latitude: number;
        longitude: number;
      };
    };
    
    if (data.status === 200 && data.result) {
      return {
        latitude: data.result.latitude,
        longitude: data.result.longitude,
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

interface UserResult {
  userId: string;
  hasValidGeo: boolean;
}

/**
 * Get or create a User
 */
async function getOrCreateUser(vehicle: MissingVehicle, stats: ImportStats): Promise<UserResult> {
  if (!vehicle.ownerEmail) {
    throw new Error('Owner email is required');
  }
  
  const email = vehicle.ownerEmail.toLowerCase().trim();
  
  let user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (user) {
    stats.usersFound++;
    // Check if existing user has valid geo
    const hasValidGeo = user.latitude !== null && user.longitude !== null;
    return { userId: user.id, hasValidGeo };
  }
  
  if (CONFIG.DRY_RUN) {
    console.log(`  👤 Would create user: ${email}`);
    // In dry run, assume geo is valid if postcode exists
    const hasPostcode = vehicle.postcode && 
                        vehicle.postcode.toLowerCase() !== 'na' && 
                        vehicle.postcode.trim() !== '';
    return { userId: 'dry-run-user-id', hasValidGeo: !!hasPostcode };
  }
  
  // Parse first and last name
  const nameParts = vehicle.ownerName.split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') || null;
  
  // Get country ID
  const countryId = await getCountryId(vehicle.country);
  
  // Clean postcode
  const postcode = vehicle.postcode && vehicle.postcode.toLowerCase() !== 'na' ? vehicle.postcode : null;
  
  // Geocode the postcode
  let geoData: GeoResult | null = null;
  if (postcode) {
    geoData = await geocodePostcode(postcode);
    if (geoData) {
      console.log(`  📍 Geocoded postcode: ${postcode} → ${geoData.latitude.toFixed(4)}, ${geoData.longitude.toFixed(4)}`);
    } else {
      console.log(`  ⚠️  Failed to geocode postcode: ${postcode}`);
    }
  }
  
  user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      phone: vehicle.phone || null,
      street: null, // We don't have street in the CSV for these
      city: vehicle.city || null,
      county: vehicle.county || null,
      postcode,
      countryId,
      userType: 'OWNER_ONLY',
      status: 'ACTIVE',
      profileCompleted: true,
      // Geo fields
      latitude: geoData?.latitude ?? null,
      longitude: geoData?.longitude ?? null,
      geoUpdatedAt: geoData ? new Date() : null,
      geoSource: geoData ? 'postcodes.io' : null,
    },
  });
  
  stats.usersCreated++;
  console.log(`  👤 Created user: ${email}`);
  
  return { userId: user.id, hasValidGeo: geoData !== null };
}

interface StatusResult {
  status: VehicleStatus;
  reasons: string[];
}

interface StatusCheckParams {
  vehicle: MissingVehicle;
  hasImages: boolean;
  hasValidGeo?: boolean; // true if postcode was successfully geocoded
}

/**
 * Determine vehicle status based on data completeness
 * Returns status and reasons why it's DRAFT (if applicable)
 */
function determineVehicleStatus(params: StatusCheckParams): StatusResult {
  const { vehicle, hasImages, hasValidGeo } = params;
  const reasons: string[] = [];
  
  const hasPostcode = vehicle.postcode && 
                      vehicle.postcode.toLowerCase() !== 'na' && 
                      vehicle.postcode.trim() !== '';
  
  const hasRegistration = normalizeRegistration(vehicle.registration) !== null;
  
  // If we have geocoding result, use that; otherwise fall back to checking postcode string
  const postcodeValid = hasValidGeo !== undefined ? hasValidGeo : hasPostcode;
  
  if (!postcodeValid) {
    reasons.push('no postcode');
  }
  if (!hasImages) {
    reasons.push('no images');
  }
  if (!hasRegistration) {
    reasons.push('no registration');
  }
  
  return {
    status: reasons.length > 0 ? 'DRAFT' : 'PUBLISHED',
    reasons,
  };
}

/**
 * Download image from URL
 */
async function downloadImage(url: string, filename: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.log(`    ❌ Failed to download: HTTP ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.log(`    ❌ Failed to download: ${error}`);
    return null;
  }
}

/**
 * Process and resize image if needed
 */
async function processImage(buffer: Buffer): Promise<Buffer> {
  const sizeMB = buffer.length / (1024 * 1024);
  
  let sharpInstance = sharp(buffer).rotate(); // Auto-rotate based on EXIF
  
  if (sizeMB > CONFIG.MAX_IMAGE_SIZE_MB) {
    sharpInstance = sharpInstance.resize(CONFIG.RESIZE_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });
  }
  
  return sharpInstance.jpeg({ quality: 85, progressive: true }).toBuffer();
}

/**
 * Upload image to Supabase Storage
 */
async function uploadImageToSupabase(
  supabase: ReturnType<typeof createSupabaseClient>,
  buffer: Buffer,
  vehicleId: string,
  filename: string
): Promise<string | null> {
  try {
    // Sanitize filename
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_');
    
    const storagePath = `vehicles/${vehicleId}/${sanitizedFilename}`;
    
    const { error } = await supabase.storage
      .from(CONFIG.BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    if (error) {
      console.log(`    ❌ Upload failed: ${error.message}`);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from(CONFIG.BUCKET_NAME)
      .getPublicUrl(storagePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.log(`    ❌ Upload failed: ${error}`);
    return null;
  }
}

/**
 * Process a single vehicle
 */
async function processVehicle(
  vehicle: MissingVehicle,
  supabase: ReturnType<typeof createSupabaseClient>,
  stats: ImportStats
): Promise<void> {
  console.log(`\n🚗 Processing: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
  console.log(`   Wix ID: ${vehicle.wixId}${vehicle.hasInvalidWixId ? ' (non-numeric)' : ''}`);
  console.log(`   Owner: ${vehicle.ownerEmail}`);
  
  try {
    // Check if vehicle already exists (by registration or same owner + make/model/year)
    const normalizedReg = normalizeRegistration(vehicle.registration);
    
    if (normalizedReg) {
      const existingByReg = await prisma.vehicle.findFirst({
        where: { registration: normalizedReg },
      });
      
      if (existingByReg) {
        console.log(`   ⏭️  Skipping: Vehicle with registration ${normalizedReg} already exists`);
        stats.vehiclesSkipped++;
        return;
      }
    }
    
    // Get or create user
    const { userId, hasValidGeo } = await getOrCreateUser(vehicle, stats);
    
    // Get or create make and model
    const makeId = await getOrCreateMake(vehicle.make, stats);
    const modelId = await getOrCreateModel(vehicle.model, makeId, stats);
    
    // Get steering ID - default to RHD if not specified
    let steeringId = await getSteeringId(vehicle.steering);
    if (!steeringId) {
      // Default to RHD
      const rhdSteering = await prisma.steeringType.findFirst({ where: { code: 'RHD' } });
      steeringId = rhdSteering?.id ?? null;
    }
    
    // Check if this is a single-seater (bike/scooter)
    const isSingleSeater = vehicle.steering?.toLowerCase().includes('single');
    
    // Get image URLs
    let imageUrls: string[] = [];
    if (!CONFIG.SKIP_IMAGES && vehicle.hasImages) {
      imageUrls = await getImageUrlsForVehicle(vehicle);
      console.log(`   📸 Found ${imageUrls.length} image URLs`);
    }
    
    // Determine status (using actual geocoding result for postcode validation)
    const hasImages = imageUrls.length > 0;
    const { status, reasons } = determineVehicleStatus({ vehicle, hasImages, hasValidGeo });
    if (status === 'DRAFT') {
      console.log(`   📋 Status: ${status} (${reasons.join(', ')})`);
    } else {
      console.log(`   📋 Status: ${status}`);
    }
    
    // Use original condition text as description, set condition to "Good" for all
    const description = vehicle.condition?.trim() || null;
    const condition = 'Good';
    
    // Parse number of seats - default to 4 if not specified (unless single-seater)
    let numberOfSeats = parseSeats(vehicle.seats);
    if (numberOfSeats === null && !isSingleSeater) {
      numberOfSeats = 4;
    }
    
    // isRoadLegal - default to true if empty
    const isRoadLegalValue = vehicle.isRoadLegal?.trim().toLowerCase();
    const isRoadLegal = isRoadLegalValue === '' || !isRoadLegalValue ? true : isRoadLegalValue === 'yes';
    
    if (CONFIG.DRY_RUN) {
      console.log(`   🔍 DRY RUN: Would create vehicle`);
      stats.vehiclesCreated++;
      return;
    }
    
    // Create vehicle
    const createdVehicle = await prisma.vehicle.create({
      data: {
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        makeId,
        modelId,
        year: vehicle.year,
        registration: normalizedReg,
        engineCapacity: parseEngineCapacity(vehicle.engineCapacity),
        numberOfSeats,
        steeringId,
        gearbox: vehicle.gearbox || null,
        exteriorColour: vehicle.exteriorColour || null,
        interiorColour: vehicle.interiorColour || null,
        condition,
        isRoadLegal,
        status,
        description,
        ownerId: userId,
      },
    });
    
    console.log(`   ✅ Created vehicle: ${createdVehicle.id}`);
    stats.vehiclesCreated++;
    
    // Create VehicleSource record
    // For non-numeric IDs (like "Listed"), create a unique sourceId using email + vehicle details
    let sourceId = vehicle.wixId;
    if (vehicle.hasInvalidWixId) {
      // Create unique identifier: wixId_email_make_model_year
      const emailHash = vehicle.ownerEmail.toLowerCase().replace(/[^a-z0-9]/g, '');
      const makeSlug = vehicle.make.toLowerCase().replace(/[^a-z0-9]/g, '');
      const modelSlug = vehicle.model.toLowerCase().replace(/[^a-z0-9]/g, '');
      sourceId = `${vehicle.wixId}_${emailHash}_${makeSlug}_${modelSlug}_${vehicle.year}`;
    }
    
    await prisma.vehicleSource.create({
      data: {
        vehicleId: createdVehicle.id,
        sourceType: 'cleansed_import',
        sourceId,
        rawData: vehicle as unknown as Record<string, unknown>,
      },
    });
    
    // Process images
    let successfulUploads = 0;
    if (!CONFIG.SKIP_IMAGES && imageUrls.length > 0) {
      console.log(`   📥 Downloading and uploading ${imageUrls.length} images...`);
      
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i]!;
        const urlFilename = url.split('/').pop() ?? `image_${i + 1}.jpg`;
        
        console.log(`   [${i + 1}/${imageUrls.length}] ${urlFilename.substring(0, 40)}...`);
        
        // Download
        const imageBuffer = await downloadImage(url, urlFilename);
        if (!imageBuffer) {
          stats.imagesFailed++;
          continue;
        }
        stats.imagesDownloaded++;
        
        // Process (resize if needed)
        const processedBuffer = await processImage(imageBuffer);
        
        // Upload to Supabase
        const publicUrl = await uploadImageToSupabase(
          supabase,
          processedBuffer,
          createdVehicle.id,
          urlFilename
        );
        
        if (!publicUrl) {
          stats.imagesFailed++;
          continue;
        }
        
        // Create Media record
        await prisma.media.create({
          data: {
            type: 'IMAGE',
            originalUrl: url,
            publishedUrl: publicUrl,
            filename: urlFilename,
            fileSize: BigInt(processedBuffer.length),
            mimeType: 'image/jpeg',
            vehicleId: createdVehicle.id,
            order: successfulUploads + 1,
            isPrimary: successfulUploads === 0,
            isVisible: true,
            status: 'READY',
          },
        });
        
        successfulUploads++;
        stats.imagesUploaded++;
        console.log(`     ✅ Uploaded`);
      }
      
      // If vehicle was PUBLISHED but no images were successfully uploaded, update to DRAFT
      if (status === 'PUBLISHED' && successfulUploads === 0) {
        await prisma.vehicle.update({
          where: { id: createdVehicle.id },
          data: { status: 'DRAFT' },
        });
        console.log(`   ⚠️  Updated status to DRAFT (no images uploaded successfully)`);
      }
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ Error: ${errorMessage}`);
    stats.errors.push(`${vehicle.wixId}: ${errorMessage}`);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('\n🚀 Import Missing Vehicles Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Configuration:');
  console.log(`  Missing Vehicles File: ${CONFIG.MISSING_VEHICLES_FILE}`);
  console.log(`  CSV File: ${CONFIG.CSV_FILE}`);
  console.log(`  Dry Run: ${CONFIG.DRY_RUN ? 'YES (no changes will be made)' : 'no'}`);
  console.log(`  Limit: ${CONFIG.LIMIT ?? 'all'}`);
  console.log(`  Wix ID Filter: ${CONFIG.WIX_ID ?? 'all'}`);
  console.log(`  Skip Images: ${CONFIG.SKIP_IMAGES ? 'yes' : 'no'}`);
  console.log('');
  
  const stats: ImportStats = {
    totalProcessed: 0,
    usersCreated: 0,
    usersFound: 0,
    makesCreated: 0,
    modelsCreated: 0,
    vehiclesCreated: 0,
    vehiclesSkipped: 0,
    imagesDownloaded: 0,
    imagesUploaded: 0,
    imagesFailed: 0,
    errors: [],
  };
  
  try {
    // Initialize Supabase client
    let supabase: ReturnType<typeof createSupabaseClient> | null = null;
    if (!CONFIG.SKIP_IMAGES && !CONFIG.DRY_RUN) {
      supabase = createSupabaseClient();
      console.log('✅ Supabase client initialized\n');
    }
    
    // Load missing vehicles
    let vehicles = loadMissingVehicles();
    console.log(`📥 Loaded ${vehicles.length} missing vehicles\n`);
    
    // Apply filters
    if (CONFIG.WIX_ID) {
      vehicles = vehicles.filter(v => v.wixId === CONFIG.WIX_ID);
      console.log(`📋 Filtered to Wix ID ${CONFIG.WIX_ID}: ${vehicles.length} vehicles\n`);
    }
    
    if (CONFIG.LIMIT) {
      vehicles = vehicles.slice(0, CONFIG.LIMIT);
      console.log(`📋 Limited to first ${CONFIG.LIMIT} vehicles\n`);
    }
    
    // Process each vehicle
    for (const vehicle of vehicles) {
      await processVehicle(vehicle, supabase!, stats);
      stats.totalProcessed++;
    }
    
    // Display summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 IMPORT SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`Total processed:     ${stats.totalProcessed}`);
    console.log(`Users created:       ${stats.usersCreated}`);
    console.log(`Users found:         ${stats.usersFound}`);
    console.log(`Makes created:       ${stats.makesCreated}`);
    console.log(`Models created:      ${stats.modelsCreated}`);
    console.log(`Vehicles created:    ${stats.vehiclesCreated}`);
    console.log(`Vehicles skipped:    ${stats.vehiclesSkipped}`);
    console.log(`Images downloaded:   ${stats.imagesDownloaded}`);
    console.log(`Images uploaded:     ${stats.imagesUploaded}`);
    console.log(`Images failed:       ${stats.imagesFailed}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`);
      for (const error of stats.errors.slice(0, 10)) {
        console.log(`  - ${error}`);
      }
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more`);
      }
    }
    
    console.log('\n✅ Import complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
