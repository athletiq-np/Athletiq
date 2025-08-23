"""
Tests for School views and API endpoints.
"""
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.schools.models import School, SchoolHouse, SchoolStaff, SchoolNotification

User = get_user_model()


class SchoolRegistrationViewTest(APITestCase):
    """
    Test cases for school registration endpoint.
    """
    
    def setUp(self):
        """Set up test data."""
        self.registration_url = reverse('schools:school-register')
        self.valid_data = {
            'name': 'Test School',
            'address': '123 Test Street',
            'country': 'Rwanda',
            'province': 'Kigali',
            'district': 'Gasabo',
            'city': 'Kigali',
            'phone': '+250788123456',
            'email': 'info@testschool.com',
            'principal_name': 'Jane Principal',
            'admin_name': 'John Admin',
            'admin_email': 'admin@testschool.com',
            'password': 'testpass123'
        }
    
    def test_successful_school_registration(self):
        """Test successful school registration."""
        response = self.client.post(self.registration_url, self.valid_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('school_id', response.data['data'])
        self.assertIn('school_code', response.data['data'])
        
        # Verify school was created
        self.assertTrue(School.objects.filter(name='Test School').exists())
        
        # Verify admin user was created
        self.assertTrue(User.objects.filter(email='admin@testschool.com').exists())
    
    def test_registration_with_missing_fields(self):
        """Test registration with missing required fields."""
        incomplete_data = {
            'name': 'Test School',
            'admin_email': 'admin@testschool.com'
        }
        
        response = self.client.post(self.registration_url, incomplete_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
    
    def test_registration_with_duplicate_admin_email(self):
        """Test registration with duplicate admin email."""
        # Create existing user
        User.objects.create(
            full_name="Existing User",
            email="admin@testschool.com",
            role="SchoolAdmin"
        )
        
        response = self.client.post(self.registration_url, self.valid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])


class SchoolListViewTest(APITestCase):
    """
    Test cases for school list endpoint (SuperAdmin only).
    """
    
    def setUp(self):
        """Set up test data."""
        self.list_url = reverse('schools:school-list')
        
        # Create SuperAdmin user
        self.super_admin = User.objects.create(
            full_name="Super Admin",
            email="superadmin@athletiq.com",
            role="SuperAdmin"
        )
        
        # Create SchoolAdmin user
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        # Create test school
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='123 Test Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788123456',
            email='info@testschool.com',
            principal_name='Jane Principal',
            admin_user=self.school_admin
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_superadmin_can_list_schools(self):
        """Test that SuperAdmin can list all schools."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
    
    def test_schooladmin_cannot_list_schools(self):
        """Test that SchoolAdmin cannot list all schools."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_unauthenticated_cannot_list_schools(self):
        """Test that unauthenticated users cannot list schools."""
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MySchoolProfileViewTest(APITestCase):
    """
    Test cases for my school profile endpoints.
    """
    
    def setUp(self):
        """Set up test data."""
        self.profile_url = reverse('schools:my-school-profile')
        self.update_url = reverse('schools:my-school-update')
        
        # Create SchoolAdmin user
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        # Create test school
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='123 Test Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788123456',
            email='info@testschool.com',
            principal_name='Jane Principal',
            admin_user=self.school_admin
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_get_my_school_profile(self):
        """Test getting my school profile."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['name'], 'Test School')
        self.assertEqual(response.data['data']['school_code'], 'TEST001')
    
    def test_update_my_school_profile(self):
        """Test updating my school profile."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        update_data = {
            'name': 'Updated School Name',
            'phone': '+250788999888',
            'principal_name': 'Updated Principal'
        }
        
        response = self.client.patch(self.update_url, update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['name'], 'Updated School Name')
        
        # Verify database was updated
        self.school.refresh_from_db()
        self.assertEqual(self.school.name, 'Updated School Name')
    
    def test_user_without_school_cannot_access_profile(self):
        """Test that user without associated school cannot access profile."""
        # Create user without school
        user_without_school = User.objects.create(
            full_name="No School User",
            email="noschool@test.com",
            role="SchoolAdmin"
        )
        
        token = self.get_jwt_token(user_without_school)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])


