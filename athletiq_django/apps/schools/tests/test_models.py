"""
Tests for School models.
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from apps.schools.models import School, SchoolHouse, SchoolStaff, SchoolNotification

User = get_user_model()


class SchoolModelTest(TestCase):
    """
    Test cases for School model.
    """
    
    def setUp(self):
        """Set up test data."""
        self.admin_user = User.objects.create(
            full_name="John Admin",
            email="admin@testschool.com",
            role="SchoolAdmin"
        )
        self.admin_user.set_password("testpass123")
        self.admin_user.save()
        
        self.school_data = {
            'school_code': 'TEST001',
            'name': 'Test School',
            'address': '123 Test Street',
            'country': 'Rwanda',
            'province': 'Kigali',
            'district': 'Gasabo',
            'city': 'Kigali',
            'phone': '+250788123456',
            'email': 'info@testschool.com',
            'principal_name': 'Jane Principal',
            'admin_user': self.admin_user
        }
    
    def test_create_school(self):
        """Test creating a school."""
        school = School.objects.create(**self.school_data)
        
        self.assertEqual(school.name, 'Test School')
        self.assertEqual(school.school_code, 'TEST001')
        self.assertEqual(school.admin_user, self.admin_user)
        self.assertEqual(school.onboarding_status, 'pending')
        self.assertTrue(school.is_active)
    
    def test_school_str_representation(self):
        """Test string representation of school."""
        school = School.objects.create(**self.school_data)
        expected_str = f"{school.name} ({school.school_code})"
        self.assertEqual(str(school), expected_str)
    
    def test_unique_school_code(self):
        """Test that school codes must be unique."""
        School.objects.create(**self.school_data)
        
        # Create another admin user
        admin_user2 = User.objects.create(
            full_name="Jane Admin",
            email="admin2@testschool.com",
            role="SchoolAdmin"
        )
        
        # Try to create another school with same code
        school_data2 = self.school_data.copy()
        school_data2['admin_user'] = admin_user2
        school_data2['email'] = 'info2@testschool.com'
        
        with self.assertRaises(IntegrityError):
            School.objects.create(**school_data2)
    
    def test_full_address_property(self):
        """Test full address property."""
        school = School.objects.create(**self.school_data)
        expected_address = "123 Test Street, Kigali, Gasabo, Kigali, Rwanda"
        self.assertEqual(school.full_address, expected_address)
    
    def test_is_onboarded_property(self):
        """Test is_onboarded property."""
        school = School.objects.create(**self.school_data)
        
        # Initially not onboarded
        self.assertFalse(school.is_onboarded)
        
        # After completing onboarding
        school.onboarding_status = 'completed'
        school.save()
        self.assertTrue(school.is_onboarded)
    
    def test_get_admin_user(self):
        """Test get_admin_user method."""
        school = School.objects.create(**self.school_data)
        self.assertEqual(school.get_admin_user(), self.admin_user)


class SchoolHouseModelTest(TestCase):
    """
    Test cases for SchoolHouse model.
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
    
    def test_create_school_house(self):
        """Test creating a school house."""
        house = SchoolHouse.objects.create(
            school=self.school,
            name='Red House',
            color='#FF0000',
            points=100
        )
        
        self.assertEqual(house.name, 'Red House')
        self.assertEqual(house.color, '#FF0000')
        self.assertEqual(house.points, 100)
        self.assertEqual(house.school, self.school)
    
    def test_unique_house_name_per_school(self):
        """Test that house names must be unique per school."""
        SchoolHouse.objects.create(
            school=self.school,
            name='Red House',
            color='#FF0000'
        )
        
        # Try to create another house with same name in same school
        with self.assertRaises(IntegrityError):
            SchoolHouse.objects.create(
                school=self.school,
                name='Red House',
                color='#00FF00'
            )