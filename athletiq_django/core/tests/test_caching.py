"""
Tests for caching system.
"""
import time
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.core.cache import cache
from django.http import JsonResponse
from django.test import RequestFactory

from core.cache.decorators import (
    cache_result, cache_page_custom, invalidate_cache,
    cache_unless_authenticated, cache_per_user
)
from core.cache.managers import CacheManager, QueryCacheManager
from core.cache.utils import (
    get_cache_key, clear_pattern_cache, cache_model_instance,
    get_cached_model_instance, cache_api_response
)


class CacheDecoratorsTest(TestCase):
    """Test cases for cache decorators."""
    
    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()
    
    def test_cache_result_decorator(self):
        """Test cache_result decorator functionality."""
        call_count = 0
        
        @cache_result(timeout=60)
        def expensive_function(x, y):
            nonlocal call_count
            call_count += 1
            return x + y
        
        # First call should execute function
        result1 = expensive_function(1, 2)
        self.assertEqual(result1, 3)
        self.assertEqual(call_count, 1)
        
        # Second call should use cache
        result2 = expensive_function(1, 2)
        self.assertEqual(result2, 3)
        self.assertEqual(call_count, 1)  # Should not increment
        
        # Different arguments should execute function again
        result3 = expensive_function(2, 3)
        self.assertEqual(result3, 5)
        self.assertEqual(call_count, 2)
    
    def test_cache_result_with_vary_on(self):
        """Test cache_result with vary_on parameter."""
        call_count = 0
        
        @cache_result(timeout=60, vary_on=['x'])
        def function_with_vary_on(x, y, z=None):
            nonlocal call_count
            call_count += 1
            return x + y + (z or 0)
        
        # First call
        result1 = function_with_vary_on(1, 2, z=3)
        self.assertEqual(result1, 6)
        self.assertEqual(call_count, 1)
        
        # Same x, different y and z - should use cache
        result2 = function_with_vary_on(1, 5, z=10)
        self.assertEqual(result2, 6)  # Cached result
        self.assertEqual(call_count, 1)
        
        # Different x - should execute function
        result3 = function_with_vary_on(2, 2, z=3)
        self.assertEqual(result3, 7)
        self.assertEqual(call_count, 2)
    
    def test_cache_page_custom_decorator(self):
        """Test cache_page_custom decorator."""
        call_count = 0
        
        @cache_page_custom(timeout=60)
        def test_view(request):
            nonlocal call_count
            call_count += 1
            return JsonResponse({'count': call_count})
        
        request1 = self.factory.get('/test/')
        request1.user = MagicMock()
        request1.user.is_authenticated = False
        
        # First call should execute view
        response1 = test_view(request1)
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(call_count, 1)
        
        # Second call should use cache
        response2 = test_view(request1)
        self.assertEqual(response2.status_code, 200)
        self.assertEqual(call_count, 1)  # Should not increment
        self.assertEqual(response2['X-Cache'], 'HIT')
    
    def test_cache_unless_authenticated(self):
        """Test cache_unless_authenticated decorator."""
        call_count = 0
        
        @cache_unless_authenticated(timeout=60)
        def auth_sensitive_view(request):
            nonlocal call_count
            call_count += 1
            return JsonResponse({'count': call_count})
        
        # Anonymous user - should cache
        anon_request = self.factory.get('/test/')
        anon_request.user = MagicMock()
        anon_request.user.is_authenticated = False
        
        response1 = auth_sensitive_view(anon_request)
        response2 = auth_sensitive_view(anon_request)
        self.assertEqual(call_count, 1)  # Should use cache
        
        # Authenticated user - should not cache
        auth_request = self.factory.get('/test/')
        auth_request.user = MagicMock()
        auth_request.user.is_authenticated = True
        
        response3 = auth_sensitive_view(auth_request)
        response4 = auth_sensitive_view(auth_request)
        self.assertEqual(call_count, 3)  # Should execute twice
    
    def test_invalidate_cache_decorator(self):
        """Test invalidate_cache decorator."""
        # Set up cached data
        cache.set('test_key_1', 'value1', 300)
        cache.set('test_key_2', 'value2', 300)
        
        @invalidate_cache(keys=['test_key_1', 'test_key_2'])
        def invalidating_function():
            return 'done'
        
        # Verify cache exists
        self.assertEqual(cache.get('test_key_1'), 'value1')
        self.assertEqual(cache.get('test_key_2'), 'value2')
        
        # Execute function
        result = invalidating_function()
        self.assertEqual(result, 'done')
        
        # Verify cache was invalidated
        self.assertIsNone(cache.get('test_key_1'))
        self.assertIsNone(cache.get('test_key_2'))


