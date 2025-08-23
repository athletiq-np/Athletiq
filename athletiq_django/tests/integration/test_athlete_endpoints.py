"""
Integration tests for athlete management endpoints.
"""
import json
import time
from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.athletes.models import Athlete
from apps.schools.models import School
from apps.guardians.models import Guardian
from tests.factories import UserFactory, SchoolFactory, GuardianFactory, AthleteFactory

User = get_user_model()


class AthleteManagementIntegrationTest(APITestCase):
    """
    Integration tests for complete athlete management workflows.
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
        
        # Create guardian
        self.guardian = GuardianFactory()
        
        # Create test athlete data
        self.athlete_data = {
            'full_name': 'Integration Test Athlete',
            'full_name_nepali': 'एकीकरण परीक्षण खेलाडी',
            'date_of_birth': (date.today() - timedelta(days=365 * 15)).isoformat(),
            'gender': 'Male',
            'nationality': 'Nepali',
            'school_id': self.school.school_id,
            'guardian_id': self.guardian.guardian_id,
            'grade': '10',
            'section': 'A',
            'guardian_name': self.guardian.full_name,
            'relationship_to_player': 'Father',
            'guardian_phone': self.guardian.phone,
            'guardian_email': self.guardian.email,
            'address': '123 Integration Street',
            'province': 'Bagmati',
            'district': 'Kathmandu',
            'height_cm': 170,
            'weight_kg': 65.5,
            'blood_group': 'O+',
            'registered_sports': ['Football', 'Basketball'],
            'primary_sport': 'Football'
        }
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_complete_athlete_lifecycle(self):
        """Test complete athlete lifecycle from creation to deletion."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Create athlete
        create_response = self.client.post('/api/athletes/', self.athlete_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(create_response.data['success'])
        
        athlete_id = create_response.data['data']['id']
        athlete_player_id = create_response.data['data']['athlete_id']
        
        # Verify athlete was created with proper data
        self.assertEqual(create_response.data['data']['full_name'], 'Integration Test Athlete')
        self.assertEqual(create_response.data['data']['school_id'], self.school.school_id)
        self.assertIsNotNone(athlete_player_id)
        
        # Step 2: Retrieve athlete details
        get_response = self.client.get(f'/api/athletes/{athlete_id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data['data']['full_name'], 'Integration Test Athlete')
        
        # Step 3: Update athlete information
        update_data = {
            'full_name': 'Updated Athlete Name',
            'grade': '11',
            'height_cm': 175,
            'weight_kg': 70.0,
            'primary_sport': 'Basketball'
        }
        
        update_response = self.client.patch(f'/api/athletes/{athlete_id}/', update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        self.assertEqual(update_response.data['data']['full_name'], 'Updated Athlete Name')
        
        # Step 4: Verify update in database
        verify_response = self.client.get(f'/api/athletes/{athlete_id}/')
        self.assertEqual(verify_response.data['data']['grade'], '11')
        self.assertEqual(verify_response.data['data']['height_cm'], 175)
        
        # Step 5: Test document management
        document_data = {
            'document_type': 'profile_photo',
            'document_url': 'https://example.com/photo.jpg'
        }
        
        doc_response = self.client.post(
            f'/api/athletes/{athlete_id}/documents/upload/',
            document_data,
            format='json'
        )
        self.assertEqual(doc_response.status_code, status.HTTP_200_OK)
        
        # Step 6: Verify document upload
        doc_get_response = self.client.get(f'/api/athletes/{athlete_id}/documents/')
        self.assertEqual(doc_get_response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_photo', doc_get_response.data['data'])
        
        # Step 7: Soft delete athlete
        delete_response = self.client.delete(f'/api/athletes/{athlete_id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Step 8: Verify soft deletion
        athlete = Athlete.objects.get(id=athlete_id)
        self.assertFalse(athlete.is_active)
        
        # Step 9: Verify athlete no longer appears in list
        list_response = self.client.get('/api/athletes/')
        athlete_ids = [a['id'] for a in list_response.data['data']]
        self.assertNotIn(athlete_id, athlete_ids)
    
    def test_athlete_data_isolation_between_schools(self):
        """Test that schools can only access their own athletes."""
        # Create athletes for both schools
        school1_athlete = AthleteFactory(school=self.school)
        school2_athlete = AthleteFactory(school=self.other_school)
        
        # School 1 admin should only see their athletes
        token1 = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        
        response1 = self.client.get('/api/athletes/')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        athlete_ids = [a['id'] for a in response1.data['data']]
        self.assertIn(school1_athlete.id, athlete_ids)
        self.assertNotIn(school2_athlete.id, athlete_ids)
        
        # School 2 admin should only see their athletes
        token2 = self.get_jwt_token(self.other_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token2}')
        
        response2 = self.client.get('/api/athletes/')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        athlete_ids2 = [a['id'] for a in response2.data['data']]
        self.assertIn(school2_athlete.id, athlete_ids2)
        self.assertNotIn(school1_athlete.id, athlete_ids2)
        
        # SuperAdmin should see all athletes
        super_token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {super_token}')
        
        super_response = self.client.get('/api/athletes/')
        self.assertEqual(super_response.status_code, status.HTTP_200_OK)
        
        super_athlete_ids = [a['id'] for a in super_response.data['data']]
        self.assertIn(school1_athlete.id, super_athlete_ids)
        self.assertIn(school2_athlete.id, super_athlete_ids)
    
    def test_athlete_search_and_filtering_workflow(self):
        """Test comprehensive athlete search and filtering."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create diverse set of athletes
        athletes_data = [
            {'full_name': 'John Football', 'gender': 'Male', 'grade': '10', 'primary_sport': 'Football'},
            {'full_name': 'Jane Basketball', 'gender': 'Female', 'grade': '11', 'primary_sport': 'Basketball'},
            {'full_name': 'Mike Football', 'gender': 'Male', 'grade': '10', 'primary_sport': 'Football'},
            {'full_name': 'Sarah Volleyball', 'gender': 'Female', 'grade': '12', 'primary_sport': 'Volleyball'},
        ]
        
        created_athletes = []
        for athlete_data in athletes_data:
            full_data = self.athlete_data.copy()
            full_data.update(athlete_data)
            
            response = self.client.post('/api/athletes/', full_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            created_athletes.append(response.data['data']['id'])
        
        # Test basic search
        search_response = self.client.get('/api/athletes/search/?q=John')
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_response.data['data']), 1)
        self.assertIn('John', search_response.data['data'][0]['full_name'])
        
        # Test gender filter
        gender_response = self.client.get('/api/athletes/?gender=Female')
        self.assertEqual(gender_response.status_code, status.HTTP_200_OK)
        female_athletes = [a for a in gender_response.data['data'] if a['gender'] == 'Female']
        self.assertEqual(len(female_athletes), 2)
        
        # Test grade filter
        grade_response = self.client.get('/api/athletes/?grade=10')
        self.assertEqual(grade_response.status_code, status.HTTP_200_OK)
        grade_10_athletes = [a for a in grade_response.data['data'] if a['grade'] == '10']
        self.assertEqual(len(grade_10_athletes), 2)
        
        # Test sport filter
        sport_response = self.client.get('/api/athletes/search/?primary_sport=Football')
        self.assertEqual(sport_response.status_code, status.HTTP_200_OK)
        football_athletes = [a for a in sport_response.data['data'] if a['primary_sport'] == 'Football']
        self.assertEqual(len(football_athletes), 2)
        
        # Test combined filters
        combined_response = self.client.get('/api/athletes/?gender=Male&grade=10')
        self.assertEqual(combined_response.status_code, status.HTTP_200_OK)
        combined_athletes = [
            a for a in combined_response.data['data'] 
            if a['gender'] == 'Male' and a['grade'] == '10'
        ]
        self.assertEqual(len(combined_athletes), 2)


class AthleteBulkOperationsIntegrationTest(APITestCase):
    """
    Integration tests for athlete bulk operations.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.guardian = GuardianFactory()
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_bulk_athlete_creation_workflow(self):
        """Test bulk athlete creation workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Prepare bulk data
        bulk_data = {
            'athletes': []
        }
        
        for i in range(5):
            athlete_data = {
                'full_name': f'Bulk Athlete {i+1}',
                'date_of_birth': (date.today() - timedelta(days=365 * (15 + i))).isoformat(),
                'gender': 'Male' if i % 2 == 0 else 'Female',
                'school_id': self.school.school_id,
                'guardian_id': self.guardian.guardian_id,
                'guardian_name': self.guardian.full_name,
                'guardian_phone': self.guardian.phone,
                'guardian_email': self.guardian.email,
                'address': f'Address {i+1}',
                'grade': str(10 + (i % 3)),
                'primary_sport': 'Football' if i % 2 == 0 else 'Basketball'
            }
            bulk_data['athletes'].append(athlete_data)
        
        # Execute bulk creation
        response = self.client.post('/api/athletes/bulk-create/', bulk_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        # Verify results
        self.assertEqual(response.data['data']['success_count'], 5)
        self.assertEqual(response.data['data']['error_count'], 0)
        self.assertEqual(len(response.data['data']['created_athletes']), 5)
        
        # Verify athletes were created in database
        created_count = Athlete.objects.filter(
            full_name__startswith='Bulk Athlete',
            school=self.school
        ).count()
        self.assertEqual(created_count, 5)
    
    def test_bulk_athlete_update_workflow(self):
        """Test bulk athlete update workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create test athletes first
        athletes = []
        for i in range(3):
            athlete = AthleteFactory(
                school=self.school,
                full_name=f'Update Test Athlete {i+1}',
                grade='10'
            )
            athletes.append(athlete)
        
        # Prepare bulk update data
        bulk_update_data = {
            'updates': [
                {
                    'athlete_id': athletes[0].id,
                    'grade': '11',
                    'primary_sport': 'Basketball'
                },
                {
                    'athlete_id': athletes[1].id,
                    'grade': '12',
                    'primary_sport': 'Volleyball'
                },
                {
                    'athlete_id': athletes[2].id,
                    'grade': '11',
                    'height_cm': 180
                }
            ]
        }
        
        # Execute bulk update
        response = self.client.post('/api/athletes/bulk-update/', bulk_update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['success_count'], 3)
        
        # Verify updates in database
        for i, athlete in enumerate(athletes):
            athlete.refresh_from_db()
            if i == 0:
                self.assertEqual(athlete.grade, '11')
                self.assertEqual(athlete.primary_sport, 'Basketball')
            elif i == 1:
                self.assertEqual(athlete.grade, '12')
                self.assertEqual(athlete.primary_sport, 'Volleyball')
            elif i == 2:
                self.assertEqual(athlete.grade, '11')
                self.assertEqual(athlete.height_cm, 180)
    
    def test_bulk_athlete_verification_workflow(self):
        """Test bulk athlete verification workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create test athletes with pending verification
        athletes = []
        for i in range(3):
            athlete = AthleteFactory(
                school=self.school,
                verification_status='pending',
                document_verified=False
            )
            athletes.append(athlete)
        
        # Prepare bulk verification data
        bulk_verify_data = {
            'athlete_ids': [athlete.id for athlete in athletes],
            'verification_status': 'verified',
            'notes': 'Bulk verification test'
        }
        
        # Execute bulk verification
        response = self.client.post('/api/athletes/bulk-verify/', bulk_verify_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['updated_count'], 3)
        
        # Verify status updates
        for athlete in athletes:
            athlete.refresh_from_db()
            self.assertEqual(athlete.verification_status, 'verified')
            self.assertTrue(athlete.document_verified)
    
    def test_athlete_export_workflow(self):
        """Test athlete export workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create test athletes
        for i in range(5):
            AthleteFactory(
                school=self.school,
                full_name=f'Export Test Athlete {i+1}'
            )
        
        # Test CSV export
        response = self.client.get('/api/athletes/export/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
        
        # Verify CSV content contains athlete data
        csv_content = response.content.decode('utf-8')
        self.assertIn('Export Test Athlete', csv_content)
        self.assertIn('full_name', csv_content)  # Header row


class AthleteDocumentManagementIntegrationTest(APITestCase):
    """
    Integration tests for athlete document management.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.athlete = AthleteFactory(school=self.school)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_complete_document_management_workflow(self):
        """Test complete document management workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Get initial document status
        initial_response = self.client.get(f'/api/athletes/{self.athlete.id}/documents/')
        self.assertEqual(initial_response.status_code, status.HTTP_200_OK)
        
        # Step 2: Upload profile photo
        photo_data = {
            'document_type': 'profile_photo',
            'document_url': 'https://example.com/athlete_photo.jpg'
        }
        
        photo_response = self.client.post(
            f'/api/athletes/{self.athlete.id}/documents/upload/',
            photo_data,
            format='json'
        )
        self.assertEqual(photo_response.status_code, status.HTTP_200_OK)
        self.assertTrue(photo_response.data['success'])
        
        # Step 3: Upload birth certificate
        cert_data = {
            'document_type': 'birth_certificate',
            'document_url': 'https://example.com/birth_cert.pdf'
        }
        
        cert_response = self.client.post(
            f'/api/athletes/{self.athlete.id}/documents/upload/',
            cert_data,
            format='json'
        )
        self.assertEqual(cert_response.status_code, status.HTTP_200_OK)
        
        # Step 4: Verify documents were uploaded
        docs_response = self.client.get(f'/api/athletes/{self.athlete.id}/documents/')
        self.assertEqual(docs_response.status_code, status.HTTP_200_OK)
        
        docs_data = docs_response.data['data']
        self.assertIn('profile_photo', docs_data)
        self.assertIn('birth_certificate', docs_data)
        self.assertEqual(docs_data['profile_photo']['url'], 'https://example.com/athlete_photo.jpg')
        
        # Step 5: Verify profile photo
        verify_data = {
            'verification_status': 'verified',
            'document_type': 'profile_photo',
            'notes': 'Photo looks good'
        }
        
        verify_response = self.client.post(
            f'/api/athletes/{self.athlete.id}/documents/verify/',
            verify_data,
            format='json'
        )
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_response.data['success'])
        
        # Step 6: Verify athlete status was updated
        self.athlete.refresh_from_db()
        self.assertEqual(self.athlete.verification_status, 'verified')
        self.assertTrue(self.athlete.document_verified)
    
    def test_document_validation_errors(self):
        """Test document upload validation errors."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test invalid document type
        invalid_data = {
            'document_type': 'invalid_type',
            'document_url': 'https://example.com/doc.pdf'
        }
        
        response = self.client.post(
            f'/api/athletes/{self.athlete.id}/documents/upload/',
            invalid_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        
        # Test missing document URL
        missing_url_data = {
            'document_type': 'profile_photo'
        }
        
        response = self.client.post(
            f'/api/athletes/{self.athlete.id}/documents/upload/',
            missing_url_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AthleteAnalyticsIntegrationTest(APITestCase):
    """
    Integration tests for athlete analytics and statistics.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        # Create diverse set of athletes for statistics
        self.create_test_athletes()
    
    def create_test_athletes(self):
        """Create test athletes with diverse characteristics."""
        athletes_data = [
            {'gender': 'Male', 'grade': '10', 'verification_status': 'verified', 'primary_sport': 'Football'},
            {'gender': 'Male', 'grade': '11', 'verification_status': 'verified', 'primary_sport': 'Basketball'},
            {'gender': 'Female', 'grade': '10', 'verification_status': 'pending', 'primary_sport': 'Football'},
            {'gender': 'Female', 'grade': '12', 'verification_status': 'verified', 'primary_sport': 'Volleyball'},
            {'gender': 'Male', 'grade': '11', 'verification_status': 'rejected', 'primary_sport': 'Cricket'},
        ]
        
        for data in athletes_data:
            AthleteFactory(school=self.school, **data)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_athlete_statistics_endpoint(self):
        """Test athlete statistics endpoint."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/athletes/statistics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        stats = response.data['data']
        
        # Verify basic counts
        self.assertEqual(stats['total_athletes'], 5)
        self.assertEqual(stats['verified_athletes'], 3)
        self.assertEqual(stats['pending_athletes'], 1)
        
        # Verify gender distribution
        self.assertIn('gender_distribution', stats)
        gender_dist = stats['gender_distribution']
        self.assertEqual(gender_dist['Male'], 3)
        self.assertEqual(gender_dist['Female'], 2)
        
        # Verify grade distribution
        self.assertIn('grade_distribution', stats)
        grade_dist = stats['grade_distribution']
        self.assertEqual(grade_dist['10'], 2)
        self.assertEqual(grade_dist['11'], 2)
        self.assertEqual(grade_dist['12'], 1)
        
        # Verify sport distribution
        self.assertIn('sport_distribution', stats)
        sport_dist = stats['sport_distribution']
        self.assertEqual(sport_dist['Football'], 2)
        self.assertEqual(sport_dist['Basketball'], 1)
    
    def test_athlete_profile_completion_calculation(self):
        """Test athlete profile completion calculation."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        athlete = Athlete.objects.first()
        
        response = self.client.post(f'/api/athletes/{athlete.id}/recalculate-completion/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        completion_data = response.data['data']
        self.assertIn('old_completion', completion_data)
        self.assertIn('new_completion', completion_data)
        self.assertIsInstance(completion_data['new_completion'], (int, float))
        self.assertGreaterEqual(completion_data['new_completion'], 0)
        self.assertLessEqual(completion_data['new_completion'], 100)


class AthletePerformanceIntegrationTest(APITestCase):
    """
    Integration tests for athlete endpoint performance.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        # Create many athletes for performance testing
        self.create_many_athletes(50)
    
    def create_many_athletes(self, count):
        """Create many athletes for performance testing."""
        for i in range(count):
            AthleteFactory(
                school=self.school,
                full_name=f'Performance Test Athlete {i+1:03d}'
            )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_athlete_list_pagination_performance(self):
        """Test athlete list endpoint with pagination performance."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/athletes/?page=1&page_size=20')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Should return paginated results
        self.assertLessEqual(len(response.data['data']), 20)
        
        # Response should be reasonably fast
        self.assertLess(response_time, 2.0)  # Under 2 seconds
    
    def test_athlete_search_performance(self):
        """Test athlete search performance with large dataset."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/athletes/search/?q=Performance Test')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Should find matching athletes
        self.assertGreater(len(response.data['data']), 0)
        
        # Search should be reasonably fast
        self.assertLess(response_time, 3.0)  # Under 3 seconds
    
    def test_bulk_operations_performance(self):
        """Test bulk operations performance."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get some athlete IDs for bulk update
        list_response = self.client.get('/api/athletes/?page_size=10')
        athlete_ids = [a['id'] for a in list_response.data['data'][:5]]
        
        # Prepare bulk update data
        bulk_update_data = {
            'updates': [
                {
                    'athlete_id': athlete_id,
                    'grade': '11'
                }
                for athlete_id in athlete_ids
            ]
        }
        
        start_time = time.time()
        response = self.client.post('/api/athletes/bulk-update/', bulk_update_data, format='json')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Bulk update should be reasonably fast
        self.assertLess(response_time, 5.0)  # Under 5 seconds for 5 updates


class AthleteErrorHandlingIntegrationTest(APITestCase):
    """
    Integration tests for athlete endpoint error handling.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.athlete = AthleteFactory(school=self.school)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_athlete_not_found_handling(self):
        """Test handling of non-existent athlete requests."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Try to get non-existent athlete
        response = self.client.get('/api/athletes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])
        
        # Try to update non-existent athlete
        update_response = self.client.patch('/api/athletes/99999/', {'grade': '11'}, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_invalid_athlete_data_handling(self):
        """Test handling of invalid athlete data."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test invalid date of birth (future date)
        invalid_data = {
            'full_name': 'Invalid Athlete',
            'date_of_birth': (date.today() + timedelta(days=30)).isoformat(),
            'gender': 'Male',
            'school_id': self.school.school_id
        }
        
        response = self.client.post('/api/athletes/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
    
    def test_malformed_json_handling(self):
        """Test handling of malformed JSON requests."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Send malformed JSON
        response = self.client.post(
            '/api/athletes/',
            'invalid json content',
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_concurrent_athlete_updates(self):
        """Test handling of concurrent athlete updates."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Simulate concurrent updates
        update_data1 = {'grade': '11'}
        update_data2 = {'grade': '12'}
        
        # Both should succeed, last one wins
        response1 = self.client.patch(f'/api/athletes/{self.athlete.id}/', update_data1, format='json')
        response2 = self.client.patch(f'/api/athletes/{self.athlete.id}/', update_data2, format='json')
        
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Verify final state
        final_response = self.client.get(f'/api/athletes/{self.athlete.id}/')
        self.assertEqual(final_response.data['data']['grade'], '12')