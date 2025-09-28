#!/usr/bin/env tsx

/**
 * Data migration script
 * Run with: npm run migrate-data
 */

import { runMigration } from '../src/lib/migration/migration-runner.js';

async function main() {
  console.log('🚀 Starting data migration script...\n');
  
  try {
    await runMigration();
    console.log('\n✅ Data migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Data migration failed:', error);
    process.exit(1);
  }
}

main();
