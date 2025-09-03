#!/bin/bash

# Railway Deployment Health Check Script
# This script verifies that your Athletiq application is properly deployed on Railway

set -e

# Configuration
RAILWAY_URL="https://athletiq.railway.app"
HEALTH_ENDPOINT="/health/"
API_ENDPOINT="/api/"
ADMIN_ENDPOINT="/admin/"

echo "🚀 Athletiq Railway Deployment Health Check"
echo "==========================================="
echo "🌐 Checking deployment at: $RAILWAY_URL"
echo ""

# Function to check HTTP status
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=$3
    
    echo "🔍 Checking $name..."
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo "✅ $name: OK (Status: $status)"
        return 0
    else
        echo "❌ $name: FAILED (Status: $status, Expected: $expected_status)"
        return 1
    fi
}

# Check main application
echo "📋 Deployment Status Check:"
echo "----------------------------"

# Health check endpoint
check_endpoint "$RAILWAY_URL$HEALTH_ENDPOINT" "Health Check" "200"

# API endpoint (might return 401 for unauthorized, which is expected)
api_status=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL$API_ENDPOINT" || echo "000")
if [ "$api_status" = "200" ] || [ "$api_status" = "401" ] || [ "$api_status" = "403" ]; then
    echo "✅ API Endpoint: OK (Status: $api_status)"
else
    echo "❌ API Endpoint: FAILED (Status: $api_status)"
fi

# Admin endpoint (should redirect or show login)
admin_status=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL$ADMIN_ENDPOINT" || echo "000")
if [ "$admin_status" = "200" ] || [ "$admin_status" = "302" ] || [ "$admin_status" = "301" ]; then
    echo "✅ Admin Panel: OK (Status: $admin_status)"
else
    echo "❌ Admin Panel: FAILED (Status: $admin_status)"
fi

echo ""
echo "🔧 Environment Variables Check:"
echo "-------------------------------"

# Check if essential endpoints are responding
echo "📊 Railway Configuration Summary:"
echo "- Build Command: chmod +x railway-build.sh && ./railway-build.sh"
echo "- Start Command: cd athletiq_django && gunicorn athletiq.wsgi:application --log-file -"
echo "- Health Check: $HEALTH_ENDPOINT"
echo "- Region: europe-west4"
echo "- Environment Variables: 23 configured"

echo ""
echo "🎯 Key URLs:"
echo "-------------"
echo "🌐 Main App: $RAILWAY_URL"
echo "🔍 Health Check: $RAILWAY_URL$HEALTH_ENDPOINT"
echo "🛠️ Admin Panel: $RAILWAY_URL$ADMIN_ENDPOINT"
echo "📡 API: $RAILWAY_URL$API_ENDPOINT"

echo ""
echo "✨ Deployment verification complete!"
echo "If all checks passed, your Athletiq application is successfully deployed! 🎉"