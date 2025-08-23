import time
import logging
from django.utils.deprecation import MiddlewareMixin
from .services.metrics import MetricsCollectionService

logger = logging.getLogger(__name__)


class MetricsCollectionMiddleware(MiddlewareMixin):
    """Middleware to collect API performance metrics."""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.metrics_service = MetricsCollectionService()
        super().__init__(get_response)
    
    def process_request(self, request):
        """Start timing the request."""
        request._metrics_start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """Collect metrics after response is generated."""
        try:
            # Calculate response time
            if hasattr(request, '_metrics_start_time'):
                response_time = (time.time() - request._metrics_start_time) * 1000
                
                # Get endpoint path
                endpoint = request.path
                
                # Get user agent
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                
                # Collect metrics
                self.metrics_service.collect_api_metrics(
                    endpoint=endpoint,
                    response_time=response_time,
                    status_code=response.status_code,
                    user_agent=user_agent
                )
                
                # Add response time header for debugging
                response['X-Response-Time'] = f"{response_time:.2f}ms"
                
        except Exception as e:
            logger.error(f"Failed to collect metrics: {str(e)}")
        
        return response