"""
Tests for notification Celery tasks.
"""
import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from celery import current_app
from apps.notifications.tasks import (
    send_guardian_registration_notification_task,
    send_athlete_registration_notification_task,
    send_email_task,
    send_sms_task,
    send_reminder_notifications_task,
    cleanup_expired_claims_task,
    cleanup_expired_notifications
)
from apps.notifications.models import GuardianClaim, NotificationLog
from apps.athletes.models import Athlete
from apps.schools.models import School
from apps.authentication.models import User


class NotificationTasksTest(TestCase):
    """Test cases for notification tasks."""
    
    def setUp(self):
        """Set up test environment."""
        # Configure Celery for testing
        current_app.conf.task_always_eager = True
        current_app.conf.task_eager_propagates = True
        
        # Create test data
        self.user = User.objects.create(
            email='admin@school.com',
            full_name='School Admin',
            role='SchoolAdmin'
        )
        
        self.school = School.objects.create(
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
            admin_user=self.user
        )
        
        self.athlete = Athlete.objects.create(
            full_name='Test Athlete',
            gender='Male',
            date_of_birth='2010-05-15',
            school=self.school,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234567',
            address='Test Address',
            created_by=self.user
        )
    
    @patch('apps.notifications.tasks.NotificationService')
    def test_send_guardian_registration_notification_success(self, mock_service_class):
        """Test successful guardian registration notification."""
        # Mock notification service
        mock_service = MagicMock()
        mock_service.send_guardian_registration_notification.return_value = {
            'success': True,
            'claim_code': 'ABC12345',
            'message': 'Notification sent successfully'
        }
        mock_service_class.return_value = mock_service
        
        # Prepare athlete data
        athlete_data = {
            'athlete_id': self.athlete.id,
            'full_name': self.athlete.full_name,
            'guardian_phone': '+977-9841234567',
            'guardian_email': 'guardian@test.com'
        }
        
        # Execute task
        result = send_guardian_registration_notification_task.apply(args=[athlete_data])
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertTrue(task_result['success'])
        self.assertEqual(task_result['claim_code'], 'ABC12345')
        
        # Verify service was called
        mock_service.send_guardian_registration_notification.assert_called_once_with(athlete_data)
    
    @patch('apps.notifications.tasks.NotificationService')
    def test_send_guardian_registration_notification_failure_with_retry(self, mock_service_class):
        """Test guardian registration notification failure and retry."""
        # Mock notification service to fail
        mock_service = MagicMock()
        mock_service.send_guardian_registration_notification.side_effect = Exception("Service error")
        mock_service_class.return_value = mock_service
        
        # Prepare athlete data
        athlete_data = {
            'athlete_id': self.athlete.id,
            'full_name': self.athlete.full_name,
            'guardian_phone': '+977-9841234567'
        }
        
        # Execute task and expect failure result (after max retries)
        result = send_guardian_registration_notification_task.apply(args=[athlete_data])
        
        # Verify failure result
        self.assertTrue(result.successful())  # Task completes but returns failure result
        task_result = result.result
        self.assertFalse(task_result['success'])
        self.assertIn('error', task_result)
    
    @patch('apps.notifications.tasks.NotificationService')
    def test_send_athlete_registration_notification_success(self, mock_service_class):
        """Test successful athlete registration notification."""
        # Mock notification service
        mock_service = MagicMock()
        mock_service.send_athlete_registration_notification.return_value = {
            'success': True,
            'message': 'Notification sent to school admin'
        }
        mock_service_class.return_value = mock_service
        
        # Prepare data
        athlete_data = {
            'full_name': self.athlete.full_name,
            'athlete_id': self.athlete.athlete_id,
            'school_name': self.school.name
        }
        school_admin_email = 'admin@school.com'
        
        # Execute task
        result = send_athlete_registration_notification_task.apply(
            args=[athlete_data, school_admin_email]
        )
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertTrue(task_result['success'])
        
        # Verify service was called
        mock_service.send_athlete_registration_notification.assert_called_once_with(
            athlete_data=athlete_data,
            school_admin_email=school_admin_email
        )
    
    @patch('apps.notifications.tasks.EmailService')
    def test_send_email_task_success(self, mock_service_class):
        """Test successful email sending task."""
        # Mock email service
        mock_service = MagicMock()
        mock_service.send_email.return_value = {
            'success': True,
            'message': 'Email sent successfully'
        }
        mock_service_class.return_value = mock_service
        
        # Execute task
        result = send_email_task.apply(args=[
            'test@example.com',
            'Test Subject',
            'Test content',
            '<p>Test HTML content</p>',
            'test_template',
            {'name': 'Test User'},
            'Test User'
        ])
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertTrue(task_result['success'])
        
        # Verify service was called with correct parameters
        mock_service.send_email.assert_called_once_with(
            to_email='test@example.com',
            subject='Test Subject',
            content='Test content',
            html_content='<p>Test HTML content</p>',
            template_name='test_template',
            context={'name': 'Test User'},
            recipient_name='Test User'
        )
    
    @patch('apps.notifications.tasks.SMSService')
    def test_send_sms_task_success(self, mock_service_class):
        """Test successful SMS sending task."""
        # Mock SMS service
        mock_service = MagicMock()
        mock_service.send_sms.return_value = {
            'success': True,
            'message': 'SMS sent successfully'
        }
        mock_service_class.return_value = mock_service
        
        # Execute task
        result = send_sms_task.apply(args=[
            '+977-9841234567',
            'Test SMS message',
            'test_template',
            {'name': 'Test User'},
            'Test User'
        ])
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertTrue(task_result['success'])
        
        # Verify service was called with correct parameters
        mock_service.send_sms.assert_called_once_with(
            to_phone='+977-9841234567',
            message='Test SMS message',
            template_name='test_template',
            context={'name': 'Test User'},
            recipient_name='Test User'
        )
    
    @patch('apps.notifications.tasks.NotificationService')
    def test_send_reminder_notifications_task_success(self, mock_service_class):
        """Test successful reminder notifications task."""
        # Mock notification service
        mock_service = MagicMock()
        mock_service.send_reminder_notifications.return_value = {
            'success': True,
            'reminders_sent': 3,
            'message': 'Sent 3 reminder notifications'
        }
        mock_service_class.return_value = mock_service
        
        # Execute task
        result = send_reminder_notifications_task.apply()
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertTrue(task_result['success'])
        self.assertEqual(task_result['reminders_sent'], 3)
        
        # Verify service was called
        mock_service.send_reminder_notifications.assert_called_once()


@pytest.mark.django_db
class NotificationTasksDatabaseTest(TestCase):
    """Test notification tasks with database interactions."""
    
    def setUp(self):
        """Set up test environment."""
        current_app.conf.task_always_eager = True
        current_app.conf.task_eager_propagates = True
        
        # Create test data
        self.user = User.objects.create(
            email='admin@school.com',
            full_name='School Admin',
            role='SchoolAdmin'
        )
        
        self.school = School.objects.create(
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
            admin_user=self.user
        )
        
        self.athlete = Athlete.objects.create(
            full_name='Test Athlete',
            gender='Male',
            date_of_birth='2010-05-15',
            school=self.school,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234567',
            address='Test Address',
            created_by=self.user
        )
    
    def test_cleanup_expired_claims_task_with_real_data(self):
        """Test cleanup expired claims task with real database data."""
        # Create expired claim
        expired_claim = GuardianClaim.objects.create(
            athlete=self.athlete,
            guardian_phone='+977-9841234567',
            claim_code='EXPIRED1',
            status='expired',
            expires_at=timezone.now() - timedelta(days=10)
        )
        
        # Create recent expired claim (should not be deleted)
        recent_claim = GuardianClaim.objects.create(
            athlete=self.athlete,
            guardian_phone='+977-9841234568',
            claim_code='RECENT1',
            status='expired',
            expires_at=timezone.now() - timedelta(days=1)
        )
        
        # Execute task
        result = cleanup_expired_claims_task.apply()
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertTrue(task_result['success'])
        
        # Verify old expired claim was deleted
        self.assertFalse(GuardianClaim.objects.filter(id=expired_claim.id).exists())
        
        # Verify recent claim still exists
        self.assertTrue(GuardianClaim.objects.filter(id=recent_claim.id).exists())
    
    def test_cleanup_expired_notifications_task_with_real_data(self):
        """Test cleanup expired notifications task with real database data."""
        # Create old notification log
        old_log = NotificationLog.objects.create(
            recipient_email='old@test.com',
            subject='Old notification',
            content='Old content',
            notification_type='email',
            status='delivered',
            created_at=timezone.now() - timedelta(days=35)
        )
        
        # Create recent notification log (should not be deleted)
        recent_log = NotificationLog.objects.create(
            recipient_email='recent@test.com',
            subject='Recent notification',
            content='Recent content',
            notification_type='email',
            status='delivered',
            created_at=timezone.now() - timedelta(days=5)
        )
        
        # Execute task
        result = cleanup_expired_notifications.apply()
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertTrue(task_result['success'])
        
        # Verify old log was deleted
        self.assertFalse(NotificationLog.objects.filter(id=old_log.id).exists())
        
        # Verify recent log still exists
        self.assertTrue(NotificationLog.objects.filter(id=recent_log.id).exists())
    
    def test_process_notification_delivery_status_task_with_real_data(self):
        """Test process notification delivery status task with real database data."""
        from apps.notifications.tasks import process_notification_delivery_status_task
        
        # Create sent notification that should be marked as delivered
        old_sent_log = NotificationLog.objects.create(
            recipient_email='test@example.com',
            subject='Test notification',
            content='Test content',
            notification_type='email',
            status='sent',
            sent_at=timezone.now() - timedelta(hours=2)
        )
        
        # Create recent sent notification (should not be processed yet)
        recent_sent_log = NotificationLog.objects.create(
            recipient_email='recent@example.com',
            subject='Recent notification',
            content='Recent content',
            notification_type='email',
            status='sent',
            sent_at=timezone.now() - timedelta(minutes=2)
        )
        
        # Execute task
        result = process_notification_delivery_status_task.apply()
        
        # Verify results
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertTrue(task_result['success'])
        
        # Refresh from database
        old_sent_log.refresh_from_db()
        recent_sent_log.refresh_from_db()
        
        # Verify old notification was marked as delivered
        self.assertEqual(old_sent_log.status, 'delivered')
        
        # Verify recent notification is still sent
        self.assertEqual(recent_sent_log.status, 'sent')


