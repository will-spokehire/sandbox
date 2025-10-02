/**
 * Data matching utilities for finding matching records across datasets
 */
class DataMatcher {
  constructor() {
    this.catalogMap = new Map();
    this.cleansedMap = new Map();
    this.submissionMap = new Map();
  }

  /**
   * Create a mapping key for matching records
   * @param {Object} record - Record to create key for
   * @param {string} source - Source of the record
   * @returns {string|null} Mapping key or null
   */
  createMappingKey(record, source) {
    if (source === 'catalog') {
      return record.handleId;
    } else if (source === 'cleansed') {
      return record.wixId;
    } else if (source === 'submission') {
      return record.call_time;
    }
    return null;
  }

  /**
   * Build lookup maps for efficient matching
   * @param {Array} catalogData - Catalog data array
   * @param {Array} cleansedData - Cleansed data array
   * @param {Array} submissionData - Submission data array
   */
  buildLookupMaps(catalogData = [], cleansedData = [], submissionData = []) {
    // Build catalog map
    catalogData.forEach(record => {
      const key = this.createMappingKey(record, 'catalog');
      if (key) this.catalogMap.set(key, record);
    });

    // Build cleansed map
    cleansedData.forEach(record => {
      const key = this.createMappingKey(record, 'cleansed');
      if (key) this.cleansedMap.set(key, record);
    });

    // Build submission map
    submissionData.forEach(record => {
      const key = this.createMappingKey(record, 'submission');
      if (key) this.submissionMap.set(key, record);
    });
  }

  /**
   * Find matching records across datasets
   * @param {Object} record - Primary record to match
   * @param {string} primarySource - Source of the primary record
   * @returns {Object} Matching results
   */
  findMatches(record, primarySource) {
    const primaryKey = this.createMappingKey(record, primarySource);
    const matches = {
      catalog: null,
      cleansed: null,
      submission: null,
      matchedSources: [primarySource]
    };

    if (primarySource !== 'catalog' && primaryKey) {
      matches.catalog = this.catalogMap.get(primaryKey);
      if (matches.catalog) matches.matchedSources.push('catalog');
    }

    if (primarySource !== 'cleansed' && primaryKey) {
      matches.cleansed = this.cleansedMap.get(primaryKey);
      if (matches.cleansed) matches.matchedSources.push('cleansed');
    }

    if (primarySource !== 'submission' && primaryKey) {
      matches.submission = this.submissionMap.get(primaryKey);
      if (matches.submission) matches.matchedSources.push('submission');
    }

    return matches;
  }

  /**
   * Match records by registration number (for cross-source matching)
   * @param {string} registration - Vehicle registration number
   * @returns {Object} Matching records by registration
   */
  matchByRegistration(registration) {
    const matches = {
      catalog: null,
      cleansed: null,
      submission: null,
      matchedSources: []
    };

    // Search catalog data for matching registration
    for (const [key, record] of this.catalogMap) {
      if (record.productOptionDescription1 === registration) {
        matches.catalog = record;
        matches.matchedSources.push('catalog');
        break;
      }
    }

    // Search cleansed data for matching registration
    for (const [key, record] of this.cleansedMap) {
      if (record.vehicle && record.vehicle.registration === registration) {
        matches.cleansed = record;
        matches.matchedSources.push('cleansed');
        break;
      }
    }

    // Search submission data for matching registration
    for (const [key, record] of this.submissionMap) {
      if (record.call_time === registration) {
        matches.submission = record;
        matches.matchedSources.push('submission');
        break;
      }
    }

    return matches;
  }

  /**
   * Get statistics about matches
   * @returns {Object} Match statistics
   */
  getMatchStatistics() {
    return {
      totalCatalogRecords: this.catalogMap.size,
      totalCleansedRecords: this.cleansedMap.size,
      totalSubmissionRecords: this.submissionMap.size,
      uniqueMappings: {
        catalog: this.catalogMap.size,
        cleansed: this.cleansedMap.size,
        submission: this.submissionMap.size
      }
    };
  }

  /**
   * Clear all lookup maps
   */
  clearMaps() {
    this.catalogMap.clear();
    this.cleansedMap.clear();
    this.submissionMap.clear();
  }
}

module.exports = DataMatcher;
