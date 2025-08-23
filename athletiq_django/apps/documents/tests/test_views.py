import os
import tempfile
from django.test import TestCase, override_settings
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from PIL import Image
from io import BytesIO

from ..models import Document, PDFTemplate
from apps.schools.models import School

User = get_user_model()


class DocumentViewSetTest(TestCase):
    """Test DocumentViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='SchoolAdmin'
        )
        
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='Test Address',
            country='Test Country',
            province='Test Province',
            district='Test District',
            city='Test City',
            ward='1',
            phone='1234567890',
            email='school@test.com',
            principal_name='Test Principal',
            admin_user=self.user
        )
        
        self.client.force_authenticate(user=self.user)
    
    def test_document_list(self):
        """Test listing documents"""
        # Create test document
        test_file = SimpleUploadedFile(
            "test.txt",
            b"Test content",
            content_type="text/plain"
        )
        
        Document.objects.create(
            title='Test Document',
            document_type='other',
            file=test_file,
            uploaded_by=self.user
        )
        
        url = reverse('documents:document-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_document_upload(self):
        """Test document upload"""
        test_file = SimpleUploadedFile(
            "test.txt",
            b"Test file content",
            content_type="text/plain"
        )
        
        data = {
            'title': 'Test Upload',
            'description': 'Test description',
            'document_type': 'other',
            'file': test_file
        }
        
        url = reverse('documents:document-list')
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.count(), 1)
        
        document = Document.objects.first()
        self.assertEqual(document.title, 'Test Upload')
        self.assertEqual(document.uploaded_by, self.user)
    
    def test_document_upload_validation(self):
        """Test document upload validation"""
        # Test without file
        data = {
            'title': 'Test Upload',
            'document_type': 'other'
        }
        
        url = reverse('documents:document-list')
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)
    
    def test_document_download(self):
        """Test document download"""
        test_content = b"Test file content for download"
        test_file = SimpleUploadedFile(
            "test.txt",
            test_content,
            content_type="text/plain"
        )
        
        document = Document.objects.create(
            title='Test Document',
            document_type='other',
            file=test_file,
            uploaded_by=self.user
        )
        
        url = reverse('documents:document-download', kwargs={'pk': document.document_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/plain')
    
    def test_unauthorized_access(self):
        """Test unauthorized access to documents"""
        self.client.force_authenticate(user=None)
        
        url = reverse('documents:document-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class FileUploadViewTest(TestCase):
    """Test FileUploadView"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            full_name='Test User'
        )
        
        self.client.force_authenticate(user=self.user)
    
    def test_single_file_upload(self):
        """Test single file upload"""
        test_file = SimpleUploadedFile(
            "test.txt",
            b"Test file content",
            content_type="text/plain"
        )
        
        data = {
            'title': 'Test Upload',
            'document_type': 'other',
            'file': test_file
        }
        
        url = reverse('documents:single-upload')
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('document', response.data)
    
    def test_bulk_file_upload(self):
        """Test bulk file upload"""
        test_file1 = SimpleUploadedFile(
            "test1.txt",
            b"Test file 1 content",
            content_type="text/plain"
        )
        
        test_file2 = SimpleUploadedFile(
            "test2.txt",
            b"Test file 2 content",
            content_type="text/plain"
        )
        
        data = {
            'files': [test_file1, test_file2],
            'document_type': 'other'
        }
        
        url = reverse('documents:bulk-upload')
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(Document.objects.count(), 2)


class PDFTemplateViewSetTest(TestCase):
    """Test PDFTemplateViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='SuperAdmin'
        )
        
        self.client.force_authenticate(user=self.user)
    
    def test_template_list(self):
        """Test listing PDF templates"""
        template_content = '{"template": "test"}'
        test_file = SimpleUploadedFile(
            "template.json",
            template_content.encode(),
            content_type="application/json"
        )
        
        PDFTemplate.objects.create(
            name='Test Template',
            template_type='scoresheet',
            template_file=test_file,
            created_by=self.user
        )
        
        url = reverse('documents:pdf-template-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_template_creation(self):
        """Test creating PDF template"""
        template_content = '{"template": "test content"}'
        test_file = SimpleUploadedFile(
            "template.json",
            template_content.encode(),
            content_type="application/json"
        )
        
        data = {
            'name': 'New Template',
            'template_type': 'certificate',
            'description': 'Test template',
            'template_file': test_file
        }
        
        url = reverse('documents:pdf-template-list')
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PDFTemplate.objects.count(), 1)
        
        template = PDFTemplate.objects.first()
        self.assertEqual(template.name, 'New Template')
        self.assertEqual(template.created_by, self.user)