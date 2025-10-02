const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');

class RecordsWithoutImagesAnalyzer {
  constructor() {
    this.inputFile = path.join(__dirname, '../data/web_site_catalog_products.csv');
    this.outputFile = path.join(__dirname, '../data/records_without_images_analysis.json');
    this.analysisResults = {
      totalRecordsWithoutImages: 0,
      recordsAnalyzed: [],
      potentialImageSources: {
        description: [],
        additionalInfo: [],
        customFields: [],
        otherFields: []
      },
      imagePatterns: {
        imgTags: [],
        srcAttributes: [],
        imageUrls: [],
        fileExtensions: [],
        wixReferences: []
      },
      suspiciousContent: [],
      recommendations: []
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

  searchForImagePatterns(text, fieldName) {
    if (!text || typeof text !== 'string') return [];

    const patterns = [];
    const lowerText = text.toLowerCase();

    // Search for various image patterns
    const imagePatterns = [
      // HTML img tags
      { pattern: /<img[^>]*>/gi, type: 'img_tag' },
      { pattern: /src\s*=\s*["'][^"']*["']/gi, type: 'src_attribute' },
      
      // Image file extensions
      { pattern: /\.(jpg|jpeg|png|gif|webp|svg)(\?[^"'\s]*)?/gi, type: 'file_extension' },
      
      // Wix specific patterns
      { pattern: /wixstatic\.com/gi, type: 'wix_reference' },
      { pattern: /~mv2/gi, type: 'wix_mv2' },
      { pattern: /wix:image:/gi, type: 'wix_protocol' },
      
      // General image URLs
      { pattern: /https?:\/\/[^\s"'<>]*\.(jpg|jpeg|png|gif|webp|svg)/gi, type: 'image_url' },
      
      // Base64 images
      { pattern: /data:image\/[^;]+;base64,/gi, type: 'base64_image' },
      
      // Image references in HTML
      { pattern: /background[^:]*:\s*url\([^)]*\)/gi, type: 'background_image' }
    ];

    imagePatterns.forEach(({ pattern, type }) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          patterns.push({
            type: type,
            match: match,
            field: fieldName,
            context: this.getContext(text, match, 50)
          });
        });
      }
    });

    return patterns;
  }

  getContext(text, match, contextLength = 50) {
    const index = text.indexOf(match);
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + match.length + contextLength);
    return text.substring(start, end);
  }

  analyzeRecord(record, index) {
    const handleId = record['﻿handleId'] || record['handleId'];
    const name = record['name'];
    const productImageUrl = record['productImageUrl'];
    
    // Only analyze records without images
    if (productImageUrl && productImageUrl.trim() !== '') {
      return null;
    }

    const recordAnalysis = {
      index: index,
      handleId: handleId,
      name: name,
      productImageUrl: productImageUrl,
      fieldsAnalyzed: {},
      totalImagePatterns: 0,
      suspiciousContent: []
    };

    // Analyze all fields for potential image data
    Object.keys(record).forEach(fieldName => {
      const fieldValue = record[fieldName];
      if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim() !== '') {
        const patterns = this.searchForImagePatterns(fieldValue, fieldName);
        
        if (patterns.length > 0) {
          recordAnalysis.fieldsAnalyzed[fieldName] = {
            value: fieldValue,
            patterns: patterns,
            patternCount: patterns.length
          };
          recordAnalysis.totalImagePatterns += patterns.length;

          // Categorize patterns
          patterns.forEach(pattern => {
            if (!this.analysisResults.imagePatterns[pattern.type]) {
              this.analysisResults.imagePatterns[pattern.type] = [];
            }
            this.analysisResults.imagePatterns[pattern.type].push({
              handleId: handleId,
              name: name,
              field: fieldName,
              match: pattern.match,
              context: pattern.context
            });
          });

          // Check for suspicious content
          if (fieldValue.length > 1000) {
            recordAnalysis.suspiciousContent.push({
              field: fieldName,
              reason: 'Very long content',
              length: fieldValue.length
            });
          }

          if (fieldValue.includes('<') && fieldValue.includes('>')) {
            recordAnalysis.suspiciousContent.push({
              field: fieldName,
              reason: 'Contains HTML tags',
              sample: fieldValue.substring(0, 200) + '...'
            });
          }
        }
      }
    });

    // Add all records without images to the analysis
    this.analysisResults.recordsAnalyzed.push(recordAnalysis);
    this.analysisResults.totalRecordsWithoutImages++;

    return recordAnalysis;
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze patterns found
    Object.entries(this.analysisResults.imagePatterns).forEach(([type, patterns]) => {
      if (patterns.length > 0) {
        recommendations.push({
          type: 'pattern_found',
          pattern: type,
          count: patterns.length,
          description: `Found ${patterns.length} instances of ${type} in records without images`,
          action: `Check these fields for hidden image data`
        });
      }
    });

    // Check for HTML content
    const htmlFields = this.analysisResults.recordsAnalyzed.filter(record => 
      Object.values(record.fieldsAnalyzed).some(field => 
        field.value.includes('<') && field.value.includes('>')
      )
    );

    if (htmlFields.length > 0) {
      recommendations.push({
        type: 'html_content',
        count: htmlFields.length,
        description: `${htmlFields.length} records contain HTML content that might have embedded images`,
        action: 'Parse HTML content to extract image references'
      });
    }

    // Check for long content
    const longContent = this.analysisResults.recordsAnalyzed.filter(record => 
      record.suspiciousContent.some(content => content.reason === 'Very long content')
    );

    if (longContent.length > 0) {
      recommendations.push({
        type: 'long_content',
        count: longContent.length,
        description: `${longContent.length} records have very long content that might contain image data`,
        action: 'Examine long content fields for hidden image references'
      });
    }

    this.analysisResults.recommendations = recommendations;
  }

