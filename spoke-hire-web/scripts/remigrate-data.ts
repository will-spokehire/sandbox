#!/usr/bin/env tsx

/**
 * Remigration script - cleans database and runs fresh migration
 * Run with: npm run remigrate-data
 */

import { remigrate } from '../src/lib/migration/migration-runner.js';
import type { SourceRecord } from '../src/lib/migration/data-mappers.js';
import path from 'path';
import fs from 'fs/promises';

interface DataSources {
  catalog: SourceRecord[];
  cleansed: SourceRecord[];
  submission: SourceRecord[];
}

async function loadDataSources(): Promise<DataSources> {
  const dataDir = path.join(process.cwd(), '../data-analitics/data');
  
  console.log('📥 Loading data sources...');
  
  const sources: DataSources = {
    catalog: [],
    cleansed: [],
    submission: []
  };

  // Load catalog data
  try {
    const catalogPath = path.join(dataDir, 'catalog_products.json');
    const catalogContent = await fs.readFile(catalogPath, 'utf-8');
    sources.catalog = JSON.parse(catalogContent);
    console.log(`✅ Loaded ${sources.catalog.length} catalog records`);
  } catch (error) {
    console.log('⚠️ Catalog data not found');
  }

  // Load cleansed data
  try {
    const cleansedPath = path.join(dataDir, 'cleansed_database.json');
    const cleansedContent = await fs.readFile(cleansedPath, 'utf-8');
    sources.cleansed = JSON.parse(cleansedContent);
    console.log(`✅ Loaded ${sources.cleansed.length} cleansed records`);
  } catch (error) {
    console.log('⚠️ Cleansed data not found');
  }

  // Load submission data
  try {
    const submissionPath = path.join(dataDir, 'submission.from.1march.2025.json');
    const submissionContent = await fs.readFile(submissionPath, 'utf-8');
    sources.submission = JSON.parse(submissionContent);
    console.log(`✅ Loaded ${sources.submission.length} submission records`);
  } catch (error) {
    console.log('⚠️ Submission data not found');
  }

  return sources;
}

async function main() {
  console.log('🔄 Starting remigration process...\n');
  
  try {
    const sources = await loadDataSources();
    
    const stats = await remigrate(
      sources.catalog,
      sources.cleansed,
      sources.submission
    );
    
    console.log('\n🎉 Remigration completed successfully!');
    console.log('📊 Final Statistics:', stats);
    
  } catch (error) {
    console.error('❌ Remigration failed:', error);
    process.exit(1);
  }
}

main();
