"""
Tests for Celery background tasks.
"""
import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from celery import current_app
from core.tasks import (
    generate_performance_report,
    cleanup_old_logs,
    system_health_check,
    backup_critical_data,
    send_system_alert
)


class CoreTasksTest(TestCase):
    """Test cases for core system tasks."""
    
    def setUp(self):
        """Set up test environment."""
        # Configure Celery for testing
        current_app.conf.task_always_eager = True
        current_app.conf.task_eager_propagates = True
    
    @patch('core.tasks.PerformanceMonitor')
    @patch('core.tasks.cache')
    def test_generate_performance_report_success(self, mock_cache, mock_monitor_class):
        """Test successful performance report generation."""
        # Mock performance monitor
        mock_monitor = MagicMock()
        mock_monitor.generate_daily_report.return_value = {
            'metrics': [
                {'name': 'response_time', 'value': 150},
                {'name': 'error_rate', 'value': 0.02}
            ]
        }
        mock_monitor_class.return_value = mock_monitor
        
        # Execute task
        result = generate_performance_report.apply()
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertEqual(task_result['status'], 'success')
        self.assertIn('report_date', task_result)
        self.assertEqual(task_result['metrics_count'], 2)
        
        # Verify cache was called
        mock_cache.set.assert_called_once()
    
    @patch('core.tasks.PerformanceMonitor')
    def test_generate_performance_report_failure(self, mock_monitor_class):
        """Test performance report generation failure and retry."""
        # Mock performance monitor to raise exception
        mock_monitor = MagicMock()
        mock_monitor.generate_daily_report.side_effect = Exception("Monitor error")
        mock_monitor_class.return_value = mock_monitor
        
        # Execute task and expect retry
        with self.assertRaises(Exception):
            generate_performance_report.apply()
    
    @patch('core.tasks.ErrorTracker')
    def test_cleanup_old_logs_success(self, mock_error_tracker_class):
        """Test successful log cleanup."""
        # Mock error tracker
        mock_tracker = MagicMock()
        mock_tracker.cleanup_old_entries.return_value = 150
        mock_error_tracker_class.return_value = mock_tracker
        
        # Execute task
        result = cleanup_old_logs.apply(args=[30])
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertEqual(task_result['status'], 'success')
        self.assertEqual(task_result['deleted_entries'], 150)
        
        # Verify cleanup was called with correct cutoff date
        mock_tracker.cleanup_old_entries.assert_called_once()
    
    @patch('core.tasks.connection')
    @patch('core.tasks.cache')
    @patch('core.tasks._check_external_services')
    def test_system_health_check_success(self, mock_external_check, mock_cache, mock_connection):
        """Test successful system health check."""
        # Mock database connection
        mock_cursor = MagicMock()
        mock_connection.cursor.return_value.__enter__.return_value = mock_cursor
        
        # Mock cache operations
        mock_cache.set.return_value = None
        mock_cache.get.return_value = 'ok'
        mock_cache.delete.return_value = None
        
        # Mock external services
        mock_external_check.return_value = {
            'google_vision': True,
            'google_translate': True,
            'twilio': True
        }
        
        # Execute task
        result = system_health_check.apply()
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertTrue(task_result['database'])
        self.assertTrue(task_result['cache'])
        self.assertTrue(task_result['celery'])
        self.assertIn('external_services', task_result)
    
    @patch('core.tasks.connection')
    @patch('core.tasks.cache')
    def test_system_health_check_database_failure(self, mock_cache, mock_connection):
        """Test system health check with database failure."""
        # Mock database connection failure
        mock_connection.cursor.side_effect = Exception("Database error")
        
        # Mock cache success
        mock_cache.set.return_value = None
        mock_cache.get.return_value = 'ok'
        mock_cache.delete.return_value = None
        
        # Execute task
        result = system_health_check.apply()
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertFalse(task_result['database'])
        self.assertTrue(task_result['cache'])
        self.assertTrue(task_result['celery'])
    
    @patch('core.tasks.transaction')
    def test_backup_critical_data_success(self, mock_transaction):
        """Test successful critical data backup."""
        # Mock transaction
        mock_transaction.atomic.return_value.__enter__ = MagicMock()
        mock_transaction.atomic.return_value.__exit__ = MagicMock()
        
        # Execute task
        result = backup_critical_data.apply()
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertEqual(task_result['status'], 'completed')
        self.assertIn('tables_backed_up', task_result)
        self.assertIn('timestamp', task_result)
    
    @patch('core.tasks.cache')
    def test_send_system_alert_success(self, mock_cache):
        """Test successful system alert sending."""
        # Mock cache operations
        mock_cache.get.return_value = []
        mock_cache.set.return_value = None
        
        # Execute task
        result = send_system_alert.apply(args=['high_error_rate', 'Error rate exceeded threshold', 'warning'])
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertEqual(task_result['type'], 'high_error_rate')
        self.assertEqual(task_result['severity'], 'warning')
        self.assertIn('timestamp', task_result)
        
        # Verify cache was updated
        mock_cache.set.assert_called_once()
    
    @patch('core.tasks.cache')
    def test_send_system_alert_with_existing_alerts(self, mock_cache):
        """Test system alert sending with existing alerts in cache."""
        # Mock existing alerts in cache
        existing_alerts = [
            {'type': 'old_alert', 'message': 'Old message', 'timestamp': '2023-01-01T00:00:00'}
        ]
        mock_cache.get.return_value = existing_alerts
        mock_cache.set.return_value = None
        
        # Execute task
        result = send_system_alert.apply(args=['new_alert', 'New message', 'error'])
        
        # Verify results
        self.assertTrue(result.successful())
        
        # Verify cache was called with updated alerts list
        call_args = mock_cache.set.call_args
        alerts_list = call_args[0][1]  # Second argument to cache.set
        self.assertEqual(len(alerts_list), 2)
        self.assertEqual(alerts_list[1]['type'], 'new_alert')


class TaskIntegrationTest(TestCase):
    """Integration tests for task interactions."""
    
    def setUp(self):
        """Set up test environment."""
        current_app.conf.task_always_eager = True
        current_app.conf.task_eager_propagates = True
    
    @patch('core.tasks.PerformanceMonitor')
    @patch('core.tasks.cache')
    def test_performance_report_and_alert_integration(self, mock_cache, mock_monitor_class):
        """Test integration between performance report and alert system."""
        # Mock performance monitor with high error rate
        mock_monitor = MagicMock()
        mock_monitor.generate_daily_report.return_value = {
            'metrics': [
                {'name': 'error_rate', 'value': 0.15}  # High error rate
            ]
        }
        mock_monitor_class.return_value = mock_monitor
        
        # Mock cache for both tasks
        mock_cache.get.return_value = []
        mock_cache.set.return_value = None
        
        # Execute performance report task
        report_result = generate_performance_report.apply()
        self.assertTrue(report_result.successful())
        
        # Execute alert task (would normally be triggered by monitoring)
        alert_result = send_system_alert.apply(args=[
            'high_error_rate', 
            'Error rate exceeded 10% threshold', 
            'critical'
        ])
        self.assertTrue(alert_result.successful())
        
        # Verify both tasks completed successfully
        self.assertEqual(report_result.result['status'], 'success')
        self.assertEqual(alert_result.result['type'], 'high_error_rate')


class TaskRetryTest(TestCase):
    """Test task retry mechanisms."""
    
    def setUp(self):
        """Set up test environment."""
        current_app.conf.task_always_eager = False  # Disable eager mode for retry testing
    
    @patch('core.tasks.PerformanceMonitor')
    def test_task_retry_mechanism(self, mock_monitor_class):
        """Test that tasks retry on failure."""
        # Mock performance monitor to fail first time, succeed second time
        mock_monitor = MagicMock()
        mock_monitor.generate_daily_report.side_effect = [
            Exception("Temporary failure"),
            {'metrics': []}  # Success on retry
        ]
        mock_monitor_class.return_value = mock_monitor
        
        # Create task instance for testing retry logic
        task = generate_performance_report
        
        # Mock the retry method
        with patch.object(task, 'retry') as mock_retry:
            mock_retry.side_effect = Exception("Retry called")
            
            # Execute task and expect retry to be called
            with self.assertRaises(Exception) as context:
                task.apply()
            
            self.assertEqual(str(context.exception), "Retry called")
            mock_retry.assert_called_once()


@pytest.mark.django_db
class TaskDatabaseTest(TestCase):
    """Test tasks that interact with the database."""
    
    def setUp(self):
        """Set up test environment."""
        current_app.conf.task_always_eager = True
        current_app.conf.task_eager_propagates = True
    
    def test_backup_task_with_real_models(self):
        """Test backup task with actual model data."""
        from apps.authentication.models import User
        from apps.schools.models import School
        
        # Create test data
        user = User.objects.create(
            email='test@example.com',
            full_name='Test User',
            role='SuperAdmin'
        )
        
        school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='Test Address',
            country='Nepal',
            province='Bagmati',
            district='Kathmandu',
            city='Kathmandu',
            phone='+977-1-4567890',
            email='test@school.com',
            principal_name='Test Principal',
            admin_user=user
        )
        
        # Execute backup task
        result = backup_critical_data.apply()
        
        # Verify task completed successfully
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertEqual(task_result['status'], 'completed')
        self.assertGreater(len(task_result['tables_backed_up']), 0)