#!/usr/bin/env python
"""
Create a test school and associate it with the admin user
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'athletiq.settings')
django.setup()

from django.contrib.auth.models import User
from apps.schools.models import School

def create_test_school():
    try:
        # Get admin user
        admin_user = User.objects.get(email='admin@admin.com')
        print(f"Found admin user: {admin_user.username}")
        
        # Check if school already exists
        existing_school = School.objects.filter(admin=admin_user).first()
        if existing_school:
            print(f"Admin user already has a school: {existing_school.name}")
            return existing_school
        
        # Check if any schools exist
        existing_schools = School.objects.all()
        print(f"Existing schools: {list(existing_schools.values('id', 'name', 'admin_id'))}")
        
        if existing_schools.exists():
            # Associate admin with first existing school
            first_school = existing_schools.first()
            first_school.admin = admin_user
            first_school.save()
            print(f"Associated admin user with existing school: {first_school.name}")
            return first_school
        else:
            # Create a new test school
            test_school = School.objects.create(
                name="Test School",
                admin=admin_user,
                address="123 Test Street",
                phone="123-456-7890",
                email="test@testschool.com",
                principal_name="Test Principal",
                establishment_year=2020,
                school_type="Public",
                is_active=True
            )
            print(f"Created new test school: {test_school.name}")
            return test_school
            
    except User.DoesNotExist:
        print("Admin user not found!")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    create_test_school()