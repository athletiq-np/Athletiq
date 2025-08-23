from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from PIL import Image
from io import BytesIO

from ..models import Document, OCRResult
from ..services.ocr_service import OCRService, DocumentProcessingService

User = get_user_model()


class OCRServiceTest(TestCase):
    """Test OCR service functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='SuperAdmin'
        )
        
        self.ocr_service = OCRService()
        
        # Create a test image
        image = Image.new('RGB', (200, 100), color='white')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        self.test_image_file = SimpleUploadedFile(
            "test_image.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
        
        self.document = Document.objects.create(
            title='Test Image Document',
            document_type='other',
            file=self.test_image_file,
            uploaded_by=self.user
        )
    
    def test_extract_text_from_document(self):
        """Test OCR text extraction from document"""
        ocr_result = self.ocr_service.extract_text_from_document(self.document)
        
        self.assertIsInstance(ocr_result, OCRResult)
        self.assertEqual(ocr_result.document, self.document)
        self.assertIsNotNone(ocr_result.extracted_text)
        self.assertGreaterEqual(ocr_result.confidence_score, 0.0)
        self.assertLessEqual(ocr_result.confidence_score, 1.0)
        self.assertEqual(ocr_result.language_detected, 'en')
        self.assertGreater(ocr_result.processing_time, 0)
        
        # Check document status was updated
        self.document.refresh_from_db()
        self.assertEqual(self.document.status, 'completed')
    
    def test_extract_text_non_image_document(self):
        """Test OCR extraction fails for non-image documents"""
        # Create a text document
        text_file = SimpleUploadedFile(
            "test.txt",
            b"Test content",
            content_type="text/plain"
        )
        
        text_document = Document.objects.create(
            title='Test Text Document',
            document_type='other',
            file=text_file,
            uploaded_by=self.user
        )
        
        with self.assertRaises(ValueError) as context:
            self.ocr_service.extract_text_from_document(text_document)
        
        self.assertIn("Document must be an image", str(context.exception))
    
    def test_get_ocr_result_existing(self):
        """Test getting existing OCR result"""
        # First extract text
        ocr_result = self.ocr_service.extract_text_from_document(self.document)
        
        # Then get the result
        retrieved_result = self.ocr_service.get_ocr_result(self.document)
        
        self.assertEqual(retrieved_result, ocr_result)
    
    def test_get_ocr_result_non_existing(self):
        """Test getting OCR result when none exists"""
        result = self.ocr_service.get_ocr_result(self.document)
        self.assertIsNone(result)
    
    def test_reprocess_document(self):
        """Test reprocessing a document"""
        # First process
        first_result = self.ocr_service.extract_text_from_document(self.document)
        first_id = first_result.ocr_id
        
        # Reprocess
        second_result = self.ocr_service.reprocess_document(self.document)
        
        # Should be a new result
        self.assertNotEqual(first_id, second_result.ocr_id)
        
        # Old result should be deleted
        with self.assertRaises(OCRResult.DoesNotExist):
            OCRResult.objects.get(ocr_id=first_id)
    
    def test_batch_process_documents(self):
        """Test batch processing multiple documents"""
        # Create additional test documents
        documents = [self.document]
        
        for i in range(2):
            image = Image.new('RGB', (200, 100), color='white')
            image_io = BytesIO()
            image.save(image_io, format='JPEG')
            image_io.seek(0)
            
            image_file = SimpleUploadedFile(
                f"test_image_{i}.jpg",
                image_io.getvalue(),
                content_type="image/jpeg"
            )
            
            doc = Document.objects.create(
                title=f'Test Image {i}',
                document_type='other',
                file=image_file,
                uploaded_by=self.user
            )
            documents.append(doc)
        
        # Process batch
        results = self.ocr_service.batch_process_documents(documents)
        
        self.assertEqual(results['total_processed'], 3)
        self.assertEqual(results['total_errors'], 0)
        self.assertEqual(len(results['results']), 3)
        
        # Check all documents were processed
        for result in results['results']:
            self.assertEqual(result['status'], 'success')
            self.assertIn('ocr_result', result)
    
    def test_batch_process_mixed_documents(self):
        """Test batch processing with mixed document types"""
        # Add a non-image document
        text_file = SimpleUploadedFile(
            "test.txt",
            b"Test content",
            content_type="text/plain"
        )
        
        text_document = Document.objects.create(
            title='Test Text Document',
            document_type='other',
            file=text_file,
            uploaded_by=self.user
        )
        
        documents = [self.document, text_document]
        
        results = self.ocr_service.batch_process_documents(documents)
        
        self.assertEqual(results['total_processed'], 1)  # Only image processed
        self.assertEqual(results['total_errors'], 1)    # Text document failed
        
        # Check error details
        error = results['errors'][0]
        self.assertEqual(error['document_id'], text_document.document_id)
        self.assertIn('not an image', error['error'])
    
    def test_search_documents_by_text(self):
        """Test searching documents by OCR text"""
        # Process document first
        self.ocr_service.extract_text_from_document(self.document)
        
        # Search for text (mock OCR should contain document title)
        results = self.ocr_service.search_documents_by_text('Mock OCR')
        
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].document, self.document)
    
    def test_get_text_statistics(self):
        """Test getting text statistics"""
        # Process document first
        self.ocr_service.extract_text_from_document(self.document)
        
        stats = self.ocr_service.get_text_statistics(self.document)
        
        self.assertIsNotNone(stats)
        self.assertIn('character_count', stats)
        self.assertIn('word_count', stats)
        self.assertIn('line_count', stats)
        self.assertIn('confidence_score', stats)
        self.assertIn('language', stats)
        self.assertIn('processing_time', stats)
        self.assertIn('average_word_length', stats)
        
        # Check values are reasonable
        self.assertGreaterEqual(stats['character_count'], 0)
        self.assertGreaterEqual(stats['word_count'], 0)
        self.assertGreaterEqual(stats['line_count'], 0)
    
    def test_get_text_statistics_no_ocr(self):
        """Test getting statistics when no OCR result exists"""
        stats = self.ocr_service.get_text_statistics(self.document)
        self.assertIsNone(stats)


class DocumentProcessingServiceTest(TestCase):
    """Test document processing service"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='SuperAdmin'
        )
        
        self.processing_service = DocumentProcessingService()
        
        # Create test image
        image = Image.new('RGB', (200, 100), color='white')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        self.test_image_file = SimpleUploadedFile(
            "test_image.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
        
        self.document = Document.objects.create(
            title='Test Image Document',
            document_type='other',
            file=self.test_image_file,
            uploaded_by=self.user
        )
    
    def test_process_uploaded_document_image(self):
        """Test processing an uploaded image document"""
        results = self.processing_service.process_uploaded_document(self.document)
        
        self.assertIn('ocr', results)
        self.assertTrue(results['ocr']['success'])
        self.assertIn('text_length', results['ocr'])
        self.assertIn('confidence', results['ocr'])
        
        # Check document status
        self.document.refresh_from_db()
        self.assertEqual(self.document.status, 'completed')
    
    def test_process_uploaded_document_pdf(self):
        """Test processing a PDF document"""
        # Create a mock PDF
        pdf_file = SimpleUploadedFile(
            "test.pdf",
            b"%PDF-1.4 mock pdf content",
            content_type="application/pdf"
        )
        
        pdf_document = Document.objects.create(
            title='Test PDF Document',
            document_type='other',
            file=pdf_file,
            uploaded_by=self.user
        )
        
        results = self.processing_service.process_uploaded_document(pdf_document)
        
        self.assertIn('pdf', results)
        self.assertTrue(results['pdf']['success'])
        
        # Check document status
        pdf_document.refresh_from_db()
        self.assertEqual(pdf_document.status, 'completed')
    
    def test_validate_document_content_valid(self):
        """Test document validation for valid document"""
        validation = self.processing_service.validate_document_content(self.document)
        
        self.assertTrue(validation['is_valid'])
        self.assertEqual(len(validation['issues']), 0)
    
    def test_validate_document_content_missing_file(self):
        """Test document validation for missing file"""
        # Create document without file
        document = Document.objects.create(
            title='Test Document',
            document_type='other',
            uploaded_by=self.user,
            file_size=0,
            mime_type='application/octet-stream'
        )
        
        validation = self.processing_service.validate_document_content(document)
        
        self.assertFalse(validation['is_valid'])
        self.assertGreater(len(validation['issues']), 0)
        self.assertIn('File does not exist', validation['issues'])
    
    def test_get_processing_status(self):
        """Test getting processing status"""
        # Process document first
        self.processing_service.process_uploaded_document(self.document)
        
        status_info = self.processing_service.get_processing_status(self.document)
        
        self.assertEqual(status_info['document_id'], self.document.document_id)
        self.assertEqual(status_info['status'], 'completed')
        self.assertIn('processing_result', status_info)
        self.assertIn('validation', status_info)
        self.assertIn('ocr', status_info)
        
        # Check OCR info
        self.assertIsNotNone(status_info['ocr'])
        self.assertIn('text_length', status_info['ocr'])
        self.assertIn('confidence', status_info['ocr'])
    
    def test_get_processing_status_no_ocr(self):
        """Test getting status when no OCR has been performed"""
        status_info = self.processing_service.get_processing_status(self.document)
        
        self.assertEqual(status_info['document_id'], self.document.document_id)
        self.assertIsNone(status_info['ocr'])
        self.assertIn('validation', status_info)