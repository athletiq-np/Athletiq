import pytest
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase
from apps.google_services.services.vision_service import VisionService


class VisionServiceTest(TestCase):
    """Test VisionService functionality"""
    
    def setUp(self):
        self.service = VisionService()
    
    @patch('apps.google_services.services.vision_service.HAS_GOOGLE_VISION', True)
    @patch('apps.google_services.services.vision_service.vision')
    def test_vision_service_initialization(self, mock_vision):
        """Test Vision service initialization"""
        mock_client = Mock()
        mock_vision.ImageAnnotatorClient.return_value = mock_client
        
        service = VisionService()
        self.assertIsNotNone(service.client)
    
    @patch('apps.google_services.services.vision_service.HAS_GOOGLE_VISION', False)
    def test_vision_service_unavailable(self):
        """Test Vision service when library is not available"""
        service = VisionService()
        self.assertFalse(service.is_available())
    
    @patch('apps.google_services.services.vision_service.HAS_GOOGLE_VISION', True)
    def test_extract_text_success(self):
        """Test successful text extraction"""
        # Mock the Vision API client
        mock_client = Mock()
        mock_response = Mock()
        mock_response.error.message = ''
        
        # Mock text annotations
        mock_text_annotation = Mock()
        mock_text_annotation.description = 'Hello World'
        
        mock_block_annotation = Mock()
        mock_block_annotation.description = 'Hello'
        mock_block_annotation.bounding_poly.vertices = [
            Mock(x=0, y=0), Mock(x=50, y=0), Mock(x=50, y=20), Mock(x=0, y=20)
        ]
        
        mock_response.text_annotations = [mock_text_annotation, mock_block_annotation]
        mock_client.text_detection.return_value = mock_response
        
        service = VisionService()
        service.client = mock_client
        
        result = service.extract_text(b'fake_image_content', ['en'])
        
        self.assertEqual(result['full_text'], 'Hello World')
        self.assertEqual(result['language'], 'en')
        self.assertGreater(result['confidence'], 0)
        self.assertEqual(len(result['blocks']), 1)
        self.assertEqual(result['metadata']['method'], 'google_vision')
    
    @patch('apps.google_services.services.vision_service.HAS_GOOGLE_VISION', True)
    def test_extract_text_no_results(self):
        """Test text extraction with no results"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.error.message = ''
        mock_response.text_annotations = []
        mock_client.text_detection.return_value = mock_response
        
        service = VisionService()
        service.client = mock_client
        
        result = service.extract_text(b'fake_image_content')
        
        self.assertEqual(result['full_text'], '')
        self.assertEqual(result['confidence'], 0.0)
        self.assertEqual(len(result['blocks']), 0)
    
    @patch('apps.google_services.services.vision_service.HAS_GOOGLE_VISION', True)
    def test_extract_text_api_error(self):
        """Test text extraction with API error"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.error.message = 'API Error'
        mock_client.text_detection.return_value = mock_response
        
        service = VisionService()
        service.client = mock_client
        
        with self.assertRaises(Exception) as context:
            service.extract_text(b'fake_image_content')
        
        self.assertIn('Google Vision API error', str(context.exception))
    
    def test_extract_text_service_unavailable(self):
        """Test text extraction when service is unavailable"""
        service = VisionService()
        service.client = None
        
        with self.assertRaises(Exception) as context:
            service.extract_text(b'fake_image_content')
        
        self.assertIn('Google Vision API is not available', str(context.exception))
    
    @patch('apps.google_services.services.vision_service.HAS_GOOGLE_VISION', True)
    def test_detect_document_properties(self):
        """Test document properties detection"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.error.message = ''
        
        # Mock document structure
        mock_symbol = Mock()
        mock_symbol.property.detected_languages = [
            Mock(language_code='en', confidence=0.95)
        ]
        
        mock_word = Mock()
        mock_word.symbols = [mock_symbol]
        
        mock_paragraph = Mock()
        mock_paragraph.words = [mock_word]
        
        mock_block = Mock()
        mock_block.paragraphs = [mock_paragraph]
        
        mock_page = Mock()
        mock_page.blocks = [mock_block]
        
        mock_document = Mock()
        mock_document.pages = [mock_page]
        
        mock_response.full_text_annotation = mock_document
        mock_client.document_text_detection.return_value = mock_response
        
        service = VisionService()
        service.client = mock_client
        
        result = service.detect_document_properties(b'fake_image_content')
        
        self.assertEqual(len(result['languages']), 1)
        self.assertEqual(result['languages'][0]['language_code'], 'en')
        self.assertEqual(result['languages'][0]['confidence'], 0.95)
        self.assertEqual(result['confidence'], 0.95)
    
    @patch('apps.google_services.services.vision_service.HAS_GOOGLE_VISION', True)
    def test_detect_objects(self):
        """Test object detection"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.error.message = ''
        
        # Mock object annotation
        mock_object = Mock()
        mock_object.name = 'Person'
        mock_object.score = 0.85
        mock_object.bounding_poly.normalized_vertices = [
            Mock(x=0.1, y=0.1), Mock(x=0.9, y=0.1),
            Mock(x=0.9, y=0.9), Mock(x=0.1, y=0.9)
        ]
        
        mock_response.localized_object_annotations = [mock_object]
        mock_client.object_localization.return_value = mock_response
        
        service = VisionService()
        service.client = mock_client
        
        result = service.detect_objects(b'fake_image_content')
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['name'], 'Person')
        self.assertEqual(result[0]['confidence'], 0.85)
        self.assertEqual(len(result[0]['bounding_box']), 4)