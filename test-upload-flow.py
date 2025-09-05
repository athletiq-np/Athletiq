"""
Comprehensive test to trace the complete file upload flow.
This will help identify where exactly the authentication issue occurs.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = 'http://localhost:8000'
API_URL = f'{BASE_URL}/api'

def test_upload_flow():
    """Test the complete upload flow from login to file upload."""
    
    print("🔍 Testing Complete Upload Flow")
    print("=" * 50)
    
    # Step 1: Login and get tokens
    print("\n1️⃣ Step 1: Login and Authentication")
    login_data = {
        "username": "admin",  # Replace with actual admin username
        "password": "admin123"  # Replace with actual admin password
    }
    
    try:
        login_response = requests.post(f'{API_URL}/auth/login/', json=login_data)
        print(f"Login Status Code: {login_response.status_code}")
        
        if login_response.status_code == 200:
            tokens = login_response.json()
            access_token = tokens.get('access')
            refresh_token = tokens.get('refresh')
            print(f"✅ Login successful")
            print(f"Access Token: {access_token[:50]}...")
            print(f"Refresh Token: {refresh_token[:50]}...")
        else:
            print(f"❌ Login failed: {login_response.text}")
            return
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 2: Test normal update (JSON) - this should work
    print("\n2️⃣ Step 2: Test Normal Update (JSON)")
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    # Test data for normal update
    normal_update_data = {
        'full_name': 'Test Athlete Updated',
        'primary_sport': 'Basketball'
    }
    
    try:
        # Assuming athlete ID 1 exists - replace with actual ID
        athlete_id = 1
        normal_response = requests.put(
            f'{API_URL}/athletes/{athlete_id}/',
            json=normal_update_data,
            headers=headers
        )
        print(f"Normal Update Status Code: {normal_response.status_code}")
        
        if normal_response.status_code == 200:
            print("✅ Normal update successful")
        else:
            print(f"❌ Normal update failed: {normal_response.text}")
            
    except Exception as e:
        print(f"❌ Normal update error: {e}")
    
    # Step 3: Test file upload with same authentication
    print("\n3️⃣ Step 3: Test File Upload (FormData)")
    
    # Create a test image file
    test_image_content = b'fake_image_content'
    
    # Prepare FormData for file upload
    files = {
        'profile_photo': ('test_profile.jpg', test_image_content, 'image/jpeg')
    }
    
    # FormData with other fields
    form_data = {
        'full_name': 'Test Athlete with Photo',
        'primary_sport': 'Basketball'
    }
    
    # Headers for FormData (no Content-Type - let requests handle it)
    file_headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    try:
        file_response = requests.put(
            f'{API_URL}/athletes/{athlete_id}/',
            data=form_data,
            files=files,
            headers=file_headers
        )
        print(f"File Upload Status Code: {file_response.status_code}")
        
        if file_response.status_code == 200:
            print("✅ File upload successful")
        else:
            print(f"❌ File upload failed: {file_response.text}")
            print(f"Response headers: {dict(file_response.headers)}")
            
    except Exception as e:
        print(f"❌ File upload error: {e}")
    
    # Step 4: Test token validation separately
    print("\n4️⃣ Step 4: Test Token Validation")
    try:
        token_check_response = requests.get(
            f'{API_URL}/auth/user/',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        print(f"Token Check Status Code: {token_check_response.status_code}")
        
        if token_check_response.status_code == 200:
            print("✅ Token is valid")
            user_info = token_check_response.json()
            print(f"User: {user_info}")
        else:
            print(f"❌ Token validation failed: {token_check_response.text}")
            
    except Exception as e:
        print(f"❌ Token check error: {e}")
    
    # Step 5: Test with different Content-Type headers
    print("\n5️⃣ Step 5: Test Different Header Configurations")
    
    # Test 1: With explicit multipart/form-data (incorrect)
    print("Test 5a: With explicit multipart/form-data header")
    try:
        bad_headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'multipart/form-data'
        }
        
        bad_response = requests.put(
            f'{API_URL}/athletes/{athlete_id}/',
            data=form_data,
            files=files,
            headers=bad_headers
        )
        print(f"Bad Headers Status Code: {bad_response.status_code}")
        
    except Exception as e:
        print(f"Bad headers error: {e}")
    
    # Test 2: Without Authorization header
    print("Test 5b: Without Authorization header")
    try:
        no_auth_response = requests.put(
            f'{API_URL}/athletes/{athlete_id}/',
            data=form_data,
            files=files
        )
        print(f"No Auth Status Code: {no_auth_response.status_code}")
        
    except Exception as e:
        print(f"No auth error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Upload Flow Test Complete")

if __name__ == "__main__":
    test_upload_flow()