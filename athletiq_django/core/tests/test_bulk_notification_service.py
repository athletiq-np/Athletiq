"""
Tests for bulk operation notification service.
"""
import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.core.cache import cache
from core.services.bulk_notification_service import BulkOperationNotificationService, bulk_notification_service
from apps.authentication.models import User


class BulkOperationNotificationServiceTest(TestCase):
    """Test cases for BulkOperationNotificationService."""
    
    def setUp(self):
        """Set up test environment."""
        cache.clear()
        
        # Create test user
        self.user = User.objects.create(
            email='test@example.com',
            full_name='Test User',
            role='SchoolAdmin'
        )
        
        self.service = BulkOperationNotificationService()
    
    @patch('core.services.bulk_notification_service.NotificationService')
    def test_send_operation_started_notification(self, mock_notification_service):
        """Test sending operation started notification."""
        mock_notification_service_instance = MagicMock()
        mock_notification_service.return_value = mock_notification_service_instance
        
        result = self.service.send_operation_started_notification(
            user_id=self.user.id,
            operation_id='test-operation-id',
            operation_type='athlete_import',
            total_items=100
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['message'], 'Operation started notification sent')
    
    @patch('core.services.bulk_notification_service.NotificationService')
    def test_send_operation_progress_notification(self, mock_notification_service):
        """Test sending operation progress notification."""
        mock_notification_service_instance = MagicMock()
        mock_notification_service.return_value = mock_notification_service_instance
        
        # Test milestone notification (50%)
        result = self.service.send_operation_progress_notification(
            user_id=self.user.id,
            operation_id='test-operation-id',
            operation_type='athlete_import',
            progress_percentage=50.0,
            processed_items=50,
            total_items=100
        )
        
        self.assertTrue(result['success'])
        self.assertIn('Progress notification sent', result['message'])
    
    def test_send_operation_progress_notification_no_milestone(self):
        """Test progress notification when no milestone is reached."""
        result = self.service.send_operation_progress_notification(
            user_id=self.user.id,
            operation_id='test-operation-id',
            operation_type='athlete_import',
            progress_percentage=30.0,  # Not a milestone
            processed_items=30,
            total_items=100
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['message'], 'No milestone reached')
    
    @patch('core.services.bulk_notification_service.NotificationService')
    @patch('core.services.bulk_notification_service.EmailService')
    def test_send_operation_completed_notification_success(self, mock_email_service, mock_notification_service):
        """Test sending operation completed notification for successful operation."""
        mock_notification_service_instance = MagicMock()
        mock_notification_service.return_value = mock_notification_service_instance
        
        mock_email_service_instance = MagicMock()
        mock_email_service.return_value = mock_email_service_instance
        mock_email_service_instance.send_email.return_value = {'success': True}
        
        results = {
            'success': True,
            'total_processed': 100,
            'successful_imports': 95,
            'failed_imports': 5
        }
        
        result = self.service.send_operation_completed_notification(
            user_id=self.user.id,
            operation_id='test-operation-id',
            operation_type='athlete_import',
            results=results,
            send_email=True
        )
        
        self.assertTrue(result['success'])
        self.assertTrue(result['email_sent'])
    
    @patch('core.services.bulk_notification_service.NotificationService')
    @patch('core.services.bulk_notification_service.EmailService')
    def test_send_operation_completed_notification_failure(self, mock_email_service, mock_notification_service):
        """Test sending operation completed notification for failed operation."""
        mock_notification_service_instance = MagicMock()
        mock_notification_service.return_value = mock_notification_service_instance
        
        mock_email_service_instance = MagicMock()
        mock_email_service.return_value = mock_email_service_instance
        mock_email_service_instance.send_email.return_value = {'success': True}
        
        results = {
            'success': False,
            'total_processed': 50,
            'successful_imports': 0,
            'failed_imports': 50
        }
        
        result = self.service.send_operation_completed_notification(
            user_id=self.user.id,
            operation_id='test-operation-id',
            operation_type='athlete_import',
            results=results,
            send_email=True
        )
        
        self.assertTrue(result['success'])
        self.assertTrue(result['email_sent'])
    
    @patch('core.services.bulk_notification_service.NotificationService')
    @patch('core.services.bulk_notification_service.EmailService')
    def test_send_operation_failed_notification(self, mock_email_service, mock_notification_service):
        """Test sending operation failed notification."""
        mock_notification_service_instance = MagicMock()
        mock_notification_service.return_value = mock_notification_service_instance
        
        mock_email_service_instance = MagicMock()
        mock_email_service.return_value = mock_email_service_instance
        mock_email_service_instance.send_email.return_value = {'success': True}
        
        result = self.service.send_operation_failed_notification(
            user_id=self.user.id,
            operation_id='test-operation-id',
            operation_type='athlete_import',
            error_message='Database connection failed',
            send_email=True
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['message'], 'Operation failure notification sent')
    
    def test_send_notification_user_not_found(self):
        """Test sending notification when user doesn't exist."""
        result = self.service.send_operation_started_notification(
            user_id=99999,  # Non-existent user
            operation_id='test-operation-id',
            operation_type='athlete_import',
            total_items=100
        )
        
        self.assertFalse(result['success'])
        self.assertIn('User matching query does not exist', result['message'])
    
    @patch('core.services.bulk_notification_service.SMSService')
    def test_send_completion_sms(self, mock_sms_service):
        """Test sending completion SMS notification."""
        # Add phone number to user
        self.user.phone = '+977-9841234567'
        self.user.save()
        
        mock_sms_service_instance = MagicMock()
        mock_sms_service.return_value = mock_sms_service_instance
        mock_sms_service_instance.send_sms.return_value = {'success': True}
        
        results = {
            'success': True,
            'total_processed': 100,
            'successful_imports': 95,
            'failed_imports': 5
        }
        
        result = self.service.send_operation_completed_notification(
            user_id=self.user.id,
            operation_id='test-operation-id',
            operation_type='athlete_import',
            results=results,
            send_email=False,
            send_sms=True
        )
        
        self.assertTrue(result['success'])
        self.assertTrue(result['sms_sent'])
    
    def test_global_service_instance(self):
        """Test that global service instance is available."""
        self.assertIsInstance(bulk_notification_service, BulkOperationNotificationService)
    
    @patch('core.services.bulk_notification_service.EmailService')
    def test_email_content_generation(self, mock_email_service):
        """Test that email content is properly generated."""
        mock_email_service_instance = MagicMock()
        mock_email_service.return_value = mock_email_service_instance
        
        results = {
            'success': True,
            'total_processed': 100,
            'successful_imports': 95,
            'failed_imports': 5
        }
        
        # Call the private method directly to test content generation
        result = self.service._send_completion_email(
            user=self.user,
            operation_id='test-operation-id',
            operation_type='athlete_import',
            results=results
        )
        
        # Verify email service was called
        mock_email_service_instance.send_email.assert_called_once()
        
        # Get the call arguments
        call_args = mock_email_service_instance.send_email.call_args
        
        # Verify email parameters
        self.assertEqual(call_args[1]['to_email'], self.user.email)
        self.assertIn('Bulk Operation Completed', call_args[1]['subject'])
        self.assertIn('Athlete Import', call_args[1]['subject'])
        self.assertIn(self.user.full_name, call_args[1]['text_content'])
        self.assertIn('95', call_args[1]['html_content'])  # Successful count
        self.assertIn('5', call_args[1]['html_content'])   # Failed count
    
    @patch('core.services.bulk_notification_service.EmailService')
    def test_failure_email_content_generation(self, mock_email_service):
        """Test that failure email content is properly generated."""
        mock_email_service_instance = MagicMock()
        mock_email_service.return_value = mock_email_service_instance
        
        # Call the private method directly to test content generation
        result = self.service._send_failure_email(
            user=self.user,
            operation_id='test-operation-id',
            operation_type='athlete_import',
            error_message='Database connection failed'
        )
        
        # Verify email service was called
        mock_email_service_instance.send_email.assert_called_once()
        
        # Get the call arguments
        call_args = mock_email_service_instance.send_email.call_args
        
        # Verify email parameters
        self.assertEqual(call_args[1]['to_email'], self.user.email)
        self.assertIn('Bulk Operation Failed', call_args[1]['subject'])
        self.assertIn('Database connection failed', call_args[1]['text_content'])
        self.assertIn('Database connection failed', call_args[1]['html_content'])
    
    def test_notification_service_error_handling(self):
        """Test error handling in notification service."""
        # Test with invalid user ID
        result = self.service.send_operation_started_notification(
            user_id=None,
            operation_id='test-operation-id',
            operation_type='athlete_import',
            total_items=100
        )
        
        self.assertFalse(result['success'])
        self.assertIn('error', result['message'].lower())