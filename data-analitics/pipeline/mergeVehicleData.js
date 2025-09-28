const fs = require('fs-extra');
const path = require('path');

class VehicleDataMerger {
  constructor() {
    // When running in pipeline, files are in input/ and output/ directories
    // Check if we're in a run directory by looking for input/ and output/ folders
    this.isPipelineMode = fs.existsSync(path.join(__dirname, 'input')) && fs.existsSync(path.join(__dirname, 'output'));
    this.baseDir = this.isPipelineMode ? __dirname : path.join(__dirname, '../..');
    
    this.catalogFile = path.join(this.baseDir, 'output', 'catalog_products.json');
    this.cleansedFile = path.join(this.baseDir, 'output', 'cleansed_database.json');
    this.submissionFile = path.join(this.baseDir, 'input', 'submission.from.1march.2025.json');
    this.outputFile = path.join(this.baseDir, 'output', 'final_vehicle_catalog.json');
    
    this.catalogData = [];
    this.cleansedData = [];
    this.submissionData = [];
    this.finalData = [];
    
    this.stats = {
      catalogRecords: 0,
      cleansedRecords: 0,
      submissionRecords: 0,
      matchedRecords: 0,
      unmatchedCatalog: 0,
      unmatchedCleansed: 0,
      unmatchedSubmission: 0
    };
  }

  async init() {
    console.log('🚀 Starting Vehicle Data Merger...');
    await this.loadData();
    await this.mergeData();
    await this.saveResults();
    this.printStats();
  }

  async loadData() {
    console.log('📂 Loading data files...');
    
    try {
      // Load catalog products (website published data)
      const catalogContent = await fs.readFile(this.catalogFile, 'utf8');
      this.catalogData = JSON.parse(catalogContent);
      this.stats.catalogRecords = this.catalogData.length;
      console.log(`✅ Loaded ${this.stats.catalogRecords} catalog records`);

      // Load cleansed database (processed data)
      const cleansedContent = await fs.readFile(this.cleansedFile, 'utf8');
      this.cleansedData = JSON.parse(cleansedContent);
      this.stats.cleansedRecords = this.cleansedData.length;
      console.log(`✅ Loaded ${this.stats.cleansedRecords} cleansed records`);

      // Load submission data (raw submissions)
      const submissionContent = await fs.readFile(this.submissionFile, 'utf8');
      this.submissionData = JSON.parse(submissionContent);
      this.stats.submissionRecords = this.submissionData.length;
      console.log(`✅ Loaded ${this.stats.submissionRecords} submission records`);

    } catch (error) {
      console.error('❌ Error loading data:', error.message);
      throw error;
    }
  }

  // Create a mapping key for matching records
  createMappingKey(record, source) {
    if (source === 'catalog') {
      return record.handleId;
    } else if (source === 'cleansed') {
      return record.wixId;
    } else if (source === 'submission') {
      // For submission data, use call_time as the registration
      return record.call_time;
    }
    return null;
  }

