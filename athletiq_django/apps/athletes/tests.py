"""
Comprehensive tests for athlete management system.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from datetime import date, timedelta
from decimal import Decimal
import json

from .models import Athlete
from .serializers import AthleteCreateSerializer, AthleteUpdateSerializer, AthleteBulkCreateSerializer
from apps.schools.models import School
from apps.guardians.models import Guardian
from apps.authentication.models import User


class AthleteModelTest(TestCase):
    """
    Comprehensive test cases for Athlete model.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create test user
        self.user = User.objects.create(
            email='admin@school.com',
            full_name='School Admin',
            role='SchoolAdmin'
        )
        self.user.set_password('testpass123')
        self.user.save()
        
        # Create test school
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='Test Address',
            country='Nepal',
            province='Bagmati',
            district='Kathmandu',
            city='Kathmandu',
            phone='+977-1-4567890',
            email='test@school.com',
            principal_name='Test Principal',
            admin_user=self.user
        )
        
        # Create test guardian
        self.guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+977-9841234567',
            verification_status='verified',
            email_verified=True
        )
        self.guardian.set_password('testpass123')
        self.guardian.save()
    
    def test_athlete_creation_minimal(self):
        """Test athlete creation with minimal required fields."""
        athlete = Athlete.objects.create(
            full_name='Test Athlete',
            gender='Male',
            date_of_birth=date(2010, 5, 15),
            school=self.school,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234567',
            address='Test Address',
            created_by=self.user
        )
        
        self.assertEqual(athlete.full_name, 'Test Athlete')
        self.assertEqual(athlete.school, self.school)
        self.assertIsNotNone(athlete.athlete_id)
        self.assertTrue(athlete.athlete_id.startswith('NP-'))
        self.assertEqual(athlete.registration_status, 'pending')
        self.assertEqual(athlete.verification_status, 'pending')
    
    def test_athlete_creation_comprehensive(self):
        """Test athlete creation with comprehensive fields."""
        athlete = Athlete.objects.create(
            full_name='Test Athlete',
            full_name_nepali='परीक्षण खेलाडी',
            gender='Female',
            date_of_birth=date(2008, 3, 20),
            nationality='Nepali',
            citizenship_no='12-34-56-78901',
            school=self.school,
            grade='10',
            section='A',
            guardian=self.guardian,
            guardian_name='Test Guardian',
            relationship_to_player='Father',
            guardian_phone='+977-9841234567',
            guardian_email='guardian@test.com',
            address='Test Address, Kathmandu',
            province='Bagmati',
            district='Kathmandu',
            municipality_or_rural_municipality='Kathmandu Metropolitan',
            ward_no='5',
            height_cm=165,
            weight_kg=Decimal('55.5'),
            blood_group='O+',
            registered_sports=['Football', 'Basketball'],
            primary_sport='Football',
            father_name='Test Father',
            mother_name='Test Mother',
            medical_conditions='None',
            allergies='None',
            emergency_contact='+977-9841234568',
            created_by=self.user
        )
        
        self.assertEqual(athlete.full_name, 'Test Athlete')
        self.assertEqual(athlete.full_name_nepali, 'परीक्षण खेलाडी')
        self.assertEqual(athlete.guardian, self.guardian)
        self.assertEqual(athlete.height_cm, 165)
        self.assertEqual(athlete.weight_kg, Decimal('55.5'))
        self.assertEqual(athlete.registered_sports, ['Football', 'Basketball'])
        self.assertTrue(athlete.profile_completion > 0)
    
    def test_athlete_id_generation(self):
        """Test automatic athlete ID generation."""
        athlete1 = Athlete.objects.create(
            full_name='Athlete 1',
            gender='Male',
            date_of_birth=date(2010, 1, 1),
            school=self.school,
            guardian_name='Guardian 1',
            guardian_phone='+977-9841234567',
            address='Address 1'
        )
        
        athlete2 = Athlete.objects.create(
            full_name='Athlete 2',
            gender='Female',
            date_of_birth=date(2010, 2, 2),
            school=self.school,
            guardian_name='Guardian 2',
            guardian_phone='+977-9841234568',
            address='Address 2'
        )
        
        self.assertIsNotNone(athlete1.athlete_id)
        self.assertIsNotNone(athlete2.athlete_id)
        self.assertNotEqual(athlete1.athlete_id, athlete2.athlete_id)
        self.assertTrue(athlete1.athlete_id.startswith('NP-'))
        self.assertTrue(athlete2.athlete_id.startswith('NP-'))
    
    def test_age_calculation(self):
        """Test age calculation property."""
        birth_date = date.today() - timedelta(days=365 * 15 + 100)  # ~15 years old
        athlete = Athlete.objects.create(
            full_name='Test Athlete',
            gender='Male',
            date_of_birth=birth_date,
            school=self.school,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234567',
            address='Test Address'
        )
        
        self.assertEqual(athlete.age, 15)
    
    def test_display_name_property(self):
        """Test display name property."""
        # Without Nepali name
        athlete1 = Athlete.objects.create(
            full_name='Test Athlete',
            gender='Male',
            date_of_birth=date(2010, 1, 1),
            school=self.school,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234567',
            address='Test Address'
        )
        self.assertEqual(athlete1.display_name, 'Test Athlete')
        
        # With Nepali name
        athlete2 = Athlete.objects.create(
            full_name='Test Athlete 2',
            full_name_nepali='परीक्षण खेलाडी',
            gender='Female',
            date_of_birth=date(2010, 2, 2),
            school=self.school,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234568',
            address='Test Address'
        )
        self.assertEqual(athlete2.display_name, 'Test Athlete 2 (परीक्षण खेलाडी)')
    
    def test_is_verified_property(self):
        """Test is_verified property."""
        athlete = Athlete.objects.create(
            full_name='Test Athlete',
            gender='Male',
            date_of_birth=date(2010, 1, 1),
            school=self.school,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234567',
            address='Test Address',
            verification_status='verified',
            document_verified=True,
            profile_completion=85
        )
        
        self.assertTrue(athlete.is_verified)
        
        # Test with incomplete profile
        athlete.profile_completion = 70
        athlete.save()
        self.assertFalse(athlete.is_verified)
    
    def test_can_participate_property(self):
        """Test can_participate property."""
        athlete = Athlete.objects.create(
            full_name='Test Athlete',
            gender='Male',
            date_of_birth=date(2010, 1, 1),
            school=self.school,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234567',
            address='Test Address',
            registration_status='active',
            verification_status='verified',
            profile_completion=70
        )
        
        self.assertTrue(athlete.can_participate)
        
        # Test with inactive status
        athlete.registration_status = 'inactive'
        athlete.save()
        self.assertFalse(athlete.can_participate)
    
    def test_profile_completion_calculation(self):
        """Test profile completion calculation."""
        athlete = Athlete.objects.create(
            full_name='Test Athlete',
            gender='Male',
            date_of_birth=date(2010, 1, 1),
            school=self.school,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234567',
            address='Test Address'
        )
        
        initial_completion = athlete.profile_completion
        
        # Add more fields
        athlete.full_name_nepali = 'परीक्षण खेलाडी'
        athlete.citizenship_no = '12-34-56-78901'
        athlete.guardian_email = 'guardian@test.com'
        athlete.height_cm = 165
        athlete.weight_kg = Decimal('55.5')
        athlete.blood_group = 'O+'
        athlete.primary_sport = 'Football'
        athlete.save()
        
        new_completion = athlete.calculate_profile_completion()
        self.assertGreater(new_completion, initial_completion)
    
    def test_str_representation(self):
        """Test string representation of athlete."""
        athlete = Athlete.objects.create(
            full_name='Test Athlete',
            gender='Male',
            date_of_birth=date(2010, 5, 15),
            school=self.school,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234567',
            address='Test Address'
        )
        
        expected_str = f"Test Athlete ({athlete.athlete_id})"
        self.assertEqual(str(athlete), expected_str)


