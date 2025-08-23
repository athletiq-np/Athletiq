"""
Comprehensive tests for tournament management API endpoints.
"""
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import date, timedelta
from apps.tournaments.models import Tournament, TournamentTeam, TournamentPlayer, TournamentSport
from apps.schools.models import School

User = get_user_model()


class TournamentCRUDTest(APITestCase):
    """
    Test cases for tournament CRUD operations.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create users
        self.super_admin = User.objects.create(
            full_name="Super Admin",
            email="superadmin@athletiq.com",
            role="SuperAdmin"
        )
        
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        self.other_admin = User.objects.create(
            full_name="Other Admin",
            email="otheradmin@otherschool.com",
            role="SchoolAdmin"
        )
        
        # Create test tournament data
        self.tournament_data = {
            'name': 'Test Tournament',
            'description': 'A test tournament for API testing',
            'sport': 'football',
            'level': 'school',
            'start_date': (date.today() + timedelta(days=30)).isoformat(),
            'end_date': (date.today() + timedelta(days=32)).isoformat(),
            'registration_deadline': (date.today() + timedelta(days=20)).isoformat(),
            'max_teams': 16,
            'min_teams': 4,
            'location': 'Test Stadium',
            'city': 'Kigali',
            'country': 'Rwanda',
            'organizer_type': 'school',
            'format': 'knockout',
            'entry_fee': 50.00,
            'prize_pool': 1000.00,
            'age_group': 'u18',
            'gender': 'male',
            'category': 'senior',
            'visibility': 'public'
        }
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_create_tournament_success(self):
        """Test successful tournament creation."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.post('/api/tournaments/', self.tournament_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['name'], 'Test Tournament')
        self.assertIsNotNone(response.data['data']['tournament_code'])
        
        # Verify tournament was created in database
        self.assertTrue(Tournament.objects.filter(name='Test Tournament').exists())
    
    def test_create_tournament_validation_errors(self):
        """Test tournament creation with validation errors."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test with invalid date range
        invalid_data = self.tournament_data.copy()
        invalid_data['end_date'] = (date.today() + timedelta(days=10)).isoformat()  # Before start date
        
        response = self.client.post('/api/tournaments/', invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
    
    def test_create_tournament_unauthenticated(self):
        """Test tournament creation without authentication."""
        response = self.client.post('/api/tournaments/', self.tournament_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_tournaments_public(self):
        """Test listing tournaments for public users."""
        # Create published tournament
        Tournament.objects.create(
            name='Public Tournament',
            sport='basketball',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            created_by=self.school_admin,
            is_published=True
        )
        
        # Create unpublished tournament
        Tournament.objects.create(
            name='Private Tournament',
            sport='football',
            start_date=date.today() + timedelta(days=40),
            end_date=date.today() + timedelta(days=42),
            created_by=self.school_admin,
            is_published=False
        )
        
        response = self.client.get('/api/tournaments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Should only see published tournament
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['name'], 'Public Tournament')
    
    def test_list_tournaments_authenticated(self):
        """Test listing tournaments for authenticated users."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create published tournament
        Tournament.objects.create(
            name='Public Tournament',
            sport='basketball',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            created_by=self.other_admin,
            is_published=True
        )
        
        # Create own unpublished tournament
        Tournament.objects.create(
            name='My Private Tournament',
            sport='football',
            start_date=date.today() + timedelta(days=40),
            end_date=date.today() + timedelta(days=42),
            created_by=self.school_admin,
            is_published=False
        )
        
        response = self.client.get('/api/tournaments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Should see both tournaments (published + own)
        self.assertEqual(len(response.data['data']), 2)
    
    def test_retrieve_tournament(self):
        """Test retrieving a specific tournament."""
        tournament = Tournament.objects.create(
            name='Test Tournament',
            sport='football',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            created_by=self.school_admin,
            is_published=True
        )
        
        response = self.client.get(f'/api/tournaments/{tournament.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['name'], 'Test Tournament')
    
    def test_update_tournament_owner(self):
        """Test updating tournament by owner."""
        tournament = Tournament.objects.create(
            name='Test Tournament',
            sport='football',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            created_by=self.school_admin
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        update_data = {
            'name': 'Updated Tournament Name',
            'description': 'Updated description'
        }
        
        response = self.client.patch(f'/api/tournaments/{tournament.id}/', update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['name'], 'Updated Tournament Name')
        
        # Verify database was updated
        tournament.refresh_from_db()
        self.assertEqual(tournament.name, 'Updated Tournament Name')
    
    def test_update_tournament_non_owner(self):
        """Test updating tournament by non-owner."""
        tournament = Tournament.objects.create(
            name='Test Tournament',
            sport='football',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            created_by=self.school_admin
        )
        
        token = self.get_jwt_token(self.other_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        update_data = {'name': 'Hacked Tournament'}
        
        response = self.client.patch(f'/api/tournaments/{tournament.id}/', update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_tournament_success(self):
        """Test successful tournament deletion."""
        tournament = Tournament.objects.create(
            name='Test Tournament',
            sport='football',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            created_by=self.school_admin,
            status='draft'
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.delete(f'/api/tournaments/{tournament.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify soft delete
        tournament.refresh_from_db()
        self.assertFalse(tournament.is_active)
    
    def test_delete_tournament_with_registered_teams(self):
        """Test deleting tournament with registered teams."""
        tournament = Tournament.objects.create(
            name='Test Tournament',
            sport='football',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            created_by=self.school_admin,
            status='draft'
        )
        
        # Add registered team
        TournamentTeam.objects.create(
            tournament=tournament,
            team_id=1,
            team_name='Test Team',
            registration_status='registered'
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.delete(f'/api/tournaments/{tournament.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])


class TournamentTeamRegistrationTest(APITestCase):
    """
    Test cases for tournament team registration.
    """
    
    def setUp(self):
        """Set up test data."""
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        self.tournament = Tournament.objects.create(
            name='Test Tournament',
            sport='football',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            registration_deadline=date.today() + timedelta(days=20),
            max_teams=16,
            created_by=self.school_admin,
            status='upcoming',
            is_published=True
        )
        
        self.registration_data = {
            'team_id': 1,
            'team_name': 'Test Team',
            'school_id': 1,
            'contact_person': 'John Coach',
            'contact_phone': '+250788123456',
            'contact_email': 'coach@testschool.com',
            'notes': 'Test team registration',
            'players': [
                {
                    'player_id': 1,
                    'player_name': 'Player One',
                    'jersey_number': 10,
                    'position': 'Forward',
                    'is_captain': True
                },
                {
                    'player_id': 2,
                    'player_name': 'Player Two',
                    'jersey_number': 7,
                    'position': 'Midfielder'
                }
            ]
        }
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_register_team_success(self):
        """Test successful team registration."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.post(
            f'/api/tournaments/{self.tournament.id}/register_team/',
            self.registration_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['team_name'], 'Test Team')
        
        # Verify team was registered
        self.assertTrue(
            TournamentTeam.objects.filter(
                tournament=self.tournament,
                team_id=1
            ).exists()
        )
        
        # Verify players were registered
        tournament_team = TournamentTeam.objects.get(tournament=self.tournament, team_id=1)
        self.assertEqual(tournament_team.players.count(), 2)
    
    def test_register_team_duplicate(self):
        """Test registering duplicate team."""
        # Create existing registration
        TournamentTeam.objects.create(
            tournament=self.tournament,
            team_id=1,
            team_name='Existing Team'
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.post(
            f'/api/tournaments/{self.tournament.id}/register_team/',
            self.registration_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_register_team_closed_registration(self):
        """Test registering team when registration is closed."""
        # Set registration deadline in the past
        self.tournament.registration_deadline = date.today() - timedelta(days=1)
        self.tournament.save()
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.post(
            f'/api/tournaments/{self.tournament.id}/register_team/',
            self.registration_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_register_team_full_tournament(self):
        """Test registering team when tournament is full."""
        # Set max teams to 1
        self.tournament.max_teams = 1
        self.tournament.save()
        
        # Create existing registration
        TournamentTeam.objects.create(
            tournament=self.tournament,
            team_id=999,
            team_name='Existing Team',
            registration_status='registered'
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.post(
            f'/api/tournaments/{self.tournament.id}/register_team/',
            self.registration_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])


class TournamentAdditionalEndpointsTest(APITestCase):
    """
    Test cases for additional tournament endpoints.
    """
    
    def setUp(self):
        """Set up test data."""
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        self.super_admin = User.objects.create(
            full_name="Super Admin",
            email="superadmin@athletiq.com",
            role="SuperAdmin"
        )
        
        # Create test tournaments
        self.featured_tournament = Tournament.objects.create(
            name='Featured Tournament',
            sport='football',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            created_by=self.school_admin,
            is_published=True,
            is_featured=True
        )
        
        self.upcoming_tournament = Tournament.objects.create(
            name='Upcoming Tournament',
            sport='basketball',
            start_date=date.today() + timedelta(days=40),
            end_date=date.today() + timedelta(days=42),
            created_by=self.school_admin,
            is_published=True,
            status='upcoming'
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_get_featured_tournaments(self):
        """Test getting featured tournaments."""
        response = self.client.get('/api/tournaments/featured/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['name'], 'Featured Tournament')
    
    def test_get_upcoming_tournaments(self):
        """Test getting upcoming tournaments."""
        response = self.client.get('/api/tournaments/upcoming/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Should include both tournaments (both are upcoming)
        self.assertGreaterEqual(len(response.data['data']), 1)
    
    def test_get_upcoming_tournaments_with_filters(self):
        """Test getting upcoming tournaments with filters."""
        response = self.client.get('/api/tournaments/upcoming/?sport=basketball')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Should only include basketball tournament
        filtered_tournaments = [t for t in response.data['data'] if t['sport'] == 'basketball']
        self.assertGreater(len(filtered_tournaments), 0)
    
    def test_get_my_tournaments(self):
        """Test getting my tournaments."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/tournaments/my-tournaments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Should include both tournaments created by this user
        self.assertEqual(len(response.data['data']), 2)
    
    def test_search_tournaments(self):
        """Test tournament search."""
        response = self.client.get('/api/tournaments/search/?q=Featured')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Should find the featured tournament
        self.assertGreater(len(response.data['data']), 0)
        self.assertEqual(response.data['data'][0]['name'], 'Featured Tournament')
    
    def test_search_tournaments_with_filters(self):
        """Test tournament search with multiple filters."""
        response = self.client.get(
            '/api/tournaments/search/?sports=football&registration_open=true'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_get_tournament_analytics_superadmin(self):
        """Test getting tournament analytics as super admin."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/tournaments/analytics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('overview', response.data['data'])
        self.assertIn('financial', response.data['data'])
        self.assertIn('sports_breakdown', response.data['data'])
    
    def test_get_tournament_analytics_unauthorized(self):
        """Test getting tournament analytics without proper permissions."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/tournaments/analytics/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_duplicate_tournament(self):
        """Test duplicating a tournament."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        duplicate_data = {
            'modifications': {
                'name': 'Duplicated Tournament',
                'start_date': (date.today() + timedelta(days=60)).isoformat(),
                'end_date': (date.today() + timedelta(days=62)).isoformat()
            }
        }
        
        response = self.client.post(
            f'/api/tournaments/{self.featured_tournament.id}/duplicate/',
            duplicate_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['name'], 'Duplicated Tournament')
        self.assertEqual(response.data['data']['status'], 'draft')
        
        # Verify new tournament was created
        self.assertTrue(Tournament.objects.filter(name='Duplicated Tournament').exists())
    
    def test_duplicate_tournament_unauthorized(self):
        """Test duplicating tournament without permission."""
        other_admin = User.objects.create(
            full_name="Other Admin",
            email="other@test.com",
            role="SchoolAdmin"
        )
        
        token = self.get_jwt_token(other_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.post(
            f'/api/tournaments/{self.featured_tournament.id}/duplicate/',
            {'modifications': {}},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TournamentTeamManagementTest(APITestCase):
    """
    Test cases for tournament team management endpoints.
    """
    
    def setUp(self):
        """Set up test data."""
        self.school_admin = User.objects.create(
            full_name="School Admin",
            email="schooladmin@testschool.com",
            role="SchoolAdmin"
        )
        
        self.tournament = Tournament.objects.create(
            name='Test Tournament',
            sport='football',
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            created_by=self.school_admin
        )
        
        self.tournament_team = TournamentTeam.objects.create(
            tournament=self.tournament,
            team_id=1,
            team_name='Test Team',
            registration_status='pending'
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_get_tournament_teams(self):
        """Test getting tournament teams."""
        response = self.client.get(f'/api/tournaments/{self.tournament.id}/teams/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['team_name'], 'Test Team')
    
    def test_get_tournament_teams_with_status_filter(self):
        """Test getting tournament teams with status filter."""
        response = self.client.get(f'/api/tournaments/{self.tournament.id}/teams/?status=pending')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 1)
    
    def test_update_team_status(self):
        """Test updating team registration status."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        update_data = {
            'team_id': self.tournament_team.id,
            'status': 'registered',
            'notes': 'Team approved'
        }
        
        response = self.client.patch(
            f'/api/tournaments/{self.tournament.id}/update_team_status/',
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify status was updated
        self.tournament_team.refresh_from_db()
        self.assertEqual(self.tournament_team.registration_status, 'registered')
        self.assertIsNotNone(self.tournament_team.confirmed_date)
    
    def test_bulk_update_teams(self):
        """Test bulk updating team registrations."""
        # Create another team
        team2 = TournamentTeam.objects.create(
            tournament=self.tournament,
            team_id=2,
            team_name='Test Team 2',
            registration_status='pending'
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        bulk_data = {
            'updates': [
                {
                    'tournament_team_id': self.tournament_team.id,
                    'status': 'registered',
                    'seed_order': 1
                },
                {
                    'tournament_team_id': team2.id,
                    'status': 'registered',
                    'seed_order': 2
                }
            ]
        }
        
        response = self.client.patch(
            f'/api/tournaments/{self.tournament.id}/bulk_update_teams/',
            bulk_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']['updated_team_ids']), 2)
        
        # Verify updates
        self.tournament_team.refresh_from_db()
        team2.refresh_from_db()
        self.assertEqual(self.tournament_team.registration_status, 'registered')
        self.assertEqual(team2.registration_status, 'registered')
        self.assertEqual(self.tournament_team.seed_order, 1)
        self.assertEqual(team2.seed_order, 2)