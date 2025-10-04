/**
 * Apply Performance Indexes to Supabase Database
 * 
 * This script applies the performance optimization indexes to the database.
 * Run with: npx tsx scripts/apply-performance-indexes.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function applyPerformanceIndexes() {
  console.log("🚀 Starting performance index migration...\n");

  try {
    // Try simple version first (without CONCURRENTLY for local dev)
    const simpleSqlFilePath = path.join(
      process.cwd(),
      "prisma",
      "migrations",
      "add_performance_indexes_simple.sql"
    );
    
    const prodSqlFilePath = path.join(
      process.cwd(),
      "prisma",
      "migrations",
      "add_performance_indexes.sql"
    );

    // Use simple version if available, otherwise use production version
    const sqlFilePath = fs.existsSync(simpleSqlFilePath) 
      ? simpleSqlFilePath 
      : prodSqlFilePath;

    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found at ${sqlFilePath}`);
    }

    console.log(`📄 Using: ${path.basename(sqlFilePath)}\n`);
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Split by semicolons and filter out comments and empty lines
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => {
        // Remove single-line comments
        const withoutComments = stmt
          .split("\n")
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .trim();
        return withoutComments.length > 0 && !withoutComments.startsWith("DO $$");
      });

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.trim().length === 0) continue;

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Extract index name for better logging
        const indexNameMatch = statement.match(/"(idx_[^"]+)"/);
        const indexName = indexNameMatch ? indexNameMatch[1] : "unknown";
        
        await prisma.$executeRawUnsafe(statement + ";");
        console.log(`✅ Created index: ${indexName}\n`);
      } catch (error: any) {
        // Check if error is because index already exists
        if (error.message?.includes("already exists")) {
          console.log(`⚠️  Index already exists, skipping...\n`);
        } else {
          console.error(`❌ Error executing statement:\n${statement}\n`);
          throw error;
        }
      }
    }

    // Verify indexes were created
    console.log("\n🔍 Verifying created indexes...\n");
    
    const indexes = await prisma.$queryRaw<Array<{
      schemaname: string;
      tablename: string;
      indexname: string;
    }>>`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (indexname LIKE 'idx_vehicle_%' OR indexname LIKE 'idx_user_%')
      ORDER BY tablename, indexname
    `;

    console.log("📊 Performance Indexes:");
    console.log("━".repeat(80));
    
    const groupedIndexes = indexes.reduce((acc, idx) => {
      if (!acc[idx.tablename]) {
        acc[idx.tablename] = [];
      }
      acc[idx.tablename]!.push(idx.indexname);
      return acc;
    }, {} as Record<string, string[]>);

    for (const [table, idxList] of Object.entries(groupedIndexes)) {
      console.log(`\n${table}:`);
      idxList.forEach((idx) => {
        console.log(`  ✓ ${idx}`);
      });
    }

    console.log("\n" + "━".repeat(80));
    console.log("\n✨ Performance indexes applied successfully!");
    console.log("\n📈 Expected performance improvements:");
    console.log("  • vehicle.list: 30-50% faster");
    console.log("  • vehicle.getFilterOptions: 80-90% faster (with caching)");
    console.log("  • vehicle.getById: 30-40% faster");
    console.log("  • Full-text search: 60-80% faster");
    console.log("\n💡 Remember to monitor query performance in production!");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
applyPerformanceIndexes()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });

