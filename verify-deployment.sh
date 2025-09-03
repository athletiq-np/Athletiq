#!/bin/bash

# Railway Deployment Verification Script
# Run this after deployment to verify everything is working

echo "🔍 Verifying Railway deployment..."

# Get the Railway app URL
RAILWAY_URL="https://athletiq.railway.app"

echo "🌐 Testing health endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/health/")

if [ "$response" = "200" ]; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed with status: $response"
    exit 1
fi

echo "🚀 Testing API endpoints..."
api_response=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/")

if [ "$api_response" = "200" ] || [ "$api_response" = "401" ]; then
    echo "✅ API endpoints accessible!"
else
    echo "⚠️  API endpoints returned status: $api_response"
fi

echo "✅ Deployment verification complete!"
echo "🌐 Your app is live at: $RAILWAY_URL"
echo "📋 Admin panel: $RAILWAY_URL/admin/"
echo "🔍 Health check: $RAILWAY_URL/health/"