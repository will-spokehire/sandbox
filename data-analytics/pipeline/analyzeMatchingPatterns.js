const fs = require('fs-extra');
const path = require('path');

class MatchingPatternAnalyzer {
  constructor() {
    // When running in pipeline, files are in input/ and output/ directories
    // Check if we're in a run directory by looking for input/ and output/ folders
    this.isPipelineMode = fs.existsSync(path.join(__dirname, 'input')) && fs.existsSync(path.join(__dirname, 'output'));
    this.baseDir = this.isPipelineMode ? __dirname : path.join(__dirname, '../..');
    
    this.catalogFile = path.join(this.baseDir, 'output', 'catalog_products.json');
    this.cleansedFile = path.join(this.baseDir, 'output', 'cleansed_database.json');
    this.submissionFile = path.join(this.baseDir, 'input', 'submission.from.1march.2025.json');
    this.outputFile = path.join(this.baseDir, 'output', 'matching_patterns_analysis.json');
    
    this.catalogData = [];
    this.cleansedData = [];
    this.submissionData = [];
    this.analysis = {};
  }

  async init() {
    console.log('🔍 Analyzing Matching Patterns...');
    await this.loadData();
    await this.analyzeEmailPatterns();
    await this.analyzeMakePatterns();
    await this.analyzeCombinedPatterns();
    await this.saveAnalysis();
    this.printAnalysis();
  }

  async loadData() {
    console.log('📂 Loading data files...');
    
    try {
      // Load catalog products
      const catalogContent = await fs.readFile(this.catalogFile, 'utf8');
      this.catalogData = JSON.parse(catalogContent);
      console.log(`✅ Loaded ${this.catalogData.length} catalog records`);

      // Load cleansed database
      const cleansedContent = await fs.readFile(this.cleansedFile, 'utf8');
      this.cleansedData = JSON.parse(cleansedContent);
      console.log(`✅ Loaded ${this.cleansedData.length} cleansed records`);

      // Load submission data
      const submissionContent = await fs.readFile(this.submissionFile, 'utf8');
      this.submissionData = JSON.parse(submissionContent);
      console.log(`✅ Loaded ${this.submissionData.length} submission records`);

    } catch (error) {
      console.error('❌ Error loading data:', error.message);
      throw error;
    }
  }

  async analyzeEmailPatterns() {
    console.log('📧 Analyzing email patterns...');
    
    this.analysis.emailPatterns = {
      cleansed: {},
      submission: {},
      catalog: {} // Catalog doesn't have emails directly
    };

    // Analyze cleansed data emails
    this.cleansedData.forEach(record => {
      if (record.owner && record.owner.email) {
        const email = record.owner.email.toLowerCase().trim();
        if (!this.analysis.emailPatterns.cleansed[email]) {
          this.analysis.emailPatterns.cleansed[email] = [];
        }
        this.analysis.emailPatterns.cleansed[email].push({
          wixId: record.wixId,
          make: record.vehicle.make,
          model: record.vehicle.model,
          registration: record.vehicle.registration,
          year: record.vehicle.yearOfManufacture
        });
      }
    });

    // Analyze submission data emails
    this.submissionData.forEach(record => {
      if (record.email_4bec) {
        const email = record.email_4bec.toLowerCase().trim();
        if (!this.analysis.emailPatterns.submission[email]) {
          this.analysis.emailPatterns.submission[email] = [];
        }
        this.analysis.emailPatterns.submission[email].push({
          call_time: record.call_time,
          make: record.make_1,
          model: record.location_1,
          year: record.year_of_manufacture_1,
          registration: record.call_time
        });
      }
    });

    // Calculate statistics
    this.analysis.emailStats = {
      cleansed: {
        totalEmails: Object.keys(this.analysis.emailPatterns.cleansed).length,
        emailsWithMultipleVehicles: 0,
        totalVehicles: 0
      },
      submission: {
        totalEmails: Object.keys(this.analysis.emailPatterns.submission).length,
        emailsWithMultipleVehicles: 0,
        totalVehicles: 0
      }
    };

    // Count vehicles per email
    Object.values(this.analysis.emailPatterns.cleansed).forEach(vehicles => {
      this.analysis.emailStats.cleansed.totalVehicles += vehicles.length;
      if (vehicles.length > 1) {
        this.analysis.emailStats.cleansed.emailsWithMultipleVehicles++;
      }
    });

    Object.values(this.analysis.emailPatterns.submission).forEach(vehicles => {
      this.analysis.emailStats.submission.totalVehicles += vehicles.length;
      if (vehicles.length > 1) {
        this.analysis.emailStats.submission.emailsWithMultipleVehicles++;
      }
    });
  }

