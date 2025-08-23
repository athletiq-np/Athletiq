"""
Caching decorators for Django views and functions.
Provides intelligent caching with automatic invalidation.
"""
import hashlib
import json
import time
from functools import wraps
from django.core.cache import cache
from django.conf import settings
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)


def cache_result(timeout=300, key_prefix=None, vary_on=None, condition=None):
    """
    Decorator to cache function results with intelligent key generation.
    
    Args:
        timeout: Cache timeout in seconds (default: 5 minutes)
        key_prefix: Custom prefix for cache key
        vary_on: List of parameter names to include in cache key
        condition: Function to determine if result should be cached
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = _generate_cache_key(func, args, kwargs, key_prefix, vary_on)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for key: {cache_key}")
                return cached_result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Check condition if provided
            if condition and not condition(result):
                return result
            
            # Cache the result
            cache.set(cache_key, result, timeout)
            logger.debug(f"Cached result for key: {cache_key}")
            
            return result
        
        # Add cache management methods
        wrapper.cache_key_func = lambda *args, **kwargs: _generate_cache_key(
            func, args, kwargs, key_prefix, vary_on
        )
        wrapper.invalidate = lambda *args, **kwargs: cache.delete(
            wrapper.cache_key_func(*args, **kwargs)
        )
        
        return wrapper
    return decorator


def cache_page_custom(timeout=300, key_prefix=None, vary_on_headers=None, 
                     vary_on_user=True, condition=None):
    """
    Custom page caching decorator with enhanced features.
    
    Args:
        timeout: Cache timeout in seconds
        key_prefix: Custom prefix for cache key
        vary_on_headers: List of headers to include in cache key
        vary_on_user: Whether to vary cache by user
        condition: Function to determine if response should be cached
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Generate cache key
            cache_key = _generate_page_cache_key(
                request, view_func, args, kwargs, key_prefix, 
                vary_on_headers, vary_on_user
            )
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                logger.debug(f"Page cache hit for key: {cache_key}")
                # Add cache headers
                if isinstance(cached_response, (JsonResponse, Response)):
                    cached_response['X-Cache'] = 'HIT'
                    cached_response['X-Cache-Key'] = cache_key[:50]  # Truncate for header
                return cached_response
            
            # Execute view
            response = view_func(request, *args, **kwargs)
            
            # Check condition if provided
            if condition and not condition(request, response):
                return response
            
            # Only cache successful responses
            if hasattr(response, 'status_code') and 200 <= response.status_code < 300:
                # Add cache headers
                if isinstance(response, (JsonResponse, Response)):
                    response['X-Cache'] = 'MISS'
                    response['X-Cache-Key'] = cache_key[:50]
                
                # Cache the response
                cache.set(cache_key, response, timeout)
                logger.debug(f"Cached page response for key: {cache_key}")
            
            return response
        
        return wrapper
    return decorator


def invalidate_cache(pattern=None, keys=None, tags=None):
    """
    Decorator to invalidate cache entries after function execution.
    
    Args:
        pattern: Cache key pattern to invalidate (supports wildcards)
        keys: Specific cache keys to invalidate
        tags: Cache tags to invalidate (if supported by backend)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Invalidate cache entries
            if pattern:
                _invalidate_pattern(pattern, args, kwargs)
            
            if keys:
                for key in keys:
                    if callable(key):
                        key = key(*args, **kwargs)
                    cache.delete(key)
                    logger.debug(f"Invalidated cache key: {key}")
            
            if tags:
                # Tag-based invalidation (requires django-cache-tree or similar)
                try:
                    from django_cache_tree import cache_tree
                    for tag in tags:
                        cache_tree.delete_many(tag)
                        logger.debug(f"Invalidated cache tag: {tag}")
                except ImportError:
                    logger.warning("Tag-based cache invalidation not available")
            
            return result
        
        return wrapper
    return decorator


def cache_unless_authenticated(timeout=300):
    """
    Cache decorator that only caches for anonymous users.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Don't cache for authenticated users
            if hasattr(request, 'user') and request.user.is_authenticated:
                return view_func(request, *args, **kwargs)
            
            # Use regular page caching for anonymous users
            cached_view = cache_page_custom(timeout, vary_on_user=False)(view_func)
            return cached_view(request, *args, **kwargs)
        
        return wrapper
    return decorator


