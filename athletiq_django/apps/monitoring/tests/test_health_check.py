import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from apps.monitoring.services.health_check import HealthCheckService
from apps.monitoring.models import HealthCheckLog

User = get_user_model()


class HealthCheckServiceTest(TestCase):
    """Test cases for HealthCheckService."""
    
    def setUp(self):
        self.health_service = HealthCheckService()
    
    def test_database_check_healthy(self):
        """Test database health check returns healthy status."""
        result = self.health_service._check_database()
        
        self.assertEqual(result['status'], 'healthy')
        self.assertIn('response_time', result)
        self.assertIn('details', result)
        self.assertGreater(result['response_time'], 0)
    
    def test_redis_check_healthy(self):
        """Test Redis health check returns healthy status."""
        result = self.health_service._check_redis()
        
        self.assertIn(result['status'], ['healthy', 'degraded'])
        self.assertIn('response_time', result)
    
    @patch('apps.monitoring.services.health_check.get_connection')
    def test_email_service_check(self, mock_get_connection):
        """Test email service health check."""
        mock_connection = MagicMock()
        mock_get_connection.return_value = mock_connection
        
        result = self.health_service._check_email_service()
        
        self.assertEqual(result['status'], 'healthy')
        mock_connection.open.assert_called_once()
        mock_connection.close.assert_called_once()
    
    @patch('apps.monitoring.services.health_check.default_storage')
    def test_file_storage_check(self, mock_storage):
        """Test file storage health check."""
        mock_storage.save.return_value = 'test_file.txt'
        mock_storage.exists.return_value = True
        
        result = self.health_service._check_file_storage()
        
        self.assertEqual(result['status'], 'healthy')
        mock_storage.save.assert_called_once()
        mock_storage.exists.assert_called_once()
        mock_storage.delete.assert_called_once()
    
    def test_run_single_check_invalid_service(self):
        """Test running health check for invalid service raises error."""
        with self.assertRaises(ValueError):
            self.health_service.run_single_check('invalid_service')
    
    def test_run_all_checks(self):
        """Test running all health checks."""
        result = self.health_service.run_all_checks()
        
        self.assertIn('overall_status', result)
        self.assertIn('checks', result)
        self.assertIn('timestamp', result)
        self.assertIn('database', result['checks'])
        self.assertIn('redis', result['checks'])
    
    def test_health_check_logging(self):
        """Test that health checks are logged to database."""
        initial_count = HealthCheckLog.objects.count()
        
        self.health_service.run_single_check('database')
        
        self.assertEqual(HealthCheckLog.objects.count(), initial_count + 1)
        
        log_entry = HealthCheckLog.objects.latest('timestamp')
        self.assertEqual(log_entry.service, 'database')
        self.assertIn(log_entry.status, ['healthy', 'degraded', 'unhealthy'])


class HealthCheckViewsTest(TestCase):
    """Test cases for health check API endpoints."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_basic_health_check_no_auth(self):
        """Test basic health check endpoint doesn't require authentication."""
        url = reverse('monitoring:health_check')
        response = self.client.get(url)
        
        self.assertIn(response.status_code, [200, 503])
        
        data = json.loads(response.content)
        self.assertIn('status', data)
        self.assertIn('timestamp', data)
        self.assertIn('checks', data)
    
    def test_detailed_health_check_requires_auth(self):
        """Test detailed health check requires authentication."""
        url = reverse('monitoring:detailed_health_check')
        
        # Without authentication
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # With authentication
        self.client.force_login(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_service_health_history(self):
        """Test service health history endpoint."""
        self.client.force_login(self.user)
        
        # Create some test data
        HealthCheckLog.objects.create(
            service='database',
            status='healthy',
            response_time=50.0
        )
        
        url = reverse('monitoring:service_health_history', kwargs={'service_name': 'database'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = json.loads(response.content)
        self.assertEqual(data['service'], 'database')
        self.assertIn('history', data)
    
    def test_service_health_history_invalid_hours(self):
        """Test service health history with invalid hours parameter."""
        self.client.force_login(self.user)
        
        url = reverse('monitoring:service_health_history', kwargs={'service_name': 'database'})
        response = self.client.get(url, {'hours': 'invalid'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_system_metrics_endpoint(self):
        """Test system metrics endpoint."""
        self.client.force_login(self.user)
        
        url = reverse('monitoring:system_metrics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = json.loads(response.content)
        self.assertIn('timestamp', data)
        self.assertIn('metrics', data)
    
    def test_system_status_dashboard(self):
        """Test system status dashboard endpoint."""
        self.client.force_login(self.user)
        
        url = reverse('monitoring:system_status')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = json.loads(response.content)
        self.assertIn('overall_status', data)
        self.assertIn('health_checks', data)
        self.assertIn('system_metrics', data)
        self.assertIn('active_alerts', data)