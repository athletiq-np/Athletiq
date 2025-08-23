import pytest
from unittest.mock import Mock, patch
from django.test import TestCase
from apps.google_services.services.translate_service import TranslateService
from apps.google_services.models import TranslationCache


class TranslateServiceTest(TestCase):
    """Test TranslateService functionality"""
    
    def setUp(self):
        self.service = TranslateService()
    
    @patch('apps.google_services.services.translate_service.HAS_GOOGLE_TRANSLATE', True)
    @patch('apps.google_services.services.translate_service.translate')
    def test_translate_service_initialization(self, mock_translate):
        """Test Translate service initialization"""
        mock_client = Mock()
        mock_translate.Client.return_value = mock_client
        
        service = TranslateService()
        self.assertIsNotNone(service.client)
    
    @patch('apps.google_services.services.translate_service.HAS_GOOGLE_TRANSLATE', False)
    def test_translate_service_unavailable(self):
        """Test Translate service when library is not available"""
        service = TranslateService()
        self.assertFalse(service.is_available())
    
    @patch('apps.google_services.services.translate_service.HAS_GOOGLE_TRANSLATE', True)
    def test_translate_text_success(self):
        """Test successful text translation"""
        mock_client = Mock()
        mock_client.translate.return_value = {
            'translatedText': 'Hola mundo',
            'detectedSourceLanguage': 'en'
        }
        
        service = TranslateService()
        service.client = mock_client
        
        result = service.translate_text('Hello world', 'es', use_cache=False)
        
        self.assertEqual(result['translated_text'], 'Hola mundo')
        self.assertEqual(result['source_language'], 'en')
        self.assertEqual(result['target_language'], 'es')
        self.assertEqual(result['confidence'], 1.0)
        self.assertFalse(result['cached'])
    
    @patch('apps.google_services.services.translate_service.HAS_GOOGLE_TRANSLATE', True)
    def test_translate_text_with_cache(self):
        """Test text translation with caching"""
        # Create cached translation
        TranslationCache.objects.create(
            source_text='Hello world',
            source_language='en',
            target_language='es',
            translated_text='Hola mundo',
            confidence=1.0
        )
        
        service = TranslateService()
        service.client = Mock()  # Should not be called due to cache
        
        result = service.translate_text('Hello world', 'es', source_language='en')
        
        self.assertEqual(result['translated_text'], 'Hola mundo')
        self.assertTrue(result['cached'])
    
    def test_translate_empty_text(self):
        """Test translating empty text"""
        service = TranslateService()
        service.client = Mock()
        
        result = service.translate_text('', 'es')
        
        self.assertEqual(result['translated_text'], '')
        self.assertEqual(result['confidence'], 1.0)
    
    @patch('apps.google_services.services.translate_service.HAS_GOOGLE_TRANSLATE', True)
    def test_translate_batch_success(self):
        """Test successful batch translation"""
        mock_client = Mock()
        mock_client.translate.return_value = [
            {'translatedText': 'Hola', 'detectedSourceLanguage': 'en'},
            {'translatedText': 'mundo', 'detectedSourceLanguage': 'en'}
        ]
        
        service = TranslateService()
        service.client = mock_client
        
        results = service.translate_batch(['Hello', 'world'], 'es', use_cache=False)
        
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['translated_text'], 'Hola')
        self.assertEqual(results[1]['translated_text'], 'mundo')
        self.assertFalse(results[0]['cached'])
        self.assertFalse(results[1]['cached'])
    
    @patch('apps.google_services.services.translate_service.HAS_GOOGLE_TRANSLATE', True)
    def test_translate_batch_with_cache(self):
        """Test batch translation with some cached results"""
        # Create one cached translation
        TranslationCache.objects.create(
            source_text='Hello',
            source_language='auto',
            target_language='es',
            translated_text='Hola',
            confidence=1.0
        )
        
        mock_client = Mock()
        mock_client.translate.return_value = [
            {'translatedText': 'mundo', 'detectedSourceLanguage': 'en'}
        ]
        
        service = TranslateService()
        service.client = mock_client
        
        results = service.translate_batch(['Hello', 'world'], 'es')
        
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['translated_text'], 'Hola')
        self.assertTrue(results[0]['cached'])
        self.assertEqual(results[1]['translated_text'], 'mundo')
        self.assertFalse(results[1]['cached'])
    
    @patch('apps.google_services.services.translate_service.HAS_GOOGLE_TRANSLATE', True)
    def test_detect_language_success(self):
        """Test successful language detection"""
        mock_client = Mock()
        mock_client.detect_language.return_value = {
            'language': 'es',
            'confidence': 0.95
        }
        
        service = TranslateService()
        service.client = mock_client
        
        result = service.detect_language('Hola mundo')
        
        self.assertEqual(result['language'], 'es')
        self.assertEqual(result['confidence'], 0.95)
    
    @patch('apps.google_services.services.translate_service.HAS_GOOGLE_TRANSLATE', True)
    def test_get_supported_languages(self):
        """Test getting supported languages"""
        mock_client = Mock()
        mock_client.get_languages.return_value = [
            {'language': 'en', 'name': 'English'},
            {'language': 'es', 'name': 'Spanish'}
        ]
        
        service = TranslateService()
        service.client = mock_client
        
        languages = service.get_supported_languages()
        
        self.assertEqual(len(languages), 2)
        self.assertEqual(languages[0]['language'], 'en')
        self.assertEqual(languages[0]['name'], 'English')
        self.assertEqual(languages[1]['language'], 'es')
        self.assertEqual(languages[1]['name'], 'Spanish')
    
    def test_translate_text_service_unavailable(self):
        """Test translation when service is unavailable"""
        service = TranslateService()
        service.client = None
        
        with self.assertRaises(Exception) as context:
            service.translate_text('Hello', 'es')
        
        self.assertIn('Google Translate API is not available', str(context.exception))
    
    @patch('apps.google_services.services.translate_service.HAS_GOOGLE_TRANSLATE', True)
    def test_translate_text_api_error(self):
        """Test translation with API error"""
        mock_client = Mock()
        mock_client.translate.side_effect = Exception('API Error')
        
        service = TranslateService()
        service.client = mock_client
        
        with self.assertRaises(Exception) as context:
            service.translate_text('Hello', 'es', use_cache=False)
        
        self.assertIn('Translation failed', str(context.exception))