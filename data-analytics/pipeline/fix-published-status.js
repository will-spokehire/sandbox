#!/usr/bin/env node

/**
 * Fix Published Status Pipeline Script
 * 
 * This script corrects the published status in the vehicle catalog data.
 * The issue is that all records are marked as published=true by default,
 * but only catalog records that are visible and in stock should be published.
 * 
 * Logic:
 * - Catalog records: published = visible === true && inventory !== 'OutOfStock'
 * - Cleansed records: published = false (not publicly visible)
 * - Submission records: published = false (not publicly visible)
 * - Multi-source records: published = true if any catalog source is published
 * 
 * Usage:
 * node fix-published-status.js [input-file] [output-file]
 * 
 * Example:
 * node fix-published-status.js ../../spoke-hire-web/public/data/vehicle-catalog.json ../../spoke-hire-web/public/data/vehicle-catalog-fixed.json
 */

const fs = require('fs');
const path = require('path');

function fixPublishedStatus(inputPath, outputPath) {
  console.log('🔧 Fixing published status in vehicle catalog...');
  console.log(`📁 Input: ${inputPath}`);
  console.log(`📁 Output: ${outputPath}`);

  try {
    // Read input data
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    console.log(`📊 Loaded ${data.records.length} records`);

    let fixedCount = 0;
    const stats = {
      catalogOnly: { total: 0, published: 0, unpublished: 0 },
      cleansedOnly: { total: 0, published: 0, unpublished: 0 },
      submissionOnly: { total: 0, published: 0, unpublished: 0 },
      multiSource: { total: 0, published: 0, unpublished: 0 }
    };

    // Process each record
    data.records.forEach((record) => {
      const sources = record.sources;
      const originalPublished = record.vehicle.published;
      let newPublished = false;

      if (sources.length === 1) {
        // Single source records
        if (sources.includes('catalog')) {
          // Catalog-only: published = visible === true && inventory !== 'OutOfStock'
          newPublished = record.vehicle.visible === true && 
                        record.vehicle.inventory !== 'OutOfStock';
          stats.catalogOnly.total++;
          if (newPublished) stats.catalogOnly.published++;
          else stats.catalogOnly.unpublished++;
        } else if (sources.includes('cleansed')) {
          // Cleansed-only: published = false (not publicly visible)
          newPublished = false;
          stats.cleansedOnly.total++;
          if (newPublished) stats.cleansedOnly.published++;
          else stats.cleansedOnly.unpublished++;
        } else if (sources.includes('submission')) {
          // Submission-only: published = false (not publicly visible)
          newPublished = false;
          stats.submissionOnly.total++;
          if (newPublished) stats.submissionOnly.published++;
          else stats.submissionOnly.unpublished++;
        }
      } else {
        // Multi-source records: published = true if any catalog source is published
        const hasPublishedCatalog = sources.includes('catalog') && 
                                   record.vehicle.visible === true && 
                                   record.vehicle.inventory !== 'OutOfStock';
        newPublished = hasPublishedCatalog;
        stats.multiSource.total++;
        if (newPublished) stats.multiSource.published++;
        else stats.multiSource.unpublished++;
      }

      // Update the record if published status changed
      if (originalPublished !== newPublished) {
        record.vehicle.published = newPublished;
        fixedCount++;
      }
    });

    // Save the corrected data
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Saved corrected data to ${outputPath}`);

    // Print statistics
    console.log('\n📊 Published Status Fix Statistics:');
    console.log(`Total records processed: ${data.records.length}`);
    console.log(`Records with changed published status: ${fixedCount}`);
    
    console.log('\n📈 Breakdown by source type:');
    console.log('Catalog-only records:');
    console.log(`  Total: ${stats.catalogOnly.total}, Published: ${stats.catalogOnly.published}, Unpublished: ${stats.catalogOnly.unpublished}`);
    
    console.log('Cleansed-only records:');
    console.log(`  Total: ${stats.cleansedOnly.total}, Published: ${stats.cleansedOnly.published}, Unpublished: ${stats.cleansedOnly.unpublished}`);
    
    console.log('Submission-only records:');
    console.log(`  Total: ${stats.submissionOnly.total}, Published: ${stats.submissionOnly.published}, Unpublished: ${stats.submissionOnly.unpublished}`);
    
    console.log('Multi-source records:');
    console.log(`  Total: ${stats.multiSource.total}, Published: ${stats.multiSource.published}, Unpublished: ${stats.multiSource.unpublished}`);

    console.log('\n✅ Published status fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing published status:', error.message);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputPath = args[0] || '../../spoke-hire-web/public/data/vehicle-catalog.json';
  const outputPath = args[1] || '../../spoke-hire-web/public/data/vehicle-catalog-fixed.json';
  
  fixPublishedStatus(inputPath, outputPath);
}

module.exports = { fixPublishedStatus };
