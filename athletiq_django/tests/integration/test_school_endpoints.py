"""
Integration tests for school management endpoints.
"""
import json
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.schools.models import School
from tests.factories import UserFactory, SchoolFactory

User = get_user_model()


class SchoolRegistrationIntegrationTest(APITestCase):
    """
    Integration tests for school registration workflow.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.registration_url = '/api/schools/register/'
        
        self.valid_registration_data = {
            'name': 'Integration Test School',
            'address': '123 Integration Street',
            'country': 'Rwanda',
            'province': 'Kigali',
            'district': 'Gasabo',
            'city': 'Kigali',
            'ward': '5',
            'phone': '+250788123456',
            'email': 'info@integrationschool.com',
            'website': 'https://integrationschool.com',
            'principal_name': 'Jane Principal',
            'admin_name': 'John Admin',
            'admin_email': 'admin@integrationschool.com',
            'password': 'securepass123'
        }
    
    def test_complete_school_registration_workflow(self):
        """Test complete school registration workflow."""
        # Step 1: Register school
        response = self.client.post(
            self.registration_url,
            self.valid_registration_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        # Verify response structure
        self.assertIn('school_id', response.data['data'])
        self.assertIn('school_code', response.data['data'])
        self.assertIn('admin_user_id', response.data['data'])
        
        school_id = response.data['data']['school_id']
        admin_user_id = response.data['data']['admin_user_id']
        
        # Step 2: Verify school was created in database
        school = School.objects.get(school_id=school_id)
        self.assertEqual(school.name, 'Integration Test School')
        self.assertEqual(school.onboarding_status, 'pending')
        self.assertTrue(school.is_active)
        
        # Step 3: Verify admin user was created
        admin_user = User.objects.get(user_id=admin_user_id)
        self.assertEqual(admin_user.email, 'admin@integrationschool.com')
        self.assertEqual(admin_user.role, 'SchoolAdmin')
        self.assertTrue(admin_user.is_active)
        
        # Step 4: Test admin can login
        login_data = {
            'email': 'admin@integrationschool.com',
            'password': 'securepass123'
        }
        
        login_response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertTrue(login_response.data['success'])
        
        # Step 5: Test admin can access school profile
        token = login_response.data['data']['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        profile_response = self.client.get('/api/schools/me/')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['data']['name'], 'Integration Test School')
    
    def test_school_registration_validation_errors(self):
        """Test school registration with various validation errors."""
        # Test missing required fields
        incomplete_data = {
            'name': 'Incomplete School',
            'admin_email': 'admin@incomplete.com'
        }
        
        response = self.client.post(self.registration_url, incomplete_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
        
        # Test invalid email format
        invalid_email_data = self.valid_registration_data.copy()
        invalid_email_data['admin_email'] = 'invalid-email-format'
        
        response = self.client.post(self.registration_url, invalid_email_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test invalid phone format
        invalid_phone_data = self.valid_registration_data.copy()
        invalid_phone_data['phone'] = 'invalid-phone'
        
        response = self.client.post(self.registration_url, invalid_phone_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_duplicate_school_registration(self):
        """Test registration with duplicate information."""
        # Create first school
        response1 = self.client.post(
            self.registration_url,
            self.valid_registration_data,
            format='json'
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Try to create second school with same admin email
        duplicate_data = self.valid_registration_data.copy()
        duplicate_data['name'] = 'Different School Name'
        
        response2 = self.client.post(self.registration_url, duplicate_data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response2.data['success'])


class SchoolManagementIntegrationTest(APITestCase):
    """
    Integration tests for school management workflows.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create users
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.other_admin = UserFactory(role='SchoolAdmin')
        
        # Create schools
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.other_school = SchoolFactory(admin_user=self.other_admin)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_school_profile_management_workflow(self):
        """Test complete school profile management workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Get current profile
        response = self.client.get('/api/schools/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        original_name = response.data['data']['name']
        
        # Step 2: Update profile
        update_data = {
            'name': 'Updated School Name',
            'phone': '+250788999888',
            'website': 'https://updated-school.com',
            'principal_name': 'Updated Principal'
        }
        
        update_response = self.client.patch('/api/schools/me/update/', update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        
        # Step 3: Verify changes were applied
        verify_response = self.client.get('/api/schools/me/')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_response.data['data']['name'], 'Updated School Name')
        self.assertEqual(verify_response.data['data']['phone'], '+250788999888')
        
        # Step 4: Verify database was updated
        self.school.refresh_from_db()
        self.assertEqual(self.school.name, 'Updated School Name')
        self.assertEqual(self.school.phone, '+250788999888')
    
    def test_school_data_access_permissions(self):
        """Test that schools can only access their own data."""
        # School admin should access own school
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/schools/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['school_id'], self.school.school_id)
        
        # School admin should NOT access other school's data directly
        # (This is enforced by the view logic, not URL parameters)
        
        # Other admin should access their own school
        other_token = self.get_jwt_token(self.other_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {other_token}')
        
        response = self.client.get('/api/schools/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['school_id'], self.other_school.school_id)
    
    def test_superadmin_school_list_access(self):
        """Test SuperAdmin can list all schools."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/schools/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Should see both schools
        schools = response.data['data']
        school_ids = [school['school_id'] for school in schools]
        self.assertIn(self.school.school_id, school_ids)
        self.assertIn(self.other_school.school_id, school_ids)
    
    def test_school_admin_cannot_list_all_schools(self):
        """Test SchoolAdmin cannot list all schools."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/schools/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_school_tournaments_access(self):
        """Test school tournaments access."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/schools/me/tournaments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Should have tournament data structure
        self.assertIn('registered_tournaments', response.data['data'])
        self.assertIn('available_tournaments', response.data['data'])
    
    def test_school_athletes_access(self):
        """Test school athletes access."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/schools/me/athletes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Test with filters
        filtered_response = self.client.get('/api/schools/me/athletes/?gender=male&sport=football')
        self.assertEqual(filtered_response.status_code, status.HTTP_200_OK)


class SchoolResourcesIntegrationTest(APITestCase):
    """
    Integration tests for school resources (houses, staff, notifications).
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_school_resources_access(self):
        """Test access to various school resources."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test houses endpoint
        houses_response = self.client.get('/api/schools/houses/')
        self.assertEqual(houses_response.status_code, status.HTTP_200_OK)
        self.assertTrue(houses_response.data['success'])
        
        # Test staff endpoint
        staff_response = self.client.get('/api/schools/staff/')
        self.assertEqual(staff_response.status_code, status.HTTP_200_OK)
        self.assertTrue(staff_response.data['success'])
        
        # Test notifications endpoint
        notifications_response = self.client.get('/api/schools/notifications/')
        self.assertEqual(notifications_response.status_code, status.HTTP_200_OK)
        self.assertTrue(notifications_response.data['success'])
        
        # Test activities endpoint
        activities_response = self.client.get('/api/schools/activities/')
        self.assertEqual(activities_response.status_code, status.HTTP_200_OK)
        self.assertTrue(activities_response.data['success'])
    
    def test_school_team_management_workflow(self):
        """Test complete school team management workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Create a team
        team_data = {
            'name': 'School Eagles',
            'sport': 'football',
            'gender': 'male',
            'age_group': 'u16',
            'coach': 'John Coach',
            'description': 'Main school football team'
        }
        
        create_response = self.client.post('/api/schools/me/teams/create/', team_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(create_response.data['success'])
        
        team_id = create_response.data['data']['team_id']
        
        # Step 2: Get team details
        get_response = self.client.get(f'/api/schools/me/teams/{team_id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data['data']['name'], 'School Eagles')
        
        # Step 3: Update team
        update_data = {
            'name': 'Updated Eagles',
            'coach': 'Jane Coach'
        }
        
        update_response = self.client.patch(
            f'/api/schools/me/teams/{team_id}/update/',
            update_data,
            format='json'
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        
        # Step 4: Verify update
        verify_response = self.client.get(f'/api/schools/me/teams/{team_id}/')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_response.data['data']['name'], 'Updated Eagles')
        
        # Step 5: Delete team
        delete_response = self.client.delete(f'/api/schools/me/teams/{team_id}/delete/')
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        self.assertTrue(delete_response.data['success'])
        
        # Step 6: Verify deletion
        get_deleted_response = self.client.get(f'/api/schools/me/teams/{team_id}/')
        self.assertEqual(get_deleted_response.status_code, status.HTTP_404_NOT_FOUND)


class SchoolErrorHandlingIntegrationTest(APITestCase):
    """
    Integration tests for school endpoint error handling.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_school_profile_not_found(self):
        """Test handling when school admin has no associated school."""
        # Create user without associated school
        orphan_admin = UserFactory(role='SchoolAdmin')
        
        token = self.get_jwt_token(orphan_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/schools/me/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])
    
    def test_invalid_school_update_data(self):
        """Test school update with invalid data."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test with invalid email format
        invalid_data = {
            'email': 'invalid-email-format',
            'phone': 'invalid-phone-format'
        }
        
        response = self.client.patch('/api/schools/me/update/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
    
    def test_malformed_json_requests(self):
        """Test handling of malformed JSON requests."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Send malformed JSON
        response = self.client.patch(
            '/api/schools/me/update/',
            'invalid json content',
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_concurrent_school_updates(self):
        """Test handling of concurrent school updates."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Simulate concurrent updates
        update_data1 = {'name': 'Update 1'}
        update_data2 = {'name': 'Update 2'}
        
        # Both should succeed, last one wins
        response1 = self.client.patch('/api/schools/me/update/', update_data1, format='json')
        response2 = self.client.patch('/api/schools/me/update/', update_data2, format='json')
        
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Verify final state
        final_response = self.client.get('/api/schools/me/')
        self.assertEqual(final_response.data['data']['name'], 'Update 2')


class SchoolPerformanceIntegrationTest(APITestCase):
    """
    Integration tests for school endpoint performance.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_school_profile_response_time(self):
        """Test school profile endpoint response time."""
        import time
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/schools/me/')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response should be under 1 second for basic profile fetch
        self.assertLess(response_time, 1.0)
    
    def test_school_tournaments_pagination_performance(self):
        """Test school tournaments endpoint with pagination."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test with pagination parameters
        response = self.client.get('/api/schools/me/tournaments/?page=1&page_size=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should have pagination metadata
        if 'pagination' in response.data:
            self.assertIn('page', response.data['pagination'])
            self.assertIn('total_pages', response.data['pagination'])
    
    def test_multiple_concurrent_requests(self):
        """Test handling multiple concurrent requests."""
        import threading
        import time
        
        token = self.get_jwt_token(self.school_admin)
        
        results = []
        
        def make_request():
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            response = client.get('/api/schools/me/')
            results.append(response.status_code)
        
        # Create multiple threads
        threads = []
        for i in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        self.assertEqual(len(results), 5)
        for status_code in results:
            self.assertEqual(status_code, status.HTTP_200_OK)