const fs = require('fs-extra');
const path = require('path');

class SophisticatedVehicleMatcher {
  constructor() {
    // When running in pipeline, files are in input/ and output/ directories
    // Check if we're in a run directory by looking for input/ and output/ folders
    this.isPipelineMode = fs.existsSync(path.join(__dirname, 'input')) && fs.existsSync(path.join(__dirname, 'output'));
    this.baseDir = this.isPipelineMode ? __dirname : path.join(__dirname, '../..');
    
    this.catalogFile = path.join(this.baseDir, 'output', 'catalog_products.json');
    this.cleansedFile = path.join(this.baseDir, 'output', 'cleansed_database.json');
    this.submissionFile = path.join(this.baseDir, 'input', 'submission.from.1march.2025.json');
    this.patternsFile = path.join(this.baseDir, 'output', 'matching_patterns_analysis.json');
    this.outputFile = path.join(this.baseDir, 'output', 'improved_vehicle_catalog.json');
    
    this.catalogData = [];
    this.cleansedData = [];
    this.submissionData = [];
    this.patternsData = null;
    this.finalData = [];
    
    this.stats = {
      totalRecords: 0,
      perfectMatches: 0,
      partialMatches: 0,
      unmatchedRecords: 0,
      multipleVehicleOwners: 0,
      crossSourceMatches: 0
    };
  }

  async init() {
    console.log('🚀 Starting Improved Vehicle Matcher with Data Normalization...');
    await this.loadData();
    await this.buildMatchingIndexes();
    await this.performSophisticatedMatching();
    await this.saveResults();
    this.printStats();
  }

  async loadData() {
    console.log('📂 Loading data files...');
    
    try {
      // Load all data sources
      const catalogContent = await fs.readFile(this.catalogFile, 'utf8');
      this.catalogData = JSON.parse(catalogContent);

      const cleansedContent = await fs.readFile(this.cleansedFile, 'utf8');
      this.cleansedData = JSON.parse(cleansedContent);

      const submissionContent = await fs.readFile(this.submissionFile, 'utf8');
      this.submissionData = JSON.parse(submissionContent);

      // Load patterns analysis
      const patternsContent = await fs.readFile(this.patternsFile, 'utf8');
      this.patternsData = JSON.parse(patternsContent);

      console.log(`✅ Loaded ${this.catalogData.length} catalog, ${this.cleansedData.length} cleansed, ${this.submissionData.length} submission records`);

    } catch (error) {
      console.error('❌ Error loading data:', error.message);
      throw error;
    }
  }

  async buildMatchingIndexes() {
    console.log('🔍 Building matching indexes...');
    
    this.indexes = {
      catalog: {
        byHandleId: new Map(),
        byMake: new Map(),
        byRegistration: new Map(),
        byNormalizedRegistration: new Map()
      },
      cleansed: {
        byWixId: new Map(),
        byEmail: new Map(),
        byEmailMake: new Map(),
        byRegistration: new Map(),
        byNormalizedRegistration: new Map()
      },
      submission: {
        byCallTime: new Map(),
        byEmail: new Map(),
        byEmailMake: new Map(),
        byNormalizedRegistration: new Map()
      }
    };

    // Build catalog indexes
    this.catalogData.forEach(record => {
      const handleId = record.handleId;
      const make = this.extractMakeFromCatalog(record);
      const registration = this.extractRegistrationFromCatalog(record);
      const normalizedRegistration = this.normalizeRegistration(registration);

      this.indexes.catalog.byHandleId.set(handleId, record);
      
      if (make) {
        if (!this.indexes.catalog.byMake.has(make)) {
          this.indexes.catalog.byMake.set(make, []);
        }
        this.indexes.catalog.byMake.get(make).push(record);
      }

      if (registration) {
        this.indexes.catalog.byRegistration.set(registration, record);
      }

      if (normalizedRegistration) {
        this.indexes.catalog.byNormalizedRegistration.set(normalizedRegistration, record);
      }
    });

    // Build cleansed indexes
    this.cleansedData.forEach(record => {
      const wixId = record.wixId;
      const email = record.owner?.email?.toLowerCase().trim();
      const make = record.vehicle?.make?.toLowerCase().trim();
      const registration = record.vehicle?.registration;
      const normalizedRegistration = this.normalizeRegistration(registration);

      this.indexes.cleansed.byWixId.set(wixId, record);

      if (email) {
        if (!this.indexes.cleansed.byEmail.has(email)) {
          this.indexes.cleansed.byEmail.set(email, []);
        }
        this.indexes.cleansed.byEmail.get(email).push(record);

        if (make) {
          const emailMakeKey = `${email}|${make}`;
          if (!this.indexes.cleansed.byEmailMake.has(emailMakeKey)) {
            this.indexes.cleansed.byEmailMake.set(emailMakeKey, []);
          }
          this.indexes.cleansed.byEmailMake.get(emailMakeKey).push(record);
        }
      }

      if (registration) {
        this.indexes.cleansed.byRegistration.set(registration, record);
      }

      if (normalizedRegistration) {
        this.indexes.cleansed.byNormalizedRegistration.set(normalizedRegistration, record);
      }
    });

    // Build submission indexes
    this.submissionData.forEach(record => {
      const callTime = record.call_time;
      const email = record.email_4bec?.toLowerCase().trim();
      const make = record.make_1?.toLowerCase().trim();
      const normalizedRegistration = this.normalizeRegistration(callTime);

      this.indexes.submission.byCallTime.set(callTime, record);

      if (email) {
        if (!this.indexes.submission.byEmail.has(email)) {
          this.indexes.submission.byEmail.set(email, []);
        }
        this.indexes.submission.byEmail.get(email).push(record);

        if (make) {
          const emailMakeKey = `${email}|${make}`;
          if (!this.indexes.submission.byEmailMake.has(emailMakeKey)) {
            this.indexes.submission.byEmailMake.set(emailMakeKey, []);
          }
          this.indexes.submission.byEmailMake.get(emailMakeKey).push(record);
        }
      }

      if (normalizedRegistration) {
        this.indexes.submission.byNormalizedRegistration.set(normalizedRegistration, record);
      }
    });

    console.log('✅ Indexes built successfully');
  }

