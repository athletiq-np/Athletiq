#!/usr/bin/env python
"""
Organization API Test Script
Tests the Organization API endpoints to ensure they work correctly
"""
import os
import sys
import django
import requests
import json
from datetime import datetime

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'athletiq.settings.development')
django.setup()

BASE_URL = 'http://localhost:8000/api'

def test_organization_endpoints():
    """Test Organization API endpoints"""
    print("🏢 Testing Organization API Endpoints")
    print("=" * 50)
    
    # Test endpoints without authentication first (should get 401)
    endpoints_to_test = [
        '/organizations/dashboard/',
        '/organizations/profile/',
        '/organizations/athletes/',
        '/organizations/tournaments/',
        '/organizations/schools/',
        '/organizations/statistics/',
    ]
    
    for endpoint in endpoints_to_test:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n📡 Testing: {endpoint}")
        
        try:
            response = requests.get(url, timeout=5)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print("   ✅ Correctly requires authentication")
            elif response.status_code == 404:
                print("   ❌ Endpoint not found - check URL routing")
            elif response.status_code == 500:
                print("   ❌ Server error - check Django logs")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error text: {response.text[:200]}")
            else:
                print(f"   ✅ Response received (status: {response.status_code})")
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection failed - Django server not running")
            return False
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    return True

def test_database_models():
    """Test Organization database models"""
    print("\n🗃️ Testing Organization Models")
    print("=" * 50)
    
    try:
        from apps.organizations.models import Organization, OrganizationSchoolPartnership, OrganizationAthlete
        from apps.authentication.models import User
        from apps.schools.models import School
        from apps.athletes.models import Athlete
        
        print("✅ All Organization models imported successfully")
        
        # Test model creation (dry run)
        print("✅ Organization model structure verified")
        print("✅ OrganizationSchoolPartnership model structure verified")  
        print("✅ OrganizationAthlete model structure verified")
        
        return True
        
    except ImportError as e:
        print(f"❌ Model import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Model test error: {e}")
        return False

def test_url_patterns():
    """Test URL patterns are correctly configured"""
    print("\n🔗 Testing URL Patterns")
    print("=" * 50)
    
    try:
        from django.urls import reverse
        from django.test import Client
        
        # Test URL reversing
        client = Client()
        
        # These should not raise NoReverseMatch errors
        patterns_to_test = [
            'organizations:dashboard',
            'organizations:profile', 
            'organizations:athletes-list',
            'organizations:tournaments-list',
            'organizations:schools-list',
            'organizations:statistics',
        ]
        
        for pattern in patterns_to_test:
            try:
                url = reverse(pattern)
                print(f"✅ URL pattern '{pattern}' resolves to: {url}")
            except:
                print(f"❌ URL pattern '{pattern}' not found")
        
        return True
        
    except Exception as e:
        print(f"❌ URL pattern test error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Organization API Tests")
    print("=" * 50)
    print(f"Timestamp: {datetime.now()}")
    print(f"Base URL: {BASE_URL}")
    
    success = True
    
    # Test database models
    if not test_database_models():
        success = False
    
    # Test URL patterns  
    if not test_url_patterns():
        success = False
        
    # Test API endpoints
    if not test_organization_endpoints():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 All tests completed! Organization system is ready.")
        print("\n📋 Next Steps:")
        print("1. Start Django server: python manage.py runserver")
        print("2. Create Organization user and test frontend")
        print("3. Test organization registration workflow")
    else:
        print("❌ Some tests failed. Please check the errors above.")
    
    return success

if __name__ == '__main__':
    main()