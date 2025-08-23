"""
Comprehensive tests for guardian portal API endpoints.
"""
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import date, timedelta
from apps.guardians.models import Guardian, AthleteClaimRequest, GuardianNotification
from apps.schools.models import School
from apps.athletes.models import Athlete

User = get_user_model()


class GuardianAuthenticationTest(APITestCase):
    """
    Test cases for guardian authentication endpoints.
    """
    
    def setUp(self):
        """Set up test data."""
        self.registration_data = {
            'full_name': 'Test Guardian',
            'email': 'guardian@test.com',
            'phone': '+250788123456',
            'address': '123 Test Street',
            'city': 'Kigali',
            'province': 'Kigali',
            'district': 'Gasabo',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!'
        }
        
        self.login_data = {
            'email': 'guardian@test.com',
            'password': 'TestPass123!'
        }
    
    def test_guardian_registration_success(self):
        """Test successful guardian registration."""
        response = self.client.post('/api/guardian/auth/register', self.registration_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['email'], 'guardian@test.com')
        
        # Verify guardian was created in database
        self.assertTrue(Guardian.objects.filter(email='guardian@test.com').exists())
    
    def test_guardian_registration_validation_errors(self):
        """Test guardian registration with validation errors."""
        # Test password mismatch
        invalid_data = self.registration_data.copy()
        invalid_data['password_confirm'] = 'DifferentPassword'
        
        response = self.client.post('/api/guardian/auth/register', invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
    
    def test_guardian_registration_duplicate_email(self):
        """Test guardian registration with duplicate email."""
        # Create existing guardian
        Guardian.objects.create(
            full_name='Existing Guardian',
            email='guardian@test.com',
            phone='+250788654321'
        )
        
        response = self.client.post('/api/guardian/auth/register', self.registration_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_guardian_login_success(self):
        """Test successful guardian login."""
        # Create guardian first
        guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        guardian.set_password('TestPass123!')
        guardian.save()
        
        response = self.client.post('/api/guardian/auth/login', self.login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data['data'])
        self.assertIn('guardian', response.data['data'])
    
    def test_guardian_login_invalid_credentials(self):
        """Test guardian login with invalid credentials."""
        # Create guardian with different password
        guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        guardian.set_password('DifferentPassword')
        guardian.save()
        
        response = self.client.post('/api/guardian/auth/login', self.login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
    
    def test_guardian_logout(self):
        """Test guardian logout."""
        # Create and login guardian first
        guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        guardian.set_password('TestPass123!')
        guardian.save()
        
        # Login to get token
        login_response = self.client.post('/api/guardian/auth/login', self.login_data, format='json')
        token = login_response.data['data']['token']
        
        # Test logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post('/api/guardian/auth/logout')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])


class GuardianProfileTest(APITestCase):
    """
    Test cases for guardian profile management.
    """
    
    def setUp(self):
        """Set up test data."""
        self.guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+250788123456',
            address='123 Test Street',
            city='Kigali'
        )
        self.guardian.set_password('TestPass123!')
        self.guardian.save()
        
        # Get authentication token
        login_data = {
            'email': 'guardian@test.com',
            'password': 'TestPass123!'
        }
        login_response = self.client.post('/api/guardian/auth/login', login_data, format='json')
        self.token = login_response.data['data']['token']
    
    def test_get_guardian_profile(self):
        """Test getting guardian profile."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        response = self.client.get('/api/guardian/profile')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['email'], 'guardian@test.com')
        self.assertEqual(response.data['data']['full_name'], 'Test Guardian')
    
    def test_update_guardian_profile(self):
        """Test updating guardian profile."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        update_data = {
            'full_name': 'Updated Guardian Name',
            'phone': '+250788999888',
            'occupation': 'Teacher'
        }
        
        response = self.client.put('/api/guardian/profile/update', update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['full_name'], 'Updated Guardian Name')
        
        # Verify database was updated
        self.guardian.refresh_from_db()
        self.assertEqual(self.guardian.full_name, 'Updated Guardian Name')
    
    def test_change_guardian_password(self):
        """Test changing guardian password."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        password_data = {
            'old_password': 'TestPass123!',
            'new_password': 'NewPass456!',
            'new_password_confirm': 'NewPass456!'
        }
        
        response = self.client.post('/api/guardian/profile/change-password', password_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify password was changed
        self.guardian.refresh_from_db()
        self.assertTrue(self.guardian.check_password('NewPass456!'))
        self.assertFalse(self.guardian.check_password('TestPass123!'))


class GuardianAthleteManagementTest(APITestCase):
    """
    Test cases for guardian athlete management.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create guardian
        self.guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        self.guardian.set_password('TestPass123!')
        self.guardian.save()
        
        # Create school and admin
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
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
        
        # Create athlete
        self.athlete = Athlete.objects.create(
            full_name='Test Athlete',
            date_of_birth=date.today() - timedelta(days=365 * 15),
            gender='Male',
            school=self.school,
            guardian=self.guardian
        )
        
        # Get authentication token
        login_data = {
            'email': 'guardian@test.com',
            'password': 'TestPass123!'
        }
        login_response = self.client.post('/api/guardian/auth/login', login_data, format='json')
        self.token = login_response.data['data']['token']
    
    def test_get_guardian_athletes(self):
        """Test getting guardian's athletes."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        response = self.client.get('/api/guardian/athletes')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['full_name'], 'Test Athlete')
    
    def test_get_guardian_athlete_detail(self):
        """Test getting detailed athlete information."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        response = self.client.get(f'/api/guardian/athletes/{self.athlete.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['full_name'], 'Test Athlete')
        self.assertEqual(response.data['data']['id'], self.athlete.id)
    
    def test_claim_athlete_success(self):
        """Test successfully claiming an athlete."""
        # Create unclaimed athlete
        unclaimed_athlete = Athlete.objects.create(
            full_name='Unclaimed Athlete',
            date_of_birth=date.today() - timedelta(days=365 * 16),
            gender='Female',
            school=self.school,
            guardian=None  # No guardian assigned
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        claim_data = {
            'athlete_code': unclaimed_athlete.athlete_id,
            'relationship': 'father',
            'notes': 'This is my daughter'
        }
        
        response = self.client.post('/api/guardian/athletes/claim', claim_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        # Verify claim request was created
        self.assertTrue(
            AthleteClaimRequest.objects.filter(
                guardian=self.guardian,
                athlete_id=unclaimed_athlete.athlete_id
            ).exists()
        )
    
    def test_claim_athlete_already_claimed(self):
        """Test claiming an athlete that's already claimed."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        claim_data = {
            'athlete_code': self.athlete.athlete_id,
            'relationship': 'father',
            'notes': 'Trying to claim already claimed athlete'
        }
        
        response = self.client.post('/api/guardian/athletes/claim', claim_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_claim_athlete_not_found(self):
        """Test claiming an athlete that doesn't exist."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        claim_data = {
            'athlete_code': 'NONEXISTENT',
            'relationship': 'father',
            'notes': 'Trying to claim non-existent athlete'
        }
        
        response = self.client.post('/api/guardian/athletes/claim', claim_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])


class GuardianDashboardTest(APITestCase):
    """
    Test cases for guardian dashboard.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create guardian
        self.guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        self.guardian.set_password('TestPass123!')
        self.guardian.save()
        
        # Create school and admin
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
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
        
        # Create athletes
        for i in range(3):
            Athlete.objects.create(
                full_name=f'Test Athlete {i+1}',
                date_of_birth=date.today() - timedelta(days=365 * (15 + i)),
                gender='Male' if i % 2 == 0 else 'Female',
                school=self.school,
                guardian=self.guardian
            )
        
        # Create notifications
        for i in range(2):
            GuardianNotification.objects.create(
                guardian=self.guardian,
                title=f'Test Notification {i+1}',
                message=f'This is test notification {i+1}',
                notification_type='system_announcement',
                is_read=i == 0  # First notification is read
            )
        
        # Get authentication token
        login_data = {
            'email': 'guardian@test.com',
            'password': 'TestPass123!'
        }
        login_response = self.client.post('/api/guardian/auth/login', login_data, format='json')
        self.token = login_response.data['data']['token']
    
    def test_guardian_dashboard(self):
        """Test getting guardian dashboard data."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        response = self.client.get('/api/guardian/dashboard')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        dashboard_data = response.data['data']
        self.assertEqual(dashboard_data['athletes_count'], 3)
        self.assertEqual(dashboard_data['unread_notifications'], 1)
        self.assertIn('guardian', dashboard_data)
        self.assertIn('athletes', dashboard_data)
        self.assertIn('recent_notifications', dashboard_data)


class GuardianNotificationTest(APITestCase):
    """
    Test cases for guardian notifications.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create guardian
        self.guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        self.guardian.set_password('TestPass123!')
        self.guardian.save()
        
        # Create notifications
        self.notification1 = GuardianNotification.objects.create(
            guardian=self.guardian,
            title='Test Notification 1',
            message='This is test notification 1',
            notification_type='system_announcement',
            is_read=False
        )
        
        self.notification2 = GuardianNotification.objects.create(
            guardian=self.guardian,
            title='Test Notification 2',
            message='This is test notification 2',
            notification_type='athlete_update',
            is_read=True
        )
        
        # Get authentication token
        login_data = {
            'email': 'guardian@test.com',
            'password': 'TestPass123!'
        }
        login_response = self.client.post('/api/guardian/auth/login', login_data, format='json')
        self.token = login_response.data['data']['token']
    
    def test_get_guardian_notifications(self):
        """Test getting guardian notifications."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        response = self.client.get('/api/guardian/notifications')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 2)
    
    def test_mark_notification_read(self):
        """Test marking a notification as read."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        response = self.client.post(f'/api/guardian/notifications/{self.notification1.id}/read')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify notification was marked as read
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
    
    def test_mark_all_notifications_read(self):
        """Test marking all notifications as read."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        response = self.client.post('/api/guardian/notifications/mark-all-read')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['updated_count'], 1)  # Only 1 unread notification
        
        # Verify all notifications are now read
        unread_count = GuardianNotification.objects.filter(
            guardian=self.guardian,
            is_read=False
        ).count()
        self.assertEqual(unread_count, 0)


class GuardianFeedbackTest(APITestCase):
    """
    Test cases for guardian feedback and communication.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create guardian
        self.guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        self.guardian.set_password('TestPass123!')
        self.guardian.save()
        
        # Get authentication token
        login_data = {
            'email': 'guardian@test.com',
            'password': 'TestPass123!'
        }
        login_response = self.client.post('/api/guardian/auth/login', login_data, format='json')
        self.token = login_response.data['data']['token']
    
    def test_submit_guardian_feedback(self):
        """Test submitting guardian feedback."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        feedback_data = {
            'subject': 'Test Feedback',
            'message': 'This is a test feedback message',
            'priority': 'medium',
            'category': 'general'
        }
        
        response = self.client.post('/api/guardian/feedback', feedback_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['subject'], 'Test Feedback')
    
    def test_submit_feedback_missing_fields(self):
        """Test submitting feedback with missing required fields."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        incomplete_data = {
            'subject': 'Test Feedback'
            # Missing message
        }
        
        response = self.client.post('/api/guardian/feedback', incomplete_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_get_communication_history(self):
        """Test getting communication history."""
        # Create some notifications as communication history
        GuardianNotification.objects.create(
            guardian=self.guardian,
            title='Communication 1',
            message='This is communication 1',
            notification_type='system_announcement'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        response = self.client.get('/api/guardian/communication-history')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertGreaterEqual(len(response.data['data']), 1)


class GuardianConsentTest(APITestCase):
    """
    Test cases for guardian consent management.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create guardian
        self.guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        self.guardian.set_password('TestPass123!')
        self.guardian.save()
        
        # Create school and admin
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
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
        
        # Create athlete
        self.athlete = Athlete.objects.create(
            full_name='Test Athlete',
            date_of_birth=date.today() - timedelta(days=365 * 15),
            gender='Male',
            school=self.school,
            guardian=self.guardian
        )
        
        # Get authentication token
        login_data = {
            'email': 'guardian@test.com',
            'password': 'TestPass123!'
        }
        login_response = self.client.post('/api/guardian/auth/login', login_data, format='json')
        self.token = login_response.data['data']['token']
    
    def test_provide_athlete_consent(self):
        """Test providing consent for athlete participation."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        consent_data = {
            'consent_type': 'tournament',
            'consent_given': True,
            'tournament_id': 1,
            'notes': 'I give consent for my child to participate'
        }
        
        response = self.client.post(
            f'/api/guardian/athletes/{self.athlete.id}/consent',
            consent_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['consent_type'], 'tournament')
        self.assertTrue(response.data['data']['consent_given'])
    
    def test_provide_consent_missing_fields(self):
        """Test providing consent with missing required fields."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        incomplete_data = {
            'consent_given': True
            # Missing consent_type
        }
        
        response = self.client.post(
            f'/api/guardian/athletes/{self.athlete.id}/consent',
            incomplete_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])