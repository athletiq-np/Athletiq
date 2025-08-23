"""
Unit tests for Google services models.
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.google_services.models import GoogleServiceUsage, TranslationCache, LocationCache
from tests.factories import UserFactory, GoogleServiceLogFactory


class GoogleServiceUsageModelTest(TestCase):
    """Test cases for GoogleServiceUsage model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.usage_data = {
            'service_name': 'translate',
            'operation': 'translate_text',
            'user': self.user,
            'request_count': 1,
            'characters_processed': 150,
            'cost': Decimal('0.05'),
            'billing_period': '2024-01',
            'metadata': {
                'source_language': 'en',
                'target_language': 'es',
                'api_version': 'v3'
            }
        }
    
    def test_google_service_usage_creation(self):
        """Test basic Google service usage creation."""
        usage = GoogleServiceUsage.objects.create(**self.usage_data)
        
        self.assertEqual(usage.service_name, 'translate')
        self.assertEqual(usage.operation, 'translate_text')
        self.assertEqual(usage.user, self.user)
        self.assertEqual(usage.request_count, 1)
        self.assertEqual(usage.characters_processed, 150)
        self.assertEqual(usage.cost, Decimal('0.05'))
        self.assertEqual(usage.billing_period, '2024-01')
        self.assertTrue(usage.is_active)
        self.assertIsNotNone(usage.created_at)
        self.assertIsNotNone(usage.updated_at)
    
    def test_google_service_usage_str_representation(self):
        """Test Google service usage string representation."""
        usage = GoogleServiceUsage.objects.create(**self.usage_data)
        expected = f"{usage.service_name}.{usage.operation} - {usage.billing_period}"
        self.assertEqual(str(usage), expected)
    
    def test_service_name_choices_validation(self):
        """Test service name field validation."""
        valid_services = ['translate', 'vision', 'maps', 'speech', 'natural_language']
        
        for service in valid_services:
            usage_data = self.usage_data.copy()
            usage_data['service_name'] = service
            usage_data['operation'] = f'{service}_operation'
            
            usage = GoogleServiceUsage.objects.create(**usage_data)
            self.assertEqual(usage.service_name, service)
    
    def test_cost_calculation(self):
        """Test cost calculation and validation."""
        # Test various cost amounts
        costs = [Decimal('0.01'), Decimal('1.50'), Decimal('10.00'), Decimal('0.00')]
        
        for i, cost in enumerate(costs):
            usage_data = self.usage_data.copy()
            usage_data['cost'] = cost
            usage_data['operation'] = f'operation_{i}'
            
            usage = GoogleServiceUsage.objects.create(**usage_data)
            self.assertEqual(usage.cost, cost)
    
    def test_characters_processed_validation(self):
        """Test characters processed field validation."""
        usage = GoogleServiceUsage.objects.create(**self.usage_data)
        
        # Test valid character counts
        self.assertEqual(usage.characters_processed, 150)
        
        # Test updating character count
        usage.characters_processed = 500
        usage.save()
        
        usage.refresh_from_db()
        self.assertEqual(usage.characters_processed, 500)
    
    def test_billing_period_format(self):
        """Test billing period format validation."""
        valid_periods = ['2024-01', '2024-12', '2023-06']
        
        for i, period in enumerate(valid_periods):
            usage_data = self.usage_data.copy()
            usage_data['billing_period'] = period
            usage_data['operation'] = f'operation_period_{i}'
            
            usage = GoogleServiceUsage.objects.create(**usage_data)
            self.assertEqual(usage.billing_period, period)
    
    def test_metadata_json_field(self):
        """Test metadata JSON field functionality."""
        usage = GoogleServiceUsage.objects.create(**self.usage_data)
        
        expected_metadata = {
            'source_language': 'en',
            'target_language': 'es',
            'api_version': 'v3'
        }
        self.assertEqual(usage.metadata, expected_metadata)
        
        # Update metadata
        usage.metadata['request_id'] = 'req_123456'
        usage.save()
        
        usage.refresh_from_db()
        self.assertEqual(usage.metadata['request_id'], 'req_123456')
    
    def test_user_relationship(self):
        """Test usage-user relationship."""
        usage = GoogleServiceUsage.objects.create(**self.usage_data)
        
        self.assertEqual(usage.user, self.user)
        self.assertIn(usage, self.user.google_service_usage.all())
    
    def test_aggregation_by_service(self):
        """Test usage aggregation by service."""
        # Create multiple usage records for same service
        for i in range(3):
            usage_data = self.usage_data.copy()
            usage_data['operation'] = f'translate_operation_{i}'
            usage_data['request_count'] = i + 1
            usage_data['cost'] = Decimal(str(0.05 * (i + 1)))
            GoogleServiceUsage.objects.create(**usage_data)
        
        # Test aggregation
        translate_usage = GoogleServiceUsage.objects.filter(service_name='translate')
        total_requests = sum(usage.request_count for usage in translate_usage)
        total_cost = sum(usage.cost for usage in translate_usage)
        
        self.assertEqual(total_requests, 6)  # 1 + 2 + 3
        self.assertEqual(total_cost, Decimal('0.30'))  # 0.05 + 0.10 + 0.15


