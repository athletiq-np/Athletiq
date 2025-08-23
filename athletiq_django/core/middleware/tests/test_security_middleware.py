"""
Tests for security middleware components.
"""
import json
import time
from unittest.mock import patch, MagicMock
from django.test import TestCase, RequestFactory, override_settings
from django.http import JsonResponse
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django_ratelimit.exceptions import Ratelimited

from core.middleware.security import (
    SecurityMiddleware,
    RateLimitingMiddleware,
    InputSanitizationMiddleware
)

User = get_user_model()


class SecurityMiddlewareTest(TestCase):
    """Test cases for SecurityMiddleware."""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = SecurityMiddleware(self.get_response)
    
    def get_response(self, request):
        """Mock response function."""
        return JsonResponse({'success': True})
    
    def test_security_headers_added(self):
        """Test that security headers are added to responses."""
        request = self.factory.get('/api/test/')
        response = self.middleware(request)
        
        # Check security headers
        self.assertEqual(response['X-Frame-Options'], 'DENY')
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
        self.assertEqual(response['X-XSS-Protection'], '1; mode=block')
        self.assertEqual(response['Referrer-Policy'], 'same-origin')
        self.assertIn('Content-Security-Policy', response)
    
    def test_csp_header_content(self):
        """Test Content Security Policy header content."""
        request = self.factory.get('/api/test/')
        response = self.middleware(request)
        
        csp = response['Content-Security-Policy']
        self.assertIn("default-src 'self'", csp)
        self.assertIn("object-src 'none'", csp)
        self.assertIn("frame-src 'none'", csp)
    
    @override_settings(CORS_ALLOWED_ORIGINS=['http://localhost:3000'])
    def test_cors_headers_for_allowed_origin(self):
        """Test CORS headers are added for allowed origins."""
        request = self.factory.get('/api/test/', HTTP_ORIGIN='http://localhost:3000')
        response = self.middleware(request)
        
        self.assertEqual(response['Access-Control-Allow-Origin'], 'http://localhost:3000')
        self.assertEqual(response['Access-Control-Allow-Credentials'], 'true')
        self.assertIn('Access-Control-Allow-Methods', response)
        self.assertIn('Access-Control-Allow-Headers', response)
    
    def test_cors_headers_not_added_for_disallowed_origin(self):
        """Test CORS headers are not added for disallowed origins."""
        request = self.factory.get('/api/test/', HTTP_ORIGIN='http://malicious.com')
        response = self.middleware(request)
        
        self.assertNotIn('Access-Control-Allow-Origin', response)
    
    def test_non_api_endpoints_no_cors(self):
        """Test that non-API endpoints don't get CORS headers."""
        request = self.factory.get('/admin/', HTTP_ORIGIN='http://localhost:3000')
        response = self.middleware(request)
        
        self.assertNotIn('Access-Control-Allow-Origin', response)


class RateLimitingMiddlewareTest(TestCase):
    """Test cases for RateLimitingMiddleware."""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = RateLimitingMiddleware(self.get_response)
        cache.clear()  # Clear cache before each test
    
    def get_response(self, request):
        """Mock response function."""
        return JsonResponse({'success': True})
    
    def test_endpoint_type_detection(self):
        """Test endpoint type detection."""
        # Auth endpoint
        auth_type = self.middleware._get_endpoint_type(
            self.factory.post('/api/auth/login/')
        )
        self.assertEqual(auth_type, 'auth')
        
        # Upload endpoint
        upload_type = self.middleware._get_endpoint_type(
            self.factory.post('/api/upload/document/')
        )
        self.assertEqual(upload_type, 'upload')
        
        # General API endpoint
        general_type = self.middleware._get_endpoint_type(
            self.factory.get('/api/tournaments/')
        )
        self.assertEqual(general_type, 'general')
        
        # Create endpoint
        create_type = self.middleware._get_endpoint_type(
            self.factory.post('/api/tournaments/')
        )
        self.assertEqual(create_type, 'create')
    
    def test_rate_limit_key_generation(self):
        """Test rate limit key generation."""
        request = self.factory.get('/api/test/')
        request.user = MagicMock()
        request.user.is_authenticated = True
        request.user.user_id = 123
        
        key = self.middleware._get_rate_limit_key(request, 'general')
        self.assertEqual(key, 'rate_limit:general:user:123')
        
        # Test with unauthenticated user
        request.user.is_authenticated = False
        key = self.middleware._get_rate_limit_key(request, 'general')
        self.assertIn('rate_limit:general:ip:', key)
    
    @override_settings(TESTING=False)
    def test_rate_limiting_enforcement(self):
        """Test that rate limiting is enforced."""
        request = self.factory.post('/api/auth/login/')
        request.user = MagicMock()
        request.user.is_authenticated = False
        
        # Mock the rate limit check to raise Ratelimited
        with patch.object(self.middleware, '_check_rate_limit') as mock_check:
            mock_check.side_effect = Ratelimited()
            
            response = self.middleware(request)
            
            self.assertEqual(response.status_code, 429)
            data = json.loads(response.content)
            self.assertFalse(data['success'])
            self.assertIn('Too many login attempts', data['error'])
    
    @override_settings(TESTING=True)
    def test_rate_limiting_skipped_in_tests(self):
        """Test that rate limiting is skipped in test environment."""
        request = self.factory.post('/api/auth/login/')
        
        should_limit = self.middleware._should_rate_limit(request)
        self.assertFalse(should_limit)
    
    def test_rate_limit_headers_added(self):
        """Test that rate limit headers are added to responses."""
        request = self.factory.get('/api/test/')
        request.user = MagicMock()
        request.user.is_authenticated = False
        
        with patch.object(self.middleware, '_should_rate_limit', return_value=False):
            response = self.middleware(request)
            
            # Headers should be added for API endpoints
            self.assertIn('X-RateLimit-Limit', response)
            self.assertIn('X-RateLimit-Remaining', response)


