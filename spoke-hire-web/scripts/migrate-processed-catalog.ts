#!/usr/bin/env tsx

import { runMigration, DEFAULT_FILTERS } from '../src/lib/migration/processed-catalog-migration.js';

async function main() {
  console.log('🚀 Starting processed catalog migration script...\n');
  
  try {
    await runMigration(DEFAULT_FILTERS);
    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