class AthleteSerializerTest(TestCase):
    """
    Test cases for Athlete serializers.
    """
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create(
            email='admin@school.com',
            full_name='School Admin',
            role='SchoolAdmin'
        )
        
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='Test Address',
            country='Nepal',
            province='Bagmati',
            district='Kathmandu',
            city='Kathmandu',
            phone='+977-1-4567890',
            email='test@school.com',
            principal_name='Test Principal',
            admin_user=self.user
        )
        
        self.guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+977-9841234567',
            verification_status='verified'
        )
    
    def test_athlete_create_serializer_valid(self):
        """Test AthleteCreateSerializer with valid data."""
        data = {
            'full_name': 'Test Athlete',
            'gender': 'Male',
            'date_of_birth': '2010-05-15',
            'school_id': self.school.school_id,
            'guardian_name': 'Test Guardian',
            'guardian_phone': '+977-9841234567',
            'address': 'Test Address'
        }
        
        serializer = AthleteCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        athlete = serializer.save()
        self.assertEqual(athlete.full_name, 'Test Athlete')
        self.assertEqual(athlete.school, self.school)
    
    def test_athlete_create_serializer_invalid_age(self):
        """Test AthleteCreateSerializer with invalid age."""
        # Too young
        data = {
            'full_name': 'Test Athlete',
            'gender': 'Male',
            'date_of_birth': date.today().strftime('%Y-%m-%d'),  # Today
            'school_id': self.school.school_id,
            'guardian_name': 'Test Guardian',
            'guardian_phone': '+977-9841234567',
            'address': 'Test Address'
        }
        
        serializer = AthleteCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('date_of_birth', serializer.errors)
    
    def test_athlete_create_serializer_invalid_phone(self):
        """Test AthleteCreateSerializer with invalid phone number."""
        data = {
            'full_name': 'Test Athlete',
            'gender': 'Male',
            'date_of_birth': '2010-05-15',
            'school_id': self.school.school_id,
            'guardian_name': 'Test Guardian',
            'guardian_phone': 'invalid-phone',
            'address': 'Test Address'
        }
        
        serializer = AthleteCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('guardian_phone', serializer.errors)
    
    def test_bulk_create_serializer(self):
        """Test AthleteBulkCreateSerializer."""
        athletes_data = [
            {
                'full_name': 'Athlete 1',
                'gender': 'Male',
                'date_of_birth': '2010-01-01',
                'school_id': self.school.school_id,
                'guardian_name': 'Guardian 1',
                'guardian_phone': '+977-9841234567',
                'address': 'Address 1'
            },
            {
                'full_name': 'Athlete 2',
                'gender': 'Female',
                'date_of_birth': '2010-02-02',
                'school_id': self.school.school_id,
                'guardian_name': 'Guardian 2',
                'guardian_phone': '+977-9841234568',
                'address': 'Address 2'
            }
        ]
        
        data = {'athletes': athletes_data}
        serializer = AthleteBulkCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        result = serializer.save()
        self.assertEqual(result['success_count'], 2)
        self.assertEqual(result['error_count'], 0)
        self.assertEqual(len(result['created_athletes']), 2)