  async analyzeMakePatterns() {
    console.log('🚗 Analyzing make patterns...');
    
    this.analysis.makePatterns = {
      cleansed: {},
      submission: {},
      catalog: {}
    };

    // Analyze cleansed data makes
    this.cleansedData.forEach(record => {
      if (record.vehicle && record.vehicle.make) {
        const make = record.vehicle.make.toLowerCase().trim();
        if (!this.analysis.makePatterns.cleansed[make]) {
          this.analysis.makePatterns.cleansed[make] = [];
        }
        this.analysis.makePatterns.cleansed[make].push({
          wixId: record.wixId,
          email: record.owner ? record.owner.email : null,
          model: record.vehicle.model,
          registration: record.vehicle.registration,
          year: record.vehicle.yearOfManufacture
        });
      }
    });

    // Analyze submission data makes
    this.submissionData.forEach(record => {
      if (record.make_1) {
        const make = record.make_1.toLowerCase().trim();
        if (!this.analysis.makePatterns.submission[make]) {
          this.analysis.makePatterns.submission[make] = [];
        }
        this.analysis.makePatterns.submission[make].push({
          call_time: record.call_time,
          email: record.email_4bec,
          model: record.location_1,
          year: record.year_of_manufacture_1
        });
      }
    });

    // Analyze catalog data makes
    this.catalogData.forEach(record => {
      if (record.productOptionDescription1) { // Manufacturer field
        const make = record.productOptionDescription1.toLowerCase().trim();
        if (!this.analysis.makePatterns.catalog[make]) {
          this.analysis.makePatterns.catalog[make] = [];
        }
        this.analysis.makePatterns.catalog[make].push({
          handleId: record.handleId,
          name: record.name,
          year: this.extractYearFromDescription(record.additionalInfoDescription1),
          registration: this.extractRegistrationFromDescription(record.additionalInfoDescription1)
        });
      }
    });
  }

  async analyzeCombinedPatterns() {
    console.log('🔗 Analyzing combined email+make patterns...');
    
    this.analysis.combinedPatterns = {
      potentialMatches: [],
      multipleVehiclesPerOwner: [],
      crossSourceMatches: []
    };

    // Find potential matches between cleansed and submission data
    Object.keys(this.analysis.emailPatterns.cleansed).forEach(email => {
      const cleansedVehicles = this.analysis.emailPatterns.cleansed[email];
      const submissionVehicles = this.analysis.emailPatterns.submission[email] || [];

      if (submissionVehicles.length > 0) {
        // This email exists in both sources
        cleansedVehicles.forEach(cleansedVehicle => {
          submissionVehicles.forEach(submissionVehicle => {
            const makeMatch = cleansedVehicle.make.toLowerCase() === submissionVehicle.make.toLowerCase();
            const yearMatch = cleansedVehicle.year === submissionVehicle.year;
            const modelMatch = this.fuzzyModelMatch(cleansedVehicle.model, submissionVehicle.model);

            this.analysis.combinedPatterns.potentialMatches.push({
              email: email,
              cleansedVehicle: cleansedVehicle,
              submissionVehicle: submissionVehicle,
              matches: {
                email: true,
                make: makeMatch,
                year: yearMatch,
                model: modelMatch,
                score: this.calculateMatchScore(makeMatch, yearMatch, modelMatch)
              }
            });
          });
        });

        // Track owners with multiple vehicles
        if (cleansedVehicles.length > 1 || submissionVehicles.length > 1) {
          this.analysis.combinedPatterns.multipleVehiclesPerOwner.push({
            email: email,
            cleansedCount: cleansedVehicles.length,
            submissionCount: submissionVehicles.length,
            totalVehicles: cleansedVehicles.length + submissionVehicles.length,
            vehicles: {
              cleansed: cleansedVehicles,
              submission: submissionVehicles
            }
          });
        }
      }
    });

    // Sort potential matches by score
    this.analysis.combinedPatterns.potentialMatches.sort((a, b) => b.matches.score - a.matches.score);
  }

  fuzzyModelMatch(model1, model2) {
    if (!model1 || !model2) return false;
    
    const m1 = model1.toLowerCase().trim();
    const m2 = model2.toLowerCase().trim();
    
    // Exact match
    if (m1 === m2) return true;
    
    // Contains match
    if (m1.includes(m2) || m2.includes(m1)) return true;
    
    // Common abbreviations and variations
    const variations = {
      'boxster': ['boxer'],
      '911': ['nine eleven', 'nine-eleven'],
      'e36': ['3 series', '3-series'],
      'e46': ['3 series', '3-series'],
      'e90': ['3 series', '3-series']
    };

    for (const [key, variants] of Object.entries(variations)) {
      if ((m1.includes(key) && variants.some(v => m2.includes(v))) ||
          (m2.includes(key) && variants.some(v => m1.includes(v)))) {
        return true;
      }
    }

    return false;
  }

