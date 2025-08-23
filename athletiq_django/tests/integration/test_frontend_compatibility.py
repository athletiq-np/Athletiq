"""
Frontend Compatibility Tests for React Integration.

This test suite verifies that the Django backend maintains complete compatibility
with the existing React frontend by testing:
1. API response format compatibility
2. JWT token compatibility
3. File upload and download functionality
4. Pagination and filtering compatibility
5. Frontend integration smoke tests

Requirements: 3.1, 3.2, 3.3, 3.4
"""
import json
import time
import tempfile
from io import BytesIO
from PIL import Image
from django.test import TestCase, override_settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.schools.models import School
from apps.tournaments.models import Tournament
from apps.athletes.models import Athlete
from apps.guardians.models import Guardian
from apps.documents.models import Document
from tests.factories import (
    UserFactory, SchoolFactory, TournamentFactory, 
    AthleteFactory, GuardianFactory
)

User = get_user_model()


class APIResponseFormatCompatibilityTest(APITestCase):
    """
    Test API response format compatibility with React frontend expectations.
    
    Verifies that all API responses maintain the exact format expected by
    the existing React frontend components.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test users
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        
        # Create test entities
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.tournament = TournamentFactory(organizer=self.super_admin)
        self.athlete = AthleteFactory(school=self.school)
        self.guardian = GuardianFactory()
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_success_response_format(self):
        """Test that success responses match expected format."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/schools/')
        
        # Verify response structure matches Node.js format
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('success', response.data)
        self.assertIn('message', response.data)
        self.assertIn('data', response.data)
        
        # Verify success response format
        self.assertTrue(response.data['success'])
        self.assertIsInstance(response.data['message'], str)
        self.assertIsInstance(response.data['data'], (list, dict))
    
    def test_error_response_format(self):
        """Test that error responses match expected format."""
        # Test validation error
        response = self.client.post('/api/schools/register/', {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('success', response.data)
        self.assertIn('message', response.data)
        self.assertIn('errors', response.data)
        
        # Verify error response format
        self.assertFalse(response.data['success'])
        self.assertIsInstance(response.data['message'], str)
        self.assertIsInstance(response.data['errors'], dict)
    
    def test_authentication_response_format(self):
        """Test authentication response format compatibility."""
        login_data = {
            'email': self.school_admin.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        
        # Verify authentication data structure
        auth_data = response.data['data']
        self.assertIn('access_token', auth_data)
        self.assertIn('refresh_token', auth_data)
        self.assertIn('user', auth_data)
        
        # Verify user object structure
        user_data = auth_data['user']
        self.assertIn('user_id', user_data)
        self.assertIn('email', user_data)
        self.assertIn('role', user_data)
        self.assertIn('full_name', user_data)
    
    def test_school_registration_response_format(self):
        """Test school registration response format."""
        registration_data = {
            'name': 'Test School',
            'address': '123 Test Street',
            'country': 'Rwanda',
            'province': 'Kigali',
            'district': 'Gasabo',
            'city': 'Kigali',
            'ward': '5',
            'phone': '+250788123456',
            'email': 'info@testschool.com',
            'principal_name': 'Test Principal',
            'admin_name': 'Test Admin',
            'admin_email': 'admin@testschool.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/schools/register/', registration_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        
        # Verify registration response structure matches Node.js
        registration_result = response.data['data']
        self.assertIn('school_id', registration_result)
        self.assertIn('school_code', registration_result)
        self.assertIn('admin_user_id', registration_result)
    
    def test_tournament_list_response_format(self):
        """Test tournament list response format."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/tournaments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        
        # Verify tournament data structure
        if response.data['data']:
            tournament_data = response.data['data'][0]
            expected_fields = [
                'id', 'tournament_code', 'name', 'description', 'sport',
                'tournament_type', 'format', 'location', 'start_date',
                'end_date', 'status', 'organizer'
            ]
            for field in expected_fields:
                self.assertIn(field, tournament_data)
    
    def test_athlete_response_format(self):
        """Test athlete response format."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/athletes/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify athlete data structure
        if response.data['data']:
            athlete_data = response.data['data'][0]
            expected_fields = [
                'athlete_id', 'player_id', 'full_name', 'date_of_birth',
                'gender', 'school', 'sports', 'registration_status'
            ]
            for field in expected_fields:
                self.assertIn(field, athlete_data)


class JWTTokenCompatibilityTest(APITestCase):
    """
    Test JWT token compatibility with existing React frontend.
    
    Verifies that JWT tokens work identically to the Node.js implementation
    and are compatible with existing frontend token handling.
    
    Requirements: 3.2 - Authentication compatibility
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.guardian = GuardianFactory()
    
    def test_jwt_token_structure(self):
        """Test JWT token structure matches frontend expectations."""
        login_data = {
            'email': self.school_admin.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify token structure
        tokens = response.data['data']
        access_token = tokens['access_token']
        refresh_token = tokens['refresh_token']
        
        # JWT tokens should have 3 parts separated by dots
        self.assertEqual(len(access_token.split('.')), 3)
        self.assertEqual(len(refresh_token.split('.')), 3)
        
        # Tokens should be strings
        self.assertIsInstance(access_token, str)
        self.assertIsInstance(refresh_token, str)
    
    def test_jwt_token_authentication(self):
        """Test JWT token authentication works with protected endpoints."""
        # Get token
        login_data = {
            'email': self.school_admin.email,
            'password': 'testpass123'
        }
        
        login_response = self.client.post('/api/auth/login/', login_data, format='json')
        access_token = login_response.data['data']['access_token']
        
        # Test token works with Authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.get('/api/schools/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test without token fails
        self.client.credentials()
        response = self.client.get('/api/schools/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_jwt_token_refresh(self):
        """Test JWT token refresh functionality."""
        # Get initial tokens
        login_data = {
            'email': self.school_admin.email,
            'password': 'testpass123'
        }
        
        login_response = self.client.post('/api/auth/login/', login_data, format='json')
        refresh_token = login_response.data['data']['refresh_token']
        
        # Test token refresh
        refresh_data = {'refresh': refresh_token}
        refresh_response = self.client.post('/api/auth/refresh/', refresh_data, format='json')
        
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertTrue(refresh_response.data['success'])
        self.assertIn('access_token', refresh_response.data['data'])
        
        # New token should work
        new_access_token = refresh_response.data['data']['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
        
        response = self.client.get('/api/schools/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_guardian_jwt_compatibility(self):
        """Test guardian JWT token compatibility."""
        login_data = {
            'email': self.guardian.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/guardian/auth/login', login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify guardian token structure
        self.assertIn('access_token', response.data['data'])
        self.assertIn('guardian', response.data['data'])
        
        # Test guardian token works
        access_token = response.data['data']['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        guardian_response = self.client.get('/api/guardian/profile/')
        self.assertEqual(guardian_response.status_code, status.HTTP_200_OK)
    
    def test_jwt_token_expiration_handling(self):
        """Test JWT token expiration is handled correctly."""
        # This test verifies that expired tokens return proper error format
        login_data = {
            'email': self.school_admin.email,
            'password': 'testpass123'
        }
        
        login_response = self.client.post('/api/auth/login/', login_data, format='json')
        
        # Create an expired token manually for testing
        refresh = RefreshToken.for_user(self.school_admin)
        access_token = refresh.access_token
        
        # Set expiration to past (simulate expired token)
        from datetime import timedelta
        access_token.set_exp(lifetime=-timedelta(hours=1))
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access_token)}')
        
        response = self.client.get('/api/schools/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])


class FileUploadDownloadCompatibilityTest(APITestCase):
    """
    Test file upload and download functionality compatibility.
    
    Verifies that file operations work identically to the Node.js implementation
    and maintain compatibility with React frontend file handling.
    
    Requirements: 3.3 - Frontend workflow compatibility
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
    
    def create_test_image(self, format='JPEG', size=(100, 100)):
        """Create a test image file."""
        image = Image.new('RGB', size, color='red')
        image_io = BytesIO()
        image.save(image_io, format=format)
        image_io.seek(0)
        return image_io
    
    def create_test_pdf_content(self):
        """Create test PDF content."""
        return b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n%%EOF'
    
    def test_image_upload_compatibility(self):
        """Test image upload maintains Node.js compatibility."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create test image
        image_content = self.create_test_image()
        image_file = SimpleUploadedFile(
            "test_image.jpg",
            image_content.getvalue(),
            content_type="image/jpeg"
        )
        
        # Test upload
        upload_data = {
            'file': image_file,
            'document_type': 'profile_photo',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id,
            'description': 'Test image upload'
        }
        
        response = self.client.post('/api/documents/upload/', upload_data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        
        # Verify upload response structure
        upload_result = response.data['data']
        self.assertIn('document_id', upload_result)
        self.assertIn('file_url', upload_result)
        self.assertIn('file_size', upload_result)
        self.assertIn('file_type', upload_result)
    
    def test_pdf_upload_compatibility(self):
        """Test PDF upload maintains Node.js compatibility."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create test PDF
        pdf_content = self.create_test_pdf_content()
        pdf_file = SimpleUploadedFile(
            "test_document.pdf",
            pdf_content,
            content_type="application/pdf"
        )
        
        # Test upload
        upload_data = {
            'file': pdf_file,
            'document_type': 'certificate',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id,
            'description': 'Test PDF upload'
        }
        
        response = self.client.post('/api/documents/upload/', upload_data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        # Verify PDF-specific handling
        upload_result = response.data['data']
        self.assertEqual(upload_result['file_type'], 'application/pdf')
    
    def test_file_download_compatibility(self):
        """Test file download maintains Node.js compatibility."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # First upload a file
        image_content = self.create_test_image()
        image_file = SimpleUploadedFile(
            "download_test.jpg",
            image_content.getvalue(),
            content_type="image/jpeg"
        )
        
        upload_data = {
            'file': image_file,
            'document_type': 'profile_photo',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id
        }
        
        upload_response = self.client.post('/api/documents/upload/', upload_data, format='multipart')
        document_id = upload_response.data['data']['document_id']
        
        # Test download
        download_response = self.client.get(f'/api/documents/{document_id}/download/')
        
        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(download_response['Content-Type'], 'image/jpeg')
        self.assertIn('Content-Disposition', download_response)
    
    def test_file_validation_compatibility(self):
        """Test file validation maintains Node.js compatibility."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test invalid file type
        invalid_file = SimpleUploadedFile(
            "test.exe",
            b"invalid content",
            content_type="application/x-executable"
        )
        
        upload_data = {
            'file': invalid_file,
            'document_type': 'profile_photo',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id
        }
        
        response = self.client.post('/api/documents/upload/', upload_data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
    
    def test_file_size_limit_compatibility(self):
        """Test file size limits maintain Node.js compatibility."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create oversized image (simulate large file)
        large_image_content = self.create_test_image(size=(5000, 5000))
        large_file = SimpleUploadedFile(
            "large_image.jpg",
            large_image_content.getvalue(),
            content_type="image/jpeg"
        )
        
        upload_data = {
            'file': large_file,
            'document_type': 'profile_photo',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id
        }
        
        response = self.client.post('/api/documents/upload/', upload_data, format='multipart')
        
        # Should either succeed or fail with proper error format
        if response.status_code != status.HTTP_201_CREATED:
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(response.data['success'])
            self.assertIn('errors', response.data)


class PaginationFilteringCompatibilityTest(APITestCase):
    """
    Test pagination and filtering compatibility with React frontend.
    
    Verifies that pagination and filtering work identically to the Node.js
    implementation and maintain compatibility with frontend components.
    
    Requirements: 3.1 - API endpoint compatibility
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        
        # Create multiple test entities for pagination testing
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        # Create multiple tournaments
        self.tournaments = []
        for i in range(15):
            tournament = TournamentFactory(
                name=f'Tournament {i}',
                sport='Football' if i % 2 == 0 else 'Basketball',
                organizer=self.super_admin
            )
            self.tournaments.append(tournament)
        
        # Create multiple athletes
        self.athletes = []
        for i in range(20):
            athlete = AthleteFactory(
                full_name=f'Athlete {i}',
                gender='Male' if i % 2 == 0 else 'Female',
                school=self.school
            )
            self.athletes.append(athlete)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_tournament_pagination_compatibility(self):
        """Test tournament pagination maintains Node.js compatibility."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test first page
        response = self.client.get('/api/tournaments/?page=1&limit=10')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        self.assertIn('meta', response.data)
        
        # Verify pagination metadata structure
        meta = response.data['meta']
        expected_meta_fields = ['page', 'limit', 'total', 'total_pages', 'has_next', 'has_previous']
        for field in expected_meta_fields:
            self.assertIn(field, meta)
        
        # Verify data structure
        self.assertIsInstance(response.data['data'], list)
        self.assertLessEqual(len(response.data['data']), 10)
        
        # Test second page
        if meta['has_next']:
            page2_response = self.client.get('/api/tournaments/?page=2&limit=10')
            self.assertEqual(page2_response.status_code, status.HTTP_200_OK)
            self.assertTrue(page2_response.data['meta']['has_previous'])
    
    def test_athlete_pagination_compatibility(self):
        """Test athlete pagination maintains Node.js compatibility."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/athletes/?page=1&limit=5')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify pagination works
        self.assertLessEqual(len(response.data['data']), 5)
        self.assertIn('meta', response.data)
    
    def test_tournament_filtering_compatibility(self):
        """Test tournament filtering maintains Node.js compatibility."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test sport filter
        response = self.client.get('/api/tournaments/?sport=Football')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify filtering works
        for tournament in response.data['data']:
            self.assertEqual(tournament['sport'], 'Football')
        
        # Test search filter
        search_response = self.client.get('/api/tournaments/?search=Tournament 1')
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        
        # Verify search results
        for tournament in search_response.data['data']:
            self.assertIn('Tournament 1', tournament['name'])
    
    def test_athlete_filtering_compatibility(self):
        """Test athlete filtering maintains Node.js compatibility."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test gender filter
        response = self.client.get('/api/athletes/?gender=Male')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify filtering works
        for athlete in response.data['data']:
            self.assertEqual(athlete['gender'], 'Male')
        
        # Test search filter
        search_response = self.client.get('/api/athletes/?search=Athlete 1')
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
    
    def test_combined_pagination_filtering_compatibility(self):
        """Test combined pagination and filtering compatibility."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test pagination with filtering
        response = self.client.get('/api/tournaments/?sport=Football&page=1&limit=5')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify both pagination and filtering work together
        self.assertLessEqual(len(response.data['data']), 5)
        for tournament in response.data['data']:
            self.assertEqual(tournament['sport'], 'Football')
        
        # Verify meta information is correct
        meta = response.data['meta']
        self.assertEqual(meta['page'], 1)
        self.assertEqual(meta['limit'], 5)
    
    def test_sorting_compatibility(self):
        """Test sorting maintains Node.js compatibility."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test ascending sort
        asc_response = self.client.get('/api/tournaments/?ordering=name')
        self.assertEqual(asc_response.status_code, status.HTTP_200_OK)
        
        # Test descending sort
        desc_response = self.client.get('/api/tournaments/?ordering=-name')
        self.assertEqual(desc_response.status_code, status.HTTP_200_OK)
        
        # Verify sorting works (if we have data)
        if asc_response.data['data'] and desc_response.data['data']:
            asc_first = asc_response.data['data'][0]['name']
            desc_first = desc_response.data['data'][0]['name']
            # They should be different if sorting is working
            self.assertNotEqual(asc_first, desc_first)


class FrontendIntegrationSmokeTest(APITestCase):
    """
    Frontend integration smoke tests.
    
    High-level tests that simulate typical React frontend workflows
    to ensure end-to-end compatibility.
    
    Requirements: 3.4 - Error handling compatibility
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.guardian = GuardianFactory()
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_complete_school_registration_workflow(self):
        """Test complete school registration workflow as frontend would use it."""
        # Step 1: Register school (as frontend would)
        registration_data = {
            'name': 'Frontend Test School',
            'address': '123 Frontend Street',
            'country': 'Rwanda',
            'province': 'Kigali',
            'district': 'Gasabo',
            'city': 'Kigali',
            'ward': '5',
            'phone': '+250788123456',
            'email': 'info@frontendschool.com',
            'principal_name': 'Frontend Principal',
            'admin_name': 'Frontend Admin',
            'admin_email': 'admin@frontendschool.com',
            'password': 'frontendpass123'
        }
        
        reg_response = self.client.post('/api/schools/register/', registration_data, format='json')
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        
        # Step 2: Login as school admin (as frontend would)
        login_data = {
            'email': 'admin@frontendschool.com',
            'password': 'frontendpass123'
        }
        
        login_response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        token = login_response.data['data']['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 3: Get school profile (as frontend would)
        profile_response = self.client.get('/api/schools/me/')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        
        # Step 4: Create tournament (as frontend would)
        tournament_data = {
            'name': 'Frontend Test Tournament',
            'description': 'Test tournament from frontend',
            'sport': 'Football',
            'tournament_type': 'Knockout',
            'format': 'Single Elimination',
            'location': 'Kigali Stadium',
            'start_date': '2024-12-01',
            'end_date': '2024-12-03',
            'max_teams': 16,
            'min_teams': 8,
            'entry_fee': '50.00',
            'age_group': 'U18',
            'gender': 'Mixed',
            'category': 'School'
        }
        
        tournament_response = self.client.post('/api/tournaments/', tournament_data, format='json')
        self.assertEqual(tournament_response.status_code, status.HTTP_201_CREATED)
        
        # Verify all responses have correct format
        for response in [reg_response, login_response, profile_response, tournament_response]:
            self.assertIn('success', response.data)
            self.assertTrue(response.data['success'])
    
    def test_guardian_registration_and_athlete_claim_workflow(self):
        """Test guardian registration and athlete claim workflow."""
        # Step 1: Guardian registration
        guardian_data = {
            'full_name': 'Frontend Guardian',
            'email': 'guardian@frontend.com',
            'phone': '+250788999888',
            'password': 'guardianpass123',
            'confirm_password': 'guardianpass123',
            'address': '456 Guardian Street',
            'city': 'Kigali',
            'province': 'Kigali'
        }
        
        reg_response = self.client.post('/api/guardian/auth/register', guardian_data, format='json')
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        
        # Step 2: Guardian login
        login_data = {
            'email': 'guardian@frontend.com',
            'password': 'guardianpass123'
        }
        
        login_response = self.client.post('/api/guardian/auth/login', login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        token = login_response.data['data']['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 3: Get guardian profile
        profile_response = self.client.get('/api/guardian/profile/')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        
        # Verify all responses have correct format
        for response in [reg_response, login_response, profile_response]:
            self.assertIn('success', response.data)
            self.assertTrue(response.data['success'])
    
    def test_file_upload_workflow(self):
        """Test file upload workflow as frontend would use it."""
        # Setup authenticated user
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create test school and athlete
        school = SchoolFactory()
        athlete = AthleteFactory(school=school)
        
        # Create test image
        image = Image.new('RGB', (100, 100), color='blue')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        image_file = SimpleUploadedFile(
            "frontend_test.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
        
        # Upload file (as frontend would)
        upload_data = {
            'file': image_file,
            'document_type': 'profile_photo',
            'entity_type': 'athlete',
            'entity_id': athlete.id,
            'description': 'Frontend test upload'
        }
        
        upload_response = self.client.post('/api/documents/upload/', upload_data, format='multipart')
        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(upload_response.data['success'])
        
        document_id = upload_response.data['data']['document_id']
        
        # Get document details (as frontend would)
        details_response = self.client.get(f'/api/documents/{document_id}/')
        self.assertEqual(details_response.status_code, status.HTTP_200_OK)
        
        # Download file (as frontend would)
        download_response = self.client.get(f'/api/documents/{document_id}/download/')
        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
    
    def test_api_error_handling_workflow(self):
        """Test API error handling as frontend would encounter it."""
        # Test unauthenticated access
        response = self.client.get('/api/schools/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
        self.assertIn('message', response.data)
        
        # Test validation errors
        invalid_data = {
            'name': '',  # Empty required field
            'admin_email': 'invalid-email'  # Invalid email
        }
        
        validation_response = self.client.post('/api/schools/register/', invalid_data, format='json')
        self.assertEqual(validation_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(validation_response.data['success'])
        self.assertIn('errors', validation_response.data)
        
        # Test not found errors
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        not_found_response = self.client.get('/api/tournaments/99999/')
        self.assertEqual(not_found_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(not_found_response.data['success'])
    
    def test_cors_headers_compatibility(self):
        """Test CORS headers are compatible with frontend."""
        # Test preflight request
        response = self.client.options('/api/auth/login/')
        
        # Should have CORS headers
        self.assertIn('Access-Control-Allow-Origin', response)
        self.assertIn('Access-Control-Allow-Methods', response)
        self.assertIn('Access-Control-Allow-Headers', response)
    
    def test_content_type_handling(self):
        """Test content type handling matches frontend expectations."""
        # Test JSON content type
        login_data = {
            'email': self.super_admin.email,
            'password': 'testpass123'
        }
        
        json_response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(json_response.status_code, status.HTTP_200_OK)
        
        # Test form data content type
        form_response = self.client.post('/api/auth/login/', login_data)
        # Should work or give proper error
        self.assertIn(form_response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
        
        if form_response.status_code == status.HTTP_400_BAD_REQUEST:
            self.assertFalse(form_response.data['success'])