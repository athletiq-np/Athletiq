"""
Unit tests for documents models.
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from decimal import Decimal
import json

from apps.documents.models import Document, ProcessedImage, OCRResult, PDFTemplate, GeneratedPDF
from tests.factories import UserFactory, DocumentFactory


class DocumentModelTest(TestCase):
    """Test cases for Document model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.document_data = {
            'title': 'Test Document',
            'description': 'A test document for unit testing',
            'file_path': '/uploads/documents/test_doc.pdf',
            'file_type': 'pdf',
            'file_size': 1024000,  # 1MB
            'uploaded_by': self.user,
            'is_public': False,
            'document_type': 'certificate',
            'metadata': {
                'original_filename': 'test_doc.pdf',
                'mime_type': 'application/pdf',
                'checksum': 'abc123def456'
            }
        }
    
    def test_document_creation(self):
        """Test basic document creation."""
        document = Document.objects.create(**self.document_data)
        
        self.assertEqual(document.title, 'Test Document')
        self.assertEqual(document.file_type, 'pdf')
        self.assertEqual(document.file_size, 1024000)
        self.assertEqual(document.uploaded_by, self.user)
        self.assertFalse(document.is_public)
        self.assertEqual(document.document_type, 'certificate')
        self.assertIsNotNone(document.created_at)
        self.assertIsNotNone(document.updated_at)
    
    def test_document_str_representation(self):
        """Test document string representation."""
        document = Document.objects.create(**self.document_data)
        expected = f"{document.title} ({document.file_type})"
        self.assertEqual(str(document), expected)
    
    def test_file_type_choices_validation(self):
        """Test file type field validation."""
        valid_types = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'txt']
        
        for file_type in valid_types:
            document_data = self.document_data.copy()
            document_data['file_type'] = file_type
            document_data['title'] = f'Test {file_type.upper()}'
            document_data['file_path'] = f'/uploads/test.{file_type}'
            
            document = Document.objects.create(**document_data)
            self.assertEqual(document.file_type, file_type)
    
    def test_document_type_choices_validation(self):
        """Test document type field validation."""
        valid_types = ['certificate', 'scoresheet', 'report', 'form', 'image', 'other']
        
        for doc_type in valid_types:
            document_data = self.document_data.copy()
            document_data['document_type'] = doc_type
            document_data['title'] = f'Test {doc_type}'
            
            document = Document.objects.create(**document_data)
            self.assertEqual(document.document_type, doc_type)
    
    def test_metadata_json_field(self):
        """Test metadata JSON field functionality."""
        document = Document.objects.create(**self.document_data)
        
        expected_metadata = {
            'original_filename': 'test_doc.pdf',
            'mime_type': 'application/pdf',
            'checksum': 'abc123def456'
        }
        self.assertEqual(document.metadata, expected_metadata)
        
        # Update metadata
        document.metadata['upload_ip'] = '192.168.1.1'
        document.save()
        
        document.refresh_from_db()
        self.assertIn('upload_ip', document.metadata)
        self.assertEqual(document.metadata['upload_ip'], '192.168.1.1')
    
    def test_file_size_validation(self):
        """Test file size validation."""
        # Valid file size
        document = Document.objects.create(**self.document_data)
        self.assertEqual(document.file_size, 1024000)
        
        # Test very large file size
        document_data = self.document_data.copy()
        document_data['file_size'] = 100 * 1024 * 1024  # 100MB
        document_data['title'] = 'Large Document'
        
        large_document = Document.objects.create(**document_data)
        self.assertEqual(large_document.file_size, 100 * 1024 * 1024)
    
    def test_user_relationship(self):
        """Test document-user relationship."""
        document = Document.objects.create(**self.document_data)
        
        self.assertEqual(document.uploaded_by, self.user)
        self.assertIn(document, self.user.uploaded_documents.all())
    
    def test_document_factory(self):
        """Test DocumentFactory creates valid documents."""
        document = DocumentFactory()
        
        self.assertIsNotNone(document.title)
        self.assertIsNotNone(document.file_path)
        self.assertIsNotNone(document.file_type)
        self.assertIsNotNone(document.uploaded_by)


