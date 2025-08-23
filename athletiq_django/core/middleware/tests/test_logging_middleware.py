"""
Tests for logging middleware components.
"""
import json
import time
from unittest.mock import patch, MagicMock
from django.test import TestCase, RequestFactory, override_settings
from django.http import JsonResponse
from django.contrib.auth import get_user_model

from core.middleware.logging import (
    RequestLoggingMiddleware,
    SecurityEventLoggingMiddleware
)

User = get_user_model()


class RequestLoggingMiddlewareTest(TestCase):
    """Test cases for RequestLoggingMiddleware."""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = RequestLoggingMiddleware(self.get_response)
    
    def get_response(self, request):
        """Mock response function."""
        return JsonResponse({'success': True})
    
    def test_request_info_extraction(self):
        """Test extraction of request information."""
        request = self.factory.get('/api/test/?param=value')
        request.META['HTTP_USER_AGENT'] = 'Test Agent'
        request.META['HTTP_REFERER'] = 'http://localhost:3000'
        request.request_id = 'test-123'
        request.user = MagicMock()
        request.user.is_authenticated = True
        request.user.user_id = 42
        
        info = self.middleware._get_request_info(request)
        
        self.assertEqual(info['method'], 'GET')
        self.assertEqual(info['path'], '/api/test/')
        self.assertEqual(info['url'], '/api/test/?param=value')
        self.assertEqual(info['user_agent'], 'Test Agent')
        self.assertEqual(info['referer'], 'http://localhost:3000')
        self.assertEqual(info['request_id'], 'test-123')
        self.assertEqual(info['user_id'], 42)
    
    def test_client_ip_extraction(self):
        """Test client IP extraction."""
        # Test with X-Forwarded-For header
        request = self.factory.get('/api/test/')
        request.META['HTTP_X_FORWARDED_FOR'] = '192.168.1.1, 10.0.0.1'
        
        ip = self.middleware._get_client_ip(request)
        self.assertEqual(ip, '192.168.1.1')
        
        # Test with REMOTE_ADDR
        request = self.factory.get('/api/test/')
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        ip = self.middleware._get_client_ip(request)
        self.assertEqual(ip, '127.0.0.1')
    
    @patch('core.middleware.logging.logger')
    @override_settings(STRUCTURED_LOGGING=True)
    def test_structured_logging_format(self, mock_logger):
        """Test structured logging format."""
        request = self.factory.get('/api/test/')
        request.request_id = 'test-456'
        request.user = MagicMock()
        request.user.is_authenticated = False
        
        response = self.middleware(request)
        
        # Verify logger was called
        mock_logger.log.assert_called()
        
        # Get the logged data
        call_args = mock_logger.log.call_args
        log_level = call_args[0][0]
        log_message = call_args[0][1]
        
        # Parse JSON log message
        log_data = json.loads(log_message)
        
        self.assertEqual(log_data['level'], 'info')
        self.assertEqual(log_data['request']['method'], 'GET')
        self.assertEqual(log_data['request']['path'], '/api/test/')
        self.assertEqual(log_data['request']['requestId'], 'test-456')
        self.assertEqual(log_data['response']['statusCode'], 200)
        self.assertIn('duration', log_data['response'])
    
    @patch('core.middleware.logging.logger')
    @override_settings(STRUCTURED_LOGGING=False)
    def test_simple_logging_format(self, mock_logger):
        """Test simple logging format."""
        request = self.factory.get('/api/test/')
        request.request_id = 'test-789'
        
        response = self.middleware(request)
        
        # Verify logger was called with simple format
        mock_logger.log.assert_called()
        call_args = mock_logger.log.call_args
        log_message = call_args[0][1]
        
        self.assertIn('GET /api/test/', log_message)
        self.assertIn('200', log_message)
        self.assertIn('test-789', log_message)
    
    def test_log_level_based_on_status_code(self):
        """Test log level determination based on status code."""
        def error_response(request):
            return JsonResponse({'error': 'Server error'}, status=500)
        
        def warning_response(request):
            return JsonResponse({'error': 'Not found'}, status=404)
        
        # Test error level for 5xx
        middleware = RequestLoggingMiddleware(error_response)
        request = self.factory.get('/api/test/')
        
        with patch('core.middleware.logging.logger') as mock_logger:
            response = middleware(request)
            
            call_args = mock_logger.log.call_args
            log_level = call_args[0][0]
            self.assertEqual(log_level, 40)  # ERROR level
        
        # Test warning level for 4xx
        middleware = RequestLoggingMiddleware(warning_response)
        
        with patch('core.middleware.logging.logger') as mock_logger:
            response = middleware(request)
            
            call_args = mock_logger.log.call_args
            log_level = call_args[0][0]
            self.assertEqual(log_level, 30)  # WARNING level
    
    @patch('core.middleware.logging.logger')
    def test_exception_logging(self, mock_logger):
        """Test exception logging with context."""
        request = self.factory.get('/api/test/')
        request.request_id = 'test-exception'
        request.user = MagicMock()
        request.user.is_authenticated = True
        request.user.user_id = 123
        
        exception = ValueError("Test exception")
        
        self.middleware.process_exception(request, exception)
        
        # Verify exception was logged
        mock_logger.error.assert_called()
        
        # Check structured logging format
        with override_settings(STRUCTURED_LOGGING=True):
            self.middleware.process_exception(request, exception)
            
            call_args = mock_logger.error.call_args
            log_message = call_args[0][0]
            log_data = json.loads(log_message)
            
            self.assertEqual(log_data['level'], 'error')
            self.assertEqual(log_data['error']['name'], 'ValueError')
            self.assertEqual(log_data['error']['message'], 'Test exception')
            self.assertEqual(log_data['request']['requestId'], 'test-exception')
            self.assertEqual(log_data['request']['userId'], 123)