class TranslationCacheModelTest(TestCase):
    """Test cases for TranslationCache model."""
    
    def setUp(self):
        """Set up test data."""
        self.cache_data = {
            'source_text': 'Hello, world!',
            'source_language': 'en',
            'target_language': 'es',
            'translated_text': '¡Hola, mundo!',
            'confidence_score': Decimal('0.95'),
            'cache_key': 'en_es_hello_world_hash123',
            'hit_count': 1,
            'expires_at': timezone.now() + timedelta(days=30)
        }
    
    def test_translation_cache_creation(self):
        """Test basic translation cache creation."""
        cache = TranslationCache.objects.create(**self.cache_data)
        
        self.assertEqual(cache.source_text, 'Hello, world!')
        self.assertEqual(cache.source_language, 'en')
        self.assertEqual(cache.target_language, 'es')
        self.assertEqual(cache.translated_text, '¡Hola, mundo!')
        self.assertEqual(cache.confidence_score, Decimal('0.95'))
        self.assertEqual(cache.hit_count, 1)
        self.assertTrue(cache.is_active)
        self.assertIsNotNone(cache.created_at)
        self.assertIsNotNone(cache.updated_at)
    
    def test_translation_cache_str_representation(self):
        """Test translation cache string representation."""
        cache = TranslationCache.objects.create(**self.cache_data)
        expected = f"{cache.source_language} -> {cache.target_language}: {cache.source_text[:50]}"
        self.assertEqual(str(cache), expected)
    
    def test_unique_cache_key_constraint(self):
        """Test that cache_key must be unique."""
        TranslationCache.objects.create(**self.cache_data)
        
        # Try to create another cache entry with same key
        cache_data_2 = self.cache_data.copy()
        cache_data_2['source_text'] = 'Different text'
        
        with self.assertRaises(IntegrityError):
            TranslationCache.objects.create(**cache_data_2)
    
    def test_language_code_validation(self):
        """Test language code validation."""
        valid_languages = [
            ('en', 'es'), ('fr', 'de'), ('ja', 'ko'), 
            ('zh', 'hi'), ('ar', 'ru'), ('ne', 'en')
        ]
        
        for i, (source, target) in enumerate(valid_languages):
            cache_data = self.cache_data.copy()
            cache_data['source_language'] = source
            cache_data['target_language'] = target
            cache_data['cache_key'] = f'{source}_{target}_test_{i}'
            cache_data['source_text'] = f'Test text {i}'
            cache_data['translated_text'] = f'Translated text {i}'
            
            cache = TranslationCache.objects.create(**cache_data)
            self.assertEqual(cache.source_language, source)
            self.assertEqual(cache.target_language, target)
    
    def test_confidence_score_validation(self):
        """Test confidence score validation."""
        # Valid confidence scores (0.0 to 1.0)
        valid_scores = [Decimal('0.0'), Decimal('0.5'), Decimal('0.85'), Decimal('1.0')]
        
        for i, score in enumerate(valid_scores):
            cache_data = self.cache_data.copy()
            cache_data['confidence_score'] = score
            cache_data['cache_key'] = f'confidence_test_{i}'
            cache_data['source_text'] = f'Test confidence {i}'
            
            cache = TranslationCache.objects.create(**cache_data)
            self.assertEqual(cache.confidence_score, score)
    
    def test_hit_count_tracking(self):
        """Test cache hit count tracking."""
        cache = TranslationCache.objects.create(**self.cache_data)
        
        # Initially 1 hit
        self.assertEqual(cache.hit_count, 1)
        
        # Increment hit count
        cache.hit_count += 1
        cache.save()
        
        cache.refresh_from_db()
        self.assertEqual(cache.hit_count, 2)
    
    def test_cache_expiration(self):
        """Test cache expiration functionality."""
        # Active cache (not expired)
        cache = TranslationCache.objects.create(**self.cache_data)
        self.assertFalse(cache.is_expired())
        
        # Expired cache
        expired_cache_data = self.cache_data.copy()
        expired_cache_data['expires_at'] = timezone.now() - timedelta(days=1)
        expired_cache_data['cache_key'] = 'expired_cache_key'
        expired_cache_data['source_text'] = 'Expired text'
        
        expired_cache = TranslationCache.objects.create(**expired_cache_data)
        self.assertTrue(expired_cache.is_expired())
    
    def test_long_text_handling(self):
        """Test handling of long text translations."""
        long_text = 'A' * 5000  # 5000 characters
        long_translation = 'B' * 5000
        
        cache_data = self.cache_data.copy()
        cache_data['source_text'] = long_text
        cache_data['translated_text'] = long_translation
        cache_data['cache_key'] = 'long_text_cache'
        
        cache = TranslationCache.objects.create(**cache_data)
        
        self.assertEqual(len(cache.source_text), 5000)
        self.assertEqual(len(cache.translated_text), 5000)


