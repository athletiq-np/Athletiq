"""
Tests for School serializers.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from apps.schools.models import School, SchoolHouse
from apps.schools.serializers import (
    SchoolRegistrationSerializer, SchoolSerializer, SchoolUpdateSerializer,
    SchoolHouseSerializer
)

User = get_user_model()


class SchoolRegistrationSerializerTest(TestCase):
    """
    Test cases for SchoolRegistrationSerializer.
    """
    
    def setUp(self):
        """Set up test data."""
        self.valid_data = {
            'name': 'Test School',
            'address': '123 Test Street',
            'country': 'Rwanda',
            'province': 'Kigali',
            'district': 'Gasabo',
            'city': 'Kigali',
            'phone': '+250788123456',
            'email': 'info@testschool.com',
            'principal_name': 'Jane Principal',
            'admin_name': 'John Admin',
            'admin_email': 'admin@testschool.com',
            'password': 'testpass123'
        }
    
    def test_valid_school_registration(self):
        """Test valid school registration data."""
        serializer = SchoolRegistrationSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        
        school = serializer.save()
        self.assertEqual(school.name, 'Test School')
        self.assertEqual(school.admin_user.full_name, 'John Admin')
        self.assertEqual(school.admin_user.email, 'admin@testschool.com')
        self.assertTrue(school.school_code)  # Should be generated
    
    def test_duplicate_admin_email(self):
        """Test validation for duplicate admin email."""
        # Create a user first
        User.objects.create(
            full_name="Existing User",
            email="admin@testschool.com",
            role="SchoolAdmin"
        )
        
        serializer = SchoolRegistrationSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('admin_email', serializer.errors)
    
    def test_duplicate_school_name(self):
        """Test validation for duplicate school name."""
        # Create a school first
        admin_user = User.objects.create(
            full_name="Existing Admin",
            email="existing@testschool.com",
            role="SchoolAdmin"
        )
        School.objects.create(
            school_code='EXIST001',
            name='Test School',
            address='456 Other Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788654321',
            email='existing@testschool.com',
            principal_name='Other Principal',
            admin_user=admin_user
        )
        
        serializer = SchoolRegistrationSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
    
    def test_missing_required_fields(self):
        """Test validation for missing required fields."""
        incomplete_data = {
            'name': 'Test School',
            'admin_email': 'admin@testschool.com'
            # Missing other required fields
        }
        
        serializer = SchoolRegistrationSerializer(data=incomplete_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('address', serializer.errors)
        self.assertIn('admin_name', serializer.errors)
        self.assertIn('password', serializer.errors)


class SchoolSerializerTest(TestCase):
    """
    Test cases for SchoolSerializer.
    """
    
    def setUp(self):
        """Set up test data."""
        self.admin_user = User.objects.create(
            full_name="John Admin",
            email="admin@testschool.com",
            role="SchoolAdmin"
        )
        
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='123 Test Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788123456',
            email='info@testschool.com',
            principal_name='Jane Principal',
            admin_user=self.admin_user
        )
    
    def test_school_serialization(self):
        """Test school serialization."""
        serializer = SchoolSerializer(self.school)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Test School')
        self.assertEqual(data['school_code'], 'TEST001')
        self.assertEqual(data['admin_user_name'], 'John Admin')
        self.assertEqual(data['admin_user_email'], 'admin@testschool.com')
        self.assertIn('full_address', data)
        self.assertIn('is_onboarded', data)
        self.assertIn('athletes_count', data)
        self.assertIn('teams_count', data)


class SchoolUpdateSerializerTest(TestCase):
    """
    Test cases for SchoolUpdateSerializer.
    """
    
    def setUp(self):
        """Set up test data."""
        self.admin_user = User.objects.create(
            full_name="John Admin",
            email="admin@testschool.com",
            role="SchoolAdmin"
        )
        
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='123 Test Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788123456',
            email='info@testschool.com',
            principal_name='Jane Principal',
            admin_user=self.admin_user
        )
    
    def test_valid_school_update(self):
        """Test valid school update."""
        update_data = {
            'name': 'Updated School Name',
            'phone': '+250788999888',
            'principal_name': 'Updated Principal'
        }
        
        serializer = SchoolUpdateSerializer(
            instance=self.school,
            data=update_data,
            partial=True
        )
        self.assertTrue(serializer.is_valid())
        
        updated_school = serializer.save()
        self.assertEqual(updated_school.name, 'Updated School Name')
        self.assertEqual(updated_school.phone, '+250788999888')
        self.assertEqual(updated_school.principal_name, 'Updated Principal')
    
    def test_duplicate_name_validation(self):
        """Test validation for duplicate school name during update."""
        # Create another school
        other_admin = User.objects.create(
            full_name="Other Admin",
            email="other@testschool.com",
            role="SchoolAdmin"
        )
        School.objects.create(
            school_code='OTHER001',
            name='Other School',
            address='456 Other Street',
            country='Rwanda',
            province='Kigali',
            district='Gasabo',
            city='Kigali',
            phone='+250788654321',
            email='other@testschool.com',
            principal_name='Other Principal',
            admin_user=other_admin
        )
        
        # Try to update current school with existing name
        update_data = {'name': 'Other School'}
        serializer = SchoolUpdateSerializer(
            instance=self.school,
            data=update_data,
            partial=True
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)