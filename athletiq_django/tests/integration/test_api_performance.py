"""
Integration tests for API endpoint performance and load testing.
"""
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.schools.models import School
from apps.athletes.models import Athlete
from apps.tournaments.models import Tournament
from apps.guardians.models import Guardian
from tests.factories import UserFactory, SchoolFactory, AthleteFactory, GuardianFactory, TournamentFactory

User = get_user_model()


class APIPerformanceIntegrationTest(APITestCase):
    """
    Integration tests for API endpoint performance under various load conditions.
    """
    
    def setUp(self):
        """Set up test data for performance testing."""
        self.client = APIClient()
        
        # Create users with different roles
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.coach = UserFactory(role='Coach')
        
        # Create school and related data
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        # Create test data for performance testing
        self.create_performance_test_data()
    
    def create_performance_test_data(self):
        """Create substantial test data for performance testing."""
        # Create multiple athletes
        self.athletes = [AthleteFactory(school=self.school) for _ in range(50)]
        
        # Create multiple tournaments
        self.tournaments = [
            TournamentFactory(organizer=self.super_admin, status='published', visibility='public')
            for _ in range(20)
        ]
        
        # Create guardians
        self.guardians = [GuardianFactory() for _ in range(25)]
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def measure_endpoint_performance(self, method, url, data=None, token=None, expected_status=200):
        """Measure endpoint performance and return response time."""
        client = APIClient()
        if token:
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        
        if method.upper() == 'GET':
            response = client.get(url)
        elif method.upper() == 'POST':
            response = client.post(url, data, format='json')
        elif method.upper() == 'PATCH':
            response = client.patch(url, data, format='json')
        elif method.upper() == 'DELETE':
            response = client.delete(url)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        end_time = time.time()
        response_time = end_time - start_time
        
        # Verify response status
        self.assertEqual(response.status_code, expected_status, 
                        f"Unexpected status code for {method} {url}")
        
        return response_time, response
    
    def test_authentication_endpoint_performance(self):
        """Test authentication endpoint performance."""
        login_data = {
            'email': self.school_admin.email,
            'password': 'testpass123'
        }
        
        # Test single login performance
        response_time, response = self.measure_endpoint_performance(
            'POST', '/api/auth/login/', login_data
        )
        
        # Authentication should be fast
        self.assertLess(response_time, 2.0, "Login endpoint too slow")
        self.assertTrue(response.data['success'])
        
        # Test token refresh performance
        refresh_token = response.data['data']['refresh_token']
        refresh_data = {'refresh': refresh_token}
        
        refresh_time, refresh_response = self.measure_endpoint_performance(
            'POST', '/api/auth/refresh/', refresh_data
        )
        
        self.assertLess(refresh_time, 1.0, "Token refresh too slow")
        self.assertTrue(refresh_response.data['success'])
    
    def test_athlete_list_performance_with_pagination(self):
        """Test athlete list endpoint performance with pagination."""
        token = self.get_jwt_token(self.school_admin)
        
        # Test different page sizes
        page_sizes = [10, 25, 50]
        
        for page_size in page_sizes:
            url = f'/api/athletes/?page=1&page_size={page_size}'
            
            response_time, response = self.measure_endpoint_performance(
                'GET', url, token=token
            )
            
            # Response time should scale reasonably with page size
            max_time = 0.5 + (page_size * 0.01)  # Base time + per-item overhead
            self.assertLess(response_time, max_time, 
                           f"Athlete list too slow for page_size={page_size}")
            
            # Verify correct number of results
            self.assertLessEqual(len(response.data['data']), page_size)
    
    def test_athlete_search_performance(self):
        """Test athlete search endpoint performance."""
        token = self.get_jwt_token(self.school_admin)
        
        # Test different search scenarios
        search_queries = [
            'John',  # Common name
            'Football',  # Sport search
            'Grade 10',  # Grade search
            'Male',  # Gender search
        ]
        
        for query in search_queries:
            url = f'/api/athletes/search/?q={query}'
            
            response_time, response = self.measure_endpoint_performance(
                'GET', url, token=token
            )
            
            # Search should be fast even with large dataset
            self.assertLess(response_time, 3.0, f"Search too slow for query: {query}")
            self.assertTrue(response.data['success'])
    
    def test_tournament_list_performance_with_filters(self):
        """Test tournament list performance with various filters."""
        token = self.get_jwt_token(self.school_admin)
        
        # Test different filter combinations
        filter_combinations = [
            '?sport=Football',
            '?age_group=U16',
            '?gender=Male',
            '?sport=Football&age_group=U16',
            '?sport=Football&gender=Male&status=published',
        ]
        
        for filters in filter_combinations:
            url = f'/api/tournaments/{filters}'
            
            response_time, response = self.measure_endpoint_performance(
                'GET', url, token=token
            )
            
            # Filtered queries should be reasonably fast
            self.assertLess(response_time, 2.0, f"Tournament filter too slow: {filters}")
            self.assertTrue(response.data['success'])
    
    def test_bulk_operations_performance(self):
        """Test bulk operations performance."""
        token = self.get_jwt_token(self.school_admin)
        
        # Test bulk athlete update
        athlete_ids = [athlete.id for athlete in self.athletes[:10]]
        bulk_update_data = {
            'updates': [
                {
                    'athlete_id': athlete_id,
                    'grade': '11'
                }
                for athlete_id in athlete_ids
            ]
        }
        
        response_time, response = self.measure_endpoint_performance(
            'POST', '/api/athletes/bulk-update/', bulk_update_data, token=token
        )
        
        # Bulk operations should be efficient
        self.assertLess(response_time, 5.0, "Bulk update too slow")
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['success_count'], 10)
    
    def test_concurrent_api_requests(self):
        """Test API performance under concurrent load."""
        token = self.get_jwt_token(self.school_admin)
        
        def make_concurrent_request(endpoint):
            """Make a single API request."""
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            start_time = time.time()
            response = client.get(endpoint)
            end_time = time.time()
            
            return {
                'endpoint': endpoint,
                'status_code': response.status_code,
                'response_time': end_time - start_time,
                'success': response.status_code == 200
            }
        
        # Test endpoints to hit concurrently
        endpoints = [
            '/api/athletes/',
            '/api/tournaments/',
            '/api/schools/me/',
            '/api/athletes/statistics/',
            '/api/tournaments/analytics/',
        ]
        
        # Make concurrent requests
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Submit multiple requests for each endpoint
            futures = []
            for _ in range(5):  # 5 requests per endpoint
                for endpoint in endpoints:
                    future = executor.submit(make_concurrent_request, endpoint)
                    futures.append(future)
            
            # Collect results
            results = []
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
        
        # Analyze results
        total_requests = len(results)
        successful_requests = sum(1 for r in results if r['success'])
        average_response_time = sum(r['response_time'] for r in results) / total_requests
        max_response_time = max(r['response_time'] for r in results)
        
        # Verify performance under load
        success_rate = successful_requests / total_requests
        self.assertGreaterEqual(success_rate, 0.95, "Success rate too low under concurrent load")
        self.assertLess(average_response_time, 3.0, "Average response time too high under load")
        self.assertLess(max_response_time, 10.0, "Maximum response time too high under load")
        
        print(f"\nConcurrent Load Test Results:")
        print(f"Total requests: {total_requests}")
        print(f"Successful requests: {successful_requests}")
        print(f"Success rate: {success_rate:.2%}")
        print(f"Average response time: {average_response_time:.2f}s")
        print(f"Maximum response time: {max_response_time:.2f}s")
    
    def test_database_query_optimization(self):
        """Test that endpoints use optimized database queries."""
        from django.db import connection
        from django.test.utils import override_settings
        
        token = self.get_jwt_token(self.school_admin)
        
        # Test endpoints that should use query optimization
        test_cases = [
            {
                'endpoint': '/api/athletes/',
                'max_queries': 10,  # Should use select_related/prefetch_related
                'description': 'Athlete list with relationships'
            },
            {
                'endpoint': '/api/tournaments/',
                'max_queries': 8,
                'description': 'Tournament list with organizer info'
            },
            {
                'endpoint': '/api/schools/me/athletes/',
                'max_queries': 5,
                'description': 'School athletes with optimized queries'
            }
        ]
        
        for test_case in test_cases:
            # Clear previous queries
            connection.queries.clear()
            
            # Make request
            response_time, response = self.measure_endpoint_performance(
                'GET', test_case['endpoint'], token=token
            )
            
            # Check query count
            query_count = len(connection.queries)
            
            self.assertLessEqual(
                query_count, 
                test_case['max_queries'],
                f"{test_case['description']}: Too many queries ({query_count})"
            )
            
            print(f"\n{test_case['description']}:")
            print(f"  Response time: {response_time:.2f}s")
            print(f"  Database queries: {query_count}")
    
    def test_memory_usage_under_load(self):
        """Test memory usage under sustained load."""
        import psutil
        import os
        
        token = self.get_jwt_token(self.school_admin)
        process = psutil.Process(os.getpid())
        
        # Get initial memory usage
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Make many requests to test for memory leaks
        for i in range(100):
            response_time, response = self.measure_endpoint_performance(
                'GET', '/api/athletes/', token=token
            )
            
            # Verify response is still working
            self.assertTrue(response.data['success'])
            
            # Check memory every 25 requests
            if i % 25 == 0:
                current_memory = process.memory_info().rss / 1024 / 1024  # MB
                memory_increase = current_memory - initial_memory
                
                # Memory shouldn't grow excessively
                self.assertLess(
                    memory_increase, 
                    50,  # 50MB increase limit
                    f"Memory usage increased too much: {memory_increase:.1f}MB"
                )
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        total_increase = final_memory - initial_memory
        
        print(f"\nMemory Usage Test:")
        print(f"Initial memory: {initial_memory:.1f}MB")
        print(f"Final memory: {final_memory:.1f}MB")
        print(f"Total increase: {total_increase:.1f}MB")
    
    def test_rate_limiting_behavior(self):
        """Test API behavior under rate limiting conditions."""
        token = self.get_jwt_token(self.school_admin)
        
        # Make rapid requests to trigger rate limiting
        responses = []
        for i in range(20):
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            start_time = time.time()
            response = client.get('/api/athletes/')
            end_time = time.time()
            
            responses.append({
                'status_code': response.status_code,
                'response_time': end_time - start_time,
                'request_number': i + 1
            })
            
            # Small delay to avoid overwhelming the system
            time.sleep(0.1)
        
        # Analyze rate limiting behavior
        status_codes = [r['status_code'] for r in responses]
        successful_requests = sum(1 for code in status_codes if code == 200)
        rate_limited_requests = sum(1 for code in status_codes if code == 429)
        
        # Most requests should succeed, some might be rate limited
        self.assertGreaterEqual(successful_requests, 15, "Too many requests blocked")
        
        print(f"\nRate Limiting Test:")
        print(f"Successful requests: {successful_requests}/20")
        print(f"Rate limited requests: {rate_limited_requests}/20")
        print(f"Other status codes: {20 - successful_requests - rate_limited_requests}/20")
    
    def test_error_handling_performance(self):
        """Test that error handling doesn't significantly impact performance."""
        token = self.get_jwt_token(self.school_admin)
        
        # Test various error scenarios
        error_scenarios = [
            {
                'method': 'GET',
                'url': '/api/athletes/99999/',  # Not found
                'expected_status': 404,
                'description': '404 Not Found'
            },
            {
                'method': 'POST',
                'url': '/api/athletes/',
                'data': {'invalid': 'data'},  # Validation error
                'expected_status': 400,
                'description': '400 Validation Error'
            },
            {
                'method': 'GET',
                'url': '/api/tournaments/99999/',  # Not found
                'expected_status': 404,
                'description': '404 Tournament Not Found'
            }
        ]
        
        for scenario in error_scenarios:
            response_time, response = self.measure_endpoint_performance(
                scenario['method'],
                scenario['url'],
                data=scenario.get('data'),
                token=token,
                expected_status=scenario['expected_status']
            )
            
            # Error responses should still be fast
            self.assertLess(
                response_time, 
                2.0, 
                f"Error handling too slow for {scenario['description']}"
            )
            
            # Should return proper error format
            self.assertFalse(response.data.get('success', True))
            
            print(f"{scenario['description']}: {response_time:.2f}s")


