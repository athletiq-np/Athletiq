"""
Comprehensive tests for athlete management API endpoints.
"""
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import date, timedelta
from apps.athletes.models import Athlete
from apps.schools.models import School
from apps.guardians.models import Guardian

User = get_user_model()


class AthleteListCreateTest(APITestCase):
    """
    Test cases for athlete list and create operations.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create users
        self.super_admin = User.objects.create(
            full_name="Super Admin",
            email="superadmin@athletiq.com",
            role="SuperAdmin"
        )
        
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        # Create school
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
        
        # Create guardian
        self.guardian = Guardian.objects.create(
            full_name='John Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        
        # Create test athlete data
        self.athlete_data = {
            'full_name': 'Test Athlete',
            'date_of_birth': (date.today() - timedelta(days=365 * 15)).isoformat(),
            'gender': 'Male',
            'school_id': self.school.school_id,
            'guardian_id': self.guardian.guardian_id,
            'guardian_name': 'John Guardian',
            'guardian_phone': '+250788123456',
            'guardian_email': 'guardian@test.com',
            'address': '123 Test Address',
            'grade': '10',
            'primary_sport': 'football'
        }
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_create_athlete_success(self):
        """Test successful athlete creation."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.post('/api/athletes/', self.athlete_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['full_name'], 'Test Athlete')
        self.assertIsNotNone(response.data['data']['athlete_id'])
        
        # Verify athlete was created in database
        self.assertTrue(Athlete.objects.filter(full_name='Test Athlete').exists())
    
    def test_create_athlete_validation_errors(self):
        """Test athlete creation with validation errors."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test with invalid date of birth (future date)
        invalid_data = self.athlete_data.copy()
        invalid_data['date_of_birth'] = (date.today() + timedelta(days=30)).isoformat()
        
        response = self.client.post('/api/athletes/', invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
    
    def test_create_athlete_unauthenticated(self):
        """Test athlete creation without authentication."""
        response = self.client.post('/api/athletes/', self.athlete_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_athletes_school_admin(self):
        """Test listing athletes as school admin."""
        # Create athlete for this school
        Athlete.objects.create(
            full_name='School Athlete',
            date_of_birth=date.today() - timedelta(days=365 * 16),
            gender='Female',
            school=self.school,
            guardian=self.guardian
        )
        
        # Create athlete for another school
        other_school = School.objects.create(
            school_code='OTHER001',
            name='Other School',
            address='456 Other Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788654321',
            email='info@otherschool.com',
            principal_name='Other Principal',
            admin_user=self.super_admin
        )
        
        Athlete.objects.create(
            full_name='Other School Athlete',
            date_of_birth=date.today() - timedelta(days=365 * 17),
            gender='Male',
            school=other_school,
            guardian=self.guardian
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/athletes/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Should only see athletes from own school
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['full_name'], 'School Athlete')
    
    def test_list_athletes_with_filters(self):
        """Test listing athletes with various filters."""
        # Create test athletes
        Athlete.objects.create(
            full_name='Male Athlete',
            date_of_birth=date.today() - timedelta(days=365 * 15),
            gender='Male',
            school=self.school,
            guardian=self.guardian,
            grade='10'
        )
        
        Athlete.objects.create(
            full_name='Female Athlete',
            date_of_birth=date.today() - timedelta(days=365 * 16),
            gender='Female',
            school=self.school,
            guardian=self.guardian,
            grade='11'
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test gender filter
        response = self.client.get('/api/athletes/?gender=Male')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['gender'], 'Male')
        
        # Test grade filter
        response = self.client.get('/api/athletes/?grade=11')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['grade'], '11')
        
        # Test search
        response = self.client.get('/api/athletes/?search=Female')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertIn('Female', response.data['data'][0]['full_name'])


class AthleteDetailTest(APITestCase):
    """
    Test cases for athlete detail operations.
    """
    
    def setUp(self):
        """Set up test data."""
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
        
        self.guardian = Guardian.objects.create(
            full_name='John Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        
        self.athlete = Athlete.objects.create(
            full_name='Test Athlete',
            date_of_birth=date.today() - timedelta(days=365 * 15),
            gender='Male',
            school=self.school,
            guardian=self.guardian
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_retrieve_athlete(self):
        """Test retrieving athlete details."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(f'/api/athletes/{self.athlete.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['full_name'], 'Test Athlete')
        self.assertEqual(response.data['data']['id'], self.athlete.id)
    
    def test_update_athlete(self):
        """Test updating athlete information."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        update_data = {
            'full_name': 'Updated Athlete Name',
            'grade': '11',
            'primary_sport': 'basketball'
        }
        
        response = self.client.patch(f'/api/athletes/{self.athlete.id}/', update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['full_name'], 'Updated Athlete Name')
        
        # Verify database was updated
        self.athlete.refresh_from_db()
        self.assertEqual(self.athlete.full_name, 'Updated Athlete Name')
    
    def test_delete_athlete(self):
        """Test soft deleting an athlete."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.delete(f'/api/athletes/{self.athlete.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify soft delete
        self.athlete.refresh_from_db()
        self.assertFalse(self.athlete.is_active)