  async performSophisticatedMatching() {
    console.log('🔄 Performing sophisticated matching...');
    
    const processedRecords = new Set();
    const ownerGroups = new Map();

    // First pass: Process perfect matches from patterns analysis
    const perfectMatches = this.patternsData.analysis.combinedPatterns.potentialMatches
      .filter(match => match.matches.score >= 6); // High confidence matches

    console.log(`🎯 Processing ${perfectMatches.length} high-confidence matches...`);

    perfectMatches.forEach(match => {
      const email = match.email;
      const cleansedVehicle = match.cleansedVehicle;
      const submissionVehicle = match.submissionVehicle;

      // Find the actual records
      const cleansedRecord = this.cleansedData.find(r => r.wixId === cleansedVehicle.wixId);
      const submissionRecord = this.submissionData.find(r => r.call_time === submissionVehicle.call_time);
      const catalogRecord = this.indexes.catalog.byHandleId.get(cleansedVehicle.wixId);

      if (cleansedRecord && submissionRecord) {
        const finalRecord = this.createMatchedRecord({
          primarySource: 'cleansed',
          cleansedRecord,
          submissionRecord,
          catalogRecord,
          matchType: 'email_make_perfect',
          matchScore: match.matches.score
        });

        this.finalData.push(finalRecord);
        processedRecords.add(cleansedVehicle.wixId);
        processedRecords.add(submissionVehicle.call_time);
        if (catalogRecord) processedRecords.add(catalogRecord.handleId);

        // Track owner groups
        if (!ownerGroups.has(email)) {
          ownerGroups.set(email, []);
        }
        ownerGroups.get(email).push(finalRecord);
      }
    });

    // Second pass: Process remaining cleansed records
    this.cleansedData.forEach(record => {
      if (processedRecords.has(record.wixId)) return;

      const email = record.owner?.email?.toLowerCase().trim();
      const make = record.vehicle?.make?.toLowerCase().trim();
      const registration = record.vehicle?.registration;

      // Try to find matches
      let bestMatch = null;
      let bestScore = 0;

      // Check for catalog match by handleId
      const catalogRecord = this.indexes.catalog.byHandleId.get(record.wixId);
      if (catalogRecord) {
        bestMatch = { type: 'catalog', record: catalogRecord, score: 10 };
      }

      // Check for submission matches by email+make
      if (email && make) {
        const emailMakeKey = `${email}|${make}`;
        const submissionMatches = this.indexes.submission.byEmailMake.get(emailMakeKey) || [];
        
        submissionMatches.forEach(submissionRecord => {
          if (processedRecords.has(submissionRecord.call_time)) return;
          
          const score = this.calculateMatchScore(record, submissionRecord);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { type: 'submission', record: submissionRecord, score };
          }
        });
      }

      // Check for submission matches by registration (exact and normalized)
      if (registration) {
        // Try exact match first
        const submissionRecord = this.indexes.submission.byCallTime.get(registration);
        if (submissionRecord && !processedRecords.has(submissionRecord.call_time)) {
          const score = this.calculateMatchScore(record, submissionRecord);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { type: 'submission', record: submissionRecord, score };
          }
        }

        // Try normalized registration match
        const normalizedReg = this.normalizeRegistration(registration);
        const normalizedSubmissionRecord = this.indexes.submission.byNormalizedRegistration.get(normalizedReg);
        if (normalizedSubmissionRecord && !processedRecords.has(normalizedSubmissionRecord.call_time)) {
          const score = this.calculateMatchScore(record, normalizedSubmissionRecord);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { type: 'submission', record: normalizedSubmissionRecord, score };
          }
        }
      }

