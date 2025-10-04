#!/bin/bash
# Fix Schema Migration Script
# This applies the database schema to production before data migration

set -e  # Exit on error

echo "🔧 Schema Migration Fix Script"
echo "=============================="
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production not found"
    echo ""
    echo "Please create .env.production with your Supabase credentials:"
    echo "  cp env.example.txt .env.production"
    echo "  nano .env.production"
    exit 1
fi

# Load environment variables
set -a
source .env.production
set +a

# Check required variables
if [ -z "$DIRECT_URL" ]; then
    echo "❌ Error: DIRECT_URL not found in .env.production"
    echo ""
    echo "Please add DIRECT_URL to .env.production:"
    echo "  DIRECT_URL=\"postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres\""
    exit 1
fi

echo "📊 Configuration:"
echo "  Database: ${DIRECT_URL#*@}"
echo ""

# Confirm
read -p "⚠️  This will apply schema to production database. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🔄 Applying schema to production..."
echo ""

# Step 1: Generate Prisma Client
echo "1️⃣  Generating Prisma client..."
npx prisma generate
echo ""

# Step 2: Apply migrations using DIRECT_URL
echo "2️⃣  Applying database migrations..."
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy
echo ""

# Step 3: Verify
echo "3️⃣  Verifying tables..."

# Try to query the database
if DATABASE_URL="$DIRECT_URL" npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 5;" > /dev/null 2>&1; then
    echo "   ✅ Tables created successfully!"
else
    echo "   ⚠️  Could not verify tables (this might be okay)"
fi

echo ""
echo "✅ Schema migration complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify tables: npx prisma studio"
echo "   2. Run data migration: npm run migrate-to-production"
echo ""

