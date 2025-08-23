"""
Integration tests for end-to-end workflows across multiple systems.
"""
import json
import time
from datetime import date, timedelta
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.schools.models import School
from apps.athletes.models import Athlete
from apps.guardians.models import Guardian
from apps.tournaments.models import Tournament, TournamentRegistration
from apps.documents.models import Document
from apps.notifications.models import NotificationLog
from tests.factories import UserFactory, SchoolFactory, AthleteFactory, GuardianFactory, TournamentFactory

User = get_user_model()


class CompleteSchoolOnboardingWorkflowTest(APITestCase):
    """
    End-to-end test for complete school onboarding workflow.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        self.school_registration_data = {
            'name': 'E2E Test School',
            'address': '123 E2E Test Street',
            'country': 'Rwanda',
            'province': 'Kigali',
            'district': 'Gasabo',
            'city': 'Kigali',
            'ward': '5',
            'phone': '+250788123456',
            'email': 'info@e2etestschool.com',
            'website': 'https://e2etestschool.com',
            'principal_name': 'Jane Principal',
            'admin_name': 'John Admin',
            'admin_email': 'admin@e2etestschool.com',
            'password': 'securepass123'
        }
    
    def test_complete_school_onboarding_workflow(self):
        """Test complete school onboarding from registration to first tournament participation."""
        
        # Step 1: School Registration
        registration_response = self.client.post(
            '/api/schools/register/',
            self.school_registration_data,
            format='json'
        )
        self.assertEqual(registration_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(registration_response.data['success'])
        
        school_id = registration_response.data['data']['school_id']
        admin_user_id = registration_response.data['data']['admin_user_id']
        
        # Step 2: Admin Login
        login_data = {
            'email': 'admin@e2etestschool.com',
            'password': 'securepass123'
        }
        
        login_response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        token = login_response.data['data']['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 3: Complete School Profile
        profile_update_data = {
            'description': 'A comprehensive sports-focused educational institution',
            'facilities': ['Football Field', 'Basketball Court', 'Swimming Pool'],
            'sports_offered': ['Football', 'Basketball', 'Swimming', 'Athletics'],
            'student_capacity': 500,
            'established_year': 2010
        }
        
        profile_response = self.client.patch('/api/schools/me/update/', profile_update_data, format='json')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        
        # Step 4: Create Guardian Account
        guardian_data = {
            'full_name': 'Guardian Parent',
            'email': 'guardian@e2etest.com',
            'phone': '+250788999888',
            'password': 'guardianpass123',
            'confirm_password': 'guardianpass123',
            'address': '456 Guardian Street',
            'city': 'Kigali',
            'province': 'Kigali'
        }
        
        guardian_response = self.client.post('/api/guardian/auth/register/', guardian_data, format='json')
        self.assertEqual(guardian_response.status_code, status.HTTP_201_CREATED)
        
        guardian_id = guardian_response.data['data']['guardian_id']
        
        # Step 5: Register Athletes
        athletes_data = [
            {
                'full_name': 'John Athlete',
                'date_of_birth': (date.today() - timedelta(days=365 * 16)).isoformat(),
                'gender': 'Male',
                'school_id': school_id,
                'guardian_id': guardian_id,
                'guardian_name': 'Guardian Parent',
                'guardian_phone': '+250788999888',
                'guardian_email': 'guardian@e2etest.com',
                'address': '456 Guardian Street',
                'grade': '11',
                'primary_sport': 'Football',
                'registered_sports': ['Football', 'Athletics']
            },
            {
                'full_name': 'Jane Athlete',
                'date_of_birth': (date.today() - timedelta(days=365 * 15)).isoformat(),
                'gender': 'Female',
                'school_id': school_id,
                'guardian_id': guardian_id,
                'guardian_name': 'Guardian Parent',
                'guardian_phone': '+250788999888',
                'guardian_email': 'guardian@e2etest.com',
                'address': '456 Guardian Street',
                'grade': '10',
                'primary_sport': 'Basketball',
                'registered_sports': ['Basketball', 'Swimming']
            }
        ]
        
        athlete_ids = []
        for athlete_data in athletes_data:
            athlete_response = self.client.post('/api/athletes/', athlete_data, format='json')
            self.assertEqual(athlete_response.status_code, status.HTTP_201_CREATED)
            athlete_ids.append(athlete_response.data['data']['id'])
        
        # Step 6: Upload Athlete Documents
        for athlete_id in athlete_ids:
            doc_data = {
                'document_type': 'profile_photo',
                'document_url': f'https://example.com/athlete_{athlete_id}_photo.jpg',
                'description': 'Athlete profile photo'
            }
            
            doc_response = self.client.post(
                f'/api/athletes/{athlete_id}/documents/upload/',
                doc_data,
                format='json'
            )
            self.assertEqual(doc_response.status_code, status.HTTP_200_OK)
        
        # Step 7: Create Tournament (as SuperAdmin)
        super_admin = UserFactory(role='SuperAdmin')
        super_token = RefreshToken.for_user(super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(super_token.access_token)}')
        
        tournament_data = {
            'name': 'E2E Test Tournament',
            'description': 'End-to-end test tournament',
            'sport': 'Football',
            'tournament_type': 'knockout',
            'format': 'single_elimination',
            'location': 'Test Stadium',
            'start_date': (date.today() + timedelta(days=30)).isoformat(),
            'end_date': (date.today() + timedelta(days=32)).isoformat(),
            'max_teams': 8,
            'min_teams': 2,
            'entry_fee': 50000.00,
            'age_group': 'U18',
            'gender': 'Mixed',
            'visibility': 'public'
        }
        
        tournament_response = self.client.post('/api/tournaments/', tournament_data, format='json')
        self.assertEqual(tournament_response.status_code, status.HTTP_201_CREATED)
        
        tournament_id = tournament_response.data['data']['id']
        
        # Publish tournament
        publish_response = self.client.post(f'/api/tournaments/{tournament_id}/publish/')
        self.assertEqual(publish_response.status_code, status.HTTP_200_OK)
        
        # Step 8: School Registers for Tournament
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        registration_data = {
            'team_name': 'E2E Test Eagles',
            'coach_name': 'Coach Smith',
            'coach_phone': '+250788555666',
            'players': [
                {
                    'athlete_id': athlete_ids[0],
                    'position': 'Forward'
                },
                {
                    'athlete_id': athlete_ids[1],
                    'position': 'Midfielder'
                }
            ]
        }
        
        team_registration_response = self.client.post(
            f'/api/tournaments/{tournament_id}/register/',
            registration_data,
            format='json'
        )
        self.assertEqual(team_registration_response.status_code, status.HTTP_201_CREATED)
        
        # Step 9: Verify Complete Workflow
        # Check school profile
        school_profile_response = self.client.get('/api/schools/me/')
        self.assertEqual(school_profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(school_profile_response.data['data']['name'], 'E2E Test School')
        
        # Check athletes
        athletes_response = self.client.get('/api/athletes/')
        self.assertEqual(athletes_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(athletes_response.data['data']), 2)
        
        # Check tournament registration
        tournament_registrations_response = self.client.get(f'/api/tournaments/{tournament_id}/registrations/')
        self.assertEqual(tournament_registrations_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(tournament_registrations_response.data['data']), 1)
        
        # Verify onboarding completion
        school = School.objects.get(school_id=school_id)
        self.assertEqual(school.onboarding_status, 'completed')


class CompleteGuardianWorkflowTest(APITestCase):
    """
    End-to-end test for complete guardian workflow.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create school and admin
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        self.guardian_registration_data = {
            'full_name': 'E2E Guardian Test',
            'email': 'e2eguardian@test.com',
            'phone': '+250788777666',
            'password': 'guardianpass123',
            'confirm_password': 'guardianpass123',
            'address': '789 Guardian Avenue',
            'city': 'Kigali',
            'province': 'Kigali',
            'district': 'Gasabo',
            'id_number': 'ID987654321'
        }
    
    def test_complete_guardian_workflow(self):
        """Test complete guardian workflow from registration to tournament consent."""
        
        # Step 1: Guardian Registration
        registration_response = self.client.post(
            '/api/guardian/auth/register/',
            self.guardian_registration_data,
            format='json'
        )
        self.assertEqual(registration_response.status_code, status.HTTP_201_CREATED)
        
        guardian_id = registration_response.data['data']['guardian_id']
        
        # Step 2: Guardian Login
        login_data = {
            'email': 'e2eguardian@test.com',
            'password': 'guardianpass123'
        }
        
        login_response = self.client.post('/api/guardian/auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        guardian_token = login_response.data['data']['access_token']
        
        # Step 3: Create Athlete (as school admin)
        school_token = RefreshToken.for_user(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(school_token.access_token)}')
        
        athlete_data = {
            'full_name': 'Guardian Child Athlete',
            'date_of_birth': (date.today() - timedelta(days=365 * 14)).isoformat(),
            'gender': 'Female',
            'school_id': self.school.school_id,
            'guardian_id': guardian_id,
            'guardian_name': 'E2E Guardian Test',
            'guardian_phone': '+250788777666',
            'guardian_email': 'e2eguardian@test.com',
            'address': '789 Guardian Avenue',
            'grade': '9',
            'primary_sport': 'Swimming'
        }
        
        athlete_response = self.client.post('/api/athletes/', athlete_data, format='json')
        self.assertEqual(athlete_response.status_code, status.HTTP_201_CREATED)
        
        athlete_id = athlete_response.data['data']['id']
        
        # Step 4: Guardian Views Their Athletes
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {guardian_token}')
        
        athletes_response = self.client.get('/api/guardian/athletes/')
        self.assertEqual(athletes_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(athletes_response.data['data']), 1)
        self.assertEqual(athletes_response.data['data'][0]['full_name'], 'Guardian Child Athlete')
        
        # Step 5: Guardian Updates Athlete Information
        athlete_update_data = {
            'emergency_contact': '+250788888999',
            'medical_notes': 'No known allergies',
            'dietary_restrictions': 'Vegetarian'
        }
        
        update_response = self.client.patch(
            f'/api/guardian/athletes/{athlete_id}/update/',
            athlete_update_data,
            format='json'
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        
        # Step 6: Guardian Uploads Documents
        documents_data = [
            {
                'document_type': 'guardian_id',
                'document_url': 'https://example.com/guardian_id.pdf',
                'description': 'Guardian national ID'
            },
            {
                'document_type': 'athlete_birth_certificate',
                'athlete_id': athlete_id,
                'document_url': 'https://example.com/birth_cert.pdf',
                'description': 'Athlete birth certificate'
            }
        ]
        
        for doc_data in documents_data:
            doc_response = self.client.post('/api/guardian/documents/upload/', doc_data, format='json')
            self.assertEqual(doc_response.status_code, status.HTTP_201_CREATED)
        
        # Step 7: Create Tournament and Request Consent
        super_admin = UserFactory(role='SuperAdmin')
        super_token = RefreshToken.for_user(super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(super_token.access_token)}')
        
        tournament = TournamentFactory(
            organizer=super_admin,
            sport='Swimming',
            status='published',
            visibility='public'
        )
        
        # Create consent request (normally done by school)
        from apps.guardians.models import ConsentRequest
        consent_request = ConsentRequest.objects.create(
            guardian_id=guardian_id,
            athlete_id=athlete_id,
            consent_type='tournament_participation',
            title='Swimming Tournament Participation',
            description='Consent for athlete to participate in swimming tournament',
            status='pending'
        )
        
        # Step 8: Guardian Provides Consent
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {guardian_token}')
        
        consent_response_data = {
            'decision': 'approved',
            'signature': 'Guardian Digital Signature',
            'notes': 'I consent to my child participating in this tournament',
            'conditions': 'Please ensure lifeguard is present at all times'
        }
        
        consent_response = self.client.post(
            f'/api/guardian/consent/{consent_request.id}/respond/',
            consent_response_data,
            format='json'
        )
        self.assertEqual(consent_response.status_code, status.HTTP_200_OK)
        
        # Step 9: Guardian Views Dashboard
        dashboard_response = self.client.get('/api/guardian/dashboard/')
        self.assertEqual(dashboard_response.status_code, status.HTTP_200_OK)
        
        dashboard_data = dashboard_response.data['data']
        self.assertEqual(dashboard_data['athletes_summary']['total_athletes'], 1)
        
        # Step 10: Verify Complete Workflow
        # Check consent was recorded
        consent_request.refresh_from_db()
        self.assertEqual(consent_request.status, 'approved')
        
        # Check athlete has updated information
        athlete = Athlete.objects.get(id=athlete_id)
        self.assertEqual(athlete.emergency_contact, '+250788888999')
        
        # Check guardian has uploaded documents
        documents_response = self.client.get('/api/guardian/documents/')
        self.assertEqual(documents_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(documents_response.data['data']), 2)


class CompleteTournamentLifecycleTest(TransactionTestCase):
    """
    End-to-end test for complete tournament lifecycle.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create users and schools
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin1 = UserFactory(role='SchoolAdmin')
        self.school_admin2 = UserFactory(role='SchoolAdmin')
        
        self.school1 = SchoolFactory(admin_user=self.school_admin1)
        self.school2 = SchoolFactory(admin_user=self.school_admin2)
        
        # Create athletes for both schools
        self.athletes_school1 = [AthleteFactory(school=self.school1) for _ in range(3)]
        self.athletes_school2 = [AthleteFactory(school=self.school2) for _ in range(3)]
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_complete_tournament_lifecycle(self):
        """Test complete tournament lifecycle from creation to completion."""
        
        # Step 1: Create Tournament (SuperAdmin)
        super_token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {super_token}')
        
        tournament_data = {
            'name': 'E2E Championship Tournament',
            'description': 'Complete end-to-end tournament test',
            'sport': 'Football',
            'tournament_type': 'knockout',
            'format': 'single_elimination',
            'location': 'Central Stadium',
            'start_date': (date.today() + timedelta(days=7)).isoformat(),
            'end_date': (date.today() + timedelta(days=9)).isoformat(),
            'max_teams': 4,
            'min_teams': 2,
            'entry_fee': 100000.00,
            'prize_pool': 500000.00,
            'age_group': 'U18',
            'gender': 'Mixed',
            'visibility': 'public',
            'registration_deadline': (date.today() + timedelta(days=5)).isoformat()
        }
        
        tournament_response = self.client.post('/api/tournaments/', tournament_data, format='json')
        self.assertEqual(tournament_response.status_code, status.HTTP_201_CREATED)
        
        tournament_id = tournament_response.data['data']['id']
        
        # Step 2: Publish Tournament
        publish_response = self.client.post(f'/api/tournaments/{tournament_id}/publish/')
        self.assertEqual(publish_response.status_code, status.HTTP_200_OK)
        
        # Step 3: School 1 Registers Team
        school1_token = self.get_jwt_token(self.school_admin1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {school1_token}')
        
        team1_data = {
            'team_name': 'School 1 Eagles',
            'coach_name': 'Coach Johnson',
            'coach_phone': '+250788111222',
            'players': [
                {
                    'athlete_id': self.athletes_school1[0].id,
                    'position': 'Forward'
                },
                {
                    'athlete_id': self.athletes_school1[1].id,
                    'position': 'Midfielder'
                },
                {
                    'athlete_id': self.athletes_school1[2].id,
                    'position': 'Defender'
                }
            ]
        }
        
        team1_response = self.client.post(
            f'/api/tournaments/{tournament_id}/register/',
            team1_data,
            format='json'
        )
        self.assertEqual(team1_response.status_code, status.HTTP_201_CREATED)
        
        # Step 4: School 2 Registers Team
        school2_token = self.get_jwt_token(self.school_admin2)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {school2_token}')
        
        team2_data = {
            'team_name': 'School 2 Lions',
            'coach_name': 'Coach Williams',
            'coach_phone': '+250788333444',
            'players': [
                {
                    'athlete_id': self.athletes_school2[0].id,
                    'position': 'Forward'
                },
                {
                    'athlete_id': self.athletes_school2[1].id,
                    'position': 'Midfielder'
                },
                {
                    'athlete_id': self.athletes_school2[2].id,
                    'position': 'Goalkeeper'
                }
            ]
        }
        
        team2_response = self.client.post(
            f'/api/tournaments/{tournament_id}/register/',
            team2_data,
            format='json'
        )
        self.assertEqual(team2_response.status_code, status.HTTP_201_CREATED)
        
        # Step 5: Start Tournament (SuperAdmin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {super_token}')
        
        start_response = self.client.post(f'/api/tournaments/{tournament_id}/start/')
        self.assertEqual(start_response.status_code, status.HTTP_200_OK)
        
        # Step 6: Generate Tournament Bracket
        bracket_response = self.client.post(f'/api/tournaments/{tournament_id}/generate-bracket/')
        self.assertEqual(bracket_response.status_code, status.HTTP_200_OK)
        
        # Step 7: Get Tournament Matches
        matches_response = self.client.get(f'/api/tournaments/{tournament_id}/matches/')
        self.assertEqual(matches_response.status_code, status.HTTP_200_OK)
        
        matches = matches_response.data['data']
        self.assertGreater(len(matches), 0)
        
        # Step 8: Record Match Results
        if matches:
            match_id = matches[0]['id']
            match_result_data = {
                'team1_score': 2,
                'team2_score': 1,
                'match_status': 'completed',
                'notes': 'Great match with excellent sportsmanship'
            }
            
            result_response = self.client.post(
                f'/api/tournaments/{tournament_id}/matches/{match_id}/result/',
                match_result_data,
                format='json'
            )
            self.assertEqual(result_response.status_code, status.HTTP_200_OK)
        
        # Step 9: Generate Tournament Report
        report_response = self.client.get(f'/api/tournaments/{tournament_id}/report/')
        self.assertEqual(report_response.status_code, status.HTTP_200_OK)
        
        report_data = report_response.data['data']
        self.assertIn('tournament_summary', report_data)
        self.assertIn('participating_teams', report_data)
        self.assertIn('match_results', report_data)
        
        # Step 10: Complete Tournament
        complete_response = self.client.post(f'/api/tournaments/{tournament_id}/complete/')
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        
        # Step 11: Verify Tournament Completion
        final_tournament_response = self.client.get(f'/api/tournaments/{tournament_id}/')
        self.assertEqual(final_tournament_response.status_code, status.HTTP_200_OK)
        self.assertEqual(final_tournament_response.data['data']['status'], 'completed')
        
        # Verify notifications were sent to participants
        notifications_count = NotificationLog.objects.filter(
            notification_type='email',
            subject__icontains='tournament'
        ).count()
        self.assertGreater(notifications_count, 0)


class SystemIntegrationStressTest(APITestCase):
    """
    Stress test for system integration with multiple concurrent operations.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        
        # Create multiple schools and users for stress testing
        self.schools = []
        self.school_admins = []
        
        for i in range(5):
            admin = UserFactory(role='SchoolAdmin')
            school = SchoolFactory(admin_user=admin)
            self.schools.append(school)
            self.school_admins.append(admin)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_concurrent_athlete_registrations(self):
        """Test concurrent athlete registrations across multiple schools."""
        import threading
        import time
        
        results = []
        
        def register_athletes_for_school(school, admin):
            """Register multiple athletes for a school."""
            client = APIClient()
            token = self.get_jwt_token(admin)
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            school_results = []
            
            for i in range(3):
                athlete_data = {
                    'full_name': f'Stress Test Athlete {i+1}',
                    'date_of_birth': (date.today() - timedelta(days=365 * 16)).isoformat(),
                    'gender': 'Male' if i % 2 == 0 else 'Female',
                    'school_id': school.school_id,
                    'address': f'Address {i+1}',
                    'grade': str(10 + (i % 3)),
                    'primary_sport': 'Football'
                }
                
                try:
                    response = client.post('/api/athletes/', athlete_data, format='json')
                    school_results.append(response.status_code)
                    time.sleep(0.1)  # Small delay to simulate real usage
                except Exception as e:
                    school_results.append(500)  # Error code
            
            results.extend(school_results)
        
        # Create threads for concurrent registrations
        threads = []
        for school, admin in zip(self.schools, self.school_admins):
            thread = threading.Thread(target=register_athletes_for_school, args=(school, admin))
            threads.append(thread)
        
        # Start all threads
        start_time = time.time()
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Verify results
        self.assertEqual(len(results), 15)  # 5 schools * 3 athletes each
        
        # Most registrations should succeed
        successful_registrations = sum(1 for status in results if status == 201)
        self.assertGreaterEqual(successful_registrations, 12)  # At least 80% success rate
        
        # Should complete in reasonable time
        self.assertLess(total_time, 30.0)  # Under 30 seconds
    
    def test_system_performance_under_load(self):
        """Test system performance under simulated load."""
        
        # Create test data
        tournament = TournamentFactory(
            organizer=self.super_admin,
            status='published',
            visibility='public'
        )
        
        athletes = []
        for school in self.schools:
            school_athletes = [AthleteFactory(school=school) for _ in range(2)]
            athletes.extend(school_athletes)
        
        # Test multiple concurrent operations
        operations_results = []
        
        def perform_operations():
            """Perform various operations concurrently."""
            client = APIClient()
            
            # Test different user types
            for admin in self.school_admins[:3]:  # Test with 3 admins
                token = self.get_jwt_token(admin)
                client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
                
                try:
                    # Get athletes list
                    athletes_response = client.get('/api/athletes/')
                    operations_results.append(('athletes_list', athletes_response.status_code))
                    
                    # Get school profile
                    profile_response = client.get('/api/schools/me/')
                    operations_results.append(('school_profile', profile_response.status_code))
                    
                    # Get tournaments
                    tournaments_response = client.get('/api/tournaments/')
                    operations_results.append(('tournaments_list', tournaments_response.status_code))
                    
                    # Get notifications
                    notifications_response = client.get('/api/notifications/')
                    operations_results.append(('notifications', notifications_response.status_code))
                    
                except Exception as e:
                    operations_results.append(('error', 500))
        
        # Run performance test
        start_time = time.time()
        
        import threading
        threads = []
        for _ in range(3):  # 3 concurrent threads
            thread = threading.Thread(target=perform_operations)
            threads.append(thread)
        
        for thread in threads:
            thread.start()
        
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Verify performance
        self.assertGreater(len(operations_results), 0)
        
        # Check success rate
        successful_operations = sum(1 for op, status in operations_results if status == 200)
        total_operations = len(operations_results)
        success_rate = successful_operations / total_operations if total_operations > 0 else 0
        
        self.assertGreaterEqual(success_rate, 0.8)  # At least 80% success rate
        self.assertLess(total_time, 20.0)  # Should complete within 20 seconds
    
    def test_data_consistency_across_operations(self):
        """Test data consistency across multiple related operations."""
        
        # Create initial data
        school = self.schools[0]
        admin = self.school_admins[0]
        token = self.get_jwt_token(admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Create athlete
        athlete_data = {
            'full_name': 'Consistency Test Athlete',
            'date_of_birth': (date.today() - timedelta(days=365 * 16)).isoformat(),
            'gender': 'Male',
            'school_id': school.school_id,
            'address': 'Test Address',
            'grade': '11',
            'primary_sport': 'Football'
        }
        
        athlete_response = self.client.post('/api/athletes/', athlete_data, format='json')
        self.assertEqual(athlete_response.status_code, status.HTTP_201_CREATED)
        
        athlete_id = athlete_response.data['data']['id']
        
        # Step 2: Update athlete multiple times
        updates = [
            {'grade': '12'},
            {'primary_sport': 'Basketball'},
            {'address': 'Updated Address'}
        ]
        
        for update_data in updates:
            update_response = self.client.patch(f'/api/athletes/{athlete_id}/', update_data, format='json')
            self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        
        # Step 3: Verify final state
        final_response = self.client.get(f'/api/athletes/{athlete_id}/')
        self.assertEqual(final_response.status_code, status.HTTP_200_OK)
        
        final_data = final_response.data['data']
        self.assertEqual(final_data['grade'], '12')
        self.assertEqual(final_data['primary_sport'], 'Basketball')
        self.assertEqual(final_data['address'], 'Updated Address')
        
        # Step 4: Verify consistency in database
        athlete = Athlete.objects.get(id=athlete_id)
        self.assertEqual(athlete.grade, '12')
        self.assertEqual(athlete.primary_sport, 'Basketball')
        self.assertEqual(athlete.address, 'Updated Address')
        
        # Step 5: Test related data consistency
        # Upload document
        doc_data = {
            'document_type': 'profile_photo',
            'document_url': 'https://example.com/photo.jpg'
        }
        
        doc_response = self.client.post(f'/api/athletes/{athlete_id}/documents/upload/', doc_data, format='json')
        self.assertEqual(doc_response.status_code, status.HTTP_200_OK)
        
        # Verify document is linked to correct athlete
        docs_response = self.client.get(f'/api/athletes/{athlete_id}/documents/')
        self.assertEqual(docs_response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_photo', docs_response.data['data'])
        
        # Step 6: Test soft delete consistency
        delete_response = self.client.delete(f'/api/athletes/{athlete_id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify athlete is soft deleted but data remains consistent
        athlete.refresh_from_db()
        self.assertFalse(athlete.is_active)
        self.assertEqual(athlete.grade, '12')  # Data should remain intact
        
        # Verify athlete doesn't appear in active lists
        list_response = self.client.get('/api/athletes/')
        athlete_ids = [a['id'] for a in list_response.data['data']]
        self.assertNotIn(athlete_id, athlete_ids)