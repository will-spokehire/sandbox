const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

class ImageProcessor {
  constructor() {
    this.inputFile = path.join(__dirname, '../data/submission.from.1march.2025.json');
    this.outputDir = path.join(__dirname, '../images');
    this.processedDataFile = path.join(__dirname, '../data/processed_vehicles.json');
    this.noImagesFile = path.join(__dirname, '../data/vehicles_without_images.json');
    this.downloadedImages = new Set();
    this.skippedImages = 0;
    this.newDownloads = 0;
  }

  async init() {
    // Ensure output directory exists
    await fs.ensureDir(this.outputDir);
    console.log('✅ Output directory created/verified');
  }

  async downloadImage(url, filename) {
    try {
      const filePath = path.join(this.outputDir, filename);
      
      // Check if file already exists locally
      if (await fs.pathExists(filePath)) {
        console.log(`⏭️  Skipping (already exists): ${filename}`);
        this.downloadedImages.add(url);
        this.skippedImages++;
        return filename;
      }

      // Skip if already downloaded in this session
      if (this.downloadedImages.has(url)) {
        return filename;
      }

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
          this.downloadedImages.add(url);
          this.newDownloads++;
          console.log(`📥 Downloaded: ${filename}`);
          resolve(filename);
        });
        writer.on('error', (err) => {
          console.error(`❌ Error downloading ${filename}:`, err.message);
          reject(err);
        });
      });
    } catch (error) {
      console.error(`❌ Failed to download ${url}:`, error.message);
      throw error;
    }
  }

  getImageFilename(url, index = 0) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = path.extname(pathname) || '.jpg';
      const baseName = path.basename(pathname, extension);
      
      // Create a safe filename
      const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
      return `${safeName}_${index}${extension}`;
    } catch (error) {
      // Fallback if URL parsing fails
      const timestamp = Date.now();
      return `image_${timestamp}_${index}.jpg`;
    }
  }

  async processVehicleImages(vehicle, vehicleIndex) {
    const updatedVehicle = { ...vehicle };
    
    if (vehicle.upload_vehicle_images && Array.isArray(vehicle.upload_vehicle_images)) {
      const localImagePaths = [];
      
      for (let i = 0; i < vehicle.upload_vehicle_images.length; i++) {
        const imageUrl = vehicle.upload_vehicle_images[i];
        
        try {
          const filename = this.getImageFilename(imageUrl, i);
          await this.downloadImage(imageUrl, filename);
          localImagePaths.push(`images/${filename}`);
        } catch (error) {
          console.warn(`⚠️  Skipping image ${i} for vehicle ${vehicleIndex + 1}: ${error.message}`);
          // Keep original URL as fallback
          localImagePaths.push(imageUrl);
        }
      }
      
      updatedVehicle.upload_vehicle_images = localImagePaths;
    }
    
    return updatedVehicle;
  }

  async processData() {
    try {
      console.log('📖 Reading input file...');
      const rawData = await fs.readFile(this.inputFile, 'utf8');
      const vehicles = JSON.parse(rawData);
      
      console.log(`🚗 Processing ${vehicles.length} vehicles...`);
      
      const processedVehicles = [];
      const vehiclesWithoutImages = [];
      
      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        console.log(`\n🔄 Processing vehicle ${i + 1}/${vehicles.length}: ${vehicle.first_name_1} ${vehicle.last_name_de76}`);
        
        // Check if vehicle has images
        const hasImages = vehicle.upload_vehicle_images && 
                         Array.isArray(vehicle.upload_vehicle_images) && 
                         vehicle.upload_vehicle_images.length > 0;
        
        if (hasImages) {
          const processedVehicle = await this.processVehicleImages(vehicle, i);
          processedVehicles.push(processedVehicle);
        } else {
          vehiclesWithoutImages.push(vehicle);
          console.log(`📝 Vehicle has no images, adding to separate list`);
        }
      }
      
      // Save processed vehicles with local image paths
      console.log('\n💾 Saving processed vehicles...');
      await fs.writeJson(this.processedDataFile, processedVehicles, { spaces: 2 });
      console.log(`✅ Saved ${processedVehicles.length} vehicles with images to: ${this.processedDataFile}`);
      
      // Save vehicles without images
      if (vehiclesWithoutImages.length > 0) {
        console.log('\n💾 Saving vehicles without images...');
        await fs.writeJson(this.noImagesFile, vehiclesWithoutImages, { spaces: 2 });
        console.log(`✅ Saved ${vehiclesWithoutImages.length} vehicles without images to: ${this.noImagesFile}`);
      } else {
        console.log('ℹ️  All vehicles have images');
      }
      
      // Summary
      console.log('\n📊 Summary:');
      console.log(`   Total vehicles processed: ${vehicles.length}`);
      console.log(`   Vehicles with images: ${processedVehicles.length}`);
      console.log(`   Vehicles without images: ${vehiclesWithoutImages.length}`);
      console.log(`   Total images processed: ${this.downloadedImages.size}`);
      console.log(`   New downloads: ${this.newDownloads}`);
      console.log(`   Skipped (already exist): ${this.skippedImages}`);
      console.log(`   Images saved to: ${this.outputDir}`);
      
    } catch (error) {
      console.error('❌ Error processing data:', error);
      throw error;
    }
  }

  async run() {
    try {
      console.log('🚀 Starting image processing...\n');
      await this.init();
      await this.processData();
      console.log('\n🎉 Processing completed successfully!');
    } catch (error) {
      console.error('\n💥 Processing failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the processor
if (require.main === module) {
  const processor = new ImageProcessor();
  processor.run();
}

module.exports = ImageProcessor;
