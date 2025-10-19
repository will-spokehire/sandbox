#!/bin/bash
# Seed Collections to Local Database
# 
# This script seeds default collections to the local Supabase database
# Run with: ./scripts/seed-collections-local.sh

set -e

echo "🏷️  Seeding Collections to Local Database..."
echo ""

# Local Supabase connection string
LOCAL_DB="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo "   Install PostgreSQL client tools to continue"
    exit 1
fi

# Run the seed file
psql "$LOCAL_DB" -f sql/setup/seed-collections.sql

echo ""
echo "✅ Collections seeded successfully!"
echo ""
echo "You can now:"
echo "  1. View in Supabase Studio: http://localhost:54323"
echo "  2. Start creating vehicles with collections"

