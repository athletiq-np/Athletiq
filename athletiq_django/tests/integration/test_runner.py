"""
Custom test runner for integration tests with performance monitoring.
"""
import time
import sys
from django.test.runner import DiscoverRunner
from django.test import TestCase
from django.db import connection
from django.core.management.color import no_style


class IntegrationTestRunner(DiscoverRunner):
    """
    Custom test runner for integration tests with enhanced reporting.
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.test_times = {}
        self.slow_tests = []
        self.failed_tests = []
        
    def setup_test_environment(self, **kwargs):
        """Set up test environment with performance monitoring."""
        super().setup_test_environment(**kwargs)
        print("Setting up integration test environment...")
        
        # Configure test database for performance
        if hasattr(connection, 'vendor') and connection.vendor == 'postgresql':
            with connection.cursor() as cursor:
                # Optimize for test performance
                cursor.execute("SET synchronous_commit = OFF;")
                cursor.execute("SET fsync = OFF;")
                cursor.execute("SET full_page_writes = OFF;")
    
    def run_tests(self, test_labels, **kwargs):
        """Run tests with performance monitoring."""
        print("Starting integration tests...")
        start_time = time.time()
        
        result = super().run_tests(test_labels, **kwargs)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        self.print_performance_report(total_time)
        
        return result
    
    def run_suite(self, suite, **kwargs):
        """Run test suite with individual test timing."""
        # Wrap each test to measure execution time
        for test_group in suite:
            if hasattr(test_group, '_tests'):
                for test in test_group._tests:
                    if hasattr(test, '_testMethodName'):
                        original_method = getattr(test, test._testMethodName)
                        wrapped_method = self.wrap_test_method(original_method, test)
                        setattr(test, test._testMethodName, wrapped_method)
        
        return super().run_suite(suite, **kwargs)
    
    def wrap_test_method(self, method, test_instance):
        """Wrap test method to measure execution time."""
        def wrapped_method():
            test_name = f"{test_instance.__class__.__name__}.{method.__name__}"
            start_time = time.time()
            
            try:
                result = method()
                end_time = time.time()
                execution_time = end_time - start_time
                
                self.test_times[test_name] = execution_time
                
                # Track slow tests (> 5 seconds)
                if execution_time > 5.0:
                    self.slow_tests.append((test_name, execution_time))
                
                return result
                
            except Exception as e:
                end_time = time.time()
                execution_time = end_time - start_time
                self.test_times[test_name] = execution_time
                self.failed_tests.append((test_name, str(e)))
                raise
        
        return wrapped_method
    
    def print_performance_report(self, total_time):
        """Print performance report after test execution."""
        print("\n" + "="*80)
        print("INTEGRATION TEST PERFORMANCE REPORT")
        print("="*80)
        
        print(f"Total execution time: {total_time:.2f} seconds")
        print(f"Total tests executed: {len(self.test_times)}")
        
        if self.test_times:
            avg_time = sum(self.test_times.values()) / len(self.test_times)
            print(f"Average test time: {avg_time:.2f} seconds")
            
            # Fastest tests
            fastest_tests = sorted(self.test_times.items(), key=lambda x: x[1])[:5]
            print(f"\nFastest tests:")
            for test_name, exec_time in fastest_tests:
                print(f"  {test_name}: {exec_time:.2f}s")
            
            # Slowest tests
            slowest_tests = sorted(self.test_times.items(), key=lambda x: x[1], reverse=True)[:5]
            print(f"\nSlowest tests:")
            for test_name, exec_time in slowest_tests:
                print(f"  {test_name}: {exec_time:.2f}s")
        
        # Slow tests warning
        if self.slow_tests:
            print(f"\nSLOW TESTS (>5s): {len(self.slow_tests)}")
            for test_name, exec_time in self.slow_tests:
                print(f"  ⚠️  {test_name}: {exec_time:.2f}s")
        
        # Failed tests
        if self.failed_tests:
            print(f"\nFAILED TESTS: {len(self.failed_tests)}")
            for test_name, error in self.failed_tests:
                print(f"  ❌ {test_name}: {error}")
        
        # Database query analysis
        if hasattr(connection, 'queries'):
            query_count = len(connection.queries)
            print(f"\nDatabase queries executed: {query_count}")
            
            if query_count > 0:
                query_times = [float(q['time']) for q in connection.queries if 'time' in q]
                if query_times:
                    total_query_time = sum(query_times)
                    avg_query_time = total_query_time / len(query_times)
                    print(f"Total query time: {total_query_time:.2f}s")
                    print(f"Average query time: {avg_query_time:.4f}s")
        
        print("="*80)


class IntegrationTestCase(TestCase):
    """
    Base test case for integration tests with common utilities.
    """
    
    @classmethod
    def setUpClass(cls):
        """Set up class-level test data."""
        super().setUpClass()
        cls.start_time = time.time()
    
    @classmethod
    def tearDownClass(cls):
        """Clean up class-level test data and report timing."""
        super().tearDownClass()
        end_time = time.time()
        execution_time = end_time - cls.start_time
        print(f"\n{cls.__name__} completed in {execution_time:.2f} seconds")
    
    def setUp(self):
        """Set up individual test."""
        super().setUp()
        self.test_start_time = time.time()
        
        # Reset query count for this test
        if hasattr(connection, 'queries'):
            connection.queries.clear()
    
    def tearDown(self):
        """Clean up individual test."""
        super().tearDown()
        
        # Report test performance if it was slow
        execution_time = time.time() - self.test_start_time
        if execution_time > 3.0:  # Report tests slower than 3 seconds
            test_name = f"{self.__class__.__name__}.{self._testMethodName}"
            print(f"\n⚠️  Slow test: {test_name} took {execution_time:.2f}s")
            
            if hasattr(connection, 'queries'):
                query_count = len(connection.queries)
                if query_count > 50:  # Report tests with many queries
                    print(f"   Database queries: {query_count}")
    
    def assertResponseTime(self, response_time, max_time, message=None):
        """Assert that response time is within acceptable limits."""
        if message is None:
            message = f"Response time {response_time:.2f}s exceeded maximum {max_time}s"
        
        self.assertLessEqual(response_time, max_time, message)
    
    def assertQueryCount(self, max_queries, message=None):
        """Assert that database query count is within acceptable limits."""
        if not hasattr(connection, 'queries'):
            return
        
        query_count = len(connection.queries)
        
        if message is None:
            message = f"Query count {query_count} exceeded maximum {max_queries}"
        
        self.assertLessEqual(query_count, max_queries, message)
    
    def measure_response_time(self, func, *args, **kwargs):
        """Measure response time of a function call."""
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        
        return result, end_time - start_time
    
    def print_query_analysis(self):
        """Print analysis of database queries for debugging."""
        if not hasattr(connection, 'queries'):
            print("Query logging not enabled")
            return
        
        queries = connection.queries
        print(f"\nQuery Analysis ({len(queries)} queries):")
        
        if not queries:
            print("No queries executed")
            return
        
        # Group queries by type
        query_types = {}
        for query in queries:
            sql = query['sql'].strip().upper()
            query_type = sql.split()[0] if sql else 'UNKNOWN'
            query_types[query_type] = query_types.get(query_type, 0) + 1
        
        print("Query types:")
        for query_type, count in sorted(query_types.items()):
            print(f"  {query_type}: {count}")
        
        # Show slowest queries
        if 'time' in queries[0]:
            slow_queries = sorted(queries, key=lambda q: float(q.get('time', 0)), reverse=True)[:3]
            print("\nSlowest queries:")
            for i, query in enumerate(slow_queries, 1):
                time_taken = query.get('time', 'N/A')
                sql = query['sql'][:100] + '...' if len(query['sql']) > 100 else query['sql']
                print(f"  {i}. {time_taken}s: {sql}")


def run_integration_tests():
    """
    Convenience function to run integration tests with custom runner.
    """
    import django
    from django.conf import settings
    from django.test.utils import get_runner
    
    django.setup()
    
    # Use custom test runner
    test_runner_class = IntegrationTestRunner
    test_runner = test_runner_class(verbosity=2, interactive=False)
    
    # Run integration tests
    failures = test_runner.run_tests(['tests.integration'])
    
    if failures:
        sys.exit(1)


if __name__ == '__main__':
    run_integration_tests()