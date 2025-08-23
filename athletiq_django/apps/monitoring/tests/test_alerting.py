import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from apps.monitoring.services.alerting import AlertingService
from apps.monitoring.models import AlertRule, Alert, SystemMetrics

User = get_user_model()


class AlertingServiceTest(TestCase):
    """Test cases for AlertingService."""
    
    def setUp(self):
        self.alerting_service = AlertingService()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_should_trigger_alert_true(self):
        """Test alert should be triggered when threshold is exceeded."""
        # Create alert rule
        rule = AlertRule.objects.create(
            name='High Response Time',
            metric_type='api_response_time',
            condition='gt',
            threshold=1000.0,
            severity='high',
            notification_emails=['admin@example.com']
        )
        
        # Create metrics that exceed threshold
        SystemMetrics.objects.create(
            metric_type='api_response_time',
            value=1500.0,
            timestamp=timezone.now()
        )
        
        should_trigger = self.alerting_service._should_trigger_alert(rule)
        self.assertTrue(should_trigger)
    
    def test_should_trigger_alert_false(self):
        """Test alert should not be triggered when threshold is not exceeded."""
        # Create alert rule
        rule = AlertRule.objects.create(
            name='High Response Time',
            metric_type='api_response_time',
            condition='gt',
            threshold=1000.0,
            severity='high'
        )
        
        # Create metrics that don't exceed threshold
        SystemMetrics.objects.create(
            metric_type='api_response_time',
            value=500.0,
            timestamp=timezone.now()
        )
        
        should_trigger = self.alerting_service._should_trigger_alert(rule)
        self.assertFalse(should_trigger)
    
    def test_should_not_trigger_existing_active_alert(self):
        """Test alert should not be triggered if there's already an active alert."""
        # Create alert rule
        rule = AlertRule.objects.create(
            name='High Response Time',
            metric_type='api_response_time',
            condition='gt',
            threshold=1000.0,
            severity='high'
        )
        
        # Create existing active alert
        Alert.objects.create(
            rule=rule,
            status='active',
            trigger_value=1200.0,
            message='Test alert'
        )
        
        # Create metrics that exceed threshold
        SystemMetrics.objects.create(
            metric_type='api_response_time',
            value=1500.0,
            timestamp=timezone.now()
        )
        
        should_trigger = self.alerting_service._should_trigger_alert(rule)
        self.assertFalse(should_trigger)
    
    @patch('apps.monitoring.services.alerting.send_mail')
    def test_trigger_alert(self, mock_send_mail):
        """Test triggering an alert."""
        # Create alert rule
        rule = AlertRule.objects.create(
            name='High Response Time',
            metric_type='api_response_time',
            condition='gt',
            threshold=1000.0,
            severity='high',
            notification_emails=['admin@example.com']
        )
        
        # Create metric
        SystemMetrics.objects.create(
            metric_type='api_response_time',
            value=1500.0,
            timestamp=timezone.now()
        )
        
        initial_alert_count = Alert.objects.count()
        alert = self.alerting_service._trigger_alert(rule)
        
        self.assertEqual(Alert.objects.count(), initial_alert_count + 1)
        self.assertEqual(alert.rule, rule)
        self.assertEqual(alert.status, 'active')
        self.assertEqual(alert.trigger_value, 1500.0)
        
        # Verify email was sent
        mock_send_mail.assert_called_once()
    
    def test_acknowledge_alert(self):
        """Test acknowledging an alert."""
        # Create alert rule and alert
        rule = AlertRule.objects.create(
            name='Test Alert',
            metric_type='api_response_time',
            condition='gt',
            threshold=1000.0,
            severity='high'
        )
        
        alert = Alert.objects.create(
            rule=rule,
            status='active',
            trigger_value=1200.0,
            message='Test alert'
        )
        
        success = self.alerting_service.acknowledge_alert(alert.id, self.user)
        
        self.assertTrue(success)
        
        alert.refresh_from_db()
        self.assertEqual(alert.status, 'acknowledged')
        self.assertEqual(alert.acknowledged_by, self.user)
        self.assertIsNotNone(alert.acknowledged_at)
    
    def test_resolve_alert(self):
        """Test resolving an alert."""
        # Create alert rule and alert
        rule = AlertRule.objects.create(
            name='Test Alert',
            metric_type='api_response_time',
            condition='gt',
            threshold=1000.0,
            severity='high'
        )
        
        alert = Alert.objects.create(
            rule=rule,
            status='active',
            trigger_value=1200.0,
            message='Test alert'
        )
        
        success = self.alerting_service.resolve_alert(alert.id, self.user)
        
        self.assertTrue(success)
        
        alert.refresh_from_db()
        self.assertEqual(alert.status, 'resolved')
        self.assertIsNotNone(alert.resolved_at)
    
    def test_get_active_alerts(self):
        """Test getting active alerts."""
        # Create alert rule and alerts
        rule = AlertRule.objects.create(
            name='Test Alert',
            metric_type='api_response_time',
            condition='gt',
            threshold=1000.0,
            severity='high'
        )
        
        # Active alert
        Alert.objects.create(
            rule=rule,
            status='active',
            trigger_value=1200.0,
            message='Active alert'
        )
        
        # Acknowledged alert
        Alert.objects.create(
            rule=rule,
            status='acknowledged',
            trigger_value=1300.0,
            message='Acknowledged alert'
        )
        
        # Resolved alert (should not be included)
        Alert.objects.create(
            rule=rule,
            status='resolved',
            trigger_value=1100.0,
            message='Resolved alert'
        )
        
        active_alerts = self.alerting_service.get_active_alerts()
        
        self.assertEqual(len(active_alerts), 2)
        statuses = [alert['status'] for alert in active_alerts]
        self.assertIn('active', statuses)
        self.assertIn('acknowledged', statuses)
        self.assertNotIn('resolved', statuses)


class AlertingViewsTest(TestCase):
    """Test cases for alerting API endpoints."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_active_alerts_requires_auth(self):
        """Test active alerts endpoint requires authentication."""
        url = reverse('monitoring:active_alerts')
        
        # Without authentication
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # With authentication
        self.client.force_login(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_acknowledge_alert_endpoint(self):
        """Test acknowledge alert endpoint."""
        self.client.force_login(self.user)
        
        # Create alert
        rule = AlertRule.objects.create(
            name='Test Alert',
            metric_type='api_response_time',
            condition='gt',
            threshold=1000.0,
            severity='high'
        )
        
        alert = Alert.objects.create(
            rule=rule,
            status='active',
            trigger_value=1200.0,
            message='Test alert'
        )
        
        url = reverse('monitoring:acknowledge_alert', kwargs={'alert_id': alert.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        alert.refresh_from_db()
        self.assertEqual(alert.status, 'acknowledged')
    
    def test_resolve_alert_endpoint(self):
        """Test resolve alert endpoint."""
        self.client.force_login(self.user)
        
        # Create alert
        rule = AlertRule.objects.create(
            name='Test Alert',
            metric_type='api_response_time',
            condition='gt',
            threshold=1000.0,
            severity='high'
        )
        
        alert = Alert.objects.create(
            rule=rule,
            status='active',
            trigger_value=1200.0,
            message='Test alert'
        )
        
        url = reverse('monitoring:resolve_alert', kwargs={'alert_id': alert.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        alert.refresh_from_db()
        self.assertEqual(alert.status, 'resolved')
    
    def test_acknowledge_nonexistent_alert(self):
        """Test acknowledging non-existent alert returns error."""
        self.client.force_login(self.user)
        
        url = reverse('monitoring:acknowledge_alert', kwargs={'alert_id': 99999})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)