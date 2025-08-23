"""
Unit tests for guardians models.
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta
import bcrypt

from apps.guardians.models import Guardian, GuardianSession, AthleteClaimRequest, GuardianNotification
from tests.factories import GuardianFactory, AthleteFactory


class GuardianModelTest(TestCase):
    """Test cases for Guardian model."""
    
    def setUp(self):
        """Set up test data."""
        self.guardian_data = {
            'full_name': 'John Smith',
            'email': 'john.smith@example.com',
            'phone': '+977-9841234567',
            'password_hash': '$2b$10$test.hash.for.testing',
            'address': '123 Main St, Kathmandu',
            'city': 'Kathmandu',
            'province': 'Bagmati',
            'district': 'Kathmandu',
            'verification_status': 'verified',
            'email_verified': True,
            'phone_verified': True
        }
    
    def test_guardian_creation(self):
        """Test basic guardian creation."""
        guardian = Guardian.objects.create(**self.guardian_data)
        
        self.assertEqual(guardian.full_name, 'John Smith')
        self.assertEqual(guardian.email, 'john.smith@example.com')
        self.assertEqual(guardian.phone, '+977-9841234567')
        self.assertEqual(guardian.verification_status, 'verified')
        self.assertTrue(guardian.email_verified)
        self.assertTrue(guardian.phone_verified)
        self.assertTrue(guardian.is_active)
        self.assertIsNotNone(guardian.created_at)
        self.assertIsNotNone(guardian.updated_at)
    
    def test_guardian_str_representation(self):
        """Test guardian string representation."""
        guardian = Guardian.objects.create(**self.guardian_data)
        expected = f"{guardian.full_name} ({guardian.email})"
        self.assertEqual(str(guardian), expected)
    
    def test_unique_email_constraint(self):
        """Test that email must be unique."""
        Guardian.objects.create(**self.guardian_data)
        
        # Try to create another guardian with same email
        guardian_data_2 = self.guardian_data.copy()
        guardian_data_2['full_name'] = 'Jane Smith'
        guardian_data_2['phone'] = '+977-9851234567'
        
        with self.assertRaises(IntegrityError):
            Guardian.objects.create(**guardian_data_2)
    
    def test_unique_phone_constraint(self):
        """Test that phone must be unique."""
        Guardian.objects.create(**self.guardian_data)
        
        # Try to create another guardian with same phone
        guardian_data_2 = self.guardian_data.copy()
        guardian_data_2['full_name'] = 'Jane Smith'
        guardian_data_2['email'] = 'jane.smith@example.com'
        
        with self.assertRaises(IntegrityError):
            Guardian.objects.create(**guardian_data_2)
    
    def test_set_password_bcrypt(self):
        """Test password setting with bcrypt."""
        guardian = Guardian.objects.create(**self.guardian_data)
        password = 'testpassword123'
        
        guardian.set_password(password)
        
        self.assertIsNotNone(guardian.password_hash)
        self.assertTrue(guardian.password_hash.startswith('$2b$'))
        self.assertTrue(guardian.check_password(password))
    
    def test_check_password_bcrypt(self):
        """Test password checking with bcrypt."""
        guardian = Guardian.objects.create(**self.guardian_data)
        password = 'testpassword123'
        wrong_password = 'wrongpassword'
        
        guardian.set_password(password)
        
        self.assertTrue(guardian.check_password(password))
        self.assertFalse(guardian.check_password(wrong_password))
    
    def test_verification_status_choices(self):
        """Test verification status choices."""
        valid_statuses = ['pending', 'verified', 'rejected', 'suspended']
        
        for status in valid_statuses:
            guardian_data = self.guardian_data.copy()
            guardian_data['verification_status'] = status
            guardian_data['email'] = f'test_{status}@example.com'
            guardian_data['phone'] = f'+977-984{status[:4]}'
            
            guardian = Guardian.objects.create(**guardian_data)
            self.assertEqual(guardian.verification_status, status)
    
    def test_is_verified_property(self):
        """Test is_verified property."""
        guardian = Guardian.objects.create(**self.guardian_data)
        
        # Fully verified
        guardian.verification_status = 'verified'
        guardian.email_verified = True
        guardian.phone_verified = True
        self.assertTrue(guardian.is_verified)
        
        # Not verified - status
        guardian.verification_status = 'pending'
        self.assertFalse(guardian.is_verified)
        
        # Not verified - email
        guardian.verification_status = 'verified'
        guardian.email_verified = False
        self.assertFalse(guardian.is_verified)
        
        # Not verified - phone
        guardian.email_verified = True
        guardian.phone_verified = False
        self.assertFalse(guardian.is_verified)
    
    def test_athletes_relationship(self):
        """Test guardian-athletes relationship."""
        guardian = Guardian.objects.create(**self.guardian_data)
        athlete1 = AthleteFactory(guardian=guardian)
        athlete2 = AthleteFactory(guardian=guardian)
        
        guardian_athletes = guardian.athletes.all()
        self.assertIn(athlete1, guardian_athletes)
        self.assertIn(athlete2, guardian_athletes)
        self.assertEqual(guardian_athletes.count(), 2)
    
    def test_guardian_factory(self):
        """Test GuardianFactory creates valid guardians."""
        guardian = GuardianFactory()
        
        self.assertIsNotNone(guardian.full_name)
        self.assertIsNotNone(guardian.email)
        self.assertIsNotNone(guardian.phone)
        self.assertTrue(guardian.is_active)


class GuardianSessionModelTest(TestCase):
    """Test cases for GuardianSession model."""
    
    def setUp(self):
        """Set up test data."""
        self.guardian = GuardianFactory()
        self.session_data = {
            'guardian': self.guardian,
            'session_token': 'test_guardian_token_123',
            'ip_address': '192.168.1.1',
            'user_agent': 'Mozilla/5.0 Guardian Browser',
            'expires_at': timezone.now() + timedelta(hours=24)
        }
    
    def test_guardian_session_creation(self):
        """Test basic guardian session creation."""
        session = GuardianSession.objects.create(**self.session_data)
        
        self.assertEqual(session.guardian, self.guardian)
        self.assertEqual(session.session_token, 'test_guardian_token_123')
        self.assertEqual(session.ip_address, '192.168.1.1')
        self.assertTrue(session.is_active)
        self.assertIsNotNone(session.created_at)
        self.assertIsNotNone(session.last_activity)
    
    def test_guardian_session_str_representation(self):
        """Test guardian session string representation."""
        session = GuardianSession.objects.create(**self.session_data)
        expected = f"Guardian session for {self.guardian.email} from {session.ip_address}"
        self.assertEqual(str(session), expected)
    
    def test_unique_session_token(self):
        """Test that session token must be unique."""
        GuardianSession.objects.create(**self.session_data)
        
        # Try to create another session with same token
        session_data_2 = self.session_data.copy()
        session_data_2['guardian'] = GuardianFactory()
        
        with self.assertRaises(IntegrityError):
            GuardianSession.objects.create(**session_data_2)
    
    def test_guardian_session_relationship(self):
        """Test guardian-session relationship."""
        session1 = GuardianSession.objects.create(**self.session_data)
        
        # Create another session for same guardian
        session_data_2 = self.session_data.copy()
        session_data_2['session_token'] = 'different_guardian_token'
        session2 = GuardianSession.objects.create(**session_data_2)
        
        # Test reverse relationship
        guardian_sessions = self.guardian.sessions.all()
        self.assertIn(session1, guardian_sessions)
        self.assertIn(session2, guardian_sessions)
        self.assertEqual(guardian_sessions.count(), 2)
    
    def test_session_cascade_delete(self):
        """Test that sessions are deleted when guardian is deleted."""
        session = GuardianSession.objects.create(**self.session_data)
        session_id = session.id
        
        # Delete guardian
        self.guardian.delete()
        
        # Session should be deleted too
        with self.assertRaises(GuardianSession.DoesNotExist):
            GuardianSession.objects.get(id=session_id)


class AthleteClaimRequestModelTest(TestCase):
    """Test cases for AthleteClaimRequest model."""
    
    def setUp(self):
        """Set up test data."""
        self.guardian = GuardianFactory()
        self.athlete = AthleteFactory()
        self.claim_data = {
            'guardian': self.guardian,
            'athlete': self.athlete,
            'claim_code': 'CLAIM123456',
            'relationship': 'Father',
            'status': 'pending',
            'verification_documents': {
                'birth_certificate': '/uploads/birth_cert.pdf',
                'guardian_id': '/uploads/guardian_id.jpg'
            },
            'notes': 'Requesting to claim my son'
        }
    
    def test_claim_request_creation(self):
        """Test basic claim request creation."""
        claim = AthleteClaimRequest.objects.create(**self.claim_data)
        
        self.assertEqual(claim.guardian, self.guardian)
        self.assertEqual(claim.athlete, self.athlete)
        self.assertEqual(claim.claim_code, 'CLAIM123456')
        self.assertEqual(claim.relationship, 'Father')
        self.assertEqual(claim.status, 'pending')
        self.assertIsNotNone(claim.created_at)
        self.assertIsNotNone(claim.updated_at)
    
    def test_claim_request_str_representation(self):
        """Test claim request string representation."""
        claim = AthleteClaimRequest.objects.create(**self.claim_data)
        expected = f"{claim.guardian.full_name} claiming {claim.athlete.full_name}"
        self.assertEqual(str(claim), expected)
    
    def test_unique_claim_code_constraint(self):
        """Test that claim_code must be unique."""
        AthleteClaimRequest.objects.create(**self.claim_data)
        
        # Try to create another claim with same code
        claim_data_2 = self.claim_data.copy()
        claim_data_2['guardian'] = GuardianFactory()
        claim_data_2['athlete'] = AthleteFactory()
        
        with self.assertRaises(IntegrityError):
            AthleteClaimRequest.objects.create(**claim_data_2)
    
    def test_unique_guardian_athlete_constraint(self):
        """Test that guardian can only have one active claim per athlete."""
        AthleteClaimRequest.objects.create(**self.claim_data)
        
        # Try to create another claim for same guardian-athlete pair
        claim_data_2 = self.claim_data.copy()
        claim_data_2['claim_code'] = 'CLAIM789012'
        
        with self.assertRaises(IntegrityError):
            AthleteClaimRequest.objects.create(**claim_data_2)
    
    def test_status_choices_validation(self):
        """Test status field validation."""
        valid_statuses = ['pending', 'approved', 'rejected', 'expired']
        
        for status in valid_statuses:
            claim_data = self.claim_data.copy()
            claim_data['status'] = status
            claim_data['claim_code'] = f'CLAIM{status[:3].upper()}'
            claim_data['guardian'] = GuardianFactory()
            claim_data['athlete'] = AthleteFactory()
            
            claim = AthleteClaimRequest.objects.create(**claim_data)
            self.assertEqual(claim.status, status)
    
    def test_relationship_choices_validation(self):
        """Test relationship field validation."""
        valid_relationships = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Other']
        
        for relationship in valid_relationships:
            claim_data = self.claim_data.copy()
            claim_data['relationship'] = relationship
            claim_data['claim_code'] = f'CLAIM{relationship[:3].upper()}'
            claim_data['guardian'] = GuardianFactory()
            claim_data['athlete'] = AthleteFactory()
            
            claim = AthleteClaimRequest.objects.create(**claim_data)
            self.assertEqual(claim.relationship, relationship)
    
    def test_verification_documents_json_field(self):
        """Test verification_documents JSON field."""
        claim = AthleteClaimRequest.objects.create(**self.claim_data)
        
        expected_docs = {
            'birth_certificate': '/uploads/birth_cert.pdf',
            'guardian_id': '/uploads/guardian_id.jpg'
        }
        self.assertEqual(claim.verification_documents, expected_docs)
        
        # Update documents
        claim.verification_documents['school_letter'] = '/uploads/school_letter.pdf'
        claim.save()
        
        claim.refresh_from_db()
        self.assertIn('school_letter', claim.verification_documents)


class GuardianNotificationModelTest(TestCase):
    """Test cases for GuardianNotification model."""
    
    def setUp(self):
        """Set up test data."""
        self.guardian = GuardianFactory()
        self.notification_data = {
            'guardian': self.guardian,
            'title': 'Athlete Claim Approved',
            'message': 'Your claim for athlete John Doe has been approved.',
            'notification_type': 'claim_approved',
            'status': 'pending',
            'priority': 'medium',
            'data': {
                'athlete_id': 'NP-0000001',
                'claim_id': 123
            }
        }
    
    def test_guardian_notification_creation(self):
        """Test basic guardian notification creation."""
        notification = GuardianNotification.objects.create(**self.notification_data)
        
        self.assertEqual(notification.guardian, self.guardian)
        self.assertEqual(notification.title, 'Athlete Claim Approved')
        self.assertEqual(notification.notification_type, 'claim_approved')
        self.assertEqual(notification.status, 'pending')
        self.assertEqual(notification.priority, 'medium')
        self.assertIsNotNone(notification.created_at)
        self.assertIsNotNone(notification.updated_at)
    
    def test_guardian_notification_str_representation(self):
        """Test guardian notification string representation."""
        notification = GuardianNotification.objects.create(**self.notification_data)
        expected = f"{notification.title} for {notification.guardian.full_name}"
        self.assertEqual(str(notification), expected)
    
    def test_notification_type_choices(self):
        """Test notification type choices."""
        valid_types = ['claim_approved', 'claim_rejected', 'athlete_registered', 
                      'tournament_invitation', 'document_required', 'general']
        
        for notif_type in valid_types:
            notification_data = self.notification_data.copy()
            notification_data['notification_type'] = notif_type
            notification_data['title'] = f'Test {notif_type}'
            
            notification = GuardianNotification.objects.create(**notification_data)
            self.assertEqual(notification.notification_type, notif_type)
    
    def test_status_choices_validation(self):
        """Test status field validation."""
        valid_statuses = ['pending', 'sent', 'delivered', 'read', 'failed']
        
        for status in valid_statuses:
            notification_data = self.notification_data.copy()
            notification_data['status'] = status
            notification_data['title'] = f'Test {status}'
            
            notification = GuardianNotification.objects.create(**notification_data)
            self.assertEqual(notification.status, status)
    
    def test_priority_choices_validation(self):
        """Test priority field validation."""
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        
        for priority in valid_priorities:
            notification_data = self.notification_data.copy()
            notification_data['priority'] = priority
            notification_data['title'] = f'Test {priority}'
            
            notification = GuardianNotification.objects.create(**notification_data)
            self.assertEqual(notification.priority, priority)
    
    def test_data_json_field(self):
        """Test data JSON field functionality."""
        notification = GuardianNotification.objects.create(**self.notification_data)
        
        expected_data = {
            'athlete_id': 'NP-0000001',
            'claim_id': 123
        }
        self.assertEqual(notification.data, expected_data)
        
        # Update data
        notification.data['tournament_id'] = 'TMT00001'
        notification.save()
        
        notification.refresh_from_db()
        self.assertIn('tournament_id', notification.data)
    
    def test_guardian_notification_relationship(self):
        """Test guardian-notification relationship."""
        notification1 = GuardianNotification.objects.create(**self.notification_data)
        
        # Create another notification for same guardian
        notification_data_2 = self.notification_data.copy()
        notification_data_2['title'] = 'Second Notification'
        notification2 = GuardianNotification.objects.create(**notification_data_2)
        
        # Test reverse relationship
        guardian_notifications = self.guardian.notifications.all()
        self.assertIn(notification1, guardian_notifications)
        self.assertIn(notification2, guardian_notifications)
        self.assertEqual(guardian_notifications.count(), 2)


@pytest.mark.django_db
class TestGuardianModelPytest:
    """Pytest-style tests for Guardian model."""
    
    def test_guardian_password_hashing_compatibility(self):
        """Test password hashing is compatible with existing bcrypt hashes."""
        guardian = GuardianFactory()
        password = 'testpassword123'
        
        # Set password using our custom method
        guardian.set_password(password)
        
        # Verify the hash format
        assert guardian.password_hash.startswith('$2b$')
        
        # Verify password checking works
        assert guardian.check_password(password)
        assert not guardian.check_password('wrongpassword')
    
    def test_guardian_email_validation(self):
        """Test email validation."""
        # Valid email should work
        guardian = GuardianFactory(email='valid@example.com')
        assert guardian.email == 'valid@example.com'
        
        # Invalid email should raise validation error during full_clean
        guardian = GuardianFactory.build(email='invalid-email')
        with pytest.raises(ValidationError):
            guardian.full_clean()
    
    def test_guardian_phone_validation(self):
        """Test phone number validation."""
        # Valid phone formats
        valid_phones = ['+977-9841234567', '9841234567', '+1-555-123-4567']
        
        for phone in valid_phones:
            guardian = GuardianFactory(phone=phone)
            assert guardian.phone == phone
    
    def test_guardian_verification_workflow(self):
        """Test guardian verification workflow."""
        guardian = GuardianFactory(
            verification_status='pending',
            email_verified=False,
            phone_verified=False
        )
        
        # Initially not verified
        assert not guardian.is_verified
        
        # Verify email
        guardian.email_verified = True
        assert not guardian.is_verified  # Still need phone and status
        
        # Verify phone
        guardian.phone_verified = True
        assert not guardian.is_verified  # Still need status
        
        # Approve verification
        guardian.verification_status = 'verified'
        assert guardian.is_verified
    
    def test_guardian_multiple_athletes(self):
        """Test guardian with multiple athletes."""
        guardian = GuardianFactory()
        
        # Create multiple athletes for this guardian
        athletes = AthleteFactory.create_batch(3, guardian=guardian)
        
        assert guardian.athletes.count() == 3
        for athlete in athletes:
            assert athlete.guardian == guardian
    
    def test_guardian_claim_requests(self):
        """Test guardian claim request functionality."""
        guardian = GuardianFactory()
        athlete = AthleteFactory()
        
        # Create claim request
        claim = AthleteClaimRequest.objects.create(
            guardian=guardian,
            athlete=athlete,
            claim_code='TEST123',
            relationship='Father',
            status='pending'
        )
        
        assert claim.guardian == guardian
        assert claim.athlete == athlete
        assert claim.status == 'pending'