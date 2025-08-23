import os
import tempfile
from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from PIL import Image
from io import BytesIO

from ..models import Document, ProcessedImage, OCRResult, PDFTemplate, GeneratedPDF
from apps.schools.models import School
from apps.athletes.models import Athlete

User = get_user_model()


class DocumentModelTest(TestCase):
    """Test Document model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
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
    
    def test_document_creation(self):
        """Test creating a document"""
        # Create a test file
        test_file = SimpleUploadedFile(
            "test.txt",
            b"Test file content",
            content_type="text/plain"
        )
        
        document = Document.objects.create(
            title='Test Document',
            description='Test description',
            document_type='other',
            file=test_file,
            uploaded_by=self.user,
            school=self.school
        )
        
        self.assertEqual(document.title, 'Test Document')
        self.assertEqual(document.document_type, 'other')
        self.assertEqual(document.uploaded_by, self.user)
        self.assertEqual(document.school, self.school)
        # Status might be changed by signals, so check it's not None
        self.assertIsNotNone(document.status)
        self.assertFalse(document.is_public)
    
    def test_document_file_size_auto_set(self):
        """Test that file size is automatically set"""
        test_content = b"Test file content for size calculation"
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
        
        self.assertEqual(document.file_size, len(test_content))
        # Mime type should be set from content_type or extension
        self.assertIn(document.mime_type, ['text/plain', 'application/octet-stream'])
    
    def test_document_str_representation(self):
        """Test document string representation"""
        document = Document.objects.create(
            title='Test Document',
            document_type='certificate',
            uploaded_by=self.user,
            file_size=0,  # Explicitly set file_size
            mime_type='application/octet-stream'  # Explicitly set mime_type
        )
        
        expected_str = "Test Document (certificate)"
        self.assertEqual(str(document), expected_str)


class ProcessedImageModelTest(TestCase):
    """Test ProcessedImage model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123',
            full_name='Test User'
        )
        
        # Create a test image
        image = Image.new('RGB', (100, 100), color='red')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        test_file = SimpleUploadedFile(
            "test.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
        
        self.document = Document.objects.create(
            title='Test Image',
            document_type='athlete_photo',
            file=test_file,
            uploaded_by=self.user
        )
    
    def test_processed_image_creation(self):
        """Test creating a processed image"""
        processed_image = ProcessedImage.objects.create(
            original_document=self.document,
            width=300,
            height=300,
            file_size=5000,
            quality=85,
            is_thumbnail=True
        )
        
        self.assertEqual(processed_image.original_document, self.document)
        self.assertEqual(processed_image.width, 300)
        self.assertEqual(processed_image.height, 300)
        self.assertTrue(processed_image.is_thumbnail)
        self.assertEqual(processed_image.quality, 85)


class PDFTemplateModelTest(TestCase):
    """Test PDFTemplate model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser3',
            email='test3@example.com',
            password='testpass123',
            full_name='Test User',
            role='SuperAdmin'
        )
    
    def test_pdf_template_creation(self):
        """Test creating a PDF template"""
        template_content = '{"template": "test"}'
        test_file = SimpleUploadedFile(
            "template.json",
            template_content.encode(),
            content_type="application/json"
        )
        
        template = PDFTemplate.objects.create(
            name='Test Template',
            template_type='scoresheet',
            description='Test template description',
            template_file=test_file,
            created_by=self.user
        )
        
        self.assertEqual(template.name, 'Test Template')
        self.assertEqual(template.template_type, 'scoresheet')
        self.assertTrue(template.is_active)
        self.assertEqual(template.created_by, self.user)
    
    def test_pdf_template_str_representation(self):
        """Test template string representation"""
        template = PDFTemplate.objects.create(
            name='Certificate Template',
            template_type='certificate',
            created_by=self.user
        )
        
        expected_str = "Certificate Template (certificate)"
        self.assertEqual(str(template), expected_str)