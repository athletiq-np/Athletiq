from unittest.mock import patch, MagicMock
from django.test import TestCase, RequestFactory
from django.http import HttpResponse
from apps.monitoring.middleware import MetricsCollectionMiddleware
from apps.monitoring.models import SystemMetrics


class MetricsCollectionMiddlewareTest(TestCase):
    """Test cases for MetricsCollectionMiddleware."""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.get_response = MagicMock(return_value=HttpResponse('OK'))
        self.middleware = MetricsCollectionMiddleware(self.get_response)
    
    def test_process_request_sets_start_time(self):
        """Test that process_request sets start time on request."""
        request = self.factory.get('/api/test/')
        
        self.middleware.process_request(request)
        
        self.assertTrue(hasattr(request, '_metrics_start_time'))
        self.assertIsInstance(request._metrics_start_time, float)
    
    @patch('apps.monitoring.middleware.MetricsCollectionService')
    def test_process_response_collects_metrics(self, mock_metrics_service_class):
        """Test that process_response collects metrics."""
        mock_metrics_service = MagicMock()
        mock_metrics_service_class.return_value = mock_metrics_service
        
        # Create middleware instance with mocked service
        middleware = MetricsCollectionMiddleware(self.get_response)
        
        request = self.factory.get('/api/test/')
        request._metrics_start_time = 1000.0
        response = HttpResponse('OK')
        
        with patch('time.time', return_value=1000.1):  # 100ms later
            processed_response = middleware.process_response(request, response)
        
        # Verify metrics were collected
        mock_metrics_service.collect_api_metrics.assert_called_once()
        call_args = mock_metrics_service.collect_api_metrics.call_args
        
        self.assertEqual(call_args[1]['endpoint'], '/api/test/')
        self.assertEqual(call_args[1]['status_code'], 200)
        self.assertAlmostEqual(call_args[1]['response_time'], 100.0, places=1)
        
        # Verify response time header was added
        self.assertIn('X-Response-Time', processed_response)
    
    def test_process_response_without_start_time(self):
        """Test process_response handles missing start time gracefully."""
        request = self.factory.get('/api/test/')
        # Don't set _metrics_start_time
        response = HttpResponse('OK')
        
        # Should not raise an exception
        processed_response = self.middleware.process_response(request, response)
        
        self.assertEqual(processed_response, response)
    
    @patch('apps.monitoring.middleware.logger')
    @patch('apps.monitoring.middleware.MetricsCollectionService')
    def test_process_response_handles_exceptions(self, mock_metrics_service_class, mock_logger):
        """Test that process_response handles exceptions gracefully."""
        mock_metrics_service = MagicMock()
        mock_metrics_service.collect_api_metrics.side_effect = Exception('Test error')
        mock_metrics_service_class.return_value = mock_metrics_service
        
        middleware = MetricsCollectionMiddleware(self.get_response)
        
        request = self.factory.get('/api/test/')
        request._metrics_start_time = 1000.0
        response = HttpResponse('OK')
        
        with patch('time.time', return_value=1000.1):
            processed_response = middleware.process_response(request, response)
        
        # Should still return the response
        self.assertEqual(processed_response, response)
        
        # Should log the error
        mock_logger.error.assert_called_once()
    
    def test_middleware_integration(self):
        """Test middleware integration with actual metrics collection."""
        request = self.factory.get('/api/test/')
        request.META['HTTP_USER_AGENT'] = 'TestAgent/1.0'
        
        # Process request
        self.middleware.process_request(request)
        
        # Simulate some processing time
        import time
        time.sleep(0.01)  # 10ms
        
        response = HttpResponse('OK')
        
        initial_count = SystemMetrics.objects.count()
        
        # Process response
        processed_response = self.middleware.process_response(request, response)
        
        # Verify metrics were stored
        self.assertEqual(SystemMetrics.objects.count(), initial_count + 1)
        
        metric = SystemMetrics.objects.latest('timestamp')
        self.assertEqual(metric.metric_type, 'api_response_time')
        self.assertEqual(metric.endpoint, '/api/test/')
        self.assertEqual(metric.user_agent, 'TestAgent/1.0')
        self.assertGreater(metric.value, 0)  # Should have some response time
        
        # Verify response header
        self.assertIn('X-Response-Time', processed_response)
        self.assertTrue(processed_response['X-Response-Time'].endswith('ms'))