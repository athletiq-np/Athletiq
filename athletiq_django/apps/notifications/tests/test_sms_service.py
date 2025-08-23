"""
Tests for SMS notification service.
"""
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from ..models import NotificationLog, NotificationTemplate
from ..services.sms_service import SMSService
from apps.athletes.models import Athlete
from apps.schools.models import School

User = get_user_model()


class SMSServiceTestCase(TestCase):
    """Test cases for SMSService"""
    
    def setUp(self):
        """Set up test data"""
        self.sms_service = SMSService()
        
        # Create test user and school
        self.user = User.objects.create(
            email='admin@testschool.com',
            full_name='Test Admin',
            role='SchoolAdmin'
        )
        self.user.set_password('testpass123')
        
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='123 Test St',
            country='Nepal',
            province='Bagmati',
            district='Kathmandu',
            city='Kathmandu',
            ward='1',
            phone='9841234567',
            email='admin@testschool.com',
            principal_name='Test Principal',
            admin_user=self.user
        )
        
        # Create test athlete
        self.athlete = Athlete.objects.create(
            full_name='Test Athlete',
            date_of_birth='2005-01-01',
            gender='Male',
            school=self.school
        )
        
        # Create SMS templates
        self.guardian_template = NotificationTemplate.objects.create(
            name='Guardian Registration SMS Template',
            template_type='sms',
            category='guardian_registration',
            content='Guardian registration for {{ athlete_name }}. Use claim code {{ claim_code }} to register. Expires in {{ expiry_hours }} hours.'
        )
        
        self.reminder_template = NotificationTemplate.objects.create(
            name='Reminder SMS Template',
            template_type='sms',
            category='reminder',
            content='Reminder: Your claim code {{ claim_code }} for {{ athlete_name }} expires in {{ expiry_time }}.'
        )
    
    @override_settings(
        TWILIO_ACCOUNT_SID='test_sid',
        TWILIO_AUTH_TOKEN='test_token',
        TWILIO_PHONE_NUMBER='+1234567890'
    )
    @patch('apps.notifications.services.sms_service.Client')
    def test_send_sms_basic(self, mock_client_class):
        """Test basic SMS sending functionality"""
        # Mock Twilio client
        mock_client = MagicMock()
        mock_message = MagicMock()
        mock_message.sid = 'test_message_sid_123'
        mock_client.messages.create.return_value = mock_message
        mock_client_class.return_value = mock_client
        
        # Create new SMS service instance to pick up settings
        sms_service = SMSService()
        
        result = sms_service.send_sms(
            to_phone='+9779841234567',
            message='Test SMS message',
            recipient_name='Test User'
        )
        
        # Check result
        self.assertTrue(result['success'])
        self.assertEqual(result['message_id'], 'test_message_sid_123')
        self.assertIn('notification_id', result)
        
        # Check Twilio client was called correctly
        mock_client.messages.create.assert_called_once_with(
            body='Test SMS message',
            from_='+1234567890',
            to='+9779841234567'
        )
        
        # Check notification log was created
        log = NotificationLog.objects.get(id=result['notification_id'])
        self.assertEqual(log.notification_type, 'sms')
        self.assertEqual(log.recipient_phone, '+9779841234567')
        self.assertEqual(log.content, 'Test SMS message')
        self.assertEqual(log.status, 'sent')
        self.assertEqual(log.external_id, 'test_message_sid_123')
        self.assertIsNotNone(log.sent_at)
    
    def test_send_sms_no_twilio_config(self):
        """Test SMS sending when Twilio is not configured"""
        # SMS service should be initialized without Twilio config by default
        result = self.sms_service.send_sms(
            to_phone='+9779841234567',
            message='Test SMS message'
        )
        
        # Check result
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'Twilio not configured')
    
    @override_settings(
        TWILIO_ACCOUNT_SID='test_sid',
        TWILIO_AUTH_TOKEN='test_token',
        TWILIO_PHONE_NUMBER=''  # No phone number configured
    )
    def test_send_sms_no_phone_number(self):
        """Test SMS sending when Twilio phone number is not configured"""
        sms_service = SMSService()
        
        result = sms_service.send_sms(
            to_phone='+9779841234567',
            message='Test SMS message'
        )
        
        # Check result
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'Twilio phone number not configured')
    
    @override_settings(
        TWILIO_ACCOUNT_SID='test_sid',
        TWILIO_AUTH_TOKEN='test_token',
        TWILIO_PHONE_NUMBER='+1234567890'
    )
    @patch('apps.notifications.services.sms_service.Client')
    def test_send_guardian_registration_sms(self, mock_client_class):
        """Test guardian registration SMS"""
        # Mock Twilio client
        mock_client = MagicMock()
        mock_message = MagicMock()
        mock_message.sid = 'test_message_sid_123'
        mock_client.messages.create.return_value = mock_message
        mock_client_class.return_value = mock_client
        
        sms_service = SMSService()
        
        athlete_data = {
            'full_name': self.athlete.full_name,
            'athlete_id': self.athlete.athlete_id,
            'school_name': self.school.name,
            'athlete_instance': self.athlete
        }
        
        result = sms_service.send_guardian_registration_sms(
            athlete_data=athlete_data,
            claim_code='ABC123',
            guardian_phone='+9779841234567'
        )
        
        # Check result
        self.assertTrue(result['success'])
        
        # Check SMS content
        expected_content = f'Guardian registration for {self.athlete.full_name}. Use claim code ABC123 to register. Expires in 24 hours.'
        mock_client.messages.create.assert_called_once()
        call_args = mock_client.messages.create.call_args
        self.assertEqual(call_args[1]['body'], expected_content)
        self.assertEqual(call_args[1]['to'], '+9779841234567')
        
        # Check notification log
        log = NotificationLog.objects.filter(
            recipient_phone='+9779841234567'
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.template, self.guardian_template)
        self.assertEqual(log.status, 'sent')
    
    @override_settings(
        TWILIO_ACCOUNT_SID='test_sid',
        TWILIO_AUTH_TOKEN='test_token',
        TWILIO_PHONE_NUMBER='+1234567890'
    )
    @patch('apps.notifications.services.sms_service.Client')
    def test_send_reminder_sms(self, mock_client_class):
        """Test reminder SMS"""
        # Mock Twilio client
        mock_client = MagicMock()
        mock_message = MagicMock()
        mock_message.sid = 'test_message_sid_123'
        mock_client.messages.create.return_value = mock_message
        mock_client_class.return_value = mock_client
        
        sms_service = SMSService()
        
        claim_data = {
            'full_name': self.athlete.full_name,
            'athlete_id': self.athlete.athlete_id,
            'claim_code': 'ABC123',
            'guardian_phone': '+9779841234567'
        }
        
        result = sms_service.send_reminder_sms(claim_data)
        
        # Check result
        self.assertTrue(result['success'])
        
        # Check SMS content
        expected_content = f'Reminder: Your claim code ABC123 for {self.athlete.full_name} expires in 6 hours.'
        mock_client.messages.create.assert_called_once()
        call_args = mock_client.messages.create.call_args
        self.assertEqual(call_args[1]['body'], expected_content)
        self.assertEqual(call_args[1]['to'], '+9779841234567')
    
    @override_settings(
        TWILIO_ACCOUNT_SID='test_sid',
        TWILIO_AUTH_TOKEN='test_token',
        TWILIO_PHONE_NUMBER='+1234567890'
    )
    @patch('apps.notifications.services.sms_service.Client')
    def test_sms_sending_failure(self, mock_client_class):
        """Test SMS sending failure handling"""
        # Mock Twilio client to raise exception
        mock_client = MagicMock()
        mock_client.messages.create.side_effect = Exception('Twilio API Error')
        mock_client_class.return_value = mock_client
        
        sms_service = SMSService()
        
        result = sms_service.send_sms(
            to_phone='+9779841234567',
            message='Test SMS message'
        )
        
        # Check result
        self.assertFalse(result['success'])
        self.assertIn('error', result)
        
        # Check notification log was marked as failed
        log = NotificationLog.objects.filter(
            recipient_phone='+9779841234567'
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.status, 'failed')
        self.assertIn('Twilio API Error', log.error_message)
    
    @override_settings(
        TWILIO_ACCOUNT_SID='test_sid',
        TWILIO_AUTH_TOKEN='test_token',
        TWILIO_PHONE_NUMBER='+1234567890'
    )
    @patch('apps.notifications.services.sms_service.Client')
    def test_notification_log_creation_with_related_object(self, mock_client_class):
        """Test notification log creation with related object"""
        # Mock Twilio client
        mock_client = MagicMock()
        mock_message = MagicMock()
        mock_message.sid = 'test_message_sid_123'
        mock_client.messages.create.return_value = mock_message
        mock_client_class.return_value = mock_client
        
        sms_service = SMSService()
        
        result = sms_service.send_sms(
            to_phone='+9779841234567',
            message='Test SMS message',
            template_name='guardian_registration',
            context={'test': 'data'},
            related_object=self.athlete,
            recipient_name='Test Guardian'
        )
        
        # Check notification log
        log = NotificationLog.objects.get(id=result['notification_id'])
        self.assertEqual(log.content_object, self.athlete)
        self.assertEqual(log.context_data, {'test': 'data'})
        self.assertEqual(log.recipient_name, 'Test Guardian')
        self.assertEqual(log.template, self.guardian_template)
    
    def test_sms_service_configuration(self):
        """Test SMS service configuration"""
        # Default configuration should have no client
        self.assertIsNone(self.sms_service.client)
        self.assertIsNone(self.sms_service.from_number)
    
    @override_settings(
        TWILIO_ACCOUNT_SID='test_sid',
        TWILIO_AUTH_TOKEN='test_token',
        TWILIO_PHONE_NUMBER='+1234567890'
    )
    @patch('apps.notifications.services.sms_service.Client')
    def test_template_not_found_handling(self, mock_client_class):
        """Test handling when SMS template is not found"""
        # Mock Twilio client
        mock_client = MagicMock()
        mock_message = MagicMock()
        mock_message.sid = 'test_message_sid_123'
        mock_client.messages.create.return_value = mock_message
        mock_client_class.return_value = mock_client
        
        sms_service = SMSService()
        
        athlete_data = {
            'full_name': 'Test Athlete',
            'athlete_id': 'ATH001',
            'school_name': 'Test School'
        }
        
        # Delete the template
        self.guardian_template.delete()
        
        result = sms_service.send_guardian_registration_sms(
            athlete_data=athlete_data,
            claim_code='ABC123',
            guardian_phone='+9779841234567'
        )
        
        # Should fail due to missing template
        self.assertFalse(result['success'])


