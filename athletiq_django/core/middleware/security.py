"""
Enhanced security middleware for Athletiq Django application.
Provides rate limiting, input sanitization, and security headers.
"""
import re
import html
import json
import logging
from django.conf import settings
from django.http import JsonResponse
from django.core.cache import cache
from django.utils.deprecation import MiddlewareMixin
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class SecurityMiddleware:
    """
    Enhanced security middleware that adds comprehensive security headers
    and protections matching the existing Node.js implementation.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add comprehensive security headers
        self._add_security_headers(response)
        
        # Add CORS headers for API endpoints
        if request.path.startswith('/api/'):
            self._add_cors_headers(request, response)
        
        return response

    def _add_security_headers(self, response):
        """Add security headers to response."""
        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "script-src 'self'",
            "img-src 'self' data: https:",
            "connect-src 'self'",
            "object-src 'none'",
            "media-src 'self'",
            "frame-src 'none'",
        ]
        response['Content-Security-Policy'] = '; '.join(csp_directives)
        
        # HTTP Strict Transport Security (HSTS)
        if getattr(settings, 'SECURE_SSL_REDIRECT', False):
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # X-Frame-Options
        response['X-Frame-Options'] = 'DENY'
        
        # X-Content-Type-Options
        response['X-Content-Type-Options'] = 'nosniff'
        
        # X-XSS-Protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer Policy
        response['Referrer-Policy'] = 'same-origin'
        
        # Cross-Origin Embedder Policy
        response['Cross-Origin-Embedder-Policy'] = 'require-corp'
        
        # Cross-Origin Opener Policy
        response['Cross-Origin-Opener-Policy'] = 'same-origin'

    def _add_cors_headers(self, request, response):
        """Add CORS headers for API endpoints."""
        origin = request.META.get('HTTP_ORIGIN')
        
        # Get allowed origins from settings
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        
        # Check if origin is allowed
        if origin and origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = ', '.join([
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'X-API-Key',
                'Cache-Control',
                'Pragma'
            ])
            response['Access-Control-Expose-Headers'] = ', '.join([
                'X-Total-Count',
                'X-Page-Count',
                'X-RateLimit-Limit',
                'X-RateLimit-Remaining',
                'X-RateLimit-Reset',
                'X-Request-ID'
            ])
            response['Access-Control-Max-Age'] = '86400'  # 24 hours


class RateLimitingMiddleware:
    """
    Advanced rate limiting middleware that provides different limits
    for different types of endpoints, matching Node.js implementation.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limits = {
            # General API endpoints
            'general': {'rate': '1000/15m', 'block': True},
            # Authentication endpoints
            'auth': {'rate': '10/15m', 'block': True},
            # Password reset endpoints
            'password_reset': {'rate': '5/1h', 'block': True},
            # File upload endpoints
            'upload': {'rate': '50/15m', 'block': True},
            # Admin endpoints
            'admin': {'rate': '200/15m', 'block': True},
            # Create operations
            'create': {'rate': '100/15m', 'block': True},
        }

    def __call__(self, request):
        # Apply rate limiting based on endpoint type
        endpoint_type = self._get_endpoint_type(request)
        rate_limit_key = None  # Initialize to None
        
        if endpoint_type and self._should_rate_limit(request):
            rate_limit_key = self._get_rate_limit_key(request, endpoint_type)
            
            try:
                self._check_rate_limit(request, endpoint_type, rate_limit_key)
            except Ratelimited:
                return self._rate_limit_response(endpoint_type)
        
        response = self.get_response(request)
        
        # Add rate limit headers only if we have a valid endpoint type and rate limit key
        if endpoint_type and rate_limit_key:
            self._add_rate_limit_headers(response, endpoint_type, rate_limit_key)
        
        return response

    def _get_endpoint_type(self, request):
        """Determine the type of endpoint being accessed."""
        path = request.path.lower()
        
        if '/api/auth/' in path or '/api/guardian/auth/' in path:
            return 'auth'
        elif '/api/password-reset/' in path:
            return 'password_reset'
        elif '/api/upload/' in path or '/api/documents/' in path:
            return 'upload'
        elif '/admin/' in path:
            return 'admin'
        elif request.method == 'POST' and '/api/' in path:
            return 'create'
        elif '/api/' in path:
            return 'general'
        
        return None

    def _should_rate_limit(self, request):
        """Check if request should be rate limited."""
        # Skip rate limiting in test environment
        if getattr(settings, 'TESTING', False):
            return False
        
        # Skip rate limiting for superusers in development
        if (getattr(settings, 'DEBUG', False) and 
            hasattr(request, 'user') and 
            request.user.is_authenticated and 
            request.user.is_superuser):
            return False
        
        return True

    def _get_rate_limit_key(self, request, endpoint_type):
        """Generate rate limit key for caching."""
        # Use user ID if authenticated, otherwise use IP
        if hasattr(request, 'user') and request.user.is_authenticated:
            identifier = f"user:{request.user.user_id}"
        else:
            identifier = f"ip:{self._get_client_ip(request)}"
        
        return f"rate_limit:{endpoint_type}:{identifier}"

    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip

    def _check_rate_limit(self, request, endpoint_type, rate_limit_key):
        """Check if request exceeds rate limit."""
        rate_config = self.rate_limits.get(endpoint_type, self.rate_limits['general'])
        rate_limit = rate_config['rate']
        
        # Parse rate limit (e.g., "100/15m" -> 100 requests per 15 minutes)
        limit, period = rate_limit.split('/')
        limit = int(limit)
        
        # Convert period to seconds
        if period.endswith('m'):
            period_seconds = int(period[:-1]) * 60
        elif period.endswith('h'):
            period_seconds = int(period[:-1]) * 3600
        elif period.endswith('s'):
            period_seconds = int(period[:-1])
        else:
            period_seconds = 900  # Default 15 minutes
        
        # Check current count
        current_count = cache.get(rate_limit_key, 0)
        
        if current_count >= limit:
            logger.warning(
                f"Rate limit exceeded for {rate_limit_key}: {current_count}/{limit}"
            )
            raise Ratelimited()
        
        # Increment counter
        cache.set(rate_limit_key, current_count + 1, period_seconds)

    def _rate_limit_response(self, endpoint_type):
        """Return rate limit exceeded response."""
        rate_config = self.rate_limits.get(endpoint_type, self.rate_limits['general'])
        
        messages = {
            'auth': 'Too many login attempts from this IP, please try again later.',
            'password_reset': 'Too many password reset attempts from this IP, please try again later.',
            'upload': 'Too many file uploads from this IP, please try again later.',
            'admin': 'Too many admin requests from this IP, please try again later.',
            'create': 'Too many create operations from this IP, please try again later.',
            'general': 'Too many requests from this IP, please try again later.',
        }
        
        retry_after = {
            'auth': 15 * 60,
            'password_reset': 60 * 60,
            'upload': 15 * 60,
            'admin': 15 * 60,
            'create': 15 * 60,
            'general': 15 * 60,
        }
        
        response = JsonResponse({
            'success': False,
            'error': messages.get(endpoint_type, messages['general']),
            'retryAfter': retry_after.get(endpoint_type, retry_after['general'])
        }, status=429)
        
        response['Retry-After'] = str(retry_after.get(endpoint_type, retry_after['general']))
        
        return response

    def _add_rate_limit_headers(self, response, endpoint_type, rate_limit_key):
        """Add rate limit headers to response."""
        rate_config = self.rate_limits.get(endpoint_type, self.rate_limits['general'])
        rate_limit = rate_config['rate']
        limit = int(rate_limit.split('/')[0])
        
        current_count = cache.get(rate_limit_key, 0)
        remaining = max(0, limit - current_count)
        
        response['X-RateLimit-Limit'] = str(limit)
        response['X-RateLimit-Remaining'] = str(remaining)
        
        # Add reset time if available (only for Redis cache)
        try:
            if hasattr(cache, 'ttl'):
                ttl = cache.ttl(rate_limit_key)
                if ttl and ttl > 0:
                    import time
                    reset_time = int(time.time()) + ttl
                    response['X-RateLimit-Reset'] = str(reset_time)
        except (AttributeError, Exception):
            # Fallback for caches that don't support TTL
            pass