class AthleteAPITest(APITestCase):
    """
    Comprehensive test cases for Athlete API endpoints.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test users
        self.superadmin = User.objects.create(
            email='superadmin@test.com',
            full_name='Super Admin',
            role='SuperAdmin'
        )
        self.superadmin.set_password('testpass123')
        self.superadmin.save()
        
        self.school_admin = User.objects.create(
            email='admin@school.com',
            full_name='School Admin',
            role='SchoolAdmin'
        )
        self.school_admin.set_password('testpass123')
        self.school_admin.save()
        
        # Create test school
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='Test Address',
            country='Nepal',
            province='Bagmati',
            district='Kathmandu',
            city='Kathmandu',
            phone='+977-1-4567890',
            email='test@school.com',
            principal_name='Test Principal',
            admin_user=self.school_admin
        )
        
        # Link school admin to school
        self.school_admin.school = self.school
        self.school_admin.save()
        
        # Create test guardian
        self.guardian = Guardian.objects.create(
            full_name='Test Guardian',
            email='guardian@test.com',
            phone='+977-9841234567',
            verification_status='verified'
        )
        
        # Create test athletes
        self.athlete1 = Athlete.objects.create(
            full_name='Test Athlete 1',
            gender='Male',
            date_of_birth=date(2010, 5, 15),
            school=self.school,
            guardian=self.guardian,
            guardian_name='Test Guardian',
            guardian_phone='+977-9841234567',
            address='Test Address 1',
            created_by=self.school_admin
        )
        
        self.athlete2 = Athlete.objects.create(
            full_name='Test Athlete 2',
            gender='Female',
            date_of_birth=date(2009, 8, 20),
            school=self.school,
            guardian_name='Test Guardian 2',
            guardian_phone='+977-9841234568',
            address='Test Address 2',
            verification_status='verified',
            profile_completion=85,
            created_by=self.school_admin
        )
    
    def test_athlete_list_unauthorized(self):
        """Test athlete list without authentication."""
        url = reverse('athletes:athlete-list-create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_athlete_list_school_admin(self):
        """Test athlete list as school admin."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-list-create')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data['data'])
        self.assertEqual(len(response.data['data']['results']), 2)
    
    def test_athlete_list_with_filters(self):
        """Test athlete list with various filters."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-list-create')
        
        # Filter by gender
        response = self.client.get(url, {'gender': 'Male'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']['results']), 1)
        
        # Filter by verification status
        response = self.client.get(url, {'verification_status': 'verified'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']['results']), 1)
        
        # Search by name
        response = self.client.get(url, {'search': 'Athlete 1'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']['results']), 1)
    
    def test_athlete_create_valid(self):
        """Test creating athlete with valid data."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-list-create')
        
        data = {
            'full_name': 'New Athlete',
            'gender': 'Female',
            'date_of_birth': '2011-03-20',
            'school_id': self.school.school_id,
            'guardian_name': 'New Guardian',
            'guardian_phone': '+977-9841234569',
            'address': 'New Address'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['full_name'], 'New Athlete')
        self.assertIsNotNone(response.data['data']['athlete_id'])
    
    def test_athlete_create_invalid(self):
        """Test creating athlete with invalid data."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-list-create')
        
        # Missing required fields
        data = {
            'full_name': 'New Athlete',
            'gender': 'Female'
            # Missing date_of_birth, school_id, etc.
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_athlete_detail_view(self):
        """Test retrieving athlete details."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-detail', kwargs={'pk': self.athlete1.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['full_name'], 'Test Athlete 1')
        self.assertEqual(response.data['data']['athlete_id'], self.athlete1.athlete_id)
    
    def test_athlete_update(self):
        """Test updating athlete information."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-detail', kwargs={'pk': self.athlete1.pk})
        
        data = {
            'full_name': 'Updated Athlete Name',
            'guardian_email': 'updated@guardian.com'
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['full_name'], 'Updated Athlete Name')
        self.assertEqual(response.data['data']['guardian_email'], 'updated@guardian.com')
    
    def test_athlete_delete(self):
        """Test soft deleting an athlete."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-detail', kwargs={'pk': self.athlete1.pk})
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify soft delete
        self.athlete1.refresh_from_db()
        self.assertFalse(self.athlete1.is_active)
    
    def test_athlete_statistics(self):
        """Test athlete statistics endpoint."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-statistics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_athletes', response.data['data'])
        self.assertIn('verified_athletes', response.data['data'])
        self.assertIn('gender_distribution', response.data['data'])
        self.assertEqual(response.data['data']['total_athletes'], 2)
    
    def test_bulk_create_athletes(self):
        """Test bulk athlete creation endpoint."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-bulk-create')
        
        data = {
            'athletes': [
                {
                    'full_name': 'Bulk Athlete 1',
                    'gender': 'Male',
                    'date_of_birth': '2010-01-01',
                    'school_id': self.school.school_id,
                    'guardian_name': 'Bulk Guardian 1',
                    'guardian_phone': '+977-9841234570',
                    'address': 'Bulk Address 1'
                },
                {
                    'full_name': 'Bulk Athlete 2',
                    'gender': 'Female',
                    'date_of_birth': '2010-02-02',
                    'school_id': self.school.school_id,
                    'guardian_name': 'Bulk Guardian 2',
                    'guardian_phone': '+977-9841234571',
                    'address': 'Bulk Address 2'
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['success_count'], 2)
        self.assertEqual(response.data['data']['error_count'], 0)
    
    def test_export_athletes(self):
        """Test athlete export endpoint."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-export')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
    
    def test_recalculate_profile_completion(self):
        """Test profile completion recalculation endpoint."""
        self.client.force_authenticate(user=self.school_admin)
        url = reverse('athletes:athlete-recalculate-completion', kwargs={'athlete_id': self.athlete1.id})
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('new_completion', response.data['data'])
        self.assertIn('old_completion', response.data['data'])