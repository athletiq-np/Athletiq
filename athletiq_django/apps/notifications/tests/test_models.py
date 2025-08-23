"""
Tests for notification models.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.core.exceptions import ValidationError

from ..models import (
    NotificationTemplate,
    NotificationLog,
    NotificationPreference,
    GuardianClaim
)
from apps.athletes.models import Athlete
from apps.schools.models import School

User = get_user_model()


class NotificationTemplateTestCase(TestCase):
    """Test cases for NotificationTemplate model"""
    
    def test_create_email_template(self):
        """Test creating an email template"""
        template = NotificationTemplate.objects.create(
            name='Test Email Template',
            template_type='email',
            category='guardian_registration',
            subject='Test Subject: {{ athlete_name }}',
            content='Hello {{ guardian_name }}, your claim code is {{ claim_code }}.',
            html_content='<p>Hello <strong>{{ guardian_name }}</strong>, your claim code is {{ claim_code }}.</p>'
        )
        
        self.assertEqual(template.name, 'Test Email Template')
        self.assertEqual(template.template_type, 'email')
        self.assertEqual(template.category, 'guardian_registration')
        self.assertTrue(template.is_active)
        self.assertIsNotNone(template.id)
        self.assertIsNotNone(template.created_at)
        self.assertIsNotNone(template.updated_at)
    
    def test_create_sms_template(self):
        """Test creating an SMS template"""
        template = NotificationTemplate.objects.create(
            name='Test SMS Template',
            template_type='sms',
            category='reminder',
            content='Your claim code {{ claim_code }} expires in {{ expiry_time }}.'
        )
        
        self.assertEqual(template.template_type, 'sms')
        self.assertEqual(template.category, 'reminder')
        self.assertEqual(template.subject, '')  # SMS templates don't have subjects
    
    def test_template_unique_constraint(self):
        """Test unique constraint on template_type and category"""
        # Create first template
        NotificationTemplate.objects.create(
            name='First Template',
            template_type='email',
            category='guardian_registration',
            content='First template content'
        )
        
        # Try to create duplicate
        with self.assertRaises(Exception):  # Should raise IntegrityError
            NotificationTemplate.objects.create(
                name='Second Template',
                template_type='email',
                category='guardian_registration',
                content='Second template content'
            )
    
    def test_template_str_representation(self):
        """Test string representation of template"""
        template = NotificationTemplate.objects.create(
            name='Test Template',
            template_type='email',
            category='guardian_registration',
            content='Test content'
        )
        
        expected_str = 'Test Template (email)'
        self.assertEqual(str(template), expected_str)


class NotificationLogTestCase(TestCase):
    """Test cases for NotificationLog model"""
    
    def setUp(self):
        """Set up test data"""
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
        
        self.athlete = Athlete.objects.create(
            
            full_name='Test Athlete',
            date_of_birth='2005-01-01',
            gender='Male',
            school=self.school,
            
            
        )
        
        self.template = NotificationTemplate.objects.create(
            name='Test Template',
            template_type='email',
            category='guardian_registration',
            subject='Test Subject',
            content='Test content'
        )
    
    def test_create_email_notification_log(self):
        """Test creating an email notification log"""
        log = NotificationLog.objects.create(
            notification_type='email',
            template=self.template,
            recipient_email='test@example.com',
            recipient_name='Test User',
            subject='Test Subject',
            content='Test content',
            html_content='<p>Test content</p>',
            context_data={'key': 'value'}
        )
        
        self.assertEqual(log.notification_type, 'email')
        self.assertEqual(log.template, self.template)
        self.assertEqual(log.recipient_email, 'test@example.com')
        self.assertEqual(log.status, 'pending')
        self.assertEqual(log.context_data, {'key': 'value'})
        self.assertIsNotNone(log.id)
        self.assertIsNotNone(log.created_at)
    
    def test_create_sms_notification_log(self):
        """Test creating an SMS notification log"""
        log = NotificationLog.objects.create(
            notification_type='sms',
            recipient_phone='+9779841234567',
            recipient_name='Test User',
            content='Test SMS content'
        )
        
        self.assertEqual(log.notification_type, 'sms')
        self.assertEqual(log.recipient_phone, '+9779841234567')
        self.assertEqual(log.recipient_email, '')
        self.assertEqual(log.subject, '')
    
    def test_notification_log_with_related_object(self):
        """Test notification log with generic foreign key"""
        content_type = ContentType.objects.get_for_model(self.athlete)
        
        log = NotificationLog.objects.create(
            notification_type='email',
            recipient_email='test@example.com',
            subject='Test Subject',
            content='Test content',
            content_type=content_type,
            object_id=self.athlete.pk
        )
        
        self.assertEqual(log.content_object, self.athlete)
        self.assertEqual(log.content_type, content_type)
        self.assertEqual(log.object_id, self.athlete.pk)
    
    def test_mark_as_sent(self):
        """Test marking notification as sent"""
        log = NotificationLog.objects.create(
            notification_type='email',
            recipient_email='test@example.com',
            subject='Test Subject',
            content='Test content'
        )
        
        # Initially pending
        self.assertEqual(log.status, 'pending')
        self.assertIsNone(log.sent_at)
        self.assertEqual(log.external_id, '')
        
        # Mark as sent
        log.mark_as_sent('external-id-123')
        
        self.assertEqual(log.status, 'sent')
        self.assertIsNotNone(log.sent_at)
        self.assertEqual(log.external_id, 'external-id-123')
    
    def test_mark_as_delivered(self):
        """Test marking notification as delivered"""
        log = NotificationLog.objects.create(
            notification_type='email',
            recipient_email='test@example.com',
            subject='Test Subject',
            content='Test content',
            status='sent'
        )
        
        # Mark as delivered
        log.mark_as_delivered()
        
        self.assertEqual(log.status, 'delivered')
        self.assertIsNotNone(log.delivered_at)
    
    def test_mark_as_failed(self):
        """Test marking notification as failed"""
        log = NotificationLog.objects.create(
            notification_type='email',
            recipient_email='test@example.com',
            subject='Test Subject',
            content='Test content'
        )
        
        # Mark as failed
        error_message = 'SMTP connection failed'
        log.mark_as_failed(error_message)
        
        self.assertEqual(log.status, 'failed')
        self.assertEqual(log.error_message, error_message)
    
    def test_notification_log_str_representation(self):
        """Test string representation of notification log"""
        log = NotificationLog.objects.create(
            notification_type='email',
            recipient_email='test@example.com',
            subject='Test Subject',
            content='Test content',
            status='sent'
        )
        
        expected_str = 'email to test@example.com - sent'
        self.assertEqual(str(log), expected_str)
        
        # Test with phone number
        sms_log = NotificationLog.objects.create(
            notification_type='sms',
            recipient_phone='+9779841234567',
            content='Test SMS',
            status='delivered'
        )
        
        expected_sms_str = 'sms to +9779841234567 - delivered'
        self.assertEqual(str(sms_log), expected_sms_str)


class NotificationPreferenceTestCase(TestCase):
    """Test cases for NotificationPreference model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create(
            email='test@example.com',
            full_name='Test User',
            role='SchoolAdmin'
        )
        self.user.set_password('testpass123')
    
    def test_create_notification_preference(self):
        """Test creating notification preferences"""
        preference = NotificationPreference.objects.create(
            user=self.user,
            guardian_registration='both',
            athlete_registration='email',
            tournament_updates='sms',
            reminders='both',
            marketing='none',
            preferred_email='custom@example.com',
            preferred_phone='+9779841234567'
        )
        
        self.assertEqual(preference.user, self.user)
        self.assertEqual(preference.guardian_registration, 'both')
        self.assertEqual(preference.athlete_registration, 'email')
        self.assertEqual(preference.tournament_updates, 'sms')
        self.assertEqual(preference.reminders, 'both')
        self.assertEqual(preference.marketing, 'none')
        self.assertEqual(preference.preferred_email, 'custom@example.com')
        self.assertEqual(preference.preferred_phone, '+9779841234567')
    
    def test_default_notification_preferences(self):
        """Test default notification preference values"""
        preference = NotificationPreference.objects.create(user=self.user)
        
        self.assertEqual(preference.guardian_registration, 'both')
        self.assertEqual(preference.athlete_registration, 'both')
        self.assertEqual(preference.tournament_updates, 'email')
        self.assertEqual(preference.reminders, 'both')
        self.assertEqual(preference.marketing, 'none')
    
    def test_notification_preference_str_representation(self):
        """Test string representation of notification preference"""
        preference = NotificationPreference.objects.create(user=self.user)
        
        expected_str = f'Preferences for {self.user.email}'
        self.assertEqual(str(preference), expected_str)
    
    def test_one_to_one_relationship(self):
        """Test one-to-one relationship with User"""
        # Create first preference
        preference1 = NotificationPreference.objects.create(user=self.user)
        
        # Try to create another preference for same user
        with self.assertRaises(Exception):  # Should raise IntegrityError
            NotificationPreference.objects.create(user=self.user)


