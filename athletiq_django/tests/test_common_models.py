"""
Unit tests for common models and utilities.
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

from apps.common.models import BaseModel, TimestampedModel
from core.utils.validators import validate_phone_number, validate_email_format, validate_file_size
from tests.factories import UserFactory


# Create test models that inherit from BaseModel and TimestampedModel
class TestBaseModel(BaseModel):
    """Test model inheriting from BaseModel."""
    
    class Meta:
        app_label = 'tests'


class TestTimestampedModel(TimestampedModel):
    """Test model inheriting from TimestampedModel."""
    
    class Meta:
        app_label = 'tests'


class BaseModelTest(TestCase):
    """Test cases for BaseModel abstract model."""
    
    def test_base_model_fields(self):
        """Test BaseModel provides expected fields."""
        # Create instance (this won't actually save to DB since it's abstract)
        instance = TestBaseModel()
        
        # Check that BaseModel fields are available
        self.assertTrue(hasattr(instance, 'created_at'))
        self.assertTrue(hasattr(instance, 'updated_at'))
        self.assertTrue(hasattr(instance, 'is_active'))
        
        # Check default values
        self.assertTrue(instance.is_active)
    
    def test_base_model_meta_abstract(self):
        """Test that BaseModel is abstract."""
        self.assertTrue(BaseModel._meta.abstract)
    
    def test_base_model_ordering(self):
        """Test BaseModel default ordering."""
        # BaseModel should have ordering by created_at
        expected_ordering = ['-created_at']
        self.assertEqual(BaseModel._meta.ordering, expected_ordering)


class TimestampedModelTest(TestCase):
    """Test cases for TimestampedModel abstract model."""
    
    def test_timestamped_model_fields(self):
        """Test TimestampedModel provides expected fields."""
        instance = TestTimestampedModel()
        
        # Check that TimestampedModel fields are available
        self.assertTrue(hasattr(instance, 'created_at'))
        self.assertTrue(hasattr(instance, 'updated_at'))
        
        # Should not have is_active field (only BaseModel has it)
        self.assertFalse(hasattr(instance, 'is_active'))
    
    def test_timestamped_model_meta_abstract(self):
        """Test that TimestampedModel is abstract."""
        self.assertTrue(TimestampedModel._meta.abstract)


class ValidatorsTest(TestCase):
    """Test cases for utility validators."""
    
    def test_validate_phone_number_valid(self):
        """Test phone number validation with valid numbers."""
        valid_phones = [
            '+977-9841234567',
            '+1-555-123-4567',
            '9841234567',
            '+44-20-7946-0958',
            '+33-1-42-86-83-26'
        ]
        
        for phone in valid_phones:
            try:
                validate_phone_number(phone)
            except ValidationError:
                self.fail(f"Valid phone number {phone} raised ValidationError")
    
    def test_validate_phone_number_invalid(self):
        """Test phone number validation with invalid numbers."""
        invalid_phones = [
            '123',
            'invalid-phone',
            '+977-123',
            'abcd-efgh-ijkl',
            '++977-9841234567',
            ''
        ]
        
        for phone in invalid_phones:
            with self.assertRaises(ValidationError):
                validate_phone_number(phone)
    
    def test_validate_email_format_valid(self):
        """Test email format validation with valid emails."""
        valid_emails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'test+tag@example.org',
            'firstname.lastname@company.com',
            'user123@test-domain.com'
        ]
        
        for email in valid_emails:
            try:
                validate_email_format(email)
            except ValidationError:
                self.fail(f"Valid email {email} raised ValidationError")
    
    def test_validate_email_format_invalid(self):
        """Test email format validation with invalid emails."""
        invalid_emails = [
            'invalid-email',
            '@example.com',
            'test@',
            'test..test@example.com',
            'test@example',
            'test@.com',
            ''
        ]
        
        for email in invalid_emails:
            with self.assertRaises(ValidationError):
                validate_email_format(email)
    
    def test_validate_file_size_valid(self):
        """Test file size validation with valid sizes."""
        # Test sizes in bytes
        valid_sizes = [
            1024,  # 1KB
            1024 * 1024,  # 1MB
            5 * 1024 * 1024,  # 5MB
            10 * 1024 * 1024 - 1,  # Just under 10MB
        ]
        
        for size in valid_sizes:
            try:
                validate_file_size(size)
            except ValidationError:
                self.fail(f"Valid file size {size} raised ValidationError")
    
    def test_validate_file_size_invalid(self):
        """Test file size validation with invalid sizes."""
        # Test sizes that exceed limit (assuming 10MB limit)
        invalid_sizes = [
            10 * 1024 * 1024 + 1,  # Just over 10MB
            50 * 1024 * 1024,  # 50MB
            100 * 1024 * 1024,  # 100MB
        ]
        
        for size in invalid_sizes:
            with self.assertRaises(ValidationError):
                validate_file_size(size)
    
    def test_validate_file_size_zero_negative(self):
        """Test file size validation with zero and negative sizes."""
        invalid_sizes = [0, -1, -1024]
        
        for size in invalid_sizes:
            with self.assertRaises(ValidationError):
                validate_file_size(size)


@pytest.mark.django_db
class TestCommonModelsPytest:
    """Pytest-style tests for common models and utilities."""
    
    def test_base_model_timestamp_behavior(self):
        """Test BaseModel timestamp behavior in real models."""
        # Use User model which inherits from BaseModel through AbstractUser
        user = UserFactory()
        
        original_created_at = user.created_at
        original_updated_at = user.updated_at
        
        # Update user
        user.full_name = 'Updated Name'
        user.save()
        
        user.refresh_from_db()
        
        # created_at should not change
        assert user.created_at == original_created_at
        # updated_at should be newer
        assert user.updated_at >= original_updated_at
    
    def test_base_model_is_active_default(self):
        """Test BaseModel is_active default value."""
        user = UserFactory()
        
        # Should be active by default
        assert user.is_active is True
        
        # Test deactivation
        user.is_active = False
        user.save()
        
        user.refresh_from_db()
        assert user.is_active is False
    
    def test_validator_phone_number_international_formats(self):
        """Test phone number validator with various international formats."""
        international_phones = [
            '+1-555-123-4567',  # US
            '+44-20-7946-0958',  # UK
            '+33-1-42-86-83-26',  # France
            '+49-30-12345678',  # Germany
            '+81-3-1234-5678',  # Japan
            '+86-10-12345678',  # China
            '+91-11-12345678',  # India
            '+977-1-4123456',  # Nepal landline
            '+977-98-12345678',  # Nepal mobile
        ]
        
        for phone in international_phones:
            # Should not raise ValidationError
            validate_phone_number(phone)
    
    def test_validator_email_edge_cases(self):
        """Test email validator with edge cases."""
        # Valid edge cases
        valid_edge_cases = [
            'a@b.co',  # Minimum valid email
            'test.email.with+symbol@example.com',
            'test-email@test-domain.com',
            'user_name@domain.org',
            '123@456.com',  # Numeric
        ]
        
        for email in valid_edge_cases:
            validate_email_format(email)
        
        # Invalid edge cases
        invalid_edge_cases = [
            'a@b',  # No TLD
            'test@',  # No domain
            '@test.com',  # No local part
            'test.@test.com',  # Dot at end of local part
            'test@.test.com',  # Dot at start of domain
            'test@test..com',  # Double dot in domain
        ]
        
        for email in invalid_edge_cases:
            with pytest.raises(ValidationError):
                validate_email_format(email)
    
    def test_validator_file_size_edge_cases(self):
        """Test file size validator with edge cases."""
        # Test exactly at limit (10MB)
        limit_size = 10 * 1024 * 1024
        validate_file_size(limit_size)
        
        # Test just over limit
        with pytest.raises(ValidationError):
            validate_file_size(limit_size + 1)
        
        # Test minimum valid size
        validate_file_size(1)
        
        # Test zero size
        with pytest.raises(ValidationError):
            validate_file_size(0)
    
    def test_model_inheritance_chain(self):
        """Test that models properly inherit from base classes."""
        from apps.schools.models import School
        from apps.athletes.models import Athlete
        from apps.tournaments.models import Tournament
        
        # Create instances
        user = UserFactory()
        school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='Test Address',
            country='Nepal',
            province='Bagmati',
            district='Kathmandu',
            city='Kathmandu',
            ward='1',
            phone='+977-1-4123456',
            email='test@school.edu.np',
            principal_name='Test Principal',
            admin_user=user,
            onboarding_status='completed'
        )
        
        # Test that BaseModel fields are available
        assert hasattr(school, 'created_at')
        assert hasattr(school, 'updated_at')
        assert hasattr(school, 'is_active')
        assert school.is_active is True
        
        # Test timestamps are set
        assert school.created_at is not None
        assert school.updated_at is not None
    
    def test_common_model_queryset_methods(self):
        """Test common queryset methods work with BaseModel."""
        # Create multiple users (which inherit from BaseModel)
        active_users = UserFactory.create_batch(3, is_active=True)
        inactive_users = UserFactory.create_batch(2, is_active=False)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Test filtering by is_active
        active_count = User.objects.filter(is_active=True).count()
        inactive_count = User.objects.filter(is_active=False).count()
        
        assert active_count >= 3  # At least the ones we created
        assert inactive_count >= 2  # At least the ones we created
        
        # Test ordering by created_at (default ordering)
        users = list(User.objects.all()[:5])
        created_times = [user.created_at for user in users]
        
        # Should be in descending order (newest first)
        assert created_times == sorted(created_times, reverse=True)