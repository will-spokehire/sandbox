#!/usr/bin/env tsx
/**
 * Local Development Setup Script
 * 
 * Automates the complete local Supabase setup process:
 * 1. Starts Supabase services
 * 2. Enables PostGIS extension
 * 3. Pushes Prisma schema
 * 4. Seeds lookup tables
 * 5. Creates .env.local file
 * 
 * Usage: npm run local:setup
 */

import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";

console.log("🚀 Starting Local Development Setup\n");

// Check if Docker is running
console.log("🐳 Checking Docker...");
try {
  execSync("docker info", { stdio: "ignore" });
  console.log("   ✅ Docker is running\n");
} catch {
  console.error("   ❌ Docker is not running");
  console.error("   Please start Docker Desktop and try again\n");
  process.exit(1);
}

// Start Supabase
console.log("📦 Starting Supabase services...");
try {
  execSync("npx supabase start", { stdio: "inherit" });
  console.log("   ✅ Supabase started\n");
} catch (error) {
  console.error("   ❌ Failed to start Supabase");
  console.error(error);
  process.exit(1);
}

// Enable PostGIS
console.log("🗺️  Enabling PostGIS extension...");
try {
  execSync(
    'psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "CREATE EXTENSION IF NOT EXISTS postgis;"',
    { stdio: "pipe" }
  );
  console.log("   ✅ PostGIS enabled\n");
} catch (error) {
  console.error("   ⚠️  PostGIS might already be enabled (this is fine)\n");
}

// Push Prisma schema
console.log("📊 Pushing Prisma schema...");
try {
  execSync(
    'DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" npx prisma db push --accept-data-loss',
    { stdio: "inherit", env: { ...process.env } }
  );
  console.log("   ✅ Schema pushed\n");
} catch (error) {
  console.error("   ❌ Failed to push schema");
  console.error(error);
  process.exit(1);
}

// Create storage bucket
console.log("📁 Creating storage bucket...");
try {
  execSync(
    `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('vehicle-images', 'vehicle-images', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']) ON CONFLICT (id) DO NOTHING;"`,
    { stdio: "pipe" }
  );
  console.log("   ✅ Storage bucket created\n");
} catch (error) {
  console.error("   ⚠️  Storage bucket might already exist (this is fine)\n");
}

// Seed lookup tables
console.log("🌱 Seeding lookup tables...");
try {
  execSync("npm run seed-lookup-tables", { stdio: "inherit" });
  console.log("   ✅ Lookup tables seeded\n");
} catch (error) {
  console.error("   ❌ Failed to seed lookup tables");
  console.error("   Make sure your .env file has valid production credentials");
  console.error(error);
  process.exit(1);
}

// Create .env.local if it doesn't exist
if (!existsSync(".env.local")) {
  console.log("📝 Creating .env.local...");
  const envLocal = `# Local Supabase Development Environment
# Auto-generated - do not commit!

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# Environment
NODE_ENV="development"

# Email Debug Mode
EMAIL_DEBUG="true"
TEST_EMAIL_OVERRIDE="dev@example.com"
LOOPS_API_KEY=""
LOOPS_TRANSACTIONAL_ID="deal-notification"
`;
  writeFileSync(".env.local", envLocal);
  console.log("   ✅ .env.local created\n");
} else {
  console.log("📝 .env.local already exists (skipping)\n");
}

// Final instructions
console.log("✅ Local development setup complete!\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("\n📋 Next Steps:\n");
console.log("1. Create an admin user:");
console.log("   npm run create-admin-user\n");
console.log("2. Start the application:");
console.log("   npm run dev\n");
console.log("3. Access the app:");
console.log("   http://localhost:3000\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("\n🛠️  Useful URLs:\n");
console.log("   • Supabase Studio: http://localhost:54323");
console.log("   • Email Testing:   http://localhost:54324");
console.log("   • API Endpoint:    http://localhost:54321\n");
console.log("📚 Documentation:");
console.log("   docs/setup/local-development.md\n");