class LocationCacheModelTest(TestCase):
    """Test cases for LocationCache model."""
    
    def setUp(self):
        """Set up test data."""
        self.location_data = {
            'query': 'Kathmandu, Nepal',
            'latitude': Decimal('27.7172'),
            'longitude': Decimal('85.3240'),
            'formatted_address': 'Kathmandu, Nepal',
            'place_id': 'ChIJH8Z4bQo65zkRgLvZU4Mz8PM',
            'location_type': 'city',
            'cache_key': 'kathmandu_nepal_hash123',
            'hit_count': 1,
            'expires_at': timezone.now() + timedelta(days=90),
            'metadata': {
                'country': 'Nepal',
                'administrative_area': 'Bagmati Province',
                'postal_code': '44600',
                'accuracy': 'high'
            }
        }
    
    def test_location_cache_creation(self):
        """Test basic location cache creation."""
        location = LocationCache.objects.create(**self.location_data)
        
        self.assertEqual(location.query, 'Kathmandu, Nepal')
        self.assertEqual(location.latitude, Decimal('27.7172'))
        self.assertEqual(location.longitude, Decimal('85.3240'))
        self.assertEqual(location.formatted_address, 'Kathmandu, Nepal')
        self.assertEqual(location.location_type, 'city')
        self.assertEqual(location.hit_count, 1)
        self.assertTrue(location.is_active)
        self.assertIsNotNone(location.created_at)
        self.assertIsNotNone(location.updated_at)
    
    def test_location_cache_str_representation(self):
        """Test location cache string representation."""
        location = LocationCache.objects.create(**self.location_data)
        expected = f"{location.query} -> {location.formatted_address}"
        self.assertEqual(str(location), expected)
    
    def test_unique_cache_key_constraint(self):
        """Test that cache_key must be unique."""
        LocationCache.objects.create(**self.location_data)
        
        # Try to create another location with same cache key
        location_data_2 = self.location_data.copy()
        location_data_2['query'] = 'Different query'
        
        with self.assertRaises(IntegrityError):
            LocationCache.objects.create(**location_data_2)
    
    def test_coordinate_precision(self):
        """Test coordinate precision handling."""
        # Test various coordinate precisions
        coordinates = [
            (Decimal('27.7172'), Decimal('85.3240')),  # 4 decimal places
            (Decimal('27.717234'), Decimal('85.324056')),  # 6 decimal places
            (Decimal('0.0'), Decimal('0.0')),  # Zero coordinates
            (Decimal('-90.0'), Decimal('-180.0')),  # Negative coordinates
        ]
        
        for i, (lat, lng) in enumerate(coordinates):
            location_data = self.location_data.copy()
            location_data['latitude'] = lat
            location_data['longitude'] = lng
            location_data['cache_key'] = f'coord_test_{i}'
            location_data['query'] = f'Test location {i}'
            
            location = LocationCache.objects.create(**location_data)
            self.assertEqual(location.latitude, lat)
            self.assertEqual(location.longitude, lng)
    
    def test_location_type_choices(self):
        """Test location type choices."""
        valid_types = ['city', 'country', 'address', 'landmark', 'business', 'other']
        
        for i, location_type in enumerate(valid_types):
            location_data = self.location_data.copy()
            location_data['location_type'] = location_type
            location_data['cache_key'] = f'type_test_{i}'
            location_data['query'] = f'Test {location_type}'
            
            location = LocationCache.objects.create(**location_data)
            self.assertEqual(location.location_type, location_type)
    
    def test_place_id_validation(self):
        """Test Google Place ID validation."""
        # Valid Place IDs (Google format)
        valid_place_ids = [
            'ChIJH8Z4bQo65zkRgLvZU4Mz8PM',  # Kathmandu
            'ChIJOwg_06VPwokRYv534QaPC8g',  # New York
            'ChIJdd4hrwug2EcRmSrV3Vo6llI',  # London
        ]
        
        for i, place_id in enumerate(valid_place_ids):
            location_data = self.location_data.copy()
            location_data['place_id'] = place_id
            location_data['cache_key'] = f'place_id_test_{i}'
            location_data['query'] = f'Test place {i}'
            
            location = LocationCache.objects.create(**location_data)
            self.assertEqual(location.place_id, place_id)
    
    def test_metadata_json_field(self):
        """Test metadata JSON field functionality."""
        location = LocationCache.objects.create(**self.location_data)
        
        expected_metadata = {
            'country': 'Nepal',
            'administrative_area': 'Bagmati Province',
            'postal_code': '44600',
            'accuracy': 'high'
        }
        self.assertEqual(location.metadata, expected_metadata)
        
        # Update metadata
        location.metadata['timezone'] = 'Asia/Kathmandu'
        location.save()
        
        location.refresh_from_db()
        self.assertEqual(location.metadata['timezone'], 'Asia/Kathmandu')
    
    def test_hit_count_tracking(self):
        """Test location cache hit count tracking."""
        location = LocationCache.objects.create(**self.location_data)
        
        # Initially 1 hit
        self.assertEqual(location.hit_count, 1)
        
        # Increment hit count multiple times
        for i in range(5):
            location.hit_count += 1
            location.save()
        
        location.refresh_from_db()
        self.assertEqual(location.hit_count, 6)
    
    def test_cache_expiration(self):
        """Test location cache expiration."""
        # Active cache (not expired)
        location = LocationCache.objects.create(**self.location_data)
        self.assertFalse(location.is_expired())
        
        # Expired cache
        expired_location_data = self.location_data.copy()
        expired_location_data['expires_at'] = timezone.now() - timedelta(days=1)
        expired_location_data['cache_key'] = 'expired_location'
        expired_location_data['query'] = 'Expired location'
        
        expired_location = LocationCache.objects.create(**expired_location_data)
        self.assertTrue(expired_location.is_expired())