  // Normalize vehicle data for consistent structure
  normalizeVehicleData(record, source) {
    const normalized = {
      id: null,
      source: source,
      status: 'unknown',
      vehicle: {},
      owner: {},
      images: {},
      metadata: {},
      rawData: {}
    };

    if (source === 'catalog') {
      normalized.id = record.handleId;
      normalized.status = record.visible ? 'published' : 'unpublished';
      // Extract data from product options first, then fall back to description
      const make = record.productOptionDescription6 || ''; // Manufacturer
      const seats = record.productOptionDescription3 || this.extractSeatsFromDescription(record.additionalInfoDescription1);
      const steering = record.productOptionDescription4 || this.extractSteeringFromDescription(record.additionalInfoDescription1);
      const gearbox = record.productOptionDescription5 || this.extractGearboxFromDescription(record.additionalInfoDescription1);
      const exteriorFromOptions = this.extractColorFromDescription(record.productOptionDescription1);
      const exteriorFromDescription = this.extractExteriorFromDescription(record.additionalInfoDescription1);
      const exteriorColour = exteriorFromOptions || exteriorFromDescription;

      normalized.vehicle = {
        name: record.name,
        make: make,
        model: record.name,
        year: this.extractYearFromDescription(record.additionalInfoDescription1),
        registration: this.extractRegistrationFromDescription(record.additionalInfoDescription1),
        engineCapacity: this.extractEngineFromDescription(record.additionalInfoDescription1),
        numberOfSeats: seats,
        steering: steering,
        gearbox: gearbox,
        exteriorColour: exteriorColour,
        interiorColour: this.extractInteriorFromDescription(record.additionalInfoDescription1),
        condition: '',
        isRoadLegal: 'Yes',
        price: record.price,
        collection: record.collection,
        visible: record.visible,
        inventory: record.inventory,
        published: (record.visible === true || record.visible === null) && (record.inventory === null || record.inventory === undefined || record.inventory === '' || record.inventory !== 'OutOfStock')
      };
      normalized.images = {
        urls: this.processImageUrls(record.productImageUrl),
        count: 0
      };
      normalized.images.count = normalized.images.urls.length;
      normalized.metadata = {
        fieldType: record.fieldType,
        sku: record.sku,
        brand: record.brand,
        ribbon: record.ribbon,
        surcharge: record.surcharge,
        cost: record.cost,
        weight: record.weight,
        discountMode: record.discountMode,
        discountValue: record.discountValue
      };
      normalized.rawData = record;

    } else if (source === 'cleansed') {
      normalized.id = record.wixId;
      normalized.status = 'processed';
      normalized.vehicle = {
        name: `${record.vehicle.make} ${record.vehicle.model}`,
        make: record.vehicle.make,
        model: record.vehicle.model,
        year: record.vehicle.yearOfManufacture,
        registration: record.vehicle.registration,
        engineCapacity: record.vehicle.engineCapacity,
        numberOfSeats: record.vehicle.numberOfSeats,
        steering: record.vehicle.steering,
        gearbox: record.vehicle.gearbox,
        exteriorColour: record.vehicle.exteriorColour,
        interiorColour: record.vehicle.interiorColour,
        condition: record.vehicle.condition,
        isRoadLegal: record.vehicle.isRoadLegal,
        price: null,
        collection: null,
        visible: null,
        inventory: null
      };
      normalized.owner = {
        firstName: record.owner.firstName,
        lastName: record.owner.lastName,
        email: record.owner.email,
        phone: record.owner.phone,
        address: record.owner.address
      };
      normalized.images = {
        urls: record.images.urls || [],
        titles: record.images.titles || [],
        count: record.images.count || 0
      };
      normalized.metadata = {
        submissionTime: record.submissionTime
      };
      normalized.rawData = record;

    } else if (source === 'submission') {
      normalized.id = record.call_time;
      normalized.status = 'submitted';
      normalized.vehicle = {
        name: `${record.make_1} ${record.location_1}`,
        make: record.make_1,
        model: record.location_1,
        year: record.year_of_manufacture_1,
        registration: record.call_time,
        engineCapacity: record.engine_capacity,
        numberOfSeats: record.number_of_seats_1,
        steering: record.steering_1,
        gearbox: record.gearbox_1,
        exteriorColour: record.exterior_colour_1,
        interiorColour: record.interior_colour_1,
        condition: record.project_brief_1,
        isRoadLegal: record.is_this_vehicle_road_legal,
        price: null,
        collection: null,
        visible: null,
        inventory: null
      };
      normalized.owner = {
        firstName: record.first_name_1,
        lastName: record.last_name_de76,
        email: record.email_4bec,
        phone: record.phone_bc17,
        address: {
          street: record.your_address,
          city: record.city_1,
          county: record.county_1,
          postcode: record.postcode,
          country: record.country
        }
      };
      normalized.images = {
        urls: record.upload_vehicle_images || [],
        count: record.upload_vehicle_images ? record.upload_vehicle_images.length : 0
      };
      normalized.metadata = {
        convertible: record.convertible,
        formField: record.form_field_a664
      };
      normalized.rawData = record;
    }

    return normalized;
  }