class ProcessedImageModelTest(TestCase):
    """Test cases for ProcessedImage model."""
    
    def setUp(self):
        """Set up test data."""
        self.original_document = DocumentFactory(file_type='jpg')
        self.processed_image_data = {
            'original_document': self.original_document,
            'processed_path': '/uploads/processed/thumb_image.jpg',
            'processing_type': 'thumbnail',
            'width': 150,
            'height': 150,
            'file_size': 25600,
            'quality': 85,
            'processing_metadata': {
                'algorithm': 'bicubic',
                'compression': 'jpeg',
                'processing_time': 0.5
            }
        }
    
    def test_processed_image_creation(self):
        """Test basic processed image creation."""
        processed_image = ProcessedImage.objects.create(**self.processed_image_data)
        
        self.assertEqual(processed_image.original_document, self.original_document)
        self.assertEqual(processed_image.processing_type, 'thumbnail')
        self.assertEqual(processed_image.width, 150)
        self.assertEqual(processed_image.height, 150)
        self.assertEqual(processed_image.quality, 85)
        self.assertIsNotNone(processed_image.created_at)
    
    def test_processed_image_str_representation(self):
        """Test processed image string representation."""
        processed_image = ProcessedImage.objects.create(**self.processed_image_data)
        expected = f"{processed_image.processing_type} of {processed_image.original_document.title}"
        self.assertEqual(str(processed_image), expected)
    
    def test_processing_type_choices(self):
        """Test processing type choices."""
        valid_types = ['thumbnail', 'resize', 'crop', 'watermark', 'compress']
        
        for proc_type in valid_types:
            processed_data = self.processed_image_data.copy()
            processed_data['processing_type'] = proc_type
            processed_data['processed_path'] = f'/uploads/{proc_type}_image.jpg'
            
            processed_image = ProcessedImage.objects.create(**processed_data)
            self.assertEqual(processed_image.processing_type, proc_type)
    
    def test_dimensions_validation(self):
        """Test image dimensions validation."""
        processed_image = ProcessedImage.objects.create(**self.processed_image_data)
        
        # Test valid dimensions
        self.assertEqual(processed_image.width, 150)
        self.assertEqual(processed_image.height, 150)
        
        # Test updating dimensions
        processed_image.width = 300
        processed_image.height = 200
        processed_image.save()
        
        processed_image.refresh_from_db()
        self.assertEqual(processed_image.width, 300)
        self.assertEqual(processed_image.height, 200)
    
    def test_quality_validation(self):
        """Test quality field validation."""
        # Valid quality values
        for quality in [10, 50, 85, 95, 100]:
            processed_data = self.processed_image_data.copy()
            processed_data['quality'] = quality
            processed_data['processed_path'] = f'/uploads/quality_{quality}.jpg'
            
            processed_image = ProcessedImage.objects.create(**processed_data)
            self.assertEqual(processed_image.quality, quality)


