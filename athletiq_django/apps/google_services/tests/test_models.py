import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.google_services.models import (
    GoogleServiceUsage, TranslationCache, LocationCache
)

User = get_user_model()


class GoogleServiceUsageModelTest(TestCase):
    """Test GoogleServiceUsage model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            full_name='Test User'
        )
    
    def test_create_service_usage(self):
        """Test creating a service usage record"""
        usage = GoogleServiceUsage.objects.create(
            service_type='vision',
            operation='text_detection',
            request_count=1,
            response_size=1024,
            processing_time=0.5,
            success=True,
            user=self.user
        )
        
        self.assertEqual(usage.service_type, 'vision')
        self.assertEqual(usage.operation, 'text_detection')
        self.assertEqual(usage.request_count, 1)
        self.assertEqual(usage.response_size, 1024)
        self.assertEqual(usage.processing_time, 0.5)
        self.assertTrue(usage.success)
        self.assertEqual(usage.user, self.user)
    
    def test_service_usage_str(self):
        """Test string representation"""
        usage = GoogleServiceUsage.objects.create(
            service_type='translate',
            operation='translate_text',
            success=True
        )
        
        expected = f"translate - translate_text - {usage.created_at}"
        self.assertEqual(str(usage), expected)
    
    def test_service_usage_without_user(self):
        """Test creating usage record without user"""
        usage = GoogleServiceUsage.objects.create(
            service_type='maps',
            operation='geocode',
            success=False,
            error_message='API key invalid'
        )
        
        self.assertIsNone(usage.user)
        self.assertEqual(usage.error_message, 'API key invalid')


class TranslationCacheModelTest(TestCase):
    """Test TranslationCache model"""
    
    def test_create_translation_cache(self):
        """Test creating a translation cache entry"""
        cache_entry = TranslationCache.objects.create(
            source_text='Hello world',
            source_language='en',
            target_language='es',
            translated_text='Hola mundo',
            confidence=0.95
        )
        
        self.assertEqual(cache_entry.source_text, 'Hello world')
        self.assertEqual(cache_entry.source_language, 'en')
        self.assertEqual(cache_entry.target_language, 'es')
        self.assertEqual(cache_entry.translated_text, 'Hola mundo')
        self.assertEqual(cache_entry.confidence, 0.95)
    
    def test_translation_cache_str(self):
        """Test string representation"""
        cache_entry = TranslationCache.objects.create(
            source_text='Hello world',
            source_language='en',
            target_language='es',
            translated_text='Hola mundo'
        )
        
        expected = "en -> es: Hello world"
        self.assertEqual(str(cache_entry), expected)
    
    def test_translation_cache_unique_constraint(self):
        """Test unique constraint on source_text, source_language, target_language"""
        TranslationCache.objects.create(
            source_text='Hello',
            source_language='en',
            target_language='es',
            translated_text='Hola'
        )
        
        # Creating duplicate should raise IntegrityError
        with self.assertRaises(Exception):
            TranslationCache.objects.create(
                source_text='Hello',
                source_language='en',
                target_language='es',
                translated_text='Hola'
            )


class LocationCacheModelTest(TestCase):
    """Test LocationCache model"""
    
    def test_create_location_cache(self):
        """Test creating a location cache entry"""
        location = LocationCache.objects.create(
            query='1600 Amphitheatre Parkway, Mountain View, CA',
            place_id='ChIJ2eUgeAK6j4ARbn5u_wAGqWA',
            formatted_address='1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
            latitude=37.4224764,
            longitude=-122.0842499,
            location_data={'types': ['street_address']}
        )
        
        self.assertEqual(location.query, '1600 Amphitheatre Parkway, Mountain View, CA')
        self.assertEqual(location.place_id, 'ChIJ2eUgeAK6j4ARbn5u_wAGqWA')
        self.assertEqual(float(location.latitude), 37.4224764)
        self.assertEqual(float(location.longitude), -122.0842499)
        self.assertEqual(location.location_data, {'types': ['street_address']})
    
    def test_location_cache_str(self):
        """Test string representation"""
        location = LocationCache.objects.create(
            query='Google HQ',
            place_id='test_place_id',
            formatted_address='1600 Amphitheatre Pkwy, Mountain View, CA',
            latitude=37.4224764,
            longitude=-122.0842499
        )
        
        expected = "Google HQ - 1600 Amphitheatre Pkwy, Mountain View, CA"
        self.assertEqual(str(location), expected)
    
    def test_location_cache_unique_place_id(self):
        """Test unique constraint on place_id"""
        LocationCache.objects.create(
            query='Google HQ',
            place_id='unique_place_id',
            formatted_address='Address 1',
            latitude=37.4224764,
            longitude=-122.0842499
        )
        
        # Creating duplicate place_id should raise IntegrityError
        with self.assertRaises(Exception):
            LocationCache.objects.create(
                query='Different query',
                place_id='unique_place_id',
                formatted_address='Address 2',
                latitude=37.4224764,
                longitude=-122.0842499
            )