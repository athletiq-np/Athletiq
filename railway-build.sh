#!/bin/bash

# Exit on error
set -e

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r athletiq_django/requirements.txt

# Install Node.js dependencies and build frontend
if [ -d "athletiq-frontend" ]; then
    echo "Installing Node.js dependencies..."
    cd athletiq-frontend
    npm install
    
    echo "Building frontend..."
    npm run build
    
    # Move build files to Django's static files directory
    echo "Moving static files..."
    mkdir -p ../athletiq_django/static
    cp -r build/* ../athletiq_django/static/
    cd ..
fi

# Collect static files
echo "Collecting static files..."
cd athletiq_django
python manage.py collectstatic --noinput
cd ..

echo "Build completed successfully!"