  async analyze() {
    try {
      console.log('🚀 Starting analysis of records WITHOUT images...\n');
      
      console.log('📖 Reading and parsing CSV file...');
      const records = await this.parseCSV();
      
      console.log(`🔍 Analyzing records without images...`);
      
      let recordsWithoutImages = 0;
      let recordsWithPotentialImages = 0;
      
      records.forEach((record, index) => {
        const productImageUrl = record['productImageUrl'];
        
        // Count records without images
        if (!productImageUrl || productImageUrl.trim() === '') {
          recordsWithoutImages++;
          
          const analysis = this.analyzeRecord(record, index);
          if (analysis && analysis.totalImagePatterns > 0) {
            recordsWithPotentialImages++;
          }
        }
        
        if (index % 100 === 0) {
          console.log(`   Processed ${index + 1}/${records.length} records`);
        }
      });

      this.generateRecommendations();

      console.log('\n💾 Saving analysis report...');
      await fs.writeJson(this.outputFile, this.analysisResults, { spaces: 2 });
      
      // Display summary
      console.log('\n📊 Analysis Summary:');
      console.log(`   Total records without images: ${recordsWithoutImages}`);
      console.log(`   Records with potential image data: ${recordsWithPotentialImages}`);
      console.log(`   Records analyzed in detail: ${this.analysisResults.recordsAnalyzed.length}`);
      
      console.log('\n🔍 Image Patterns Found:');
      Object.entries(this.analysisResults.imagePatterns).forEach(([type, patterns]) => {
        if (patterns.length > 0) {
          console.log(`   ${type}: ${patterns.length} instances`);
        }
      });

      if (this.analysisResults.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        this.analysisResults.recommendations.forEach(rec => {
          console.log(`   • ${rec.description}`);
          console.log(`     Action: ${rec.action}`);
        });
      }

      console.log(`\n📄 Detailed report saved to: ${this.outputFile}`);
      console.log('\n🎉 Analysis completed successfully!');
      
    } catch (error) {
      console.error('\n💥 Analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new RecordsWithoutImagesAnalyzer();
  analyzer.analyze();
}

module.exports = RecordsWithoutImagesAnalyzer;