class SMSServiceIntegrationTestCase(TestCase):
    """Integration tests for SMS service"""
    
    def setUp(self):
        """Set up test data"""
        self.sms_service = SMSService()
    
    @override_settings(
        TWILIO_ACCOUNT_SID='test_sid',
        TWILIO_AUTH_TOKEN='test_token',
        TWILIO_PHONE_NUMBER='+1234567890'
    )
    @patch('apps.notifications.services.sms_service.Client')
    def test_twilio_integration(self, mock_client_class):
        """Test integration with Twilio API"""
        # Mock Twilio client with realistic response
        mock_client = MagicMock()
        mock_message = MagicMock()
        mock_message.sid = 'SM1234567890abcdef1234567890abcdef'
        mock_message.status = 'queued'
        mock_client.messages.create.return_value = mock_message
        mock_client_class.return_value = mock_client
        
        sms_service = SMSService()
        
        result = sms_service.send_sms(
            to_phone='+9779841234567',
            message='Test SMS message'
        )
        
        # Check result includes Twilio message ID
        self.assertTrue(result['success'])
        self.assertEqual(result['message_id'], 'SM1234567890abcdef1234567890abcdef')
        
        # Check notification log has external ID
        log = NotificationLog.objects.get(id=result['notification_id'])
        self.assertEqual(log.external_id, 'SM1234567890abcdef1234567890abcdef')
    
    def test_sms_delivery_tracking(self):
        """Test SMS delivery tracking functionality"""
        # Create a notification log
        log = NotificationLog.objects.create(
            notification_type='sms',
            recipient_phone='+9779841234567',
            content='Test SMS message',
            status='pending'
        )
        
        # Test marking as sent
        log.mark_as_sent('SM1234567890abcdef')
        log.refresh_from_db()
        
        self.assertEqual(log.status, 'sent')
        self.assertEqual(log.external_id, 'SM1234567890abcdef')
        self.assertIsNotNone(log.sent_at)
        
        # Test marking as delivered
        log.mark_as_delivered()
        log.refresh_from_db()
        
        self.assertEqual(log.status, 'delivered')
        self.assertIsNotNone(log.delivered_at)
        
        # Test marking as failed
        log.mark_as_failed('Delivery failed')
        log.refresh_from_db()
        
        self.assertEqual(log.status, 'failed')
        self.assertEqual(log.error_message, 'Delivery failed')