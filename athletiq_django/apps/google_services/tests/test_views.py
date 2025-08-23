import json
from io import BytesIO
from PIL import Image
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, Mock

User = get_user_model()


class GoogleServicesViewsTest(TestCase):
    """Test Google Services API views"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            full_name='Test User'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_translate_text_success(self):
        """Test successful text translation"""
        url = reverse('google_services:translate_text')
        data = {
            'text': 'Hello world',
            'target_language': 'es',
            'source_language': 'en'
        }
        
        with patch('apps.google_services.services.google_service_manager.google_services') as mock_services:
            mock_services.translate.translate_text.return_value = {
                'translated_text': 'Hola mundo',
                'source_language': 'en',
                'target_language': 'es',
                'confidence': 1.0,
                'cached': False
            }
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['translated_text'], 'Hola mundo')
    
    def test_translate_text_invalid_data(self):
        """Test translation with invalid data"""
        url = reverse('google_services:translate_text')
        data = {
            'target_language': 'es'  # Missing required 'text' field
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_translate_batch_success(self):
        """Test successful batch translation"""
        url = reverse('google_services:translate_batch')
        data = {
            'texts': ['Hello', 'World'],
            'target_language': 'es'
        }
        
        with patch('apps.google_services.services.google_service_manager.google_services') as mock_services:
            mock_services.translate.translate_batch.return_value = [
                {'translated_text': 'Hola', 'source_language': 'en', 'target_language': 'es'},
                {'translated_text': 'Mundo', 'source_language': 'en', 'target_language': 'es'}
            ]
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 2)
    
    def test_detect_language_success(self):
        """Test successful language detection"""
        url = reverse('google_services:detect_language')
        data = {'text': 'Hola mundo'}
        
        with patch('apps.google_services.services.google_service_manager.google_services') as mock_services:
            mock_services.translate.detect_language.return_value = {
                'language': 'es',
                'confidence': 0.95
            }
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['language'], 'es')
    
    def test_supported_languages_success(self):
        """Test getting supported languages"""
        url = reverse('google_services:supported_languages')
        
        with patch('apps.google_services.services.google_service_manager.google_services') as mock_services:
            mock_services.translate.get_supported_languages.return_value = [
                {'language': 'en', 'name': 'English'},
                {'language': 'es', 'name': 'Spanish'}
            ]
            
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 2)
    
    def create_test_image(self):
        """Create a test image file"""
        image = Image.new('RGB', (100, 100), color='red')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        return SimpleUploadedFile(
            'test_image.jpg',
            image_io.getvalue(),
            content_type='image/jpeg'
        )
    
    def test_vision_ocr_success(self):
        """Test successful OCR processing"""
        url = reverse('google_services:vision_ocr')
        image_file = self.create_test_image()
        data = {
            'image': image_file,
            'language_hints': ['en']
        }
        
        with patch('apps.google_services.services.google_service_manager.google_services') as mock_services:
            mock_services.vision.extract_text.return_value = {
                'full_text': 'Hello World',
                'confidence': 0.95,
                'language': 'en',
                'blocks': []
            }
            
            response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['full_text'], 'Hello World')
    
    def test_vision_ocr_no_image(self):
        """Test OCR without image file"""
        url = reverse('google_services:vision_ocr')
        data = {'language_hints': ['en']}
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_geocode_address_success(self):
        """Test successful address geocoding"""
        url = reverse('google_services:geocode_address')
        data = {'address': '1600 Amphitheatre Parkway, Mountain View, CA'}
        
        with patch('apps.google_services.services.google_service_manager.google_services') as mock_services:
            mock_services.maps.geocode_address.return_value = {
                'place_id': 'ChIJ2eUgeAK6j4ARbn5u_wAGqWA',
                'formatted_address': '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
                'latitude': 37.4224764,
                'longitude': -122.0842499,
                'cached': False
            }
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['latitude'], 37.4224764)
    
    def test_reverse_geocode_success(self):
        """Test successful reverse geocoding"""
        url = reverse('google_services:reverse_geocode')
        data = {
            'latitude': 37.4224764,
            'longitude': -122.0842499
        }
        
        with patch('apps.google_services.services.google_service_manager.google_services') as mock_services:
            mock_services.maps.reverse_geocode.return_value = {
                'place_id': 'ChIJ2eUgeAK6j4ARbn5u_wAGqWA',
                'formatted_address': '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
                'latitude': 37.4224764,
                'longitude': -122.0842499
            }
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_search_places_success(self):
        """Test successful places search"""
        url = reverse('google_services:search_places')
        data = {
            'query': 'restaurants near me',
            'latitude': 37.4224764,
            'longitude': -122.0842499,
            'radius': 5000
        }
        
        with patch('apps.google_services.services.google_service_manager.google_services') as mock_services:
            mock_services.maps.search_places.return_value = [
                {
                    'place_id': 'restaurant_id',
                    'name': 'Test Restaurant',
                    'formatted_address': '123 Main St',
                    'latitude': 37.4224764,
                    'longitude': -122.0842499,
                    'rating': 4.5
                }
            ]
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 1)
    
    def test_place_details_success(self):
        """Test successful place details lookup"""
        place_id = 'ChIJ2eUgeAK6j4ARbn5u_wAGqWA'
        url = reverse('google_services:place_details', kwargs={'place_id': place_id})
        
        with patch('apps.google_services.services.google_service_manager.google_services') as mock_services:
            mock_services.maps.get_place_details.return_value = {
                'place_id': place_id,
                'name': 'Google',
                'formatted_address': '1600 Amphitheatre Pkwy, Mountain View, CA',
                'latitude': 37.4224764,
                'longitude': -122.0842499
            }
            
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['name'], 'Google')
    
    def test_service_status_success(self):
        """Test service status endpoint"""
        url = reverse('google_services:service_status')
        
        with patch('apps.google_services.services.google_service_manager.google_services') as mock_services:
            mock_services.health_check.return_value = {
                'overall_status': 'healthy',
                'services': {
                    'vision': {'available': True, 'status': 'healthy'},
                    'translate': {'available': True, 'status': 'healthy'},
                    'maps': {'available': True, 'status': 'healthy'}
                }
            }
            
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['overall_status'], 'healthy')
    
    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access endpoints"""
        self.client.force_authenticate(user=None)
        
        url = reverse('google_services:translate_text')
        data = {'text': 'Hello', 'target_language': 'es'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)