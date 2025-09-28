const fs = require('fs-extra');
const path = require('path');

class MissedMatchesFinder {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.finalFile = path.join(this.dataDir, 'final_vehicle_catalog.json');
    this.outputFile = path.join(this.dataDir, 'missed_matches_analysis.json');
    
    this.finalData = null;
    this.missedMatches = [];
    this.duplicateGroups = [];
  }

  async init() {
    console.log('🔍 Finding Missed Matches...');
    await this.loadData();
    await this.findMissedMatches();
    await this.analyzeDuplicates();
    await this.saveResults();
    this.printResults();
  }

  async loadData() {
    console.log('📂 Loading final catalog data...');
    
    try {
      const content = await fs.readFile(this.finalFile, 'utf8');
      this.finalData = JSON.parse(content);
      console.log(`✅ Loaded ${this.finalData.records.length} records`);
    } catch (error) {
      console.error('❌ Error loading data:', error.message);
      throw error;
    }
  }

  async findMissedMatches() {
    console.log('🔄 Analyzing for missed matches...');
    
    const records = this.finalData.records;
    const emailGroups = new Map();
    const registrationGroups = new Map();

    // Group records by email
    records.forEach(record => {
      const email = this.getEmail(record);
      if (email) {
        if (!emailGroups.has(email)) {
          emailGroups.set(email, []);
        }
        emailGroups.get(email).push(record);
      }
    });

    // Group records by registration (normalized)
    records.forEach(record => {
      const registration = this.getNormalizedRegistration(record);
      if (registration) {
        if (!registrationGroups.has(registration)) {
          registrationGroups.set(registration, []);
        }
        registrationGroups.get(registration).push(record);
      }
    });

    // Find potential missed matches
    this.findEmailBasedDuplicates(emailGroups);
    this.findRegistrationBasedDuplicates(registrationGroups);
  }

  findEmailBasedDuplicates(emailGroups) {
    console.log('📧 Checking for email-based duplicates...');
    
    emailGroups.forEach((records, email) => {
      if (records.length > 1) {
        // Check if these records represent the same vehicle
        const vehicleGroups = this.groupByVehicle(records);
        
        vehicleGroups.forEach(vehicleGroup => {
          if (vehicleGroup.length > 1) {
            const match = this.analyzeVehicleGroup(vehicleGroup, 'email_based');
            if (match.confidence >= 0.8) {
              this.missedMatches.push(match);
            }
          }
        });
      }
    });
  }

  findRegistrationBasedDuplicates(registrationGroups) {
    console.log('🚗 Checking for registration-based duplicates...');
    
    registrationGroups.forEach((records, registration) => {
      if (records.length > 1) {
        const match = this.analyzeVehicleGroup(records, 'registration_based');
        if (match.confidence >= 0.8) {
          this.missedMatches.push(match);
        }
      }
    });
  }

  groupByVehicle(records) {
    const groups = new Map();
    
    records.forEach(record => {
      const vehicle = this.getVehicle(record);
      const key = `${vehicle.make}_${vehicle.model}_${vehicle.year}`.toLowerCase();
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(record);
    });
    
    return Array.from(groups.values());
  }

  analyzeVehicleGroup(records, matchType) {
    const vehicle = this.getVehicle(records[0]);
    const owner = this.getOwner(records[0]);
    
    const match = {
      matchType,
      confidence: 0,
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        registration: vehicle.registration
      },
      owner: {
        name: `${owner.firstName} ${owner.lastName}`,
        email: owner.email
      },
      records: records.map(record => ({
        id: record.id,
        primarySource: record.primarySource,
        sources: record.sources,
        registration: this.getNormalizedRegistration(record),
        hasOwnerData: !!this.getOwner(record).email,
        hasCompleteVehicleData: this.hasCompleteVehicleData(record)
      })),
      issues: [],
      recommendations: []
    };

    // Calculate confidence score
    let score = 0;
    let maxScore = 0;

    // Check make match
    const makes = records.map(r => this.getVehicle(r).make?.toLowerCase().trim()).filter(Boolean);
    if (this.allSame(makes)) {
      score += 3;
      maxScore += 3;
    } else {
      match.issues.push('Make mismatch');
    }

    // Check model match
    const models = records.map(r => this.getVehicle(r).model?.toLowerCase().trim()).filter(Boolean);
    if (this.allSame(models)) {
      score += 3;
      maxScore += 3;
    } else {
      match.issues.push('Model mismatch');
    }

    // Check year match
    const years = records.map(r => this.getVehicle(r).year?.trim()).filter(Boolean);
    if (this.allSame(years)) {
      score += 2;
      maxScore += 2;
    } else {
      match.issues.push('Year mismatch');
    }

    // Check registration match (normalized)
    const registrations = records.map(r => this.getNormalizedRegistration(r)).filter(Boolean);
    if (this.allSame(registrations)) {
      score += 4;
      maxScore += 4;
    } else {
      match.issues.push('Registration mismatch');
    }

    // Check owner match
    const emails = records.map(r => this.getOwner(r).email?.toLowerCase().trim()).filter(Boolean);
    if (this.allSame(emails)) {
      score += 3;
      maxScore += 3;
    } else {
      match.issues.push('Owner mismatch');
    }

    match.confidence = maxScore > 0 ? score / maxScore : 0;

    // Generate recommendations
    if (match.confidence >= 0.8) {
      match.recommendations.push('Merge these records into a single entry');
      match.recommendations.push('Use the record with the most complete data as primary');
      match.recommendations.push('Combine all available images and metadata');
    }

    return match;
  }

  async analyzeDuplicates() {
    console.log('📊 Analyzing duplicate patterns...');
    
    this.duplicateGroups = this.missedMatches.map(match => ({
      type: match.matchType,
      confidence: match.confidence,
      recordCount: match.records.length,
      vehicle: match.vehicle,
      owner: match.owner,
      issues: match.issues,
      recommendations: match.recommendations
    }));

    // Sort by confidence
    this.duplicateGroups.sort((a, b) => b.confidence - a.confidence);
  }

  // Helper methods
  getEmail(record) {
    const owner = this.getOwner(record);
    return owner.email?.toLowerCase().trim();
  }

  getOwner(record) {
    return record.vehicle?.owner || record.owner || {};
  }

  getVehicle(record) {
    return record.vehicle?.vehicle || record.vehicle || {};
  }

  getNormalizedRegistration(record) {
    const registration = this.getVehicle(record).registration;
    return registration ? registration.trim().toUpperCase() : '';
  }

  hasCompleteVehicleData(record) {
    const vehicle = this.getVehicle(record);
    return !!(vehicle.make && vehicle.model && vehicle.year && vehicle.registration);
  }

  allSame(array) {
    if (array.length <= 1) return true;
    const first = array[0];
    return array.every(item => item === first);
  }

  async saveResults() {
    console.log('💾 Saving results...');
    
    const output = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalMissedMatches: this.missedMatches.length,
        highConfidenceMatches: this.missedMatches.filter(m => m.confidence >= 0.9).length,
        mediumConfidenceMatches: this.missedMatches.filter(m => m.confidence >= 0.8 && m.confidence < 0.9).length,
        totalDuplicateRecords: this.missedMatches.reduce((sum, match) => sum + match.records.length, 0)
      },
      missedMatches: this.missedMatches,
      duplicateGroups: this.duplicateGroups
    };

    await fs.writeJson(this.outputFile, output, { spaces: 2 });
    console.log(`✅ Results saved to ${this.outputFile}`);
  }

  printResults() {
    console.log('\n🚨 MISSED MATCHES ANALYSIS');
    console.log('===========================');
    
    console.log(`\n📊 SUMMARY`);
    console.log(`Total Missed Matches: ${this.missedMatches.length}`);
    console.log(`High Confidence (≥90%): ${this.missedMatches.filter(m => m.confidence >= 0.9).length}`);
    console.log(`Medium Confidence (80-89%): ${this.missedMatches.filter(m => m.confidence >= 0.8 && m.confidence < 0.9).length}`);
    console.log(`Total Duplicate Records: ${this.missedMatches.reduce((sum, match) => sum + match.records.length, 0)}`);

    console.log('\n🎯 TOP MISSED MATCHES');
    console.log('======================');
    
    this.missedMatches
      .filter(match => match.confidence >= 0.8)
      .slice(0, 10)
      .forEach((match, index) => {
        console.log(`\n${index + 1}. ${match.vehicle.make} ${match.vehicle.model} (${match.vehicle.year})`);
        console.log(`   Owner: ${match.owner.name} (${match.owner.email})`);
        console.log(`   Registration: ${match.vehicle.registration}`);
        console.log(`   Confidence: ${(match.confidence * 100).toFixed(1)}%`);
        console.log(`   Records: ${match.records.map(r => r.id).join(', ')}`);
        console.log(`   Issues: ${match.issues.join(', ') || 'None'}`);
        console.log(`   Type: ${match.matchType}`);
      });

    console.log('\n💡 RECOMMENDATIONS');
    console.log('===================');
    console.log('1. Implement fuzzy string matching for registrations');
    console.log('2. Add data normalization (trim spaces, standardize formats)');
    console.log('3. Use multiple matching criteria (email + make + year + registration)');
    console.log('4. Implement confidence scoring for all potential matches');
    console.log('5. Add manual review process for high-confidence duplicates');
  }
}

// Run the finder
async function main() {
  try {
    const finder = new MissedMatchesFinder();
    await finder.init();
    console.log('\n✅ Missed matches analysis completed successfully!');
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MissedMatchesFinder;