class CacheManagerTest(TestCase):
    """Test cases for CacheManager."""
    
    def setUp(self):
        self.cache_manager = CacheManager()
        cache.clear()
    
    def test_cache_manager_basic_operations(self):
        """Test basic cache manager operations."""
        # Test set and get
        result = self.cache_manager.set('test_key', 'test_value', 300)
        self.assertTrue(result)
        
        value = self.cache_manager.get('test_key')
        self.assertEqual(value, 'test_value')
        
        # Test delete
        result = self.cache_manager.delete('test_key')
        self.assertTrue(result)
        
        value = self.cache_manager.get('test_key')
        self.assertIsNone(value)
    
    def test_cache_manager_statistics(self):
        """Test cache manager statistics tracking."""
        # Reset stats
        self.cache_manager.reset_stats()
        
        # Perform operations
        self.cache_manager.set('key1', 'value1')
        self.cache_manager.get('key1')  # Hit
        self.cache_manager.get('key2')  # Miss
        self.cache_manager.delete('key1')
        
        stats = self.cache_manager.get_stats()
        
        self.assertEqual(stats['stats']['sets'], 1)
        self.assertEqual(stats['stats']['hits'], 1)
        self.assertEqual(stats['stats']['misses'], 1)
        self.assertEqual(stats['stats']['deletes'], 1)
        self.assertEqual(stats['hit_rate'], 50.0)  # 1 hit out of 2 gets
    
    def test_cache_manager_batch_operations(self):
        """Test cache manager batch operations."""
        data = {
            'key1': 'value1',
            'key2': 'value2',
            'key3': 'value3'
        }
        
        # Test set_many
        failed_keys = self.cache_manager.set_many(data, 300)
        self.assertEqual(len(failed_keys), 0)
        
        # Test get_many
        result = self.cache_manager.get_many(['key1', 'key2', 'key3'])
        self.assertEqual(len(result), 3)
        self.assertEqual(result['key1'], 'value1')
        
        # Test delete_many
        self.cache_manager.delete_many(['key1', 'key2'])
        
        remaining = self.cache_manager.get_many(['key1', 'key2', 'key3'])
        self.assertEqual(len(remaining), 1)  # Only key3 should remain
        self.assertIn('key3', remaining)


class CacheUtilsTest(TestCase):
    """Test cases for cache utilities."""
    
    def setUp(self):
        cache.clear()
    
    def test_get_cache_key(self):
        """Test cache key generation."""
        # Basic key generation
        key1 = get_cache_key('arg1', 'arg2', prefix='test')
        key2 = get_cache_key('arg1', 'arg2', prefix='test')
        self.assertEqual(key1, key2)  # Should be consistent
        
        # Different arguments should generate different keys
        key3 = get_cache_key('arg1', 'arg3', prefix='test')
        self.assertNotEqual(key1, key3)
        
        # With keyword arguments
        key4 = get_cache_key(prefix='test', param1='value1', param2='value2')
        key5 = get_cache_key(prefix='test', param2='value2', param1='value1')
        self.assertEqual(key4, key5)  # Order shouldn't matter
    
    def test_cache_model_instance(self):
        """Test model instance caching."""
        # Create a mock model instance
        mock_instance = MagicMock()
        mock_instance.__class__.__name__ = 'TestModel'
        mock_instance.pk = 123
        mock_instance._meta.fields = []
        
        # Cache the instance
        cache_key = cache_model_instance(mock_instance, 300)
        
        # Verify it was cached
        cached_data = cache.get(cache_key)
        self.assertIsNotNone(cached_data)
        self.assertEqual(cached_data['model'], 'TestModel')
        self.assertEqual(cached_data['pk'], 123)
    
    def test_cache_api_response(self):
        """Test API response caching."""
        response_data = {'status': 'success', 'data': [1, 2, 3]}
        params = {'page': 1, 'limit': 10}
        
        # Cache the response
        cache_key = cache_api_response('test_view', params, response_data, 300)
        
        # Retrieve cached response
        cached_response = get_cached_api_response('test_view', params)
        self.assertEqual(cached_response, response_data)
        
        # Different params should not match
        cached_response2 = get_cached_api_response('test_view', {'page': 2})
        self.assertIsNone(cached_response2)
    
    @patch('core.cache.utils.get_redis_connection')
    def test_clear_pattern_cache(self, mock_get_redis):
        """Test pattern-based cache clearing."""
        mock_redis = MagicMock()
        mock_redis.keys.return_value = ['pattern:key1', 'pattern:key2']
        mock_get_redis.return_value = mock_redis
        
        # Clear pattern
        cleared_count = clear_pattern_cache('pattern:*')
        
        # Verify Redis methods were called
        mock_redis.keys.assert_called_once_with('pattern:*')
        mock_redis.delete.assert_called_once_with('pattern:key1', 'pattern:key2')
        self.assertEqual(cleared_count, 2)


