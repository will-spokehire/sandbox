#!/usr/bin/env tsx
/**
 * Seed lookup data (Makes, Models, SteeringTypes, Countries)
 * 
 * This script uses Prisma Client to properly handle cUID generation
 * Run with: npm run seed-lookups or tsx scripts/seed-lookups.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding lookup data...\n");

  // Seed Countries
  console.log("1️⃣  Seeding Countries...");
  const countries = await prisma.country.createMany({
    data: [
      { id: "country_england", name: "England", code: "GB-ENG", isActive: true },
      { id: "country_scotland", name: "Scotland", code: "GB-SCT", isActive: true },
      { id: "country_wales", name: "Wales", code: "GB-WLS", isActive: true },
      { id: "country_northern_ireland", name: "Northern Ireland", code: "GB-NIR", isActive: true },
      { id: "country_ireland", name: "Ireland", code: "IE", isActive: true },
    ],
    skipDuplicates: true,
  });
  console.log(`   ✅ Created ${countries.count} countries\n`);

  // Seed Makes
  console.log("2️⃣  Seeding Makes...");
  const makeData = [
    { name: "Audi", slug: "audi" },
    { name: "BMW", slug: "bmw" },
    { name: "Mercedes-Benz", slug: "mercedes-benz" },
    { name: "Volkswagen", slug: "volkswagen" },
    { name: "Toyota", slug: "toyota" },
    { name: "Honda", slug: "honda" },
    { name: "Ford", slug: "ford" },
    { name: "Tesla", slug: "tesla" },
    { name: "Porsche", slug: "porsche" },
    { name: "Jaguar", slug: "jaguar" },
    { name: "Land Rover", slug: "land-rover" },
    { name: "Mini", slug: "mini" },
    { name: "Nissan", slug: "nissan" },
    { name: "Peugeot", slug: "peugeot" },
    { name: "Renault", slug: "renault" },
    { name: "Volvo", slug: "volvo" },
    { name: "AC", slug: "ac" },
  ];

  for (const make of makeData) {
    await prisma.make.upsert({
      where: { name: make.name },
      update: {},
      create: make,
    });
  }
  console.log(`   ✅ Created/updated ${makeData.length} makes\n`);

  // Seed Models
  console.log("3️⃣  Seeding Models...");
  
  const makeIds = await prisma.make.findMany({
    select: { id: true, name: true },
  });
  
  const makeMap = new Map(makeIds.map((m) => [m.name, m.id]));

  const modelData = [
    // Audi
    { name: "A3", slug: "a3", makeName: "Audi" },
    { name: "A4", slug: "a4", makeName: "Audi" },
    { name: "A6", slug: "a6", makeName: "Audi" },
    { name: "Q5", slug: "q5", makeName: "Audi" },
    { name: "Q7 V12 TDI", slug: "q7-v12-tdi", makeName: "Audi" },
    // BMW
    { name: "3 Series", slug: "3-series", makeName: "BMW" },
    { name: "5 Series", slug: "5-series", makeName: "BMW" },
    { name: "X5", slug: "x5", makeName: "BMW" },
    // Mercedes
    { name: "C-Class", slug: "c-class", makeName: "Mercedes-Benz" },
    { name: "E-Class", slug: "e-class", makeName: "Mercedes-Benz" },
    { name: "GLE", slug: "gle", makeName: "Mercedes-Benz" },
    // Tesla
    { name: "Model 3", slug: "model-3", makeName: "Tesla" },
    { name: "Model S", slug: "model-s", makeName: "Tesla" },
    { name: "Model X", slug: "model-x", makeName: "Tesla" },
    { name: "Model Y", slug: "model-y", makeName: "Tesla" },
    // AC
    { name: "Greyhound", slug: "greyhound", makeName: "AC" },
  ];

  for (const model of modelData) {
    const makeId = makeMap.get(model.makeName);
    if (!makeId) {
      console.warn(`   ⚠️  Make not found: ${model.makeName}`);
      continue;
    }

    await prisma.model.upsert({
      where: { 
        makeId_slug: { 
          makeId, 
          slug: model.slug 
        } 
      },
      update: {},
      create: {
        name: model.name,
        slug: model.slug,
        makeId,
      },
    });
  }
  console.log(`   ✅ Created/updated ${modelData.length} models\n`);

  // Seed Steering Types
  console.log("4️⃣  Seeding Steering Types...");
  const steeringTypes = [
    { name: "Right Hand Drive", code: "RHD" },
    { name: "Left Hand Drive", code: "LHD" },
    { name: "Single Seated", code: "SS" },
  ];

  for (const st of steeringTypes) {
    await prisma.steeringType.upsert({
      where: { name: st.name },
      update: {},
      create: st,
    });
  }
  console.log(`   ✅ Created/updated ${steeringTypes.length} steering types\n`);

  console.log("✅ Seeding complete!");
  console.log("");
  console.log("💡 To seed collections, run:");
  console.log("   ./scripts/seed-collections-local.sh");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

