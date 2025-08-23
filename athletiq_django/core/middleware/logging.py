"""
Request logging middleware for Athletiq Django application.
Provides structured logging compatible with Winston format from Node.js.
"""
import json
import time
import logging
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """
    Middleware to log requests in a structured format compatible with
    the existing Node.js Winston logging format.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Record start time
        start_time = time.time()
        
        # Get request info
        request_info = self._get_request_info(request)
        
        # Process request
        response = self.get_response(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log request completion
        self._log_request_completion(request, response, request_info, duration)
        
        return response

    def _get_request_info(self, request):
        """Extract request information for logging."""
        return {
            'method': request.method,
            'url': request.get_full_path(),
            'path': request.path,
            'ip': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'referer': request.META.get('HTTP_REFERER', ''),
            'request_id': getattr(request, 'request_id', 'unknown'),
            'user_id': getattr(request.user, 'user_id', None) if hasattr(request, 'user') and request.user.is_authenticated else None,
            'timestamp': time.time(),
        }

    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip

    def _log_request_completion(self, request, response, request_info, duration):
        """Log request completion with structured data."""
        log_data = {
            'level': 'info',
            'message': f"{request_info['method']} {request_info['path']}",
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
            'request': {
                'method': request_info['method'],
                'url': request_info['url'],
                'path': request_info['path'],
                'ip': request_info['ip'],
                'userAgent': request_info['user_agent'],
                'referer': request_info['referer'],
                'requestId': request_info['request_id'],
                'userId': request_info['user_id'],
            },
            'response': {
                'statusCode': response.status_code,
                'contentLength': len(response.content) if hasattr(response, 'content') else 0,
                'duration': f"{duration * 1000:.2f}ms",
            },
            'meta': {
                'service': 'athletiq-django',
                'environment': getattr(settings, 'ENVIRONMENT', 'development'),
            }
        }
        
        # Determine log level based on status code
        if response.status_code >= 500:
            log_level = logging.ERROR
            log_data['level'] = 'error'
        elif response.status_code >= 400:
            log_level = logging.WARNING
            log_data['level'] = 'warn'
        else:
            log_level = logging.INFO
        
        # Log in structured format
        if getattr(settings, 'STRUCTURED_LOGGING', True):
            # Log as JSON for structured logging
            logger.log(log_level, json.dumps(log_data))
        else:
            # Log in simple format for development
            simple_message = (
                f"{log_data['request']['method']} {log_data['request']['path']} - "
                f"{log_data['response']['statusCode']} - {log_data['response']['duration']} - "
                f"IP: {log_data['request']['ip']} - ID: {log_data['request']['requestId']}"
            )
            logger.log(log_level, simple_message)

    def process_exception(self, request, exception):
        """Log exceptions with request context."""
        request_id = getattr(request, 'request_id', 'unknown')
        user_id = getattr(request.user, 'user_id', None) if hasattr(request, 'user') and request.user.is_authenticated else None
        
        log_data = {
            'level': 'error',
            'message': f"Exception in request: {str(exception)}",
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
            'error': {
                'name': exception.__class__.__name__,
                'message': str(exception),
                'stack': self._get_exception_stack(exception) if getattr(settings, 'DEBUG', False) else None,
            },
            'request': {
                'method': request.method,
                'path': request.path,
                'ip': self._get_client_ip(request),
                'requestId': request_id,
                'userId': user_id,
            },
            'meta': {
                'service': 'athletiq-django',
                'environment': getattr(settings, 'ENVIRONMENT', 'development'),
            }
        }
        
        if getattr(settings, 'STRUCTURED_LOGGING', True):
            logger.error(json.dumps(log_data))
        else:
            logger.error(
                f"Exception in request {request_id}: {exception}",
                exc_info=True,
                extra={'request_id': request_id, 'user_id': user_id}
            )

    def _get_exception_stack(self, exception):
        """Get exception stack trace."""
        import traceback
        return traceback.format_exception(type(exception), exception, exception.__traceback__)


class SecurityEventLoggingMiddleware:
    """
    Middleware to log security-related events for monitoring and alerting.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.security_logger = logging.getLogger('security')

    def __call__(self, request):
        # Check for suspicious activity before processing
        self._check_suspicious_activity(request)
        
        response = self.get_response(request)
        
        # Log security events after processing
        self._log_security_events(request, response)
        
        return response

    def _check_suspicious_activity(self, request):
        """Check for suspicious activity patterns."""
        # Check for SQL injection attempts
        if self._check_sql_injection(request):
            self._log_security_event(request, 'sql_injection_attempt', 'high')
        
        # Check for XSS attempts
        if self._check_xss_attempt(request):
            self._log_security_event(request, 'xss_attempt', 'medium')
        
        # Check for path traversal attempts
        if self._check_path_traversal(request):
            self._log_security_event(request, 'path_traversal_attempt', 'high')

    def _check_sql_injection(self, request):
        """Check for SQL injection patterns."""
        sql_patterns = [
            r"union\s+select", r"drop\s+table", r"insert\s+into",
            r"delete\s+from", r"update\s+.*set", r"exec\s*\(",
            r"script\s*>", r"<\s*script", r"javascript:",
        ]
        
        query_string = request.META.get('QUERY_STRING', '').lower()
        path = request.path.lower()
        
        import re
        for pattern in sql_patterns:
            if re.search(pattern, query_string) or re.search(pattern, path):
                return True
        return False

    def _check_xss_attempt(self, request):
        """Check for XSS attempt patterns."""
        xss_patterns = [
            r"<script", r"javascript:", r"vbscript:", r"onload\s*=",
            r"onerror\s*=", r"onclick\s*=", r"alert\s*\(",
        ]
        
        query_string = request.META.get('QUERY_STRING', '').lower()
        
        import re
        for pattern in xss_patterns:
            if re.search(pattern, query_string):
                return True
        return False

    def _check_path_traversal(self, request):
        """Check for path traversal attempts."""
        path = request.path
        return '../' in path or '..\\' in path

    def _log_security_events(self, request, response):
        """Log security-related events."""
        # Log failed authentication attempts
        if (request.path.startswith('/api/auth/') and 
            response.status_code in [401, 403]):
            self._log_security_event(request, 'authentication_failure', 'medium')
        
        # Log admin access
        if request.path.startswith('/admin/') and response.status_code == 200:
            self._log_security_event(request, 'admin_access', 'low')

    def _log_security_event(self, request, event_type, severity):
        """Log a security event."""
        log_data = {
            'level': 'warn' if severity == 'low' else 'error',
            'message': f"Security event: {event_type}",
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
            'security': {
                'eventType': event_type,
                'severity': severity,
                'ip': self._get_client_ip(request),
                'userAgent': request.META.get('HTTP_USER_AGENT', ''),
                'path': request.path,
                'method': request.method,
                'requestId': getattr(request, 'request_id', 'unknown'),
                'userId': getattr(request.user, 'user_id', None) if hasattr(request, 'user') and request.user.is_authenticated else None,
            },
            'meta': {
                'service': 'athletiq-django',
                'environment': getattr(settings, 'ENVIRONMENT', 'development'),
            }
        }
        
        log_level = logging.ERROR if severity == 'high' else logging.WARNING
        
        if getattr(settings, 'STRUCTURED_LOGGING', True):
            self.security_logger.log(log_level, json.dumps(log_data))
        else:
            self.security_logger.log(
                log_level,
                f"Security event: {event_type} - IP: {log_data['security']['ip']} - "
                f"Path: {log_data['security']['path']} - Severity: {severity}"
            )

    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip