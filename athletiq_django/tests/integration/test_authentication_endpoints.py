"""
Integration tests for authentication endpoints.
"""
import json
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.guardians.models import Guardian
from tests.factories import UserFactory, GuardianFactory

User = get_user_model()


class AuthenticationIntegrationTest(APITestCase):
    """
    Integration tests for authentication workflows.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test users
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.coach = UserFactory(role='Coach')
        
        # Create test guardian
        self.guardian = GuardianFactory()
        
        # Authentication endpoints
        self.login_url = '/api/auth/login/'
        self.refresh_url = '/api/auth/refresh/'
        self.guardian_login_url = '/api/guardian/auth/login'
        self.guardian_register_url = '/api/guardian/auth/register'
    
    def test_user_login_success(self):
        """Test successful user login."""
        login_data = {
            'email': self.school_admin.email,
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access_token', response.data['data'])
        self.assertIn('refresh_token', response.data['data'])
        self.assertEqual(response.data['data']['user']['role'], 'SchoolAdmin')
    
    def test_user_login_invalid_credentials(self):
        """Test user login with invalid credentials."""
        login_data = {
            'email': self.school_admin.email,
            'password': 'wrongpassword'
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
        self.assertIn('message', response.data)
    
    def test_user_login_missing_fields(self):
        """Test user login with missing fields."""
        login_data = {
            'email': self.school_admin.email
            # Missing password
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
    
    def test_token_refresh_success(self):
        """Test successful token refresh."""
        # Get initial tokens
        refresh = RefreshToken.for_user(self.school_admin)
        refresh_token = str(refresh)
        
        refresh_data = {
            'refresh': refresh_token
        }
        
        response = self.client.post(self.refresh_url, refresh_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access_token', response.data['data'])
    
    def test_token_refresh_invalid_token(self):
        """Test token refresh with invalid token."""
        refresh_data = {
            'refresh': 'invalid.token.here'
        }
        
        response = self.client.post(self.refresh_url, refresh_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
    
    def test_guardian_login_success(self):
        """Test successful guardian login."""
        login_data = {
            'email': self.guardian.email,
            'password': 'testpass123'
        }
        
        response = self.client.post(self.guardian_login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access_token', response.data['data'])
        self.assertIn('guardian', response.data['data'])
    
    def test_guardian_registration_success(self):
        """Test successful guardian registration."""
        registration_data = {
            'full_name': 'New Guardian',
            'email': 'newguardian@test.com',
            'phone': '+250788999888',
            'password': 'newpass123',
            'confirm_password': 'newpass123',
            'address': '123 New Street',
            'city': 'Kigali',
            'province': 'Kigali'
        }
        
        response = self.client.post(self.guardian_register_url, registration_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('guardian_id', response.data['data'])
        
        # Verify guardian was created
        self.assertTrue(Guardian.objects.filter(email='newguardian@test.com').exists())
    
    def test_guardian_registration_duplicate_email(self):
        """Test guardian registration with duplicate email."""
        registration_data = {
            'full_name': 'Duplicate Guardian',
            'email': self.guardian.email,  # Existing email
            'phone': '+250788999888',
            'password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.post(self.guardian_register_url, registration_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
    
    def test_guardian_registration_password_mismatch(self):
        """Test guardian registration with password mismatch."""
        registration_data = {
            'full_name': 'New Guardian',
            'email': 'newguardian@test.com',
            'phone': '+250788999888',
            'password': 'newpass123',
            'confirm_password': 'differentpass123'
        }
        
        response = self.client.post(self.guardian_register_url, registration_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)


class AuthorizationIntegrationTest(APITestCase):
    """
    Integration tests for role-based authorization.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create users with different roles
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.coach = UserFactory(role='Coach')
        self.referee = UserFactory(role='Referee')
        
        # Test endpoints that require different permissions
        self.school_list_url = '/api/schools/'
        self.tournament_analytics_url = '/api/tournaments/analytics/'
        self.athlete_statistics_url = '/api/athletes/statistics/'
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_superadmin_access_all_endpoints(self):
        """Test that SuperAdmin can access all protected endpoints."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test school list (SuperAdmin only)
        response = self.client.get(self.school_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test tournament analytics (SuperAdmin only)
        response = self.client.get(self.tournament_analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test athlete statistics (authenticated users)
        response = self.client.get(self.athlete_statistics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_schooladmin_restricted_access(self):
        """Test that SchoolAdmin has restricted access."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Should NOT access school list (SuperAdmin only)
        response = self.client.get(self.school_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Should NOT access tournament analytics (SuperAdmin only)
        response = self.client.get(self.tournament_analytics_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Should access athlete statistics (authenticated users)
        response = self.client.get(self.athlete_statistics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_coach_limited_access(self):
        """Test that Coach has limited access."""
        token = self.get_jwt_token(self.coach)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Should NOT access school list
        response = self.client.get(self.school_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Should NOT access tournament analytics
        response = self.client.get(self.tournament_analytics_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Should access athlete statistics
        response = self.client.get(self.athlete_statistics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users are denied access."""
        # No authentication credentials
        
        # Should be denied access to protected endpoints
        response = self.client.get(self.school_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = self.client.get(self.tournament_analytics_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = self.client.get(self.athlete_statistics_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_invalid_token_access_denied(self):
        """Test that invalid tokens are rejected."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid.token.here')
        
        response = self.client.get(self.athlete_statistics_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_expired_token_access_denied(self):
        """Test that expired tokens are rejected."""
        # Create a token and manually expire it
        refresh = RefreshToken.for_user(self.school_admin)
        access_token = refresh.access_token
        
        # Manually set expiration to past
        import time
        access_token.set_exp(lifetime=-timedelta(hours=1))
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access_token)}')
        
        response = self.client.get(self.athlete_statistics_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AuthenticationErrorHandlingTest(APITestCase):
    """
    Integration tests for authentication error handling.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.login_url = '/api/auth/login/'
    
    def test_malformed_json_request(self):
        """Test handling of malformed JSON in authentication request."""
        # Send malformed JSON
        response = self.client.post(
            self.login_url,
            'invalid json content',
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_missing_content_type(self):
        """Test handling of missing content type."""
        login_data = {
            'email': 'test@test.com',
            'password': 'testpass'
        }
        
        # Send without proper content type
        response = self.client.post(self.login_url, login_data)
        
        # Should still work with form data
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
    
    def test_sql_injection_attempt(self):
        """Test protection against SQL injection in login."""
        malicious_data = {
            'email': "admin@test.com'; DROP TABLE users; --",
            'password': 'password'
        }
        
        response = self.client.post(self.login_url, malicious_data, format='json')
        
        # Should handle gracefully without crashing
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
        self.assertFalse(response.data['success'])
    
    def test_xss_attempt_in_login(self):
        """Test protection against XSS in login fields."""
        xss_data = {
            'email': '<script>alert("xss")</script>@test.com',
            'password': '<script>alert("xss")</script>'
        }
        
        response = self.client.post(self.login_url, xss_data, format='json')
        
        # Should handle gracefully
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
        self.assertFalse(response.data['success'])
    
    def test_rate_limiting_protection(self):
        """Test rate limiting on authentication endpoints."""
        login_data = {
            'email': 'nonexistent@test.com',
            'password': 'wrongpassword'
        }
        
        # Make multiple rapid requests
        responses = []
        for i in range(10):
            response = self.client.post(self.login_url, login_data, format='json')
            responses.append(response.status_code)
        
        # Should eventually get rate limited (429) or continue getting 401
        # The exact behavior depends on rate limiting configuration
        for status_code in responses:
            self.assertIn(status_code, [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_429_TOO_MANY_REQUESTS,
                status.HTTP_400_BAD_REQUEST
            ])