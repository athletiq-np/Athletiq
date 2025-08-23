"""
Integration tests for guardian portal endpoints.
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
from apps.guardians.models import Guardian, GuardianAthleteRelationship
from apps.athletes.models import Athlete
from apps.schools.models import School
from apps.notifications.models import NotificationLog
from tests.factories import UserFactory, SchoolFactory, GuardianFactory, AthleteFactory

User = get_user_model()


class GuardianPortalIntegrationTest(APITestCase):
    """
    Integration tests for complete guardian portal workflows.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create school and admin
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        # Create guardian
        self.guardian = GuardianFactory()
        
        # Create athletes
        self.athlete1 = AthleteFactory(school=self.school, guardian=self.guardian)
        self.athlete2 = AthleteFactory(school=self.school, guardian=self.guardian)
        self.other_athlete = AthleteFactory(school=self.school)  # Not related to guardian
        
        # Guardian registration data
        self.registration_data = {
            'full_name': 'New Guardian Test',
            'email': 'newguardian@test.com',
            'phone': '+250788999777',
            'password': 'securepass123',
            'confirm_password': 'securepass123',
            'address': '123 Guardian Street',
            'city': 'Kigali',
            'province': 'Kigali',
            'district': 'Gasabo',
            'id_number': 'ID123456789',
            'relationship_type': 'Parent'
        }
    
    def get_guardian_jwt_token(self, guardian):
        """Get JWT token for guardian."""
        # This would use the guardian authentication system
        login_data = {
            'email': guardian.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/guardian/auth/login/', login_data, format='json')
        if response.status_code == 200:
            return response.data['data']['access_token']
        return None
    
    def test_complete_guardian_registration_workflow(self):
        """Test complete guardian registration and verification workflow."""
        # Step 1: Register new guardian
        response = self.client.post('/api/guardian/auth/register/', self.registration_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        guardian_id = response.data['data']['guardian_id']
        
        # Verify guardian was created
        guardian = Guardian.objects.get(guardian_id=guardian_id)
        self.assertEqual(guardian.full_name, 'New Guardian Test')
        self.assertEqual(guardian.verification_status, 'pending')
        
        # Step 2: Login with new guardian
        login_data = {
            'email': 'newguardian@test.com',
            'password': 'securepass123'
        }
        
        login_response = self.client.post('/api/guardian/auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertTrue(login_response.data['success'])
        
        token = login_response.data['data']['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 3: Get guardian profile
        profile_response = self.client.get('/api/guardian/profile/')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['data']['full_name'], 'New Guardian Test')
        
        # Step 4: Update profile
        update_data = {
            'phone': '+250788999888',
            'address': '456 Updated Street'
        }
        
        update_response = self.client.patch('/api/guardian/profile/update/', update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        
        # Step 5: Verify update
        verify_response = self.client.get('/api/guardian/profile/')
        self.assertEqual(verify_response.data['data']['phone'], '+250788999888')
    
    def test_guardian_athlete_management_workflow(self):
        """Test guardian athlete management workflow."""
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Get guardian's athletes
        athletes_response = self.client.get('/api/guardian/athletes/')
        self.assertEqual(athletes_response.status_code, status.HTTP_200_OK)
        self.assertTrue(athletes_response.data['success'])
        
        athlete_ids = [a['id'] for a in athletes_response.data['data']]
        self.assertIn(self.athlete1.id, athlete_ids)
        self.assertIn(self.athlete2.id, athlete_ids)
        self.assertNotIn(self.other_athlete.id, athlete_ids)  # Should not see unrelated athlete
        
        # Step 2: Get specific athlete details
        athlete_response = self.client.get(f'/api/guardian/athletes/{self.athlete1.id}/')
        self.assertEqual(athlete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(athlete_response.data['data']['full_name'], self.athlete1.full_name)
        
        # Step 3: Update athlete information (limited fields)
        update_data = {
            'emergency_contact': '+250788123456',
            'medical_notes': 'No known allergies'
        }
        
        update_response = self.client.patch(
            f'/api/guardian/athletes/{self.athlete1.id}/update/',
            update_data,
            format='json'
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        
        # Step 4: Claim new athlete
        unclaimed_athlete = AthleteFactory(school=self.school, guardian=None)
        
        claim_data = {
            'athlete_id': unclaimed_athlete.id,
            'relationship_type': 'Parent',
            'verification_documents': ['birth_certificate', 'id_copy']
        }
        
        claim_response = self.client.post('/api/guardian/athletes/claim/', claim_data, format='json')
        self.assertEqual(claim_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(claim_response.data['success'])
        
        # Step 5: Verify claim is pending
        pending_response = self.client.get('/api/guardian/athletes/pending-claims/')
        self.assertEqual(pending_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(pending_response.data['data']), 1)
    
    def test_guardian_document_management_workflow(self):
        """Test guardian document management workflow."""
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Get current documents
        docs_response = self.client.get('/api/guardian/documents/')
        self.assertEqual(docs_response.status_code, status.HTTP_200_OK)
        
        # Step 2: Upload guardian ID document
        id_doc_data = {
            'document_type': 'guardian_id',
            'document_url': 'https://example.com/guardian_id.pdf',
            'description': 'Guardian national ID'
        }
        
        upload_response = self.client.post('/api/guardian/documents/upload/', id_doc_data, format='json')
        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(upload_response.data['success'])
        
        # Step 3: Upload athlete birth certificate
        birth_cert_data = {
            'document_type': 'athlete_birth_certificate',
            'athlete_id': self.athlete1.id,
            'document_url': 'https://example.com/birth_cert.pdf',
            'description': 'Athlete birth certificate'
        }
        
        birth_cert_response = self.client.post(
            '/api/guardian/documents/upload/',
            birth_cert_data,
            format='json'
        )
        self.assertEqual(birth_cert_response.status_code, status.HTTP_201_CREATED)
        
        # Step 4: Get updated documents list
        updated_docs_response = self.client.get('/api/guardian/documents/')
        self.assertEqual(updated_docs_response.status_code, status.HTTP_200_OK)
        
        docs = updated_docs_response.data['data']
        doc_types = [doc['document_type'] for doc in docs]
        self.assertIn('guardian_id', doc_types)
        self.assertIn('athlete_birth_certificate', doc_types)
        
        # Step 5: Get document verification status
        verification_response = self.client.get('/api/guardian/documents/verification-status/')
        self.assertEqual(verification_response.status_code, status.HTTP_200_OK)
        
        verification_data = verification_response.data['data']
        self.assertIn('overall_status', verification_data)
        self.assertIn('required_documents', verification_data)
        self.assertIn('uploaded_documents', verification_data)
    
    def test_guardian_notifications_workflow(self):
        """Test guardian notifications workflow."""
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create test notifications
        notifications = [
            NotificationLog.objects.create(
                notification_type='email',
                recipient_email=self.guardian.email,
                recipient_name=self.guardian.full_name,
                subject='Tournament Registration Open',
                content='New tournament registration is now open',
                status='sent'
            ),
            NotificationLog.objects.create(
                notification_type='email',
                recipient_email=self.guardian.email,
                recipient_name=self.guardian.full_name,
                subject='Document Verification Required',
                content='Please upload missing documents',
                status='sent'
            )
        ]
        
        # Step 1: Get notifications
        notifications_response = self.client.get('/api/guardian/notifications/')
        self.assertEqual(notifications_response.status_code, status.HTTP_200_OK)
        self.assertTrue(notifications_response.data['success'])
        self.assertEqual(len(notifications_response.data['data']), 2)
        
        # Step 2: Mark notification as read
        notification_id = notifications[0].id
        read_response = self.client.post(f'/api/guardian/notifications/{notification_id}/mark-read/')
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertTrue(read_response.data['success'])
        
        # Step 3: Get unread notifications count
        unread_response = self.client.get('/api/guardian/notifications/unread-count/')
        self.assertEqual(unread_response.status_code, status.HTTP_200_OK)
        self.assertEqual(unread_response.data['data']['count'], 1)
        
        # Step 4: Mark all as read
        mark_all_response = self.client.post('/api/guardian/notifications/mark-all-read/')
        self.assertEqual(mark_all_response.status_code, status.HTTP_200_OK)
        
        # Step 5: Verify all marked as read
        final_unread_response = self.client.get('/api/guardian/notifications/unread-count/')
        self.assertEqual(final_unread_response.data['data']['count'], 0)
    
    def test_guardian_communication_workflow(self):
        """Test guardian communication workflow."""
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Send message to school
        message_data = {
            'recipient_type': 'school',
            'recipient_id': self.school.school_id,
            'subject': 'Question about tournament',
            'message': 'I have a question about the upcoming tournament registration.',
            'priority': 'normal'
        }
        
        send_response = self.client.post('/api/guardian/messages/send/', message_data, format='json')
        self.assertEqual(send_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(send_response.data['success'])
        
        # Step 2: Get sent messages
        sent_response = self.client.get('/api/guardian/messages/sent/')
        self.assertEqual(sent_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(sent_response.data['data']), 1)
        
        # Step 3: Get message thread
        message_id = send_response.data['data']['message_id']
        thread_response = self.client.get(f'/api/guardian/messages/{message_id}/thread/')
        self.assertEqual(thread_response.status_code, status.HTTP_200_OK)
        
        # Step 4: Submit feedback
        feedback_data = {
            'category': 'system_feedback',
            'subject': 'Portal Improvement Suggestion',
            'message': 'The portal could use better mobile responsiveness.',
            'rating': 4
        }
        
        feedback_response = self.client.post('/api/guardian/feedback/', feedback_data, format='json')
        self.assertEqual(feedback_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(feedback_response.data['success'])


class GuardianConsentManagementIntegrationTest(APITestCase):
    """
    Integration tests for guardian consent management.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.guardian = GuardianFactory()
        self.athlete = AthleteFactory(school=self.school, guardian=self.guardian)
    
    def get_guardian_jwt_token(self, guardian):
        """Get JWT token for guardian."""
        login_data = {
            'email': guardian.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/guardian/auth/login/', login_data, format='json')
        if response.status_code == 200:
            return response.data['data']['access_token']
        return None
    
    def test_consent_management_workflow(self):
        """Test complete consent management workflow."""
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Get pending consent requests
        pending_response = self.client.get('/api/guardian/consent/pending/')
        self.assertEqual(pending_response.status_code, status.HTTP_200_OK)
        
        # Step 2: Create consent request (normally done by school)
        consent_data = {
            'athlete_id': self.athlete.id,
            'consent_type': 'tournament_participation',
            'title': 'Football Tournament Participation',
            'description': 'Consent for athlete to participate in inter-school football tournament',
            'required_by': (date.today() + timedelta(days=7)).isoformat(),
            'documents': ['tournament_rules.pdf', 'medical_form.pdf']
        }
        
        # This would normally be created by school admin, but we'll simulate it
        from apps.guardians.models import ConsentRequest
        consent_request = ConsentRequest.objects.create(
            guardian=self.guardian,
            athlete=self.athlete,
            consent_type='tournament_participation',
            title='Football Tournament Participation',
            description='Consent for athlete to participate in inter-school football tournament',
            status='pending'
        )
        
        # Step 3: Get updated pending consents
        updated_pending_response = self.client.get('/api/guardian/consent/pending/')
        self.assertEqual(updated_pending_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(updated_pending_response.data['data']), 1)
        
        # Step 4: Review consent details
        consent_id = consent_request.id
        details_response = self.client.get(f'/api/guardian/consent/{consent_id}/')
        self.assertEqual(details_response.status_code, status.HTTP_200_OK)
        self.assertEqual(details_response.data['data']['title'], 'Football Tournament Participation')
        
        # Step 5: Provide consent
        consent_response_data = {
            'decision': 'approved',
            'signature': 'Guardian Digital Signature',
            'notes': 'I consent to my child participating in this tournament',
            'conditions': 'Please ensure proper medical support is available'
        }
        
        provide_consent_response = self.client.post(
            f'/api/guardian/consent/{consent_id}/respond/',
            consent_response_data,
            format='json'
        )
        self.assertEqual(provide_consent_response.status_code, status.HTTP_200_OK)
        self.assertTrue(provide_consent_response.data['success'])
        
        # Step 6: Verify consent was recorded
        consent_request.refresh_from_db()
        self.assertEqual(consent_request.status, 'approved')
        
        # Step 7: Get consent history
        history_response = self.client.get('/api/guardian/consent/history/')
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(history_response.data['data']), 1)


class GuardianDashboardIntegrationTest(APITestCase):
    """
    Integration tests for guardian dashboard functionality.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.guardian = GuardianFactory()
        
        # Create multiple athletes for comprehensive dashboard
        self.athletes = [
            AthleteFactory(school=self.school, guardian=self.guardian, primary_sport='Football'),
            AthleteFactory(school=self.school, guardian=self.guardian, primary_sport='Basketball')
        ]
    
    def get_guardian_jwt_token(self, guardian):
        """Get JWT token for guardian."""
        login_data = {
            'email': guardian.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/guardian/auth/login/', login_data, format='json')
        if response.status_code == 200:
            return response.data['data']['access_token']
        return None
    
    def test_guardian_dashboard_overview(self):
        """Test guardian dashboard overview functionality."""
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get dashboard overview
        dashboard_response = self.client.get('/api/guardian/dashboard/')
        self.assertEqual(dashboard_response.status_code, status.HTTP_200_OK)
        self.assertTrue(dashboard_response.data['success'])
        
        dashboard_data = dashboard_response.data['data']
        
        # Verify dashboard components
        self.assertIn('athletes_summary', dashboard_data)
        self.assertIn('recent_activities', dashboard_data)
        self.assertIn('upcoming_events', dashboard_data)
        self.assertIn('pending_actions', dashboard_data)
        self.assertIn('notifications_summary', dashboard_data)
        
        # Verify athletes summary
        athletes_summary = dashboard_data['athletes_summary']
        self.assertEqual(athletes_summary['total_athletes'], 2)
        self.assertIn('sports_breakdown', athletes_summary)
        
        # Verify sports breakdown
        sports_breakdown = athletes_summary['sports_breakdown']
        self.assertEqual(sports_breakdown['Football'], 1)
        self.assertEqual(sports_breakdown['Basketball'], 1)
    
    def test_guardian_activity_timeline(self):
        """Test guardian activity timeline."""
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get activity timeline
        timeline_response = self.client.get('/api/guardian/dashboard/timeline/')
        self.assertEqual(timeline_response.status_code, status.HTTP_200_OK)
        self.assertTrue(timeline_response.data['success'])
        
        timeline_data = timeline_response.data['data']
        self.assertIn('activities', timeline_data)
        self.assertIn('pagination', timeline_data)
        
        # Test with date filter
        filtered_response = self.client.get(
            f'/api/guardian/dashboard/timeline/?from_date={(date.today() - timedelta(days=7)).isoformat()}'
        )
        self.assertEqual(filtered_response.status_code, status.HTTP_200_OK)
    
    def test_guardian_quick_actions(self):
        """Test guardian quick actions functionality."""
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get available quick actions
        actions_response = self.client.get('/api/guardian/dashboard/quick-actions/')
        self.assertEqual(actions_response.status_code, status.HTTP_200_OK)
        
        actions_data = actions_response.data['data']
        self.assertIn('available_actions', actions_data)
        
        # Verify common quick actions are available
        action_types = [action['type'] for action in actions_data['available_actions']]
        expected_actions = ['update_profile', 'upload_document', 'view_notifications', 'contact_school']
        
        for expected_action in expected_actions:
            self.assertIn(expected_action, action_types)


class GuardianErrorHandlingIntegrationTest(APITestCase):
    """
    Integration tests for guardian endpoint error handling.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.guardian = GuardianFactory()
    
    def test_guardian_authentication_errors(self):
        """Test guardian authentication error scenarios."""
        # Test invalid credentials
        invalid_login = {
            'email': self.guardian.email,
            'password': 'wrongpassword'
        }
        
        response = self.client.post('/api/guardian/auth/login/', invalid_login, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
        
        # Test non-existent guardian
        nonexistent_login = {
            'email': 'nonexistent@test.com',
            'password': 'password123'
        }
        
        response = self.client.post('/api/guardian/auth/login/', nonexistent_login, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
    
    def test_guardian_registration_validation_errors(self):
        """Test guardian registration validation errors."""
        # Test missing required fields
        incomplete_data = {
            'full_name': 'Incomplete Guardian',
            'email': 'incomplete@test.com'
        }
        
        response = self.client.post('/api/guardian/auth/register/', incomplete_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
        
        # Test duplicate email
        duplicate_data = {
            'full_name': 'Duplicate Guardian',
            'email': self.guardian.email,  # Existing email
            'phone': '+250788999888',
            'password': 'password123',
            'confirm_password': 'password123'
        }
        
        response = self.client.post('/api/guardian/auth/register/', duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_guardian_unauthorized_access(self):
        """Test unauthorized access to guardian endpoints."""
        # Test accessing guardian endpoints without authentication
        endpoints = [
            '/api/guardian/profile/',
            '/api/guardian/athletes/',
            '/api/guardian/documents/',
            '/api/guardian/notifications/',
            '/api/guardian/dashboard/'
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_guardian_athlete_access_restrictions(self):
        """Test that guardians can only access their own athletes."""
        # Create another guardian and athlete
        other_guardian = GuardianFactory()
        other_athlete = AthleteFactory(guardian=other_guardian)
        
        # Login as first guardian
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Try to access other guardian's athlete
        response = self.client.get(f'/api/guardian/athletes/{other_athlete.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def get_guardian_jwt_token(self, guardian):
        """Get JWT token for guardian."""
        login_data = {
            'email': guardian.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/guardian/auth/login/', login_data, format='json')
        if response.status_code == 200:
            return response.data['data']['access_token']
        return None


class GuardianPerformanceIntegrationTest(APITestCase):
    """
    Integration tests for guardian endpoint performance.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.guardian = GuardianFactory()
        
        # Create multiple athletes and related data for performance testing
        self.school = SchoolFactory()
        self.athletes = [
            AthleteFactory(school=self.school, guardian=self.guardian)
            for _ in range(10)
        ]
    
    def get_guardian_jwt_token(self, guardian):
        """Get JWT token for guardian."""
        login_data = {
            'email': guardian.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/guardian/auth/login/', login_data, format='json')
        if response.status_code == 200:
            return response.data['data']['access_token']
        return None
    
    def test_guardian_dashboard_performance(self):
        """Test guardian dashboard performance with multiple athletes."""
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/guardian/dashboard/')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Dashboard should load quickly even with multiple athletes
        self.assertLess(response_time, 2.0)  # Under 2 seconds
    
    def test_guardian_athletes_list_performance(self):
        """Test guardian athletes list performance."""
        token = self.get_guardian_jwt_token(self.guardian)
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/guardian/athletes/')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 10)
        
        # Athletes list should load quickly
        self.assertLess(response_time, 1.5)  # Under 1.5 seconds