def cache_per_user(timeout=300, key_prefix=None):
    """
    Cache decorator that creates separate cache entries per user.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            return cache_page_custom(
                timeout=timeout,
                key_prefix=key_prefix,
                vary_on_user=True
            )(view_func)(request, *args, **kwargs)
        
        return wrapper
    return decorator


def _generate_cache_key(func, args, kwargs, key_prefix=None, vary_on=None):
    """Generate cache key for function result caching."""
    # Base key components
    key_parts = [
        func.__module__,
        func.__name__,
    ]
    
    # Add prefix if provided
    if key_prefix:
        key_parts.insert(0, key_prefix)
    
    # Add arguments to key
    if vary_on:
        # Only include specified parameters
        for param in vary_on:
            if param in kwargs:
                key_parts.append(f"{param}:{kwargs[param]}")
    else:
        # Include all arguments
        if args:
            key_parts.append(f"args:{hashlib.md5(str(args).encode()).hexdigest()[:8]}")
        if kwargs:
            # Sort kwargs for consistent key generation
            sorted_kwargs = sorted(kwargs.items())
            kwargs_str = json.dumps(sorted_kwargs, sort_keys=True, default=str)
            key_parts.append(f"kwargs:{hashlib.md5(kwargs_str.encode()).hexdigest()[:8]}")
    
    cache_key = ":".join(str(part) for part in key_parts)
    
    # Ensure key length is within limits (250 chars for memcached)
    if len(cache_key) > 240:
        cache_key = hashlib.md5(cache_key.encode()).hexdigest()
    
    return cache_key


def _generate_page_cache_key(request, view_func, args, kwargs, key_prefix=None,
                           vary_on_headers=None, vary_on_user=True):
    """Generate cache key for page caching."""
    key_parts = []
    
    # Add prefix
    if key_prefix:
        key_parts.append(key_prefix)
    else:
        key_parts.append('page')
    
    # Add view information
    key_parts.extend([
        view_func.__module__,
        view_func.__name__,
    ])
    
    # Add URL path
    key_parts.append(request.path)
    
    # Add query parameters (sorted for consistency)
    if request.GET:
        query_items = sorted(request.GET.items())
        query_str = "&".join(f"{k}={v}" for k, v in query_items)
        key_parts.append(f"query:{hashlib.md5(query_str.encode()).hexdigest()[:8]}")
    
    # Add user information
    if vary_on_user and hasattr(request, 'user') and request.user.is_authenticated:
        key_parts.append(f"user:{request.user.pk}")
    
    # Add specified headers
    if vary_on_headers:
        for header in vary_on_headers:
            header_value = request.META.get(f'HTTP_{header.upper().replace("-", "_")}')
            if header_value:
                key_parts.append(f"{header}:{hashlib.md5(header_value.encode()).hexdigest()[:8]}")
    
    # Add view arguments
    if args:
        key_parts.append(f"args:{hashlib.md5(str(args).encode()).hexdigest()[:8]}")
    if kwargs:
        sorted_kwargs = sorted(kwargs.items())
        kwargs_str = json.dumps(sorted_kwargs, sort_keys=True, default=str)
        key_parts.append(f"kwargs:{hashlib.md5(kwargs_str.encode()).hexdigest()[:8]}")
    
    cache_key = ":".join(str(part) for part in key_parts)
    
    # Ensure key length is within limits
    if len(cache_key) > 240:
        cache_key = hashlib.md5(cache_key.encode()).hexdigest()
    
    return cache_key


def _invalidate_pattern(pattern, args=None, kwargs=None):
    """Invalidate cache keys matching a pattern."""
    try:
        # For Redis backend, we can use pattern matching
        from django_redis import get_redis_connection
        
        redis_conn = get_redis_connection("default")
        
        # Replace placeholders in pattern
        if args or kwargs:
            # Simple placeholder replacement
            formatted_pattern = pattern.format(*args if args else [], **kwargs if kwargs else {})
        else:
            formatted_pattern = pattern
        
        # Find matching keys
        matching_keys = redis_conn.keys(formatted_pattern)
        
        if matching_keys:
            redis_conn.delete(*matching_keys)
            logger.debug(f"Invalidated {len(matching_keys)} cache keys matching pattern: {formatted_pattern}")
    
    except ImportError:
        logger.warning("Pattern-based cache invalidation requires Redis backend")
    except Exception as e:
        logger.error(f"Error invalidating cache pattern {pattern}: {e}")


# Method decorators for class-based views
cache_result_method = method_decorator(cache_result)
cache_page_method = method_decorator(cache_page_custom)
invalidate_cache_method = method_decorator(invalidate_cache)