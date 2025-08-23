"""
Cache utility functions for Athletiq Django application.
"""
import hashlib
import json
from typing import Any, Dict, List, Optional
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def get_cache_key(*args, prefix: str = None, **kwargs) -> str:
    """
    Generate a consistent cache key from arguments.
    
    Args:
        *args: Positional arguments to include in key
        prefix: Optional prefix for the key
        **kwargs: Keyword arguments to include in key
    
    Returns:
        str: Generated cache key
    """
    key_parts = []
    
    # Add prefix if provided
    if prefix:
        key_parts.append(prefix)
    
    # Add positional arguments
    for arg in args:
        if hasattr(arg, 'pk'):  # Django model instance
            key_parts.append(f"{arg.__class__.__name__}:{arg.pk}")
        else:
            key_parts.append(str(arg))
    
    # Add keyword arguments (sorted for consistency)
    if kwargs:
        sorted_kwargs = sorted(kwargs.items())
        for key, value in sorted_kwargs:
            if hasattr(value, 'pk'):  # Django model instance
                key_parts.append(f"{key}:{value.__class__.__name__}:{value.pk}")
            else:
                key_parts.append(f"{key}:{value}")
    
    # Join parts and ensure reasonable length
    cache_key = ":".join(key_parts)
    
    # Hash if too long (memcached has 250 char limit)
    if len(cache_key) > 240:
        cache_key = hashlib.md5(cache_key.encode()).hexdigest()
    
    return cache_key


def clear_pattern_cache(pattern: str) -> int:
    """
    Clear cache entries matching a pattern.
    
    Args:
        pattern: Pattern to match (supports wildcards for Redis)
    
    Returns:
        int: Number of keys cleared
    """
    try:
        from django_redis import get_redis_connection
        redis_conn = get_redis_connection("default")
        
        matching_keys = redis_conn.keys(pattern)
        if matching_keys:
            redis_conn.delete(*matching_keys)
            logger.info(f"Cleared {len(matching_keys)} cache keys matching pattern: {pattern}")
            return len(matching_keys)
        
        return 0
    
    except ImportError:
        logger.warning("Pattern-based cache clearing requires Redis backend")
        return 0
    except Exception as e:
        logger.error(f"Error clearing cache pattern {pattern}: {e}")
        return 0


def cache_model_instance(instance, timeout: int = 300) -> str:
    """
    Cache a Django model instance.
    
    Args:
        instance: Django model instance
        timeout: Cache timeout in seconds
    
    Returns:
        str: Cache key used
    """
    cache_key = get_cache_key(instance.__class__.__name__, instance.pk, prefix="model")
    
    # Serialize instance data
    instance_data = {
        'model': instance.__class__.__name__,
        'pk': instance.pk,
        'fields': {}
    }
    
    # Get field values
    for field in instance._meta.fields:
        field_value = getattr(instance, field.name)
        # Handle special field types
        if hasattr(field_value, 'isoformat'):  # DateTime fields
            instance_data['fields'][field.name] = field_value.isoformat()
        elif hasattr(field_value, 'pk'):  # Foreign key fields
            instance_data['fields'][field.name] = field_value.pk
        else:
            instance_data['fields'][field.name] = field_value
    
    cache.set(cache_key, instance_data, timeout)
    logger.debug(f"Cached model instance: {cache_key}")
    
    return cache_key


def get_cached_model_instance(model_class, pk: Any) -> Optional[Dict]:
    """
    Get cached model instance data.
    
    Args:
        model_class: Django model class
        pk: Primary key of the instance
    
    Returns:
        Optional[Dict]: Cached instance data or None
    """
    cache_key = get_cache_key(model_class.__name__, pk, prefix="model")
    cached_data = cache.get(cache_key)
    
    if cached_data:
        logger.debug(f"Retrieved cached model instance: {cache_key}")
    
    return cached_data


def invalidate_model_cache(model_class, pk: Any = None) -> int:
    """
    Invalidate cache for a model instance or all instances of a model.
    
    Args:
        model_class: Django model class
        pk: Optional primary key (if None, invalidates all instances)
    
    Returns:
        int: Number of keys invalidated
    """
    if pk is not None:
        # Invalidate specific instance
        cache_key = get_cache_key(model_class.__name__, pk, prefix="model")
        cache.delete(cache_key)
        logger.debug(f"Invalidated model cache: {cache_key}")
        return 1
    else:
        # Invalidate all instances of the model
        pattern = f"model:{model_class.__name__}:*"
        return clear_pattern_cache(pattern)


def cache_api_response(view_name: str, params: Dict = None, response_data: Any = None,
                      timeout: int = 300) -> str:
    """
    Cache API response data.
    
    Args:
        view_name: Name of the API view
        params: Request parameters
        response_data: Response data to cache
        timeout: Cache timeout in seconds
    
    Returns:
        str: Cache key used
    """
    cache_key = get_cache_key("api", view_name, prefix="response", **(params or {}))
    
    if response_data is not None:
        cache.set(cache_key, response_data, timeout)
        logger.debug(f"Cached API response: {cache_key}")
    
    return cache_key


def get_cached_api_response(view_name: str, params: Dict = None) -> Optional[Any]:
    """
    Get cached API response data.
    
    Args:
        view_name: Name of the API view
        params: Request parameters
    
    Returns:
        Optional[Any]: Cached response data or None
    """
    cache_key = get_cache_key("api", view_name, prefix="response", **(params or {}))
    cached_data = cache.get(cache_key)
    
    if cached_data:
        logger.debug(f"Retrieved cached API response: {cache_key}")
    
    return cached_data


