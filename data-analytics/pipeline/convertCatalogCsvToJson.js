const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');

class CatalogCsvToJsonConverter {
  constructor() {
    // When running in pipeline, files are in input/ and output/ directories
    // Check if we're in a run directory by looking for input/ and output/ folders
    this.isPipelineMode = fs.existsSync(path.join(__dirname, 'input')) && fs.existsSync(path.join(__dirname, 'output'));
    this.baseDir = this.isPipelineMode ? __dirname : path.join(__dirname, '../..');

    this.inputFile = path.join(this.baseDir, 'input', 'web_site_catalog_products.csv');
    this.outputFile = path.join(this.baseDir, 'output', 'catalog_products.json');
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
          console.log(`📖 Parsed ${products.length} products from catalog CSV`);
          resolve(products);
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

    // Split by semicolon and clean up URLs
    const urls = imageUrlString
      .split(';')
      .map(url => url.trim())
      .filter(url => url && url !== '')
      .map(url => {
        // Convert to full Wix URL if it's just a filename
        if (!url.startsWith('http')) {
          return `https://static.wixstatic.com/media/${url}`;
        }
        return url;
      })
      // Remove duplicates and ensure uniqueness
      .filter((url, index, array) => array.indexOf(url) === index);

    return urls;
  }

  processCollections(collectionString) {
    if (!collectionString || collectionString.trim() === '') {
      return [];
    }

    return collectionString
      .split(';')
      .map(collection => collection.trim())
      .filter(collection => collection && collection !== '');
  }

  processProductOptions(csvRecord) {
    const options = [];
    
    // Process up to 6 product options
    for (let i = 1; i <= 6; i++) {
      const name = csvRecord[`productOptionName${i}`];
      const type = csvRecord[`productOptionType${i}`];
      const description = csvRecord[`productOptionDescription${i}`];
      
      if (name && name.trim() !== '') {
        options.push({
          name: name.trim(),
          type: type || 'TEXT',
          description: description || ''
        });
      }
    }
    
    return options;
  }

  processAdditionalInfo(csvRecord) {
    const additionalInfo = [];
    
    // Process up to 6 additional info sections
    for (let i = 1; i <= 6; i++) {
      const title = csvRecord[`additionalInfoTitle${i}`];
      const description = csvRecord[`additionalInfoDescription${i}`];
      
      if (title && title.trim() !== '') {
        additionalInfo.push({
          title: title.trim(),
          description: description || ''
        });
      }
    }
    
    return additionalInfo;
  }

  processCustomFields(csvRecord) {
    const customFields = [];
    
    // Process up to 2 custom text fields
    for (let i = 1; i <= 2; i++) {
      const field = csvRecord[`customTextField${i}`];
      const charLimit = csvRecord[`customTextCharLimit${i}`];
      const mandatory = csvRecord[`customTextMandatory${i}`];
      
      if (field && field.trim() !== '') {
        customFields.push({
          field: field.trim(),
          charLimit: charLimit ? parseInt(charLimit) : null,
          mandatory: mandatory === 'true' || mandatory === true
        });
      }
    }
    
    return customFields;
  }