class GuardianClaimTestCase(TestCase):
    """Test cases for GuardianClaim model"""
    
    def setUp(self):
        """Set up test data"""
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
        
        self.athlete = Athlete.objects.create(
            
            full_name='Test Athlete',
            date_of_birth='2005-01-01',
            gender='Male',
            school=self.school,
            
            
        )
    
    def test_create_guardian_claim(self):
        """Test creating a guardian claim"""
        expires_at = timezone.now() + timezone.timedelta(hours=24)
        
        claim = GuardianClaim.objects.create(
            athlete=self.athlete,
            guardian_phone='+9779841234567',
            guardian_email='guardian@example.com',
            claim_code='ABC123',
            expires_at=expires_at
        )
        
        self.assertEqual(claim.athlete, self.athlete)
        self.assertEqual(claim.guardian_phone, '+9779841234567')
        self.assertEqual(claim.guardian_email, 'guardian@example.com')
        self.assertEqual(claim.claim_code, 'ABC123')
        self.assertEqual(claim.status, 'pending')
        self.assertFalse(claim.requires_school_approval)
        self.assertFalse(claim.reminder_sent)
        self.assertEqual(claim.expires_at, expires_at)
        self.assertIsNone(claim.completed_at)
    
    def test_guardian_claim_with_school_approval(self):
        """Test guardian claim requiring school approval"""
        expires_at = timezone.now() + timezone.timedelta(hours=24)
        
        claim = GuardianClaim.objects.create(
            athlete=self.athlete,
            guardian_phone='+9779841234567',
            guardian_email='guardian@example.com',
            claim_code='ABC123',
            requires_school_approval=True,
            expires_at=expires_at
        )
        
        self.assertTrue(claim.requires_school_approval)
    
    def test_is_expired_method(self):
        """Test is_expired method"""
        # Create expired claim
        expired_time = timezone.now() - timezone.timedelta(hours=1)
        expired_claim = GuardianClaim.objects.create(
            athlete=self.athlete,
            guardian_phone='+9779841234567',
            guardian_email='guardian@example.com',
            claim_code='EXP123',
            expires_at=expired_time
        )
        
        # Create active claim
        active_time = timezone.now() + timezone.timedelta(hours=1)
        active_claim = GuardianClaim.objects.create(
            athlete=self.athlete,
            guardian_phone='+9779841234568',
            guardian_email='guardian2@example.com',
            claim_code='ACT123',
            expires_at=active_time
        )
        
        self.assertTrue(expired_claim.is_expired())
        self.assertFalse(active_claim.is_expired())
    
    def test_mark_as_completed(self):
        """Test marking claim as completed"""
        expires_at = timezone.now() + timezone.timedelta(hours=24)
        
        claim = GuardianClaim.objects.create(
            athlete=self.athlete,
            guardian_phone='+9779841234567',
            guardian_email='guardian@example.com',
            claim_code='ABC123',
            expires_at=expires_at
        )
        
        # Initially pending
        self.assertEqual(claim.status, 'pending')
        self.assertIsNone(claim.completed_at)
        
        # Mark as completed
        claim.mark_as_completed()
        
        self.assertEqual(claim.status, 'completed')
        self.assertIsNotNone(claim.completed_at)
    
    def test_guardian_claim_str_representation(self):
        """Test string representation of guardian claim"""
        expires_at = timezone.now() + timezone.timedelta(hours=24)
        
        claim = GuardianClaim.objects.create(
            athlete=self.athlete,
            guardian_phone='+9779841234567',
            guardian_email='guardian@example.com',
            claim_code='ABC123',
            expires_at=expires_at
        )
        
        expected_str = f'Claim ABC123 for {self.athlete.full_name}'
        self.assertEqual(str(claim), expected_str)
    
    def test_unique_claim_code(self):
        """Test unique constraint on claim code"""
        expires_at = timezone.now() + timezone.timedelta(hours=24)
        
        # Create first claim
        GuardianClaim.objects.create(
            athlete=self.athlete,
            guardian_phone='+9779841234567',
            guardian_email='guardian@example.com',
            claim_code='ABC123',
            expires_at=expires_at
        )
        
        # Try to create duplicate claim code
        with self.assertRaises(Exception):  # Should raise IntegrityError
            GuardianClaim.objects.create(
                athlete=self.athlete,
                guardian_phone='+9779841234568',
                guardian_email='guardian2@example.com',
                claim_code='ABC123',  # Same claim code
                expires_at=expires_at
            )


