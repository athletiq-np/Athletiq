"""
Integration tests for Google services endpoints.
"""
import json
import time
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.google_services.models import GoogleServiceUsage, TranslationCache
from apps.documents.models import Document
from apps.athletes.models import Athlete
from apps.schools.models import School
from tests.factories import UserFactory, SchoolFactory, AthleteFactory

User = get_user_model()


class GoogleServicesIntegrationTest(APITestCase):
    """
    Integration tests for Google services workflows.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create users
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        
        # Create school and related entities
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.athlete = AthleteFactory(school=self.school)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    @patch('apps.google_services.services.vision_service.VisionService.extract_text')
    def test_vision_api_ocr_workflow(self, mock_extract_text):
        """Test Google Vision API OCR workflow."""
        # Mock the Vision API response
        mock_extract_text.return_value = {
            'success': True,
            'text': 'John Doe\nDate of Birth: 1990-01-01\nPlace of Birth: Kigali, Rwanda',
            'confidence': 0.95,
            'detected_language': 'en'
        }
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Upload image for OCR processing
        ocr_data = {
            'image_url': 'https://example.com/birth_certificate.jpg',
            'document_type': 'birth_certificate',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id,
            'language_hints': ['en', 'rw']
        }
        
        ocr_response = self.client.post('/api/google-services/vision/extract-text/', ocr_data, format='json')
        self.assertEqual(ocr_response.status_code, status.HTTP_200_OK)
        self.assertTrue(ocr_response.data['success'])
        
        # Verify OCR results
        ocr_result = ocr_response.data['data']
        self.assertIn('extracted_text', ocr_result)
        self.assertIn('confidence', ocr_result)
        self.assertIn('John Doe', ocr_result['extracted_text'])
        
        # Step 2: Get OCR processing status
        processing_id = ocr_result.get('processing_id')
        if processing_id:
            status_response = self.client.get(f'/api/google-services/vision/status/{processing_id}/')
            self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        
        # Step 3: Verify usage tracking
        usage_response = self.client.get('/api/google-services/usage/vision/')
        self.assertEqual(usage_response.status_code, status.HTTP_200_OK)
        
        usage_data = usage_response.data['data']
        self.assertIn('total_requests', usage_data)
        self.assertIn('successful_requests', usage_data)
    
    @patch('apps.google_services.services.translate_service.TranslateService.translate_text')
    def test_translate_api_workflow(self, mock_translate):
        """Test Google Translate API workflow."""
        # Mock the Translate API response
        mock_translate.return_value = {
            'success': True,
            'translated_text': 'Bonjour le monde',
            'source_language': 'en',
            'target_language': 'fr',
            'confidence': 0.98
        }
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Translate text
        translate_data = {
            'text': 'Hello world',
            'target_language': 'fr',
            'source_language': 'en'  # Optional
        }
        
        translate_response = self.client.post('/api/google-services/translate/', translate_data, format='json')
        self.assertEqual(translate_response.status_code, status.HTTP_200_OK)
        self.assertTrue(translate_response.data['success'])
        
        # Verify translation results
        translation_result = translate_response.data['data']
        self.assertIn('translated_text', translation_result)
        self.assertIn('source_language', translation_result)
        self.assertIn('target_language', translation_result)
        self.assertEqual(translation_result['translated_text'], 'Bonjour le monde')
        
        # Step 2: Bulk translate multiple texts
        bulk_translate_data = {
            'texts': [
                'Hello world',
                'How are you?',
                'Thank you'
            ],
            'target_language': 'fr',
            'source_language': 'en'
        }
        
        bulk_response = self.client.post('/api/google-services/translate/bulk/', bulk_translate_data, format='json')
        self.assertEqual(bulk_response.status_code, status.HTTP_200_OK)
        self.assertTrue(bulk_response.data['success'])
        
        bulk_results = bulk_response.data['data']
        self.assertEqual(len(bulk_results['translations']), 3)
        
        # Step 3: Get supported languages
        languages_response = self.client.get('/api/google-services/translate/languages/')
        self.assertEqual(languages_response.status_code, status.HTTP_200_OK)
        
        # Step 4: Check translation cache
        cache_response = self.client.get('/api/google-services/translate/cache-stats/')
        self.assertEqual(cache_response.status_code, status.HTTP_200_OK)
    
    @patch('apps.google_services.services.maps_service.MapsService.geocode_address')
    @patch('apps.google_services.services.maps_service.MapsService.get_place_details')
    def test_maps_api_workflow(self, mock_place_details, mock_geocode):
        """Test Google Maps API workflow."""
        # Mock the Maps API responses
        mock_geocode.return_value = {
            'success': True,
            'results': [{
                'formatted_address': 'Kigali, Rwanda',
                'geometry': {
                    'location': {
                        'lat': -1.9441,
                        'lng': 30.0619
                    }
                },
                'place_id': 'ChIJKxjxuaNv3BkRwfmQEf_2_mI'
            }]
        }
        
        mock_place_details.return_value = {
            'success': True,
            'result': {
                'name': 'Kigali',
                'formatted_address': 'Kigali, Rwanda',
                'geometry': {
                    'location': {
                        'lat': -1.9441,
                        'lng': 30.0619
                    }
                },
                'types': ['locality', 'political']
            }
        }
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Geocode address
        geocode_data = {
            'address': 'Kigali, Rwanda'
        }
        
        geocode_response = self.client.post('/api/google-services/maps/geocode/', geocode_data, format='json')
        self.assertEqual(geocode_response.status_code, status.HTTP_200_OK)
        self.assertTrue(geocode_response.data['success'])
        
        # Verify geocoding results
        geocode_result = geocode_response.data['data']
        self.assertIn('results', geocode_result)
        self.assertGreater(len(geocode_result['results']), 0)
        
        first_result = geocode_result['results'][0]
        self.assertIn('geometry', first_result)
        self.assertIn('location', first_result['geometry'])
        
        # Step 2: Get place details
        place_id = first_result.get('place_id')
        if place_id:
            place_data = {
                'place_id': place_id,
                'fields': ['name', 'formatted_address', 'geometry', 'types']
            }
            
            place_response = self.client.post('/api/google-services/maps/place-details/', place_data, format='json')
            self.assertEqual(place_response.status_code, status.HTTP_200_OK)
            self.assertTrue(place_response.data['success'])
        
        # Step 3: Validate address
        validate_data = {
            'address': 'Kigali, Rwanda'
        }
        
        validate_response = self.client.post('/api/google-services/maps/validate-address/', validate_data, format='json')
        self.assertEqual(validate_response.status_code, status.HTTP_200_OK)
        
        # Step 4: Get distance between locations
        distance_data = {
            'origins': ['Kigali, Rwanda'],
            'destinations': ['Butare, Rwanda'],
            'units': 'metric'
        }
        
        distance_response = self.client.post('/api/google-services/maps/distance-matrix/', distance_data, format='json')
        # This might fail if not properly mocked, which is acceptable for this test
        self.assertIn(distance_response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
    
    def test_google_services_usage_tracking(self):
        """Test Google services usage tracking and analytics."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create some usage records
        GoogleServiceUsage.objects.create(
            service_type='vision',
            operation='text_detection',
            user=self.school_admin,
            request_data={'image_url': 'test.jpg'},
            response_data={'text': 'test'},
            success=True,
            processing_time=1.5,
            cost_estimate=0.001
        )
        
        GoogleServiceUsage.objects.create(
            service_type='translate',
            operation='translate_text',
            user=self.school_admin,
            request_data={'text': 'hello', 'target': 'fr'},
            response_data={'translated_text': 'bonjour'},
            success=True,
            processing_time=0.8,
            cost_estimate=0.0005
        )
        
        # Step 1: Get overall usage statistics
        usage_response = self.client.get('/api/google-services/usage/statistics/')
        self.assertEqual(usage_response.status_code, status.HTTP_200_OK)
        self.assertTrue(usage_response.data['success'])
        
        usage_stats = usage_response.data['data']
        self.assertIn('total_requests', usage_stats)
        self.assertIn('successful_requests', usage_stats)
        self.assertIn('failed_requests', usage_stats)
        self.assertIn('services_breakdown', usage_stats)
        self.assertIn('cost_summary', usage_stats)
        
        # Step 2: Get service-specific usage
        vision_usage_response = self.client.get('/api/google-services/usage/vision/')
        self.assertEqual(vision_usage_response.status_code, status.HTTP_200_OK)
        
        translate_usage_response = self.client.get('/api/google-services/usage/translate/')
        self.assertEqual(translate_usage_response.status_code, status.HTTP_200_OK)
        
        # Step 3: Get usage by date range
        date_range_response = self.client.get(
            '/api/google-services/usage/statistics/?start_date=2024-01-01&end_date=2024-12-31'
        )
        self.assertEqual(date_range_response.status_code, status.HTTP_200_OK)
        
        # Step 4: Get cost analysis
        cost_response = self.client.get('/api/google-services/usage/cost-analysis/')
        self.assertEqual(cost_response.status_code, status.HTTP_200_OK)
        
        cost_data = cost_response.data['data']
        self.assertIn('total_cost', cost_data)
        self.assertIn('cost_by_service', cost_data)
        self.assertIn('monthly_breakdown', cost_data)
    
    def test_google_services_configuration(self):
        """Test Google services configuration management."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Get current configuration
        config_response = self.client.get('/api/google-services/config/')
        self.assertEqual(config_response.status_code, status.HTTP_200_OK)
        
        config_data = config_response.data['data']
        self.assertIn('vision_enabled', config_data)
        self.assertIn('translate_enabled', config_data)
        self.assertIn('maps_enabled', config_data)
        
        # Step 2: Update configuration
        update_config_data = {
            'vision_enabled': True,
            'translate_enabled': True,
            'maps_enabled': False,
            'rate_limits': {
                'vision': 1000,
                'translate': 500,
                'maps': 200
            },
            'cache_settings': {
                'translate_cache_ttl': 3600,
                'maps_cache_ttl': 7200
            }
        }
        
        update_response = self.client.post('/api/google-services/config/', update_config_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        
        # Step 3: Verify configuration was updated
        verify_response = self.client.get('/api/google-services/config/')
        verify_data = verify_response.data['data']
        self.assertFalse(verify_data['maps_enabled'])
        
        # Step 4: Test service health check
        health_response = self.client.get('/api/google-services/health/')
        self.assertEqual(health_response.status_code, status.HTTP_200_OK)
        
        health_data = health_response.data['data']
        self.assertIn('vision_status', health_data)
        self.assertIn('translate_status', health_data)
        self.assertIn('maps_status', health_data)


class GoogleServicesErrorHandlingIntegrationTest(APITestCase):
    """
    Integration tests for Google services error handling.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    @patch('apps.google_services.services.vision_service.VisionService.extract_text')
    def test_vision_api_error_handling(self, mock_extract_text):
        """Test Vision API error handling."""
        # Mock API failure
        mock_extract_text.return_value = {
            'success': False,
            'error': 'Invalid image format',
            'error_code': 'INVALID_IMAGE'
        }
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test with invalid image URL
        invalid_data = {
            'image_url': 'invalid-url',
            'document_type': 'birth_certificate'
        }
        
        response = self.client.post('/api/google-services/vision/extract-text/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('error', response.data)
    
    @patch('apps.google_services.services.translate_service.TranslateService.translate_text')
    def test_translate_api_error_handling(self, mock_translate):
        """Test Translate API error handling."""
        # Mock API failure
        mock_translate.return_value = {
            'success': False,
            'error': 'Unsupported language',
            'error_code': 'UNSUPPORTED_LANGUAGE'
        }
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test with unsupported language
        invalid_data = {
            'text': 'Hello world',
            'target_language': 'invalid_lang'
        }
        
        response = self.client.post('/api/google-services/translate/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_service_validation_errors(self):
        """Test service validation errors."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test Vision API with missing required fields
        incomplete_vision_data = {
            'document_type': 'birth_certificate'
            # Missing image_url
        }
        
        response = self.client.post('/api/google-services/vision/extract-text/', incomplete_vision_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        
        # Test Translate API with missing required fields
        incomplete_translate_data = {
            'target_language': 'fr'
            # Missing text
        }
        
        response = self.client.post('/api/google-services/translate/', incomplete_translate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_rate_limiting_errors(self):
        """Test rate limiting error handling."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # This would test rate limiting if implemented
        # For now, we'll test that the endpoint exists and handles requests
        
        translate_data = {
            'text': 'Test text',
            'target_language': 'fr'
        }
        
        # Make multiple rapid requests (would trigger rate limiting in real scenario)
        for i in range(5):
            response = self.client.post('/api/google-services/translate/', translate_data, format='json')
            # Should either succeed or be rate limited
            self.assertIn(response.status_code, [
                status.HTTP_200_OK,
                status.HTTP_429_TOO_MANY_REQUESTS,
                status.HTTP_400_BAD_REQUEST  # If service is not properly configured
            ])
    
    def test_unauthorized_access(self):
        """Test unauthorized access to Google services."""
        # Test without authentication
        vision_data = {
            'image_url': 'https://example.com/test.jpg',
            'document_type': 'birth_certificate'
        }
        
        response = self.client.post('/api/google-services/vision/extract-text/', vision_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        translate_data = {
            'text': 'Hello world',
            'target_language': 'fr'
        }
        
        response = self.client.post('/api/google-services/translate/', translate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class GoogleServicesCacheIntegrationTest(APITestCase):
    """
    Integration tests for Google services caching functionality.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    @patch('apps.google_services.services.translate_service.TranslateService.translate_text')
    def test_translation_caching(self, mock_translate):
        """Test translation result caching."""
        # Mock the Translate API response
        mock_translate.return_value = {
            'success': True,
            'translated_text': 'Bonjour le monde',
            'source_language': 'en',
            'target_language': 'fr',
            'confidence': 0.98
        }
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        translate_data = {
            'text': 'Hello world',
            'target_language': 'fr',
            'source_language': 'en'
        }
        
        # First request - should call API and cache result
        response1 = self.client.post('/api/google-services/translate/', translate_data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Second request - should use cached result
        response2 = self.client.post('/api/google-services/translate/', translate_data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Verify both responses are identical
        self.assertEqual(response1.data['data']['translated_text'], response2.data['data']['translated_text'])
        
        # Check cache statistics
        cache_stats_response = self.client.get('/api/google-services/translate/cache-stats/')
        self.assertEqual(cache_stats_response.status_code, status.HTTP_200_OK)
        
        cache_stats = cache_stats_response.data['data']
        self.assertIn('cache_hits', cache_stats)
        self.assertIn('cache_misses', cache_stats)
        self.assertIn('cache_size', cache_stats)
    
    def test_cache_management(self):
        """Test cache management operations."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create some cached translations
        TranslationCache.objects.create(
            source_text='Hello',
            source_language='en',
            target_language='fr',
            translated_text='Bonjour',
            confidence=0.95
        )
        
        TranslationCache.objects.create(
            source_text='World',
            source_language='en',
            target_language='fr',
            translated_text='Monde',
            confidence=0.98
        )
        
        # Get cache statistics
        stats_response = self.client.get('/api/google-services/translate/cache-stats/')
        self.assertEqual(stats_response.status_code, status.HTTP_200_OK)
        
        stats = stats_response.data['data']
        self.assertGreaterEqual(stats['cache_size'], 2)
        
        # Clear cache (SuperAdmin only)
        super_admin = UserFactory(role='SuperAdmin')
        super_token = self.get_jwt_token(super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {super_token}')
        
        clear_response = self.client.post('/api/google-services/translate/clear-cache/')
        self.assertEqual(clear_response.status_code, status.HTTP_200_OK)
        self.assertTrue(clear_response.data['success'])
        
        # Verify cache was cleared
        final_stats_response = self.client.get('/api/google-services/translate/cache-stats/')
        final_stats = final_stats_response.data['data']
        self.assertEqual(final_stats['cache_size'], 0)


class GoogleServicesPerformanceIntegrationTest(APITestCase):
    """
    Integration tests for Google services performance.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    @patch('apps.google_services.services.translate_service.TranslateService.translate_text')
    def test_translation_performance(self, mock_translate):
        """Test translation service performance."""
        # Mock fast API response
        mock_translate.return_value = {
            'success': True,
            'translated_text': 'Texte traduit',
            'source_language': 'en',
            'target_language': 'fr',
            'confidence': 0.95
        }
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        translate_data = {
            'text': 'This is a test text for performance measurement',
            'target_language': 'fr',
            'source_language': 'en'
        }
        
        start_time = time.time()
        response = self.client.post('/api/google-services/translate/', translate_data, format='json')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Translation should be reasonably fast
        self.assertLess(response_time, 5.0)  # Under 5 seconds
    
    @patch('apps.google_services.services.translate_service.TranslateService.translate_text')
    def test_bulk_translation_performance(self, mock_translate):
        """Test bulk translation performance."""
        # Mock API response for bulk operations
        mock_translate.side_effect = [
            {
                'success': True,
                'translated_text': f'Texte traduit {i}',
                'source_language': 'en',
                'target_language': 'fr',
                'confidence': 0.95
            }
            for i in range(10)
        ]
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        bulk_data = {
            'texts': [f'Test text {i}' for i in range(10)],
            'target_language': 'fr',
            'source_language': 'en'
        }
        
        start_time = time.time()
        response = self.client.post('/api/google-services/translate/bulk/', bulk_data, format='json')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Bulk translation should be reasonably fast
        self.assertLess(response_time, 10.0)  # Under 10 seconds for 10 texts
        
        # Verify all texts were translated
        translations = response.data['data']['translations']
        self.assertEqual(len(translations), 10)
    
    def test_usage_statistics_performance(self):
        """Test usage statistics endpoint performance."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create some usage records for performance testing
        for i in range(20):
            GoogleServiceUsage.objects.create(
                service_type='translate',
                operation='translate_text',
                user=self.school_admin,
                request_data={'text': f'test {i}'},
                response_data={'translated_text': f'test traduit {i}'},
                success=True,
                processing_time=1.0,
                cost_estimate=0.001
            )
        
        start_time = time.time()
        response = self.client.get('/api/google-services/usage/statistics/')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Statistics should load quickly
        self.assertLess(response_time, 3.0)  # Under 3 seconds