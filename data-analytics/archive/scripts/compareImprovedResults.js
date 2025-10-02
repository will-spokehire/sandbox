const fs = require('fs-extra');
const path = require('path');

class ImprovedResultsComparator {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.originalFile = path.join(this.dataDir, 'final_vehicle_catalog.json');
    this.sophisticatedFile = path.join(this.dataDir, 'sophisticated_vehicle_catalog.json');
    this.improvedFile = path.join(this.dataDir, 'improved_vehicle_catalog.json');
    this.missedMatchesFile = path.join(this.dataDir, 'missed_matches_analysis.json');
    this.outputFile = path.join(this.dataDir, 'improvement_analysis.json');
    
    this.originalData = null;
    this.sophisticatedData = null;
    this.improvedData = null;
    this.missedMatchesData = null;
    this.analysis = {};
  }

  async init() {
    console.log('🔍 Comparing Improved Results...');
    await this.loadData();
    await this.analyzeImprovements();
    await this.checkSpecificCases();
    await this.saveResults();
    this.printResults();
  }

  async loadData() {
    console.log('📂 Loading data files...');
    
    try {
      const originalContent = await fs.readFile(this.originalFile, 'utf8');
      this.originalData = JSON.parse(originalContent);

      const sophisticatedContent = await fs.readFile(this.sophisticatedFile, 'utf8');
      this.sophisticatedData = JSON.parse(sophisticatedContent);

      const improvedContent = await fs.readFile(this.improvedFile, 'utf8');
      this.improvedData = JSON.parse(improvedContent);

      const missedMatchesContent = await fs.readFile(this.missedMatchesFile, 'utf8');
      this.missedMatchesData = JSON.parse(missedMatchesContent);

      console.log(`✅ Loaded data: ${this.originalData.records.length} original, ${this.sophisticatedData.records.length} sophisticated, ${this.improvedData.records.length} improved`);

    } catch (error) {
      console.error('❌ Error loading data:', error.message);
      throw error;
    }
  }

  async analyzeImprovements() {
    console.log('🔄 Analyzing improvements...');
    
    this.analysis = {
      recordCounts: {
        original: this.originalData.records.length,
        sophisticated: this.sophisticatedData.records.length,
        improved: this.improvedData.records.length,
        reductionFromOriginal: this.originalData.records.length - this.improvedData.records.length,
        reductionFromSophisticated: this.sophisticatedData.records.length - this.improvedData.records.length
      },
      matchTypes: {
        sophisticated: this.countMatchTypes(this.sophisticatedData.records),
        improved: this.countMatchTypes(this.improvedData.records)
      },
      dataQuality: {
        sophisticated: this.analyzeDataQuality(this.sophisticatedData.records),
        improved: this.analyzeDataQuality(this.improvedData.records)
      },
      missedMatchesFixed: this.analyzeMissedMatchesFixed()
    };
  }

  countMatchTypes(records) {
    const types = {};
    records.forEach(record => {
      const matchType = record.matchType || record.matchStatus;
      types[matchType] = (types[matchType] || 0) + 1;
    });
    return types;
  }

  analyzeDataQuality(records) {
    const quality = {
      totalRecords: records.length,
      recordsWithMultipleSources: 0,
      recordsWithCompleteData: 0,
      recordsWithOwnerData: 0,
      recordsWithImages: 0
    };

    records.forEach(record => {
      // Check for multiple sources
      const sources = record.sources || [];
      if (sources.length > 1) {
        quality.recordsWithMultipleSources++;
      }

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
    });

    return quality;
  }

  analyzeMissedMatchesFixed() {
    const missedMatches = this.missedMatchesData.missedMatches || [];
    const fixedMatches = [];

    missedMatches.forEach(missedMatch => {
      if (missedMatch.confidence >= 0.9) {
        // Check if this match was fixed in the improved version
        const recordIds = missedMatch.records.map(r => r.id);
        const improvedRecords = this.improvedData.records.filter(r => 
          recordIds.includes(r.id) && r.sources && r.sources.length > 1
        );

        if (improvedRecords.length > 0) {
          fixedMatches.push({
            vehicle: missedMatch.vehicle,
            owner: missedMatch.owner,
            originalRecords: recordIds,
            fixedRecord: improvedRecords[0].id,
            sources: improvedRecords[0].sources
          });
        }
      }
    });

    return fixedMatches;
  }

  async checkSpecificCases() {
    console.log('🔍 Checking specific cases...');
    
    this.analysis.specificCases = {
      mercedesE55AMG: this.checkMercedesE55AMG(),
      bensonFernandes: this.checkBensonFernandes()
    };
  }

  checkMercedesE55AMG() {
    const originalMercedes = this.originalData.records.filter(r => 
      r.id === '239' || r.id === 'SK05CKD'
    );
    
    const improvedMercedes = this.improvedData.records.filter(r => 
      r.id === '239' || r.id === 'SK05CKD' || 
      (r.vehicle?.vehicle?.make === 'Mercedes' && r.vehicle?.vehicle?.model === 'E55 AMG')
    );

    return {
      original: {
        count: originalMercedes.length,
        records: originalMercedes.map(r => ({ id: r.id, sources: r.sources || ['single'] }))
      },
      improved: {
        count: improvedMercedes.length,
        records: improvedMercedes.map(r => ({ 
          id: r.id, 
          sources: r.sources || ['single'],
          hasMultipleSources: (r.sources && r.sources.length > 1)
        }))
      },
      fixed: originalMercedes.length > improvedMercedes.length
    };
  }

  checkBensonFernandes() {
    const originalBenson = this.originalData.records.filter(r => {
      const owner = r.vehicle?.owner || r.owner;
      return owner && owner.email === 'bensonfernandes@yahoo.com';
    });
    
    const improvedBenson = this.improvedData.records.filter(r => {
      const owner = r.vehicle?.owner || r.owner;
      return owner && owner.email === 'bensonfernandes@yahoo.com';
    });

    return {
      original: {
        count: originalBenson.length,
        records: originalBenson.map(r => ({ id: r.id, sources: r.sources || ['single'] }))
      },
      improved: {
        count: improvedBenson.length,
        records: improvedBenson.map(r => ({ 
          id: r.id, 
          sources: r.sources || ['single'],
          hasMultipleSources: (r.sources && r.sources.length > 1)
        }))
      },
      consolidated: originalBenson.length > improvedBenson.length
    };
  }

  async saveResults() {
    console.log('💾 Saving results...');
    
    const output = {
      generatedAt: new Date().toISOString(),
      analysis: this.analysis
    };

    await fs.writeJson(this.outputFile, output, { spaces: 2 });
    console.log(`✅ Results saved to ${this.outputFile}`);
  }

  printResults() {
    console.log('\n📊 IMPROVEMENT ANALYSIS');
    console.log('========================');
    
    console.log('\n📈 RECORD COUNT PROGRESSION');
    console.log('=============================');
    console.log(`Original Records: ${this.analysis.recordCounts.original}`);
    console.log(`Sophisticated Records: ${this.analysis.recordCounts.sophisticated}`);
    console.log(`Improved Records: ${this.analysis.recordCounts.improved}`);
    console.log(`Total Reduction: ${this.analysis.recordCounts.reductionFromOriginal} records`);
    console.log(`Additional Improvement: ${this.analysis.recordCounts.reductionFromSophisticated} records`);

    console.log('\n🎯 MATCH TYPE IMPROVEMENTS');
    console.log('===========================');
    Object.keys(this.analysis.matchTypes.improved).forEach(matchType => {
      const sophisticated = this.analysis.matchTypes.sophisticated[matchType] || 0;
      const improved = this.analysis.matchTypes.improved[matchType];
      const change = improved - sophisticated;
      console.log(`${matchType}: ${sophisticated} → ${improved} (${change > 0 ? '+' : ''}${change})`);
    });

    console.log('\n📋 DATA QUALITY IMPROVEMENTS');
    console.log('=============================');
    console.log('Multi-Source Records:');
    console.log(`  Sophisticated: ${this.analysis.dataQuality.sophisticated.recordsWithMultipleSources}`);
    console.log(`  Improved: ${this.analysis.dataQuality.improved.recordsWithMultipleSources}`);
    console.log(`  Improvement: +${this.analysis.dataQuality.improved.recordsWithMultipleSources - this.analysis.dataQuality.sophisticated.recordsWithMultipleSources}`);

    console.log('\nComplete Vehicle Data:');
    console.log(`  Sophisticated: ${this.analysis.dataQuality.sophisticated.recordsWithCompleteData}`);
    console.log(`  Improved: ${this.analysis.dataQuality.improved.recordsWithCompleteData}`);
    console.log(`  Improvement: +${this.analysis.dataQuality.improved.recordsWithCompleteData - this.analysis.dataQuality.sophisticated.recordsWithCompleteData}`);

    console.log('\n🔧 MISSED MATCHES FIXED');
    console.log('========================');
    console.log(`Total High-Confidence Missed Matches: ${this.missedMatchesData.missedMatches?.length || 0}`);
    console.log(`Fixed in Improved Version: ${this.analysis.missedMatchesFixed.length}`);
    
    if (this.analysis.missedMatchesFixed.length > 0) {
      console.log('\nFixed Matches:');
      this.analysis.missedMatchesFixed.slice(0, 5).forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.vehicle.make} ${fix.vehicle.model} (${fix.vehicle.year})`);
        console.log(`   Owner: ${fix.owner.name}`);
        console.log(`   Original Records: ${fix.originalRecords.join(', ')}`);
        console.log(`   Fixed Record: ${fix.fixedRecord} (${fix.sources.join(' + ')})`);
      });
    }

    console.log('\n🎯 SPECIFIC CASE ANALYSIS');
    console.log('==========================');
    console.log('Mercedes E55 AMG (Benson Fernandes):');
    console.log(`  Original: ${this.analysis.specificCases.mercedesE55AMG.original.count} records`);
    console.log(`  Improved: ${this.analysis.specificCases.mercedesE55AMG.improved.count} records`);
    console.log(`  Fixed: ${this.analysis.specificCases.mercedesE55AMG.fixed ? '✅ YES' : '❌ NO'}`);

    console.log('\nBenson Fernandes (All Vehicles):');
    console.log(`  Original: ${this.analysis.specificCases.bensonFernandes.original.count} records`);
    console.log(`  Improved: ${this.analysis.specificCases.bensonFernandes.improved.count} records`);
    console.log(`  Consolidated: ${this.analysis.specificCases.bensonFernandes.consolidated ? '✅ YES' : '❌ NO'}`);

    console.log('\n🏆 SUMMARY');
    console.log('===========');
    console.log(`✅ Total Records Reduced: ${this.analysis.recordCounts.reductionFromOriginal}`);
    console.log(`✅ Additional Duplicates Fixed: ${this.analysis.recordCounts.reductionFromSophisticated}`);
    console.log(`✅ Missed Matches Fixed: ${this.analysis.missedMatchesFixed.length}`);
    console.log(`✅ Data Quality Improved: +${this.analysis.dataQuality.improved.recordsWithMultipleSources - this.analysis.dataQuality.sophisticated.recordsWithMultipleSources} multi-source records`);
  }
}

// Run the comparator
async function main() {
  try {
    const comparator = new ImprovedResultsComparator();
    await comparator.init();
    console.log('\n✅ Improvement analysis completed successfully!');
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ImprovedResultsComparator;
