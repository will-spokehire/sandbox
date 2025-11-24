const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Paths
const CSV_FILE = path.join(__dirname, '../data/cleansed_database.csv');
const CAR_IMAGES_DIR = path.join(__dirname, '../car-images');
const OUTPUT_DIR = path.join(__dirname, '../reports');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Store results
const results = {
    totalRecords: 0,
    recordsWithImages: 0,
    recordsWithoutImages: 0,
    totalImagesExpected: 0,
    totalImagesFound: 0,
    totalImagesMissing: 0,
    missingImages: [],
    recordsWithMissingImages: [],
    malformedFilenames: []
};

// Get list of existing images in car-images directory
console.log('📂 Reading car-images directory...');
const existingImages = new Set();
if (fs.existsSync(CAR_IMAGES_DIR)) {
    const files = fs.readdirSync(CAR_IMAGES_DIR);
    files.forEach(file => {
        existingImages.add(file);
    });
    console.log(`✓ Found ${existingImages.size} images in car-images directory`);
} else {
    console.error('❌ car-images directory not found!');
    process.exit(1);
}

// Parse CSV and check for missing images
console.log('\n📋 Parsing CSV file...');
const stream = fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', (row) => {
        results.totalRecords++;
        
        // Get the Image Titles column (last column in the CSV)
        const imageTitles = row['Image Titles'] || '';
        
        if (!imageTitles || imageTitles.trim() === '') {
            results.recordsWithoutImages++;
            return;
        }
        
        results.recordsWithImages++;
        
        // Parse image filenames (separated by semicolons)
        let imageFilenames = imageTitles.split(';')
            .map(img => img.trim())
            .filter(img => img !== '');
        
        // Try to fix malformed filenames (where semicolon split a filename)
        // Pattern: short fragment followed by fragment starting with common prefixes
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
        
        imageFilenames = fixedFilenames;
        results.totalImagesExpected += imageFilenames.length;
        
        // Track missing images for this record
        const missingForRecord = [];
        
        imageFilenames.forEach(imageFilename => {
            // Detect malformed filenames (too short or suspicious patterns)
            const isMalformed = imageFilename.length < 10 || 
                               !imageFilename.includes('~mv2.') ||
                               imageFilename.match(/^[a-f0-9]{4,6}$/); // Just a partial hash
            
            if (isMalformed) {
                results.malformedFilenames.push({
                    filename: imageFilename,
                    wixId: row['Wix ID'],
                    registration: row['Registration'],
                    make: row['Make'],
                    model: row['Model']
                });
            }
            
            // Convert ~ to ~mv2. pattern since that's what's in the directory
            const normalizedFilename = imageFilename.replace(/~mv2\./, '~mv2.');
            
            // Check if image exists (case-insensitive)
            let found = false;
            let matchedImage = null;
            
            for (const existingImage of existingImages) {
                if (existingImage.toLowerCase() === normalizedFilename.toLowerCase()) {
                    found = true;
                    matchedImage = existingImage;
                    results.totalImagesFound++;
                    break;
                }
            }
            
            // If not found but malformed, try to find a partial match
            if (!found && isMalformed) {
                for (const existingImage of existingImages) {
                    // Check if this malformed filename is part of an existing image
                    if (existingImage.toLowerCase().includes(imageFilename.toLowerCase())) {
                        // Likely a split filename - don't count as truly missing
                        return;
                    }
                }
            }
            
            if (!found) {
                results.totalImagesMissing++;
                results.missingImages.push({
                    filename: imageFilename,
                    wixId: row['Wix ID'],
                    registration: row['Registration'],
                    make: row['Make'],
                    model: row['Model'],
                    malformed: isMalformed
                });
                missingForRecord.push(imageFilename);
            }
        });
        
        // If any images are missing for this record, track it
        if (missingForRecord.length > 0) {
            results.recordsWithMissingImages.push({
                wixId: row['Wix ID'],
                registration: row['Registration'],
                make: row['Make'],
                model: row['Model'],
                totalImages: imageFilenames.length,
                missingImages: missingForRecord,
                missingCount: missingForRecord.length
            });
        }
    })
    .on('end', () => {
        console.log('\n✓ CSV parsing complete\n');
        
        // Print summary
        console.log('=' .repeat(60));
        console.log('📊 SUMMARY REPORT');
        console.log('='.repeat(60));
        console.log(`\n📁 CSV Records:`);
        console.log(`   Total records: ${results.totalRecords}`);
        console.log(`   Records with images: ${results.recordsWithImages}`);
        console.log(`   Records without images: ${results.recordsWithoutImages}`);
        
        console.log(`\n🖼️  Images:`);
        console.log(`   Total images expected: ${results.totalImagesExpected}`);
        console.log(`   Images found: ${results.totalImagesFound}`);
        console.log(`   Images MISSING: ${results.totalImagesMissing}`);
        
        console.log(`\n🚗 Vehicle Records:`);
        console.log(`   Records with all images: ${results.recordsWithImages - results.recordsWithMissingImages.length}`);
        console.log(`   Records with missing images: ${results.recordsWithMissingImages.length}`);
        
        // Calculate percentages
        const imageFoundPercentage = results.totalImagesExpected > 0 
            ? ((results.totalImagesFound / results.totalImagesExpected) * 100).toFixed(2)
            : 0;
        const imageMissingPercentage = results.totalImagesExpected > 0 
            ? ((results.totalImagesMissing / results.totalImagesExpected) * 100).toFixed(2)
            : 0;
        
        console.log(`\n📈 Completion Rate:`);
        console.log(`   Images downloaded: ${imageFoundPercentage}%`);
        console.log(`   Images missing: ${imageMissingPercentage}%`);
        
        if (results.malformedFilenames.length > 0) {
            console.log(`\n⚠️  Data Quality Issues:`);
            console.log(`   Malformed filenames detected: ${results.malformedFilenames.length}`);
            console.log(`   (These may be due to CSV parsing issues with semicolons in filenames)`);
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Show some examples of missing images
        if (results.missingImages.length > 0) {
            // Separate truly missing from malformed
            const trulyMissing = results.missingImages.filter(img => !img.malformed);
            const malformedMissing = results.missingImages.filter(img => img.malformed);
            
            if (trulyMissing.length > 0) {
                console.log('\n❌ Truly Missing Images (first 10):');
                console.log('-'.repeat(60));
                trulyMissing.slice(0, 10).forEach((img, idx) => {
                    console.log(`${idx + 1}. ${img.filename}`);
                    console.log(`   Vehicle: ${img.make} ${img.model} (${img.registration})`);
                    console.log(`   Wix ID: ${img.wixId}\n`);
                });
                
                if (trulyMissing.length > 10) {
                    console.log(`   ... and ${trulyMissing.length - 10} more truly missing images`);
                }
            }
            
            if (malformedMissing.length > 0) {
                console.log('\n⚠️  Malformed Filenames (first 10):');
                console.log('-'.repeat(60));
                console.log('These are likely due to CSV data quality issues (semicolons in filenames):\n');
                malformedMissing.slice(0, 10).forEach((img, idx) => {
                    console.log(`${idx + 1}. ${img.filename}`);
                    console.log(`   Vehicle: ${img.make} ${img.model} (${img.registration})`);
                    console.log(`   Wix ID: ${img.wixId}\n`);
                });
                
                if (malformedMissing.length > 10) {
                    console.log(`   ... and ${malformedMissing.length - 10} more malformed filenames`);
                }
            }
        }
        
        // Show vehicle records with missing images
        if (results.recordsWithMissingImages.length > 0) {
            console.log('\n🚗 Vehicles with Missing Images (first 10):');
            console.log('-'.repeat(60));
            results.recordsWithMissingImages.slice(0, 10).forEach((record, idx) => {
                console.log(`${idx + 1}. ${record.make} ${record.model} (${record.registration})`);
                console.log(`   Wix ID: ${record.wixId}`);
                console.log(`   Missing: ${record.missingCount}/${record.totalImages} images`);
                console.log(`   Missing files: ${record.missingImages.slice(0, 3).join(', ')}`);
                if (record.missingImages.length > 3) {
                    console.log(`   ... and ${record.missingImages.length - 3} more`);
                }
                console.log('');
            });
            
            if (results.recordsWithMissingImages.length > 10) {
                console.log(`   ... and ${results.recordsWithMissingImages.length - 10} more vehicles with missing images`);
            }
        }
        
        // Save detailed report to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = path.join(OUTPUT_DIR, `missing-images-report-${timestamp}.json`);
        
        fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportFile}`);
        
        // Create a simple CSV report of missing images
        const csvReportFile = path.join(OUTPUT_DIR, `missing-images-${timestamp}.csv`);
        const csvLines = ['Filename,Wix ID,Registration,Make,Model'];
        results.missingImages.forEach(img => {
            csvLines.push(`"${img.filename}","${img.wixId}","${img.registration}","${img.make}","${img.model}"`);
        });
        fs.writeFileSync(csvReportFile, csvLines.join('\n'));
        console.log(`💾 CSV report saved to: ${csvReportFile}`);
        
        console.log('\n✅ Analysis complete!\n');
    })
    .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        process.exit(1);
    });

