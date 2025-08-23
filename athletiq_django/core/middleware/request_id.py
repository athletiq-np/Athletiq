"""
Request ID middleware for tracing requests across the system.
"""
import uuid
import logging

logger = logging.getLogger(__name__)


class RequestIDMiddleware:
    """
    Middleware to add a unique request ID to each request for tracing.
    Compatible with the existing Node.js implementation.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Generate or extract request ID
        request_id = request.META.get('HTTP_X_REQUEST_ID')
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Add request ID to request
        request.request_id = request_id
        
        # Add to response headers
        response = self.get_response(request)
        response['X-Request-ID'] = request_id
        
        return response

    def process_exception(self, request, exception):
        """Log exceptions with request ID for debugging."""
        request_id = getattr(request, 'request_id', 'unknown')
        logger.error(
            f"Exception in request {request_id}: {exception}",
            exc_info=True,
            extra={'request_id': request_id}
        )