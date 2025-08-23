"""
Unit tests for authentication models.
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import bcrypt

from apps.authentication.models import User, UserSession
from tests.factories import UserFactory

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model."""
    
    def setUp(self):
        """Set up test data."""
        self.user_data = {
            'full_name': 'John Doe',
            'email': 'john.doe@example.com',
            'role': 'SchoolAdmin',
        }
    
    def test_user_creation(self):
        """Test basic user creation."""
        user = User.objects.create(**self.user_data)
        
        self.assertEqual(user.full_name, 'John Doe')
        self.assertEqual(user.email, 'john.doe@example.com')
        self.assertEqual(user.role, 'SchoolAdmin')
        self.assertTrue(user.is_active)
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)
    
    def test_user_str_representation(self):
        """Test user string representation."""
        user = User.objects.create(**self.user_data)
        expected = f"{user.full_name} ({user.email})"
        self.assertEqual(str(user), expected)
    
    def test_email_as_username_field(self):
        """Test that email is used as username field."""
        self.assertEqual(User.USERNAME_FIELD, 'email')
        self.assertIn('full_name', User.REQUIRED_FIELDS)
    
    def test_unique_email_constraint(self):
        """Test that email must be unique."""
        User.objects.create(**self.user_data)
        
        with self.assertRaises(Exception):  # IntegrityError
            User.objects.create(**self.user_data)
    
    def test_set_password_bcrypt(self):
        """Test password setting with bcrypt."""
        user = User.objects.create(**self.user_data)
        password = 'testpassword123'
        
        user.set_password(password)
        
        self.assertIsNotNone(user.password_hash)
        self.assertTrue(user.password_hash.startswith('$2b$'))
        self.assertTrue(user.check_password(password))
    
    def test_check_password_bcrypt(self):
        """Test password checking with bcrypt."""
        user = User.objects.create(**self.user_data)
        password = 'testpassword123'
        wrong_password = 'wrongpassword'
        
        user.set_password(password)
        
        self.assertTrue(user.check_password(password))
        self.assertFalse(user.check_password(wrong_password))
    
    def test_check_password_fallback_django(self):
        """Test password checking falls back to Django's method."""
        user = User.objects.create(**self.user_data)
        user.password_hash = ''  # Clear bcrypt hash
        user.set_password('testpassword')  # This will set Django's password
        
        # Should fallback to Django's check_password
        self.assertTrue(user.check_password('testpassword'))
    
    def test_role_choices_validation(self):
        """Test that only valid roles are accepted."""
        valid_roles = ['SuperAdmin', 'SchoolAdmin', 'Coach', 'Referee', 'Organization']
        
        for role in valid_roles:
            user_data = self.user_data.copy()
            user_data['role'] = role
            user_data['email'] = f'test_{role.lower()}@example.com'
            
            user = User.objects.create(**user_data)
            self.assertEqual(user.role, role)
    
    def test_is_super_admin_property(self):
        """Test is_super_admin property."""
        user = User.objects.create(**self.user_data, role='SuperAdmin')
        self.assertTrue(user.is_super_admin)
        
        user.role = 'SchoolAdmin'
        self.assertFalse(user.is_super_admin)
    
    def test_is_school_admin_property(self):
        """Test is_school_admin property."""
        user = User.objects.create(**self.user_data, role='SchoolAdmin')
        self.assertTrue(user.is_school_admin)
        
        user.role = 'SuperAdmin'
        self.assertFalse(user.is_school_admin)
    
    def test_get_school_method(self):
        """Test get_school method for SchoolAdmin."""
        user = User.objects.create(**self.user_data, role='SchoolAdmin')
        
        # Should return None when no school is associated
        self.assertIsNone(user.get_school())
        
        # Test with non-SchoolAdmin role
        user.role = 'SuperAdmin'
        self.assertIsNone(user.get_school())
    
    def test_user_factory(self):
        """Test UserFactory creates valid users."""
        user = UserFactory()
        
        self.assertIsNotNone(user.full_name)
        self.assertIsNotNone(user.email)
        self.assertIn(user.role, ['SuperAdmin', 'SchoolAdmin', 'Coach', 'Referee'])
        self.assertTrue(user.is_active)
    
    def test_user_factory_with_specific_role(self):
        """Test UserFactory with specific role."""
        user = UserFactory(role='SuperAdmin')
        self.assertEqual(user.role, 'SuperAdmin')
        self.assertTrue(user.is_super_admin)