@pytest.mark.django_db
class TestGoogleServicesModelsPytest:
    """Pytest-style tests for Google services models."""
    
    def test_google_service_usage_aggregation(self):
        """Test Google service usage aggregation by user and service."""
        user = UserFactory()
        
        # Create usage records for different services
        services = ['translate', 'vision', 'maps']
        total_cost = Decimal('0.00')
        
        for service in services:
            for i in range(3):  # 3 operations per service
                cost = Decimal(f'{(i + 1) * 0.10:.2f}')
                total_cost += cost
                
                GoogleServiceUsage.objects.create(
                    service_name=service,
                    operation=f'{service}_operation_{i}',
                    user=user,
                    request_count=i + 1,
                    characters_processed=(i + 1) * 100,
                    cost=cost,
                    billing_period='2024-01'
                )
        
        # Test aggregation
        user_usage = GoogleServiceUsage.objects.filter(user=user)
        assert user_usage.count() == 9  # 3 services × 3 operations
        
        # Test cost aggregation
        total_user_cost = sum(usage.cost for usage in user_usage)
        assert total_user_cost == total_cost
        
        # Test service-specific aggregation
        translate_usage = user_usage.filter(service_name='translate')
        assert translate_usage.count() == 3
    
    def test_translation_cache_performance(self):
        """Test translation cache performance with multiple entries."""
        # Create cache entries for different language pairs
        language_pairs = [
            ('en', 'es'), ('en', 'fr'), ('en', 'de'),
            ('es', 'en'), ('fr', 'en'), ('de', 'en')
        ]
        
        cache_entries = []
        for i, (source, target) in enumerate(language_pairs):
            cache = TranslationCache.objects.create(
                source_text=f'Test text {i}',
                source_language=source,
                target_language=target,
                translated_text=f'Translated text {i}',
                confidence_score=Decimal('0.90'),
                cache_key=f'{source}_{target}_test_{i}',
                hit_count=1,
                expires_at=timezone.now() + timedelta(days=30)
            )
            cache_entries.append(cache)
        
        assert len(cache_entries) == 6
        
        # Test querying by language pair
        en_to_es = TranslationCache.objects.filter(
            source_language='en', 
            target_language='es'
        )
        assert en_to_es.count() == 1
        
        # Test querying by source language
        from_english = TranslationCache.objects.filter(source_language='en')
        assert from_english.count() == 3
    
    def test_location_cache_geographic_queries(self):
        """Test location cache with various geographic queries."""
        locations = [
            {
                'query': 'Kathmandu, Nepal',
                'latitude': Decimal('27.7172'),
                'longitude': Decimal('85.3240'),
                'location_type': 'city'
            },
            {
                'query': 'Mount Everest',
                'latitude': Decimal('27.9881'),
                'longitude': Decimal('86.9250'),
                'location_type': 'landmark'
            },
            {
                'query': 'Tribhuvan International Airport',
                'latitude': Decimal('27.6966'),
                'longitude': Decimal('85.3591'),
                'location_type': 'business'
            }
        ]
        
        cache_entries = []
        for i, location_data in enumerate(locations):
            cache = LocationCache.objects.create(
                query=location_data['query'],
                latitude=location_data['latitude'],
                longitude=location_data['longitude'],
                formatted_address=location_data['query'],
                place_id=f'test_place_id_{i}',
                location_type=location_data['location_type'],
                cache_key=f'location_test_{i}',
                hit_count=1,
                expires_at=timezone.now() + timedelta(days=90)
            )
            cache_entries.append(cache)
        
        assert len(cache_entries) == 3
        
        # Test querying by location type
        cities = LocationCache.objects.filter(location_type='city')
        landmarks = LocationCache.objects.filter(location_type='landmark')
        businesses = LocationCache.objects.filter(location_type='business')
        
        assert cities.count() == 1
        assert landmarks.count() == 1
        assert businesses.count() == 1
    
    def test_cache_cleanup_expired_entries(self):
        """Test cleanup of expired cache entries."""
        now = timezone.now()
        
        # Create active and expired cache entries
        active_translation = TranslationCache.objects.create(
            source_text='Active translation',
            source_language='en',
            target_language='es',
            translated_text='Traducción activa',
            confidence_score=Decimal('0.95'),
            cache_key='active_translation',
            hit_count=1,
            expires_at=now + timedelta(days=30)
        )
        
        expired_translation = TranslationCache.objects.create(
            source_text='Expired translation',
            source_language='en',
            target_language='fr',
            translated_text='Traduction expirée',
            confidence_score=Decimal('0.90'),
            cache_key='expired_translation',
            hit_count=1,
            expires_at=now - timedelta(days=1)
        )
        
        active_location = LocationCache.objects.create(
            query='Active location',
            latitude=Decimal('27.7172'),
            longitude=Decimal('85.3240'),
            formatted_address='Active Location Address',
            place_id='active_place_id',
            location_type='city',
            cache_key='active_location',
            hit_count=1,
            expires_at=now + timedelta(days=90)
        )
        
        expired_location = LocationCache.objects.create(
            query='Expired location',
            latitude=Decimal('28.0000'),
            longitude=Decimal('86.0000'),
            formatted_address='Expired Location Address',
            place_id='expired_place_id',
            location_type='city',
            cache_key='expired_location',
            hit_count=1,
            expires_at=now - timedelta(days=1)
        )
        
        # Test expiration status
        assert not active_translation.is_expired()
        assert expired_translation.is_expired()
        assert not active_location.is_expired()
        assert expired_location.is_expired()
        
        # Test filtering expired entries
        expired_translations = TranslationCache.objects.filter(expires_at__lt=now)
        expired_locations = LocationCache.objects.filter(expires_at__lt=now)
        
        assert expired_translations.count() == 1
        assert expired_locations.count() == 1