class SecurityEventLoggingMiddlewareTest(TestCase):
    """Test cases for SecurityEventLoggingMiddleware."""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = SecurityEventLoggingMiddleware(self.get_response)
    
    def get_response(self, request):
        """Mock response function."""
        return JsonResponse({'success': True})
    
    def test_sql_injection_detection(self):
        """Test SQL injection attempt detection."""
        # Test with query string
        request = self.factory.get('/api/test/?id=1 UNION SELECT * FROM users')
        
        is_sql_injection = self.middleware._check_sql_injection(request)
        self.assertTrue(is_sql_injection)
        
        # Test with path
        request = self.factory.get('/api/test/DROP TABLE users')
        
        is_sql_injection = self.middleware._check_sql_injection(request)
        self.assertTrue(is_sql_injection)
        
        # Test safe request
        request = self.factory.get('/api/test/?id=123')
        
        is_sql_injection = self.middleware._check_sql_injection(request)
        self.assertFalse(is_sql_injection)
    
    def test_xss_detection(self):
        """Test XSS attempt detection."""
        # Test with script tag
        request = self.factory.get('/api/test/?name=<script>alert(1)</script>')
        
        is_xss = self.middleware._check_xss_attempt(request)
        self.assertTrue(is_xss)
        
        # Test with javascript protocol
        request = self.factory.get('/api/test/?url=javascript:alert(1)')
        
        is_xss = self.middleware._check_xss_attempt(request)
        self.assertTrue(is_xss)
        
        # Test safe request
        request = self.factory.get('/api/test/?name=John')
        
        is_xss = self.middleware._check_xss_attempt(request)
        self.assertFalse(is_xss)
    
    def test_path_traversal_detection(self):
        """Test path traversal attempt detection."""
        # Test with ../ pattern
        request = self.factory.get('/api/test/../../../etc/passwd')
        
        is_path_traversal = self.middleware._check_path_traversal(request)
        self.assertTrue(is_path_traversal)
        
        # Test with ..\ pattern
        request = self.factory.get('/api/test/..\\..\\windows\\system32')
        
        is_path_traversal = self.middleware._check_path_traversal(request)
        self.assertTrue(is_path_traversal)
        
        # Test safe request
        request = self.factory.get('/api/test/normal/path')
        
        is_path_traversal = self.middleware._check_path_traversal(request)
        self.assertFalse(is_path_traversal)
    
    @patch('core.middleware.logging.SecurityEventLoggingMiddleware._log_security_event')
    def test_suspicious_activity_logging(self, mock_log_event):
        """Test logging of suspicious activities."""
        # SQL injection attempt
        request = self.factory.get('/api/test/?id=1 UNION SELECT')
        
        self.middleware._check_suspicious_activity(request)
        
        mock_log_event.assert_called_with(request, 'sql_injection_attempt', 'high')
    
    @patch('core.middleware.logging.SecurityEventLoggingMiddleware._log_security_event')
    def test_authentication_failure_logging(self, mock_log_event):
        """Test logging of authentication failures."""
        def auth_failure_response(request):
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        middleware = SecurityEventLoggingMiddleware(auth_failure_response)
        request = self.factory.post('/api/auth/login/')
        
        response = middleware(request)
        
        mock_log_event.assert_called_with(request, 'authentication_failure', 'medium')
    
    @patch('core.middleware.logging.SecurityEventLoggingMiddleware._log_security_event')
    def test_admin_access_logging(self, mock_log_event):
        """Test logging of admin access."""
        def admin_response(request):
            return JsonResponse({'success': True}, status=200)
        
        middleware = SecurityEventLoggingMiddleware(admin_response)
        request = self.factory.get('/admin/dashboard/')
        
        response = middleware(request)
        
        mock_log_event.assert_called_with(request, 'admin_access', 'low')
    
    @patch('core.middleware.logging.SecurityEventLoggingMiddleware.security_logger')
    @override_settings(STRUCTURED_LOGGING=True)
    def test_security_event_structured_logging(self, mock_security_logger):
        """Test structured logging of security events."""
        request = self.factory.get('/api/test/')
        request.request_id = 'security-test'
        request.user = MagicMock()
        request.user.is_authenticated = True
        request.user.user_id = 456
        
        self.middleware._log_security_event(request, 'test_event', 'high')
        
        # Verify security logger was called
        mock_security_logger.log.assert_called()
        
        call_args = mock_security_logger.log.call_args
        log_level = call_args[0][0]
        log_message = call_args[0][1]
        
        # Parse JSON log message
        log_data = json.loads(log_message)
        
        self.assertEqual(log_data['level'], 'error')  # High severity = error level
        self.assertEqual(log_data['security']['eventType'], 'test_event')
        self.assertEqual(log_data['security']['severity'], 'high')
        self.assertEqual(log_data['security']['requestId'], 'security-test')
        self.assertEqual(log_data['security']['userId'], 456)
    
    def test_client_ip_extraction(self):
        """Test client IP extraction for security logging."""
        request = self.factory.get('/api/test/')
        request.META['HTTP_X_FORWARDED_FOR'] = '192.168.1.100, 10.0.0.1'
        
        ip = self.middleware._get_client_ip(request)
        self.assertEqual(ip, '192.168.1.100')


