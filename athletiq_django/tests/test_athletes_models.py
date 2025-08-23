"""
Unit tests for athletes models.
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from decimal import Decimal
from datetime import date

from apps.athletes.models import Athlete
from tests.factories import AthleteFactory, SchoolFactory, GuardianFactory


class AthleteModelTest(TestCase):
    """Test cases for Athlete model."""
    
    def setUp(self):
        """Set up test data."""
        self.school = SchoolFactory()
        self.guardian = GuardianFactory()
        self.athlete_data = {
            'athlete_id': 'NP-0000001',
            'full_name': 'John Doe',
            'full_name_nepali': 'जोन डो',
            'date_of_birth': date(2005, 1, 15),
            'gender': 'Male',
            'nationality': 'Nepali',
            'school': self.school,
            'guardian': self.guardian,
            'grade': '10',
            'section': 'A',
            'guardian_name': self.guardian.full_name,
            'relationship_to_player': 'Father',
            'guardian_phone': self.guardian.phone,
            'guardian_email': self.guardian.email,
            'address': '123 Main St, Kathmandu',
            'province': 'Bagmati',
            'district': 'Kathmandu',
            'height_cm': 170,
            'weight_kg': Decimal('65.5'),
            'blood_group': 'O+',
            'registered_sports': ['Football', 'Basketball'],
            'primary_sport': 'Football',
            'registration_status': 'active',
            'profile_completion': 85,
            'profile_status': 'complete',
            'verification_status': 'verified',
            'document_verified': True
        }
    
    def test_athlete_creation(self):
        """Test basic athlete creation."""
        athlete = Athlete.objects.create(**self.athlete_data)
        
        self.assertEqual(athlete.athlete_id, 'NP-0000001')
        self.assertEqual(athlete.full_name, 'John Doe')
        self.assertEqual(athlete.gender, 'Male')
        self.assertEqual(athlete.school, self.school)
        self.assertEqual(athlete.guardian, self.guardian)
        self.assertTrue(athlete.is_active)
        self.assertIsNotNone(athlete.created_at)
        self.assertIsNotNone(athlete.updated_at)
    
    def test_athlete_str_representation(self):
        """Test athlete string representation."""
        athlete = Athlete.objects.create(**self.athlete_data)
        expected = f"{athlete.full_name} ({athlete.athlete_id})"
        self.assertEqual(str(athlete), expected)
    
    def test_unique_athlete_id_constraint(self):
        """Test that athlete_id must be unique."""
        Athlete.objects.create(**self.athlete_data)
        
        # Try to create another athlete with same athlete_id
        athlete_data_2 = self.athlete_data.copy()
        athlete_data_2['full_name'] = 'Jane Doe'
        
        with self.assertRaises(IntegrityError):
            Athlete.objects.create(**athlete_data_2)
    
    def test_school_relationship(self):
        """Test athlete-school relationship."""
        athlete = Athlete.objects.create(**self.athlete_data)
        
        self.assertEqual(athlete.school, self.school)
        self.assertIn(athlete, self.school.athletes.all())
    
    def test_guardian_relationship(self):
        """Test athlete-guardian relationship."""
        athlete = Athlete.objects.create(**self.athlete_data)
        
        self.assertEqual(athlete.guardian, self.guardian)
        self.assertIn(athlete, self.guardian.athletes.all())
    
    def test_guardian_optional(self):
        """Test that guardian is optional."""
        athlete_data = self.athlete_data.copy()
        athlete_data['guardian'] = None
        athlete_data['athlete_id'] = 'NP-0000002'
        
        athlete = Athlete.objects.create(**athlete_data)
        self.assertIsNone(athlete.guardian)
    
    def test_age_calculation(self):
        """Test age calculation property."""
        athlete = Athlete.objects.create(**self.athlete_data)
        
        # Calculate expected age
        today = date.today()
        expected_age = today.year - athlete.date_of_birth.year
        if today.month < athlete.date_of_birth.month or \
           (today.month == athlete.date_of_birth.month and today.day < athlete.date_of_birth.day):
            expected_age -= 1
        
        self.assertEqual(athlete.age, expected_age)
    
    def test_gender_choices_validation(self):
        """Test gender field validation."""
        valid_genders = ['Male', 'Female', 'Other']
        
        for gender in valid_genders:
            athlete_data = self.athlete_data.copy()
            athlete_data['gender'] = gender
            athlete_data['athlete_id'] = f'NP-{gender[:4].upper()}'
            
            athlete = Athlete.objects.create(**athlete_data)
            self.assertEqual(athlete.gender, gender)
    
    def test_blood_group_choices_validation(self):
        """Test blood group field validation."""
        valid_blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        
        for blood_group in valid_blood_groups:
            athlete_data = self.athlete_data.copy()
            athlete_data['blood_group'] = blood_group
            athlete_data['athlete_id'] = f'NP-{blood_group.replace("+", "P").replace("-", "N")}'
            
            athlete = Athlete.objects.create(**athlete_data)
            self.assertEqual(athlete.blood_group, blood_group)
    
    def test_registered_sports_json_field(self):
        """Test registered_sports JSON field."""
        athlete = Athlete.objects.create(**self.athlete_data)
        
        self.assertEqual(athlete.registered_sports, ['Football', 'Basketball'])
        
        # Update sports
        athlete.registered_sports = ['Cricket', 'Volleyball', 'Tennis']
        athlete.save()
        
        athlete.refresh_from_db()
        self.assertEqual(athlete.registered_sports, ['Cricket', 'Volleyball', 'Tennis'])
    
    def test_profile_completion_validation(self):
        """Test profile completion percentage validation."""
        # Valid completion percentage
        athlete = Athlete.objects.create(**self.athlete_data)
        self.assertEqual(athlete.profile_completion, 85)
        
        # Test boundary values
        athlete.profile_completion = 0
        athlete.save()
        athlete.refresh_from_db()
        self.assertEqual(athlete.profile_completion, 0)
        
        athlete.profile_completion = 100
        athlete.save()
        athlete.refresh_from_db()
        self.assertEqual(athlete.profile_completion, 100)
    
    def test_height_weight_validation(self):
        """Test height and weight field validation."""
        athlete = Athlete.objects.create(**self.athlete_data)
        
        # Test valid values
        self.assertEqual(athlete.height_cm, 170)
        self.assertEqual(athlete.weight_kg, Decimal('65.5'))
        
        # Test updating values
        athlete.height_cm = 180
        athlete.weight_kg = Decimal('70.0')
        athlete.save()
        
        athlete.refresh_from_db()
        self.assertEqual(athlete.height_cm, 180)
        self.assertEqual(athlete.weight_kg, Decimal('70.0'))
    
    def test_registration_status_choices(self):
        """Test registration status choices."""
        valid_statuses = ['pending', 'active', 'inactive', 'suspended', 'graduated']
        
        for status in valid_statuses:
            athlete_data = self.athlete_data.copy()
            athlete_data['registration_status'] = status
            athlete_data['athlete_id'] = f'NP-{status.upper()[:3]}'
            
            athlete = Athlete.objects.create(**athlete_data)
            self.assertEqual(athlete.registration_status, status)
    
    def test_verification_status_choices(self):
        """Test verification status choices."""
        valid_statuses = ['pending', 'verified', 'rejected', 'expired']
        
        for status in valid_statuses:
            athlete_data = self.athlete_data.copy()
            athlete_data['verification_status'] = status
            athlete_data['athlete_id'] = f'NP-VER{status[:3].upper()}'
            
            athlete = Athlete.objects.create(**athlete_data)
            self.assertEqual(athlete.verification_status, status)
    
    def test_athlete_factory(self):
        """Test AthleteFactory creates valid athletes."""
        athlete = AthleteFactory()
        
        self.assertIsNotNone(athlete.athlete_id)
        self.assertIsNotNone(athlete.full_name)
        self.assertIn(athlete.gender, ['Male', 'Female'])
        self.assertIsNotNone(athlete.school)
        self.assertIsNotNone(athlete.guardian)
        self.assertTrue(athlete.is_active)
    
    def test_athlete_cascade_delete_school(self):
        """Test athlete behavior when school is deleted."""
        athlete = Athlete.objects.create(**self.athlete_data)
        athlete_id = athlete.id
        
        # Delete school - should cascade delete athlete
        self.school.delete()
        
        with self.assertRaises(Athlete.DoesNotExist):
            Athlete.objects.get(id=athlete_id)
    
    def test_athlete_guardian_set_null(self):
        """Test athlete behavior when guardian is deleted."""
        athlete = Athlete.objects.create(**self.athlete_data)
        
        # Delete guardian - should set guardian to null
        self.guardian.delete()
        
        athlete.refresh_from_db()
        self.assertIsNone(athlete.guardian)


@pytest.mark.django_db
class TestAthleteModelPytest:
    """Pytest-style tests for Athlete model."""
    
    def test_athlete_age_property(self):
        """Test age calculation property with different birth dates."""
        # Test athlete born exactly 18 years ago
        birth_date = date.today().replace(year=date.today().year - 18)
        athlete = AthleteFactory(date_of_birth=birth_date)
        assert athlete.age == 18
        
        # Test athlete born 17 years and 11 months ago
        birth_date = date.today().replace(year=date.today().year - 18, month=1, day=1)
        athlete = AthleteFactory(date_of_birth=birth_date)
        assert athlete.age >= 17
    
    def test_athlete_contact_info_json(self):
        """Test contact_info JSON field functionality."""
        contact_info = {
            'phone': '+977-9841234567',
            'email': 'athlete@example.com',
            'emergency_contact': '+977-9851234567'
        }
        athlete = AthleteFactory(contact_info=contact_info)
        
        assert athlete.contact_info == contact_info
        assert athlete.contact_info['phone'] == '+977-9841234567'
    
    def test_athlete_medical_info_json(self):
        """Test medical_info JSON field functionality."""
        medical_info = {
            'allergies': ['Peanuts', 'Shellfish'],
            'medications': ['Inhaler'],
            'medical_conditions': ['Asthma'],
            'emergency_contact': 'Dr. Smith - +977-9841111111'
        }
        athlete = AthleteFactory(medical_info=medical_info)
        
        assert athlete.medical_info == medical_info
        assert 'Asthma' in athlete.medical_info['medical_conditions']
    
    def test_athlete_documents_json(self):
        """Test documents JSON field functionality."""
        documents = {
            'birth_certificate': '/uploads/birth_cert_123.pdf',
            'school_id': '/uploads/school_id_123.jpg',
            'medical_certificate': '/uploads/medical_123.pdf'
        }
        athlete = AthleteFactory(documents=documents)
        
        assert athlete.documents == documents
        assert athlete.documents['birth_certificate'].endswith('.pdf')
    
    def test_athlete_queryset_filtering(self):
        """Test common queryset filtering operations."""
        school = SchoolFactory()
        
        # Create athletes with different statuses
        active_athlete = AthleteFactory(school=school, registration_status='active')
        inactive_athlete = AthleteFactory(school=school, registration_status='inactive')
        verified_athlete = AthleteFactory(school=school, verification_status='verified')
        
        # Test filtering by school
        school_athletes = Athlete.objects.filter(school=school)
        assert active_athlete in school_athletes
        assert inactive_athlete in school_athletes
        assert verified_athlete in school_athletes
        
        # Test filtering by status
        active_athletes = Athlete.objects.filter(registration_status='active')
        assert active_athlete in active_athletes
        assert inactive_athlete not in active_athletes
        
        # Test filtering by verification
        verified_athletes = Athlete.objects.filter(verification_status='verified')
        assert verified_athlete in verified_athletes
    
    def test_athlete_ordering(self):
        """Test default ordering of athletes."""
        athlete1 = AthleteFactory(full_name='Alice Johnson')
        athlete2 = AthleteFactory(full_name='Bob Smith')
        athlete3 = AthleteFactory(full_name='Charlie Brown')
        
        athletes = list(Athlete.objects.all())
        
        # Should be ordered by full_name
        names = [athlete.full_name for athlete in athletes]
        assert names == sorted(names)