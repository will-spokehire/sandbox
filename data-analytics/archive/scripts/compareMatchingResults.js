const fs = require('fs-extra');
const path = require('path');

class MatchingResultsComparator {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.originalFile = path.join(this.dataDir, 'final_vehicle_catalog.json');
    this.sophisticatedFile = path.join(this.dataDir, 'sophisticated_vehicle_catalog.json');
    this.outputFile = path.join(this.dataDir, 'matching_comparison_analysis.json');
    
    this.originalData = null;
    this.sophisticatedData = null;
    this.comparison = {};
  }

  async init() {
    console.log('🔍 Comparing Matching Results...');
    await this.loadData();
    await this.compareResults();
    await this.analyzeImprovements();
    await this.saveComparison();
    this.printComparison();
  }

  async loadData() {
    console.log('📂 Loading data files...');
    
    try {
      const originalContent = await fs.readFile(this.originalFile, 'utf8');
      this.originalData = JSON.parse(originalContent);

      const sophisticatedContent = await fs.readFile(this.sophisticatedFile, 'utf8');
      this.sophisticatedData = JSON.parse(sophisticatedContent);

      console.log(`✅ Loaded ${this.originalData.records.length} original records`);
      console.log(`✅ Loaded ${this.sophisticatedData.records.length} sophisticated records`);

    } catch (error) {
      console.error('❌ Error loading data:', error.message);
      throw error;
    }
  }

  async compareResults() {
    console.log('🔄 Comparing results...');
    
    this.comparison = {
      recordCounts: {
        original: this.originalData.records.length,
        sophisticated: this.sophisticatedData.records.length,
        difference: this.sophisticatedData.records.length - this.originalData.records.length
      },
      matchTypes: {
        original: {},
        sophisticated: {},
        improvements: {}
      },
      dataQuality: {
        original: this.analyzeDataQuality(this.originalData.records),
        sophisticated: this.analyzeDataQuality(this.sophisticatedData.records)
      },
      ownerAnalysis: {
        original: this.analyzeOwners(this.originalData.records),
        sophisticated: this.analyzeOwners(this.sophisticatedData.records)
      }
    };

    // Analyze match types
    this.originalData.records.forEach(record => {
      const matchType = record.matchStatus;
      this.comparison.matchTypes.original[matchType] = 
        (this.comparison.matchTypes.original[matchType] || 0) + 1;
    });

    this.sophisticatedData.records.forEach(record => {
      const matchType = record.matchType;
      this.comparison.matchTypes.sophisticated[matchType] = 
        (this.comparison.matchTypes.sophisticated[matchType] || 0) + 1;
    });

    // Calculate improvements
    Object.keys(this.comparison.matchTypes.sophisticated).forEach(matchType => {
      const original = this.comparison.matchTypes.original[matchType] || 0;
      const sophisticated = this.comparison.matchTypes.sophisticated[matchType];
      this.comparison.matchTypes.improvements[matchType] = {
        original,
        sophisticated,
        difference: sophisticated - original,
        improvement: original > 0 ? ((sophisticated - original) / original * 100).toFixed(2) + '%' : 'N/A'
      };
    });
  }

  analyzeDataQuality(records) {
    const quality = {
      totalRecords: records.length,
      recordsWithCompleteData: 0,
      recordsWithOwnerData: 0,
      recordsWithImages: 0,
      recordsWithMultipleSources: 0,
      averageSourcesPerRecord: 0
    };

    let totalSources = 0;

    records.forEach(record => {
      // Check for complete vehicle data
      const vehicle = record.vehicle?.vehicle || record.vehicle;
      if (vehicle && vehicle.make && vehicle.model && vehicle.year && vehicle.registration) {
        quality.recordsWithCompleteData++;
      }

      // Check for owner data
      const owner = record.vehicle?.owner || record.owner;
      if (owner && owner.email) {
        quality.recordsWithOwnerData++;
      }

      // Check for images
      const images = record.vehicle?.images || record.images;
      if (images && images.count > 0) {
        quality.recordsWithImages++;
      }

      // Check for multiple sources
      const sources = record.sources || [];
      if (sources.length > 1) {
        quality.recordsWithMultipleSources++;
      }
      totalSources += sources.length;
    });

    quality.averageSourcesPerRecord = (totalSources / records.length).toFixed(2);

    return quality;
  }

  analyzeOwners(records) {
    const ownerMap = new Map();
    const ownerStats = {
      totalOwners: 0,
      ownersWithMultipleVehicles: 0,
      maxVehiclesPerOwner: 0,
      averageVehiclesPerOwner: 0
    };

    records.forEach(record => {
      const owner = record.vehicle?.owner || record.owner;
      if (owner && owner.email) {
        const email = owner.email.toLowerCase().trim();
        if (!ownerMap.has(email)) {
          ownerMap.set(email, []);
        }
        ownerMap.get(email).push(record);
      }
    });

    ownerStats.totalOwners = ownerMap.size;
    let totalVehicles = 0;
    let maxVehicles = 0;

    ownerMap.forEach((vehicles, email) => {
      const vehicleCount = vehicles.length;
      totalVehicles += vehicleCount;
      maxVehicles = Math.max(maxVehicles, vehicleCount);
      
      if (vehicleCount > 1) {
        ownerStats.ownersWithMultipleVehicles++;
      }
    });

    ownerStats.maxVehiclesPerOwner = maxVehicles;
    ownerStats.averageVehiclesPerOwner = (totalVehicles / ownerMap.size).toFixed(2);

    return ownerStats;
  }

  async analyzeImprovements() {
    console.log('📈 Analyzing improvements...');
    
    this.comparison.improvements = {
      recordEfficiency: {
        description: 'Reduction in duplicate records through better matching',
        original: this.comparison.recordCounts.original,
        sophisticated: this.comparison.recordCounts.sophisticated,
        improvement: this.comparison.recordCounts.difference,
        percentage: ((this.comparison.recordCounts.difference / this.comparison.recordCounts.original) * 100).toFixed(2) + '%'
      },
      dataCompleteness: {
        description: 'Improvement in complete vehicle data',
        original: this.comparison.dataQuality.original.recordsWithCompleteData,
        sophisticated: this.comparison.dataQuality.sophisticated.recordsWithCompleteData,
        improvement: this.comparison.dataQuality.sophisticated.recordsWithCompleteData - this.comparison.dataQuality.original.recordsWithCompleteData
      },
      multiSourceRecords: {
        description: 'Records with data from multiple sources',
        original: this.comparison.dataQuality.original.recordsWithMultipleSources,
        sophisticated: this.comparison.dataQuality.sophisticated.recordsWithMultipleSources,
        improvement: this.comparison.dataQuality.sophisticated.recordsWithMultipleSources - this.comparison.dataQuality.original.recordsWithMultipleSources
      },
      ownerConsolidation: {
        description: 'Better owner data consolidation',
        original: this.comparison.ownerAnalysis.original.ownersWithMultipleVehicles,
        sophisticated: this.comparison.ownerAnalysis.sophisticated.ownersWithMultipleVehicles,
        improvement: this.comparison.ownerAnalysis.sophisticated.ownersWithMultipleVehicles - this.comparison.ownerAnalysis.original.ownersWithMultipleVehicles
      }
    };
  }

  async saveComparison() {
    console.log('💾 Saving comparison...');
    
    const output = {
      generatedAt: new Date().toISOString(),
      comparison: this.comparison
    };

    await fs.writeJson(this.outputFile, output, { spaces: 2 });
    console.log(`✅ Comparison saved to ${this.outputFile}`);
  }

  printComparison() {
    console.log('\n📊 MATCHING RESULTS COMPARISON');
    console.log('===============================');
    
    console.log('\n📈 RECORD COUNTS');
    console.log('=================');
    console.log(`Original Records: ${this.comparison.recordCounts.original}`);
    console.log(`Sophisticated Records: ${this.comparison.recordCounts.sophisticated}`);
    console.log(`Difference: ${this.comparison.recordCounts.difference} (${this.comparison.improvements.recordEfficiency.percentage})`);
    
    console.log('\n🎯 MATCH TYPE COMPARISON');
    console.log('=========================');
    Object.entries(this.comparison.matchTypes.improvements).forEach(([type, data]) => {
      console.log(`${type}:`);
      console.log(`  Original: ${data.original}`);
      console.log(`  Sophisticated: ${data.sophisticated}`);
      console.log(`  Change: ${data.difference} (${data.improvement})`);
      console.log('');
    });
    
    console.log('\n📋 DATA QUALITY COMPARISON');
    console.log('===========================');
    console.log('Complete Vehicle Data:');
    console.log(`  Original: ${this.comparison.dataQuality.original.recordsWithCompleteData}`);
    console.log(`  Sophisticated: ${this.comparison.dataQuality.sophisticated.recordsWithCompleteData}`);
    console.log(`  Improvement: ${this.comparison.improvements.dataCompleteness.improvement}`);
    
    console.log('\nMulti-Source Records:');
    console.log(`  Original: ${this.comparison.dataQuality.original.recordsWithMultipleSources}`);
    console.log(`  Sophisticated: ${this.comparison.dataQuality.sophisticated.recordsWithMultipleSources}`);
    console.log(`  Improvement: ${this.comparison.improvements.multiSourceRecords.improvement}`);
    
    console.log('\nAverage Sources per Record:');
    console.log(`  Original: ${this.comparison.dataQuality.original.averageSourcesPerRecord}`);
    console.log(`  Sophisticated: ${this.comparison.dataQuality.sophisticated.averageSourcesPerRecord}`);
    
    console.log('\n👥 OWNER ANALYSIS');
    console.log('==================');
    console.log('Owners with Multiple Vehicles:');
    console.log(`  Original: ${this.comparison.ownerAnalysis.original.ownersWithMultipleVehicles}`);
    console.log(`  Sophisticated: ${this.comparison.ownerAnalysis.sophisticated.ownersWithMultipleVehicles}`);
    console.log(`  Change: ${this.comparison.improvements.ownerConsolidation.improvement}`);
    
    console.log('\nAverage Vehicles per Owner:');
    console.log(`  Original: ${this.comparison.ownerAnalysis.original.averageVehiclesPerOwner}`);
    console.log(`  Sophisticated: ${this.comparison.ownerAnalysis.sophisticated.averageVehiclesPerOwner}`);
    
    console.log('\n🏆 KEY IMPROVEMENTS');
    console.log('===================');
    console.log(`✅ Record Efficiency: ${this.comparison.improvements.recordEfficiency.improvement} fewer records (${this.comparison.improvements.recordEfficiency.percentage} reduction)`);
    console.log(`✅ Data Completeness: +${this.comparison.improvements.dataCompleteness.improvement} records with complete data`);
    console.log(`✅ Multi-Source Integration: +${this.comparison.improvements.multiSourceRecords.improvement} records with multiple sources`);
    console.log(`✅ Owner Consolidation: +${this.comparison.improvements.ownerConsolidation.improvement} owners with multiple vehicles properly tracked`);
  }
}

// Run the comparator
async function main() {
  try {
    const comparator = new MatchingResultsComparator();
    await comparator.init();
    console.log('\n✅ Matching results comparison completed successfully!');
  } catch (error) {
    console.error('❌ Error during comparison:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MatchingResultsComparator;