  calculateMatchScore(makeMatch, yearMatch, modelMatch) {
    let score = 0;
    if (makeMatch) score += 3;
    if (yearMatch) score += 2;
    if (modelMatch) score += 2;
    return score;
  }

  extractYearFromDescription(description) {
    if (!description) return '';
    const yearMatch = description.match(/Year\s*[:\s]*(\d{4})/i);
    return yearMatch ? yearMatch[1] : '';
  }

  extractRegistrationFromDescription(description) {
    if (!description) return '';
    const regMatch = description.match(/Registration\s*[:\s]*([A-Z0-9\s]+)/i);
    return regMatch ? regMatch[1].trim() : '';
  }

  async saveAnalysis() {
    console.log('💾 Saving analysis...');
    
    const output = {
      generatedAt: new Date().toISOString(),
      analysis: this.analysis
    };

    await fs.writeJson(this.outputFile, output, { spaces: 2 });
    console.log(`✅ Analysis saved to ${this.outputFile}`);
  }

  printAnalysis() {
    console.log('\n📊 MATCHING PATTERNS ANALYSIS');
    console.log('==============================');
    
    console.log('\n📧 EMAIL STATISTICS');
    console.log('====================');
    console.log(`Cleansed Data:`);
    console.log(`  Total unique emails: ${this.analysis.emailStats.cleansed.totalEmails}`);
    console.log(`  Total vehicles: ${this.analysis.emailStats.cleansed.totalVehicles}`);
    console.log(`  Emails with multiple vehicles: ${this.analysis.emailStats.cleansed.emailsWithMultipleVehicles}`);
    console.log(`  Average vehicles per email: ${(this.analysis.emailStats.cleansed.totalVehicles / this.analysis.emailStats.cleansed.totalEmails).toFixed(2)}`);
    
    console.log(`\nSubmission Data:`);
    console.log(`  Total unique emails: ${this.analysis.emailStats.submission.totalEmails}`);
    console.log(`  Total vehicles: ${this.analysis.emailStats.submission.totalVehicles}`);
    console.log(`  Emails with multiple vehicles: ${this.analysis.emailStats.submission.emailsWithMultipleVehicles}`);
    console.log(`  Average vehicles per email: ${(this.analysis.emailStats.submission.totalVehicles / this.analysis.emailStats.submission.totalEmails).toFixed(2)}`);

    console.log('\n🔗 COMBINED PATTERNS');
    console.log('====================');
    console.log(`Potential matches found: ${this.analysis.combinedPatterns.potentialMatches.length}`);
    console.log(`Owners with multiple vehicles: ${this.analysis.combinedPatterns.multipleVehiclesPerOwner.length}`);

    // Show top potential matches
    console.log('\n🎯 TOP POTENTIAL MATCHES');
    console.log('=========================');
    this.analysis.combinedPatterns.potentialMatches.slice(0, 10).forEach((match, index) => {
      console.log(`${index + 1}. Email: ${match.email}`);
      console.log(`   Cleansed: ${match.cleansedVehicle.make} ${match.cleansedVehicle.model} (${match.cleansedVehicle.year})`);
      console.log(`   Submission: ${match.submissionVehicle.make} ${match.submissionVehicle.model} (${match.submissionVehicle.year})`);
      console.log(`   Score: ${match.matches.score}/7 (Make: ${match.matches.make}, Year: ${match.matches.year}, Model: ${match.matches.model})`);
      console.log('');
    });

    // Show owners with multiple vehicles
    console.log('\n👥 OWNERS WITH MULTIPLE VEHICLES');
    console.log('=================================');
    this.analysis.combinedPatterns.multipleVehiclesPerOwner.slice(0, 5).forEach((owner, index) => {
      console.log(`${index + 1}. Email: ${owner.email}`);
      console.log(`   Cleansed vehicles: ${owner.cleansedCount}`);
      console.log(`   Submission vehicles: ${owner.submissionCount}`);
      console.log(`   Total vehicles: ${owner.totalVehicles}`);
      console.log('');
    });
  }
}

// Run the analyzer
async function main() {
  try {
    const analyzer = new MatchingPatternAnalyzer();
    await analyzer.init();
    console.log('\n✅ Matching patterns analysis completed successfully!');
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MatchingPatternAnalyzer;
