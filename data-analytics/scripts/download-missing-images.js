const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

// Paths
const CSV_FILE = path.join(__dirname, '../data/cleansed_database.csv');
const CAR_IMAGES_DIR = path.join(__dirname, '../car-images');

// Stats
const stats = {
    totalAttempts: 0,
    successful: 0,
    failed: 0,
    alreadyExists: 0,
    errors: []
};

/**
 * Download image from URL to car-images directory
 */
async function downloadImage(url, filename) {
    try {
        const filePath = path.join(CAR_IMAGES_DIR, filename);
        
        // Check if file already exists
        if (fs.existsSync(filePath)) {
            console.log(`⏭️  Already exists: ${filename}`);
            stats.alreadyExists++;
            return true;
        }

        console.log(`📥 Downloading: ${filename}`);
        console.log(`   From: ${url}`);

        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 30000, // 30 second timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Downloaded successfully: ${filename}\n`);
                stats.successful++;
                resolve(true);
            });
            writer.on('error', (err) => {
                console.error(`❌ Error writing file ${filename}:`, err.message);
                stats.failed++;
                stats.errors.push({ filename, url, error: err.message });
                reject(err);
            });
        });
    } catch (error) {
        console.error(`❌ Failed to download ${filename}:`, error.message);
        stats.failed++;
        stats.errors.push({ filename, url, error: error.message });
        return false;
    }
}

/**
 * Fix malformed filenames by merging split parts
 */
function fixMalformedFilenames(imageFilenames) {
    const fixedFilenames = [];
    let i = 0;
    
    while (i < imageFilenames.length) {
        const current = imageFilenames[i];
        
        // Check if current is suspiciously short and next exists
        if (i < imageFilenames.length - 1) {
            const next = imageFilenames[i + 1];
            
            // If current ends with hex digits and is short, and next starts with common patterns
            if (current.length < 10 && 
                current.match(/^[a-f0-9]+$/) && 
                next.match(/^[a-z0-9_]+~mv2\./)) {
                // Likely a split filename - merge them
                fixedFilenames.push(current + next);
                i += 2; // Skip both
                continue;
            }
        }
        
        fixedFilenames.push(current);
        i++;
    }
    
    return fixedFilenames;
}

/**
 * Process a single record and download missing images
 */
async function processRecord(row, testMode = false) {
    const wixId = row['Wix ID'];
    const imageUrlsStr = row['Upload vehicle images'] || '';
    const imageTitlesStr = row['Image Titles'] || '';
    
    if (!imageUrlsStr || !imageTitlesStr) {
        return;
    }

    // Parse URLs and titles
    const imageUrls = imageUrlsStr.split(';').map(url => url.trim()).filter(url => url);
    let imageTitles = imageTitlesStr.split(';').map(title => title.trim()).filter(title => title);
    
    // Fix malformed filenames
    imageTitles = fixMalformedFilenames(imageTitles);
    
    // Download each missing image
    for (let i = 0; i < Math.min(imageUrls.length, imageTitles.length); i++) {
        const url = imageUrls[i];
        const filename = imageTitles[i];
        
        // Skip if not a valid image URL
        if (!url.includes('static.wixstatic.com') && !url.includes('wixstatic.com')) {
            console.log(`⏭️  Skipping non-image URL: ${url}\n`);
            continue;
        }
        
        // Skip if filename is malformed (too short or invalid)
        if (filename.length < 10 || !filename.includes('~mv2.')) {
            console.log(`⏭️  Skipping malformed filename: ${filename}\n`);
            continue;
        }
        
        stats.totalAttempts++;
        
        await downloadImage(url, filename);
        
        // In test mode, only download first image per record
        if (testMode) {
            break;
        }
    }
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const testMode = args.includes('--test');
    const testCount = testMode ? (parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 3) : null;
    const specificWixId = args.find(arg => arg.startsWith('--wix-id='))?.split('=')[1];
    
    console.log('🚀 Starting image download...\n');
    
    if (testMode) {
        console.log(`📋 TEST MODE: Will download ${testCount} missing images\n`);
    } else if (specificWixId) {
        console.log(`📋 Downloading images for Wix ID: ${specificWixId}\n`);
    } else {
        console.log('📋 Downloading ALL missing images\n');
    }
    
    // Ensure car-images directory exists
    if (!fs.existsSync(CAR_IMAGES_DIR)) {
        fs.mkdirSync(CAR_IMAGES_DIR, { recursive: true });
        console.log('✅ Created car-images directory\n');
    }
    
    return new Promise((resolve, reject) => {
        let recordsProcessed = 0;
        const records = [];
        
        // First, read all records
        fs.createReadStream(CSV_FILE)
            .pipe(csv())
            .on('data', (row) => {
                records.push(row);
            })
            .on('end', async () => {
                console.log(`📖 Found ${records.length} records in CSV\n`);
                console.log('='.repeat(60));
                
                try {
                    for (const row of records) {
                        // Filter by Wix ID if specified
                        if (specificWixId && row['Wix ID'] !== specificWixId) {
                            continue;
                        }
                        
                        await processRecord(row, testMode && recordsProcessed < testCount);
                        recordsProcessed++;
                        
                        // In test mode, stop after processing testCount records with images
                        if (testMode && stats.totalAttempts >= testCount) {
                            console.log(`\n📋 Test limit reached (${testCount} images attempted)\n`);
                            break;
                        }
                    }
                    
                    // Print summary
                    console.log('='.repeat(60));
                    console.log('\n📊 DOWNLOAD SUMMARY:');
                    console.log(`   Total attempts: ${stats.totalAttempts}`);
                    console.log(`   Successfully downloaded: ${stats.successful}`);
                    console.log(`   Already existed: ${stats.alreadyExists}`);
                    console.log(`   Failed: ${stats.failed}`);
                    
                    if (stats.errors.length > 0) {
                        console.log('\n❌ Errors:');
                        stats.errors.forEach((err, idx) => {
                            console.log(`   ${idx + 1}. ${err.filename}: ${err.error}`);
                        });
                    }
                    
                    console.log('\n✅ Download process complete!\n');
                    resolve();
                    
                } catch (error) {
                    console.error('\n❌ Error during processing:', error);
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.error('❌ Error reading CSV:', error);
                reject(error);
            });
    });
}

// Run the script
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { downloadImage, processRecord };