class SchoolTournamentsViewTest(APITestCase):
    """
    Test cases for school tournaments endpoint.
    """
    
    def setUp(self):
        """Set up test data."""
        self.tournaments_url = reverse('schools:my-school-tournaments')
        
        # Create SchoolAdmin user
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        # Create test school
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='123 Test Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788123456',
            email='info@testschool.com',
            principal_name='Jane Principal',
            admin_user=self.school_admin
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_get_school_tournaments(self):
        """Test getting school tournaments."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(self.tournaments_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('registered_tournaments', response.data['data'])
        self.assertIn('available_tournaments', response.data['data'])
    
    def test_get_school_tournaments_with_search(self):
        """Test getting school tournaments with search filter."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(self.tournaments_url, {'search': 'football'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])


class SchoolAthletesViewTest(APITestCase):
    """
    Test cases for school athletes endpoint.
    """
    
    def setUp(self):
        """Set up test data."""
        self.athletes_url = reverse('schools:my-school-athletes')
        
        # Create SchoolAdmin user
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        # Create test school
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='123 Test Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788123456',
            email='info@testschool.com',
            principal_name='Jane Principal',
            admin_user=self.school_admin
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_get_school_athletes(self):
        """Test getting school athletes."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(self.athletes_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_get_school_athletes_with_filters(self):
        """Test getting school athletes with filters."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        filters = {
            'search': 'john',
            'gender': 'male',
            'status': 'active',
            'sport': 'football'
        }
        
        response = self.client.get(self.athletes_url, filters)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])


class SchoolTeamManagementTest(APITestCase):
    """
    Test cases for school team management endpoints.
    """
    
    def setUp(self):
        """Set up test data."""
        self.create_team_url = reverse('schools:create-school-team')
        
        # Create SchoolAdmin user
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        # Create test school
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='123 Test Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788123456',
            email='info@testschool.com',
            principal_name='Jane Principal',
            admin_user=self.school_admin
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_create_school_team(self):
        """Test creating a school team."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        team_data = {
            'name': 'School Eagles',
            'sport': 'football',
            'gender': 'male',
            'age_group': 'u16',
            'coach': 'John Doe',
            'description': 'Main school football team'
        }
        
        response = self.client.post(self.create_team_url, team_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['name'], 'School Eagles')
    
    def test_create_team_missing_required_fields(self):
        """Test creating team with missing required fields."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        incomplete_data = {
            'name': 'School Eagles'
            # Missing sport, gender, age_group
        }
        
        response = self.client.post(self.create_team_url, incomplete_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_get_school_team(self):
        """Test getting a specific school team."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        team_url = reverse('schools:get-school-team', kwargs={'team_id': 1})
        response = self.client.get(team_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('name', response.data['data'])
    
    def test_update_school_team(self):
        """Test updating a school team."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        update_data = {
            'name': 'Updated Team Name',
            'coach': 'Jane Coach'
        }
        
        team_url = reverse('schools:update-school-team', kwargs={'team_id': 1})
        response = self.client.patch(team_url, update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_delete_school_team(self):
        """Test deleting a school team."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        team_url = reverse('schools:delete-school-team', kwargs={'team_id': 1})
        response = self.client.delete(team_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])


class SchoolResourcesTest(APITestCase):
    """
    Test cases for school resources (houses, staff, notifications).
    """
    
    def setUp(self):
        """Set up test data."""
        # Create SchoolAdmin user
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        # Create test school
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='123 Test Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788123456',
            email='info@testschool.com',
            principal_name='Jane Principal',
            admin_user=self.school_admin
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_get_school_houses(self):
        """Test getting school houses."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        houses_url = reverse('schools:school-houses')
        response = self.client.get(houses_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_get_school_staff(self):
        """Test getting school staff."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        staff_url = reverse('schools:school-staff')
        response = self.client.get(staff_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_get_school_notifications(self):
        """Test getting school notifications."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        notifications_url = reverse('schools:school-notifications')
        response = self.client.get(notifications_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_get_school_activities(self):
        """Test getting school activities."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        activities_url = reverse('schools:school-activities')
        response = self.client.get(activities_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])