class QueryCacheManagerTest(TestCase):
    """Test cases for QueryCacheManager."""
    
    def setUp(self):
        self.query_cache_manager = QueryCacheManager()
        cache.clear()
    
    def test_cache_queryset(self):
        """Test queryset caching."""
        # Mock queryset
        mock_queryset = MagicMock()
        mock_queryset.values.return_value = [
            {'id': 1, 'name': 'Test1'},
            {'id': 2, 'name': 'Test2'}
        ]
        
        # Cache the queryset
        result = self.query_cache_manager.cache_queryset(
            mock_queryset, 'test_queryset', 300
        )
        
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['name'], 'Test1')
        
        # Verify it was cached
        cached_result = self.query_cache_manager.get_cached_queryset('test_queryset')
        self.assertEqual(cached_result, result)
    
    def test_cache_queryset_with_optimizations(self):
        """Test queryset caching with select_related and prefetch_related."""
        mock_queryset = MagicMock()
        mock_queryset.select_related.return_value = mock_queryset
        mock_queryset.prefetch_related.return_value = mock_queryset
        mock_queryset.values.return_value = [{'id': 1, 'name': 'Test'}]
        
        # Cache with optimizations
        result = self.query_cache_manager.cache_queryset(
            mock_queryset, 'optimized_queryset', 300,
            select_related=['field1'], prefetch_related=['field2']
        )
        
        # Verify optimizations were applied
        mock_queryset.select_related.assert_called_once_with('field1')
        mock_queryset.prefetch_related.assert_called_once_with('field2')
        
        self.assertEqual(len(result), 1)


class CacheIntegrationTest(TestCase):
    """Integration tests for caching system."""
    
    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()
    
    def test_full_caching_workflow(self):
        """Test complete caching workflow."""
        cache_manager = CacheManager()
        
        # Test function caching
        @cache_result(timeout=60)
        def expensive_calculation(x, y):
            return x * y + 100
        
        # First execution
        result1 = expensive_calculation(5, 10)
        self.assertEqual(result1, 150)
        
        # Should use cache
        result2 = expensive_calculation(5, 10)
        self.assertEqual(result2, 150)
        
        # Test cache manager stats
        stats = cache_manager.get_stats()
        self.assertGreater(stats['total_operations'], 0)
        
        # Test cache invalidation
        expensive_calculation.invalidate(5, 10)
        
        # Should execute function again
        result3 = expensive_calculation(5, 10)
        self.assertEqual(result3, 150)
    
    def test_page_caching_with_user_context(self):
        """Test page caching with user context."""
        call_count = 0
        
        @cache_per_user(timeout=60)
        def user_specific_view(request):
            nonlocal call_count
            call_count += 1
            return JsonResponse({'user_id': request.user.pk, 'count': call_count})
        
        # User 1 requests
        request1 = self.factory.get('/test/')
        request1.user = MagicMock()
        request1.user.pk = 1
        request1.user.is_authenticated = True
        
        response1 = user_specific_view(request1)
        response2 = user_specific_view(request1)
        
        # Should use cache for same user
        self.assertEqual(call_count, 1)
        
        # User 2 requests
        request2 = self.factory.get('/test/')
        request2.user = MagicMock()
        request2.user.pk = 2
        request2.user.is_authenticated = True
        
        response3 = user_specific_view(request2)
        
        # Should execute for different user
        self.assertEqual(call_count, 2)