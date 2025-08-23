"""
Integration tests for notification system endpoints.
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
from apps.notifications.models import NotificationLog, NotificationTemplate, NotificationPreference
from apps.schools.models import School
from apps.athletes.models import Athlete
from apps.guardians.models import Guardian
from tests.factories import UserFactory, SchoolFactory, AthleteFactory, GuardianFactory

User = get_user_model()


class NotificationSystemIntegrationTest(APITestCase):
    """
    Integration tests for complete notification system workflows.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create users
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        
        # Create school and related entities
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.athlete = AthleteFactory(school=self.school)
        self.guardian = GuardianFactory()
        
        # Create test notifications
        self.create_test_notifications()
    
    def create_test_notifications(self):
        """Create test notifications for different scenarios."""
        # School admin notifications
        NotificationLog.objects.create(
            notification_type='email',
            recipient_email=self.school_admin.email,
            recipient_name=self.school_admin.full_name,
            subject='New Tournament Available',
            content='A new football tournament is now open for registration',
            status='sent'
        )
        
        NotificationLog.objects.create(
            notification_type='email',
            recipient_email=self.school_admin.email,
            recipient_name=self.school_admin.full_name,
            subject='Document Verification Required',
            content='Some athlete documents require verification',
            status='sent'
        )
        
        # Guardian notifications
        NotificationLog.objects.create(
            notification_type='email',
            recipient_email=self.guardian.email,
            recipient_name=self.guardian.full_name,
            subject='Athlete Registration Update',
            content='Your child\'s registration has been approved',
            status='sent'
        )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
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
    
    def test_complete_notification_workflow(self):
        """Test complete notification workflow from creation to delivery."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Create notification template
        template_data = {
            'name': 'Tournament Registration Reminder',
            'template_type': 'tournament_reminder',
            'subject_template': 'Tournament Registration Deadline Approaching',
            'message_template': 'Dear {{recipient_name}}, the registration deadline for {{tournament_name}} is {{deadline_date}}.',
            'email_template': '<h1>Tournament Reminder</h1><p>Dear {{recipient_name}},</p><p>The registration deadline for {{tournament_name}} is {{deadline_date}}.</p>',
            'sms_template': 'Tournament {{tournament_name}} registration deadline: {{deadline_date}}',
            'is_active': True
        }
        
        template_response = self.client.post('/api/notifications/templates/', template_data, format='json')
        self.assertEqual(template_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(template_response.data['success'])
        
        template_id = template_response.data['data']['id']
        
        # Step 2: Send notification using template
        notification_data = {
            'template_id': template_id,
            'recipients': [
                {
                    'type': 'user',
                    'id': self.school_admin.user_id
                }
            ],
            'context_data': {
                'recipient_name': self.school_admin.full_name,
                'tournament_name': 'Inter-School Football Championship',
                'deadline_date': '2024-12-15'
            },
            'delivery_methods': ['in_app', 'email'],
            'priority': 'normal',
            'scheduled_time': None  # Send immediately
        }
        
        send_response = self.client.post('/api/notifications/send/', notification_data, format='json')
        self.assertEqual(send_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(send_response.data['success'])
        
        notification_id = send_response.data['data']['notification_id']
        
        # Step 3: Check notification delivery status
        status_response = self.client.get(f'/api/notifications/{notification_id}/delivery-status/')
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        
        delivery_status = status_response.data['data']
        self.assertIn('in_app_status', delivery_status)
        self.assertIn('email_status', delivery_status)
        
        # Step 4: Verify recipient received notification
        school_token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {school_token}')
        
        inbox_response = self.client.get('/api/notifications/')
        self.assertEqual(inbox_response.status_code, status.HTTP_200_OK)
        
        notifications = inbox_response.data['data']
        notification_titles = [n['title'] for n in notifications]
        self.assertIn('Tournament Registration Deadline Approaching', notification_titles)
    
    def test_notification_preferences_workflow(self):
        """Test notification preferences management workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Get current notification preferences
        prefs_response = self.client.get('/api/notifications/preferences/')
        self.assertEqual(prefs_response.status_code, status.HTTP_200_OK)
        
        # Step 2: Update notification preferences
        preferences_data = {
            'email_notifications': True,
            'sms_notifications': False,
            'in_app_notifications': True,
            'notification_types': {
                'tournament': {
                    'email': True,
                    'sms': False,
                    'in_app': True
                },
                'document': {
                    'email': True,
                    'sms': True,
                    'in_app': True
                },
                'registration': {
                    'email': False,
                    'sms': False,
                    'in_app': True
                }
            },
            'quiet_hours': {
                'enabled': True,
                'start_time': '22:00',
                'end_time': '07:00'
            }
        }
        
        update_response = self.client.post('/api/notifications/preferences/', preferences_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        
        # Step 3: Verify preferences were saved
        verify_response = self.client.get('/api/notifications/preferences/')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        
        saved_prefs = verify_response.data['data']
        self.assertTrue(saved_prefs['email_notifications'])
        self.assertFalse(saved_prefs['sms_notifications'])
        self.assertTrue(saved_prefs['in_app_notifications'])
    
    def test_bulk_notification_workflow(self):
        """Test bulk notification sending workflow."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create additional users for bulk testing
        additional_admins = [
            UserFactory(role='SchoolAdmin'),
            UserFactory(role='SchoolAdmin'),
            UserFactory(role='Coach')
        ]
        
        # Step 1: Send bulk notification to multiple recipients
        bulk_data = {
            'title': 'System Maintenance Notice',
            'message': 'The system will undergo maintenance on December 15th from 2:00 AM to 4:00 AM.',
            'notification_type': 'system',
            'priority': 'high',
            'recipients': [
                {
                    'type': 'user',
                    'id': self.school_admin.user_id
                }
            ] + [
                {
                    'type': 'user',
                    'id': admin.user_id
                }
                for admin in additional_admins
            ],
            'delivery_methods': ['in_app', 'email'],
            'scheduled_time': None
        }
        
        bulk_response = self.client.post('/api/notifications/send-bulk/', bulk_data, format='json')
        self.assertEqual(bulk_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(bulk_response.data['success'])
        
        # Verify bulk sending results
        results = bulk_response.data['data']
        self.assertEqual(results['total_recipients'], 4)
        self.assertEqual(results['successful_sends'], 4)
        self.assertEqual(results['failed_sends'], 0)
        
        # Step 2: Send notification to all users of specific role
        role_bulk_data = {
            'title': 'Coach Training Session',
            'message': 'Mandatory training session for all coaches on December 20th.',
            'notification_type': 'training',
            'priority': 'normal',
            'recipient_criteria': {
                'type': 'role',
                'role': 'Coach'
            },
            'delivery_methods': ['in_app']
        }
        
        role_response = self.client.post('/api/notifications/send-bulk/', role_bulk_data, format='json')
        self.assertEqual(role_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(role_response.data['success'])
    
    def test_notification_management_workflow(self):
        """Test notification management workflow for recipients."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Get all notifications
        all_notifications_response = self.client.get('/api/notifications/')
        self.assertEqual(all_notifications_response.status_code, status.HTTP_200_OK)
        
        notifications = all_notifications_response.data['data']
        self.assertGreater(len(notifications), 0)
        
        # Step 2: Get unread notifications count
        unread_response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(unread_response.status_code, status.HTTP_200_OK)
        
        unread_count = unread_response.data['data']['count']
        self.assertGreater(unread_count, 0)
        
        # Step 3: Mark specific notification as read
        notification_id = notifications[0]['id']
        mark_read_response = self.client.post(f'/api/notifications/{notification_id}/mark-read/')
        self.assertEqual(mark_read_response.status_code, status.HTTP_200_OK)
        self.assertTrue(mark_read_response.data['success'])
        
        # Step 4: Verify unread count decreased
        updated_unread_response = self.client.get('/api/notifications/unread-count/')
        updated_count = updated_unread_response.data['data']['count']
        self.assertEqual(updated_count, unread_count - 1)
        
        # Step 5: Mark all notifications as read
        mark_all_response = self.client.post('/api/notifications/mark-all-read/')
        self.assertEqual(mark_all_response.status_code, status.HTTP_200_OK)
        self.assertTrue(mark_all_response.data['success'])
        
        # Step 6: Verify all marked as read
        final_unread_response = self.client.get('/api/notifications/unread-count/')
        final_count = final_unread_response.data['data']['count']
        self.assertEqual(final_count, 0)
        
        # Step 7: Delete notification
        delete_response = self.client.delete(f'/api/notifications/{notification_id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Step 8: Verify notification was deleted
        get_deleted_response = self.client.get(f'/api/notifications/{notification_id}/')
        self.assertEqual(get_deleted_response.status_code, status.HTTP_404_NOT_FOUND)


class NotificationTemplateManagementIntegrationTest(APITestCase):
    """
    Integration tests for notification template management.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_template_management_workflow(self):
        """Test complete template management workflow."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Create notification template
        template_data = {
            'name': 'Athlete Registration Confirmation',
            'template_type': 'registration_confirmation',
            'subject_template': 'Registration Confirmed for {{athlete_name}}',
            'message_template': 'Dear {{guardian_name}}, your child {{athlete_name}} has been successfully registered for {{sport}} at {{school_name}}.',
            'email_template': '''
                <h2>Registration Confirmation</h2>
                <p>Dear {{guardian_name}},</p>
                <p>We are pleased to confirm that your child <strong>{{athlete_name}}</strong> has been successfully registered for <strong>{{sport}}</strong> at <strong>{{school_name}}</strong>.</p>
                <p>Registration Details:</p>
                <ul>
                    <li>Athlete: {{athlete_name}}</li>
                    <li>Sport: {{sport}}</li>
                    <li>School: {{school_name}}</li>
                    <li>Registration Date: {{registration_date}}</li>
                </ul>
                <p>Thank you for choosing our sports program.</p>
            ''',
            'sms_template': 'Registration confirmed for {{athlete_name}} in {{sport}} at {{school_name}}. Registration ID: {{registration_id}}',
            'variables': ['guardian_name', 'athlete_name', 'sport', 'school_name', 'registration_date', 'registration_id'],
            'is_active': True
        }
        
        create_response = self.client.post('/api/notifications/templates/', template_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(create_response.data['success'])
        
        template_id = create_response.data['data']['id']
        
        # Step 2: Get template details
        details_response = self.client.get(f'/api/notifications/templates/{template_id}/')
        self.assertEqual(details_response.status_code, status.HTTP_200_OK)
        self.assertEqual(details_response.data['data']['name'], 'Athlete Registration Confirmation')
        
        # Step 3: Update template
        update_data = {
            'message_template': 'Dear {{guardian_name}}, your child {{athlete_name}} has been successfully registered for {{sport}} at {{school_name}}. Welcome to our sports program!',
            'variables': ['guardian_name', 'athlete_name', 'sport', 'school_name', 'registration_date', 'registration_id', 'coach_name']
        }
        
        update_response = self.client.patch(f'/api/notifications/templates/{template_id}/', update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        
        # Step 4: Test template rendering
        render_data = {
            'template_id': template_id,
            'context_data': {
                'guardian_name': 'John Doe',
                'athlete_name': 'Jane Doe',
                'sport': 'Football',
                'school_name': 'Test School',
                'registration_date': '2024-12-01',
                'registration_id': 'REG123456',
                'coach_name': 'Coach Smith'
            }
        }
        
        render_response = self.client.post('/api/notifications/templates/render/', render_data, format='json')
        self.assertEqual(render_response.status_code, status.HTTP_200_OK)
        
        rendered = render_response.data['data']
        self.assertIn('John Doe', rendered['message'])
        self.assertIn('Jane Doe', rendered['message'])
        self.assertIn('Football', rendered['message'])
        
        # Step 5: List all templates
        list_response = self.client.get('/api/notifications/templates/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        
        template_names = [t['name'] for t in list_response.data['data']]
        self.assertIn('Athlete Registration Confirmation', template_names)
    
    def test_template_access_permissions(self):
        """Test template access permissions."""
        # SuperAdmin should have full access
        super_token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {super_token}')
        
        response = self.client.get('/api/notifications/templates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # SchoolAdmin should have read-only access
        school_token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {school_token}')
        
        # Can read templates
        read_response = self.client.get('/api/notifications/templates/')
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        
        # Cannot create templates
        template_data = {
            'name': 'Unauthorized Template',
            'template_type': 'test',
            'subject_template': 'Test',
            'message_template': 'Test message'
        }
        
        create_response = self.client.post('/api/notifications/templates/', template_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)


class NotificationAnalyticsIntegrationTest(APITestCase):
    """
    Integration tests for notification analytics and reporting.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        
        # Create test notifications with different statuses
        self.create_analytics_test_data()
    
    def create_analytics_test_data(self):
        """Create test data for analytics."""
        # Create notifications with different delivery statuses
        notification_data = [
            {'notification_type': 'tournament', 'priority': 'normal', 'is_read': True},
            {'notification_type': 'tournament', 'priority': 'high', 'is_read': False},
            {'notification_type': 'document', 'priority': 'normal', 'is_read': True},
            {'notification_type': 'registration', 'priority': 'low', 'is_read': False},
            {'notification_type': 'system', 'priority': 'high', 'is_read': True},
        ]
        
        for i, data in enumerate(notification_data):
            NotificationLog.objects.create(
                notification_type='email',
                recipient_email=self.school_admin.email,
                recipient_name=self.school_admin.full_name,
                subject=f'Test Notification {i+1}',
                content=f'Test message {i+1}',
                status='sent'
            )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_notification_analytics(self):
        """Test notification analytics functionality."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get overall notification analytics
        analytics_response = self.client.get('/api/notifications/analytics/')
        self.assertEqual(analytics_response.status_code, status.HTTP_200_OK)
        self.assertTrue(analytics_response.data['success'])
        
        analytics = analytics_response.data['data']
        
        # Verify analytics structure
        self.assertIn('total_notifications', analytics)
        self.assertIn('notifications_by_type', analytics)
        self.assertIn('notifications_by_priority', analytics)
        self.assertIn('read_rate', analytics)
        self.assertIn('delivery_statistics', analytics)
        
        # Verify type distribution
        type_distribution = analytics['notifications_by_type']
        self.assertIn('tournament', type_distribution)
        self.assertIn('document', type_distribution)
        self.assertIn('registration', type_distribution)
        self.assertIn('system', type_distribution)
        
        # Verify priority distribution
        priority_distribution = analytics['notifications_by_priority']
        self.assertIn('high', priority_distribution)
        self.assertIn('normal', priority_distribution)
        self.assertIn('low', priority_distribution)
    
    def test_notification_delivery_analytics(self):
        """Test notification delivery analytics."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get delivery analytics
        delivery_response = self.client.get('/api/notifications/analytics/delivery/')
        self.assertEqual(delivery_response.status_code, status.HTTP_200_OK)
        
        delivery_data = delivery_response.data['data']
        
        # Verify delivery analytics structure
        self.assertIn('total_sent', delivery_data)
        self.assertIn('delivery_methods', delivery_data)
        self.assertIn('success_rates', delivery_data)
        self.assertIn('failure_reasons', delivery_data)
    
    def test_user_notification_statistics(self):
        """Test user-specific notification statistics."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get user's notification statistics
        stats_response = self.client.get('/api/notifications/my-statistics/')
        self.assertEqual(stats_response.status_code, status.HTTP_200_OK)
        
        stats = stats_response.data['data']
        
        # Verify user statistics structure
        self.assertIn('total_received', stats)
        self.assertIn('total_read', stats)
        self.assertIn('total_unread', stats)
        self.assertIn('notifications_by_type', stats)
        self.assertIn('recent_activity', stats)
        
        # Verify counts match test data
        self.assertEqual(stats['total_received'], 5)
        self.assertEqual(stats['total_read'], 3)
        self.assertEqual(stats['total_unread'], 2)


class NotificationErrorHandlingIntegrationTest(APITestCase):
    """
    Integration tests for notification system error handling.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_notification_validation_errors(self):
        """Test notification creation with validation errors."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test missing required fields
        incomplete_data = {
            'title': 'Incomplete Notification'
        }
        
        response = self.client.post('/api/notifications/send/', incomplete_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
        
        # Test invalid recipient data
        invalid_recipient_data = {
            'title': 'Test Notification',
            'message': 'Test message',
            'recipients': [
                {
                    'type': 'invalid_type',
                    'id': 123
                }
            ]
        }
        
        response = self.client.post('/api/notifications/send/', invalid_recipient_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_template_validation_errors(self):
        """Test template creation with validation errors."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test missing required template fields
        incomplete_template = {
            'name': 'Incomplete Template'
        }
        
        response = self.client.post('/api/notifications/templates/', incomplete_template, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        
        # Test invalid template syntax
        invalid_template = {
            'name': 'Invalid Template',
            'template_type': 'test',
            'subject_template': 'Test Subject',
            'message_template': 'Hello {{invalid_variable_syntax}',  # Missing closing braces
            'variables': ['valid_variable']
        }
        
        response = self.client.post('/api/notifications/templates/', invalid_template, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_notification_access_permissions(self):
        """Test notification access permission errors."""
        # Create notification for school admin
        notification = NotificationLog.objects.create(
            notification_type='email',
            recipient_email=self.school_admin.email,
            recipient_name=self.school_admin.full_name,
            subject='Private Notification',
            content='This is a private notification',
            status='sent'
        )
        
        # Test unauthenticated access
        response = self.client.get(f'/api/notifications/{notification.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test access by different user
        other_admin = UserFactory(role='SchoolAdmin')
        other_token = self.get_jwt_token(other_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {other_token}')
        
        response = self.client.get(f'/api/notifications/{notification.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_notification_not_found_errors(self):
        """Test notification not found error scenarios."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test accessing non-existent notification
        response = self.client.get('/api/notifications/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])
        
        # Test marking non-existent notification as read
        response = self.client.post('/api/notifications/99999/mark-read/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Test deleting non-existent notification
        response = self.client.delete('/api/notifications/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class NotificationPerformanceIntegrationTest(APITestCase):
    """
    Integration tests for notification system performance.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        
        # Create many notifications for performance testing
        self.create_many_notifications(50)
    
    def create_many_notifications(self, count):
        """Create many notifications for performance testing."""
        for i in range(count):
            NotificationLog.objects.create(
                notification_type='email',
                recipient_email=self.school_admin.email,
                recipient_name=self.school_admin.full_name,
                subject=f'Performance Test Notification {i+1:03d}',
                content=f'This is performance test notification number {i+1}',
                status='sent'
            )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_notification_list_pagination_performance(self):
        """Test notification list endpoint with pagination performance."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/notifications/?page=1&page_size=20')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Should return paginated results
        self.assertLessEqual(len(response.data['data']), 20)
        
        # Response should be reasonably fast
        self.assertLess(response_time, 2.0)  # Under 2 seconds
    
    def test_bulk_notification_performance(self):
        """Test bulk notification sending performance."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create multiple recipients
        recipients = [UserFactory(role='SchoolAdmin') for _ in range(10)]
        
        bulk_data = {
            'title': 'Performance Test Bulk Notification',
            'message': 'This is a performance test for bulk notifications',
            'notification_type': 'test',
            'priority': 'normal',
            'recipients': [
                {
                    'type': 'user',
                    'id': user.user_id
                }
                for user in recipients
            ],
            'delivery_methods': ['in_app']
        }
        
        start_time = time.time()
        response = self.client.post('/api/notifications/send-bulk/', bulk_data, format='json')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        # Bulk sending should be reasonably fast
        self.assertLess(response_time, 10.0)  # Under 10 seconds for 10 recipients
    
    def test_notification_analytics_performance(self):
        """Test notification analytics performance."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/notifications/analytics/')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Analytics should be reasonably fast
        self.assertLess(response_time, 5.0)  # Under 5 seconds