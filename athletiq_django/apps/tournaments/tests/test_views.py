"""
Tests for tournament views.
"""
from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.tournaments.models import Tournament, TournamentTeam

User = get_user_model()


class TournamentViewSetTest(TestCase):
    """Test cases for tournament viewset."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create users
        self.super_admin = User.objects.create_user(
            username='superadmin',
            email='admin@example.com',
            password='testpass123',
            full_name='Super Admin',
            role='super_admin'
        )
        
        self.school_admin = User.objects.create_user(
            username='schooladmin',
            email='school@example.com',
            password='testpass123',
            full_name='School Admin',
            role='school_admin'
        )
        
        # Create tournament
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
            is_published=True,
            created_by=self.super_admin
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_tournament_list_public(self):
        """Test tournament list endpoint (public access)."""
        url = reverse('tournaments:tournament-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Tournament')
    
    def test_tournament_detail_public(self):
        """Test tournament detail endpoint (public access)."""
        url = reverse('tournaments:tournament-detail', kwargs={'pk': self.tournament.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Tournament')
        self.assertIn('tournament_code', response.data)
    
    def test_tournament_create_authenticated(self):
        """Test tournament creation (authenticated user)."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('tournaments:tournament-list')
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
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Tournament')
        
        # Verify tournament was created in database
        tournament = Tournament.objects.get(name='New Tournament')
        self.assertEqual(tournament.created_by, self.super_admin)
    
    def test_tournament_create_unauthenticated(self):
        """Test tournament creation (unauthenticated user)."""
        url = reverse('tournaments:tournament-list')
        data = {
            'name': 'New Tournament',
            'sport': 'basketball'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_tournament_update_owner(self):
        """Test tournament update by owner."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('tournaments:tournament-detail', kwargs={'pk': self.tournament.id})
        data = {
            'name': 'Updated Tournament Name',
            'description': 'Updated description'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Tournament Name')
        
        # Verify update in database
        self.tournament.refresh_from_db()
        self.assertEqual(self.tournament.name, 'Updated Tournament Name')
    
    def test_tournament_update_non_owner(self):
        """Test tournament update by non-owner."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('tournaments:tournament-detail', kwargs={'pk': self.tournament.id})
        data = {
            'name': 'Unauthorized Update'
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_team_registration(self):
        """Test team registration for tournament."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('tournaments:tournament-register-team', kwargs={'pk': self.tournament.id})
        data = {
            'team_id': 1,
            'team_name': 'Test Team',
            'school_id': 1,
            'contact_person': 'John Doe',
            'contact_phone': '1234567890',
            'contact_email': 'john@example.com'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['team_name'], 'Test Team')
        
        # Verify team registration in database
        team = TournamentTeam.objects.get(tournament=self.tournament, team_id=1)
        self.assertEqual(team.team_name, 'Test Team')
    
    def test_tournament_teams_list(self):
        """Test getting tournament teams."""
        # Create a team registration
        TournamentTeam.objects.create(
            tournament=self.tournament,
            team_id=1,
            team_name='Test Team',
            registration_status='registered'
        )
        
        url = reverse('tournaments:tournament-teams', kwargs={'pk': self.tournament.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['team_name'], 'Test Team')
    
    def test_tournament_statistics(self):
        """Test tournament statistics endpoint."""
        url = reverse('tournaments:tournament-statistics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('total_tournaments', response.data['data'])
        self.assertIn('sports_breakdown', response.data['data'])
    
    def test_tournament_dashboard(self):
        """Test tournament dashboard endpoint."""
        url = reverse('tournaments:tournament-dashboard', kwargs={'pk': self.tournament.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('tournament', response.data['data'])
        self.assertIn('statistics', response.data['data'])