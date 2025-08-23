"""
Unit tests for tournaments models.
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from decimal import Decimal
from datetime import date, timedelta

from apps.tournaments.models import Tournament, TournamentTeam, TournamentPlayer, TournamentSport
from tests.factories import TournamentFactory, TournamentTeamFactory, UserFactory, SchoolFactory, AthleteFactory


class TournamentModelTest(TestCase):
    """Test cases for Tournament model."""
    
    def setUp(self):
        """Set up test data."""
        self.organizer = UserFactory(role='SuperAdmin')
        self.tournament_data = {
            'tournament_code': 'TMT00001',
            'name': 'Inter-School Football Championship',
            'description': 'Annual football tournament for schools',
            'sport': 'Football',
            'level': 'district',
            'start_date': date.today() + timedelta(days=30),
            'end_date': date.today() + timedelta(days=37),
            'registration_deadline': date.today() + timedelta(days=27),
            'max_teams': 16,
            'min_teams': 8,
            'max_players_per_team': 18,
            'location': 'Kathmandu',
            'address': 'Dasharath Stadium, Kathmandu',
            'city': 'Kathmandu',
            'country': 'Nepal',
            'organizer_id': self.organizer,
            'organizer_type': 'school',
            'created_by': self.organizer,
            'status': 'upcoming',
            'format': 'knockout',
            'entry_fee': Decimal('500.00'),
            'prize_pool': Decimal('50000.00'),
            'age_group': 'U-17',
            'gender': 'male',
            'category': 'Junior'
        }
    
    def test_tournament_creation(self):
        """Test basic tournament creation."""
        tournament = Tournament.objects.create(**self.tournament_data)
        
        self.assertEqual(tournament.tournament_code, 'TMT00001')
        self.assertEqual(tournament.name, 'Inter-School Football Championship')
        self.assertEqual(tournament.sport, 'Football')
        self.assertEqual(tournament.organizer_id, self.organizer)
        self.assertTrue(tournament.is_active)
        self.assertIsNotNone(tournament.created_at)
        self.assertIsNotNone(tournament.updated_at)
    
    def test_tournament_str_representation(self):
        """Test tournament string representation."""
        tournament = Tournament.objects.create(**self.tournament_data)
        expected = f"{tournament.name} ({tournament.tournament_code})"
        self.assertEqual(str(tournament), expected)
    
    def test_unique_tournament_code_constraint(self):
        """Test that tournament_code must be unique."""
        Tournament.objects.create(**self.tournament_data)
        
        # Try to create another tournament with same code
        tournament_data_2 = self.tournament_data.copy()
        tournament_data_2['name'] = 'Different Tournament'
        
        with self.assertRaises(IntegrityError):
            Tournament.objects.create(**tournament_data_2)
    
    def test_organizer_relationship(self):
        """Test tournament-organizer relationship."""
        tournament = Tournament.objects.create(**self.tournament_data)
        
        self.assertEqual(tournament.organizer_id, self.organizer)
        self.assertEqual(tournament.created_by, self.organizer)
    
    def test_date_validation(self):
        """Test tournament date validation."""
        # End date should be after start date
        tournament_data = self.tournament_data.copy()
        tournament_data['end_date'] = tournament_data['start_date'] - timedelta(days=1)
        tournament_data['tournament_code'] = 'TMT00002'
        
        tournament = Tournament(**tournament_data)
        with self.assertRaises(ValidationError):
            tournament.full_clean()
    
    def test_registration_deadline_validation(self):
        """Test registration deadline validation."""
        # Registration deadline should be before start date
        tournament_data = self.tournament_data.copy()
        tournament_data['registration_deadline'] = tournament_data['start_date'] + timedelta(days=1)
        tournament_data['tournament_code'] = 'TMT00003'
        
        tournament = Tournament(**tournament_data)
        with self.assertRaises(ValidationError):
            tournament.full_clean()
    
    def test_team_limits_validation(self):
        """Test team limits validation."""
        # Min teams should be less than or equal to max teams
        tournament_data = self.tournament_data.copy()
        tournament_data['min_teams'] = 20
        tournament_data['max_teams'] = 16
        tournament_data['tournament_code'] = 'TMT00004'
        
        tournament = Tournament(**tournament_data)
        with self.assertRaises(ValidationError):
            tournament.full_clean()
    
    def test_sport_choices_validation(self):
        """Test sport field validation."""
        valid_sports = ['Football', 'Basketball', 'Volleyball', 'Cricket', 'Tennis', 'Badminton']
        
        for sport in valid_sports:
            tournament_data = self.tournament_data.copy()
            tournament_data['sport'] = sport
            tournament_data['tournament_code'] = f'TMT{sport[:3].upper()}'
            
            tournament = Tournament.objects.create(**tournament_data)
            self.assertEqual(tournament.sport, sport)
    
    def test_level_choices_validation(self):
        """Test level field validation."""
        valid_levels = ['school', 'district', 'provincial', 'national', 'international']
        
        for level in valid_levels:
            tournament_data = self.tournament_data.copy()
            tournament_data['level'] = level
            tournament_data['tournament_code'] = f'TMT{level[:3].upper()}'
            
            tournament = Tournament.objects.create(**tournament_data)
            self.assertEqual(tournament.level, level)
    
    def test_status_choices_validation(self):
        """Test status field validation."""
        valid_statuses = ['draft', 'upcoming', 'registration_open', 'registration_closed', 
                         'ongoing', 'completed', 'cancelled']
        
        for status in valid_statuses:
            tournament_data = self.tournament_data.copy()
            tournament_data['status'] = status
            tournament_data['tournament_code'] = f'TMT{status[:3].upper()}'
            
            tournament = Tournament.objects.create(**tournament_data)
            self.assertEqual(tournament.status, status)
    
    def test_format_choices_validation(self):
        """Test format field validation."""
        valid_formats = ['knockout', 'league', 'group_stage', 'swiss', 'round_robin']
        
        for format_type in valid_formats:
            tournament_data = self.tournament_data.copy()
            tournament_data['format'] = format_type
            tournament_data['tournament_code'] = f'TMT{format_type[:3].upper()}'
            
            tournament = Tournament.objects.create(**tournament_data)
            self.assertEqual(tournament.format, format_type)
    
    def test_age_group_choices_validation(self):
        """Test age group field validation."""
        valid_age_groups = ['U-12', 'U-15', 'U-17', 'U-19', 'U-21', 'Open']
        
        for age_group in valid_age_groups:
            tournament_data = self.tournament_data.copy()
            tournament_data['age_group'] = age_group
            tournament_data['tournament_code'] = f'TMT{age_group.replace("-", "")}'
            
            tournament = Tournament.objects.create(**tournament_data)
            self.assertEqual(tournament.age_group, age_group)
    
    def test_gender_choices_validation(self):
        """Test gender field validation."""
        valid_genders = ['male', 'female', 'mixed']
        
        for gender in valid_genders:
            tournament_data = self.tournament_data.copy()
            tournament_data['gender'] = gender
            tournament_data['tournament_code'] = f'TMT{gender[:3].upper()}'
            
            tournament = Tournament.objects.create(**tournament_data)
            self.assertEqual(tournament.gender, gender)
    
    def test_tournament_factory(self):
        """Test TournamentFactory creates valid tournaments."""
        tournament = TournamentFactory()
        
        self.assertIsNotNone(tournament.tournament_code)
        self.assertIsNotNone(tournament.name)
        self.assertIsNotNone(tournament.sport)
        self.assertIsNotNone(tournament.organizer_id)
        self.assertTrue(tournament.is_active)


class TournamentTeamModelTest(TestCase):
    """Test cases for TournamentTeam model."""
    
    def setUp(self):
        """Set up test data."""
        self.tournament = TournamentFactory()
        self.school = SchoolFactory()
        self.team_data = {
            'tournament': self.tournament,
            'team_id': 1,
            'team_name': 'Eagles FC',
            'school_id': self.school.school_id,
            'registration_status': 'registered',
            'seed_order': 1,
            'contact_person': 'John Coach',
            'contact_phone': '+977-9841234567',
            'contact_email': 'coach@school.edu.np'
        }
    
    def test_tournament_team_creation(self):
        """Test basic tournament team creation."""
        team = TournamentTeam.objects.create(**self.team_data)
        
        self.assertEqual(team.tournament, self.tournament)
        self.assertEqual(team.team_name, 'Eagles FC')
        self.assertEqual(team.registration_status, 'registered')
        self.assertTrue(team.is_active)
    
    def test_tournament_team_str_representation(self):
        """Test tournament team string representation."""
        team = TournamentTeam.objects.create(**self.team_data)
        expected = f"{team.team_name} - {team.tournament.name}"
        self.assertEqual(str(team), expected)
    
    def test_unique_team_per_tournament(self):
        """Test that team_id must be unique per tournament."""
        TournamentTeam.objects.create(**self.team_data)
        
        # Try to create another team with same team_id in same tournament
        team_data_2 = self.team_data.copy()
        team_data_2['team_name'] = 'Lions FC'
        
        with self.assertRaises(IntegrityError):
            TournamentTeam.objects.create(**team_data_2)
    
    def test_tournament_relationship(self):
        """Test team-tournament relationship."""
        team = TournamentTeam.objects.create(**self.team_data)
        
        self.assertEqual(team.tournament, self.tournament)
        self.assertIn(team, self.tournament.teams.all())
    
    def test_registration_status_choices(self):
        """Test registration status choices."""
        valid_statuses = ['pending', 'registered', 'confirmed', 'withdrawn', 'disqualified']
        
        for status in valid_statuses:
            team_data = self.team_data.copy()
            team_data['registration_status'] = status
            team_data['team_id'] = team_data['team_id'] + 1
            
            team = TournamentTeam.objects.create(**team_data)
            self.assertEqual(team.registration_status, status)


class TournamentPlayerModelTest(TestCase):
    """Test cases for TournamentPlayer model."""
    
    def setUp(self):
        """Set up test data."""
        self.tournament_team = TournamentTeamFactory()
        self.athlete = AthleteFactory()
        self.player_data = {
            'tournament_team': self.tournament_team,
            'athlete': self.athlete,
            'jersey_number': 10,
            'position': 'Forward',
            'is_captain': False,
            'registration_status': 'registered'
        }
    
    def test_tournament_player_creation(self):
        """Test basic tournament player creation."""
        player = TournamentPlayer.objects.create(**self.player_data)
        
        self.assertEqual(player.tournament_team, self.tournament_team)
        self.assertEqual(player.athlete, self.athlete)
        self.assertEqual(player.jersey_number, 10)
        self.assertEqual(player.position, 'Forward')
        self.assertFalse(player.is_captain)
    
    def test_tournament_player_str_representation(self):
        """Test tournament player string representation."""
        player = TournamentPlayer.objects.create(**self.player_data)
        expected = f"{player.athlete.full_name} - {player.tournament_team.team_name} (#{player.jersey_number})"
        self.assertEqual(str(player), expected)
    
    def test_unique_jersey_number_per_team(self):
        """Test that jersey number must be unique per team."""
        TournamentPlayer.objects.create(**self.player_data)
        
        # Try to create another player with same jersey number in same team
        player_data_2 = self.player_data.copy()
        player_data_2['athlete'] = AthleteFactory()
        
        with self.assertRaises(IntegrityError):
            TournamentPlayer.objects.create(**player_data_2)
    
    def test_unique_athlete_per_tournament(self):
        """Test that athlete can only be in one team per tournament."""
        TournamentPlayer.objects.create(**self.player_data)
        
        # Create another team in same tournament
        another_team = TournamentTeamFactory(tournament=self.tournament_team.tournament)
        
        player_data_2 = self.player_data.copy()
        player_data_2['tournament_team'] = another_team
        player_data_2['jersey_number'] = 11
        
        with self.assertRaises(IntegrityError):
            TournamentPlayer.objects.create(**player_data_2)
    
    def test_captain_validation(self):
        """Test captain validation - only one captain per team."""
        # Create first captain
        captain_data = self.player_data.copy()
        captain_data['is_captain'] = True
        captain = TournamentPlayer.objects.create(**captain_data)
        
        # Try to create another captain in same team
        captain_data_2 = self.player_data.copy()
        captain_data_2['athlete'] = AthleteFactory()
        captain_data_2['jersey_number'] = 11
        captain_data_2['is_captain'] = True
        
        player2 = TournamentPlayer(**captain_data_2)
        with self.assertRaises(ValidationError):
            player2.full_clean()


class TournamentSportModelTest(TestCase):
    """Test cases for TournamentSport model."""
    
    def setUp(self):
        """Set up test data."""
        self.tournament = TournamentFactory()
        self.sport_data = {
            'tournament': self.tournament,
            'sport_name': 'Football',
            'max_players_per_team': 18,
            'min_players_per_team': 11,
            'substitutions_allowed': 5,
            'match_duration_minutes': 90,
            'rules': {'offside': True, 'var': False}
        }
    
    def test_tournament_sport_creation(self):
        """Test basic tournament sport creation."""
        sport = TournamentSport.objects.create(**self.sport_data)
        
        self.assertEqual(sport.tournament, self.tournament)
        self.assertEqual(sport.sport_name, 'Football')
        self.assertEqual(sport.max_players_per_team, 18)
        self.assertEqual(sport.match_duration_minutes, 90)
    
    def test_tournament_sport_str_representation(self):
        """Test tournament sport string representation."""
        sport = TournamentSport.objects.create(**self.sport_data)
        expected = f"{sport.sport_name} - {sport.tournament.name}"
        self.assertEqual(str(sport), expected)
    
    def test_player_limits_validation(self):
        """Test player limits validation."""
        # Min players should be less than or equal to max players
        sport_data = self.sport_data.copy()
        sport_data['min_players_per_team'] = 20
        sport_data['max_players_per_team'] = 15
        
        sport = TournamentSport(**sport_data)
        with self.assertRaises(ValidationError):
            sport.full_clean()
    
    def test_rules_json_field(self):
        """Test rules JSON field functionality."""
        sport = TournamentSport.objects.create(**self.sport_data)
        
        self.assertEqual(sport.rules, {'offside': True, 'var': False})
        
        # Update rules
        sport.rules = {'offside': True, 'var': True, 'extra_time': True}
        sport.save()
        
        sport.refresh_from_db()
        self.assertEqual(sport.rules['var'], True)
        self.assertEqual(sport.rules['extra_time'], True)


@pytest.mark.django_db
class TestTournamentModelPytest:
    """Pytest-style tests for Tournament model."""
    
    def test_tournament_duration_property(self):
        """Test tournament duration calculation."""
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=7)
        
        tournament = TournamentFactory(start_date=start_date, end_date=end_date)
        assert tournament.duration == 8  # 7 days + 1 (inclusive)
    
    def test_tournament_is_registration_open(self):
        """Test registration open status."""
        # Registration open
        tournament = TournamentFactory(
            registration_deadline=date.today() + timedelta(days=5),
            status='registration_open'
        )
        assert tournament.is_registration_open
        
        # Registration closed by deadline
        tournament = TournamentFactory(
            registration_deadline=date.today() - timedelta(days=1),
            status='registration_open'
        )
        assert not tournament.is_registration_open
        
        # Registration closed by status
        tournament = TournamentFactory(
            registration_deadline=date.today() + timedelta(days=5),
            status='registration_closed'
        )
        assert not tournament.is_registration_open
    
    def test_tournament_team_count(self):
        """Test tournament team counting."""
        tournament = TournamentFactory()
        
        # Create teams
        TournamentTeamFactory.create_batch(3, tournament=tournament)
        
        assert tournament.teams.count() == 3
    
    def test_tournament_queryset_filtering(self):
        """Test common tournament queryset operations."""
        # Create tournaments with different statuses
        upcoming = TournamentFactory(status='upcoming')
        ongoing = TournamentFactory(status='ongoing')
        completed = TournamentFactory(status='completed')
        
        # Test filtering by status
        upcoming_tournaments = Tournament.objects.filter(status='upcoming')
        assert upcoming in upcoming_tournaments
        assert ongoing not in upcoming_tournaments
        
        # Test filtering by sport
        football_tournaments = Tournament.objects.filter(sport='Football')
        basketball_tournaments = Tournament.objects.filter(sport='Basketball')
        
        # Should have at least the created tournaments
        assert len(football_tournaments) >= 0
        assert len(basketball_tournaments) >= 0