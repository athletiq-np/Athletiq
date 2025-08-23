"""
Tests for error handling and logging system.
"""
import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, RequestFactory, override_settings
from django.http import JsonResponse
from django.core.cache import cache
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework import status

from core.exceptions import (
    custom_exception_handler,
    handle_unhandled_exception,
    format_drf_exception_response,
    get_error_message,
    get_safe_error_message
)
from core.monitoring.error_tracker import ErrorTracker, track_error, get_error_summary


class CustomExceptionHandlerTest(TestCase):
    """Test cases for custom exception handler."""
    
    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()
    
    def test_drf_validation_error_handling(self):
        """Test handling of DRF validation errors."""
        exc = ValidationError({'name': ['This field is required.']})
        request = self.factory.post('/api/test/')
        request.request_id = 'test-123'
        request.user = MagicMock()
        request.user.is_authenticated = False
        
        context = {'request': request}
        
        with patch('core.exceptions.exception_handler') as mock_handler:
            mock_response = Response({'name': ['This field is required.']}, status=400)
            mock_handler.return_value = mock_response
            
            response = custom_exception_handler(exc, context)
            
            self.assertEqual(response.status_code, 400)
            self.assertFalse(response.data['success'])
            self.assertIn('name', response.data['message'])
            self.assertEqual(response.data['error_type'], 'ValidationError')
            self.assertEqual(response.data['request_id'], 'test-123')
    
    def test_unhandled_exception_handling(self):
        """Test handling of unhandled exceptions."""
        exc = ValueError("Test error")
        request = self.factory.get('/api/test/')
        request.request_id = 'test-456'
        
        context = {'request': request}
        
        with patch('core.exceptions.exception_handler', return_value=None):
            response = custom_exception_handler(exc, context)
            
            self.assertEqual(response.status_code, 500)
            self.assertFalse(response.data['success'])
            self.assertEqual(response.data['error_type'], 'ValueError')
            self.assertEqual(response.data['request_id'], 'test-456')
    
    @override_settings(DEBUG=True)
    def test_debug_info_in_development(self):
        """Test that debug info is included in development."""
        exc = ValueError("Test error")
        request = self.factory.get('/api/test/')
        request.request_id = 'test-debug'
        
        context = {'request': request}
        
        with patch('core.exceptions.exception_handler', return_value=None):
            response = custom_exception_handler(exc, context)
            
            self.assertIn('debug', response.data)
            self.assertIn('exception', response.data['debug'])
            self.assertIn('traceback', response.data['debug'])
    
    @override_settings(DEBUG=False)
    def test_no_debug_info_in_production(self):
        """Test that debug info is not included in production."""
        exc = ValueError("Test error")
        request = self.factory.get('/api/test/')
        request.request_id = 'test-prod'
        
        context = {'request': request}
        
        with patch('core.exceptions.exception_handler', return_value=None):
            response = custom_exception_handler(exc, context)
            
            self.assertNotIn('debug', response.data)
    
    def test_permission_denied_handling(self):
        """Test handling of permission denied errors."""
        exc = PermissionDenied("Access denied")
        request = self.factory.get('/api/test/')
        request.request_id = 'test-perm'
        
        context = {'request': request}
        
        with patch('core.exceptions.exception_handler') as mock_handler:
            mock_response = Response({'detail': 'Access denied'}, status=403)
            mock_handler.return_value = mock_response
            
            response = custom_exception_handler(exc, context)
            
            self.assertEqual(response.status_code, 403)
            self.assertFalse(response.data['success'])
            self.assertEqual(response.data['message'], 'Access denied')
    
    def test_not_found_handling(self):
        """Test handling of not found errors."""
        exc = NotFound("Resource not found")
        request = self.factory.get('/api/test/123/')
        request.request_id = 'test-404'
        
        context = {'request': request}
        
        with patch('core.exceptions.exception_handler') as mock_handler:
            mock_response = Response({'detail': 'Resource not found'}, status=404)
            mock_handler.return_value = mock_response
            
            response = custom_exception_handler(exc, context)
            
            self.assertEqual(response.status_code, 404)
            self.assertFalse(response.data['success'])
            self.assertEqual(response.data['message'], 'Resource not found')
    
    @patch('core.exceptions.log_exception')
    @patch('core.exceptions.track_error_metrics')
    def test_logging_and_metrics_called(self, mock_track_metrics, mock_log_exception):
        """Test that logging and metrics tracking are called."""
        exc = ValidationError("Test error")
        request = self.factory.post('/api/test/')
        request.request_id = 'test-logging'
        
        context = {'request': request}
        
        with patch('core.exceptions.exception_handler') as mock_handler:
            mock_response = Response({'detail': 'Test error'}, status=400)
            mock_handler.return_value = mock_response
            
            response = custom_exception_handler(exc, context)
            
            mock_log_exception.assert_called_once()
            mock_track_metrics.assert_called_once()