class AthleteBulkOperationsTest(APITestCase):
    """
    Test cases for athlete bulk operations.
    """
    
    def setUp(self):
        """Set up test data."""
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
        
        self.guardian = Guardian.objects.create(
            full_name='John Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_bulk_create_athletes(self):
        """Test bulk creating athletes."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        bulk_data = {
            'athletes': [
                {
                    'full_name': 'Bulk Athlete 1',
                    'date_of_birth': (date.today() - timedelta(days=365 * 15)).isoformat(),
                    'gender': 'Male',
                    'school_id': self.school.school_id,
                    'guardian_id': self.guardian.guardian_id,
                    'guardian_name': 'John Guardian',
                    'guardian_phone': '+250788123456',
                    'address': '123 Test Address'
                },
                {
                    'full_name': 'Bulk Athlete 2',
                    'date_of_birth': (date.today() - timedelta(days=365 * 16)).isoformat(),
                    'gender': 'Female',
                    'school_id': self.school.school_id,
                    'guardian_id': self.guardian.guardian_id,
                    'guardian_name': 'John Guardian',
                    'guardian_phone': '+250788123456',
                    'address': '456 Test Address'
                }
            ]
        }
        
        response = self.client.post('/api/athletes/bulk-create/', bulk_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['success_count'], 2)
        self.assertEqual(response.data['data']['error_count'], 0)
        
        # Verify athletes were created
        self.assertEqual(Athlete.objects.filter(full_name__startswith='Bulk Athlete').count(), 2)
    
    def test_bulk_update_athletes(self):
        """Test bulk updating athletes."""
        # Create test athletes
        athlete1 = Athlete.objects.create(
            full_name='Athlete 1',
            date_of_birth=date.today() - timedelta(days=365 * 15),
            gender='Male',
            school=self.school,
            guardian=self.guardian
        )
        
        athlete2 = Athlete.objects.create(
            full_name='Athlete 2',
            date_of_birth=date.today() - timedelta(days=365 * 16),
            gender='Female',
            school=self.school,
            guardian=self.guardian
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        bulk_update_data = {
            'updates': [
                {
                    'athlete_id': athlete1.id,
                    'grade': '10',
                    'primary_sport': 'football'
                },
                {
                    'athlete_id': athlete2.id,
                    'grade': '11',
                    'primary_sport': 'basketball'
                }
            ]
        }
        
        response = self.client.post('/api/athletes/bulk-update/', bulk_update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['success_count'], 2)
        
        # Verify updates
        athlete1.refresh_from_db()
        athlete2.refresh_from_db()
        self.assertEqual(athlete1.grade, '10')
        self.assertEqual(athlete2.grade, '11')
    
    def test_bulk_verify_athletes(self):
        """Test bulk verifying athletes."""
        # Create test athletes
        athlete1 = Athlete.objects.create(
            full_name='Athlete 1',
            date_of_birth=date.today() - timedelta(days=365 * 15),
            gender='Male',
            school=self.school,
            guardian=self.guardian,
            verification_status='pending'
        )
        
        athlete2 = Athlete.objects.create(
            full_name='Athlete 2',
            date_of_birth=date.today() - timedelta(days=365 * 16),
            gender='Female',
            school=self.school,
            guardian=self.guardian,
            verification_status='pending'
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        bulk_verify_data = {
            'athlete_ids': [athlete1.id, athlete2.id],
            'verification_status': 'verified',
            'notes': 'Bulk verification test'
        }
        
        response = self.client.post('/api/athletes/bulk-verify/', bulk_verify_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['updated_count'], 2)
        
        # Verify status updates
        athlete1.refresh_from_db()
        athlete2.refresh_from_db()
        self.assertEqual(athlete1.verification_status, 'verified')
        self.assertEqual(athlete2.verification_status, 'verified')
        self.assertTrue(athlete1.document_verified)
        self.assertTrue(athlete2.document_verified)


class AthleteDocumentManagementTest(APITestCase):
    """
    Test cases for athlete document management.
    """
    
    def setUp(self):
        """Set up test data."""
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
        
        self.guardian = Guardian.objects.create(
            full_name='John Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        
        self.athlete = Athlete.objects.create(
            full_name='Test Athlete',
            date_of_birth=date.today() - timedelta(days=365 * 15),
            gender='Male',
            school=self.school,
            guardian=self.guardian
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_get_athlete_documents(self):
        """Test getting athlete document information."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(f'/api/athletes/{self.athlete.id}/documents/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('profile_photo', response.data['data'])
        self.assertIn('birth_certificate', response.data['data'])
        self.assertIn('verification_status', response.data['data'])
    
    def test_upload_athlete_document(self):
        """Test uploading athlete documents."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        upload_data = {
            'document_type': 'profile_photo',
            'document_url': 'https://example.com/photo.jpg'
        }
        
        response = self.client.post(
            f'/api/athletes/{self.athlete.id}/documents/upload/',
            upload_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['document_type'], 'profile_photo')
        
        # Verify document was uploaded
        self.athlete.refresh_from_db()
        self.assertEqual(self.athlete.profile_photo_url, 'https://example.com/photo.jpg')
        self.assertEqual(self.athlete.verification_status, 'pending')
    
    def test_verify_athlete_document(self):
        """Test verifying athlete documents."""
        # Upload a document first
        self.athlete.profile_photo_url = 'https://example.com/photo.jpg'
        self.athlete.save()
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        verify_data = {
            'verification_status': 'verified',
            'document_type': 'profile_photo',
            'notes': 'Document looks good'
        }
        
        response = self.client.post(
            f'/api/athletes/{self.athlete.id}/documents/verify/',
            verify_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify status was updated
        self.athlete.refresh_from_db()
        self.assertEqual(self.athlete.verification_status, 'verified')
        self.assertTrue(self.athlete.document_verified)


class AthleteSearchAndAnalyticsTest(APITestCase):
    """
    Test cases for athlete search and analytics.
    """
    
    def setUp(self):
        """Set up test data."""
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
        
        self.guardian = Guardian.objects.create(
            full_name='John Guardian',
            email='guardian@test.com',
            phone='+250788123456'
        )
        
        # Create test athletes
        for i in range(5):
            Athlete.objects.create(
                full_name=f'Test Athlete {i+1}',
                date_of_birth=date.today() - timedelta(days=365 * (15 + i)),
                gender='Male' if i % 2 == 0 else 'Female',
                school=self.school,
                guardian=self.guardian,
                grade=str(10 + (i % 3)),
                verification_status='verified' if i < 3 else 'pending'
            )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_search_athletes(self):
        """Test athlete search functionality."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test basic search
        response = self.client.get('/api/athletes/search/?q=Test Athlete 1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 1)
        
        # Test gender filter
        response = self.client.get('/api/athletes/search/?gender=Male')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should find 3 male athletes (indices 0, 2, 4)
        self.assertEqual(len(response.data['data']), 3)
        
        # Test verification status filter
        response = self.client.get('/api/athletes/search/?verification_status=verified')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should find 3 verified athletes
        self.assertEqual(len(response.data['data']), 3)
    
    def test_athlete_statistics(self):
        """Test athlete statistics endpoint."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/athletes/statistics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        stats = response.data['data']
        self.assertEqual(stats['total_athletes'], 5)
        self.assertEqual(stats['verified_athletes'], 3)
        self.assertEqual(stats['pending_athletes'], 2)
        self.assertIn('gender_distribution', stats)
        self.assertIn('grade_distribution', stats)
        self.assertIn('age_ranges', stats)
    
    def test_get_athletes_by_school(self):
        """Test getting athletes by school."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(f'/api/athletes/school/{self.school.school_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 5)
    
    def test_export_athletes(self):
        """Test exporting athletes to CSV."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/athletes/export/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
    
    def test_recalculate_profile_completion(self):
        """Test recalculating profile completion."""
        athlete = Athlete.objects.first()
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.post(f'/api/athletes/{athlete.id}/recalculate-completion/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('old_completion', response.data['data'])
        self.assertIn('new_completion', response.data['data'])