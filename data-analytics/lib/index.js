/**
 * Main library entry point
 * Exports all utilities for easy importing
 */

const FileUtils = require('./core/FileUtils');
const DataTransformer = require('./data-processing/DataTransformer');
const DataMatcher = require('./data-processing/DataMatcher');
const StatisticsGenerator = require('./data-processing/StatisticsGenerator');
const Logger = require('./utils/Logger');

// Create and export singleton instances
const fileUtils = new FileUtils();
const dataTransformer = new DataTransformer();
const dataMatcher = new DataMatcher();
const statisticsGenerator = new StatisticsGenerator();

module.exports = {
  // Core utilities
  FileUtils,
  fileUtils,

  // Data processing utilities
  DataTransformer,
  dataTransformer,
  DataMatcher,
  dataMatcher,
  StatisticsGenerator,
  statisticsGenerator,

  // Utils
  Logger,

  // Convenience function to create a logger for a specific script
  createLogger: (scriptName) => new Logger(scriptName)
};
