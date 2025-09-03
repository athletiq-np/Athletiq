#!/bin/bash

# Railway Build Script for Athletiq Django Backend
set -e

echo "🚀 Starting Athletiq build process..."

# Navigate to Django project directory
cd athletiq_django

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🗃️ Running database migrations..."
python manage.py migrate --noinput

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "✅ Build completed successfully!"