def warm_cache_for_model(model_class, queryset=None, timeout: int = 300) -> int:
    """
    Warm cache for model instances.
    
    Args:
        model_class: Django model class
        queryset: Optional queryset to limit instances
        timeout: Cache timeout in seconds
    
    Returns:
        int: Number of instances cached
    """
    if queryset is None:
        queryset = model_class.objects.all()
    
    cached_count = 0
    
    for instance in queryset.iterator():
        try:
            cache_model_instance(instance, timeout)
            cached_count += 1
        except Exception as e:
            logger.error(f"Error caching instance {instance.pk}: {e}")
    
    logger.info(f"Warmed cache for {cached_count} {model_class.__name__} instances")
    return cached_count


def get_cache_stats() -> Dict[str, Any]:
    """
    Get cache statistics and information.
    
    Returns:
        Dict[str, Any]: Cache statistics
    """
    stats = {
        'backend': 'unknown',
        'status': 'unknown'
    }
    
    try:
        # Test cache connectivity
        test_key = "cache_test_key"
        cache.set(test_key, "test_value", 10)
        test_result = cache.get(test_key)
        cache.delete(test_key)
        
        if test_result == "test_value":
            stats['status'] = 'connected'
        else:
            stats['status'] = 'error'
        
        # Try to get Redis-specific stats
        try:
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection("default")
            
            info = redis_conn.info()
            stats.update({
                'backend': 'Redis',
                'version': info.get('redis_version'),
                'memory_used': info.get('used_memory_human'),
                'connected_clients': info.get('connected_clients'),
                'total_commands_processed': info.get('total_commands_processed'),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
            })
            
            # Calculate hit rate
            hits = stats.get('keyspace_hits', 0)
            misses = stats.get('keyspace_misses', 0)
            if hits + misses > 0:
                stats['hit_rate'] = round((hits / (hits + misses)) * 100, 2)
            else:
                stats['hit_rate'] = 0
        
        except ImportError:
            stats['backend'] = 'Django Cache'
        except Exception as e:
            stats['redis_error'] = str(e)
    
    except Exception as e:
        stats['status'] = 'error'
        stats['error'] = str(e)
    
    return stats


def batch_cache_set(data: Dict[str, Any], timeout: int = 300, 
                   key_prefix: str = None) -> List[str]:
    """
    Set multiple cache entries in batch.
    
    Args:
        data: Dictionary of key-value pairs to cache
        timeout: Cache timeout in seconds
        key_prefix: Optional prefix for all keys
    
    Returns:
        List[str]: List of failed keys
    """
    if key_prefix:
        prefixed_data = {f"{key_prefix}:{key}": value for key, value in data.items()}
    else:
        prefixed_data = data
    
    try:
        failed_keys = cache.set_many(prefixed_data, timeout)
        
        successful_count = len(prefixed_data) - len(failed_keys)
        logger.debug(f"Batch cache set: {successful_count} successful, {len(failed_keys)} failed")
        
        return failed_keys
    
    except Exception as e:
        logger.error(f"Error in batch cache set: {e}")
        return list(prefixed_data.keys())


def batch_cache_get(keys: List[str], key_prefix: str = None) -> Dict[str, Any]:
    """
    Get multiple cache entries in batch.
    
    Args:
        keys: List of cache keys to retrieve
        key_prefix: Optional prefix for all keys
    
    Returns:
        Dict[str, Any]: Dictionary of key-value pairs
    """
    if key_prefix:
        prefixed_keys = [f"{key_prefix}:{key}" for key in keys]
    else:
        prefixed_keys = keys
    
    try:
        result = cache.get_many(prefixed_keys)
        
        # Remove prefix from result keys if it was added
        if key_prefix:
            cleaned_result = {}
            prefix_len = len(key_prefix) + 1
            for key, value in result.items():
                cleaned_key = key[prefix_len:]
                cleaned_result[cleaned_key] = value
            result = cleaned_result
        
        logger.debug(f"Batch cache get: retrieved {len(result)} out of {len(keys)} keys")
        
        return result
    
    except Exception as e:
        logger.error(f"Error in batch cache get: {e}")
        return {}


def cache_function_result(func, args=None, kwargs=None, timeout=300, key_prefix=None):
    """
    Cache the result of a function call.
    
    Args:
        func: Function to call and cache
        args: Positional arguments for the function
        kwargs: Keyword arguments for the function
        timeout: Cache timeout in seconds
        key_prefix: Optional prefix for cache key
    
    Returns:
        Any: Function result (from cache or fresh execution)
    """
    args = args or ()
    kwargs = kwargs or {}
    
    # Generate cache key
    cache_key = get_cache_key(
        func.__module__, func.__name__, 
        *args, prefix=key_prefix, **kwargs
    )
    
    # Try to get from cache
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        logger.debug(f"Function result cache hit: {cache_key}")
        return cached_result
    
    # Execute function and cache result
    try:
        result = func(*args, **kwargs)
        cache.set(cache_key, result, timeout)
        logger.debug(f"Function result cached: {cache_key}")
        return result
    
    except Exception as e:
        logger.error(f"Error executing and caching function {func.__name__}: {e}")
        raise