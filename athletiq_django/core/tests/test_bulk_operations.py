"""
Tests for bulk operations management system.
"""
import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from core.bulk_operations import BulkOperationManager, bulk_operation_manager
from apps.authentication.models import User
from apps.schools.models import School


class BulkOperationManagerTest(TestCase):
    """Test cases for BulkOperationManager."""
    
    def setUp(self):
        """Set up test environment."""
        self.manager = BulkOperationManager()
        cache.clear()
        
        # Create test user
        self.user = User.objects.create(
            email='test@example.com',
            full_name='Test User',
            role='SchoolAdmin'
        )
    
    def test_create_operation(self):
        """Test creating a new bulk operation."""
        operation_id = self.manager.create_operation(
            operation_type='test_import',
            user_id=self.user.id,
            description='Test import operation',
            total_items=100,
            metadata={'test': 'data'}
        )
        
        # Verify operation was created
        self.assertIsNotNone(operation_id)
        
        # Verify operation data
        operation_data = self.manager.get_operation(operation_id)
        self.assertIsNotNone(operation_data)
        self.assertEqual(operation_data['type'], 'test_import')
        self.assertEqual(operation_data['user_id'], self.user.id)
        self.assertEqual(operation_data['description'], 'Test import operation')
        self.assertEqual(operation_data['total_items'], 100)
        self.assertEqual(operation_data['status'], 'pending')
        self.assertEqual(operation_data['metadata']['test'], 'data')
    
    def test_start_operation(self):
        """Test starting an operation."""
        operation_id = self.manager.create_operation(
            operation_type='test_operation',
            user_id=self.user.id,
            description='Test operation'
        )
        
        # Start the operation
        success = self.manager.start_operation(operation_id, 'test-task-id')
        self.assertTrue(success)
        
        # Verify operation status
        operation_data = self.manager.get_operation(operation_id)
        self.assertEqual(operation_data['status'], 'running')
        self.assertEqual(operation_data['task_id'], 'test-task-id')
        self.assertIsNotNone(operation_data['started_at'])
    
    def test_update_progress(self):
        """Test updating operation progress."""
        operation_id = self.manager.create_operation(
            operation_type='test_operation',
            user_id=self.user.id,
            description='Test operation',
            total_items=100
        )
        
        # Update progress
        success = self.manager.update_progress(
            operation_id,
            processed_items=50,
            successful_items=45,
            failed_items=5,
            results=[{'item': 1, 'status': 'success'}]
        )
        self.assertTrue(success)
        
        # Verify progress update
        operation_data = self.manager.get_operation(operation_id)
        self.assertEqual(operation_data['processed_items'], 50)
        self.assertEqual(operation_data['successful_items'], 45)
        self.assertEqual(operation_data['failed_items'], 5)
        self.assertEqual(operation_data['progress_percentage'], 50.0)
        self.assertEqual(len(operation_data['results']), 1)
    
    def test_complete_operation_success(self):
        """Test completing an operation successfully."""
        operation_id = self.manager.create_operation(
            operation_type='test_operation',
            user_id=self.user.id,
            description='Test operation'
        )
        
        # Complete the operation
        success = self.manager.complete_operation(
            operation_id,
            success=True,
            final_results={'total': 100, 'processed': 100}
        )
        self.assertTrue(success)
        
        # Verify completion
        operation_data = self.manager.get_operation(operation_id)
        self.assertEqual(operation_data['status'], 'completed')
        self.assertIsNotNone(operation_data['completed_at'])
        self.assertEqual(operation_data['metadata']['total'], 100)
    
    def test_complete_operation_failure(self):
        """Test completing an operation with failure."""
        operation_id = self.manager.create_operation(
            operation_type='test_operation',
            user_id=self.user.id,
            description='Test operation'
        )
        
        # Complete the operation with failure
        success = self.manager.complete_operation(
            operation_id,
            success=False,
            error_message='Test error message'
        )
        self.assertTrue(success)
        
        # Verify failure completion
        operation_data = self.manager.get_operation(operation_id)
        self.assertEqual(operation_data['status'], 'failed')
        self.assertEqual(operation_data['error_message'], 'Test error message')
        self.assertIsNotNone(operation_data['completed_at'])
    
    @patch('core.bulk_operations.current_app')
    def test_cancel_operation(self, mock_app):
        """Test cancelling an operation."""
        operation_id = self.manager.create_operation(
            operation_type='test_operation',
            user_id=self.user.id,
            description='Test operation'
        )
        
        # Start the operation
        self.manager.start_operation(operation_id, 'test-task-id')
        
        # Cancel the operation
        success = self.manager.cancel_operation(operation_id)
        self.assertTrue(success)
        
        # Verify cancellation
        operation_data = self.manager.get_operation(operation_id)
        self.assertEqual(operation_data['status'], 'cancelled')
        self.assertIsNotNone(operation_data['completed_at'])
        
        # Verify Celery task was revoked
        mock_app.control.revoke.assert_called_once_with('test-task-id', terminate=True)
    
    def test_get_nonexistent_operation(self):
        """Test getting a non-existent operation."""
        operation_data = self.manager.get_operation('nonexistent-id')
        self.assertIsNone(operation_data)
    
    def test_start_nonexistent_operation(self):
        """Test starting a non-existent operation."""
        success = self.manager.start_operation('nonexistent-id')
        self.assertFalse(success)
    
    def test_update_progress_nonexistent_operation(self):
        """Test updating progress for non-existent operation."""
        success = self.manager.update_progress('nonexistent-id', processed_items=10)
        self.assertFalse(success)


