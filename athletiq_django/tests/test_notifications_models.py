"""
Unit tests for notifications models.
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.notifications.models import NotificationTemplate, NotificationLog, NotificationPreference, GuardianClaim
from tests.factories import UserFactory, GuardianFactory, NotificationFactory


class NotificationTemplateModelTest(TestCase):
    """Test cases for NotificationTemplate model."""
    
    def setUp(self):
        """Set up test data."""
        self.template_data = {
            'name': 'Welcome Email',
            'template_type': 'email',
            'subject': 'Welcome to Athletiq',
            'content': 'Hello {{ name }}, welcome to Athletiq platform!',
            'variables': ['name', 'platform'],
            'is_active': True,
            'language': 'en'
        }
    
    def test_notification_template_creation(self):
        """Test basic notification template creation."""
        template = NotificationTemplate.objects.create(**self.template_data)
        
        self.assertEqual(template.name, 'Welcome Email')
        self.assertEqual(template.template_type, 'email')
        self.assertEqual(template.subject, 'Welcome to Athletiq')
        self.assertTrue(template.is_active)
        self.assertEqual(template.language, 'en')
        self.assertIsNotNone(template.created_at)
        self.assertIsNotNone(template.updated_at)
    
    def test_notification_template_str_representation(self):
        """Test notification template string representation."""
        template = NotificationTemplate.objects.create(**self.template_data)
        expected = f"{template.name} ({template.template_type})"
        self.assertEqual(str(template), expected)
    
    def test_template_type_choices_validation(self):
        """Test template type field validation."""
        valid_types = ['email', 'sms', 'push', 'in_app']
        
        for template_type in valid_types:
            template_data = self.template_data.copy()
            template_data['template_type'] = template_type
            template_data['name'] = f'{template_type.title()} Template'
            
            template = NotificationTemplate.objects.create(**template_data)
            self.assertEqual(template.template_type, template_type)
    
    def test_language_choices_validation(self):
        """Test language field validation."""
        valid_languages = ['en', 'es', 'fr', 'de', 'ne', 'hi']
        
        for language in valid_languages:
            template_data = self.template_data.copy()
            template_data['language'] = language
            template_data['name'] = f'Template {language.upper()}'
            
            template = NotificationTemplate.objects.create(**template_data)
            self.assertEqual(template.language, language)
    
    def test_variables_json_field(self):
        """Test variables JSON field functionality."""
        template = NotificationTemplate.objects.create(**self.template_data)
        
        expected_variables = ['name', 'platform']
        self.assertEqual(template.variables, expected_variables)
        
        # Update variables
        template.variables.append('email')
        template.save()
        
        template.refresh_from_db()
        self.assertIn('email', template.variables)
        self.assertEqual(len(template.variables), 3)
    
    def test_unique_name_per_type_and_language(self):
        """Test unique constraint on name, type, and language."""
        NotificationTemplate.objects.create(**self.template_data)
        
        # Try to create another template with same name, type, and language
        with self.assertRaises(IntegrityError):
            NotificationTemplate.objects.create(**self.template_data)
        
        # But different language should work
        template_data_2 = self.template_data.copy()
        template_data_2['language'] = 'es'
        template2 = NotificationTemplate.objects.create(**template_data_2)
        self.assertEqual(template2.language, 'es')


class NotificationLogModelTest(TestCase):
    """Test cases for NotificationLog model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.guardian = GuardianFactory()
        self.template = NotificationTemplate.objects.create(
            name='Test Template',
            template_type='email',
            subject='Test Subject',
            content='Test content',
            variables=[],
            is_active=True,
            language='en'
        )
        self.log_data = {
            'template': self.template,
            'notification_type': 'email',
            'recipient_type': 'user',
            'recipient_id': self.user.user_id,
            'recipient_email': self.user.email,
            'subject': 'Test Notification',
            'content': 'This is a test notification',
            'status': 'sent',
            'priority': 'medium',
            'metadata': {
                'ip_address': '192.168.1.1',
                'user_agent': 'Mozilla/5.0',
                'delivery_attempt': 1
            }
        }
    
    def test_notification_log_creation(self):
        """Test basic notification log creation."""
        log = NotificationLog.objects.create(**self.log_data)
        
        self.assertEqual(log.template, self.template)
        self.assertEqual(log.notification_type, 'email')
        self.assertEqual(log.recipient_type, 'user')
        self.assertEqual(log.recipient_id, self.user.user_id)
        self.assertEqual(log.status, 'sent')
        self.assertEqual(log.priority, 'medium')
        self.assertIsNotNone(log.created_at)
        self.assertIsNotNone(log.updated_at)
    
    def test_notification_log_str_representation(self):
        """Test notification log string representation."""
        log = NotificationLog.objects.create(**self.log_data)
        expected = f"{log.notification_type} to {log.recipient_email} - {log.status}"
        self.assertEqual(str(log), expected)
    
    def test_notification_type_choices(self):
        """Test notification type choices."""
        valid_types = ['email', 'sms', 'push', 'in_app']
        
        for notif_type in valid_types:
            log_data = self.log_data.copy()
            log_data['notification_type'] = notif_type
            log_data['subject'] = f'Test {notif_type}'
            
            log = NotificationLog.objects.create(**log_data)
            self.assertEqual(log.notification_type, notif_type)
    
    def test_recipient_type_choices(self):
        """Test recipient type choices."""
        valid_types = ['user', 'guardian', 'school', 'system']
        
        for recipient_type in valid_types:
            log_data = self.log_data.copy()
            log_data['recipient_type'] = recipient_type
            log_data['subject'] = f'Test to {recipient_type}'
            
            log = NotificationLog.objects.create(**log_data)
            self.assertEqual(log.recipient_type, recipient_type)
    
    def test_status_choices_validation(self):
        """Test status field validation."""
        valid_statuses = ['pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked']
        
        for status in valid_statuses:
            log_data = self.log_data.copy()
            log_data['status'] = status
            log_data['subject'] = f'Test {status}'
            
            log = NotificationLog.objects.create(**log_data)
            self.assertEqual(log.status, status)
    
    def test_priority_choices_validation(self):
        """Test priority field validation."""
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        
        for priority in valid_priorities:
            log_data = self.log_data.copy()
            log_data['priority'] = priority
            log_data['subject'] = f'Test {priority}'
            
            log = NotificationLog.objects.create(**log_data)
            self.assertEqual(log.priority, priority)
    
    def test_metadata_json_field(self):
        """Test metadata JSON field functionality."""
        log = NotificationLog.objects.create(**self.log_data)
        
        expected_metadata = {
            'ip_address': '192.168.1.1',
            'user_agent': 'Mozilla/5.0',
            'delivery_attempt': 1
        }
        self.assertEqual(log.metadata, expected_metadata)
        
        # Update metadata
        log.metadata['response_code'] = 200
        log.save()
        
        log.refresh_from_db()
        self.assertEqual(log.metadata['response_code'], 200)
    
    def test_guardian_recipient(self):
        """Test notification log for guardian recipient."""
        log_data = self.log_data.copy()
        log_data['recipient_type'] = 'guardian'
        log_data['recipient_id'] = self.guardian.guardian_id
        log_data['recipient_email'] = self.guardian.email
        
        log = NotificationLog.objects.create(**log_data)
        
        self.assertEqual(log.recipient_type, 'guardian')
        self.assertEqual(log.recipient_id, self.guardian.guardian_id)
        self.assertEqual(log.recipient_email, self.guardian.email)
    
    def test_delivery_timestamps(self):
        """Test delivery timestamp fields."""
        log = NotificationLog.objects.create(**self.log_data)
        
        # Initially no delivery timestamps
        self.assertIsNone(log.sent_at)
        self.assertIsNone(log.delivered_at)
        self.assertIsNone(log.opened_at)
        
        # Update timestamps
        now = timezone.now()
        log.sent_at = now
        log.delivered_at = now + timedelta(seconds=5)
        log.opened_at = now + timedelta(minutes=10)
        log.save()
        
        log.refresh_from_db()
        self.assertIsNotNone(log.sent_at)
        self.assertIsNotNone(log.delivered_at)
        self.assertIsNotNone(log.opened_at)


