#!/bin/bash

# Deploy to Vercel with Basic Auth
echo "🚀 Deploying to Vercel with Basic Authentication..."
echo "📝 Make sure you have Vercel CLI installed: npm i -g vercel"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it with: npm i -g vercel"
    exit 1
fi

echo "🔧 Choose deployment method:"
echo "1. Deploy entire project (with .vercelignore) - Recommended"
echo "2. Deploy only public folder directly"
echo ""
read -p "Enter your choice (1 or 2): " choice

if [ "$choice" = "2" ]; then
    echo "📁 Deploying only the 'public' folder directly..."
    cd public
    vercel --prod
    cd ..
else
    echo "🔧 Deploying entire project (public folder only via .vercelignore)..."
    echo "📁 Only the 'public' folder (81MB) will be deployed, not the entire project (4.6GB)"
    echo ""
    vercel --prod
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel project dashboard"
echo "2. Navigate to Settings → Environment Variables"
echo "3. Add these environment variables:"
echo "   BASIC_AUTH_USERNAME=your_username"
echo "   BASIC_AUTH_PASSWORD=your_password"
echo ""
echo "🔒 Your website will be protected with basic authentication!"
echo "🌐 Access it at: https://your-project-name.vercel.app"