class NotificationModelIntegrationTestCase(TestCase):
    """Integration tests for notification models"""
    
    def setUp(self):
        """Set up test data"""
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
        
        self.athlete = Athlete.objects.create(
            
            full_name='Test Athlete',
            date_of_birth='2005-01-01',
            gender='Male',
            school=self.school,
            
            
        )
    
    def test_complete_notification_workflow(self):
        """Test complete notification workflow with all models"""
        # Create template
        template = NotificationTemplate.objects.create(
            name='Guardian Registration Template',
            template_type='email',
            category='guardian_registration',
            subject='Guardian Registration for {{ athlete_name }}',
            content='Hello, your claim code is {{ claim_code }}.'
        )
        
        # Create guardian claim
        expires_at = timezone.now() + timezone.timedelta(hours=24)
        claim = GuardianClaim.objects.create(
            athlete=self.athlete,
            guardian_phone='+9779841234567',
            guardian_email='guardian@example.com',
            claim_code='ABC123',
            expires_at=expires_at
        )
        
        # Create notification log
        content_type = ContentType.objects.get_for_model(self.athlete)
        log = NotificationLog.objects.create(
            notification_type='email',
            template=template,
            recipient_email='guardian@example.com',
            subject='Guardian Registration for Test Athlete',
            content='Hello, your claim code is ABC123.',
            context_data={'athlete_name': 'Test Athlete', 'claim_code': 'ABC123'},
            content_type=content_type,
            object_id=self.athlete.pk
        )
        
        # Create notification preferences
        preference = NotificationPreference.objects.create(
            user=self.user,
            guardian_registration='both'
        )
        
        # Verify relationships
        self.assertEqual(log.template, template)
        self.assertEqual(log.content_object, self.athlete)
        self.assertEqual(claim.athlete, self.athlete)
        self.assertEqual(preference.user, self.user)
        
        # Test workflow progression
        log.mark_as_sent('external-id-123')
        self.assertEqual(log.status, 'sent')
        
        claim.mark_as_completed()
        self.assertEqual(claim.status, 'completed')
        
        log.mark_as_delivered()
        self.assertEqual(log.status, 'delivered')
