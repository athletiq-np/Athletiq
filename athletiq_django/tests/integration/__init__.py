"""
Integration tests package for Athletiq Django backend.

This package contains comprehensive integration tests that verify the complete
functionality of API endpoints, including:

- Authentication and authorization workflows
- School management workflows  
- Athlete management workflows
- Tournament management workflows
- Guardian portal workflows
- Document management workflows
- Notification system workflows
- Google services integration workflows
- End-to-end business workflows
- Performance and error handling tests
- Security and vulnerability testing

Test Structure:
- test_authentication_endpoints.py: Authentication and authorization tests
- test_school_endpoints.py: School management integration tests
- test_athlete_endpoints.py: Athlete management integration tests
- test_tournament_endpoints.py: Tournament management integration tests
- test_guardian_endpoints.py: Guardian portal integration tests
- test_document_endpoints.py: Document management integration tests
- test_notification_endpoints.py: Notification system integration tests
- test_google_services_endpoints.py: Google services integration tests
- test_end_to_end_workflows.py: Complete business workflow tests
- test_api_performance.py: Performance and load testing
- test_error_scenarios.py: Error handling and edge cases
- test_security_integration.py: Security and vulnerability tests
- test_comprehensive_suite.py: Complete test suite validation

Each test module follows the pattern:
1. Setup test data using factories
2. Execute API calls in realistic workflows
3. Verify responses and data consistency
4. Test error handling and edge cases
5. Validate performance requirements
6. Test security compliance

Usage:
    # Run all integration tests
    python manage.py test tests.integration
    
    # Run specific test module
    python manage.py test tests.integration.test_authentication_endpoints
    
    # Run specific test class
    python manage.py test tests.integration.test_school_endpoints.SchoolManagementIntegrationTest
    
    # Run with custom test runner for enhanced reporting
    python tests/integration/test_runner.py
    
    # Run comprehensive test suite
    python tests/integration/test_comprehensive_suite.py
    
    # Run with coverage
    coverage run --source='.' manage.py test tests.integration
    coverage report
"""

# Import test runner and base classes for easy access
from .test_runner import IntegrationTestRunner, IntegrationTestCase

__all__ = [
    'IntegrationTestRunner',
    'IntegrationTestCase'
]