class NotificationPreferenceModelTest(TestCase):
    """Test cases for NotificationPreference model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.guardian = GuardianFactory()
        self.preference_data = {
            'user_type': 'user',
            'user_id': self.user.user_id,
            'email_notifications': True,
            'sms_notifications': False,
            'push_notifications': True,
            'in_app_notifications': True,
            'notification_frequency': 'immediate',
            'quiet_hours_start': '22:00',
            'quiet_hours_end': '08:00',
            'preferences': {
                'tournament_updates': True,
                'athlete_registration': True,
                'system_maintenance': False,
                'marketing': False
            }
        }
    
    def test_notification_preference_creation(self):
        """Test basic notification preference creation."""
        preference = NotificationPreference.objects.create(**self.preference_data)
        
        self.assertEqual(preference.user_type, 'user')
        self.assertEqual(preference.user_id, self.user.user_id)
        self.assertTrue(preference.email_notifications)
        self.assertFalse(preference.sms_notifications)
        self.assertTrue(preference.push_notifications)
        self.assertEqual(preference.notification_frequency, 'immediate')
        self.assertIsNotNone(preference.created_at)
        self.assertIsNotNone(preference.updated_at)
    
    def test_notification_preference_str_representation(self):
        """Test notification preference string representation."""
        preference = NotificationPreference.objects.create(**self.preference_data)
        expected = f"Preferences for {preference.user_type} {preference.user_id}"
        self.assertEqual(str(preference), expected)
    
    def test_user_type_choices(self):
        """Test user type choices."""
        valid_types = ['user', 'guardian', 'school']
        
        for user_type in valid_types:
            preference_data = self.preference_data.copy()
            preference_data['user_type'] = user_type
            
            if user_type == 'guardian':
                preference_data['user_id'] = self.guardian.guardian_id
            elif user_type == 'school':
                preference_data['user_id'] = 1  # School ID
            
            preference = NotificationPreference.objects.create(**preference_data)
            self.assertEqual(preference.user_type, user_type)
    
    def test_notification_frequency_choices(self):
        """Test notification frequency choices."""
        valid_frequencies = ['immediate', 'hourly', 'daily', 'weekly', 'never']
        
        for frequency in valid_frequencies:
            preference_data = self.preference_data.copy()
            preference_data['notification_frequency'] = frequency
            preference_data['user_id'] = preference_data['user_id'] + 1  # Unique user_id
            
            preference = NotificationPreference.objects.create(**preference_data)
            self.assertEqual(preference.notification_frequency, frequency)
    
    def test_quiet_hours_validation(self):
        """Test quiet hours time validation."""
        preference = NotificationPreference.objects.create(**self.preference_data)
        
        self.assertEqual(preference.quiet_hours_start, '22:00')
        self.assertEqual(preference.quiet_hours_end, '08:00')
        
        # Update quiet hours
        preference.quiet_hours_start = '23:30'
        preference.quiet_hours_end = '07:30'
        preference.save()
        
        preference.refresh_from_db()
        self.assertEqual(preference.quiet_hours_start, '23:30')
        self.assertEqual(preference.quiet_hours_end, '07:30')
    
    def test_preferences_json_field(self):
        """Test preferences JSON field functionality."""
        preference = NotificationPreference.objects.create(**self.preference_data)
        
        expected_preferences = {
            'tournament_updates': True,
            'athlete_registration': True,
            'system_maintenance': False,
            'marketing': False
        }
        self.assertEqual(preference.preferences, expected_preferences)
        
        # Update preferences
        preference.preferences['new_feature_announcements'] = True
        preference.save()
        
        preference.refresh_from_db()
        self.assertTrue(preference.preferences['new_feature_announcements'])
    
    def test_unique_user_constraint(self):
        """Test unique constraint on user_type and user_id."""
        NotificationPreference.objects.create(**self.preference_data)
        
        # Try to create another preference for same user
        with self.assertRaises(IntegrityError):
            NotificationPreference.objects.create(**self.preference_data)


class GuardianClaimModelTest(TestCase):
    """Test cases for GuardianClaim model."""
    
    def setUp(self):
        """Set up test data."""
        self.guardian = GuardianFactory()
        self.claim_data = {
            'guardian': self.guardian,
            'claim_code': 'CLAIM123456',
            'athlete_name': 'John Doe',
            'athlete_dob': '2005-01-15',
            'relationship': 'Father',
            'status': 'active',
            'expires_at': timezone.now() + timedelta(days=30),
            'usage_count': 0,
            'max_usage': 1,
            'metadata': {
                'generated_by': 'system',
                'ip_address': '192.168.1.1',
                'verification_method': 'email'
            }
        }
    
    def test_guardian_claim_creation(self):
        """Test basic guardian claim creation."""
        claim = GuardianClaim.objects.create(**self.claim_data)
        
        self.assertEqual(claim.guardian, self.guardian)
        self.assertEqual(claim.claim_code, 'CLAIM123456')
        self.assertEqual(claim.athlete_name, 'John Doe')
        self.assertEqual(claim.relationship, 'Father')
        self.assertEqual(claim.status, 'active')
        self.assertEqual(claim.usage_count, 0)
        self.assertEqual(claim.max_usage, 1)
        self.assertIsNotNone(claim.created_at)
        self.assertIsNotNone(claim.updated_at)
    
    def test_guardian_claim_str_representation(self):
        """Test guardian claim string representation."""
        claim = GuardianClaim.objects.create(**self.claim_data)
        expected = f"Claim {claim.claim_code} for {claim.athlete_name}"
        self.assertEqual(str(claim), expected)
    
    def test_unique_claim_code_constraint(self):
        """Test that claim_code must be unique."""
        GuardianClaim.objects.create(**self.claim_data)
        
        # Try to create another claim with same code
        claim_data_2 = self.claim_data.copy()
        claim_data_2['guardian'] = GuardianFactory()
        claim_data_2['athlete_name'] = 'Jane Doe'
        
        with self.assertRaises(IntegrityError):
            GuardianClaim.objects.create(**claim_data_2)
    
    def test_status_choices_validation(self):
        """Test status field validation."""
        valid_statuses = ['active', 'used', 'expired', 'revoked']
        
        for status in valid_statuses:
            claim_data = self.claim_data.copy()
            claim_data['status'] = status
            claim_data['claim_code'] = f'CLAIM{status.upper()}'
            claim_data['guardian'] = GuardianFactory()
            
            claim = GuardianClaim.objects.create(**claim_data)
            self.assertEqual(claim.status, status)
    
    def test_relationship_choices_validation(self):
        """Test relationship field validation."""
        valid_relationships = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Other']
        
        for relationship in valid_relationships:
            claim_data = self.claim_data.copy()
            claim_data['relationship'] = relationship
            claim_data['claim_code'] = f'CLAIM{relationship[:3].upper()}'
            claim_data['guardian'] = GuardianFactory()
            
            claim = GuardianClaim.objects.create(**claim_data)
            self.assertEqual(claim.relationship, relationship)
    
    def test_usage_tracking(self):
        """Test claim usage tracking."""
        claim = GuardianClaim.objects.create(**self.claim_data)
        
        # Initially unused
        self.assertEqual(claim.usage_count, 0)
        self.assertTrue(claim.can_be_used())
        
        # Use the claim
        claim.usage_count += 1
        claim.save()
        
        claim.refresh_from_db()
        self.assertEqual(claim.usage_count, 1)
        self.assertFalse(claim.can_be_used())  # Reached max usage
    
    def test_expiration_check(self):
        """Test claim expiration checking."""
        # Active claim (not expired)
        claim = GuardianClaim.objects.create(**self.claim_data)
        self.assertFalse(claim.is_expired())
        
        # Expired claim
        expired_claim_data = self.claim_data.copy()
        expired_claim_data['expires_at'] = timezone.now() - timedelta(days=1)
        expired_claim_data['claim_code'] = 'EXPIRED123'
        expired_claim_data['guardian'] = GuardianFactory()
        
        expired_claim = GuardianClaim.objects.create(**expired_claim_data)
        self.assertTrue(expired_claim.is_expired())
    
    def test_metadata_json_field(self):
        """Test metadata JSON field functionality."""
        claim = GuardianClaim.objects.create(**self.claim_data)
        
        expected_metadata = {
            'generated_by': 'system',
            'ip_address': '192.168.1.1',
            'verification_method': 'email'
        }
        self.assertEqual(claim.metadata, expected_metadata)
        
        # Update metadata
        claim.metadata['used_at'] = timezone.now().isoformat()
        claim.save()
        
        claim.refresh_from_db()
        self.assertIn('used_at', claim.metadata)


@pytest.mark.django_db
class TestNotificationModelsPytest:
    """Pytest-style tests for notification models."""
    
    def test_notification_template_content_rendering(self):
        """Test notification template content with variables."""
        template = NotificationTemplate.objects.create(
            name='Dynamic Template',
            template_type='email',
            subject='Welcome {{ name }}',
            content='Hello {{ name }}, your account for {{ platform }} is ready!',
            variables=['name', 'platform'],
            is_active=True,
            language='en'
        )
        
        # Test variable extraction
        assert 'name' in template.variables
        assert 'platform' in template.variables
        assert len(template.variables) == 2
    
    def test_notification_log_bulk_operations(self):
        """Test bulk notification logging."""
        template = NotificationTemplate.objects.create(
            name='Bulk Template',
            template_type='email',
            subject='Bulk Notification',
            content='This is a bulk notification',
            variables=[],
            is_active=True,
            language='en'
        )
        
        # Create multiple notification logs
        users = UserFactory.create_batch(5)
        logs = []
        
        for i, user in enumerate(users):
            log = NotificationLog.objects.create(
                template=template,
                notification_type='email',
                recipient_type='user',
                recipient_id=user.user_id,
                recipient_email=user.email,
                subject=f'Bulk Notification {i}',
                content='Bulk notification content',
                status='sent',
                priority='medium'
            )
            logs.append(log)
        
        assert len(logs) == 5
        assert NotificationLog.objects.filter(template=template).count() == 5
    
    def test_notification_preference_inheritance(self):
        """Test notification preference inheritance and defaults."""
        user = UserFactory()
        
        # Create preference with some defaults
        preference = NotificationPreference.objects.create(
            user_type='user',
            user_id=user.user_id,
            email_notifications=True,
            sms_notifications=True,
            push_notifications=False,
            notification_frequency='daily',
            preferences={
                'tournament_updates': True,
                'system_notifications': False
            }
        )
        
        # Test that preferences are stored correctly
        assert preference.email_notifications is True
        assert preference.sms_notifications is True
        assert preference.push_notifications is False
        assert preference.notification_frequency == 'daily'
        assert preference.preferences['tournament_updates'] is True
        assert preference.preferences['system_notifications'] is False
    
    def test_guardian_claim_code_generation(self):
        """Test guardian claim code uniqueness and format."""
        guardian = GuardianFactory()
        
        # Create multiple claims with different codes
        claim_codes = ['CLAIM001', 'CLAIM002', 'CLAIM003']
        claims = []
        
        for code in claim_codes:
            claim = GuardianClaim.objects.create(
                guardian=guardian,
                claim_code=code,
                athlete_name=f'Athlete {code}',
                athlete_dob='2005-01-15',
                relationship='Father',
                status='active',
                expires_at=timezone.now() + timedelta(days=30)
            )
            claims.append(claim)
        
        # All claims should be created successfully
        assert len(claims) == 3
        
        # All claim codes should be unique
        codes = [claim.claim_code for claim in claims]
        assert len(set(codes)) == 3
    
    def test_notification_log_status_transitions(self):
        """Test notification log status transitions."""
        template = NotificationTemplate.objects.create(
            name='Status Test Template',
            template_type='email',
            subject='Status Test',
            content='Testing status transitions',
            variables=[],
            is_active=True,
            language='en'
        )
        
        user = UserFactory()
        
        log = NotificationLog.objects.create(
            template=template,
            notification_type='email',
            recipient_type='user',
            recipient_id=user.user_id,
            recipient_email=user.email,
            subject='Status Test',
            content='Testing status',
            status='pending',
            priority='medium'
        )
        
        # Test status transitions
        statuses = ['pending', 'sent', 'delivered', 'opened']
        
        for status in statuses:
            log.status = status
            log.save()
            log.refresh_from_db()
            assert log.status == status