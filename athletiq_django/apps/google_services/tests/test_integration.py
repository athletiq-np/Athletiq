from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.google_services.services.google_service_manager import google_services

User = get_user_model()


class GoogleServicesIntegrationTest(TestCase):
    """Integration tests for Google Services"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create(
            email='test@example.com',
            full_name='Test User',
            role='SchoolAdmin'
        )
        self.user.set_password('testpass123')
        self.user.save()
        self.client.force_authenticate(user=self.user)
    
    def test_google_services_manager_initialization(self):
        """Test that Google services manager initializes correctly"""
        # Test that services can be accessed without errors
        vision_service = google_services.vision
        translate_service = google_services.translate
        maps_service = google_services.maps
        
        self.assertIsNotNone(vision_service)
        self.assertIsNotNone(translate_service)
        self.assertIsNotNone(maps_service)
    
    def test_service_status_endpoint(self):
        """Test the service status endpoint"""
        url = reverse('google_services:service_status')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        self.assertIn('overall_status', response.data['data'])
        self.assertIn('services', response.data['data'])
    
    def test_translate_text_endpoint_structure(self):
        """Test translate text endpoint structure (without actual API call)"""
        url = reverse('google_services:translate_text')
        
        # Test with missing data
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with invalid data
        response = self.client.post(url, {'text': ''}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_geocode_endpoint_structure(self):
        """Test geocode endpoint structure (without actual API call)"""
        url = reverse('google_services:geocode_address')
        
        # Test with missing data
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_vision_ocr_endpoint_structure(self):
        """Test Vision OCR endpoint structure (without actual API call)"""
        url = reverse('google_services:vision_ocr')
        
        # Test with missing image
        response = self.client.post(url, {}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access Google services"""
        self.client.force_authenticate(user=None)
        
        endpoints = [
            'google_services:translate_text',
            'google_services:geocode_address',
            'google_services:vision_ocr',
        ]
        
        for endpoint_name in endpoints:
            url = reverse(endpoint_name)
            response = self.client.post(url, {}, format='json')
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)