  // Helper methods to extract data from catalog descriptions
  extractYearFromDescription(description) {
    if (!description) return '';
    // Try multiple patterns for year extraction (HTML and plain text formats)
    const patterns = [
      // HTML format patterns
      /<strong>Year[^>]*>\s*:\s*(\d{4})/i,
      /Year[^>]*>\s*:\s*(\d{4})/i,
      // Plain text format patterns
      /Year\s*:\s*(\d{4})/i,
      /Year\s*[:\s]*(\d{4})/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) return match[1];
    }
    return '';
  }

  extractRegistrationFromDescription(description) {
    if (!description) return '';
    const regMatch = description.match(/Registration\s*[:\s]*([A-Z0-9\s]+)/i);
    return regMatch ? regMatch[1].trim() : '';
  }

  extractEngineFromDescription(description) {
    if (!description) return '';
    // Try multiple patterns for engine extraction (HTML and plain text formats)
    const patterns = [
      // HTML format patterns
      /<strong>Engine&nbsp;<\/strong>\s*:\s*&nbsp;\s*([0-9.]+L?)/i,
      /<strong>Engine[^>]*>\s*:\s*([0-9.]+L?)/i,
      /Engine[^>]*>\s*:\s*([0-9.]+L?)/i,
      // Plain text format patterns
      /Engine\s*:\s*([0-9.]+(?:L|cc)?)/i,
      /Engine\s*[:\s]*([0-9.]+(?:L|cc)?)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) return match[1];
    }
    return '';
  }

  extractColorFromDescription(colorDescription) {
    if (!colorDescription) return '';
    const colorMatch = colorDescription.match(/#[0-9a-fA-F]{6}:([^,]+)/);
    return colorMatch ? colorMatch[1] : colorDescription;
  }

  extractInteriorFromDescription(description) {
    if (!description) return '';
    // Try multiple patterns for interior extraction (HTML and plain text formats)
    const patterns = [
      // HTML format patterns
      /<strong>Interior[^>]*>\s*:\s*([^<\n]+)/i,
      /Interior[^>]*>\s*:\s*([^<\n]+)/i,
      // Plain text format patterns
      /Interior\s*:\s*([^\n]+)/i,
      /Interior\s*[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const result = match[1].trim();
        // Clean up HTML entities and extra whitespace
        const cleaned = result.replace(/&nbsp;/g, '').replace(/\s+/g, ' ').trim();
        // Only return if we have actual content (not just whitespace/entities)
        if (cleaned && cleaned !== '') {
          return cleaned;
        }
      }
    }
    return '';
  }

  extractSteeringFromDescription(description) {
    if (!description) return '';
    // Try multiple patterns for steering extraction (HTML and plain text formats)
    const patterns = [
      // HTML format patterns
      /<strong>Steering[^>]*>\s*:\s*([^<\n]+)/i,
      /Steering[^>]*>\s*:\s*([^<\n]+)/i,
      // Plain text format patterns
      /Steering\s*:\s*([^\n]+)/i,
      /Steering\s*[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const result = match[1].trim();
        // Clean up HTML entities and extra whitespace
        const cleaned = result.replace(/&nbsp;/g, '').replace(/\s+/g, ' ').trim();
        if (cleaned && cleaned !== '') {
          return cleaned;
        }
      }
    }
    return '';
  }

  extractGearboxFromDescription(description) {
    if (!description) return '';
    // Try multiple patterns for gearbox extraction (HTML and plain text formats)
    const patterns = [
      // HTML format patterns
      /<strong>Gearbox[^>]*>\s*:\s*([^<\n]+)/i,
      /Gearbox[^>]*>\s*:\s*([^<\n]+)/i,
      // Plain text format patterns
      /Gearbox\s*:\s*([^\n]+)/i,
      /Gearbox\s*[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const result = match[1].trim();
        // Clean up HTML entities and extra whitespace
        const cleaned = result.replace(/&nbsp;/g, '').replace(/\s+/g, ' ').trim();
        if (cleaned && cleaned !== '') {
          return cleaned;
        }
      }
    }
    return '';
  }

  extractSeatsFromDescription(description) {
    if (!description) return '';
    // Try multiple patterns for seats extraction (HTML and plain text formats)
    const patterns = [
      // HTML format patterns
      /<strong>Seats[^>]*>\s*:\s*([^<\n]+)/i,
      /Seats[^>]*>\s*:\s*([^<\n]+)/i,
      // Plain text format patterns
      /Seats\s*:\s*([^\n]+)/i,
      /Seats\s*[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const result = match[1].trim();
        // Clean up HTML entities and extra whitespace
        const cleaned = result.replace(/&nbsp;/g, '').replace(/\s+/g, ' ').trim();
        if (cleaned && cleaned !== '') {
          return cleaned;
        }
      }
    }
    return '';
  }

  extractExteriorFromDescription(description) {
    if (!description) return '';
    // Try multiple patterns for exterior extraction (HTML and plain text formats)
    const patterns = [
      // HTML format patterns
      /<strong>Exterior[^>]*>\s*:\s*([^<\n]+)/i,
      /Exterior[^>]*>\s*:\s*([^<\n]+)/i,
      // Plain text format patterns
      /Exterior\s*:\s*([^\n]+)/i,
      /Exterior\s*[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const result = match[1].trim();
        // Clean up HTML entities and extra whitespace
        const cleaned = result.replace(/&nbsp;/g, '').replace(/\s+/g, ' ').trim();
        if (cleaned && cleaned !== '') {
          return cleaned;
        }
      }
    }
    return '';
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

  async mergeData() {
    console.log('🔄 Merging data...');
    
    // Create lookup maps for efficient matching
    const catalogMap = new Map();
    const cleansedMap = new Map();
    const submissionMap = new Map();

    // Build lookup maps
    this.catalogData.forEach(record => {
      const key = this.createMappingKey(record, 'catalog');
      if (key) catalogMap.set(key, record);
    });

    this.cleansedData.forEach(record => {
      const key = this.createMappingKey(record, 'cleansed');
      if (key) cleansedMap.set(key, record);
    });

    this.submissionData.forEach(record => {
      const key = this.createMappingKey(record, 'submission');
      if (key) submissionMap.set(key, record);
    });

    // Process each catalog record (primary source)
    for (const catalogRecord of this.catalogData) {
      const catalogKey = this.createMappingKey(catalogRecord, 'catalog');
      if (!catalogKey) continue;

      const finalRecord = {
        id: catalogKey,
        primarySource: 'catalog',
        sources: ['catalog'],
        vehicle: this.normalizeVehicleData(catalogRecord, 'catalog'),
        cleansedData: null,
        submissionData: null,
        matchStatus: 'catalog_only'
      };

      // Try to find matching cleansed data
      const cleansedRecord = cleansedMap.get(catalogKey);
      if (cleansedRecord) {
        finalRecord.cleansedData = this.normalizeVehicleData(cleansedRecord, 'cleansed');
        finalRecord.sources.push('cleansed');
        finalRecord.matchStatus = 'catalog_cleansed';
        this.stats.matchedRecords++;
      }

      // Try to find matching submission data (by registration)
      const vehicleRegistration = finalRecord.vehicle.vehicle.registration;
      if (vehicleRegistration) {
        const submissionRecord = submissionMap.get(vehicleRegistration);
        if (submissionRecord) {
          finalRecord.submissionData = this.normalizeVehicleData(submissionRecord, 'submission');
          finalRecord.sources.push('submission');
          finalRecord.matchStatus = 'catalog_cleansed_submission';
        }
      }

      this.finalData.push(finalRecord);
    }

    // Process cleansed records that don't have catalog matches
    for (const cleansedRecord of this.cleansedData) {
      const cleansedKey = this.createMappingKey(cleansedRecord, 'cleansed');
      if (!cleansedKey) continue;

      // Check if already processed
      const existingRecord = this.finalData.find(r => r.id === cleansedKey);
      if (existingRecord) continue;

      const finalRecord = {
        id: cleansedKey,
        primarySource: 'cleansed',
        sources: ['cleansed'],
        vehicle: this.normalizeVehicleData(cleansedRecord, 'cleansed'),
        cleansedData: this.normalizeVehicleData(cleansedRecord, 'cleansed'),
        submissionData: null,
        matchStatus: 'cleansed_only'
      };

      // Try to find matching submission data
      const vehicleRegistration = finalRecord.vehicle.vehicle.registration;
      if (vehicleRegistration) {
        const submissionRecord = submissionMap.get(vehicleRegistration);
        if (submissionRecord) {
          finalRecord.submissionData = this.normalizeVehicleData(submissionRecord, 'submission');
          finalRecord.sources.push('submission');
          finalRecord.matchStatus = 'cleansed_submission';
        }
      }

      this.finalData.push(finalRecord);
      this.stats.unmatchedCleansed++;
    }

    // Process submission records that don't have matches
    for (const submissionRecord of this.submissionData) {
      const submissionKey = this.createMappingKey(submissionRecord, 'submission');
      if (!submissionKey) continue;

      // Check if already processed
      const existingRecord = this.finalData.find(r => 
        r.submissionData && r.submissionData.id === submissionKey
      );
      if (existingRecord) continue;

      const finalRecord = {
        id: submissionKey,
        primarySource: 'submission',
        sources: ['submission'],
        vehicle: this.normalizeVehicleData(submissionRecord, 'submission'),
        cleansedData: null,
        submissionData: this.normalizeVehicleData(submissionRecord, 'submission'),
        matchStatus: 'submission_only'
      };

      this.finalData.push(finalRecord);
      this.stats.unmatchedSubmission++;
    }

    // Calculate final stats
    this.stats.unmatchedCatalog = this.finalData.filter(r => r.matchStatus === 'catalog_only').length;
  }

  async saveResults() {
    console.log('💾 Saving results...');
    
    const output = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRecords: this.finalData.length,
        stats: this.stats,
        sources: {
          catalog: this.catalogFile,
          cleansed: this.cleansedFile,
          submission: this.submissionFile
        }
      },
      records: this.finalData
    };

    await fs.writeJson(this.outputFile, output, { spaces: 2 });
    console.log(`✅ Results saved to ${this.outputFile}`);
  }

  printStats() {
    console.log('\n📊 MERGE STATISTICS');
    console.log('==================');
    console.log(`🏪 Catalog Records: ${this.stats.catalogRecords}`);
    console.log(`🔧 Cleansed Records: ${this.stats.cleansedRecords}`);
    console.log(`📝 Submission Records: ${this.stats.submissionRecords}`);
    console.log(`🔗 Matched Records: ${this.stats.matchedRecords}`);
    console.log(`📋 Total Final Records: ${this.finalData.length}`);
    console.log('\n📈 MATCH BREAKDOWN');
    console.log('==================');
    console.log(`🏪 Catalog Only: ${this.stats.unmatchedCatalog}`);
    console.log(`🔧 Cleansed Only: ${this.stats.unmatchedCleansed}`);
    console.log(`📝 Submission Only: ${this.stats.unmatchedSubmission}`);
    
    const matchTypes = {};
    this.finalData.forEach(record => {
      matchTypes[record.matchStatus] = (matchTypes[record.matchStatus] || 0) + 1;
    });
    
    console.log('\n🎯 MATCH TYPES');
    console.log('==============');
    Object.entries(matchTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
  }
}

// Run the merger
async function main() {
  try {
    const merger = new VehicleDataMerger();
    await merger.init();
    console.log('\n✅ Vehicle data merge completed successfully!');
  } catch (error) {
    console.error('❌ Error during merge:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = VehicleDataMerger;
