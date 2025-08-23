import pytest
from unittest.mock import Mock, patch
from django.test import TestCase
from apps.google_services.services.google_service_manager import GoogleServiceManager


class GoogleServiceManagerTest(TestCase):
    """Test GoogleServiceManager functionality"""
    
    def setUp(self):
        self.manager = GoogleServiceManager()
    
    def test_lazy_loading_vision_service(self):
        """Test lazy loading of Vision service"""
        # First access should create the service
        vision_service1 = self.manager.vision
        self.assertIsNotNone(vision_service1)
        
        # Second access should return the same instance
        vision_service2 = self.manager.vision
        self.assertIs(vision_service1, vision_service2)
    
    def test_lazy_loading_translate_service(self):
        """Test lazy loading of Translate service"""
        translate_service1 = self.manager.translate
        self.assertIsNotNone(translate_service1)
        
        translate_service2 = self.manager.translate
        self.assertIs(translate_service1, translate_service2)
    
    def test_lazy_loading_maps_service(self):
        """Test lazy loading of Maps service"""
        maps_service1 = self.manager.maps
        self.assertIsNotNone(maps_service1)
        
        maps_service2 = self.manager.maps
        self.assertIs(maps_service1, maps_service2)
    
    def test_get_service_status(self):
        """Test getting service availability status"""
        with patch.object(self.manager, 'vision') as mock_vision, \
             patch.object(self.manager, 'translate') as mock_translate, \
             patch.object(self.manager, 'maps') as mock_maps:
            
            mock_vision.is_available.return_value = True
            mock_translate.is_available.return_value = False
            mock_maps.is_available.return_value = True
            
            status = self.manager.get_service_status()
            
            self.assertTrue(status['vision'])
            self.assertFalse(status['translate'])
            self.assertTrue(status['maps'])
    
    def test_health_check_all_healthy(self):
        """Test health check when all services are healthy"""
        with patch.object(self.manager, 'vision') as mock_vision, \
             patch.object(self.manager, 'translate') as mock_translate, \
             patch.object(self.manager, 'maps') as mock_maps:
            
            mock_vision.is_available.return_value = True
            mock_translate.is_available.return_value = True
            mock_maps.is_available.return_value = True
            
            health = self.manager.health_check()
            
            self.assertEqual(health['overall_status'], 'healthy')
            self.assertTrue(health['services']['vision']['available'])
            self.assertTrue(health['services']['translate']['available'])
            self.assertTrue(health['services']['maps']['available'])
            self.assertEqual(health['services']['vision']['status'], 'healthy')
    
    def test_health_check_some_unavailable(self):
        """Test health check when some services are unavailable"""
        with patch.object(self.manager, 'vision') as mock_vision, \
             patch.object(self.manager, 'translate') as mock_translate, \
             patch.object(self.manager, 'maps') as mock_maps:
            
            mock_vision.is_available.return_value = True
            mock_translate.is_available.return_value = False
            mock_maps.is_available.return_value = True
            
            health = self.manager.health_check()
            
            self.assertEqual(health['overall_status'], 'degraded')
            self.assertTrue(health['services']['vision']['available'])
            self.assertFalse(health['services']['translate']['available'])
            self.assertTrue(health['services']['maps']['available'])
    
    def test_health_check_all_unavailable(self):
        """Test health check when all services are unavailable"""
        with patch.object(self.manager, 'vision') as mock_vision, \
             patch.object(self.manager, 'translate') as mock_translate, \
             patch.object(self.manager, 'maps') as mock_maps:
            
            mock_vision.is_available.return_value = False
            mock_translate.is_available.return_value = False
            mock_maps.is_available.return_value = False
            
            health = self.manager.health_check()
            
            self.assertEqual(health['overall_status'], 'unhealthy')
            self.assertFalse(health['services']['vision']['available'])
            self.assertFalse(health['services']['translate']['available'])
            self.assertFalse(health['services']['maps']['available'])
    
    def test_health_check_with_errors(self):
        """Test health check when services raise errors"""
        with patch.object(self.manager, 'vision') as mock_vision, \
             patch.object(self.manager, 'translate') as mock_translate, \
             patch.object(self.manager, 'maps') as mock_maps:
            
            mock_vision.is_available.side_effect = Exception('Vision error')
            mock_translate.is_available.return_value = True
            mock_maps.is_available.return_value = True
            
            health = self.manager.health_check()
            
            self.assertEqual(health['overall_status'], 'degraded')
            self.assertFalse(health['services']['vision']['available'])
            self.assertEqual(health['services']['vision']['status'], 'error')
            self.assertEqual(health['services']['vision']['error'], 'Vision error')
            self.assertTrue(health['services']['translate']['available'])
            self.assertTrue(health['services']['maps']['available'])