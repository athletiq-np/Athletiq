#!/bin/bash

# Railway Build Script for Athletiq Django Backend
set -e

echo "🚀 Starting Athletiq build process..."
echo "Working directory: $(pwd)"
echo "Contents: $(ls -la)"

# Check if we're in the right directory
if [ ! -d "athletiq_django" ]; then
    echo "❌ Error: athletiq_django directory not found!"
    echo "Current directory contents:"
    ls -la
    exit 1
fi

# Navigate to Django project directory
echo "📂 Navigating to Django project..."
cd athletiq_django

echo "📋 Django directory contents:"
ls -la

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🗃️ Running database migrations..."
python manage.py migrate --noinput

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "✅ Build completed successfully!"
echo "🎯 Ready for deployment!"