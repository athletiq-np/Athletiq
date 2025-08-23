"""
Tests for tournament models.
"""
import uuid
from datetime import date, timedelta
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from apps.tournaments.models import Tournament, TournamentTeam, TournamentPlayer, TournamentSport

User = get_user_model()


class TournamentModelTest(TestCase):
    """Test cases for Tournament model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='super_admin'
        )
        
        self.tournament_data = {
            'name': 'Test Tournament',
            'description': 'A test tournament',
            'sport': 'football',
            'level': 'school',
            'start_date': date.today() + timedelta(days=30),
            'end_date': date.today() + timedelta(days=35),
            'registration_deadline': date.today() + timedelta(days=20),
            'max_teams': 16,
            'min_teams': 4,
            'location': 'Test Stadium',
            'city': 'Test City',
            'created_by': self.user
        }
    
    def test_tournament_creation(self):
        """Test tournament creation with valid data."""
        tournament = Tournament.objects.create(**self.tournament_data)
        
        self.assertEqual(tournament.name, 'Test Tournament')
        self.assertEqual(tournament.sport, 'football')
        self.assertEqual(tournament.status, 'upcoming')
        self.assertTrue(tournament.tournament_code.startswith('TMT'))
        self.assertIsInstance(tournament.tournament_id, uuid.UUID)
    
    def test_tournament_code_generation(self):
        """Test automatic tournament code generation."""
        tournament = Tournament.objects.create(**self.tournament_data)
        
        self.assertIsNotNone(tournament.tournament_code)
        self.assertTrue(tournament.tournament_code.startswith('TMT'))
        self.assertEqual(len(tournament.tournament_code), 8)  # TMT + 5 chars
    
    def test_tournament_code_uniqueness(self):
        """Test tournament code uniqueness."""
        tournament1 = Tournament.objects.create(**self.tournament_data)
        
        # Create another tournament
        self.tournament_data['name'] = 'Another Tournament'
        tournament2 = Tournament.objects.create(**self.tournament_data)
        
        self.assertNotEqual(tournament1.tournament_code, tournament2.tournament_code)
    
    def test_date_validation(self):
        """Test tournament date validation."""
        # End date before start date should raise ValidationError
        self.tournament_data['end_date'] = self.tournament_data['start_date'] - timedelta(days=1)
        
        tournament = Tournament(**self.tournament_data)
        with self.assertRaises(ValidationError):
            tournament.full_clean()
    
    def test_registration_deadline_validation(self):
        """Test registration deadline validation."""
        # Registration deadline after start date should raise ValidationError
        self.tournament_data['registration_deadline'] = self.tournament_data['start_date'] + timedelta(days=1)
        
        tournament = Tournament(**self.tournament_data)
        with self.assertRaises(ValidationError):
            tournament.full_clean()
    
    def test_team_limits_validation(self):
        """Test team limits validation."""
        # Max teams less than min teams should raise ValidationError
        self.tournament_data['max_teams'] = 2
        self.tournament_data['min_teams'] = 4
        
        tournament = Tournament(**self.tournament_data)
        with self.assertRaises(ValidationError):
            tournament.full_clean()
    
    def test_is_registration_open_property(self):
        """Test is_registration_open property."""
        tournament = Tournament.objects.create(**self.tournament_data)
        
        # Registration should be open (deadline in future, status upcoming)
        self.assertTrue(tournament.is_registration_open)
        
        # Change status to ongoing
        tournament.status = 'ongoing'
        tournament.save()
        self.assertFalse(tournament.is_registration_open)
    
    def test_tournament_str_representation(self):
        """Test tournament string representation."""
        tournament = Tournament.objects.create(**self.tournament_data)
        expected_str = f"{tournament.name} ({tournament.tournament_code})"
        self.assertEqual(str(tournament), expected_str)