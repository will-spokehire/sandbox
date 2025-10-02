/**
 * Statistics generation utilities for data analysis
 */
class StatisticsGenerator {
  constructor() {
    this.stats = {};
  }

  /**
   * Generate statistics for a dataset
   * @param {Array} data - Data array to analyze
   * @param {string} source - Source name for the data
   * @returns {Object} Statistics object
   */
  generateDatasetStats(data, source) {
    const stats = {
      totalRecords: data.length,
      source: source,
      fieldStats: {},
      valueDistributions: {}
    };

    if (data.length === 0) return stats;

    // Analyze common fields
    const commonFields = [
      'make', 'model', 'year', 'registration', 'engineCapacity',
      'numberOfSeats', 'steering', 'gearbox', 'exteriorColour',
      'interiorColour', 'condition', 'isRoadLegal'
    ];

    commonFields.forEach(field => {
      stats.fieldStats[field] = this._analyzeField(data, field);
    });

    // Analyze image data
    if (data[0].images) {
      stats.imageStats = this._analyzeImageData(data);
    }

    // Analyze owner data
    if (data[0].owner) {
      stats.ownerStats = this._analyzeOwnerData(data);
    }

    return stats;
  }

  _analyzeField(data, field) {
    const values = data
      .map(record => this._getNestedValue(record, field))
      .filter(val => val !== null && val !== undefined && val !== '');

    if (values.length === 0) {
      return { count: 0, unique: 0, distribution: {} };
    }

    const distribution = {};
    values.forEach(value => {
      const key = String(value).toLowerCase();
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return {
      count: values.length,
      unique: Object.keys(distribution).length,
      distribution: distribution,
      mostCommon: Object.entries(distribution)
        .sort(([,a], [,b]) => b - a)[0]
    };
  }

  _analyzeImageData(data) {
    const recordsWithImages = data.filter(record =>
      record.images && record.images.count > 0
    );

    const totalImages = data.reduce((sum, record) =>
      sum + (record.images ? record.images.count : 0), 0
    );

    const avgImagesPerRecord = recordsWithImages.length > 0
      ? totalImages / recordsWithImages.length
      : 0;

    return {
      recordsWithImages: recordsWithImages.length,
      recordsWithoutImages: data.length - recordsWithImages.length,
      totalImages: totalImages,
      avgImagesPerRecord: Math.round(avgImagesPerRecord * 100) / 100
    };
  }

  _analyzeOwnerData(data) {
    const recordsWithOwners = data.filter(record =>
      record.owner && (record.owner.firstName || record.owner.email)
    );

    const emailStats = this._analyzeField(
      recordsWithOwners, 'owner.email'
    );

    const phoneStats = this._analyzeField(
      recordsWithOwners, 'owner.phone'
    );

    return {
      recordsWithOwnerInfo: recordsWithOwners.length,
      emailStats: emailStats,
      phoneStats: phoneStats
    };
  }

  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) =>
      current && current[key], obj);
  }

  /**
   * Generate comparison statistics between two datasets
   * @param {Array} dataset1 - First dataset
   * @param {Array} dataset2 - Second dataset
   * @param {string} name1 - Name for first dataset
   * @param {string} name2 - Name for second dataset
   * @returns {Object} Comparison statistics
   */
  generateComparisonStats(dataset1, dataset2, name1, name2) {
    const stats1 = this.generateDatasetStats(dataset1, name1);
    const stats2 = this.generateDatasetStats(dataset2, name2);

    return {
      dataset1: stats1,
      dataset2: stats2,
      comparison: {
        recordCountDiff: stats1.totalRecords - stats2.totalRecords,
        commonFields: this._findCommonFields(stats1, stats2)
      }
    };
  }

  _findCommonFields(stats1, stats2) {
    const fields1 = Object.keys(stats1.fieldStats);
    const fields2 = Object.keys(stats2.fieldStats);
    return fields1.filter(field => fields2.includes(field));
  }

  /**
   * Generate match analysis statistics
   * @param {Array} matchedData - Array of matched records
   * @returns {Object} Match analysis statistics
   */
  generateMatchAnalysis(matchedData) {
    const analysis = {
      totalRecords: matchedData.length,
      matchTypes: {},
      sourceDistribution: {},
      statusDistribution: {},
      imageStats: {
        totalImages: 0,
        recordsWithImages: 0,
        avgImagesPerRecord: 0
      }
    };

    matchedData.forEach(record => {
      // Count match types
      const matchType = record.matchStatus || 'unknown';
      analysis.matchTypes[matchType] = (analysis.matchTypes[matchType] || 0) + 1;

      // Count source distribution
      if (record.sources) {
        record.sources.forEach(source => {
          analysis.sourceDistribution[source] = (analysis.sourceDistribution[source] || 0) + 1;
        });
      }

      // Count status distribution
      const status = record.status || 'unknown';
      analysis.statusDistribution[status] = (analysis.statusDistribution[status] || 0) + 1;

      // Image statistics
      if (record.images && record.images.count > 0) {
        analysis.imageStats.recordsWithImages++;
        analysis.imageStats.totalImages += record.images.count;
      }
    });

    // Calculate averages
    if (analysis.imageStats.recordsWithImages > 0) {
      analysis.imageStats.avgImagesPerRecord =
        analysis.imageStats.totalImages / analysis.imageStats.recordsWithImages;
    }

    return analysis;
  }

  /**
   * Generate email pattern analysis
   * @param {Array} data - Data array to analyze
   * @returns {Object} Email pattern analysis
   */
  generateEmailPatternAnalysis(data) {
    const emailPatterns = {};
    const emailStats = {
      totalEmails: 0,
      emailsWithMultipleVehicles: 0,
      totalVehicles: 0,
      uniqueEmails: 0
    };

    data.forEach(record => {
      if (record.owner && record.owner.email) {
        const email = record.owner.email.toLowerCase().trim();
        emailStats.totalEmails++;

        if (!emailPatterns[email]) {
          emailPatterns[email] = [];
          emailStats.uniqueEmails++;
        }

        emailPatterns[email].push({
          wixId: record.wixId,
          make: record.vehicle.make,
          model: record.vehicle.model,
          registration: record.vehicle.registration,
          year: record.vehicle.yearOfManufacture
        });

        emailStats.totalVehicles++;
      }
    });

    // Find emails with multiple vehicles
    Object.values(emailPatterns).forEach(vehicles => {
      if (vehicles.length > 1) {
        emailStats.emailsWithMultipleVehicles++;
      }
    });

    return {
      emailPatterns,
      emailStats,
      emailsWithMultipleVehicles: Object.values(emailPatterns).filter(v => v.length > 1)
    };
  }
}

module.exports = StatisticsGenerator;