class APIStressIntegrationTest(APITestCase):
    """
    Stress tests for API endpoints under extreme load conditions.
    """
    
    def setUp(self):
        """Set up test data for stress testing."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        # Create substantial test data
        self.create_stress_test_data()
    
    def create_stress_test_data(self):
        """Create large amounts of test data for stress testing."""
        # Create many athletes (simulate large school)
        self.athletes = [AthleteFactory(school=self.school) for _ in range(200)]
        
        # Create many tournaments
        self.tournaments = [
            TournamentFactory(organizer=self.super_admin, status='published')
            for _ in range(50)
        ]
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_large_dataset_pagination_performance(self):
        """Test pagination performance with large datasets."""
        token = self.get_jwt_token(self.school_admin)
        
        # Test different page sizes with large dataset
        page_sizes = [10, 25, 50, 100]
        
        for page_size in page_sizes:
            start_time = time.time()
            
            response = self.client.get(
                f'/api/athletes/?page=1&page_size={page_size}',
                HTTP_AUTHORIZATION=f'Bearer {token}'
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.data['success'])
            
            # Even large pages should be reasonably fast
            max_time = 1.0 + (page_size * 0.005)  # Scale with page size
            self.assertLess(
                response_time, 
                max_time,
                f"Large dataset pagination too slow for page_size={page_size}"
            )
            
            print(f"Page size {page_size}: {response_time:.2f}s")
    
    def test_complex_search_performance(self):
        """Test complex search queries with large datasets."""
        token = self.get_jwt_token(self.school_admin)
        
        # Complex search scenarios
        search_scenarios = [
            {
                'url': '/api/athletes/search/?q=John&gender=Male&grade=10',
                'description': 'Multi-field search'
            },
            {
                'url': '/api/tournaments/?sport=Football&age_group=U16&status=published',
                'description': 'Tournament multi-filter'
            },
            {
                'url': '/api/athletes/?primary_sport=Football&verification_status=verified',
                'description': 'Athlete status filter'
            }
        ]
        
        for scenario in search_scenarios:
            start_time = time.time()
            
            response = self.client.get(
                scenario['url'],
                HTTP_AUTHORIZATION=f'Bearer {token}'
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.data['success'])
            
            # Complex searches should complete within reasonable time
            self.assertLess(
                response_time, 
                5.0,
                f"Complex search too slow: {scenario['description']}"
            )
            
            print(f"{scenario['description']}: {response_time:.2f}s")
    
    def test_concurrent_write_operations(self):
        """Test concurrent write operations for data consistency."""
        token = self.get_jwt_token(self.school_admin)
        
        def create_athlete(athlete_number):
            """Create an athlete concurrently."""
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            athlete_data = {
                'full_name': f'Concurrent Athlete {athlete_number}',
                'date_of_birth': '2005-01-01',
                'gender': 'Male',
                'school_id': self.school.school_id,
                'address': f'Address {athlete_number}',
                'grade': '10',
                'primary_sport': 'Football'
            }
            
            start_time = time.time()
            response = client.post('/api/athletes/', athlete_data, format='json')
            end_time = time.time()
            
            return {
                'athlete_number': athlete_number,
                'status_code': response.status_code,
                'response_time': end_time - start_time,
                'success': response.status_code == 201
            }
        
        # Create athletes concurrently
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [
                executor.submit(create_athlete, i) 
                for i in range(20)
            ]
            
            results = [future.result() for future in as_completed(futures)]
        
        # Analyze concurrent write results
        successful_creates = sum(1 for r in results if r['success'])
        average_time = sum(r['response_time'] for r in results) / len(results)
        
        # Most concurrent writes should succeed
        self.assertGreaterEqual(
            successful_creates, 
            18,  # Allow for some failures due to concurrency
            "Too many concurrent write failures"
        )
        
        # Concurrent writes should still be reasonably fast
        self.assertLess(
            average_time, 
            3.0,
            "Concurrent writes too slow"
        )
        
        print(f"\nConcurrent Write Test:")
        print(f"Successful creates: {successful_creates}/20")
        print(f"Average response time: {average_time:.2f}s")
    
    def test_system_stability_under_sustained_load(self):
        """Test system stability under sustained load over time."""
        token = self.get_jwt_token(self.school_admin)
        
        # Run sustained load for a period
        duration_seconds = 30  # 30 second test
        start_time = time.time()
        
        request_count = 0
        successful_requests = 0
        response_times = []
        
        while time.time() - start_time < duration_seconds:
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            request_start = time.time()
            response = client.get('/api/athletes/?page_size=10')
            request_end = time.time()
            
            request_count += 1
            response_time = request_end - request_start
            response_times.append(response_time)
            
            if response.status_code == 200:
                successful_requests += 1
            
            # Small delay to simulate realistic usage
            time.sleep(0.1)
        
        # Analyze sustained load results
        success_rate = successful_requests / request_count if request_count > 0 else 0
        average_response_time = sum(response_times) / len(response_times) if response_times else 0
        max_response_time = max(response_times) if response_times else 0
        
        # System should remain stable under sustained load
        self.assertGreaterEqual(success_rate, 0.95, "Success rate degraded under sustained load")
        self.assertLess(average_response_time, 2.0, "Average response time degraded")
        self.assertLess(max_response_time, 10.0, "Maximum response time too high")
        
        print(f"\nSustained Load Test ({duration_seconds}s):")
        print(f"Total requests: {request_count}")
        print(f"Success rate: {success_rate:.2%}")
        print(f"Average response time: {average_response_time:.2f}s")
        print(f"Maximum response time: {max_response_time:.2f}s")