class TaskErrorHandlingTest(TestCase):
    """Test error handling in notification tasks."""
    
    def setUp(self):
        """Set up test environment."""
        current_app.conf.task_always_eager = True
        current_app.conf.task_eager_propagates = True
    
    @patch('apps.notifications.tasks.EmailService')
    def test_email_task_failure_handling(self, mock_service_class):
        """Test email task failure handling."""
        # Mock email service to fail
        mock_service = MagicMock()
        mock_service.send_email.side_effect = Exception("SMTP error")
        mock_service_class.return_value = mock_service
        
        # Execute task
        result = send_email_task.apply(args=[
            'test@example.com',
            'Test Subject',
            'Test content'
        ])
        
        # Verify task completes but returns failure result
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertFalse(task_result['success'])
        self.assertIn('error', task_result)
        self.assertEqual(task_result['message'], 'Failed to send email after retries')
    
    @patch('apps.notifications.tasks.SMSService')
    def test_sms_task_failure_handling(self, mock_service_class):
        """Test SMS task failure handling."""
        # Mock SMS service to fail
        mock_service = MagicMock()
        mock_service.send_sms.side_effect = Exception("Twilio error")
        mock_service_class.return_value = mock_service
        
        # Execute task
        result = send_sms_task.apply(args=[
            '+977-9841234567',
            'Test SMS message'
        ])
        
        # Verify task completes but returns failure result
        self.assertTrue(result.successful())
        task_result = result.result
        self.assertFalse(task_result['success'])
        self.assertIn('error', task_result)
        self.assertEqual(task_result['message'], 'Failed to send SMS after retries')