class InputSanitizationMiddlewareTest(TestCase):
    """Test cases for InputSanitizationMiddleware."""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = InputSanitizationMiddleware(self.get_response)
    
    def get_response(self, request):
        """Mock response function."""
        return JsonResponse({'success': True})
    
    def test_xss_sanitization(self):
        """Test XSS attack sanitization."""
        malicious_data = {
            'name': '<script>alert("xss")</script>John',
            'description': 'Normal text with <img src=x onerror=alert(1)> attack'
        }
        
        sanitized = self.middleware._sanitize_dict(malicious_data)
        
        self.assertNotIn('<script>', sanitized['name'])
        self.assertNotIn('onerror=', sanitized['description'])
        self.assertIn('John', sanitized['name'])
    
    def test_html_escaping(self):
        """Test HTML escaping of input."""
        data = {
            'content': '<div>Some HTML & special chars</div>'
        }
        
        sanitized = self.middleware._sanitize_dict(data)
        
        self.assertIn('&lt;div&gt;', sanitized['content'])
        self.assertIn('&amp;', sanitized['content'])
    
    def test_nested_data_sanitization(self):
        """Test sanitization of nested data structures."""
        data = {
            'user': {
                'name': '<script>alert("nested")</script>',
                'preferences': [
                    'normal_value',
                    '<img src=x onerror=alert(1)>'
                ]
            }
        }
        
        sanitized = self.middleware._sanitize_dict(data)
        
        self.assertNotIn('<script>', sanitized['user']['name'])
        self.assertNotIn('onerror=', sanitized['user']['preferences'][1])
    
    def test_non_string_values_preserved(self):
        """Test that non-string values are preserved."""
        data = {
            'count': 42,
            'active': True,
            'score': 3.14,
            'tags': ['tag1', 'tag2'],
            'metadata': None
        }
        
        sanitized = self.middleware._sanitize_dict(data)
        
        self.assertEqual(sanitized['count'], 42)
        self.assertEqual(sanitized['active'], True)
        self.assertEqual(sanitized['score'], 3.14)
        self.assertEqual(sanitized['tags'], ['tag1', 'tag2'])
        self.assertIsNone(sanitized['metadata'])
    
    def test_post_request_sanitization(self):
        """Test sanitization of POST request data."""
        request = self.factory.post('/api/test/', {
            'name': '<script>alert("test")</script>',
            'description': 'Safe content'
        })
        
        # Mock _post attribute
        request._post = request.POST.copy()
        
        self.middleware._sanitize_request_data(request)
        
        # Check that dangerous content is removed
        self.assertNotIn('<script>', str(request._post))
    
    def test_json_request_sanitization(self):
        """Test sanitization of JSON request data."""
        data = {
            'name': '<script>alert("json")</script>',
            'safe_field': 'normal content'
        }
        
        request = self.factory.post(
            '/api/test/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Mock content_type attribute
        request.content_type = 'application/json'
        
        self.middleware._sanitize_request_data(request)
        
        # Verify sanitization occurred
        sanitized_data = json.loads(request._body.decode('utf-8'))
        self.assertNotIn('<script>', sanitized_data['name'])
        self.assertEqual(sanitized_data['safe_field'], 'normal content')


class SecurityMiddlewareIntegrationTest(TestCase):
    """Integration tests for security middleware."""
    
    def setUp(self):
        self.factory = RequestFactory()
    
    def test_middleware_chain_execution(self):
        """Test that middleware chain executes properly."""
        # Create middleware chain
        def get_response(request):
            return JsonResponse({'success': True})
        
        security_middleware = SecurityMiddleware(get_response)
        rate_limit_middleware = RateLimitingMiddleware(security_middleware)
        input_sanitization_middleware = InputSanitizationMiddleware(rate_limit_middleware)
        
        request = self.factory.get('/api/test/')
        request.user = MagicMock()
        request.user.is_authenticated = False
        
        with override_settings(TESTING=True, CORS_ALLOWED_ORIGINS=['http://localhost:3000']):
            response = input_sanitization_middleware(request)
        
        # Verify response is successful
        self.assertEqual(response.status_code, 200)
        
        # Verify security headers are present
        self.assertIn('X-Frame-Options', response)
        self.assertIn('X-Content-Type-Options', response)
    
    def test_api_endpoint_full_security_stack(self):
        """Test full security stack for API endpoints."""
        def get_response(request):
            return JsonResponse({'data': 'test'})
        
        # Build middleware stack
        middleware_stack = InputSanitizationMiddleware(
            RateLimitingMiddleware(
                SecurityMiddleware(get_response)
            )
        )
        
        request = self.factory.post('/api/tournaments/', {
            'name': 'Test Tournament',
            'description': 'Safe description'
        })
        request.user = MagicMock()
        request.user.is_authenticated = True
        request.user.user_id = 1
        
        with override_settings(TESTING=True):
            response = middleware_stack(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('X-Frame-Options', response)
        self.assertIn('X-RateLimit-Limit', response)