class UserSessionModelTest(TestCase):
    """Test cases for UserSession model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.session_data = {
            'user': self.user,
            'session_token': 'test_token_123',
            'ip_address': '192.168.1.1',
            'user_agent': 'Mozilla/5.0 Test Browser',
            'expires_at': timezone.now() + timedelta(hours=24)
        }
    
    def test_session_creation(self):
        """Test basic session creation."""
        session = UserSession.objects.create(**self.session_data)
        
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.session_token, 'test_token_123')
        self.assertEqual(session.ip_address, '192.168.1.1')
        self.assertTrue(session.is_active)
        self.assertIsNotNone(session.created_at)
        self.assertIsNotNone(session.last_activity)
    
    def test_session_str_representation(self):
        """Test session string representation."""
        session = UserSession.objects.create(**self.session_data)
        expected = f"Session for {self.user.email} from {session.ip_address}"
        self.assertEqual(str(session), expected)
    
    def test_unique_session_token(self):
        """Test that session token must be unique."""
        UserSession.objects.create(**self.session_data)
        
        # Try to create another session with same token
        session_data_2 = self.session_data.copy()
        session_data_2['user'] = UserFactory()
        
        with self.assertRaises(Exception):  # IntegrityError
            UserSession.objects.create(**session_data_2)
    
    def test_session_user_relationship(self):
        """Test user-session relationship."""
        session1 = UserSession.objects.create(**self.session_data)
        
        # Create another session for same user
        session_data_2 = self.session_data.copy()
        session_data_2['session_token'] = 'different_token'
        session2 = UserSession.objects.create(**session_data_2)
        
        # Test reverse relationship
        user_sessions = self.user.sessions.all()
        self.assertIn(session1, user_sessions)
        self.assertIn(session2, user_sessions)
        self.assertEqual(user_sessions.count(), 2)
    
    def test_session_auto_timestamps(self):
        """Test automatic timestamp fields."""
        session = UserSession.objects.create(**self.session_data)
        
        created_at = session.created_at
        last_activity = session.last_activity
        
        # Update session
        session.is_active = False
        session.save()
        
        session.refresh_from_db()
        
        # created_at should not change
        self.assertEqual(session.created_at, created_at)
        # last_activity should be updated
        self.assertGreaterEqual(session.last_activity, last_activity)
    
    def test_session_ip_address_validation(self):
        """Test IP address field validation."""
        # Test valid IPv4
        session_data = self.session_data.copy()
        session_data['ip_address'] = '192.168.1.100'
        session_data['session_token'] = 'token_ipv4'
        session = UserSession.objects.create(**session_data)
        self.assertEqual(session.ip_address, '192.168.1.100')
        
        # Test valid IPv6
        session_data['ip_address'] = '2001:db8::1'
        session_data['session_token'] = 'token_ipv6'
        session = UserSession.objects.create(**session_data)
        self.assertEqual(session.ip_address, '2001:db8::1')
    
    def test_session_cascade_delete(self):
        """Test that sessions are deleted when user is deleted."""
        session = UserSession.objects.create(**self.session_data)
        session_id = session.id
        
        # Delete user
        self.user.delete()
        
        # Session should be deleted too
        with self.assertRaises(UserSession.DoesNotExist):
            UserSession.objects.get(id=session_id)


class TestUserModelAdditional(TestCase):
    """Additional tests for User model."""
    
    def test_user_password_hashing_compatibility(self):
        """Test password hashing is compatible with existing bcrypt hashes."""
        user = UserFactory()
        password = 'testpassword123'
        
        # Set password using our custom method
        user.set_password(password)
        
        # Verify the hash format
        self.assertTrue(user.password_hash.startswith('$2b$'))
        
        # Verify password checking works
        self.assertTrue(user.check_password(password))
        self.assertFalse(user.check_password('wrongpassword'))
    
    def test_user_email_validation(self):
        """Test email validation."""
        # Valid email should work
        user = UserFactory(email='valid@example.com')
        self.assertEqual(user.email, 'valid@example.com')
        
        # Invalid email should raise validation error during full_clean
        user = UserFactory.build(email='invalid-email')
        with self.assertRaises(ValidationError):
            user.full_clean()
    
    def test_user_role_default(self):
        """Test default role assignment."""
        user_data = {
            'full_name': 'Test User',
            'email': 'test@example.com'
        }
        user = User(**user_data)
        self.assertEqual(user.role, 'SchoolAdmin')
    
    def test_user_timestamps_auto_update(self):
        """Test that timestamps are automatically updated."""
        user = UserFactory()
        original_updated_at = user.updated_at
        
        # Update user
        user.full_name = 'Updated Name'
        user.save()
        
        user.refresh_from_db()
        self.assertGreater(user.updated_at, original_updated_at)
        
    def test_multiple_users_different_emails(self):
        """Test creating multiple users with different emails."""
        user1 = UserFactory(email='user1@example.com')
        user2 = UserFactory(email='user2@example.com')
        
        self.assertNotEqual(user1.email, user2.email)
        self.assertEqual(User.objects.count(), 2)