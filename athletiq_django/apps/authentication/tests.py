"""
Tests for authentication functionality.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
import json

User = get_user_model()


class UserModelTest(TestCase):
    """
    Test cases for the User model.
    """
    
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'full_name': 'Test User',
            'role': 'SchoolAdmin'
        }
    
    def test_create_user(self):
        """Test creating a user."""
        user = User.objects.create(**self.user_data)
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.full_name, 'Test User')
        self.assertEqual(user.role, 'SchoolAdmin')
        self.assertTrue(user.is_active)
    
    def test_user_string_representation(self):
        """Test user string representation."""
        user = User.objects.create(**self.user_data)
        expected = f"{user.full_name} ({user.email})"
        self.assertEqual(str(user), expected)
    
    def test_set_password_bcrypt(self):
        """Test password setting with bcrypt."""
        user = User.objects.create(**self.user_data)
        user.set_password('testpassword123')
        
        self.assertTrue(user.password_hash)
        self.assertTrue(user.check_password('testpassword123'))
        self.assertFalse(user.check_password('wrongpassword'))
    
    def test_user_roles(self):
        """Test user role properties."""
        # Test SuperAdmin
        super_admin = User.objects.create(
            email='admin@example.com',
            full_name='Super Admin',
            role='SuperAdmin'
        )
        self.assertTrue(super_admin.is_super_admin)
        self.assertFalse(super_admin.is_school_admin)
        
        # Test SchoolAdmin
        school_admin = User.objects.create(
            email='school@example.com',
            full_name='School Admin',
            role='SchoolAdmin'
        )
        self.assertFalse(school_admin.is_super_admin)
        self.assertTrue(school_admin.is_school_admin)


class AuthenticationAPITest(APITestCase):
    """
    Test cases for authentication API endpoints.
    """
    
    def setUp(self):
        self.user = User.objects.create(
            email='test@example.com',
            full_name='Test User',
            role='SchoolAdmin'
        )
        self.user.set_password('testpassword123')
        self.user.save()
        
        self.login_url = reverse('login')
        self.profile_url = reverse('profile')
        self.logout_url = reverse('logout')
    
    def test_login_success(self):
        """Test successful login."""
        data = {
            'email': 'test@example.com',
            'password': 'testpassword123'
        }
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data['data'])
        self.assertIn('user', response.data['data'])
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
    
    def test_login_missing_fields(self):
        """Test login with missing fields."""
        data = {'email': 'test@example.com'}
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
    
    def test_profile_authenticated(self):
        """Test getting profile when authenticated."""
        # Login first
        login_data = {
            'email': 'test@example.com',
            'password': 'testpassword123'
        }
        login_response = self.client.post(self.login_url, login_data)
        token = login_response.data['data']['token']
        
        # Get profile
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['email'], 'test@example.com')
    
    def test_profile_unauthenticated(self):
        """Test getting profile when not authenticated."""
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_logout(self):
        """Test logout functionality."""
        # Login first
        login_data = {
            'email': 'test@example.com',
            'password': 'testpassword123'
        }
        login_response = self.client.post(self.login_url, login_data)
        token = login_response.data['data']['token']
        refresh_token = login_response.data['data']['refresh_token']
        
        # Logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        logout_data = {'refresh_token': refresh_token}
        response = self.client.post(self.logout_url, logout_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])


class PasswordChangeTest(APITestCase):
    """
    Test cases for password change functionality.
    """
    
    def setUp(self):
        self.user = User.objects.create(
            email='test@example.com',
            full_name='Test User',
            role='SchoolAdmin'
        )
        self.user.set_password('oldpassword123')
        self.user.save()
        
        # Login to get token
        login_url = reverse('login')
        login_data = {
            'email': 'test@example.com',
            'password': 'oldpassword123'
        }
        login_response = self.client.post(login_url, login_data)
        self.token = login_response.data['data']['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        self.change_password_url = reverse('change_password')
    
    def test_change_password_success(self):
        """Test successful password change."""
        data = {
            'old_password': 'oldpassword123',
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123'
        }
        response = self.client.post(self.change_password_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))
        self.assertFalse(self.user.check_password('oldpassword123'))
    
    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password."""
        data = {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123'
        }
        response = self.client.post(self.change_password_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_change_password_mismatch(self):
        """Test password change with mismatched new passwords."""
        data = {
            'old_password': 'oldpassword123',
            'new_password': 'newpassword123',
            'new_password_confirm': 'differentpassword'
        }
        response = self.client.post(self.change_password_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])