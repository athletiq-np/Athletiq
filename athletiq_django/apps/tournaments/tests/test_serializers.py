"""
Tests for tournament serializers.
"""
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

from apps.tournaments.models import Tournament, TournamentTeam
from apps.tournaments.serializers import (
    TournamentCreateSerializer, TournamentDetailSerializer,
    TournamentListSerializer, TeamRegistrationSerializer
)

User = get_user_model()


class TournamentSerializerTest(TestCase):
    """Test cases for tournament serializers."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='super_admin'
        )
        
        self.tournament = Tournament.objects.create(
            name='Test Tournament',
            description='A test tournament',
            sport='football',
            level='school',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=35),
            registration_deadline=date.today() + timedelta(days=20),
            max_teams=16,
            min_teams=4,
            location='Test Stadium',
            city='Test City',
            created_by=self.user
        )
    
    def test_tournament_create_serializer_valid_data(self):
        """Test tournament creation with valid data."""
        data = {
            'name': 'New Tournament',
            'sport': 'basketball',
            'level': 'district',
            'start_date': date.today() + timedelta(days=40),
            'end_date': date.today() + timedelta(days=45),
            'registration_deadline': date.today() + timedelta(days=30),
            'max_teams': 8,
            'min_teams': 4,
            'location': 'New Stadium'
        }
        
        request = self.factory.post('/tournaments/')
        request.user = self.user
        
        serializer = TournamentCreateSerializer(
            data=data, 
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid())
        tournament = serializer.save()
        self.assertEqual(tournament.name, 'New Tournament')
        self.assertEqual(tournament.created_by, self.user)
    
    def test_tournament_create_serializer_invalid_dates(self):
        """Test tournament creation with invalid dates."""
        data = {
            'name': 'Invalid Tournament',
            'sport': 'football',
            'start_date': date.today() + timedelta(days=30),
            'end_date': date.today() + timedelta(days=25),  # End before start
        }
        
        serializer = TournamentCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('End date must be after start date', str(serializer.errors))
    
    def test_tournament_detail_serializer(self):
        """Test tournament detail serializer."""
        serializer = TournamentDetailSerializer(self.tournament)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Test Tournament')
        self.assertEqual(data['sport'], 'football')
        self.assertIn('tournament_id', data)
        self.assertIn('tournament_code', data)
        self.assertIn('is_registration_open', data)
        self.assertIn('registered_teams_count', data)
    
    def test_tournament_list_serializer(self):
        """Test tournament list serializer."""
        serializer = TournamentListSerializer(self.tournament)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Test Tournament')
        self.assertIn('registered_teams_count', data)
        self.assertIn('is_registration_open', data)
        # Should not include detailed fields like rules, prize_details
        self.assertNotIn('rules', data)
        self.assertNotIn('prize_details', data)


class TeamRegistrationSerializerTest(TestCase):
    """Test cases for team registration serializer."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='schooluser',
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='school_admin'
        )
        
        self.tournament = Tournament.objects.create(
            name='Test Tournament',
            sport='football',
            level='school',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=35),
            registration_deadline=date.today() + timedelta(days=20),
            max_teams=16,
            min_teams=4,
            created_by=self.user
        )
    
    def test_team_registration_valid_data(self):
        """Test team registration with valid data."""
        data = {
            'team_id': 1,
            'team_name': 'Test Team',
            'school_id': 1,
            'contact_person': 'John Doe',
            'contact_phone': '1234567890',
            'contact_email': 'john@example.com'
        }
        
        serializer = TeamRegistrationSerializer(
            data=data,
            context={'tournament': self.tournament}
        )
        
        self.assertTrue(serializer.is_valid())
        team = serializer.save()
        self.assertEqual(team.team_name, 'Test Team')
        self.assertEqual(team.tournament, self.tournament)
    
    def test_team_registration_duplicate_team(self):
        """Test team registration with duplicate team."""
        # Create existing team registration
        TournamentTeam.objects.create(
            tournament=self.tournament,
            team_id=1,
            team_name='Existing Team'
        )
        
        data = {
            'team_id': 1,  # Same team ID
            'team_name': 'Another Team'
        }
        
        serializer = TeamRegistrationSerializer(
            data=data,
            context={'tournament': self.tournament}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('Team is already registered', str(serializer.errors))
    
    def test_team_registration_closed(self):
        """Test team registration when registration is closed."""
        # Set registration deadline to past
        self.tournament.registration_deadline = date.today() - timedelta(days=1)
        self.tournament.save()
        
        data = {
            'team_id': 1,
            'team_name': 'Test Team'
        }
        
        serializer = TeamRegistrationSerializer(
            data=data,
            context={'tournament': self.tournament}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('Registration is closed', str(serializer.errors))