const fs = require('fs-extra');
const path = require('path');

class MergedDataAnalyzer {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.mergedFile = path.join(this.dataDir, 'final_vehicle_catalog.json');
    this.analysisFile = path.join(this.dataDir, 'merged_data_analysis.json');
    
    this.mergedData = null;
    this.analysis = {
      summary: {},
      matchTypes: {},
      dataQuality: {},
      vehicleStats: {},
      ownerStats: {},
      imageStats: {},
      recommendations: []
    };
  }

  async init() {
    console.log('🔍 Starting Merged Data Analysis...');
    await this.loadData();
    await this.analyzeData();
    await this.generateRecommendations();
    await this.saveAnalysis();
    this.printAnalysis();
  }

  async loadData() {
    console.log('📂 Loading merged data...');
    
    try {
      const content = await fs.readFile(this.mergedFile, 'utf8');
      this.mergedData = JSON.parse(content);
      console.log(`✅ Loaded ${this.mergedData.records.length} merged records`);
    } catch (error) {
      console.error('❌ Error loading merged data:', error.message);
      throw error;
    }
  }

  async analyzeData() {
    console.log('🔄 Analyzing merged data...');
    
    const records = this.mergedData.records;
    
    // Summary statistics
    this.analysis.summary = {
      totalRecords: records.length,
      catalogRecords: records.filter(r => r.sources.includes('catalog')).length,
      cleansedRecords: records.filter(r => r.sources.includes('cleansed')).length,
      submissionRecords: records.filter(r => r.sources.includes('submission')).length,
      publishedRecords: records.filter(r => r.vehicle.vehicle.visible === true).length,
      unpublishedRecords: records.filter(r => r.vehicle.vehicle.visible === false).length,
      recordsWithImages: records.filter(r => r.vehicle.images.count > 0).length,
      recordsWithoutImages: records.filter(r => r.vehicle.images.count === 0).length
    };

    // Match type analysis
    this.analysis.matchTypes = {};
    records.forEach(record => {
      const matchType = record.matchStatus;
      if (!this.analysis.matchTypes[matchType]) {
        this.analysis.matchTypes[matchType] = {
          count: 0,
          percentage: 0,
          examples: []
        };
      }
      this.analysis.matchTypes[matchType].count++;
      
      // Store first few examples
      if (this.analysis.matchTypes[matchType].examples.length < 3) {
        this.analysis.matchTypes[matchType].examples.push({
          id: record.id,
          name: record.vehicle.vehicle.name,
          make: record.vehicle.vehicle.make,
          sources: record.sources
        });
      }
    });

    // Calculate percentages
    Object.keys(this.analysis.matchTypes).forEach(matchType => {
      this.analysis.matchTypes[matchType].percentage = 
        (this.analysis.matchTypes[matchType].count / records.length * 100).toFixed(2);
    });

    // Data quality analysis
    this.analysis.dataQuality = {
      recordsWithCompleteVehicleData: 0,
      recordsWithOwnerData: 0,
      recordsWithPriceData: 0,
      recordsWithRegistrationData: 0,
      recordsWithYearData: 0,
      recordsWithEngineData: 0,
      missingFields: {}
    };

    records.forEach(record => {
      const vehicle = record.vehicle.vehicle;
      
      // Check for complete vehicle data
      if (vehicle.make && vehicle.model && vehicle.year && vehicle.registration) {
        this.analysis.dataQuality.recordsWithCompleteVehicleData++;
      }
      
      // Check for owner data
      if (record.vehicle.owner && record.vehicle.owner.firstName) {
        this.analysis.dataQuality.recordsWithOwnerData++;
      }
      
      // Check for price data
      if (vehicle.price && vehicle.price > 0) {
        this.analysis.dataQuality.recordsWithPriceData++;
      }
      
      // Check for registration data
      if (vehicle.registration && vehicle.registration.trim() !== '') {
        this.analysis.dataQuality.recordsWithRegistrationData++;
      }
      
      // Check for year data
      if (vehicle.year && vehicle.year.trim() !== '') {
        this.analysis.dataQuality.recordsWithYearData++;
      }
      
      // Check for engine data
      if (vehicle.engineCapacity && vehicle.engineCapacity.trim() !== '') {
        this.analysis.dataQuality.recordsWithEngineData++;
      }
      
      // Track missing fields
      const fields = ['make', 'model', 'year', 'registration', 'engineCapacity', 'exteriorColour'];
      fields.forEach(field => {
        if (!vehicle[field] || vehicle[field].trim() === '') {
          if (!this.analysis.dataQuality.missingFields[field]) {
            this.analysis.dataQuality.missingFields[field] = 0;
          }
          this.analysis.dataQuality.missingFields[field]++;
        }
      });
    });

    // Vehicle statistics
    this.analysis.vehicleStats = {
      makes: {},
      decades: {},
      colors: {},
      gearboxTypes: {},
      steeringTypes: {},
      seatCounts: {},
      priceRanges: {}
    };

    records.forEach(record => {
      const vehicle = record.vehicle.vehicle;
      
      // Count makes
      if (vehicle.make) {
        this.analysis.vehicleStats.makes[vehicle.make] = 
          (this.analysis.vehicleStats.makes[vehicle.make] || 0) + 1;
      }
      
      // Count decades
      if (vehicle.year) {
        const year = parseInt(vehicle.year);
        if (!isNaN(year)) {
          const decade = Math.floor(year / 10) * 10;
          this.analysis.vehicleStats.decades[`${decade}s`] = 
            (this.analysis.vehicleStats.decades[`${decade}s`] || 0) + 1;
        }
      }
      
      // Count colors
      if (vehicle.exteriorColour) {
        this.analysis.vehicleStats.colors[vehicle.exteriorColour] = 
          (this.analysis.vehicleStats.colors[vehicle.exteriorColour] || 0) + 1;
      }
      
      // Count gearbox types
      if (vehicle.gearbox) {
        this.analysis.vehicleStats.gearboxTypes[vehicle.gearbox] = 
          (this.analysis.vehicleStats.gearboxTypes[vehicle.gearbox] || 0) + 1;
      }
      
      // Count steering types
      if (vehicle.steering) {
        this.analysis.vehicleStats.steeringTypes[vehicle.steering] = 
          (this.analysis.vehicleStats.steeringTypes[vehicle.steering] || 0) + 1;
      }
      
      // Count seat counts
      if (vehicle.numberOfSeats) {
        this.analysis.vehicleStats.seatCounts[vehicle.numberOfSeats] = 
          (this.analysis.vehicleStats.seatCounts[vehicle.numberOfSeats] || 0) + 1;
      }
      
      // Count price ranges
      if (vehicle.price && vehicle.price > 0) {
        const priceRange = this.getPriceRange(vehicle.price);
        this.analysis.vehicleStats.priceRanges[priceRange] = 
          (this.analysis.vehicleStats.priceRanges[priceRange] || 0) + 1;
      }
    });

    // Image statistics
    this.analysis.imageStats = {
      totalImages: 0,
      averageImagesPerRecord: 0,
      recordsWithMultipleImages: 0,
      recordsWithSingleImage: 0,
      recordsWithoutImages: 0,
      imageDistribution: {}
    };

    records.forEach(record => {
      const imageCount = record.vehicle.images.count || 0;
      this.analysis.imageStats.totalImages += imageCount;
      
      if (imageCount > 1) {
        this.analysis.imageStats.recordsWithMultipleImages++;
      } else if (imageCount === 1) {
        this.analysis.imageStats.recordsWithSingleImage++;
      } else {
        this.analysis.imageStats.recordsWithoutImages++;
      }
      
      // Track image count distribution
      const range = this.getImageCountRange(imageCount);
      this.analysis.imageStats.imageDistribution[range] = 
        (this.analysis.imageStats.imageDistribution[range] || 0) + 1;
    });

    this.analysis.imageStats.averageImagesPerRecord = 
      (this.analysis.imageStats.totalImages / records.length).toFixed(2);
  }

  getPriceRange(price) {
    if (price < 100) return 'Under £100';
    if (price < 200) return '£100-£199';
    if (price < 300) return '£200-£299';
    if (price < 400) return '£300-£399';
    if (price < 500) return '£400-£499';
    if (price < 600) return '£500-£599';
    if (price < 700) return '£600-£699';
    if (price < 800) return '£700-£799';
    if (price < 900) return '£800-£899';
    if (price < 1000) return '£900-£999';
    return '£1000+';
  }

  getImageCountRange(count) {
    if (count === 0) return 'No images';
    if (count === 1) return '1 image';
    if (count <= 3) return '2-3 images';
    if (count <= 5) return '4-5 images';
    if (count <= 10) return '6-10 images';
    return '10+ images';
  }

  async generateRecommendations() {
    console.log('💡 Generating recommendations...');
    
    const recommendations = [];
    
    // Data completeness recommendations
    const totalRecords = this.analysis.summary.totalRecords;
    const completeRecords = this.analysis.dataQuality.recordsWithCompleteVehicleData;
    const completionRate = (completeRecords / totalRecords * 100).toFixed(2);
    
    if (completionRate < 80) {
      recommendations.push({
        type: 'data_quality',
        priority: 'high',
        title: 'Improve Data Completeness',
        description: `Only ${completionRate}% of records have complete vehicle data (make, model, year, registration). Consider data enrichment.`,
        affectedRecords: totalRecords - completeRecords
      });
    }
    
    // Image recommendations
    const recordsWithoutImages = this.analysis.imageStats.recordsWithoutImages;
    const imageRate = ((totalRecords - recordsWithoutImages) / totalRecords * 100).toFixed(2);
    
    if (imageRate < 90) {
      recommendations.push({
        type: 'images',
        priority: 'medium',
        title: 'Add Missing Images',
        description: `${recordsWithoutImages} records (${(recordsWithoutImages/totalRecords*100).toFixed(2)}%) are missing images.`,
        affectedRecords: recordsWithoutImages
      });
    }
    
    // Publication recommendations
    const unpublishedRecords = this.analysis.summary.unpublishedRecords;
    const publicationRate = ((totalRecords - unpublishedRecords) / totalRecords * 100).toFixed(2);
    
    if (publicationRate < 50) {
      recommendations.push({
        type: 'publication',
        priority: 'medium',
        title: 'Review Unpublished Records',
        description: `${unpublishedRecords} records (${(unpublishedRecords/totalRecords*100).toFixed(2)}%) are unpublished. Consider reviewing for publication.`,
        affectedRecords: unpublishedRecords
      });
    }
    
    // Match type recommendations
    const submissionOnlyRecords = this.analysis.matchTypes['submission_only']?.count || 0;
    if (submissionOnlyRecords > 0) {
      recommendations.push({
        type: 'data_integration',
        priority: 'high',
        title: 'Process Submission-Only Records',
        description: `${submissionOnlyRecords} records exist only in submissions and haven't been processed into the catalog.`,
        affectedRecords: submissionOnlyRecords
      });
    }
    
    this.analysis.recommendations = recommendations;
  }

  async saveAnalysis() {
    console.log('💾 Saving analysis...');
    
    const output = {
      generatedAt: new Date().toISOString(),
      analysis: this.analysis
    };

    await fs.writeJson(this.analysisFile, output, { spaces: 2 });
    console.log(`✅ Analysis saved to ${this.analysisFile}`);
  }

  printAnalysis() {
    console.log('\n📊 MERGED DATA ANALYSIS');
    console.log('========================');
    
    console.log('\n📈 SUMMARY STATISTICS');
    console.log('======================');
    console.log(`Total Records: ${this.analysis.summary.totalRecords}`);
    console.log(`Catalog Records: ${this.analysis.summary.catalogRecords}`);
    console.log(`Cleansed Records: ${this.analysis.summary.cleansedRecords}`);
    console.log(`Submission Records: ${this.analysis.summary.submissionRecords}`);
    console.log(`Published Records: ${this.analysis.summary.publishedRecords}`);
    console.log(`Unpublished Records: ${this.analysis.summary.unpublishedRecords}`);
    console.log(`Records with Images: ${this.analysis.summary.recordsWithImages}`);
    console.log(`Records without Images: ${this.analysis.summary.recordsWithoutImages}`);
    
    console.log('\n🎯 MATCH TYPE BREAKDOWN');
    console.log('========================');
    Object.entries(this.analysis.matchTypes).forEach(([type, data]) => {
      console.log(`${type}: ${data.count} (${data.percentage}%)`);
    });
    
    console.log('\n📋 DATA QUALITY METRICS');
    console.log('========================');
    console.log(`Complete Vehicle Data: ${this.analysis.dataQuality.recordsWithCompleteVehicleData}`);
    console.log(`With Owner Data: ${this.analysis.dataQuality.recordsWithOwnerData}`);
    console.log(`With Price Data: ${this.analysis.dataQuality.recordsWithPriceData}`);
    console.log(`With Registration: ${this.analysis.dataQuality.recordsWithRegistrationData}`);
    console.log(`With Year Data: ${this.analysis.dataQuality.recordsWithYearData}`);
    console.log(`With Engine Data: ${this.analysis.dataQuality.recordsWithEngineData}`);
    
    console.log('\n🚗 TOP VEHICLE MAKES');
    console.log('====================');
    const topMakes = Object.entries(this.analysis.vehicleStats.makes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    topMakes.forEach(([make, count]) => {
      console.log(`${make}: ${count}`);
    });
    
    console.log('\n📸 IMAGE STATISTICS');
    console.log('====================');
    console.log(`Total Images: ${this.analysis.imageStats.totalImages}`);
    console.log(`Average per Record: ${this.analysis.imageStats.averageImagesPerRecord}`);
    console.log(`Multiple Images: ${this.analysis.imageStats.recordsWithMultipleImages}`);
    console.log(`Single Image: ${this.analysis.imageStats.recordsWithSingleImage}`);
    console.log(`No Images: ${this.analysis.imageStats.recordsWithoutImages}`);
    
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');
    this.analysis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`   ${rec.description}`);
      console.log(`   Affected Records: ${rec.affectedRecords}`);
      console.log('');
    });
  }
}

// Run the analyzer
async function main() {
  try {
    const analyzer = new MergedDataAnalyzer();
    await analyzer.init();
    console.log('\n✅ Merged data analysis completed successfully!');
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MergedDataAnalyzer;
