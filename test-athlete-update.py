#!/usr/bin/env python3
"""
Test script to validate athlete update endpoint functionality.
"""

import sys
import os
import django

# Add the project directory to the path
sys.path.append('/path/to/athletiq_django')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'athletiq.settings')

django.setup()

from apps.athletes.models import Athlete
from apps.athletes.serializers import AthleteUpdateSerializer
from apps.schools.models import School

def test_athlete_update():
    """Test athlete update serializer validation."""
    print("🧪 TESTING ATHLETE UPDATE FUNCTIONALITY")
    print("=" * 50)
    
    # Get a test athlete
    athlete = Athlete.objects.first()
    if not athlete:
        print("❌ No athletes found for testing")
        return
    
    print(f"📋 Testing with athlete: {athlete.full_name} (ID: {athlete.id})")
    print(f"   Current school: {athlete.school.name} (ID: {athlete.school.school_id})")
    
    # Test data that matches frontend format
    test_data = {
        'full_name': athlete.full_name,
        'gender': athlete.gender,
        'date_of_birth': athlete.date_of_birth,
        'school_id': athlete.school.school_id,  # Ensure this is an integer
        'height_cm': 170,
        'weight_kg': 65.5,
        'guardian_name': 'Test Guardian',
        'guardian_phone': '9876543210'
    }
    
    print(f"\n📤 Test data:")
    for key, value in test_data.items():
        print(f"   {key}: {value} ({type(value).__name__})")
    
    # Test serializer validation
    serializer = AthleteUpdateSerializer(athlete, data=test_data, partial=True)
    
    if serializer.is_valid():
        print("\n✅ Serializer validation PASSED")
        print("   All fields validated successfully")
        
        # Test save (but don't actually save)
        # validated_data = serializer.validated_data
        # print(f"\n📋 Validated data: {validated_data}")
        
    else:
        print("\n❌ Serializer validation FAILED")
        print("   Errors:")
        for field, errors in serializer.errors.items():
            print(f"   - {field}: {errors}")
    
    # Test school validation specifically
    print(f"\n🏫 Testing school validation:")
    schools = School.objects.filter(is_active=True)[:3]
    for school in schools:
        test_school_data = {
            'school_id': school.school_id,
            'full_name': athlete.full_name,
            'gender': athlete.gender,
            'date_of_birth': athlete.date_of_birth
        }
        
        school_serializer = AthleteUpdateSerializer(athlete, data=test_school_data, partial=True)
        if school_serializer.is_valid():
            print(f"   ✅ School {school.name} (ID: {school.school_id}) - VALID")
        else:
            print(f"   ❌ School {school.name} (ID: {school.school_id}) - INVALID: {school_serializer.errors}")

if __name__ == "__main__":
    test_athlete_update()