class ErrorTrackerTest(TestCase):
    """Test cases for ErrorTracker."""
    
    def setUp(self):
        self.error_tracker = ErrorTracker()
        cache.clear()
    
    def test_track_error(self):
        """Test error tracking functionality."""
        details = {
            'path': '/api/test/',
            'method': 'POST',
            'user_id': 123
        }
        
        self.error_tracker.track_error('validation_error', details, 'medium')
        
        # Check that error was tracked
        summary = self.error_tracker.get_error_summary(1)
        self.assertGreater(summary['total_errors'], 0)
        self.assertIn('validation_error', summary['by_type'])
    
    def test_error_summary(self):
        """Test error summary generation."""
        # Track some errors
        for i in range(5):
            self.error_tracker.track_error('server_error', {'count': i}, 'high')
        
        for i in range(3):
            self.error_tracker.track_error('auth_failure', {'count': i}, 'medium')
        
        summary = self.error_tracker.get_error_summary(1)
        
        self.assertEqual(summary['total_errors'], 8)
        self.assertEqual(summary['by_type']['server_errors'], 5)
        self.assertEqual(summary['by_type']['auth_failures'], 3)
        self.assertGreater(len(summary['recent_errors']), 0)
    
    def test_error_metrics(self):
        """Test error metrics calculation."""
        # Track some errors
        self.error_tracker.track_error('server_error', {}, 'high')
        self.error_tracker.track_error('validation_error', {}, 'medium')
        
        metrics = self.error_tracker.get_error_metrics()
        
        self.assertIn('error_rate_1h', metrics)
        self.assertIn('error_rate_24h', metrics)
        self.assertIn('top_errors', metrics)
        self.assertIn('error_distribution', metrics)
        self.assertIn('alert_status', metrics)
    
    def test_alert_thresholds(self):
        """Test alert threshold checking."""
        # Track enough errors to trigger alert
        for i in range(15):  # Above server_errors threshold of 10
            self.error_tracker.track_error('server_errors', {'count': i}, 'high')
        
        # Check alert status
        metrics = self.error_tracker.get_error_metrics()
        alert_status = metrics['alert_status']['server_errors']
        
        self.assertEqual(alert_status['status'], 'alert')
        self.assertGreaterEqual(alert_status['current'], alert_status['threshold'])
    
    @patch('core.monitoring.error_tracker.send_mail')
    @override_settings(SEND_ERROR_ALERTS=True, ADMIN_EMAILS=['admin@test.com'])
    def test_email_alert_sending(self, mock_send_mail):
        """Test email alert sending."""
        # Track enough errors to trigger alert
        for i in range(15):
            self.error_tracker.track_error('server_errors', {'count': i}, 'critical')
        
        # Verify email was sent
        mock_send_mail.assert_called()
    
    def test_error_trends_calculation(self):
        """Test error trends calculation."""
        import time
        
        # Mock current time to control hour buckets
        with patch('time.time', return_value=3600 * 100):  # Hour 100
            self.error_tracker.track_error('server_error', {}, 'medium')
        
        with patch('time.time', return_value=3600 * 101):  # Hour 101
            for i in range(3):
                self.error_tracker.track_error('server_error', {}, 'medium')
        
        with patch('time.time', return_value=3600 * 101 + 1800):  # Still hour 101
            summary = self.error_tracker.get_error_summary(2)
            trends = summary['trends']
            
            self.assertIn('server_errors', trends)
            self.assertEqual(trends['server_errors']['previous_hour'], 1)
            self.assertEqual(trends['server_errors']['current_hour'], 3)
            self.assertGreater(trends['server_errors']['trend_percentage'], 0)


