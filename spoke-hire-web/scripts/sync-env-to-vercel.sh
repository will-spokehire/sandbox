#!/bin/bash

# ===================================================================================
# Sync Environment Variables from .env file to Vercel
# ===================================================================================
#
# This script reads environment variables from a local .env file and sets them
# in Vercel for a specific environment (preview, production, or development).
#
# Usage:
#   ./scripts/sync-env-to-vercel.sh <env-file> <vercel-environment>
#
# Arguments:
#   env-file          - Path to .env file (e.g., .env.preview, .env.production)
#   vercel-environment - Vercel environment: preview, production, or development
#
# Examples:
#   ./scripts/sync-env-to-vercel.sh .env.preview preview
#   ./scripts/sync-env-to-vercel.sh .env.production production
#
# Prerequisites:
#   - Vercel CLI installed: npm i -g vercel
#   - Logged in to Vercel: vercel login
#   - Linked to Vercel project: vercel link
#
# ===================================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -ne 2 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo ""
    echo "Usage: $0 <env-file> <vercel-environment>"
    echo ""
    echo "Arguments:"
    echo "  env-file           - Path to .env file (e.g., .env.preview)"
    echo "  vercel-environment - Vercel environment: preview, production, or development"
    echo ""
    echo "Examples:"
    echo "  $0 .env.preview preview"
    echo "  $0 .env.production production"
    exit 1
fi

ENV_FILE="$1"
VERCEL_ENV="$2"

# Validate environment
if [[ ! "$VERCEL_ENV" =~ ^(preview|production|development)$ ]]; then
    echo -e "${RED}Error: Invalid environment '${VERCEL_ENV}'${NC}"
    echo "Must be one of: preview, production, development"
    exit 1
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: File '${ENV_FILE}' not found${NC}"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed${NC}"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

echo -e "${BLUE}🚀 Syncing environment variables to Vercel${NC}"
echo -e "   Source: ${GREEN}${ENV_FILE}${NC}"
echo -e "   Target: ${GREEN}${VERCEL_ENV}${NC}"
echo ""

# Counter for tracking
TOTAL=0
SUCCESS=0
SKIPPED=0
FAILED=0

# Read the file line by line
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Parse KEY=VALUE
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
        KEY="${BASH_REMATCH[1]}"
        VALUE="${BASH_REMATCH[2]}"
        
        # Remove quotes from value if present
        VALUE="${VALUE#\"}"
        VALUE="${VALUE%\"}"
        VALUE="${VALUE#\'}"
        VALUE="${VALUE%\'}"
        
        # Trim trailing spaces and newlines
        VALUE="${VALUE%%[[:space:]]}"
        VALUE=$(echo "$VALUE" | sed 's/[[:space:]]*$//')
        
        # Skip if value is empty or is a placeholder
        if [[ -z "$VALUE" ]] || [[ "$VALUE" =~ \[.*\] ]] || [[ "$VALUE" == *"example.com"* ]]; then
            echo -e "${YELLOW}⊘ Skipping${NC} ${KEY} (empty or placeholder)"
            ((SKIPPED++))
            ((TOTAL++))
            continue
        fi
        
        echo -e "${BLUE}→ Setting${NC} ${KEY}"
        
        # Set the environment variable in Vercel
        # Use --force to overwrite existing values
        if vercel env add "$KEY" "$VERCEL_ENV" <<< "$VALUE" --force > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Success${NC} ${KEY}"
            ((SUCCESS++))
        else
            echo -e "${RED}✗ Failed${NC}  ${KEY}"
            ((FAILED++))
        fi
        
        ((TOTAL++))
    fi
done < "$ENV_FILE"

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Sync Complete${NC}"
echo ""
echo "Summary:"
echo "  Total variables: $TOTAL"
echo -e "  ${GREEN}Success: $SUCCESS${NC}"
echo -e "  ${YELLOW}Skipped: $SKIPPED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}Failed: $FAILED${NC}"
fi
echo ""
echo "Next steps:"
echo "  1. Verify on Vercel Dashboard: https://vercel.com/dashboard"
echo "  2. Redeploy your project if needed: vercel --prod"
echo ""

