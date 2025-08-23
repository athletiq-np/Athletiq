import logging
import time
from typing import Optional, Dict, Any
from django.conf import settings
from django.core.cache import cache
from ..models import GoogleServiceUsage


logger = logging.getLogger(__name__)


class BaseGoogleService:
    """Base class for Google services with common functionality"""
    
    def __init__(self):
        self.project_id = getattr(settings, 'GOOGLE_CLOUD_PROJECT_ID', None)
        self.credentials_path = getattr(settings, 'GOOGLE_APPLICATION_CREDENTIALS', None)
        
    def _log_usage(self, service_type: str, operation: str, success: bool = True, 
                   error_message: str = '', processing_time: float = None,
                   response_size: int = None, user=None):
        """Log Google service usage for monitoring"""
        try:
            GoogleServiceUsage.objects.create(
                service_type=service_type,
                operation=operation,
                success=success,
                error_message=error_message,
                processing_time=processing_time,
                response_size=response_size,
                user=user
            )
        except Exception as e:
            logger.error(f"Failed to log Google service usage: {e}")
    
    def _get_cache_key(self, service: str, operation: str, **kwargs) -> str:
        """Generate cache key for Google service results"""
        key_parts = [f"google_{service}", operation]
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}_{str(v)}")
        return "_".join(key_parts)
    
    def _cache_result(self, key: str, result: Any, timeout: int = 3600):
        """Cache service result"""
        try:
            cache.set(key, result, timeout)
        except Exception as e:
            logger.warning(f"Failed to cache result: {e}")
    
    def _get_cached_result(self, key: str) -> Optional[Any]:
        """Get cached service result"""
        try:
            return cache.get(key)
        except Exception as e:
            logger.warning(f"Failed to get cached result: {e}")
            return None