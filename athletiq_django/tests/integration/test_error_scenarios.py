"""
Integration tests for comprehensive error handling and edge case scenarios.
"""
import json
import time
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.schools.models import School
from apps.athletes.models import Athlete
from apps.tournaments.models import Tournament
from apps.guardians.models import Guardian
from apps.documents.models import Document
from tests.factories import UserFactory, SchoolFactory, AthleteFactory, GuardianFactory, TournamentFactory

User = get_user_model()


class AuthenticationErrorScenariosTest(APITestCase):
    """
    Integration tests for authentication error scenarios and edge cases.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.user)
    
    def test_malformed_authentication_requests(self):
        """Test handling of malformed authentication requests."""
        # Test with malformed JSON
        malformed_requests = [
            '{"email": "test@test.com", "password": "pass"',  # Missing closing brace
            '{"email": "test@test.com" "password": "pass"}',  # Missing comma
            'not json at all',
            '{"email": null, "password": "pass"}',  # Null email
            '{"email": "", "password": ""}',  # Empty strings
        ]
        
        for malformed_json in malformed_requests:
            response = self.client.post(
                '/api/auth/login/',
                malformed_json,
                content_type='application/json'
            )
            
            # Should handle gracefully
            self.assertIn(response.status_code, [400, 401])
            if response.status_code == 400:
                self.assertFalse(response.data.get('success', True))
    
    def test_sql_injection_attempts_in_auth(self):
        """Test protection against SQL injection in authentication."""
        sql_injection_attempts = [
            "admin@test.com'; DROP TABLE users; --",
            "admin@test.com' OR '1'='1",
            "admin@test.com' UNION SELECT * FROM users --",
            "'; DELETE FROM users WHERE '1'='1'; --",
        ]
        
        for malicious_email in sql_injection_attempts:
            login_data = {
                'email': malicious_email,
                'password': 'password123'
            }
            
            response = self.client.post('/api/auth/login/', login_data, format='json')
            
            # Should reject safely without crashing
            self.assertEqual(response.status_code, 401)
            self.assertFalse(response.data['success'])
            
            # Verify no data corruption occurred
            user_count = User.objects.count()
            self.assertGreater(user_count, 0, "SQL injection may have affected database")
    
    def test_xss_attempts_in_auth(self):
        """Test protection against XSS in authentication fields."""
        xss_payloads = [
            '<script>alert("xss")</script>',
            '<img src="x" onerror="alert(1)">',
            'javascript:alert("xss")',
            '<svg onload="alert(1)">',
        ]
        
        for payload in xss_payloads:
            login_data = {
                'email': f'{payload}@test.com',
                'password': payload
            }
            
            response = self.client.post('/api/auth/login/', login_data, format='json')
            
            # Should handle safely
            self.assertIn(response.status_code, [400, 401])
            self.assertFalse(response.data.get('success', True))
            
            # Response should not contain unescaped payload
            response_content = json.dumps(response.data)
            self.assertNotIn('<script>', response_content)
            self.assertNotIn('javascript:', response_content)
    
    def test_token_manipulation_attempts(self):
        """Test handling of manipulated JWT tokens."""
        # Get valid token
        refresh = RefreshToken.for_user(self.user)
        valid_token = str(refresh.access_token)
        
        # Test various token manipulations
        manipulated_tokens = [
            valid_token[:-5] + 'XXXXX',  # Modified signature
            valid_token.replace('.', 'X'),  # Corrupted structure
            'Bearer ' + valid_token,  # Double Bearer prefix
            valid_token + '.extra.part',  # Extra parts
            'invalid.token.here',  # Completely invalid
            '',  # Empty token
        ]
        
        for token in manipulated_tokens:
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            response = self.client.get('/api/schools/me/')
            
            # Should reject invalid tokens
            self.assertEqual(response.status_code, 401)
            self.assertFalse(response.data.get('success', True))
    
    def test_concurrent_login_attempts(self):
        """Test handling of concurrent login attempts."""
        import threading
        
        login_data = {
            'email': self.user.email,
            'password': 'testpass123'
        }
        
        results = []
        
        def attempt_login():
            client = APIClient()
            response = client.post('/api/auth/login/', login_data, format='json')
            results.append(response.status_code)
        
        # Create multiple concurrent login attempts
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=attempt_login)
            threads.append(thread)
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # All should succeed (or some might be rate limited)
        successful_logins = sum(1 for status in results if status == 200)
        rate_limited = sum(1 for status in results if status == 429)
        
        # Most should succeed, some might be rate limited
        self.assertGreaterEqual(successful_logins, 5)
        self.assertLessEqual(rate_limited, 5)
    
    def test_expired_token_handling(self):
        """Test handling of expired tokens."""
        # Create token and manually expire it
        refresh = RefreshToken.for_user(self.user)
        access_token = refresh.access_token
        
        # Set expiration to past (simulate expired token)
        access_token.set_exp(lifetime=timedelta(seconds=-1))
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access_token)}')
        
        response = self.client.get('/api/schools/me/')
        
        # Should reject expired token
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.data.get('success', True))


class DataValidationErrorScenariosTest(APITestCase):
    """
    Integration tests for data validation error scenarios.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.guardian = GuardianFactory()
        
        # Get authentication token
        refresh = RefreshToken.for_user(self.school_admin)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_athlete_creation_validation_errors(self):
        """Test comprehensive athlete creation validation."""
        # Test various invalid data scenarios
        invalid_data_scenarios = [
            {
                'data': {},  # Empty data
                'description': 'Empty data'
            },
            {
                'data': {
                    'full_name': '',  # Empty name
                    'date_of_birth': '2005-01-01',
                    'gender': 'Male'
                },
                'description': 'Empty name'
            },
            {
                'data': {
                    'full_name': 'Test Athlete',
                    'date_of_birth': 'invalid-date',  # Invalid date format
                    'gender': 'Male'
                },
                'description': 'Invalid date format'
            },
            {
                'data': {
                    'full_name': 'Test Athlete',
                    'date_of_birth': '2030-01-01',  # Future date
                    'gender': 'Male'
                },
                'description': 'Future birth date'
            },
            {
                'data': {
                    'full_name': 'Test Athlete',
                    'date_of_birth': '2005-01-01',
                    'gender': 'InvalidGender'  # Invalid gender
                },
                'description': 'Invalid gender'
            },
            {
                'data': {
                    'full_name': 'A' * 300,  # Name too long
                    'date_of_birth': '2005-01-01',
                    'gender': 'Male'
                },
                'description': 'Name too long'
            },
            {
                'data': {
                    'full_name': 'Test Athlete',
                    'date_of_birth': '2005-01-01',
                    'gender': 'Male',
                    'school_id': 99999  # Non-existent school
                },
                'description': 'Non-existent school'
            }
        ]
        
        for scenario in invalid_data_scenarios:
            response = self.client.post('/api/athletes/', scenario['data'], format='json')
            
            # Should return validation error
            self.assertEqual(response.status_code, 400, 
                           f"Expected 400 for {scenario['description']}")
            self.assertFalse(response.data.get('success', True))
            self.assertIn('errors', response.data)
    
    def test_tournament_creation_validation_errors(self):
        """Test tournament creation validation errors."""
        super_admin = UserFactory(role='SuperAdmin')
        super_token = str(RefreshToken.for_user(super_admin).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {super_token}')
        
        invalid_tournament_scenarios = [
            {
                'data': {
                    'name': '',  # Empty name
                    'sport': 'Football'
                },
                'description': 'Empty tournament name'
            },
            {
                'data': {
                    'name': 'Test Tournament',
                    'sport': 'Football',
                    'start_date': '2024-12-31',
                    'end_date': '2024-12-01'  # End before start
                },
                'description': 'End date before start date'
            },
            {
                'data': {
                    'name': 'Test Tournament',
                    'sport': 'Football',
                    'max_teams': -1  # Negative max teams
                },
                'description': 'Negative max teams'
            },
            {
                'data': {
                    'name': 'Test Tournament',
                    'sport': 'Football',
                    'min_teams': 10,
                    'max_teams': 5  # Min greater than max
                },
                'description': 'Min teams greater than max teams'
            },
            {
                'data': {
                    'name': 'Test Tournament',
                    'sport': 'Football',
                    'entry_fee': -100  # Negative fee
                },
                'description': 'Negative entry fee'
            }
        ]
        
        for scenario in invalid_tournament_scenarios:
            response = self.client.post('/api/tournaments/', scenario['data'], format='json')
            
            self.assertEqual(response.status_code, 400,
                           f"Expected 400 for {scenario['description']}")
            self.assertFalse(response.data.get('success', True))
    
    def test_bulk_operation_validation_errors(self):
        """Test bulk operation validation errors."""
        # Test bulk athlete update with invalid data
        invalid_bulk_scenarios = [
            {
                'data': {
                    'updates': []  # Empty updates
                },
                'description': 'Empty bulk updates'
            },
            {
                'data': {
                    'updates': [
                        {
                            'athlete_id': 99999,  # Non-existent athlete
                            'grade': '11'
                        }
                    ]
                },
                'description': 'Non-existent athlete in bulk update'
            },
            {
                'data': {
                    'updates': [
                        {
                            'athlete_id': 'invalid',  # Invalid ID type
                            'grade': '11'
                        }
                    ]
                },
                'description': 'Invalid athlete ID type'
            },
            {
                'data': {
                    'updates': [
                        {
                            'athlete_id': AthleteFactory(school=self.school).id,
                            'grade': 'InvalidGrade'  # Invalid grade
                        }
                    ]
                },
                'description': 'Invalid grade in bulk update'
            }
        ]
        
        for scenario in invalid_bulk_scenarios:
            response = self.client.post('/api/athletes/bulk-update/', scenario['data'], format='json')
            
            self.assertEqual(response.status_code, 400,
                           f"Expected 400 for {scenario['description']}")
            self.assertFalse(response.data.get('success', True))
    
    def test_file_upload_validation_errors(self):
        """Test file upload validation errors."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        athlete = AthleteFactory(school=self.school)
        
        # Test various invalid file scenarios
        invalid_file_scenarios = [
            {
                'file_data': None,
                'description': 'No file provided'
            },
            {
                'file_data': SimpleUploadedFile(
                    "test.txt",
                    b"This is a text file",
                    content_type="text/plain"
                ),
                'description': 'Invalid file type'
            },
            {
                'file_data': SimpleUploadedFile(
                    "large_file.jpg",
                    b"x" * (10 * 1024 * 1024 + 1),  # > 10MB
                    content_type="image/jpeg"
                ),
                'description': 'File too large'
            },
            {
                'file_data': SimpleUploadedFile(
                    "",  # Empty filename
                    b"image data",
                    content_type="image/jpeg"
                ),
                'description': 'Empty filename'
            }
        ]
        
        for scenario in invalid_file_scenarios:
            upload_data = {
                'document_type': 'profile_photo',
                'entity_type': 'athlete',
                'entity_id': athlete.id
            }
            
            if scenario['file_data']:
                upload_data['file'] = scenario['file_data']
            
            response = self.client.post('/api/documents/upload/', upload_data, format='multipart')
            
            self.assertEqual(response.status_code, 400,
                           f"Expected 400 for {scenario['description']}")
            self.assertFalse(response.data.get('success', True))


class PermissionErrorScenariosTest(APITestCase):
    """
    Integration tests for permission and authorization error scenarios.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create users with different roles
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin1 = UserFactory(role='SchoolAdmin')
        self.school_admin2 = UserFactory(role='SchoolAdmin')
        self.coach = UserFactory(role='Coach')
        
        # Create schools
        self.school1 = SchoolFactory(admin_user=self.school_admin1)
        self.school2 = SchoolFactory(admin_user=self.school_admin2)
        
        # Create athletes for each school
        self.athlete1 = AthleteFactory(school=self.school1)
        self.athlete2 = AthleteFactory(school=self.school2)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_cross_school_data_access_prevention(self):
        """Test that schools cannot access other schools' data."""
        # School admin 1 tries to access school 2's data
        token1 = self.get_jwt_token(self.school_admin1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        
        # Try to access other school's athlete
        response = self.client.get(f'/api/athletes/{self.athlete2.id}/')
        self.assertEqual(response.status_code, 404)  # Should not find it
        
        # Try to update other school's athlete
        update_data = {'grade': '12'}
        response = self.client.patch(f'/api/athletes/{self.athlete2.id}/', update_data, format='json')
        self.assertEqual(response.status_code, 404)
        
        # Try to delete other school's athlete
        response = self.client.delete(f'/api/athletes/{self.athlete2.id}/')
        self.assertEqual(response.status_code, 404)
    
    def test_role_based_access_restrictions(self):
        """Test role-based access restrictions."""
        # Coach should not access admin-only endpoints
        coach_token = self.get_jwt_token(self.coach)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {coach_token}')
        
        # Try to access school list (SuperAdmin only)
        response = self.client.get('/api/schools/')
        self.assertEqual(response.status_code, 403)
        
        # Try to create tournament (SuperAdmin only)
        tournament_data = {
            'name': 'Unauthorized Tournament',
            'sport': 'Football'
        }
        response = self.client.post('/api/tournaments/', tournament_data, format='json')
        self.assertEqual(response.status_code, 403)
        
        # SchoolAdmin should not access SuperAdmin endpoints
        school_token = self.get_jwt_token(self.school_admin1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {school_token}')
        
        response = self.client.get('/api/schools/')
        self.assertEqual(response.status_code, 403)
    
    def test_unauthorized_bulk_operations(self):
        """Test unauthorized bulk operations."""
        # School admin tries bulk operations on other school's data
        token1 = self.get_jwt_token(self.school_admin1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        
        # Try bulk update with other school's athletes
        bulk_data = {
            'updates': [
                {
                    'athlete_id': self.athlete2.id,  # Other school's athlete
                    'grade': '12'
                }
            ]
        }
        
        response = self.client.post('/api/athletes/bulk-update/', bulk_data, format='json')
        self.assertEqual(response.status_code, 400)  # Should fail validation
        
        # Verify no changes were made
        self.athlete2.refresh_from_db()
        self.assertNotEqual(self.athlete2.grade, '12')
    
    def test_guardian_access_restrictions(self):
        """Test guardian access restrictions."""
        guardian = GuardianFactory()
        
        # Guardian tries to access admin endpoints
        guardian_login_data = {
            'email': guardian.email,
            'password': 'testpass123'
        }
        
        login_response = self.client.post('/api/guardian/auth/login/', guardian_login_data, format='json')
        if login_response.status_code == 200:
            guardian_token = login_response.data['data']['access_token']
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {guardian_token}')
            
            # Try to access admin endpoints
            admin_endpoints = [
                '/api/schools/',
                '/api/athletes/',  # Admin athlete list
                '/api/tournaments/analytics/',
            ]
            
            for endpoint in admin_endpoints:
                response = self.client.get(endpoint)
                self.assertIn(response.status_code, [401, 403, 404])
    
    def test_token_privilege_escalation_prevention(self):
        """Test prevention of token privilege escalation."""
        # Get token for regular school admin
        token = self.get_jwt_token(self.school_admin1)
        
        # Try to modify token to gain SuperAdmin privileges
        # (This is more of a conceptual test - real attacks would be more sophisticated)
        
        # Try accessing SuperAdmin endpoints with school admin token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        superadmin_endpoints = [
            '/api/schools/',
            '/api/tournaments/analytics/',
            '/api/system/health/',
        ]
        
        for endpoint in superadmin_endpoints:
            response = self.client.get(endpoint)
            self.assertIn(response.status_code, [403, 404])  # Should be denied


class ConcurrencyErrorScenariosTest(APITestCase):
    """
    Integration tests for concurrency-related error scenarios.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.athlete = AthleteFactory(school=self.school)
        
        # Get authentication token
        refresh = RefreshToken.for_user(self.school_admin)
        self.token = str(refresh.access_token)
    
    def test_concurrent_athlete_updates(self):
        """Test concurrent updates to the same athlete."""
        import threading
        
        results = []
        
        def update_athlete(update_data, thread_id):
            """Update athlete concurrently."""
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
            
            response = client.patch(f'/api/athletes/{self.athlete.id}/', update_data, format='json')
            results.append({
                'thread_id': thread_id,
                'status_code': response.status_code,
                'success': response.status_code == 200
            })
        
        # Create concurrent update threads
        threads = []
        for i in range(5):
            update_data = {'grade': f'Grade {i}'}
            thread = threading.Thread(target=update_athlete, args=(update_data, i))
            threads.append(thread)
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # At least some updates should succeed
        successful_updates = sum(1 for r in results if r['success'])
        self.assertGreater(successful_updates, 0)
        
        # Verify athlete still exists and is in valid state
        self.athlete.refresh_from_db()
        self.assertIsNotNone(self.athlete.grade)
    
    def test_concurrent_tournament_registrations(self):
        """Test concurrent registrations for the same tournament."""
        import threading
        
        # Create tournament with limited capacity
        super_admin = UserFactory(role='SuperAdmin')
        tournament = TournamentFactory(
            organizer=super_admin,
            status='published',
            max_teams=2,  # Limited capacity
            visibility='public'
        )
        
        # Create multiple schools for concurrent registration
        schools = [SchoolFactory() for _ in range(5)]
        results = []
        
        def register_for_tournament(school, thread_id):
            """Register school for tournament concurrently."""
            school_admin = school.admin_user
            token = str(RefreshToken.for_user(school_admin).access_token)
            
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            # Create athletes for the school
            athletes = [AthleteFactory(school=school) for _ in range(3)]
            
            registration_data = {
                'team_name': f'School {thread_id} Team',
                'coach_name': f'Coach {thread_id}',
                'coach_phone': f'+25078800000{thread_id}',
                'players': [
                    {
                        'athlete_id': athlete.id,
                        'position': f'Position {i}'
                    }
                    for i, athlete in enumerate(athletes)
                ]
            }
            
            response = client.post(
                f'/api/tournaments/{tournament.id}/register/',
                registration_data,
                format='json'
            )
            
            results.append({
                'thread_id': thread_id,
                'status_code': response.status_code,
                'success': response.status_code == 201
            })
        
        # Create concurrent registration threads
        threads = []
        for i, school in enumerate(schools):
            thread = threading.Thread(target=register_for_tournament, args=(school, i))
            threads.append(thread)
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # Only max_teams should succeed due to capacity limit
        successful_registrations = sum(1 for r in results if r['success'])
        self.assertLessEqual(successful_registrations, tournament.max_teams)
        
        # Some should be rejected due to capacity
        rejected_registrations = sum(1 for r in results if not r['success'])
        self.assertGreater(rejected_registrations, 0)
    
    def test_race_condition_in_bulk_operations(self):
        """Test race conditions in bulk operations."""
        import threading
        
        # Create multiple athletes
        athletes = [AthleteFactory(school=self.school) for _ in range(10)]
        results = []
        
        def perform_bulk_operation(operation_type, thread_id):
            """Perform bulk operation concurrently."""
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
            
            if operation_type == 'update':
                bulk_data = {
                    'updates': [
                        {
                            'athlete_id': athlete.id,
                            'grade': f'Thread{thread_id}'
                        }
                        for athlete in athletes[:5]  # Update first 5 athletes
                    ]
                }
                response = client.post('/api/athletes/bulk-update/', bulk_data, format='json')
            
            elif operation_type == 'verify':
                bulk_data = {
                    'athlete_ids': [athlete.id for athlete in athletes[5:]],  # Verify last 5
                    'verification_status': 'verified',
                    'notes': f'Verified by thread {thread_id}'
                }
                response = client.post('/api/athletes/bulk-verify/', bulk_data, format='json')
            
            results.append({
                'thread_id': thread_id,
                'operation': operation_type,
                'status_code': response.status_code,
                'success': response.status_code == 200
            })
        
        # Create concurrent bulk operation threads
        threads = []
        for i in range(3):
            # Mix of update and verify operations
            operation = 'update' if i % 2 == 0 else 'verify'
            thread = threading.Thread(target=perform_bulk_operation, args=(operation, i))
            threads.append(thread)
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # Most operations should succeed
        successful_operations = sum(1 for r in results if r['success'])
        self.assertGreater(successful_operations, 0)
        
        # Verify data integrity
        for athlete in athletes:
            athlete.refresh_from_db()
            self.assertIsNotNone(athlete.grade)  # Should have valid grade


class SystemLimitErrorScenariosTest(APITestCase):
    """
    Integration tests for system limit and resource exhaustion scenarios.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        # Get authentication token
        refresh = RefreshToken.for_user(self.school_admin)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_large_payload_handling(self):
        """Test handling of extremely large request payloads."""
        # Test with very large athlete name
        large_name = 'A' * 10000  # 10KB name
        
        athlete_data = {
            'full_name': large_name,
            'date_of_birth': '2005-01-01',
            'gender': 'Male',
            'school_id': self.school.school_id,
            'address': 'Test Address',
            'grade': '10'
        }
        
        response = self.client.post('/api/athletes/', athlete_data, format='json')
        
        # Should handle gracefully (either reject or truncate)
        self.assertIn(response.status_code, [400, 413])  # Bad Request or Payload Too Large
        if response.status_code == 400:
            self.assertFalse(response.data.get('success', True))
    
    def test_excessive_pagination_requests(self):
        """Test handling of excessive pagination parameters."""
        # Test with very large page size
        response = self.client.get('/api/athletes/?page_size=10000')
        
        # Should either limit page size or reject
        self.assertIn(response.status_code, [200, 400])
        
        if response.status_code == 200:
            # Should limit results to reasonable number
            self.assertLessEqual(len(response.data['data']), 100)
        
        # Test with very large page number
        response = self.client.get('/api/athletes/?page=999999')
        
        # Should handle gracefully
        self.assertIn(response.status_code, [200, 404])
    
    def test_deep_nested_json_handling(self):
        """Test handling of deeply nested JSON structures."""
        # Create deeply nested structure
        nested_data = {'level': 0}
        current = nested_data
        
        for i in range(100):  # 100 levels deep
            current['nested'] = {'level': i + 1}
            current = current['nested']
        
        athlete_data = {
            'full_name': 'Test Athlete',
            'date_of_birth': '2005-01-01',
            'gender': 'Male',
            'metadata': nested_data  # Deeply nested metadata
        }
        
        response = self.client.post('/api/athletes/', athlete_data, format='json')
        
        # Should handle gracefully (might reject due to depth)
        self.assertIn(response.status_code, [200, 201, 400])
    
    def test_rapid_request_rate_handling(self):
        """Test handling of rapid request rates."""
        # Make many rapid requests
        responses = []
        
        for i in range(50):
            response = self.client.get('/api/athletes/')
            responses.append(response.status_code)
            
            # No delay - test rapid fire requests
        
        # Should handle most requests, some might be rate limited
        successful_requests = sum(1 for status in responses if status == 200)
        rate_limited_requests = sum(1 for status in responses if status == 429)
        
        # Most should succeed or be rate limited (not crash)
        handled_requests = successful_requests + rate_limited_requests
        self.assertGreaterEqual(handled_requests, 40)  # At least 80% handled properly
    
    def test_memory_exhaustion_protection(self):
        """Test protection against memory exhaustion attacks."""
        # Test with large bulk operation
        large_bulk_data = {
            'updates': [
                {
                    'athlete_id': i,  # Many non-existent IDs
                    'grade': '11'
                }
                for i in range(10000)  # Very large bulk operation
            ]
        }
        
        response = self.client.post('/api/athletes/bulk-update/', large_bulk_data, format='json')
        
        # Should either process efficiently or reject
        self.assertIn(response.status_code, [200, 400, 413])
        
        if response.status_code == 400:
            self.assertFalse(response.data.get('success', True))