import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from apps.monitoring.services.metrics import MetricsCollectionService
from apps.monitoring.models import SystemMetrics

User = get_user_model()


class MetricsCollectionServiceTest(TestCase):
    """Test cases for MetricsCollectionService."""
    
    def setUp(self):
        self.metrics_service = MetricsCollectionService()
    
    @patch('apps.monitoring.services.metrics.psutil')
    def test_collect_system_metrics(self, mock_psutil):
        """Test collecting system metrics."""
        # Mock psutil responses
        mock_memory = MagicMock()
        mock_memory.percent = 75.5
        mock_memory.total = 8589934592  # 8GB
        mock_memory.available = 2147483648  # 2GB
        mock_memory.used = 6442450944  # 6GB
        
        mock_psutil.virtual_memory.return_value = mock_memory
        mock_psutil.cpu_percent.return_value = 45.2
        
        metrics = self.metrics_service.collect_system_metrics()
        
        self.assertIn('memory_usage', metrics)
        self.assertIn('cpu_usage', metrics)
        self.assertEqual(metrics['memory_usage']['value'], 75.5)
        self.assertEqual(metrics['cpu_usage']['value'], 45.2)
    
    def test_collect_api_metrics(self):
        """Test collecting API metrics."""
        initial_count = SystemMetrics.objects.count()
        
        self.metrics_service.collect_api_metrics(
            endpoint='/api/schools/',
            response_time=150.5,
            status_code=200,
            user_agent='TestAgent/1.0'
        )
        
        self.assertEqual(SystemMetrics.objects.count(), initial_count + 1)
        
        metric = SystemMetrics.objects.latest('timestamp')
        self.assertEqual(metric.metric_type, 'api_response_time')
        self.assertEqual(metric.value, 150.5)
        self.assertEqual(metric.endpoint, '/api/schools/')
        self.assertEqual(metric.user_agent, 'TestAgent/1.0')
    
    def test_get_metrics_summary(self):
        """Test getting metrics summary."""
        # Create test data
        now = timezone.now()
        
        SystemMetrics.objects.create(
            metric_type='api_response_time',
            value=100.0,
            endpoint='/api/schools/',
            timestamp=now - timedelta(hours=1)
        )
        
        SystemMetrics.objects.create(
            metric_type='api_response_time',
            value=200.0,
            endpoint='/api/schools/',
            timestamp=now - timedelta(hours=2)
        )
        
        SystemMetrics.objects.create(
            metric_type='memory_usage',
            value=75.5,
            timestamp=now - timedelta(hours=1)
        )
        
        summary = self.metrics_service.get_metrics_summary(hours=24)
        
        self.assertIn('metrics', summary)
        self.assertIn('api_performance', summary['metrics'])
        self.assertIn('system_resources', summary['metrics'])
    
    def test_cleanup_old_metrics(self):
        """Test cleaning up old metrics."""
        # Create old metrics
        old_timestamp = timezone.now() - timedelta(days=35)
        
        SystemMetrics.objects.create(
            metric_type='api_response_time',
            value=100.0,
            timestamp=old_timestamp
        )
        
        recent_timestamp = timezone.now() - timedelta(days=5)
        
        SystemMetrics.objects.create(
            metric_type='api_response_time',
            value=150.0,
            timestamp=recent_timestamp
        )
        
        initial_count = SystemMetrics.objects.count()
        deleted_count = self.metrics_service.cleanup_old_metrics(days=30)
        
        self.assertEqual(deleted_count, 1)
        self.assertEqual(SystemMetrics.objects.count(), initial_count - 1)
        
        # Verify only recent metrics remain
        remaining_metrics = SystemMetrics.objects.all()
        for metric in remaining_metrics:
            self.assertGreater(metric.timestamp, timezone.now() - timedelta(days=30))


class MetricsViewsTest(TestCase):
    """Test cases for metrics API endpoints."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_system_metrics_requires_auth(self):
        """Test system metrics endpoint requires authentication."""
        url = reverse('monitoring:system_metrics')
        
        # Without authentication
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # With authentication
        self.client.force_login(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_metrics_summary_endpoint(self):
        """Test metrics summary endpoint."""
        self.client.force_login(self.user)
        
        # Create test data
        SystemMetrics.objects.create(
            metric_type='api_response_time',
            value=100.0,
            endpoint='/api/test/'
        )
        
        url = reverse('monitoring:metrics_summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = json.loads(response.content)
        self.assertIn('metrics', data)
        self.assertIn('period', data)
    
    def test_metrics_summary_invalid_hours(self):
        """Test metrics summary with invalid hours parameter."""
        self.client.force_login(self.user)
        
        url = reverse('monitoring:metrics_summary')
        response = self.client.get(url, {'hours': 'invalid'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    @patch('apps.monitoring.services.metrics.psutil')
    def test_system_metrics_collection(self, mock_psutil):
        """Test system metrics collection through endpoint."""
        self.client.force_login(self.user)
        
        # Mock psutil responses
        mock_memory = MagicMock()
        mock_memory.percent = 80.0
        mock_psutil.virtual_memory.return_value = mock_memory
        mock_psutil.cpu_percent.return_value = 50.0
        
        url = reverse('monitoring:system_metrics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = json.loads(response.content)
        self.assertIn('metrics', data)
        self.assertIn('timestamp', data)