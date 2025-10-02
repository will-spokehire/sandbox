const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const csv = require('csv-parser');

class CatalogImageProcessor {
  constructor() {
    this.inputFile = path.join(__dirname, '../data/web_site_catalog_products.csv');
    this.outputDir = path.join(__dirname, '../catalog_images');
    this.processedDataFile = path.join(__dirname, '../data/processed_catalog_products.json');
    this.noImagesFile = path.join(__dirname, '../data/catalog_products_without_images.json');
    this.downloadedImages = new Set();
    this.skippedImages = 0;
    this.newDownloads = 0;
    this.wixBaseUrl = 'https://static.wixstatic.com/media/';
  }

  async init() {
    // Ensure output directory exists
    await fs.ensureDir(this.outputDir);
    console.log('✅ Output directory created/verified');
  }

  constructWixUrl(filename) {
    // Remove any existing protocol or domain if present
    const cleanFilename = filename.replace(/^https?:\/\/[^\/]+\//, '');
    return `${this.wixBaseUrl}${cleanFilename}`;
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
      return `catalog_image_${timestamp}_${index}.jpg`;
    }
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

  async processProductImages(product, productIndex) {
    const updatedProduct = { ...product };
    
    if (product.productImageUrl && product.productImageUrl.trim()) {
      // Split by semicolon to get individual image filenames
      const imageFilenames = product.productImageUrl.split(';').map(f => f.trim()).filter(f => f);
      const localImagePaths = [];
      
      for (let i = 0; i < imageFilenames.length; i++) {
        const imageFilename = imageFilenames[i];
        
        try {
          // Construct full Wix URL
          const fullUrl = this.constructWixUrl(imageFilename);
          const filename = this.getImageFilename(fullUrl, i);
          await this.downloadImage(fullUrl, filename);
          localImagePaths.push(`catalog_images/${filename}`);
        } catch (error) {
          console.warn(`⚠️  Skipping image ${i} for product ${productIndex + 1}: ${error.message}`);
          // Keep original filename as fallback
          localImagePaths.push(imageFilename);
        }
      }
      
      updatedProduct.productImageUrl = localImagePaths.join(';');
    }
    
    return updatedProduct;
  }

  async parseCSV() {
    return new Promise((resolve, reject) => {
      const products = [];
      
      fs.createReadStream(this.inputFile)
        .pipe(csv())
        .on('data', (row) => {
          products.push(row);
        })
        .on('end', () => {
          console.log(`📖 Parsed ${products.length} products from CSV`);
          resolve(products);
        })
        .on('error', (error) => {
          console.error('❌ Error parsing CSV:', error);
          reject(error);
        });
    });
  }

  async processData() {
    try {
      console.log('📖 Reading and parsing CSV file...');
      const products = await this.parseCSV();
      
      console.log(`🛍️  Processing ${products.length} catalog products...`);
      
      const processedProducts = [];
      const productsWithoutImages = [];
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        console.log(`\n🔄 Processing product ${i + 1}/${products.length}: ${product.name} (ID: ${product.handleId})`);
        
        // Check if product has images
        const hasImages = product.productImageUrl && 
                         product.productImageUrl.trim() && 
                         product.productImageUrl.trim() !== '';
        
        if (hasImages) {
          const processedProduct = await this.processProductImages(product, i);
          processedProducts.push(processedProduct);
        } else {
          productsWithoutImages.push(product);
          console.log(`📝 Product has no images, adding to separate list`);
        }
      }
      
      // Save processed products with local image paths
      console.log('\n💾 Saving processed catalog products...');
      await fs.writeJson(this.processedDataFile, processedProducts, { spaces: 2 });
      console.log(`✅ Saved ${processedProducts.length} products with images to: ${this.processedDataFile}`);
      
      // Save products without images
      if (productsWithoutImages.length > 0) {
        console.log('\n💾 Saving catalog products without images...');
        await fs.writeJson(this.noImagesFile, productsWithoutImages, { spaces: 2 });
        console.log(`✅ Saved ${productsWithoutImages.length} products without images to: ${this.noImagesFile}`);
      } else {
        console.log('ℹ️  All products have images');
      }
      
      // Summary
      console.log('\n📊 Summary:');
      console.log(`   Total products processed: ${products.length}`);
      console.log(`   Products with images: ${processedProducts.length}`);
      console.log(`   Products without images: ${productsWithoutImages.length}`);
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
      console.log('🚀 Starting catalog image processing...\n');
      await this.init();
      await this.processData();
      console.log('\n🎉 Catalog processing completed successfully!');
    } catch (error) {
      console.error('\n💥 Processing failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the processor
if (require.main === module) {
  const processor = new CatalogImageProcessor();
  processor.run();
}

module.exports = CatalogImageProcessor;
