#!/usr/bin/env python3

"""
Database initialization script for Athletiq Django backend
Creates initial data for testing and development
"""

import os
import sys
import django
from pathlib import Path

# Add the Django project to the Python path
sys.path.append(str(Path(__file__).parent))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'athletiq.settings.base')
django.setup()

from django.contrib.auth import get_user_model
from apps.schools.models import School
from apps.athletes.models import Athlete
from apps.guardians.models import Guardian

User = get_user_model()

def create_initial_data():
    """Create initial data for testing"""
    print("🔧 Initializing database with test data...")
    
    # Create superuser
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@athletiq.com',
            password='admin123'
        )
        print("✅ Created superuser: admin / admin123")
    
    # Create school admin user
    if not User.objects.filter(username='schooladmin').exists():
        school_admin = User.objects.create_user(
            username='schooladmin',
            email='admin@test.com',
            password='password123',
            user_type='school_admin'
        )
        print("✅ Created school admin: admin@test.com / password123")
    
    # Create guardian user
    if not User.objects.filter(username='guardian').exists():
        guardian_user = User.objects.create_user(
            username='guardian',
            email='guardian@demo.com',
            password='guardian123',
            user_type='guardian'
        )
        print("✅ Created guardian: guardian@demo.com / guardian123")
    
    # Create a test school
    if not School.objects.filter(name='Test School').exists():
        school = School.objects.create(
            name='Test School',
            address='123 Test Street, Test City',
            phone='123-456-7890',
            email='info@testschool.com',
            registration_status='approved'
        )
        print("✅ Created test school")
    
    # Create a test guardian
    if not Guardian.objects.filter(email='guardian@demo.com').exists():
        guardian = Guardian.objects.create(
            name='Demo Guardian',
            email='guardian@demo.com',
            phone='123-456-7890',
            address='456 Guardian Street, Test City'
        )
        print("✅ Created test guardian")
    
    print("✅ Database initialization completed!")
    print("\n📋 Test Accounts Created:")
    print("- Superuser: admin@athletiq.com / admin123")
    print("- School Admin: admin@test.com / password123")
    print("- Guardian: guardian@demo.com / guardian123")

if __name__ == '__main__':
    try:
        create_initial_data()
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        sys.exit(1)