      // Create final record
      const finalRecord = this.createMatchedRecord({
        primarySource: 'cleansed',
        cleansedRecord: record,
        submissionRecord: bestMatch?.type === 'submission' ? bestMatch.record : null,
        catalogRecord: bestMatch?.type === 'catalog' ? bestMatch.record : catalogRecord,
        matchType: bestMatch ? `cleansed_${bestMatch.type}` : 'cleansed_only',
        matchScore: bestMatch?.score || 0
      });

      this.finalData.push(finalRecord);
      processedRecords.add(record.wixId);
      if (bestMatch?.record?.call_time) processedRecords.add(bestMatch.record.call_time);
      if (catalogRecord) processedRecords.add(catalogRecord.handleId);

      // Track owner groups
      if (email) {
        if (!ownerGroups.has(email)) {
          ownerGroups.set(email, []);
        }
        ownerGroups.get(email).push(finalRecord);
      }
    });

    // Third pass: Process remaining submission records
    this.submissionData.forEach(record => {
      if (processedRecords.has(record.call_time)) return;

      const finalRecord = this.createMatchedRecord({
        primarySource: 'submission',
        cleansedRecord: null,
        submissionRecord: record,
        catalogRecord: null,
        matchType: 'submission_only',
        matchScore: 0
      });

      this.finalData.push(finalRecord);
      processedRecords.add(record.call_time);

      // Track owner groups
      const email = record.email_4bec?.toLowerCase().trim();
      if (email) {
        if (!ownerGroups.has(email)) {
          ownerGroups.set(email, []);
        }
        ownerGroups.get(email).push(finalRecord);
      }
    });

    // Fourth pass: Process remaining catalog records
    this.catalogData.forEach(record => {
      if (processedRecords.has(record.handleId)) return;

      const finalRecord = this.createMatchedRecord({
        primarySource: 'catalog',
        cleansedRecord: null,
        submissionRecord: null,
        catalogRecord: record,
        matchType: 'catalog_only',
        matchScore: 0
      });

      this.finalData.push(finalRecord);
      processedRecords.add(record.handleId);
    });

    // Analyze owner groups
    this.analyzeOwnerGroups(ownerGroups);
  }

  createMatchedRecord({ primarySource, cleansedRecord, submissionRecord, catalogRecord, matchType, matchScore }) {
    const record = {
      id: this.generateUniqueId(cleansedRecord, submissionRecord, catalogRecord),
      primarySource,
      matchType,
      matchScore,
      sources: [],
      vehicle: null,
      cleansedData: null,
      submissionData: null,
      catalogData: null,
      owner: null,
      images: { urls: [], count: 0 },
      metadata: {
        createdAt: new Date().toISOString(),
        matchConfidence: this.getMatchConfidence(matchScore)
      }
    };

    // Add sources
    if (cleansedRecord) record.sources.push('cleansed');
    if (submissionRecord) record.sources.push('submission');
    if (catalogRecord) record.sources.push('catalog');

    // Normalize and merge vehicle data
    record.vehicle = this.mergeVehicleData(cleansedRecord, submissionRecord, catalogRecord);
    record.owner = this.mergeOwnerData(cleansedRecord, submissionRecord);
    record.images = this.mergeImageData(cleansedRecord, submissionRecord, catalogRecord);

    // Store raw data for reference
    if (cleansedRecord) record.cleansedData = cleansedRecord;
    if (submissionRecord) record.submissionData = submissionRecord;
    if (catalogRecord) record.catalogData = catalogRecord;

    return record;
  }

  mergeVehicleData(cleansedRecord, submissionRecord, catalogRecord) {
    const vehicle = {
      name: '',
      make: '',
      model: '',
      year: '',
      registration: '',
      engineCapacity: '',
      numberOfSeats: '',
      steering: '',
      gearbox: '',
      exteriorColour: '',
      interiorColour: '',
      condition: '',
      isRoadLegal: '',
      price: null,
      collection: '',
      visible: null,
      inventory: null
    };

    // Priority: cleansed > submission > catalog
    if (cleansedRecord?.vehicle) {
      const v = cleansedRecord.vehicle;
      vehicle.name = `${v.make} ${v.model}`;
      vehicle.make = v.make || '';
      vehicle.model = v.model || '';
      vehicle.year = v.yearOfManufacture || '';
      vehicle.registration = v.registration || '';
      vehicle.engineCapacity = v.engineCapacity || '';
      vehicle.numberOfSeats = v.numberOfSeats || '';
      vehicle.steering = v.steering || '';
      vehicle.gearbox = v.gearbox || '';
      vehicle.exteriorColour = v.exteriorColour || '';
      vehicle.interiorColour = v.interiorColour || '';
      vehicle.condition = v.condition || '';
      vehicle.isRoadLegal = v.isRoadLegal || '';
    }

    if (submissionRecord && !vehicle.make) {
      vehicle.name = `${submissionRecord.make_1} ${submissionRecord.location_1}`;
      vehicle.make = submissionRecord.make_1 || '';
      vehicle.model = submissionRecord.location_1 || '';
      vehicle.year = submissionRecord.year_of_manufacture_1 || '';
      vehicle.registration = submissionRecord.call_time || '';
      vehicle.engineCapacity = submissionRecord.engine_capacity || '';
      vehicle.numberOfSeats = submissionRecord.number_of_seats_1 || '';
      vehicle.steering = submissionRecord.steering_1 || '';
      vehicle.gearbox = submissionRecord.gearbox_1 || '';
      vehicle.exteriorColour = submissionRecord.exterior_colour_1 || '';
      vehicle.interiorColour = submissionRecord.interior_colour_1 || '';
      vehicle.condition = submissionRecord.project_brief_1 || '';
      vehicle.isRoadLegal = submissionRecord.is_this_vehicle_road_legal || '';
    }

    if (catalogRecord && !vehicle.make) {
      vehicle.name = catalogRecord.name || '';
      vehicle.make = this.extractMakeFromCatalog(catalogRecord) || '';
      vehicle.model = catalogRecord.name || '';
      vehicle.year = this.extractYearFromCatalog(catalogRecord) || '';
      vehicle.registration = this.extractRegistrationFromCatalog(catalogRecord) || '';
      vehicle.engineCapacity = this.extractEngineFromCatalog(catalogRecord) || '';
      // Extract data from product options first, then fall back to description
      const seats = catalogRecord.productOptionDescription3 || this.extractSeatsFromCatalog(catalogRecord);
      const steering = catalogRecord.productOptionDescription4 || this.extractSteeringFromCatalog(catalogRecord);
      const gearbox = catalogRecord.productOptionDescription5 || this.extractGearboxFromCatalog(catalogRecord);
      const exteriorFromOptions = this.extractColorFromCatalog(catalogRecord);
      const exteriorFromDescription = this.extractExteriorFromCatalog(catalogRecord);
      const exteriorColour = exteriorFromOptions || exteriorFromDescription;

      vehicle.numberOfSeats = seats;
      vehicle.steering = steering;
      vehicle.gearbox = gearbox;
      vehicle.exteriorColour = exteriorColour;
      vehicle.interiorColour = this.extractInteriorFromCatalog(catalogRecord) || '';
      vehicle.price = catalogRecord.price;
      vehicle.collection = catalogRecord.collection || '';
    }

    // Always set visible and inventory from catalog data if available
    if (catalogRecord) {
      vehicle.visible = catalogRecord.visible;
      vehicle.inventory = catalogRecord.inventory;
    }

    // Calculate published status for all records
    vehicle.published = (vehicle.visible === true || vehicle.visible === null) && (vehicle.inventory === null || vehicle.inventory === undefined || vehicle.inventory === '' || vehicle.inventory !== 'OutOfStock');

    return vehicle;
  }

  mergeOwnerData(cleansedRecord, submissionRecord) {
    const owner = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {}
    };

    // Priority: cleansed > submission
    if (cleansedRecord?.owner) {
      const o = cleansedRecord.owner;
      owner.firstName = o.firstName || '';
      owner.lastName = o.lastName || '';
      owner.email = o.email || '';
      owner.phone = o.phone || '';
      owner.address = o.address || {};
    }

    if (submissionRecord && !owner.email) {
      owner.firstName = submissionRecord.first_name_1 || '';
      owner.lastName = submissionRecord.last_name_de76 || '';
      owner.email = submissionRecord.email_4bec || '';
      owner.phone = submissionRecord.phone_bc17 || '';
      owner.address = {
        street: submissionRecord.your_address || '',
        city: submissionRecord.city_1 || '',
        county: submissionRecord.county_1 || '',
        postcode: submissionRecord.postcode || '',
        country: submissionRecord.country || ''
      };
    }

    return owner;
  }

  mergeImageData(cleansedRecord, submissionRecord, catalogRecord) {
    const images = { urls: [], count: 0 };

    // Collect all image URLs
    const allUrls = [];

    if (cleansedRecord?.images?.urls) {
      allUrls.push(...cleansedRecord.images.urls);
    }

    if (submissionRecord?.upload_vehicle_images) {
      allUrls.push(...submissionRecord.upload_vehicle_images);
    }

    if (catalogRecord?.productImageUrl) {
      const catalogUrls = catalogRecord.productImageUrl.split(';');
      allUrls.push(...catalogUrls);
    }

    // Process and clean URLs
    const processedUrls = allUrls
      .filter(url => url && url.trim() !== '')
      .map(url => {
        const trimmedUrl = url.trim();
        // Add Wix static URL prefix if it's just a filename
        if (!trimmedUrl.startsWith('http')) {
          return `https://static.wixstatic.com/media/${trimmedUrl}`;
        }
        return trimmedUrl;
      });

    // Remove duplicates and ensure uniqueness
    const uniqueUrls = [...new Set(processedUrls)];
    images.urls = uniqueUrls;
    images.count = uniqueUrls.length;

    return images;
  }

  calculateMatchScore(cleansedRecord, submissionRecord) {
    let score = 0;

    // Email match (highest priority)
    const cleansedEmail = cleansedRecord.owner?.email?.toLowerCase().trim();
    const submissionEmail = submissionRecord.email_4bec?.toLowerCase().trim();
    if (cleansedEmail === submissionEmail) score += 5;

    // Make match (normalized)
    const cleansedMake = this.normalizeMake(cleansedRecord.vehicle?.make);
    const submissionMake = this.normalizeMake(submissionRecord.make_1);
    if (cleansedMake === submissionMake) score += 3;

    // Year match
    const cleansedYear = cleansedRecord.vehicle?.yearOfManufacture;
    const submissionYear = submissionRecord.year_of_manufacture_1;
    if (cleansedYear === submissionYear) score += 2;

    // Model match (fuzzy)
    const cleansedModel = cleansedRecord.vehicle?.model?.toLowerCase().trim();
    const submissionModel = submissionRecord.location_1?.toLowerCase().trim();
    if (this.fuzzyModelMatch(cleansedModel, submissionModel)) score += 2;

    // Registration match (normalized)
    const cleansedReg = this.normalizeRegistration(cleansedRecord.vehicle?.registration);
    const submissionReg = this.normalizeRegistration(submissionRecord.call_time);
    if (cleansedReg === submissionReg) score += 4;

    // Engine capacity match (normalized)
    const cleansedEngine = this.normalizeEngineCapacity(cleansedRecord.vehicle?.engineCapacity);
    const submissionEngine = this.normalizeEngineCapacity(submissionRecord.engine_capacity);
    if (cleansedEngine === submissionEngine) score += 1;

    return score;
  }

  fuzzyModelMatch(model1, model2) {
    if (!model1 || !model2) return false;
    
    const m1 = model1.toLowerCase().trim();
    const m2 = model2.toLowerCase().trim();
    
    if (m1 === m2) return true;
    if (m1.includes(m2) || m2.includes(m1)) return true;
    
    return false;
  }

  generateUniqueId(cleansedRecord, submissionRecord, catalogRecord) {
    if (cleansedRecord?.wixId) return cleansedRecord.wixId;
    if (catalogRecord?.handleId) return catalogRecord.handleId;
    if (submissionRecord?.call_time) return submissionRecord.call_time;
    return `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getMatchConfidence(score) {
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    if (score >= 2) return 'low';
    return 'none';
  }

  analyzeOwnerGroups(ownerGroups) {
    this.stats.multipleVehicleOwners = 0;
    
    ownerGroups.forEach((vehicles, email) => {
      if (vehicles.length > 1) {
        this.stats.multipleVehicleOwners++;
        console.log(`👥 Owner ${email} has ${vehicles.length} vehicles`);
      }
    });
  }

  // Data normalization methods
  normalizeRegistration(registration) {
    if (!registration) return '';
    
    // Remove all spaces, convert to uppercase, remove special characters
    return registration
      .toString()
      .trim()
      .replace(/\s+/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  normalizeEngineCapacity(engine) {
    if (!engine) return '';
    
    // Standardize engine capacity format
    return engine
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/litre/g, 'l')
      .replace(/liter/g, 'l')
      .replace(/cc/g, 'l')
      .replace(/(\d+)cc/g, (match, num) => (parseInt(num) / 1000).toFixed(1) + 'l');
  }

  normalizeMake(make) {
    if (!make) return '';
    
    // Standardize make names
    const makeMap = {
      'mercedes-benz': 'mercedes',
      'mercedes benz': 'mercedes',
      'bmw': 'bmw',
      'volkswagen': 'volkswagen',
      'vw': 'volkswagen'
    };
    
    const normalized = make.toLowerCase().trim();
    return makeMap[normalized] || normalized;
  }

  // Helper methods for extracting data from catalog records
  extractMakeFromCatalog(record) {
    return record.productOptionDescription6 || ''; // Manufacturer
  }

  extractYearFromCatalog(record) {
    if (!record.additionalInfoDescription1) return '';
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
      const match = record.additionalInfoDescription1.match(pattern);
      if (match) return match[1];
    }
    return '';
  }

  extractRegistrationFromCatalog(record) {
    if (!record.additionalInfoDescription1) return '';
    const regMatch = record.additionalInfoDescription1.match(/Registration\s*[:\s]*([A-Z0-9\s]+)/i);
    return regMatch ? regMatch[1].trim() : '';
  }

  extractEngineFromCatalog(record) {
    if (!record.additionalInfoDescription1) return '';
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
      const match = record.additionalInfoDescription1.match(pattern);
      if (match) return match[1];
    }
    return '';
  }

  extractColorFromCatalog(record) {
    if (!record.productOptionDescription1) return '';
    const colorMatch = record.productOptionDescription1.match(/#[0-9a-fA-F]{6}:([^,]+)/);
    return colorMatch ? colorMatch[1] : record.productOptionDescription1;
  }

  extractInteriorFromCatalog(record) {
    if (!record.additionalInfoDescription1) return '';
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
      const match = record.additionalInfoDescription1.match(pattern);
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

  extractSteeringFromCatalog(record) {
    if (!record.additionalInfoDescription1) return '';
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
      const match = record.additionalInfoDescription1.match(pattern);
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

  extractGearboxFromCatalog(record) {
    if (!record.additionalInfoDescription1) return '';
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
      const match = record.additionalInfoDescription1.match(pattern);
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

  extractSeatsFromCatalog(record) {
    if (!record.additionalInfoDescription1) return '';
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
      const match = record.additionalInfoDescription1.match(pattern);
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

  extractExteriorFromCatalog(record) {
    if (!record.additionalInfoDescription1) return '';
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
      const match = record.additionalInfoDescription1.match(pattern);
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
    console.log('\n📊 SOPHISTICATED MATCHING STATISTICS');
    console.log('=====================================');
    console.log(`Total Records: ${this.finalData.length}`);
    console.log(`Perfect Matches: ${this.stats.perfectMatches}`);
    console.log(`Partial Matches: ${this.stats.partialMatches}`);
    console.log(`Unmatched Records: ${this.stats.unmatchedRecords}`);
    console.log(`Multiple Vehicle Owners: ${this.stats.multipleVehicleOwners}`);
    console.log(`Cross-Source Matches: ${this.stats.crossSourceMatches}`);
    
    // Count match types
    const matchTypes = {};
    this.finalData.forEach(record => {
      matchTypes[record.matchType] = (matchTypes[record.matchType] || 0) + 1;
    });
    
    console.log('\n🎯 MATCH TYPE BREAKDOWN');
    console.log('========================');
    Object.entries(matchTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
  }
}

// Run the matcher
async function main() {
  try {
    const matcher = new SophisticatedVehicleMatcher();
    await matcher.init();
    console.log('\n✅ Sophisticated vehicle matching completed successfully!');
  } catch (error) {
    console.error('❌ Error during matching:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SophisticatedVehicleMatcher;
