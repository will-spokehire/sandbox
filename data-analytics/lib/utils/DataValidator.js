/**
 * Data Validator
 * Validates vehicle data to detect common data quality issues
 */
class DataValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Reset errors and warnings
   */
  reset() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Check if a string contains URLs or file paths
   */
  containsUrls(value) {
    if (!value || typeof value !== 'string') return false;
    
    const urlPatterns = [
      /https?:\/\//i,        // http:// or https://
      /www\./i,               // www.
      /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)/i, // Image/video extensions
      /~mv2\./i,              // Wix image pattern
      /[a-f0-9]{6}_[a-f0-9]{32}~mv2/i  // Wix image ID pattern
    ];
    
    return urlPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Validate a single vehicle record
   */
  validateVehicleRecord(record, recordId, source = 'unknown') {
    const recordErrors = [];
    const recordWarnings = [];

    // Field definitions for different sources
    const fieldChecks = {
      catalog: [
        { field: 'name', label: 'Vehicle Name', required: true },
        { field: 'productImageUrl', label: 'Product Image URL', allowUrls: true }
      ],
      cleansed: [
        { field: 'Make', label: 'Make', required: true },
        { field: 'Model', label: 'Model', required: false }, // Some records legitimately don't have models
        { field: 'Year of manufacture', label: 'Year', required: false },
        { field: 'Registration', label: 'Registration', required: false },
        { field: 'Upload vehicle images', label: 'Upload Images', allowUrls: true }
      ],
      submission: [
        { field: 'make_1', label: 'Make', required: true },
        { field: 'location_1', label: 'Model/Location', required: false }
      ]
    };

    // Get field checks for this source
    const checks = fieldChecks[source] || [];

    for (const check of checks) {
      const value = record[check.field];

      // Check if required field is missing
      if (check.required && (!value || value.trim() === '')) {
        recordErrors.push({
          recordId,
          field: check.field,
          message: `Required field "${check.label}" is missing or empty`,
          severity: 'error'
        });
        continue;
      }

      // Skip if value is empty and not required
      if (!value || value.trim() === '') {
        continue;
      }

      // Check if field contains URLs when it shouldn't
      if (!check.allowUrls && this.containsUrls(value)) {
        recordErrors.push({
          recordId,
          field: check.field,
          value: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
          message: `Field "${check.label}" contains URLs or file paths but shouldn't`,
          severity: 'error',
          suggestion: 'This field should contain only the vehicle information, not image URLs'
        });
      }

      // Additional validations
      if (check.field === 'Year of manufacture' || check.field === 'year') {
        const yearMatch = value.match(/\d{4}/);
        if (!yearMatch) {
          recordWarnings.push({
            recordId,
            field: check.field,
            value: value,
            message: `Year field "${check.label}" doesn't contain a valid 4-digit year`,
            severity: 'warning'
          });
        } else {
          const year = parseInt(yearMatch[0]);
          if (year < 1900 || year > new Date().getFullYear() + 1) {
            recordWarnings.push({
              recordId,
              field: check.field,
              value: value,
              message: `Year ${year} seems unusual (expected 1900-${new Date().getFullYear() + 1})`,
              severity: 'warning'
            });
          }
        }
      }
    }

    return { errors: recordErrors, warnings: recordWarnings };
  }

  /**
   * Validate an array of vehicle records
   */
  validateRecords(records, source = 'unknown') {
    this.reset();
    
    console.log(`\n🔍 Validating ${records.length} ${source} records...\n`);
    
    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordId = record.id || record['Wix ID'] || record.handleId || i;
      
      const { errors, warnings } = this.validateVehicleRecord(record, recordId, source);
      
      if (errors.length > 0) {
        this.errors.push(...errors);
        errorCount++;
      } else if (warnings.length === 0) {
        validCount++;
      }
      
      if (warnings.length > 0) {
        this.warnings.push(...warnings);
        warningCount++;
      }
    }

    // Print summary
    console.log('📊 Validation Summary:');
    console.log(`   Total records: ${records.length}`);
    console.log(`   Valid records: ${validCount}`);
    console.log(`   Records with errors: ${errorCount}`);
    console.log(`   Records with warnings: ${warningCount}`);
    console.log(`   Total errors: ${this.errors.length}`);
    console.log(`   Total warnings: ${this.warnings.length}`);

    // Print errors
    if (this.errors.length > 0) {
      console.log('\n❌ Errors found:');
      this.errors.slice(0, 10).forEach(error => {
        console.log(`   Record ${error.recordId} - ${error.field}:`);
        console.log(`      ${error.message}`);
        if (error.value) {
          console.log(`      Value: ${error.value}`);
        }
        if (error.suggestion) {
          console.log(`      💡 ${error.suggestion}`);
        }
      });
      
      if (this.errors.length > 10) {
        console.log(`   ... and ${this.errors.length - 10} more errors`);
      }
    }

    // Print warnings
    if (this.warnings.length > 0 && this.warnings.length <= 5) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => {
        console.log(`   Record ${warning.recordId} - ${warning.field}: ${warning.message}`);
      });
    } else if (this.warnings.length > 5) {
      console.log(`\n⚠️  ${this.warnings.length} warnings found (showing first 5):`);
      this.warnings.slice(0, 5).forEach(warning => {
        console.log(`   Record ${warning.recordId} - ${warning.field}: ${warning.message}`);
      });
    }

    return {
      valid: this.errors.length === 0,
      summary: {
        total: records.length,
        valid: validCount,
        errors: errorCount,
        warnings: warningCount
      },
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Generate a validation report
   */
  generateReport(results, outputFile = null) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: results.summary,
      errors: this.errors,
      warnings: this.warnings
    };

    if (outputFile) {
      const fs = require('fs-extra');
      fs.writeJsonSync(outputFile, report, { spaces: 2 });
      console.log(`\n📄 Validation report saved to: ${outputFile}`);
    }

    return report;
  }
}

module.exports = DataValidator;