class ErrorHandlingIntegrationTest(TestCase):
    """Integration tests for error handling system."""
    
    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()
    
    @patch('core.exceptions.error_logger')
    @override_settings(STRUCTURED_LOGGING=True)
    def test_structured_error_logging(self, mock_logger):
        """Test structured error logging format."""
        exc = ValidationError("Test validation error")
        request = self.factory.post('/api/test/')
        request.request_id = 'integration-test'
        request.user = MagicMock()
        request.user.is_authenticated = True
        request.user.user_id = 42
        
        context = {'request': request}
        
        with patch('core.exceptions.exception_handler') as mock_handler:
            mock_response = Response({'detail': 'Test validation error'}, status=400)
            mock_handler.return_value = mock_response
            
            response = custom_exception_handler(exc, context)
            
            # Verify structured logging was called
            mock_logger.log.assert_called()
            
            # Get the logged data
            call_args = mock_logger.log.call_args
            log_message = call_args[0][1]
            log_data = json.loads(log_message)
            
            self.assertEqual(log_data['level'], 'error')
            self.assertEqual(log_data['error']['name'], 'ValidationError')
            self.assertEqual(log_data['request']['requestId'], 'integration-test')
            self.assertEqual(log_data['request']['userId'], 42)
            self.assertEqual(log_data['response']['statusCode'], 400)
    
    def test_error_tracking_integration(self):
        """Test integration between exception handler and error tracker."""
        exc = ValueError("Integration test error")
        request = self.factory.get('/api/test/')
        request.request_id = 'integration-error'
        
        context = {'request': request}
        
        with patch('core.exceptions.exception_handler', return_value=None):
            with patch('core.monitoring.error_tracker.track_error') as mock_track:
                response = custom_exception_handler(exc, context)
                
                # Verify error was tracked
                mock_track.assert_called()
    
    def test_full_error_handling_pipeline(self):
        """Test the complete error handling pipeline."""
        # Create a request that will cause an error
        request = self.factory.post('/api/test/', {'invalid': 'data'})
        request.request_id = 'pipeline-test'
        request.user = MagicMock()
        request.user.is_authenticated = False
        
        # Simulate validation error
        exc = ValidationError({'name': ['This field is required.']})
        context = {'request': request}
        
        with patch('core.exceptions.exception_handler') as mock_handler:
            mock_response = Response({'name': ['This field is required.']}, status=400)
            mock_handler.return_value = mock_response
            
            # Process the exception
            response = custom_exception_handler(exc, context)
            
            # Verify response format
            self.assertEqual(response.status_code, 400)
            self.assertFalse(response.data['success'])
            self.assertIn('name', response.data['message'])
            self.assertEqual(response.data['status'], 400)
            self.assertEqual(response.data['request_id'], 'pipeline-test')
            
            # Verify error was tracked in metrics
            summary = get_error_summary(1)
            self.assertGreater(summary['total_errors'], 0)


class SafeErrorMessageTest(TestCase):
    """Test cases for safe error message generation."""
    
    @override_settings(DEBUG=False)
    def test_production_error_messages(self):
        """Test that production error messages are generic."""
        test_cases = [
            (ValueError("Sensitive info"), 500, "Internal server error"),
            (FileNotFoundError("Secret path"), 404, "Not found"),
            (PermissionError("Admin only"), 403, "Permission denied"),
        ]
        
        for exc, status_code, expected_message in test_cases:
            message = get_safe_error_message(exc, status_code)
            self.assertEqual(message, expected_message)
    
    @override_settings(DEBUG=True)
    def test_development_error_messages(self):
        """Test that development error messages show details."""
        exc = ValueError("Detailed error message")
        message = get_safe_error_message(exc, 500)
        self.assertEqual(message, "Detailed error message")


class ErrorMessageExtractionTest(TestCase):
    """Test cases for error message extraction."""
    
    def test_dict_detail_extraction(self):
        """Test extraction from dict detail."""
        exc = ValidationError({'name': ['Required field'], 'email': ['Invalid email']})
        response = Response({'name': ['Required field'], 'email': ['Invalid email']}, status=400)
        
        message = get_error_message(exc, response)
        self.assertIn('name', message)
        self.assertIn('Required field', message)
    
    def test_list_detail_extraction(self):
        """Test extraction from list detail."""
        exc = ValidationError(['First error', 'Second error'])
        response = Response(['First error', 'Second error'], status=400)
        
        message = get_error_message(exc, response)
        self.assertEqual(message, 'First error')
    
    def test_string_detail_extraction(self):
        """Test extraction from string detail."""
        exc = ValidationError('Simple error message')
        response = Response({'detail': 'Simple error message'}, status=400)
        
        message = get_error_message(exc, response)
        self.assertEqual(message, 'Simple error message')