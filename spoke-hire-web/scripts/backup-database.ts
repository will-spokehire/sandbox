#!/usr/bin/env tsx
/**
 * Backup Database Script
 * 
 * Uses native PostgreSQL pg_dump for reliable backups.
 * Creates both SQL and compressed custom format backups.
 * 
 * Usage:
 * ```bash
 * npm run backup-db
 * ```
 * 
 * Options:
 * - Set DATABASE_URL environment variable to backup specific database
 * - Default: Uses DATABASE_URL from .env.local or .env
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

interface BackupOptions {
  databaseUrl: string;
  backupDir: string;
  format: 'sql' | 'custom' | 'both';
}

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function parseDatabaseUrl(url: string): {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
} {
  // Parse DATABASE_URL format: postgresql://user:password@host:port/database
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('Invalid DATABASE_URL format. Expected: postgresql://user:password@host:port/database');
  }

  return {
    user: match[1]!,
    password: match[2]!,
    host: match[3]!,
    port: match[4]!,
    database: match[5]!,
  };
}

async function checkPgDumpAvailable(): Promise<boolean> {
  try {
    execSync('pg_dump --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

async function createBackup(options: BackupOptions): Promise<void> {
  const { databaseUrl, backupDir, format } = options;

  console.log('\n🔄 Starting database backup...\n');

  // Check if pg_dump is available
  const hasPgDump = await checkPgDumpAvailable();
  if (!hasPgDump) {
    console.error('❌ pg_dump is not installed or not in PATH');
    console.error('\nPlease install PostgreSQL client tools:');
    console.error('  macOS:   brew install postgresql');
    console.error('  Ubuntu:  sudo apt-get install postgresql-client');
    console.error('  Windows: Download from https://www.postgresql.org/download/windows/');
    process.exit(1);
  }

  // Parse database URL
  let dbConfig;
  try {
    dbConfig = parseDatabaseUrl(databaseUrl);
  } catch (error) {
    console.error('❌ Error parsing DATABASE_URL:', error);
    process.exit(1);
  }

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const baseFilename = `${dbConfig.database}_${timestamp}`;
  
  const sqlFile = path.join(backupDir, `${baseFilename}.sql`);
  const customFile = path.join(backupDir, `${baseFilename}.dump`);
  const infoFile = path.join(backupDir, `${baseFilename}_info.txt`);

  console.log('📊 Backup Configuration:');
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Format: ${format}`);
  console.log(`   Location: ${backupDir}\n`);

  const backupResults: { format: string; file: string; size: string }[] = [];

  try {
    // SQL Format Backup
    if (format === 'sql' || format === 'both') {
      console.log('1️⃣  Creating SQL backup (human-readable)...');
      
      const sqlCommand = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --clean --if-exists --no-owner --no-privileges > "${sqlFile}"`;
      
      execSync(sqlCommand, { stdio: 'inherit' });
      
      const sqlSize = fs.statSync(sqlFile).size;
      backupResults.push({
        format: 'SQL',
        file: path.basename(sqlFile),
        size: formatBytes(sqlSize),
      });
      
      console.log(`   ✅ SQL backup created: ${path.basename(sqlFile)}`);
      console.log(`   📊 Size: ${formatBytes(sqlSize)}\n`);
    }

    // Custom Format Backup (compressed)
    if (format === 'custom' || format === 'both') {
      console.log('2️⃣  Creating custom format backup (compressed)...');
      
      const customCommand = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --format=custom --compress=9 --clean --if-exists --no-owner --no-privileges -f "${customFile}"`;
      
      execSync(customCommand, { stdio: 'inherit' });
      
      const customSize = fs.statSync(customFile).size;
      backupResults.push({
        format: 'Custom',
        file: path.basename(customFile),
        size: formatBytes(customSize),
      });
      
      console.log(`   ✅ Custom backup created: ${path.basename(customFile)}`);
      console.log(`   📊 Size: ${formatBytes(customSize)}\n`);
    }

    // Create info file
    const infoContent = `Database Backup Information
============================
Date: ${new Date().toISOString()}
Database: ${dbConfig.database}
Host: ${dbConfig.host}:${dbConfig.port}
User: ${dbConfig.user}

Backup Files:
${backupResults.map(r => `- ${r.format} Format: ${r.file} (${r.size})`).join('\n')}

Restore Commands:
-----------------
${backupResults.map(r => {
  if (r.format === 'SQL') {
    return `# From SQL file:\npsql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} < ${backupDir}/${r.file}`;
  } else {
    return `# From custom file:\npg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --clean --if-exists ${backupDir}/${r.file}`;
  }
}).join('\n\n')}

Notes:
------
- SQL format is human-readable and can be viewed/edited
- Custom format is compressed and faster to restore
- Always test restore on a separate database first
- Keep backups in a secure location
- Consider encrypting backups with sensitive data
`;

    fs.writeFileSync(infoFile, infoContent);

    console.log('✅ Backup completed successfully!\n');
    console.log('📁 Backup Files:');
    backupResults.forEach(r => {
      console.log(`   - ${r.format}: ${r.file} (${r.size})`);
    });
    console.log(`   - Info: ${path.basename(infoFile)}\n`);

    console.log('💡 To restore this backup:');
    if (backupResults.some(r => r.format === 'SQL')) {
      const sqlResult = backupResults.find(r => r.format === 'SQL')!;
      console.log(`   SQL:    psql "$DATABASE_URL" < ${backupDir}/${sqlResult.file}`);
    }
    if (backupResults.some(r => r.format === 'Custom')) {
      const customResult = backupResults.find(r => r.format === 'Custom')!;
      console.log(`   Custom: pg_restore -d "$DATABASE_URL" --clean --if-exists ${backupDir}/${customResult.file}`);
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🗄️  Database Backup Tool\n');

  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('\nPlease set DATABASE_URL in your .env.local or .env file');
    console.error('Or provide it when running the script:');
    console.error('  DATABASE_URL="postgresql://..." npm run backup-db');
    process.exit(1);
  }

  // Parse database info for display
  let dbInfo;
  try {
    dbInfo = parseDatabaseUrl(databaseUrl);
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error);
    process.exit(1);
  }

  console.log('📊 Database Information:');
  console.log(`   Database: ${dbInfo.database}`);
  console.log(`   Host: ${dbInfo.host}:${dbInfo.port}`);
  console.log(`   User: ${dbInfo.user}\n`);

  // Confirm backup
  const confirm = await question('⚠️  This will create a backup of the above database. Continue? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Backup cancelled');
    process.exit(0);
  }

  const backupDir = path.join(process.cwd(), 'backups');

  await createBackup({
    databaseUrl,
    backupDir,
    format: 'both', // Create both SQL and custom format
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

