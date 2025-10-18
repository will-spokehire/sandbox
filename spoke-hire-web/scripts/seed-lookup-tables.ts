#!/usr/bin/env tsx
/**
 * Seed Local Database from Production
 * 
 * This script copies lookup table data from production to local database:
 * - Country, Make, Model, SteeringType, Collection
 * 
 * Usage: tsx scripts/seed-lookup-tables.ts
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Load environment variables from .env file (production)
const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (key === "DIRECT_URL" || key === "DATABASE_URL") {
        if (!process.env[`PROD_${key}`]) {
          process.env[`PROD_${key}`] = value;
        }
      }
    }
  });
}

const prodDbUrl = process.env.PROD_DIRECT_URL ?? process.env.PROD_DATABASE_URL;
const localDbUrl = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

if (!prodDbUrl) {
  console.error("❌ Error: No production database URL found");
  process.exit(1);
}

console.log("🌱 Seeding local database from production...");
console.log("");

const prodDb = new PrismaClient({
  datasources: { db: { url: prodDbUrl } },
});

const localDb = new PrismaClient({
  datasources: { db: { url: localDbUrl } },
});

async function main() {
  try {
    // Seed Countries
    console.log("📍 Seeding Countries...");
    const countries = await prodDb.country.findMany();
    for (const country of countries) {
      await localDb.country.upsert({
        where: { id: country.id },
        update: country,
        create: country,
      });
    }
    console.log(`   ✅ Seeded ${countries.length} countries`);

    // Seed SteeringTypes
    console.log("🚗 Seeding Steering Types...");
    const steeringTypes = await prodDb.steeringType.findMany();
    for (const type of steeringTypes) {
      await localDb.steeringType.upsert({
        where: { id: type.id },
        update: type,
        create: type,
      });
    }
    console.log(`   ✅ Seeded ${steeringTypes.length} steering types`);

    // Seed Collections
    console.log("🏷️  Seeding Collections...");
    const collections = await prodDb.collection.findMany();
    for (const collection of collections) {
      await localDb.collection.upsert({
        where: { id: collection.id },
        update: collection,
        create: collection,
      });
    }
    console.log(`   ✅ Seeded ${collections.length} collections`);

    // Seed Makes
    console.log("🏭 Seeding Makes...");
    const makes = await prodDb.make.findMany();
    for (const make of makes) {
      await localDb.make.upsert({
        where: { id: make.id },
        update: make,
        create: make,
      });
    }
    console.log(`   ✅ Seeded ${makes.length} makes`);

    // Seed Models
    console.log("🚙 Seeding Models...");
    const models = await prodDb.model.findMany();
    for (const model of models) {
      await localDb.model.upsert({
        where: { id: model.id },
        update: model,
        create: model,
      });
    }
    console.log(`   ✅ Seeded ${models.length} models`);

    console.log("");
    console.log("✅ Local database seeded successfully!");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Create test admin user: tsx scripts/create-local-admin.ts");
    console.log("  2. Start the app: npm run dev");
    console.log("  3. Access Supabase Studio: http://localhost:54323");
  } catch (error) {
    console.error("");
    console.error("❌ Error seeding database:");
    console.error(error);
    process.exit(1);
  } finally {
    await prodDb.$disconnect();
    await localDb.$disconnect();
  }
}

main();

