"""
Integration tests for tournament management endpoints.
"""
import json
import time
from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.tournaments.models import Tournament, TournamentRegistration
from apps.schools.models import School
from apps.athletes.models import Athlete
from tests.factories import UserFactory, SchoolFactory, TournamentFactory, AthleteFactory

User = get_user_model()


class TournamentManagementIntegrationTest(APITestCase):
    """
    Integration tests for complete tournament management workflows.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create users
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.other_admin = UserFactory(role='SchoolAdmin')
        self.coach = UserFactory(role='Coach')
        
        # Create schools
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.other_school = SchoolFactory(admin_user=self.other_admin)
        
        # Tournament data
        self.tournament_data = {
            'name': 'Integration Test Tournament',
            'description': 'A comprehensive tournament for testing',
            'sport': 'Football',
            'tournament_type': 'knockout',
            'format': 'single_elimination',
            'location': 'Test Stadium, Kigali',
            'start_date': (date.today() + timedelta(days=30)).isoformat(),
            'end_date': (date.today() + timedelta(days=32)).isoformat(),
            'max_teams': 16,
            'min_teams': 4,
            'entry_fee': 50000.00,
            'prize_pool': 500000.00,
            'age_group': 'U16',
            'gender': 'Mixed',
            'category': 'School Championship',
            'visibility': 'public',
            'registration_deadline': (date.today() + timedelta(days=20)).isoformat()
        }
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_complete_tournament_lifecycle(self):
        """Test complete tournament lifecycle from creation to completion."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Create tournament
        create_response = self.client.post('/api/tournaments/', self.tournament_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(create_response.data['success'])
        
        tournament_id = create_response.data['data']['id']
        tournament_code = create_response.data['data']['tournament_code']
        
        # Verify tournament was created with proper data
        self.assertEqual(create_response.data['data']['name'], 'Integration Test Tournament')
        self.assertEqual(create_response.data['data']['status'], 'draft')
        self.assertIsNotNone(tournament_code)
        
        # Step 2: Update tournament details
        update_data = {
            'name': 'Updated Tournament Name',
            'max_teams': 20,
            'entry_fee': 60000.00
        }
        
        update_response = self.client.patch(f'/api/tournaments/{tournament_id}/', update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        self.assertEqual(update_response.data['data']['name'], 'Updated Tournament Name')
        
        # Step 3: Publish tournament
        publish_response = self.client.post(f'/api/tournaments/{tournament_id}/publish/')
        self.assertEqual(publish_response.status_code, status.HTTP_200_OK)
        self.assertTrue(publish_response.data['success'])
        self.assertEqual(publish_response.data['data']['status'], 'published')
        
        # Step 4: Register school team
        school_token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {school_token}')
        
        registration_data = {
            'team_name': 'School Eagles',
            'coach_name': 'John Coach',
            'coach_phone': '+250788123456',
            'players': [
                {
                    'athlete_id': AthleteFactory(school=self.school).id,
                    'position': 'Forward'
                },
                {
                    'athlete_id': AthleteFactory(school=self.school).id,
                    'position': 'Midfielder'
                }
            ]
        }
        
        register_response = self.client.post(
            f'/api/tournaments/{tournament_id}/register/',
            registration_data,
            format='json'
        )
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(register_response.data['success'])
        
        # Step 5: Verify registration
        registrations_response = self.client.get(f'/api/tournaments/{tournament_id}/registrations/')
        self.assertEqual(registrations_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(registrations_response.data['data']), 1)
        
        # Step 6: Start tournament (as SuperAdmin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        start_response = self.client.post(f'/api/tournaments/{tournament_id}/start/')
        self.assertEqual(start_response.status_code, status.HTTP_200_OK)
        self.assertTrue(start_response.data['success'])
        
        # Step 7: Generate bracket
        bracket_response = self.client.post(f'/api/tournaments/{tournament_id}/generate-bracket/')
        self.assertEqual(bracket_response.status_code, status.HTTP_200_OK)
        self.assertTrue(bracket_response.data['success'])
        
        # Step 8: Get tournament matches
        matches_response = self.client.get(f'/api/tournaments/{tournament_id}/matches/')
        self.assertEqual(matches_response.status_code, status.HTTP_200_OK)
        self.assertTrue(matches_response.data['success'])
    
    def test_tournament_registration_workflow(self):
        """Test complete tournament registration workflow."""
        # Create and publish tournament
        tournament = TournamentFactory(
            organizer=self.super_admin,
            status='published',
            max_teams=8
        )
        
        # School 1 registration
        token1 = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        
        athletes1 = [AthleteFactory(school=self.school) for _ in range(3)]
        
        registration_data1 = {
            'team_name': 'School Eagles',
            'coach_name': 'John Coach',
            'coach_phone': '+250788123456',
            'players': [
                {
                    'athlete_id': athlete.id,
                    'position': f'Position {i+1}'
                }
                for i, athlete in enumerate(athletes1)
            ]
        }
        
        register_response1 = self.client.post(
            f'/api/tournaments/{tournament.id}/register/',
            registration_data1,
            format='json'
        )
        self.assertEqual(register_response1.status_code, status.HTTP_201_CREATED)
        
        # School 2 registration
        token2 = self.get_jwt_token(self.other_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token2}')
        
        athletes2 = [AthleteFactory(school=self.other_school) for _ in range(3)]
        
        registration_data2 = {
            'team_name': 'School Lions',
            'coach_name': 'Jane Coach',
            'coach_phone': '+250788654321',
            'players': [
                {
                    'athlete_id': athlete.id,
                    'position': f'Position {i+1}'
                }
                for i, athlete in enumerate(athletes2)
            ]
        }
        
        register_response2 = self.client.post(
            f'/api/tournaments/{tournament.id}/register/',
            registration_data2,
            format='json'
        )
        self.assertEqual(register_response2.status_code, status.HTTP_201_CREATED)
        
        # Verify both registrations
        super_token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {super_token}')
        
        registrations_response = self.client.get(f'/api/tournaments/{tournament.id}/registrations/')
        self.assertEqual(registrations_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(registrations_response.data['data']), 2)
        
        team_names = [reg['team_name'] for reg in registrations_response.data['data']]
        self.assertIn('School Eagles', team_names)
        self.assertIn('School Lions', team_names)
    
    def test_tournament_access_permissions(self):
        """Test tournament access permissions for different user roles."""
        # Create tournaments
        public_tournament = TournamentFactory(
            organizer=self.super_admin,
            visibility='public',
            status='published'
        )
        
        private_tournament = TournamentFactory(
            organizer=self.super_admin,
            visibility='private',
            status='published'
        )
        
        draft_tournament = TournamentFactory(
            organizer=self.super_admin,
            status='draft'
        )
        
        # Test SuperAdmin access
        super_token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {super_token}')
        
        response = self.client.get('/api/tournaments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tournament_ids = [t['id'] for t in response.data['data']]
        
        # SuperAdmin should see all tournaments
        self.assertIn(public_tournament.id, tournament_ids)
        self.assertIn(private_tournament.id, tournament_ids)
        self.assertIn(draft_tournament.id, tournament_ids)
        
        # Test SchoolAdmin access
        school_token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {school_token}')
        
        response = self.client.get('/api/tournaments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tournament_ids = [t['id'] for t in response.data['data']]
        
        # SchoolAdmin should only see public published tournaments
        self.assertIn(public_tournament.id, tournament_ids)
        self.assertNotIn(private_tournament.id, tournament_ids)
        self.assertNotIn(draft_tournament.id, tournament_ids)
        
        # Test unauthenticated access
        self.client.credentials()
        
        response = self.client.get('/api/tournaments/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_tournament_search_and_filtering(self):
        """Test tournament search and filtering functionality."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create diverse tournaments
        tournaments = [
            TournamentFactory(
                name='Football Championship',
                sport='Football',
                age_group='U16',
                gender='Male',
                status='published',
                visibility='public'
            ),
            TournamentFactory(
                name='Basketball League',
                sport='Basketball',
                age_group='U18',
                gender='Female',
                status='published',
                visibility='public'
            ),
            TournamentFactory(
                name='Volleyball Tournament',
                sport='Volleyball',
                age_group='U16',
                gender='Mixed',
                status='published',
                visibility='public'
            )
        ]
        
        # Test sport filter
        response = self.client.get('/api/tournaments/?sport=Football')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        football_tournaments = [t for t in response.data['data'] if t['sport'] == 'Football']
        self.assertGreaterEqual(len(football_tournaments), 1)
        
        # Test age group filter
        response = self.client.get('/api/tournaments/?age_group=U16')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        u16_tournaments = [t for t in response.data['data'] if t['age_group'] == 'U16']
        self.assertGreaterEqual(len(u16_tournaments), 2)
        
        # Test gender filter
        response = self.client.get('/api/tournaments/?gender=Female')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        female_tournaments = [t for t in response.data['data'] if t['gender'] == 'Female']
        self.assertGreaterEqual(len(female_tournaments), 1)
        
        # Test search by name
        response = self.client.get('/api/tournaments/search/?q=Championship')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        championship_tournaments = [t for t in response.data['data'] if 'Championship' in t['name']]
        self.assertGreaterEqual(len(championship_tournaments), 1)
        
        # Test combined filters
        response = self.client.get('/api/tournaments/?sport=Football&age_group=U16')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        combined_tournaments = [
            t for t in response.data['data'] 
            if t['sport'] == 'Football' and t['age_group'] == 'U16'
        ]
        self.assertGreaterEqual(len(combined_tournaments), 1)


class TournamentAnalyticsIntegrationTest(APITestCase):
    """
    Integration tests for tournament analytics and reporting.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        # Create tournaments with different characteristics
        self.create_test_tournaments()
    
    def create_test_tournaments(self):
        """Create test tournaments for analytics."""
        tournaments_data = [
            {'sport': 'Football', 'status': 'completed', 'gender': 'Male'},
            {'sport': 'Basketball', 'status': 'ongoing', 'gender': 'Female'},
            {'sport': 'Football', 'status': 'published', 'gender': 'Mixed'},
            {'sport': 'Volleyball', 'status': 'completed', 'gender': 'Female'},
            {'sport': 'Cricket', 'status': 'draft', 'gender': 'Male'},
        ]
        
        for data in tournaments_data:
            TournamentFactory(organizer=self.super_admin, **data)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_tournament_analytics_endpoint(self):
        """Test tournament analytics endpoint."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/tournaments/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        analytics = response.data['data']
        
        # Verify basic counts
        self.assertEqual(analytics['total_tournaments'], 5)
        self.assertEqual(analytics['completed_tournaments'], 2)
        self.assertEqual(analytics['ongoing_tournaments'], 1)
        self.assertEqual(analytics['published_tournaments'], 1)
        
        # Verify sport distribution
        self.assertIn('sport_distribution', analytics)
        sport_dist = analytics['sport_distribution']
        self.assertEqual(sport_dist['Football'], 2)
        self.assertEqual(sport_dist['Basketball'], 1)
        
        # Verify gender distribution
        self.assertIn('gender_distribution', analytics)
        gender_dist = analytics['gender_distribution']
        self.assertEqual(gender_dist['Male'], 2)
        self.assertEqual(gender_dist['Female'], 2)
        self.assertEqual(gender_dist['Mixed'], 1)
    
    def test_tournament_participation_statistics(self):
        """Test tournament participation statistics."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create tournament with registrations
        tournament = TournamentFactory(
            organizer=self.super_admin,
            status='published',
            max_teams=8
        )
        
        # Create some registrations
        for i in range(3):
            school = SchoolFactory()
            athletes = [AthleteFactory(school=school) for _ in range(2)]
            
            # Register team (this would normally go through the API)
            TournamentRegistration.objects.create(
                tournament=tournament,
                school=school,
                team_name=f'Team {i+1}',
                coach_name=f'Coach {i+1}',
                status='confirmed'
            )
        
        response = self.client.get(f'/api/tournaments/{tournament.id}/statistics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        stats = response.data['data']
        self.assertEqual(stats['registered_teams'], 3)
        self.assertEqual(stats['max_teams'], 8)
        self.assertIn('registration_rate', stats)
    
    def test_tournament_performance_metrics(self):
        """Test tournament performance metrics."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/tournaments/performance-metrics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        metrics = response.data['data']
        self.assertIn('average_tournament_duration', metrics)
        self.assertIn('average_teams_per_tournament', metrics)
        self.assertIn('completion_rate', metrics)


class TournamentErrorHandlingIntegrationTest(APITestCase):
    """
    Integration tests for tournament error handling.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_tournament_validation_errors(self):
        """Test tournament creation with validation errors."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test missing required fields
        incomplete_data = {
            'name': 'Incomplete Tournament'
        }
        
        response = self.client.post('/api/tournaments/', incomplete_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
        
        # Test invalid date range
        invalid_date_data = {
            'name': 'Invalid Date Tournament',
            'sport': 'Football',
            'start_date': '2024-12-31',
            'end_date': '2024-12-01',  # End before start
            'location': 'Test Location'
        }
        
        response = self.client.post('/api/tournaments/', invalid_date_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_tournament_registration_errors(self):
        """Test tournament registration error scenarios."""
        tournament = TournamentFactory(
            organizer=self.super_admin,
            status='published',
            max_teams=2
        )
        
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test registration with no athletes
        invalid_registration = {
            'team_name': 'Empty Team',
            'coach_name': 'John Coach',
            'players': []
        }
        
        response = self.client.post(
            f'/api/tournaments/{tournament.id}/register/',
            invalid_registration,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        
        # Test duplicate registration
        valid_registration = {
            'team_name': 'Valid Team',
            'coach_name': 'John Coach',
            'players': [
                {
                    'athlete_id': AthleteFactory(school=self.school).id,
                    'position': 'Forward'
                }
            ]
        }
        
        # First registration should succeed
        response1 = self.client.post(
            f'/api/tournaments/{tournament.id}/register/',
            valid_registration,
            format='json'
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Second registration should fail
        response2 = self.client.post(
            f'/api/tournaments/{tournament.id}/register/',
            valid_registration,
            format='json'
        )
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response2.data['success'])
    
    def test_tournament_not_found_errors(self):
        """Test tournament not found error scenarios."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test accessing non-existent tournament
        response = self.client.get('/api/tournaments/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])
        
        # Test registering for non-existent tournament
        registration_data = {
            'team_name': 'Test Team',
            'coach_name': 'Test Coach',
            'players': []
        }
        
        response = self.client.post(
            '/api/tournaments/99999/register/',
            registration_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TournamentPerformanceIntegrationTest(APITestCase):
    """
    Integration tests for tournament endpoint performance.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        
        # Create many tournaments for performance testing
        self.create_many_tournaments(30)
    
    def create_many_tournaments(self, count):
        """Create many tournaments for performance testing."""
        for i in range(count):
            TournamentFactory(
                organizer=self.super_admin,
                name=f'Performance Test Tournament {i+1:03d}',
                status='published' if i % 3 == 0 else 'draft',
                visibility='public'
            )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_tournament_list_pagination_performance(self):
        """Test tournament list endpoint with pagination performance."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/tournaments/?page=1&page_size=10')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Should return paginated results
        self.assertLessEqual(len(response.data['data']), 10)
        
        # Response should be reasonably fast
        self.assertLess(response_time, 2.0)  # Under 2 seconds
    
    def test_tournament_search_performance(self):
        """Test tournament search performance with large dataset."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/tournaments/search/?q=Performance Test')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Should find matching tournaments
        self.assertGreater(len(response.data['data']), 0)
        
        # Search should be reasonably fast
        self.assertLess(response_time, 3.0)  # Under 3 seconds
    
    def test_tournament_analytics_performance(self):
        """Test tournament analytics performance."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/tournaments/analytics/')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Analytics should be reasonably fast
        self.assertLess(response_time, 5.0)  # Under 5 seconds