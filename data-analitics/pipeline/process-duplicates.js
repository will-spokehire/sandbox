#!/usr/bin/env node

/**
 * Duplicate Processing Pipeline Script
 * 
 * This script processes vehicle catalog data to handle duplicates by:
 * 1. Keeping all records but marking duplicates
 * 2. Creating unique IDs for duplicate records (originalId-index)
 * 3. Adding metadata about duplicate relationships
 * 
 * Usage:
 * node process-duplicates.js [input-file] [output-file]
 * 
 * Example:
 * node process-duplicates.js ../data/vehicle-catalog.json ../data/vehicle-catalog-with-duplicates.json
 */

const fs = require('fs');
const path = require('path');

function processDuplicates(inputPath, outputPath) {
  console.log('🔄 Processing duplicates in vehicle catalog...');
  console.log(`📁 Input: ${inputPath}`);
  console.log(`📁 Output: ${outputPath}`);

  try {
    // Read input data
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    console.log(`📊 Loaded ${data.records.length} records`);

    // Track IDs and their occurrences
    const idTracker = {};
    const processedRecords = [];

    // Process each record
    data.records.forEach((record, index) => {
      const originalId = record.id;
      
      // Initialize tracking for this ID
      if (!idTracker[originalId]) {
        idTracker[originalId] = {
          count: 0,
          isDuplicate: false
        };
      }
      
      idTracker[originalId].count++;
      
      // Create a new record with duplicate information
      const newRecord = {
        ...record,
        id: originalId, // Keep original ID for first occurrence
        duplicate: false,
        originalId: originalId,
        duplicateIndex: 0,
        hasDuplicates: false,
        duplicateCount: 1
      };
      
      // If this is not the first occurrence, mark as duplicate and create unique ID
      if (idTracker[originalId].count > 1) {
        idTracker[originalId].isDuplicate = true;
        newRecord.duplicate = true;
        newRecord.duplicateIndex = idTracker[originalId].count - 1;
        newRecord.id = `${originalId}-${newRecord.duplicateIndex}`;
        
        // Also mark the first occurrence as having duplicates
        const firstOccurrenceIndex = processedRecords.findIndex(r => r.originalId === originalId);
        if (firstOccurrenceIndex !== -1) {
          processedRecords[firstOccurrenceIndex].hasDuplicates = true;
          processedRecords[firstOccurrenceIndex].duplicateCount = idTracker[originalId].count;
        }
      }
      
      processedRecords.push(newRecord);
    });

    // Update first occurrences to indicate they have duplicates
    Object.entries(idTracker).forEach(([id, info]) => {
      if (info.isDuplicate) {
        const firstOccurrence = processedRecords.find(r => r.originalId === id && r.duplicate === false);
        if (firstOccurrence) {
          firstOccurrence.hasDuplicates = true;
          firstOccurrence.duplicateCount = info.count;
        }
      }
    });

    // Calculate statistics
    const stats = {
      totalRecords: processedRecords.length,
      uniqueIds: Object.keys(idTracker).length,
      duplicateGroups: Object.entries(idTracker).filter(([id, info]) => info.isDuplicate).length,
      totalDuplicates: processedRecords.filter(r => r.duplicate).length,
      recordsWithDuplicates: processedRecords.filter(r => r.hasDuplicates).length
    };

    console.log('\n📈 Processing Statistics:');
    console.log(`   Total records: ${stats.totalRecords}`);
    console.log(`   Unique IDs: ${stats.uniqueIds}`);
    console.log(`   IDs with duplicates: ${stats.duplicateGroups}`);
    console.log(`   Duplicate records: ${stats.totalDuplicates}`);
    console.log(`   Records with duplicates: ${stats.recordsWithDuplicates}`);

    // Create new catalog with duplicate-aware data
    const duplicateAwareCatalog = {
      ...data,
      records: processedRecords,
      metadata: {
        ...data.metadata,
        totalRecords: stats.totalRecords,
        uniqueIds: stats.uniqueIds,
        duplicateGroups: stats.duplicateGroups,
        totalDuplicates: stats.totalDuplicates,
        processingDate: new Date().toISOString(),
        processingType: 'duplicate-aware',
        processingScript: 'process-duplicates.js'
      }
    };

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save processed data
    fs.writeFileSync(outputPath, JSON.stringify(duplicateAwareCatalog, null, 2));
    
    console.log(`\n✅ Successfully processed duplicates!`);
    console.log(`📁 Output saved to: ${outputPath}`);
    
    // Show sample of processed duplicates
    console.log('\n🔍 Sample of processed duplicates:');
    const sampleDuplicates = processedRecords.filter(r => r.duplicate).slice(0, 3);
    sampleDuplicates.forEach(record => {
      console.log(`   ID: ${record.id} (original: ${record.originalId}) - ${record.vehicle?.name || 'N/A'}`);
    });

    return {
      success: true,
      stats,
      outputPath
    };

  } catch (error) {
    console.error('❌ Error processing duplicates:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node process-duplicates.js [input-file] [output-file]');
    console.log('Example: node process-duplicates.js ../data/vehicle-catalog.json ../data/vehicle-catalog-with-duplicates.json');
    process.exit(1);
  }

  const [inputPath, outputPath] = args;
  
  // Resolve relative paths
  const resolvedInputPath = path.resolve(inputPath);
  const resolvedOutputPath = path.resolve(outputPath);
  
  const result = processDuplicates(resolvedInputPath, resolvedOutputPath);
  
  if (!result.success) {
    process.exit(1);
  }
}

module.exports = { processDuplicates };
