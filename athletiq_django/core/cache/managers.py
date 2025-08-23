"""
Cache management utilities for Athletiq Django application.
Provides centralized cache management and monitoring.
"""
import json
import time
from typing import Dict, List, Optional, Any
from django.core.cache import cache, caches
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Centralized cache management system with monitoring and optimization.
    """
    
    def __init__(self, cache_alias='default'):
        self.cache = caches[cache_alias]
        self.stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'deletes': 0,
            'errors': 0
        }
    
    def get(self, key: str, default=None, track_stats=True) -> Any:
        """Get value from cache with statistics tracking."""
        try:
            value = self.cache.get(key, default)
            
            if track_stats:
                if value is not None and value != default:
                    self.stats['hits'] += 1
                    logger.debug(f"Cache hit for key: {key}")
                else:
                    self.stats['misses'] += 1
                    logger.debug(f"Cache miss for key: {key}")
            
            return value
        
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Cache get error for key {key}: {e}")
            return default
    
    def set(self, key: str, value: Any, timeout: Optional[int] = None, 
            track_stats=True) -> bool:
        """Set value in cache with statistics tracking."""
        try:
            result = self.cache.set(key, value, timeout)
            
            if track_stats:
                self.stats['sets'] += 1
                logger.debug(f"Cache set for key: {key}")
            
            return result
        
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str, track_stats=True) -> bool:
        """Delete value from cache with statistics tracking."""
        try:
            result = self.cache.delete(key)
            
            if track_stats:
                self.stats['deletes'] += 1
                logger.debug(f"Cache delete for key: {key}")
            
            return result
        
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def get_many(self, keys: List[str], track_stats=True) -> Dict[str, Any]:
        """Get multiple values from cache."""
        try:
            result = self.cache.get_many(keys)
            
            if track_stats:
                hits = len(result)
                misses = len(keys) - hits
                self.stats['hits'] += hits
                self.stats['misses'] += misses
                logger.debug(f"Cache get_many: {hits} hits, {misses} misses")
            
            return result
        
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Cache get_many error: {e}")
            return {}
    
    def set_many(self, data: Dict[str, Any], timeout: Optional[int] = None,
                 track_stats=True) -> List[str]:
        """Set multiple values in cache."""
        try:
            failed_keys = self.cache.set_many(data, timeout)
            
            if track_stats:
                successful_sets = len(data) - len(failed_keys)
                self.stats['sets'] += successful_sets
                logger.debug(f"Cache set_many: {successful_sets} successful")
            
            return failed_keys
        
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Cache set_many error: {e}")
            return list(data.keys())
    
    def delete_many(self, keys: List[str], track_stats=True) -> None:
        """Delete multiple values from cache."""
        try:
            self.cache.delete_many(keys)
            
            if track_stats:
                self.stats['deletes'] += len(keys)
                logger.debug(f"Cache delete_many: {len(keys)} keys")
        
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Cache delete_many error: {e}")
    
    def clear(self) -> bool:
        """Clear all cache entries."""
        try:
            result = self.cache.clear()
            logger.info("Cache cleared")
            return result
        
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Cache clear error: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_operations = sum(self.stats.values())
        hit_rate = (self.stats['hits'] / (self.stats['hits'] + self.stats['misses'])) * 100 if (self.stats['hits'] + self.stats['misses']) > 0 else 0
        
        return {
            'stats': self.stats.copy(),
            'hit_rate': round(hit_rate, 2),
            'total_operations': total_operations,
            'error_rate': round((self.stats['errors'] / total_operations) * 100, 2) if total_operations > 0 else 0
        }
    
    def reset_stats(self) -> None:
        """Reset cache statistics."""
        self.stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'deletes': 0,
            'errors': 0
        }
        logger.info("Cache statistics reset")
    
    def get_cache_info(self) -> Dict[str, Any]:
        """Get cache backend information."""
        try:
            # Try to get Redis-specific info
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection("default")
            
            info = redis_conn.info()
            return {
                'backend': 'Redis',
                'version': info.get('redis_version'),
                'memory_used': info.get('used_memory_human'),
                'connected_clients': info.get('connected_clients'),
                'total_commands_processed': info.get('total_commands_processed'),
                'keyspace_hits': info.get('keyspace_hits'),
                'keyspace_misses': info.get('keyspace_misses'),
            }
        
        except ImportError:
            return {
                'backend': 'Django Cache',
                'info': 'Limited information available for non-Redis backends'
            }
        except Exception as e:
            logger.error(f"Error getting cache info: {e}")
            return {'error': str(e)}
    
    def warm_cache(self, data_loaders: List[callable]) -> Dict[str, Any]:
        """Warm cache with data from provided loaders."""
        results = {
            'loaded': 0,
            'failed': 0,
            'errors': []
        }
        
        for loader in data_loaders:
            try:
                loader_result = loader()
                if loader_result:
                    results['loaded'] += 1
                else:
                    results['failed'] += 1
            
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"{loader.__name__}: {str(e)}")
                logger.error(f"Cache warming error in {loader.__name__}: {e}")
        
        logger.info(f"Cache warming completed: {results['loaded']} loaded, {results['failed']} failed")
        return results
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate cache keys matching a pattern (Redis only)."""
        try:
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection("default")
            
            matching_keys = redis_conn.keys(pattern)
            if matching_keys:
                redis_conn.delete(*matching_keys)
                logger.info(f"Invalidated {len(matching_keys)} cache keys matching pattern: {pattern}")
                return len(matching_keys)
            
            return 0
        
        except ImportError:
            logger.warning("Pattern-based cache invalidation requires Redis backend")
            return 0
        except Exception as e:
            logger.error(f"Error invalidating cache pattern {pattern}: {e}")
            return 0
    
    def get_key_info(self, key: str) -> Dict[str, Any]:
        """Get information about a specific cache key."""
        try:
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection("default")
            
            if redis_conn.exists(key):
                ttl = redis_conn.ttl(key)
                key_type = redis_conn.type(key).decode()
                memory_usage = redis_conn.memory_usage(key) if hasattr(redis_conn, 'memory_usage') else None
                
                return {
                    'exists': True,
                    'ttl': ttl,
                    'type': key_type,
                    'memory_usage': memory_usage
                }
            else:
                return {'exists': False}
        
        except ImportError:
            # Fallback for non-Redis backends
            value = self.cache.get(key)
            return {
                'exists': value is not None,
                'backend': 'non-redis'
            }
        except Exception as e:
            logger.error(f"Error getting key info for {key}: {e}")
            return {'error': str(e)}


