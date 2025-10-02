const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');

class CsvToJsonConverter {
  constructor() {
    // When running in pipeline, files are in input/ and output/ directories
    // Check if we're in a run directory by looking for input/ and output/ folders
    this.isPipelineMode = fs.existsSync(path.join(__dirname, 'input')) && fs.existsSync(path.join(__dirname, 'output'));
    this.baseDir = this.isPipelineMode ? __dirname : path.join(__dirname, '../..');

    this.inputFile = path.join(this.baseDir, 'input', 'cleansed_database.csv');
    this.outputFile = path.join(this.baseDir, 'output', 'cleansed_database.json');
  }

  async parseCSV() {
    return new Promise((resolve, reject) => {
      const records = [];
      
      fs.createReadStream(this.inputFile)
        .pipe(csv())
        .on('data', (row) => {
          records.push(row);
        })
        .on('end', () => {
          console.log(`📖 Parsed ${records.length} records from CSV`);
          resolve(records);
        })
        .on('error', (error) => {
          console.error('❌ Error parsing CSV:', error);
          reject(error);
        });
    });
  }

  processImageUrls(imageUrlString) {
    if (!imageUrlString || imageUrlString.trim() === '') {
      return [];
    }

    // Check if this is a JSON string containing Wix image objects
    if (imageUrlString.trim().startsWith('[') && imageUrlString.includes('wix:image://')) {
      try {
        // Parse the JSON string
        const imageObjects = JSON.parse(imageUrlString);
        
        // Extract URLs from the image objects
        const urls = imageObjects
          .filter(obj => obj.src && obj.src.startsWith('wix:image://'))
          .map(obj => {
            // Convert wix:image:// URL to static.wixstatic.com URL
            const wixUrl = obj.src;
            const match = wixUrl.match(/wix:image:\/\/v1\/([^\/]+)/);
            if (match) {
              return `https://static.wixstatic.com/media/${match[1]}`;
            }
            return wixUrl; // fallback to original if conversion fails
          });
        
        return urls;
      } catch (error) {
        console.warn('Failed to parse JSON image string:', error.message);
        // Fall back to treating it as a regular URL string
      }
    }

    // Handle regular semicolon-separated URLs
    const urls = imageUrlString
      .split(';')
      .map(url => url.trim())
      .filter(url => url && url !== '')
      .map(url => {
        // Remove any extra spaces and ensure proper URL format
        return url.replace(/\s+/g, '');
      });

    return urls;
  }

  processImageTitles(imageTitleString) {
    if (!imageTitleString || imageTitleString.trim() === '') {
      return [];
    }

    // Check if this is a JSON string containing Wix image objects
    if (imageTitleString.trim().startsWith('[') && imageTitleString.includes('wix:image://')) {
      try {
        // Parse the JSON string
        const imageObjects = JSON.parse(imageTitleString);
        
        // Extract titles from the image objects
        const titles = imageObjects
          .filter(obj => obj.title)
          .map(obj => obj.title);
        
        return titles;
      } catch (error) {
        console.warn('Failed to parse JSON image titles:', error.message);
        // Fall back to treating it as a regular title string
      }
    }

    // Handle regular semicolon-separated titles
    const titles = imageTitleString
      .split(';')
      .map(title => title.trim())
      .filter(title => title && title !== '');

    return titles;
  }

  convertRecordToJson(csvRecord) {
    // Process the image URLs
    const imageUrls = this.processImageUrls(csvRecord['Upload vehicle images']);
    const imageTitles = this.processImageTitles(csvRecord['Image Titles']);

    // Create a clean JSON object with proper field names
    const jsonRecord = {
      wixId: csvRecord['Wix ID'],
      submissionTime: csvRecord['Submission time'],
      owner: {
        firstName: csvRecord['First name'],
        lastName: csvRecord['Last name'],
        email: csvRecord['Email'],
        phone: csvRecord['Phone'],
        address: {
          street: csvRecord['Street address'],
          city: csvRecord['City'],
          county: csvRecord['County'],
          postcode: csvRecord['Postcode'],
          country: csvRecord['Country']
        }
      },
      vehicle: {
        registration: csvRecord['Registration'],
        yearOfManufacture: csvRecord['Year of manufacture'],
        make: csvRecord['Make'],
        model: csvRecord['Model'],
        engineCapacity: csvRecord['Engine capacity'],
        numberOfSeats: csvRecord['Number of seats'],
        steering: csvRecord['Steering'],
        gearbox: csvRecord['Gearbox'],
        exteriorColour: csvRecord['Exterior Colour'],
        interiorColour: csvRecord['Interior Colour'],
        condition: csvRecord['Describe the condition'],
        isRoadLegal: csvRecord['Is this vehicle road legal?'],
        ownerConfirmation: csvRecord['I confirm I am the legal owner of this vehicle.']
      },
      images: {
        urls: imageUrls,
        titles: imageTitles,
        count: imageUrls.length
      }
    };

    return jsonRecord;
  }

  async convert() {
    try {
      console.log('🚀 Starting CSV to JSON conversion...\n');
      
      console.log('📖 Reading and parsing CSV file...');
      const csvRecords = await this.parseCSV();
      
      console.log(`🔄 Converting ${csvRecords.length} records to JSON format...`);
      
      const jsonRecords = csvRecords.map((record, index) => {
        if (index % 100 === 0) {
          console.log(`   Processing record ${index + 1}/${csvRecords.length}`);
        }
        return this.convertRecordToJson(record);
      });

      console.log('\n💾 Saving JSON file...');
      await fs.writeJson(this.outputFile, jsonRecords, { spaces: 2 });
      
      // Generate summary statistics
      const totalImages = jsonRecords.reduce((sum, record) => sum + record.images.count, 0);
      const recordsWithImages = jsonRecords.filter(record => record.images.count > 0).length;
      const recordsWithoutImages = jsonRecords.length - recordsWithImages;

      console.log('\n📊 Conversion Summary:');
      console.log(`   Total records converted: ${jsonRecords.length}`);
      console.log(`   Records with images: ${recordsWithImages}`);
      console.log(`   Records without images: ${recordsWithoutImages}`);
      console.log(`   Total images: ${totalImages}`);
      console.log(`   Output file: ${this.outputFile}`);
      
      console.log('\n🎉 CSV to JSON conversion completed successfully!');
      
    } catch (error) {
      console.error('\n💥 Conversion failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the converter
if (require.main === module) {
  const converter = new CsvToJsonConverter();
  converter.convert();
}

module.exports = CsvToJsonConverter;
