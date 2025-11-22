#!/bin/bash
# Migrate Preview Database
# Loads environment from .env.preview and runs Prisma migrate deploy

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Migrating Preview Database"
echo "================================"
echo ""

# Check if .env.preview exists
if [ ! -f "$PROJECT_ROOT/.env.preview" ]; then
    echo "❌ Error: .env.preview not found"
    echo "   Create it from env.preview.example.txt"
    exit 1
fi

echo "✅ Loading environment from .env.preview"
echo ""

# Load environment variables from .env.preview
set -a
source "$PROJECT_ROOT/.env.preview"
set +a

# Verify required variables are set
if [ -z "$DIRECT_URL" ]; then
    echo "❌ Error: DIRECT_URL not set in .env.preview"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env.preview"
    exit 1
fi

echo "📊 Database: ${DIRECT_URL:0:30}..."
echo ""
echo "🔄 Running Prisma migrate deploy..."
echo ""

# Run Prisma migrate deploy
cd "$PROJECT_ROOT"
npx prisma migrate deploy

echo ""
echo "✅ Migration complete!"
echo ""