  convertRecordToJson(csvRecord) {
    // Process the image URLs
    const imageUrls = this.processImageUrls(csvRecord['productImageUrl']);
    const collections = this.processCollections(csvRecord['collection']);
    const productOptions = this.processProductOptions(csvRecord);
    const additionalInfo = this.processAdditionalInfo(csvRecord);
    const customFields = this.processCustomFields(csvRecord);


    // Create a clean JSON object with ALL fields from CSV
    const jsonRecord = {
      // Basic product information
      handleId: csvRecord['﻿handleId'] || csvRecord['handleId'],
      fieldType: csvRecord['fieldType'],
      name: csvRecord['name'],
      description: csvRecord['description'],
      sku: csvRecord['sku'],
      brand: csvRecord['brand'],
      
      // Product details
      productImageUrl: csvRecord['productImageUrl'],
      collection: csvRecord['collection'],
      ribbon: csvRecord['ribbon'],
      
      // Pricing information
      price: csvRecord['price'] ? parseFloat(csvRecord['price']) : null,
      surcharge: csvRecord['surcharge'] ? parseFloat(csvRecord['surcharge']) : null,
      cost: csvRecord['cost'] ? parseFloat(csvRecord['cost']) : null,
      
      // Visibility and inventory
      visible: csvRecord['visible'] === 'true' || csvRecord['visible'] === true,
      inventory: csvRecord['inventory'],
      weight: csvRecord['weight'] ? parseFloat(csvRecord['weight']) : null,
      
      // Discount information
      discountMode: csvRecord['discountMode'],
      discountValue: csvRecord['discountValue'] ? parseFloat(csvRecord['discountValue']) : null,
      
      // Product options (all 6 options)
      productOptionName1: csvRecord['productOptionName1'],
      productOptionType1: csvRecord['productOptionType1'],
      productOptionDescription1: csvRecord['productOptionDescription1'],
      productOptionName2: csvRecord['productOptionName2'],
      productOptionType2: csvRecord['productOptionType2'],
      productOptionDescription2: csvRecord['productOptionDescription2'],
      productOptionName3: csvRecord['productOptionName3'],
      productOptionType3: csvRecord['productOptionType3'],
      productOptionDescription3: csvRecord['productOptionDescription3'],
      productOptionName4: csvRecord['productOptionName4'],
      productOptionType4: csvRecord['productOptionType4'],
      productOptionDescription4: csvRecord['productOptionDescription4'],
      productOptionName5: csvRecord['productOptionName5'],
      productOptionType5: csvRecord['productOptionType5'],
      productOptionDescription5: csvRecord['productOptionDescription5'],
      productOptionName6: csvRecord['productOptionName6'],
      productOptionType6: csvRecord['productOptionType6'],
      productOptionDescription6: csvRecord['productOptionDescription6'],
      
      // Additional information (all 6 sections)
      additionalInfoTitle1: csvRecord['additionalInfoTitle1'],
      additionalInfoDescription1: csvRecord['additionalInfoDescription1'],
      additionalInfoTitle2: csvRecord['additionalInfoTitle2'],
      additionalInfoDescription2: csvRecord['additionalInfoDescription2'],
      additionalInfoTitle3: csvRecord['additionalInfoTitle3'],
      additionalInfoDescription3: csvRecord['additionalInfoDescription3'],
      additionalInfoTitle4: csvRecord['additionalInfoTitle4'],
      additionalInfoDescription4: csvRecord['additionalInfoDescription4'],
      additionalInfoTitle5: csvRecord['additionalInfoTitle5'],
      additionalInfoDescription5: csvRecord['additionalInfoDescription5'],
      additionalInfoTitle6: csvRecord['additionalInfoTitle6'],
      additionalInfoDescription6: csvRecord['additionalInfoDescription6'],
      
      // Custom text fields
      customTextField1: csvRecord['customTextField1'],
      customTextCharLimit1: csvRecord['customTextCharLimit1'] ? parseInt(csvRecord['customTextCharLimit1']) : null,
      customTextMandatory1: csvRecord['customTextMandatory1'] === 'true' || csvRecord['customTextMandatory1'] === true,
      customTextField2: csvRecord['customTextField2'],
      customTextCharLimit2: csvRecord['customTextCharLimit2'] ? parseInt(csvRecord['customTextCharLimit2']) : null,
      customTextMandatory2: csvRecord['customTextMandatory2'] === 'true' || csvRecord['customTextMandatory2'] === true,
      
      // Processed/structured data for easier access
      processed: {
        collections: collections,
        options: productOptions,
        additionalInfo: additionalInfo,
        customFields: customFields,
        images: {
          urls: imageUrls,
          count: imageUrls.length
        }
      }
    };

    return jsonRecord;
  }

  async convert() {
    try {
      console.log('🚀 Starting catalog CSV to JSON conversion...\n');
      
      console.log('📖 Reading and parsing catalog CSV file...');
      const csvProducts = await this.parseCSV();
      
      console.log(`🔄 Converting ${csvProducts.length} products to JSON format...`);
      
      const jsonProducts = csvProducts.map((record, index) => {
        if (index % 100 === 0) {
          console.log(`   Processing product ${index + 1}/${csvProducts.length}`);
        }
        return this.convertRecordToJson(record);
      });

      console.log('\n💾 Saving JSON file...');
      await fs.writeJson(this.outputFile, jsonProducts, { spaces: 2 });
      
      // Generate summary statistics
      const totalImages = jsonProducts.reduce((sum, product) => sum + product.processed.images.count, 0);
      const productsWithImages = jsonProducts.filter(product => product.processed.images.count > 0).length;
      const productsWithoutImages = jsonProducts.length - productsWithImages;
      const totalCollections = [...new Set(jsonProducts.flatMap(p => p.processed.collections))].length;
      const totalOptions = jsonProducts.reduce((sum, product) => sum + product.processed.options.length, 0);

      console.log('\n📊 Conversion Summary:');
      console.log(`   Total products converted: ${jsonProducts.length}`);
      console.log(`   Products with images: ${productsWithImages}`);
      console.log(`   Products without images: ${productsWithoutImages}`);
      console.log(`   Total images: ${totalImages}`);
      console.log(`   Total collections: ${totalCollections}`);
      console.log(`   Total product options: ${totalOptions}`);
      console.log(`   Output file: ${this.outputFile}`);
      
      console.log('\n🎉 Catalog CSV to JSON conversion completed successfully!');
      
    } catch (error) {
      console.error('\n💥 Conversion failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the converter
if (require.main === module) {
  const converter = new CatalogCsvToJsonConverter();
  converter.convert();
}

module.exports = CatalogCsvToJsonConverter;