class LoggingMiddlewareIntegrationTest(TestCase):
    """Integration tests for logging middleware."""
    
    def setUp(self):
        self.factory = RequestFactory()
    
    @patch('core.middleware.logging.logger')
    @patch('core.middleware.logging.SecurityEventLoggingMiddleware.security_logger')
    def test_full_logging_stack(self, mock_security_logger, mock_logger):
        """Test full logging middleware stack."""
        def get_response(request):
            return JsonResponse({'success': True})
        
        # Build middleware stack
        middleware_stack = RequestLoggingMiddleware(
            SecurityEventLoggingMiddleware(get_response)
        )
        
        request = self.factory.get('/api/test/?id=1 UNION SELECT')
        request.request_id = 'integration-test'
        request.user = MagicMock()
        request.user.is_authenticated = False
        
        response = middleware_stack(request)
        
        # Verify both loggers were called
        mock_logger.log.assert_called()  # Request logging
        mock_security_logger.log.assert_called()  # Security event logging
        
        self.assertEqual(response.status_code, 200)
    
    def test_performance_impact(self):
        """Test that logging middleware doesn't significantly impact performance."""
        def get_response(request):
            return JsonResponse({'success': True})
        
        middleware = RequestLoggingMiddleware(get_response)
        request = self.factory.get('/api/test/')
        request.request_id = 'perf-test'
        
        start_time = time.time()
        
        # Run multiple requests
        for i in range(100):
            response = middleware(request)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Should complete 100 requests in reasonable time (< 1 second)
        self.assertLess(duration, 1.0)