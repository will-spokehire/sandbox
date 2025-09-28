const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');

class CsvImageAnalyzer {
  constructor() {
    this.inputFile = path.join(__dirname, '../data/web_site_catalog_products.csv');
    this.outputFile = path.join(__dirname, '../data/csv_analysis_report.json');
    this.analysisResults = {
      totalRecords: 0,
      recordsWithImages: 0,
      recordsWithoutImages: 0,
      imageFormats: {},
      parsingIssues: [],
      sampleRecords: {
        withImages: [],
        withoutImages: [],
        problematic: []
      },
      statistics: {
        totalImages: 0,
        averageImagesPerProduct: 0,
        maxImagesInProduct: 0,
        minImagesInProduct: 0
      }
    };
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

  analyzeImageData(imageUrlString) {
    if (!imageUrlString || imageUrlString.trim() === '') {
      return {
        hasImages: false,
        imageCount: 0,
        imageUrls: [],
        format: 'none',
        issues: []
      };
    }

    const issues = [];
    let imageUrls = [];
    let format = 'unknown';

    try {
      // Check if it's a JSON string with Wix image objects
      if (imageUrlString.trim().startsWith('[') && imageUrlString.includes('wix:image://')) {
        format = 'json_wix_objects';
        const imageObjects = JSON.parse(imageUrlString);
        imageUrls = imageObjects
          .filter(obj => obj.src && obj.src.startsWith('wix:image://'))
          .map(obj => obj.src);
      } else {
        // Handle semicolon-separated URLs
        format = 'semicolon_separated';
        imageUrls = imageUrlString
          .split(';')
          .map(url => url.trim())
          .filter(url => url && url !== '');
      }

      // Analyze image formats
      imageUrls.forEach(url => {
        if (url.includes('~mv2.jpeg')) {
          this.analysisResults.imageFormats['mv2_jpeg'] = (this.analysisResults.imageFormats['mv2_jpeg'] || 0) + 1;
        } else if (url.includes('~mv2.jpg')) {
          this.analysisResults.imageFormats['mv2_jpg'] = (this.analysisResults.imageFormats['mv2_jpg'] || 0) + 1;
        } else if (url.includes('~mv2.png')) {
          this.analysisResults.imageFormats['mv2_png'] = (this.analysisResults.imageFormats['mv2_png'] || 0) + 1;
        } else if (url.includes('wix:image://')) {
          this.analysisResults.imageFormats['wix_image_protocol'] = (this.analysisResults.imageFormats['wix_image_protocol'] || 0) + 1;
        } else {
          this.analysisResults.imageFormats['other'] = (this.analysisResults.imageFormats['other'] || 0) + 1;
        }
      });

      // Check for potential issues
      if (imageUrls.length === 0) {
        issues.push('No valid image URLs found');
      }
      
      if (imageUrls.some(url => url.length > 200)) {
        issues.push('Some URLs are unusually long');
      }

      if (imageUrls.some(url => !url.includes('~mv2') && !url.includes('wix:image://'))) {
        issues.push('Some URLs don\'t match expected Wix format');
      }

    } catch (error) {
      issues.push(`JSON parsing error: ${error.message}`);
      format = 'error';
    }

    return {
      hasImages: imageUrls.length > 0,
      imageCount: imageUrls.length,
      imageUrls: imageUrls,
      format: format,
      issues: issues
    };
  }

  analyzeRecord(record, index) {
    const handleId = record['﻿handleId'] || record['handleId'];
    const name = record['name'];
    const productImageUrl = record['productImageUrl'];
    
    const imageAnalysis = this.analyzeImageData(productImageUrl);
    
    const recordAnalysis = {
      index: index,
      handleId: handleId,
      name: name,
      productImageUrl: productImageUrl,
      imageAnalysis: imageAnalysis,
      hasParsingIssues: imageAnalysis.issues.length > 0,
      recordLength: JSON.stringify(record).length,
      fieldCount: Object.keys(record).length
    };

    // Categorize the record
    if (imageAnalysis.hasImages) {
      this.analysisResults.recordsWithImages++;
      this.analysisResults.statistics.totalImages += imageAnalysis.imageCount;
      
      if (imageAnalysis.imageCount > this.analysisResults.statistics.maxImagesInProduct) {
        this.analysisResults.statistics.maxImagesInProduct = imageAnalysis.imageCount;
      }
      
      if (this.analysisResults.statistics.minImagesInProduct === 0 || imageAnalysis.imageCount < this.analysisResults.statistics.minImagesInProduct) {
        this.analysisResults.statistics.minImagesInProduct = imageAnalysis.imageCount;
      }

      // Store sample records with images
      if (this.analysisResults.sampleRecords.withImages.length < 5) {
        this.analysisResults.sampleRecords.withImages.push(recordAnalysis);
      }
    } else {
      this.analysisResults.recordsWithoutImages++;
      
      // Store sample records without images
      if (this.analysisResults.sampleRecords.withoutImages.length < 5) {
        this.analysisResults.sampleRecords.withoutImages.push(recordAnalysis);
      }
    }

    // Check for problematic records
    if (imageAnalysis.issues.length > 0 || recordAnalysis.recordLength > 10000) {
      this.analysisResults.parsingIssues.push({
        handleId: handleId,
        name: name,
        issues: imageAnalysis.issues,
        recordLength: recordAnalysis.recordLength,
        index: index
      });

      if (this.analysisResults.sampleRecords.problematic.length < 3) {
        this.analysisResults.sampleRecords.problematic.push(recordAnalysis);
      }
    }

    return recordAnalysis;
  }

  async analyze() {
    try {
      console.log('🚀 Starting CSV analysis for products with images...\n');
      
      console.log('📖 Reading and parsing CSV file...');
      const records = await this.parseCSV();
      
      console.log(`🔍 Analyzing ${records.length} records...`);
      
      this.analysisResults.totalRecords = records.length;
      
      records.forEach((record, index) => {
        if (index % 100 === 0) {
          console.log(`   Analyzing record ${index + 1}/${records.length}`);
        }
        this.analyzeRecord(record, index);
      });

      // Calculate statistics
      this.analysisResults.statistics.averageImagesPerProduct = 
        this.analysisResults.recordsWithImages > 0 
          ? (this.analysisResults.statistics.totalImages / this.analysisResults.recordsWithImages).toFixed(2)
          : 0;

      console.log('\n💾 Saving analysis report...');
      await fs.writeJson(this.outputFile, this.analysisResults, { spaces: 2 });
      
      // Display summary
      console.log('\n📊 Analysis Summary:');
      console.log(`   Total records analyzed: ${this.analysisResults.totalRecords}`);
      console.log(`   Records with images: ${this.analysisResults.recordsWithImages}`);
      console.log(`   Records without images: ${this.analysisResults.recordsWithoutImages}`);
      console.log(`   Total images found: ${this.analysisResults.statistics.totalImages}`);
      console.log(`   Average images per product: ${this.analysisResults.statistics.averageImagesPerProduct}`);
      console.log(`   Max images in a product: ${this.analysisResults.statistics.maxImagesInProduct}`);
      console.log(`   Min images in a product: ${this.analysisResults.statistics.minImagesInProduct}`);
      console.log(`   Parsing issues found: ${this.analysisResults.parsingIssues.length}`);
      
      console.log('\n🖼️  Image Formats Found:');
      Object.entries(this.analysisResults.imageFormats).forEach(([format, count]) => {
        console.log(`   ${format}: ${count} images`);
      });

      if (this.analysisResults.parsingIssues.length > 0) {
        console.log('\n⚠️  Parsing Issues:');
        this.analysisResults.parsingIssues.slice(0, 5).forEach(issue => {
          console.log(`   HandleId ${issue.handleId} (${issue.name}): ${issue.issues.join(', ')}`);
        });
      }

      console.log(`\n📄 Detailed report saved to: ${this.outputFile}`);
      console.log('\n🎉 CSV analysis completed successfully!');
      
    } catch (error) {
      console.error('\n💥 Analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new CsvImageAnalyzer();
  analyzer.analyze();
}

module.exports = CsvImageAnalyzer;
