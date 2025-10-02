const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

/**
 * Image processing utilities
 */
class ImageProcessor {
  constructor() {
    this.outputDir = path.join(__dirname, '../../images');
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
        timeout: 30000,
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
          resolve(filename);
        });
        writer.on('error', reject);
      });

    } catch (error) {
      console.error(`❌ Failed to download ${filename}:`, error.message);
      throw error;
    }
  }

  async processImagesFromData(data, idField = 'wixId') {
    const results = {
      successful: [],
      failed: [],
      skipped: 0,
      totalProcessed: 0
    };

    for (const record of data) {
      const recordId = record[idField];
      console.log(`\n🖼️  Processing images for record: ${recordId}`);

      if (!record.images || !record.images.urls || record.images.urls.length === 0) {
        console.log(`⚠️  No images found for record: ${recordId}`);
        results.skipped++;
        continue;
      }

      for (let i = 0; i < record.images.urls.length; i++) {
        const url = record.images.urls[i];
        const title = record.images.titles && record.images.titles[i]
          ? record.images.titles[i]
          : `image_${i + 1}`;

        const filename = `${recordId}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.jpeg`;

        try {
          await this.downloadImage(url, filename);
          results.successful.push({ recordId, filename, url });
        } catch (error) {
          results.failed.push({ recordId, filename, url, error: error.message });
        }
      }

      results.totalProcessed++;
    }

    return results;
  }

  getDownloadStats() {
    return {
      newDownloads: this.newDownloads,
      skippedImages: this.skippedImages,
      totalProcessed: this.downloadedImages.size
    };
  }
}

module.exports = ImageProcessor;
