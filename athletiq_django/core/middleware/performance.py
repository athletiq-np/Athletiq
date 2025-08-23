"""
Performance monitoring middleware.
"""
import time
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class PerformanceMiddleware:
    """
    Middleware to monitor request performance and log slow requests.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.slow_request_threshold = getattr(settings, 'SLOW_REQUEST_THRESHOLD', 1.0)  # 1 second

    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        # Calculate request duration
        duration = time.time() - start_time
        
        # Add performance headers
        response['X-Response-Time'] = f"{duration:.3f}s"
        
        # Log slow requests
        if duration > self.slow_request_threshold:
            request_id = getattr(request, 'request_id', 'unknown')
            logger.warning(
                f"Slow request detected: {request.method} {request.path} "
                f"took {duration:.3f}s (request_id: {request_id})"
            )
        
        # Log request info
        request_id = getattr(request, 'request_id', 'unknown')
        logger.info(
            f"{request.method} {request.path} - {response.status_code} - "
            f"{duration:.3f}s (request_id: {request_id})"
        )
        
        return response