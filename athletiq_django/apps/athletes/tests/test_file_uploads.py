import os
import tempfile
from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from PIL import Image
import io

from apps.athletes.models import Athlete, AthleteDocument
from apps.core.models import Organization, School

User = get_user_model()

@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FileUploadTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='testadmin@example.com',
            password='testpass123',
            first_name='Test',
            last_name='Admin',
            role='admin'
        )
        
        # Create test organization
        self.organization = Organization.objects.create(
            name='Test Organization',
            organization_type='school',
            status='active'
        )
        
        # Create test school
        self.school = School.objects.create(
            name='Test School',
            organization=self.organization,
            address='123 Test St'
        )
        
        # Create test athlete
        self.athlete = Athlete.objects.create(
            first_name='John',
            last_name='Doe',
            email='john.doe@example.com',
            phone='1234567890',
            school=self.school,
            grade='9',
            date_of_birth='2005-01-01',
            emergency_contact_name='Jane Doe',
            emergency_contact_phone='0987654321'
        )
        
        # Authenticate user
        self.client.force_authenticate(user=self.user)
    
    def create_test_image(self, format='JPEG'):
        """Create a test image file for upload testing"""
        image = Image.new('RGB', (100, 100), color='red')
        image_file = io.BytesIO()
        image.save(image_file, format=format)
        image_file.seek(0)
        return image_file
    
    def create_test_pdf(self):
        """Create a test PDF-like file for upload testing"""
        pdf_content = b'%PDF-1.4 fake pdf content for testing'
        return io.BytesIO(pdf_content)
    
    def test_upload_athlete_profile_image_success(self):
        """Test successful profile image upload"""
        image_file = self.create_test_image()
        uploaded_file = SimpleUploadedFile(
            'test_profile.jpg',
            image_file.getvalue(),
            content_type='image/jpeg'
        )
        
        url = reverse('upload_athlete_profile_image', kwargs={'athlete_id': self.athlete.id})
        response = self.client.post(url, {'profile_image': uploaded_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('profile_image_url', response.data)
        
        # Verify athlete was updated
        self.athlete.refresh_from_db()
        self.assertTrue(self.athlete.profile_photo)
    
    def test_upload_athlete_profile_image_invalid_file(self):
        """Test profile image upload with invalid file type"""
        text_file = SimpleUploadedFile(
            'test.txt',
            b'This is not an image',
            content_type='text/plain'
        )
        
        url = reverse('upload_athlete_profile_image', kwargs={'athlete_id': self.athlete.id})
        response = self.client.post(url, {'profile_image': text_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_upload_athlete_profile_image_large_file(self):
        """Test profile image upload with file too large"""
        # Create a large image (simulate by creating large content)
        large_content = b'x' * (6 * 1024 * 1024)  # 6MB
        large_file = SimpleUploadedFile(
            'large_image.jpg',
            large_content,
            content_type='image/jpeg'
        )
        
        url = reverse('upload_athlete_profile_image', kwargs={'athlete_id': self.athlete.id})
        response = self.client.post(url, {'profile_image': large_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_upload_athlete_document_success(self):
        """Test successful document upload"""
        pdf_file = self.create_test_pdf()
        uploaded_file = SimpleUploadedFile(
            'birth_certificate.pdf',
            pdf_file.getvalue(),
            content_type='application/pdf'
        )
        
        url = reverse('upload_athlete_document', kwargs={'athlete_id': self.athlete.id})
        response = self.client.post(url, {
            'document_file': uploaded_file,
            'document_type': 'birth_certificate',
            'description': 'Test birth certificate'
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('document', response.data)
        
        # Verify document was created
        document = AthleteDocument.objects.filter(athlete=self.athlete).first()
        self.assertIsNotNone(document)
        self.assertEqual(document.document_type, 'birth_certificate')
        self.assertEqual(document.description, 'Test birth certificate')
    
    def test_upload_athlete_document_invalid_type(self):
        """Test document upload with invalid file type"""
        exe_file = SimpleUploadedFile(
            'malicious.exe',
            b'This is not a valid document',
            content_type='application/octet-stream'
        )
        
        url = reverse('upload_athlete_document', kwargs={'athlete_id': self.athlete.id})
        response = self.client.post(url, {
            'document_file': exe_file,
            'document_type': 'birth_certificate'
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_upload_document_nonexistent_athlete(self):
        """Test document upload for non-existent athlete"""
        pdf_file = self.create_test_pdf()
        uploaded_file = SimpleUploadedFile(
            'test.pdf',
            pdf_file.getvalue(),
            content_type='application/pdf'
        )
        
        url = reverse('upload_athlete_document', kwargs={'athlete_id': 99999})
        response = self.client.post(url, {
            'document_file': uploaded_file,
            'document_type': 'birth_certificate'
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_upload_without_authentication(self):
        """Test upload without authentication"""
        self.client.force_authenticate(user=None)
        
        image_file = self.create_test_image()
        uploaded_file = SimpleUploadedFile(
            'test.jpg',
            image_file.getvalue(),
            content_type='image/jpeg'
        )
        
        url = reverse('upload_athlete_profile_image', kwargs={'athlete_id': self.athlete.id})
        response = self.client.post(url, {'profile_image': uploaded_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_birth_certificate_auto_upload(self):
        """Test that birth certificate also updates athlete's birth_certificate field"""
        pdf_file = self.create_test_pdf()
        uploaded_file = SimpleUploadedFile(
            'birth_cert.pdf',
            pdf_file.getvalue(),
            content_type='application/pdf'
        )
        
        url = reverse('upload_athlete_document', kwargs={'athlete_id': self.athlete.id})
        response = self.client.post(url, {
            'document_file': uploaded_file,
            'document_type': 'birth_certificate',
            'description': 'Official birth certificate'
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify both AthleteDocument and Athlete.birth_certificate are updated
        document = AthleteDocument.objects.filter(
            athlete=self.athlete, 
            document_type='birth_certificate'
        ).first()
        self.assertIsNotNone(document)
        
        self.athlete.refresh_from_db()
        self.assertTrue(self.athlete.birth_certificate)