class InputSanitizationMiddleware:
    """
    Middleware to sanitize input data to prevent XSS and injection attacks.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Patterns for potentially dangerous content
        self.dangerous_patterns = [
            re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
            re.compile(r'javascript:', re.IGNORECASE),
            re.compile(r'vbscript:', re.IGNORECASE),
            re.compile(r'onload\s*=', re.IGNORECASE),
            re.compile(r'onerror\s*=', re.IGNORECASE),
            re.compile(r'onclick\s*=', re.IGNORECASE),
        ]

    def __call__(self, request):
        # Sanitize request data
        if request.method in ['POST', 'PUT', 'PATCH']:
            self._sanitize_request_data(request)
        
        response = self.get_response(request)
        return response

    def _sanitize_request_data(self, request):
        """Sanitize request data to prevent XSS attacks."""
        try:
            # Sanitize POST data
            if hasattr(request, '_post') and request._post:
                request._post = self._sanitize_dict(request._post.copy())
            
            # Sanitize JSON data
            if (hasattr(request, 'content_type') and 
                'application/json' in request.content_type and 
                hasattr(request, 'body')):
                
                try:
                    data = json.loads(request.body.decode('utf-8'))
                    if isinstance(data, dict):
                        sanitized_data = self._sanitize_dict(data)
                        request._body = json.dumps(sanitized_data).encode('utf-8')
                except (json.JSONDecodeError, UnicodeDecodeError):
                    # If JSON parsing fails, leave the body as is
                    pass
                    
        except Exception as e:
            logger.warning(f"Error sanitizing request data: {e}")

    def _sanitize_dict(self, data):
        """Recursively sanitize dictionary data."""
        if isinstance(data, dict):
            return {key: self._sanitize_value(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._sanitize_value(item) for item in data]
        else:
            return self._sanitize_value(data)

    def _sanitize_value(self, value):
        """Sanitize individual values."""
        if isinstance(value, str):
            # HTML escape the value
            sanitized = html.escape(value)
            
            # Remove dangerous patterns
            for pattern in self.dangerous_patterns:
                sanitized = pattern.sub('', sanitized)
            
            return sanitized
        elif isinstance(value, dict):
            return self._sanitize_dict(value)
        elif isinstance(value, list):
            return [self._sanitize_value(item) for item in value]
        else:
            return value