class OCRResultModelTest(TestCase):
    """Test cases for OCRResult model."""
    
    def setUp(self):
        """Set up test data."""
        self.source_document = DocumentFactory(file_type='jpg')
        self.ocr_data = {
            'source_document': self.source_document,
            'extracted_text': 'This is extracted text from the image.',
            'confidence_score': Decimal('0.95'),
            'language_detected': 'en',
            'processing_time': Decimal('2.5'),
            'ocr_metadata': {
                'engine': 'Google Vision API',
                'version': '1.0',
                'bounding_boxes': [
                    {'text': 'This', 'x': 10, 'y': 20, 'width': 30, 'height': 15},
                    {'text': 'is', 'x': 45, 'y': 20, 'width': 15, 'height': 15}
                ]
            }
        }
    
    def test_ocr_result_creation(self):
        """Test basic OCR result creation."""
        ocr_result = OCRResult.objects.create(**self.ocr_data)
        
        self.assertEqual(ocr_result.source_document, self.source_document)
        self.assertEqual(ocr_result.extracted_text, 'This is extracted text from the image.')
        self.assertEqual(ocr_result.confidence_score, Decimal('0.95'))
        self.assertEqual(ocr_result.language_detected, 'en')
        self.assertEqual(ocr_result.processing_time, Decimal('2.5'))
        self.assertIsNotNone(ocr_result.created_at)
    
    def test_ocr_result_str_representation(self):
        """Test OCR result string representation."""
        ocr_result = OCRResult.objects.create(**self.ocr_data)
        expected = f"OCR result for {ocr_result.source_document.title}"
        self.assertEqual(str(ocr_result), expected)
    
    def test_confidence_score_validation(self):
        """Test confidence score validation."""
        # Valid confidence scores (0.0 to 1.0)
        valid_scores = [Decimal('0.0'), Decimal('0.5'), Decimal('0.95'), Decimal('1.0')]
        
        for score in valid_scores:
            ocr_data = self.ocr_data.copy()
            ocr_data['confidence_score'] = score
            ocr_data['extracted_text'] = f'Text with confidence {score}'
            
            ocr_result = OCRResult.objects.create(**ocr_data)
            self.assertEqual(ocr_result.confidence_score, score)
    
    def test_language_detection(self):
        """Test language detection field."""
        languages = ['en', 'es', 'fr', 'de', 'ne', 'hi']
        
        for lang in languages:
            ocr_data = self.ocr_data.copy()
            ocr_data['language_detected'] = lang
            ocr_data['extracted_text'] = f'Text in {lang}'
            
            ocr_result = OCRResult.objects.create(**ocr_data)
            self.assertEqual(ocr_result.language_detected, lang)
    
    def test_ocr_metadata_json_field(self):
        """Test OCR metadata JSON field."""
        ocr_result = OCRResult.objects.create(**self.ocr_data)
        
        self.assertIn('engine', ocr_result.ocr_metadata)
        self.assertIn('bounding_boxes', ocr_result.ocr_metadata)
        self.assertEqual(ocr_result.ocr_metadata['engine'], 'Google Vision API')
        
        # Update metadata
        ocr_result.ocr_metadata['post_processing'] = True
        ocr_result.save()
        
        ocr_result.refresh_from_db()
        self.assertTrue(ocr_result.ocr_metadata['post_processing'])


class PDFTemplateModelTest(TestCase):
    """Test cases for PDFTemplate model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.template_data = {
            'name': 'Certificate Template',
            'description': 'Template for generating certificates',
            'template_type': 'certificate',
            'template_content': {
                'layout': 'portrait',
                'font': 'Arial',
                'font_size': 12,
                'elements': [
                    {'type': 'text', 'content': 'Certificate of Achievement', 'x': 100, 'y': 200},
                    {'type': 'text', 'content': '{{ athlete_name }}', 'x': 100, 'y': 300}
                ]
            },
            'variables': ['athlete_name', 'tournament_name', 'date', 'position'],
            'created_by': self.user,
            'is_active': True
        }
    
    def test_pdf_template_creation(self):
        """Test basic PDF template creation."""
        template = PDFTemplate.objects.create(**self.template_data)
        
        self.assertEqual(template.name, 'Certificate Template')
        self.assertEqual(template.template_type, 'certificate')
        self.assertEqual(template.created_by, self.user)
        self.assertTrue(template.is_active)
        self.assertIsNotNone(template.created_at)
        self.assertIsNotNone(template.updated_at)
    
    def test_pdf_template_str_representation(self):
        """Test PDF template string representation."""
        template = PDFTemplate.objects.create(**self.template_data)
        expected = f"{template.name} ({template.template_type})"
        self.assertEqual(str(template), expected)
    
    def test_template_type_choices(self):
        """Test template type choices."""
        valid_types = ['certificate', 'scoresheet', 'report', 'form', 'letter']
        
        for template_type in valid_types:
            template_data = self.template_data.copy()
            template_data['template_type'] = template_type
            template_data['name'] = f'{template_type.title()} Template'
            
            template = PDFTemplate.objects.create(**template_data)
            self.assertEqual(template.template_type, template_type)
    
    def test_template_content_json_field(self):
        """Test template content JSON field."""
        template = PDFTemplate.objects.create(**self.template_data)
        
        self.assertIn('layout', template.template_content)
        self.assertIn('elements', template.template_content)
        self.assertEqual(template.template_content['layout'], 'portrait')
        
        # Update template content
        template.template_content['background_color'] = '#ffffff'
        template.save()
        
        template.refresh_from_db()
        self.assertEqual(template.template_content['background_color'], '#ffffff')
    
    def test_variables_json_field(self):
        """Test variables JSON field."""
        template = PDFTemplate.objects.create(**self.template_data)
        
        expected_variables = ['athlete_name', 'tournament_name', 'date', 'position']
        self.assertEqual(template.variables, expected_variables)
        
        # Add new variable
        template.variables.append('school_name')
        template.save()
        
        template.refresh_from_db()
        self.assertIn('school_name', template.variables)


class GeneratedPDFModelTest(TestCase):
    """Test cases for GeneratedPDF model."""
    
    def setUp(self):
        """Set up test data."""
        self.template = PDFTemplate.objects.create(
            name='Test Template',
            template_type='certificate',
            template_content={'layout': 'portrait'},
            variables=['name'],
            created_by=UserFactory()
        )
        self.user = UserFactory()
        self.generated_pdf_data = {
            'template': self.template,
            'file_path': '/uploads/generated/certificate_123.pdf',
            'file_size': 512000,
            'generated_by': self.user,
            'generation_data': {
                'athlete_name': 'John Doe',
                'tournament_name': 'Championship 2024',
                'date': '2024-01-15',
                'position': '1st Place'
            },
            'generation_time': Decimal('1.2'),
            'status': 'completed'
        }
    
    def test_generated_pdf_creation(self):
        """Test basic generated PDF creation."""
        generated_pdf = GeneratedPDF.objects.create(**self.generated_pdf_data)
        
        self.assertEqual(generated_pdf.template, self.template)
        self.assertEqual(generated_pdf.generated_by, self.user)
        self.assertEqual(generated_pdf.file_size, 512000)
        self.assertEqual(generated_pdf.status, 'completed')
        self.assertEqual(generated_pdf.generation_time, Decimal('1.2'))
        self.assertIsNotNone(generated_pdf.created_at)
    
    def test_generated_pdf_str_representation(self):
        """Test generated PDF string representation."""
        generated_pdf = GeneratedPDF.objects.create(**self.generated_pdf_data)
        expected = f"Generated PDF from {generated_pdf.template.name}"
        self.assertEqual(str(generated_pdf), expected)
    
    def test_status_choices_validation(self):
        """Test status field validation."""
        valid_statuses = ['pending', 'processing', 'completed', 'failed']
        
        for status in valid_statuses:
            pdf_data = self.generated_pdf_data.copy()
            pdf_data['status'] = status
            pdf_data['file_path'] = f'/uploads/{status}_pdf.pdf'
            
            generated_pdf = GeneratedPDF.objects.create(**pdf_data)
            self.assertEqual(generated_pdf.status, status)
    
    def test_generation_data_json_field(self):
        """Test generation data JSON field."""
        generated_pdf = GeneratedPDF.objects.create(**self.generated_pdf_data)
        
        expected_data = {
            'athlete_name': 'John Doe',
            'tournament_name': 'Championship 2024',
            'date': '2024-01-15',
            'position': '1st Place'
        }
        self.assertEqual(generated_pdf.generation_data, expected_data)
        
        # Update generation data
        generated_pdf.generation_data['school_name'] = 'Test School'
        generated_pdf.save()
        
        generated_pdf.refresh_from_db()
        self.assertIn('school_name', generated_pdf.generation_data)
    
    def test_template_relationship(self):
        """Test generated PDF-template relationship."""
        generated_pdf = GeneratedPDF.objects.create(**self.generated_pdf_data)
        
        self.assertEqual(generated_pdf.template, self.template)
        self.assertIn(generated_pdf, self.template.generated_pdfs.all())
    
    def test_user_relationship(self):
        """Test generated PDF-user relationship."""
        generated_pdf = GeneratedPDF.objects.create(**self.generated_pdf_data)
        
        self.assertEqual(generated_pdf.generated_by, self.user)
        self.assertIn(generated_pdf, self.user.generated_pdfs.all())


@pytest.mark.django_db
class TestDocumentModelsPytest:
    """Pytest-style tests for document models."""
    
    def test_document_file_path_validation(self):
        """Test document file path validation."""
        user = UserFactory()
        
        # Valid file paths
        valid_paths = [
            '/uploads/documents/test.pdf',
            '/uploads/images/photo.jpg',
            '/uploads/forms/application.docx'
        ]
        
        for path in valid_paths:
            document = Document.objects.create(
                title='Test Document',
                file_path=path,
                file_type=path.split('.')[-1],
                file_size=1024,
                uploaded_by=user,
                document_type='other'
            )
            assert document.file_path == path
    
    def test_processed_image_cascade_delete(self):
        """Test processed image deletion when original document is deleted."""
        original_doc = DocumentFactory(file_type='jpg')
        
        processed_image = ProcessedImage.objects.create(
            original_document=original_doc,
            processed_path='/uploads/thumb.jpg',
            processing_type='thumbnail',
            width=150,
            height=150,
            file_size=25600
        )
        
        processed_image_id = processed_image.id
        
        # Delete original document
        original_doc.delete()
        
        # Processed image should be deleted too
        with pytest.raises(ProcessedImage.DoesNotExist):
            ProcessedImage.objects.get(id=processed_image_id)
    
    def test_ocr_result_text_length(self):
        """Test OCR result with very long extracted text."""
        source_doc = DocumentFactory(file_type='jpg')
        
        # Create very long text
        long_text = 'A' * 10000  # 10,000 characters
        
        ocr_result = OCRResult.objects.create(
            source_document=source_doc,
            extracted_text=long_text,
            confidence_score=Decimal('0.85'),
            language_detected='en',
            processing_time=Decimal('5.0')
        )
        
        assert len(ocr_result.extracted_text) == 10000
        assert ocr_result.extracted_text == long_text
    
    def test_pdf_template_variable_validation(self):
        """Test PDF template variable validation."""
        user = UserFactory()
        
        template = PDFTemplate.objects.create(
            name='Test Template',
            template_type='certificate',
            template_content={'layout': 'portrait'},
            variables=['name', 'date', 'school'],
            created_by=user
        )
        
        # Check that all variables are stored correctly
        assert 'name' in template.variables
        assert 'date' in template.variables
        assert 'school' in template.variables
        assert len(template.variables) == 3
    
    def test_generated_pdf_file_size_tracking(self):
        """Test generated PDF file size tracking."""
        template = PDFTemplate.objects.create(
            name='Size Test Template',
            template_type='report',
            template_content={'layout': 'portrait'},
            variables=['content'],
            created_by=UserFactory()
        )
        
        # Create PDFs with different sizes
        sizes = [100000, 500000, 1000000, 2000000]  # 100KB to 2MB
        
        for i, size in enumerate(sizes):
            generated_pdf = GeneratedPDF.objects.create(
                template=template,
                file_path=f'/uploads/size_test_{i}.pdf',
                file_size=size,
                generated_by=UserFactory(),
                generation_data={'content': f'Content {i}'},
                generation_time=Decimal('1.0'),
                status='completed'
            )
            assert generated_pdf.file_size == size