class QueryCacheManager:
    """
    Specialized cache manager for database query results.
    """
    
    def __init__(self, cache_manager: CacheManager = None):
        self.cache_manager = cache_manager or CacheManager()
        self.default_timeout = getattr(settings, 'QUERY_CACHE_TIMEOUT', 300)  # 5 minutes
    
    def cache_queryset(self, queryset, key: str, timeout: Optional[int] = None,
                      select_related: List[str] = None, prefetch_related: List[str] = None):
        """Cache a queryset with optimizations."""
        try:
            # Apply optimizations
            if select_related:
                queryset = queryset.select_related(*select_related)
            
            if prefetch_related:
                queryset = queryset.prefetch_related(*prefetch_related)
            
            # Convert to list to evaluate the queryset
            data = list(queryset.values())
            
            # Cache the data
            cache_timeout = timeout or self.default_timeout
            self.cache_manager.set(key, data, cache_timeout)
            
            logger.debug(f"Cached queryset with {len(data)} items for key: {key}")
            return data
        
        except Exception as e:
            logger.error(f"Error caching queryset for key {key}: {e}")
            return list(queryset.values())
    
    def get_cached_queryset(self, key: str, model_class=None):
        """Get cached queryset data."""
        try:
            cached_data = self.cache_manager.get(key)
            
            if cached_data is not None:
                logger.debug(f"Retrieved cached queryset for key: {key}")
                return cached_data
            
            return None
        
        except Exception as e:
            logger.error(f"Error retrieving cached queryset for key {key}: {e}")
            return None
    
    def invalidate_model_cache(self, model_name: str):
        """Invalidate all cache entries for a specific model."""
        pattern = f"*{model_name.lower()}*"
        return self.cache_manager.invalidate_pattern(pattern)


# Global cache manager instances
cache_manager = CacheManager()
query_cache_manager = QueryCacheManager(cache_manager)