class BulkOperationAPITest(APITestCase):
    """Test cases for bulk operation API endpoints."""
    
    def setUp(self):
        """Set up test environment."""
        cache.clear()
        
        # Create test user
        self.user = User.objects.create(
            email='test@example.com',
            full_name='Test User',
            role='SchoolAdmin'
        )
        
        # Create test school
        self.school = School.objects.create(
            school_code='TEST001',
            name='Test School',
            address='Test Address',
            country='Nepal',
            province='Bagmati',
            district='Kathmandu',
            city='Kathmandu',
            phone='+977-1-4567890',
            email='test@school.com',
            principal_name='Test Principal',
            admin_user=self.user
        )
        
        # Create test operation
        self.operation_id = bulk_operation_manager.create_operation(
            operation_type='test_operation',
            user_id=self.user.id,
            description='Test operation',
            total_items=100
        )
    
    def test_get_operation_status_authenticated(self):
        """Test getting operation status when authenticated."""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/bulk-operations/operations/{self.operation_id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['id'], self.operation_id)
    
    def test_get_operation_status_unauthenticated(self):
        """Test getting operation status when not authenticated."""
        url = f'/api/bulk-operations/operations/{self.operation_id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_operation_status_not_found(self):
        """Test getting status for non-existent operation."""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/bulk-operations/operations/nonexistent-id/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_get_operation_status_permission_denied(self):
        """Test getting operation status for another user's operation."""
        # Create another user
        other_user = User.objects.create(
            email='other@example.com',
            full_name='Other User',
            role='SchoolAdmin'
        )
        
        self.client.force_authenticate(user=other_user)
        
        url = f'/api/bulk-operations/operations/{self.operation_id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_user_operations(self):
        """Test listing user operations."""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/bulk-operations/operations/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('operations', response.data['data'])
    
    def test_list_user_operations_with_status_filter(self):
        """Test listing user operations with status filter."""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/bulk-operations/operations/?status=pending'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_list_user_operations_with_limit(self):
        """Test listing user operations with limit."""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/bulk-operations/operations/?limit=10'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_cancel_operation_success(self):
        """Test cancelling an operation successfully."""
        # Start the operation first
        bulk_operation_manager.start_operation(self.operation_id, 'test-task-id')
        
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/bulk-operations/operations/{self.operation_id}/cancel/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify operation was cancelled
        operation_data = bulk_operation_manager.get_operation(self.operation_id)
        self.assertEqual(operation_data['status'], 'cancelled')
    
    def test_cancel_operation_invalid_status(self):
        """Test cancelling an operation with invalid status."""
        # Complete the operation first
        bulk_operation_manager.complete_operation(self.operation_id, success=True)
        
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/bulk-operations/operations/{self.operation_id}/cancel/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_operation_statistics(self):
        """Test getting operation statistics."""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/bulk-operations/statistics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
    
    @patch('apps.athletes.tasks.bulk_import_athletes_task')
    def test_start_bulk_athlete_import(self, mock_task):
        """Test starting bulk athlete import."""
        # Mock Celery task
        mock_task_instance = MagicMock()
        mock_task_instance.id = 'test-task-id'
        mock_task.delay.return_value = mock_task_instance
        
        self.client.force_authenticate(user=self.user)
        
        csv_data = "full_name,gender,date_of_birth\nTest Athlete,Male,2010-01-01"
        
        data = {
            'csv_data': csv_data,
            'school_id': self.school.school_id,
            'options': {'update_existing': False}
        }
        
        url = '/api/bulk-operations/athletes/import/'
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(response.data['success'])
        self.assertIn('operation_id', response.data['data'])
        self.assertIn('task_id', response.data['data'])
        
        # Verify task was called
        mock_task.delay.assert_called_once()
    
    def test_start_bulk_athlete_import_missing_data(self):
        """Test starting bulk athlete import with missing data."""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'csv_data': 'test data'
            # Missing school_id
        }
        
        url = '/api/bulk-operations/athletes/import/'
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    @patch('apps.athletes.tasks.bulk_export_athletes_task')
    def test_start_bulk_athlete_export(self, mock_task):
        """Test starting bulk athlete export."""
        # Mock Celery task
        mock_task_instance = MagicMock()
        mock_task_instance.id = 'test-task-id'
        mock_task.delay.return_value = mock_task_instance
        
        self.client.force_authenticate(user=self.user)
        
        data = {
            'school_id': self.school.school_id,
            'filters': {'verification_status': 'verified'}
        }
        
        url = '/api/bulk-operations/athletes/export/'
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(response.data['success'])
        self.assertIn('operation_id', response.data['data'])
        
        # Verify task was called
        mock_task.delay.assert_called_once()
    
    @patch('apps.athletes.tasks.bulk_update_athlete_status_task')
    def test_start_bulk_status_update(self, mock_task):
        """Test starting bulk status update."""
        # Mock Celery task
        mock_task_instance = MagicMock()
        mock_task_instance.id = 'test-task-id'
        mock_task.delay.return_value = mock_task_instance
        
        self.client.force_authenticate(user=self.user)
        
        data = {
            'entity_type': 'athlete',
            'entity_ids': [1, 2, 3],
            'status_updates': {'verification_status': 'verified'}
        }
        
        url = '/api/bulk-operations/status-update/'
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(response.data['success'])
        self.assertIn('operation_id', response.data['data'])
        
        # Verify task was called
        mock_task.delay.assert_called_once()
    
    def test_start_bulk_status_update_invalid_entity_type(self):
        """Test starting bulk status update with invalid entity type."""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'entity_type': 'invalid_type',
            'entity_ids': [1, 2, 3],
            'status_updates': {'status': 'active'}
        }
        
        url = '/api/bulk-operations/status-update/'
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    @patch('apps.schools.tasks.bulk_import_schools_task')
    def test_start_bulk_school_import(self, mock_task):
        """Test starting bulk school import."""
        # Mock Celery task
        mock_task_instance = MagicMock()
        mock_task_instance.id = 'test-task-id'
        mock_task.delay.return_value = mock_task_instance
        
        self.client.force_authenticate(user=self.user)
        
        csv_data = "name,school_code,address,country\nTest School,TEST001,Test Address,Nepal"
        
        data = {
            'csv_data': csv_data,
            'options': {'update_existing': False}
        }
        
        url = '/api/bulk-operations/schools/import/'
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(response.data['success'])
        self.assertIn('operation_id', response.data['data'])
        
        # Verify task was called
        mock_task.delay.assert_called_once()
    
    @patch('apps.tournaments.tasks.bulk_import_tournaments_task')
    def test_start_bulk_tournament_import(self, mock_task):
        """Test starting bulk tournament import."""
        # Mock Celery task
        mock_task_instance = MagicMock()
        mock_task_instance.id = 'test-task-id'
        mock_task.delay.return_value = mock_task_instance
        
        self.client.force_authenticate(user=self.user)
        
        csv_data = "name,sport,start_date,end_date\nTest Tournament,Football,2024-01-01,2024-01-02"
        
        data = {
            'csv_data': csv_data,
            'school_id': self.school.school_id,
            'options': {'update_existing': False}
        }
        
        url = '/api/bulk-operations/tournaments/import/'
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(response.data['success'])
        self.assertIn('operation_id', response.data['data'])
        
        # Verify task was called
        mock_task.delay.assert_called_once()
    
    @patch('apps.athletes.tasks.bulk_athlete_data_migration_task')
    def test_start_bulk_data_migration(self, mock_task):
        """Test starting bulk data migration."""
        # Mock Celery task
        mock_task_instance = MagicMock()
        mock_task_instance.id = 'test-task-id'
        mock_task.delay.return_value = mock_task_instance
        
        # Create another school for migration target
        target_school = School.objects.create(
            school_code='TEST002',
            name='Target School',
            address='Target Address',
            country='Nepal',
            province='Bagmati',
            district='Kathmandu',
            city='Kathmandu',
            phone='+977-1-4567891',
            email='target@school.com',
            principal_name='Target Principal',
            admin_user=self.user
        )
        
        self.client.force_authenticate(user=self.user)
        
        data = {
            'migration_type': 'athlete_school_transfer',
            'source_id': self.school.school_id,
            'target_id': target_school.school_id,
            'entity_ids': [1, 2, 3]
        }
        
        url = '/api/bulk-operations/data-migration/'
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(response.data['success'])
        self.assertIn('operation_id', response.data['data'])
        
        # Verify task was called
        mock_task.delay.assert_called_once()
    
    def test_bulk_operation_progress_tracking(self):
        """Test bulk operation progress tracking."""
        # Create operation
        operation_id = bulk_operation_manager.create_operation(
            operation_type='test_operation',
            user_id=self.user.id,
            description='Test operation',
            total_items=100
        )
        
        # Start operation
        bulk_operation_manager.start_operation(operation_id)
        
        # Update progress multiple times
        for i in range(1, 6):
            processed = i * 20
            successful = i * 18
            failed = i * 2
            
            success = bulk_operation_manager.update_progress(
                operation_id,
                processed_items=processed,
                successful_items=successful,
                failed_items=failed
            )
            self.assertTrue(success)
            
            # Verify progress
            operation_data = bulk_operation_manager.get_operation(operation_id)
            self.assertEqual(operation_data['processed_items'], processed)
            self.assertEqual(operation_data['successful_items'], successful)
            self.assertEqual(operation_data['failed_items'], failed)
            self.assertEqual(operation_data['progress_percentage'], processed)
        
        # Complete operation
        success = bulk_operation_manager.complete_operation(operation_id, success=True)
        self.assertTrue(success)
        
        # Verify completion
        operation_data = bulk_operation_manager.get_operation(operation_id)
        self.assertEqual(operation_data['status'], 'completed')
    
    def test_bulk_operation_error_handling(self):
        """Test bulk operation error handling."""
        # Test with invalid operation ID
        success = bulk_operation_manager.update_progress('invalid-id', processed_items=10)
        self.assertFalse(success)
        
        success = bulk_operation_manager.complete_operation('invalid-id', success=True)
        self.assertFalse(success)
        
        success = bulk_operation_manager.cancel_operation('invalid-id')
        self.assertFalse(success)
    
    def test_bulk_operation_statistics(self):
        """Test bulk operation statistics generation."""
        # Create multiple operations with different statuses
        operations = []
        
        # Create completed operation
        op1 = bulk_operation_manager.create_operation(
            operation_type='test_operation',
            user_id=self.user.id,
            description='Completed operation'
        )
        bulk_operation_manager.start_operation(op1)
        bulk_operation_manager.complete_operation(op1, success=True)
        operations.append(op1)
        
        # Create failed operation
        op2 = bulk_operation_manager.create_operation(
            operation_type='test_operation',
            user_id=self.user.id,
            description='Failed operation'
        )
        bulk_operation_manager.start_operation(op2)
        bulk_operation_manager.complete_operation(op2, success=False, error_message='Test error')
        operations.append(op2)
        
        # Create running operation
        op3 = bulk_operation_manager.create_operation(
            operation_type='test_operation',
            user_id=self.user.id,
            description='Running operation'
        )
        bulk_operation_manager.start_operation(op3)
        operations.append(op3)
        
        # Get statistics
        stats = bulk_operation_manager.get_operation_statistics(self.user.id)
        
        # Verify statistics structure
        self.assertIn('total_operations', stats)
        self.assertIn('running_operations', stats)
        self.assertIn('completed_operations', stats)
        self.assertIn('failed_operations', stats)
        self.assertIn('success_rate', stats)