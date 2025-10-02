#!/usr/bin/env tsx

import { remigrate, DEFAULT_FILTERS } from '../src/lib/migration/processed-catalog-migration.js';

async function main() {
  console.log('🔄 Starting processed catalog remigration script...\n');
  
  try {
    await remigrate(DEFAULT_FILTERS);
    console.log('\n🎉 Remigration completed successfully!');
  } catch (error) {
    console.error('\n❌ Remigration failed:', error);
    process.exit(1);
  }
}

main();
