# SpokeHire Data Processing Library

A comprehensive, reusable library for processing vehicle catalog data with modular utilities for file operations, data transformation, matching, statistics generation, and logging.

## Features

- **File Utilities** - Read/write JSON and CSV files with error handling
- **Data Transformation** - Convert between different data formats and normalize structures
- **Data Matching** - Find and match records across multiple datasets
- **Statistics Generation** - Analyze datasets and generate comprehensive reports
- **Consistent Logging** - Standardized logging across all scripts
- **Image Processing** - Download and process vehicle images (separate module)

## Installation

The library is included in the SpokeHire project and doesn't require separate installation.

## Usage

### Basic Usage

```javascript
const {
  FileUtils,
  DataTransformer,
  Logger
} = require('./lib');

// Create instances
const fileUtils = new FileUtils();
const dataTransformer = new DataTransformer();
const logger = new Logger('MyScript');
```

### File Operations

```javascript
// Read JSON file
const data = await fileUtils.readJsonFile('my-data.json');

// Write JSON file
await fileUtils.writeJsonFile('output.json', data);

// Read CSV file
const csvData = await fileUtils.readCsvFile('data.csv');
```

### Data Transformation

```javascript
// Process image URLs
const imageUrls = dataTransformer.processImageUrls(imageString);

// Normalize vehicle data
const normalized = dataTransformer.normalizeVehicleData(record, 'catalog');
```

### Logging

```javascript
logger.info('Processing started');
logger.progress(50, 100, 'records');
logger.success('Processing completed');
logger.error('Something went wrong', error);
```

### Advanced Usage

```javascript
const {
  fileUtils,
  dataTransformer,
  dataMatcher,
  statisticsGenerator,
  createLogger
} = require('./lib');

class MyDataProcessor {
  constructor() {
    this.logger = createLogger('MyDataProcessor');
    this.fileUtils = fileUtils;
    this.dataTransformer = dataTransformer;
  }

  async process() {
    this.logger.section('Starting Data Processing');

    // Load data
    const data = await this.fileUtils.readJsonFile('input.json');

    // Transform data
    const transformed = data.map(record =>
      this.dataTransformer.normalizeVehicleData(record, 'cleansed')
    );

    // Generate statistics
    const stats = statisticsGenerator.generateDatasetStats(transformed, 'processed');

    // Save results
    await this.fileUtils.writeJsonFile('output.json', transformed);

    this.logger.success('Processing completed!');
  }
}
```

## Library Structure

### Core Utilities
- **`FileUtils`** - File I/O operations for JSON and CSV files

### Data Processing
- **`DataTransformer`** - Data format conversion and normalization
- **`DataMatcher`** - Record matching across datasets
- **`StatisticsGenerator`** - Dataset analysis and reporting

### Image Processing
- **`ImageProcessor`** - Image downloading and processing utilities

### Utilities
- **`Logger`** - Consistent logging across all scripts

## Data Sources

The library supports three main data sources:

1. **Catalog Data** - Website published vehicle data
2. **Cleansed Data** - Processed form submission data
3. **Submission Data** - Raw form submissions

## Error Handling

All library functions include comprehensive error handling with descriptive error messages. Use try-catch blocks when calling library functions:

```javascript
try {
  const data = await fileUtils.readJsonFile('file.json');
} catch (error) {
  logger.error('Failed to read file', error);
}
```

## Best Practices

1. Always use the Logger utility for consistent output
2. Handle errors appropriately with try-catch blocks
3. Use progress reporting for long-running operations
4. Leverage the data normalization functions for consistent data structures
5. Generate statistics to validate your data processing results

## Examples

See `scripts/convertCsvToJson_refactored.js` for a complete example of using the library to refactor existing scripts.

## Migration Guide

To migrate existing scripts to use the library:

1. Import the required utilities
2. Replace direct file operations with FileUtils methods
3. Replace manual data transformations with DataTransformer methods
4. Add consistent logging with the Logger utility
5. Use StatisticsGenerator for data validation

The library significantly reduces code duplication and makes scripts more maintainable and testable.
