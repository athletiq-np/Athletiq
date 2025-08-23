"""
Tests for email notification service.
"""
import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.core import mail
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from ..models import NotificationLog, NotificationTemplate, GuardianClaim
from ..services.email_service import EmailService
from apps.athletes.models import Athlete
from apps.schools.models import School

User = get_user_model()


class EmailServiceTestCase(TestCase):
    """Test cases for EmailService"""
    
    def setUp(self):
        """Set up test data"""
        self.email_service = EmailService()
        
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
        
        # Create email templates
        self.guardian_template = NotificationTemplate.objects.create(
            name='Guardian Registration Template',
            template_type='email',
            category='guardian_registration',
            subject='Guardian Registration for {{ athlete_name }}',
            content='Hello Guardian, please use claim code {{ claim_code }} to register.',
            html_content='<p>Hello Guardian, please use claim code <strong>{{ claim_code }}</strong> to register.</p>'
        )
        
        self.athlete_template = NotificationTemplate.objects.create(
            name='Athlete Registration Template',
            template_type='email',
            category='athlete_registration',
            subject='New Athlete Registration: {{ athlete_name }}',
            content='A new athlete {{ athlete_name }} has been registered.',
            html_content='<p>A new athlete <strong>{{ athlete_name }}</strong> has been registered.</p>'
        )
    
    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_email_basic(self):
        """Test basic email sending functionality"""
        result = self.email_service.send_email(
            to_email='test@example.com',
            subject='Test Subject',
            content='Test content',
            html_content='<p>Test content</p>',
            recipient_name='Test User'
        )
        
        # Check result
        self.assertTrue(result['success'])
        self.assertIn('message_id', result)
        self.assertIn('notification_id', result)
        
        # Check email was sent
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.subject, 'Test Subject')
        self.assertEqual(sent_email.to, ['test@example.com'])
        self.assertIn('Test content', sent_email.body)
        
        # Check notification log was created
        log = NotificationLog.objects.get(id=result['notification_id'])
        self.assertEqual(log.notification_type, 'email')
        self.assertEqual(log.recipient_email, 'test@example.com')
        self.assertEqual(log.subject, 'Test Subject')
        self.assertEqual(log.status, 'sent')
        self.assertIsNotNone(log.sent_at)
    
    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_guardian_registration_email(self):
        """Test guardian registration email"""
        athlete_data = {
            'full_name': self.athlete.full_name,
            'athlete_id': self.athlete.athlete_id,
            'school_name': self.school.name,
            'grade': '10',
            'athlete_instance': self.athlete
        }
        
        result = self.email_service.send_guardian_registration_email(
            athlete_data=athlete_data,
            claim_code='ABC123',
            guardian_email='guardian@example.com'
        )
        
        # Check result
        self.assertTrue(result['success'])
        
        # Check email was sent
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn('Test Athlete', sent_email.subject)
        self.assertEqual(sent_email.to, ['guardian@example.com'])
        self.assertIn('ABC123', sent_email.body)
        
        # Check notification log
        log = NotificationLog.objects.filter(
            recipient_email='guardian@example.com'
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.template, self.guardian_template)
        self.assertEqual(log.status, 'sent')
    
    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_athlete_registration_email(self):
        """Test athlete registration email"""
        athlete_data = {
            'full_name': self.athlete.full_name,
            'athlete_id': self.athlete.athlete_id,
            'school_name': self.school.name,
            'guardian_email': 'guardian@example.com',
            'guardian_phone': '9841234567',
            'athlete_instance': self.athlete
        }
        
        result = self.email_service.send_athlete_registration_email(
            athlete_data=athlete_data,
            school_admin_email='admin@testschool.com'
        )
        
        # Check result
        self.assertTrue(result['success'])
        
        # Check email was sent
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn('Test Athlete', sent_email.subject)
        self.assertEqual(sent_email.to, ['admin@testschool.com'])
        self.assertIn('Test Athlete', sent_email.body)
        
        # Check notification log
        log = NotificationLog.objects.filter(
            recipient_email='admin@testschool.com'
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.template, self.athlete_template)
    
    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_reminder_email(self):
        """Test reminder email"""
        # Create reminder template
        reminder_template = NotificationTemplate.objects.create(
            name='Reminder Template',
            template_type='email',
            category='reminder',
            subject='Reminder: Claim code {{ claim_code }} expires soon',
            content='Your claim code {{ claim_code }} for {{ athlete_name }} expires in {{ expiry_time }}.',
            html_content='<p>Your claim code <strong>{{ claim_code }}</strong> expires in {{ expiry_time }}.</p>'
        )
        
        claim_data = {
            'full_name': self.athlete.full_name,
            'athlete_id': self.athlete.athlete_id,
            'claim_code': 'ABC123',
            'guardian_email': 'guardian@example.com'
        }
        
        result = self.email_service.send_reminder_email(claim_data)
        
        # Check result
        self.assertTrue(result['success'])
        
        # Check email was sent
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn('ABC123', sent_email.subject)
        self.assertEqual(sent_email.to, ['guardian@example.com'])
        self.assertIn('6 hours', sent_email.body)
    
    def test_email_sending_failure(self):
        """Test email sending failure handling"""
        with patch('django.core.mail.EmailMultiAlternatives.send') as mock_send:
            mock_send.return_value = 0  # Simulate send failure
            
            result = self.email_service.send_email(
                to_email='test@example.com',
                subject='Test Subject',
                content='Test content'
            )
            
            # Check result
            self.assertFalse(result['success'])
            self.assertIn('error', result)
            
            # Check notification log was marked as failed
            log = NotificationLog.objects.filter(
                recipient_email='test@example.com'
            ).first()
            self.assertIsNotNone(log)
            self.assertEqual(log.status, 'failed')
    
    def test_email_sending_exception(self):
        """Test email sending exception handling"""
        with patch('django.core.mail.EmailMultiAlternatives.send') as mock_send:
            mock_send.side_effect = Exception('SMTP Error')
            
            result = self.email_service.send_email(
                to_email='test@example.com',
                subject='Test Subject',
                content='Test content'
            )
            
            # Check result
            self.assertFalse(result['success'])
            self.assertEqual(result['error'], 'SMTP Error')
            
            # Check notification log was marked as failed
            log = NotificationLog.objects.filter(
                recipient_email='test@example.com'
            ).first()
            self.assertIsNotNone(log)
            self.assertEqual(log.status, 'failed')
            self.assertEqual(log.error_message, 'SMTP Error')
    
    def test_template_not_found_handling(self):
        """Test handling when template is not found"""
        athlete_data = {
            'full_name': 'Test Athlete',
            'athlete_id': 'ATH001',
            'school_name': 'Test School'
        }
        
        # Delete the template
        self.guardian_template.delete()
        
        result = self.email_service.send_guardian_registration_email(
            athlete_data=athlete_data,
            claim_code='ABC123',
            guardian_email='guardian@example.com'
        )
        
        # Should still work but without template reference
        self.assertFalse(result['success'])  # Will fail due to missing template
    
    def test_notification_log_creation_with_related_object(self):
        """Test notification log creation with related object"""
        result = self.email_service.send_email(
            to_email='test@example.com',
            subject='Test Subject',
            content='Test content',
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
    
    def test_email_service_configuration(self):
        """Test email service configuration"""
        self.assertEqual(self.email_service.from_email, 'noreply@athletiq.com')
        self.assertEqual(self.email_service.from_name, 'Athletiq Nepal')
    
    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_html_email_content(self):
        """Test HTML email content is properly attached"""
        result = self.email_service.send_email(
            to_email='test@example.com',
            subject='Test Subject',
            content='Plain text content',
            html_content='<h1>HTML content</h1>'
        )
        
        self.assertTrue(result['success'])
        
        # Check email alternatives
        sent_email = mail.outbox[0]
        self.assertEqual(len(sent_email.alternatives), 1)
        html_content, content_type = sent_email.alternatives[0]
        self.assertEqual(content_type, 'text/html')
        self.assertIn('<h1>HTML content</h1>', html_content)


class EmailServiceIntegrationTestCase(TestCase):
    """Integration tests for email service with external dependencies"""
    
    def setUp(self):
        """Set up test data"""
        self.email_service = EmailService()
    
    @patch('django.core.mail.EmailMultiAlternatives.send')
    def test_anymail_integration(self, mock_send):
        """Test integration with django-anymail"""
        # Mock anymail status
        mock_email = MagicMock()
        mock_email.anymail_status = {'message_id': 'test-message-id-123'}
        mock_send.return_value = 1
        
        with patch('django.core.mail.EmailMultiAlternatives') as mock_email_class:
            mock_email_class.return_value = mock_email
            
            result = self.email_service.send_email(
                to_email='test@example.com',
                subject='Test Subject',
                content='Test content'
            )
            
            # Check result includes external message ID
            self.assertTrue(result['success'])
            self.assertEqual(result['message_id'], 'test-message-id-123')
            
            # Check notification log has external ID
            log = NotificationLog.objects.get(id=result['notification_id'])
            self.assertEqual(log.external_id, 'test-message-id-123')
    
    def test_email_delivery_tracking(self):
        """Test email delivery tracking functionality"""
        # Create a notification log
        log = NotificationLog.objects.create(
            notification_type='email',
            recipient_email='test@example.com',
            subject='Test Subject',
            content='Test content',
            status='pending'
        )
        
        # Test marking as sent
        log.mark_as_sent('external-id-123')
        log.refresh_from_db()
        
        self.assertEqual(log.status, 'sent')
        self.assertEqual(log.external_id, 'external-id-123')
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