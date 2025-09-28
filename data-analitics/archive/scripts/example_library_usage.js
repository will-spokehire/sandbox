/**
 * Example script demonstrating how to use the SpokeHire Data Processing Library
 *
 * This script shows basic usage patterns for common data processing tasks.
 */

const {
  fileUtils,
  dataTransformer,
  dataMatcher,
  statisticsGenerator,
  createLogger
} = require('../lib');

class ExampleDataProcessor {
  constructor() {
    this.logger = createLogger('Example Data Processor');
  }

  async runExample() {
    try {
      this.logger.section('SpokeHire Library Usage Examples');

      // Example 1: File Operations
      await this.fileOperationsExample();

      // Example 2: Data Transformation
      await this.dataTransformationExample();

      // Example 3: Statistics Generation
      await this.statisticsExample();

      // Example 4: Data Matching
      await this.dataMatchingExample();

      this.logger.success('All examples completed successfully!');

    } catch (error) {
      this.logger.error('Example failed:', error);
      process.exit(1);
    }
  }

  async fileOperationsExample() {
    this.logger.subsection('File Operations Example');

    try {
      // Check if a file exists
      const exists = await fileUtils.fileExists('catalog_products.json');
      this.logger.info(`catalog_products.json exists: ${exists}`);

      // Read JSON file
      this.logger.info('Reading catalog products...');
      const catalogData = await fileUtils.readJsonFile('catalog_products.json');
      this.logger.success(`Loaded ${catalogData.length} catalog records`);

      // Read CSV file
      this.logger.info('Reading CSV data...');
      const csvData = await fileUtils.readCsvFile('cleansed_database.csv');
      this.logger.success(`Loaded ${csvData.length} CSV records`);

    } catch (error) {
      this.logger.warning('File operations example encountered issues (files may not exist):', error.message);
    }
  }

  async dataTransformationExample() {
    this.logger.subsection('Data Transformation Example');

    try {
      // Load some data to transform
      const rawData = await fileUtils.readJsonFile('cleansed_database.json');
      this.logger.info(`Loaded ${rawData.length} records for transformation`);

      if (rawData.length === 0) {
        this.logger.warning('No data available for transformation example');
        return;
      }

      // Transform the first record
      const transformedRecord = dataTransformer.normalizeVehicleData(rawData[0], 'cleansed');

      this.logger.success('Data transformation example:');
      this.logger.info('Original keys:', Object.keys(rawData[0]));
      this.logger.info('Transformed keys:', Object.keys(transformedRecord));
      this.logger.info('Vehicle data:', transformedRecord.vehicle);
      this.logger.info('Owner data:', transformedRecord.owner);
      this.logger.info('Image count:', transformedRecord.images.count);

    } catch (error) {
      this.logger.warning('Data transformation example encountered issues:', error.message);
    }
  }

  async statisticsExample() {
    this.logger.subsection('Statistics Generation Example');

    try {
      // Load data for analysis
      const data = await fileUtils.readJsonFile('catalog_products.json');
      this.logger.info(`Analyzing ${data.length} catalog records`);

      if (data.length === 0) {
        this.logger.warning('No data available for statistics example');
        return;
      }

      // Generate comprehensive statistics
      const stats = statisticsGenerator.generateDatasetStats(data, 'catalog');

      this.logger.success('Generated Statistics:');
      this.logger.info(`Total Records: ${stats.totalRecords}`);
      this.logger.info(`Records with Images: ${stats.imageStats.recordsWithImages}`);
      this.logger.info(`Total Images: ${stats.imageStats.totalImages}`);

      // Show field analysis
      if (stats.fieldStats.make) {
        const makeStats = stats.fieldStats.make;
        this.logger.info(`Make Analysis: ${makeStats.unique} unique makes, most common: ${makeStats.mostCommon[0]}`);
      }

    } catch (error) {
      this.logger.warning('Statistics example encountered issues:', error.message);
    }
  }

  async dataMatchingExample() {
    this.logger.subsection('Data Matching Example');

    try {
      // Load multiple datasets
      const catalogData = await fileUtils.readJsonFile('catalog_products.json');
      const cleansedData = await fileUtils.readJsonFile('cleansed_database.json');

      this.logger.info(`Loaded ${catalogData.length} catalog and ${cleansedData.length} cleansed records`);

      if (catalogData.length === 0 || cleansedData.length === 0) {
        this.logger.warning('No data available for matching example');
        return;
      }

      // Build lookup maps
      dataMatcher.buildLookupMaps(catalogData, cleansedData);

      // Try to find matches for the first catalog record
      const firstRecord = catalogData[0];
      const matches = dataMatcher.findMatches(firstRecord, 'catalog');

      this.logger.success('Matching Results:');
      this.logger.info(`Record ID: ${firstRecord.handleId}`);
      this.logger.info(`Matched sources: ${matches.matchedSources.join(', ')}`);

      if (matches.cleansed) {
        this.logger.info('Found matching cleansed record');
      } else {
        this.logger.info('No cleansed match found');
      }

      // Show match statistics
      const matchStats = dataMatcher.getMatchStatistics();
      this.logger.info(`Total catalog mappings: ${matchStats.totalCatalogRecords}`);
      this.logger.info(`Total cleansed mappings: ${matchStats.totalCleansedRecords}`);

    } catch (error) {
      this.logger.warning('Data matching example encountered issues:', error.message);
    }
  }
}

// Run the example
if (require.main === module) {
  const processor = new ExampleDataProcessor();
  processor.runExample();
}

module.exports = ExampleDataProcessor;
