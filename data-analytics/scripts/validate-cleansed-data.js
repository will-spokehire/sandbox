const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const DataValidator = require('../lib/utils/DataValidator');

/**
 * Validate the cleansed database CSV file
 */
class CleansedDataValidator {
  constructor() {
    this.inputFile = path.join(__dirname, '../data/cleansed_database.csv');
    this.reportFile = path.join(__dirname, '../data/validation_report.json');
    this.validator = new DataValidator();
  }

  async validate() {
    console.log('🔍 Validating cleansed database...\n');
    console.log(`Input file: ${this.inputFile}\n`);

    try {
      // Read the CSV
      console.log('📖 Reading CSV file...');
      const records = await this.readCsv();
      console.log(`✅ Read ${records.length} records\n`);

      // Validate records
      const results = this.validator.validateRecords(records, 'cleansed');

      // Generate report
      this.validator.generateReport(results, this.reportFile);

      // Exit with appropriate code
      if (!results.valid) {
        console.log('\n❌ Validation failed - data quality issues detected');
        process.exit(1);
      } else {
        console.log('\n✅ Validation passed - all records are valid');
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }

  async readCsv() {
    return new Promise((resolve, reject) => {
      const records = [];
      
      fs.createReadStream(this.inputFile)
        .pipe(csv())
        .on('data', (row) => {
          records.push(row);
        })
        .on('end', () => {
          resolve(records);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}

// Run the validator
async function main() {
  try {
    const validator = new CleansedDataValidator();
    await validator.validate();
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CleansedDataValidator;


