"""
Bulk operations management system with progress tracking and status reporting.
"""
import logging
import uuid
from typing import Dict, Any, List, Optional
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from celery import current_app
from celery.result import AsyncResult

logger = logging.getLogger(__name__)


class BulkOperationManager:
    """
    Manager for bulk operations with progress tracking and status reporting.
    """
    
    def __init__(self):
        self.cache_prefix = 'bulk_operation'
        self.default_timeout = 3600  # 1 hour
    
    def create_operation(
        self,
        operation_type: str,
        user_id: int,
        description: str,
        total_items: int = 0,
        metadata: Dict[str, Any] = None
    ) -> str:
        """
        Create a new bulk operation and return operation ID.
        
        Args:
            operation_type: Type of operation (import, export, update, etc.)
            user_id: ID of user initiating the operation
            description: Human-readable description
            total_items: Total number of items to process
            metadata: Additional operation metadata
            
        Returns:
            str: Unique operation ID
        """
        operation_id = str(uuid.uuid4())
        
        operation_data = {
            'id': operation_id,
            'type': operation_type,
            'user_id': user_id,
            'description': description,
            'status': 'pending',
            'total_items': total_items,
            'processed_items': 0,
            'successful_items': 0,
            'failed_items': 0,
            'progress_percentage': 0.0,
            'created_at': timezone.now().isoformat(),
            'started_at': None,
            'completed_at': None,
            'error_message': None,
            'metadata': metadata or {},
            'results': [],
            'task_id': None
        }
        
        # Store in cache
        cache_key = f"{self.cache_prefix}:{operation_id}"
        cache.set(cache_key, operation_data, timeout=self.default_timeout)
        
        logger.info(f"Created bulk operation {operation_id}: {operation_type}")
        return operation_id
    
    def start_operation(self, operation_id: str, task_id: str = None, send_notification: bool = True) -> bool:
        """
        Mark operation as started.
        
        Args:
            operation_id: Operation ID
            task_id: Celery task ID
            
        Returns:
            bool: Success status
        """
        try:
            operation_data = self.get_operation(operation_id)
            if not operation_data:
                return False
            
            operation_data['status'] = 'running'
            operation_data['started_at'] = timezone.now().isoformat()
            if task_id:
                operation_data['task_id'] = task_id
            
            cache_key = f"{self.cache_prefix}:{operation_id}"
            cache.set(cache_key, operation_data, timeout=self.default_timeout)
            
            # Send start notification
            if send_notification:
                try:
                    from core.services.bulk_notification_service import bulk_notification_service
                    bulk_notification_service.send_operation_started_notification(
                        user_id=operation_data['user_id'],
                        operation_id=operation_id,
                        operation_type=operation_data['type'],
                        total_items=operation_data['total_items']
                    )
                except Exception as e:
                    logger.error(f"Error sending start notification: {str(e)}")
            
            logger.info(f"Started bulk operation {operation_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error starting operation {operation_id}: {str(e)}")
            return False
    
    def update_progress(
        self,
        operation_id: str,
        processed_items: int = None,
        successful_items: int = None,
        failed_items: int = None,
        results: List[Dict[str, Any]] = None,
        metadata_update: Dict[str, Any] = None
    ) -> bool:
        """
        Update operation progress.
        
        Args:
            operation_id: Operation ID
            processed_items: Number of processed items
            successful_items: Number of successful items
            failed_items: Number of failed items
            results: List of operation results
            metadata_update: Metadata updates
            
        Returns:
            bool: Success status
        """
        try:
            operation_data = self.get_operation(operation_id)
            if not operation_data:
                return False
            
            # Update counters
            if processed_items is not None:
                operation_data['processed_items'] = processed_items
            if successful_items is not None:
                operation_data['successful_items'] = successful_items
            if failed_items is not None:
                operation_data['failed_items'] = failed_items
            
            # Calculate progress percentage
            if operation_data['total_items'] > 0:
                operation_data['progress_percentage'] = (
                    operation_data['processed_items'] / operation_data['total_items']
                ) * 100
            
            # Update results
            if results:
                operation_data['results'].extend(results)
            
            # Update metadata
            if metadata_update:
                operation_data['metadata'].update(metadata_update)
            
            # Store updated data
            cache_key = f"{self.cache_prefix}:{operation_id}"
            cache.set(cache_key, operation_data, timeout=self.default_timeout)
            
            # Send progress notification for milestones
            try:
                from core.services.bulk_notification_service import bulk_notification_service
                bulk_notification_service.send_operation_progress_notification(
                    user_id=operation_data['user_id'],
                    operation_id=operation_id,
                    operation_type=operation_data['type'],
                    progress_percentage=operation_data['progress_percentage'],
                    processed_items=operation_data['processed_items'],
                    total_items=operation_data['total_items']
                )
            except Exception as e:
                logger.error(f"Error sending progress notification: {str(e)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating progress for operation {operation_id}: {str(e)}")
            return False
    
    def complete_operation(
        self,
        operation_id: str,
        success: bool = True,
        error_message: str = None,
        final_results: Dict[str, Any] = None,
        send_notification: bool = True
    ) -> bool:
        """
        Mark operation as completed.
        
        Args:
            operation_id: Operation ID
            success: Whether operation completed successfully
            error_message: Error message if failed
            final_results: Final operation results
            
        Returns:
            bool: Success status
        """
        try:
            operation_data = self.get_operation(operation_id)
            if not operation_data:
                return False
            
            operation_data['status'] = 'completed' if success else 'failed'
            operation_data['completed_at'] = timezone.now().isoformat()
            
            if error_message:
                operation_data['error_message'] = error_message
            
            if final_results:
                operation_data['metadata'].update(final_results)
            
            # Extend cache timeout for completed operations
            cache_key = f"{self.cache_prefix}:{operation_id}"
            cache.set(cache_key, operation_data, timeout=86400 * 7)  # Keep for 7 days
            
            # Send completion notification
            if send_notification:
                try:
                    from core.services.bulk_notification_service import bulk_notification_service
                    if success:
                        # Prepare results for notification
                        notification_results = final_results or {}
                        notification_results.update({
                            'success': success,
                            'total_processed': operation_data['processed_items'],
                            'successful_imports': operation_data['successful_items'],
                            'failed_imports': operation_data['failed_items']
                        })
                        
                        bulk_notification_service.send_operation_completed_notification(
                            user_id=operation_data['user_id'],
                            operation_id=operation_id,
                            operation_type=operation_data['type'],
                            results=notification_results
                        )
                    else:
                        bulk_notification_service.send_operation_failed_notification(
                            user_id=operation_data['user_id'],
                            operation_id=operation_id,
                            operation_type=operation_data['type'],
                            error_message=error_message or 'Operation failed'
                        )
                except Exception as e:
                    logger.error(f"Error sending completion notification: {str(e)}")
            
            logger.info(f"Completed bulk operation {operation_id}: {operation_data['status']}")
            return True
            
        except Exception as e:
            logger.error(f"Error completing operation {operation_id}: {str(e)}")
            return False
    
    def get_operation(self, operation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get operation data by ID.
        
        Args:
            operation_id: Operation ID
            
        Returns:
            Dict with operation data or None if not found
        """
        try:
            cache_key = f"{self.cache_prefix}:{operation_id}"
            return cache.get(cache_key)
        except Exception as e:
            logger.error(f"Error getting operation {operation_id}: {str(e)}")
            return None
    
    def get_user_operations(
        self,
        user_id: int,
        status_filter: str = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get operations for a specific user.
        
        Args:
            user_id: User ID
            status_filter: Optional status filter
            limit: Maximum number of operations to return
            
        Returns:
            List of operation data
        """
        try:
            # Get all operation keys for user (this is a simplified implementation)
            # In production, you might want to use a more efficient indexing system
            user_ops_key = f"{self.cache_prefix}:user:{user_id}"
            operation_ids = cache.get(user_ops_key, [])
            
            operations = []
            for op_id in operation_ids[-limit:]:  # Get most recent operations
                operation_data = self.get_operation(op_id)
                if operation_data:
                    if not status_filter or operation_data['status'] == status_filter:
                        operations.append(operation_data)
            
            # Sort by creation time (most recent first)
            operations.sort(key=lambda x: x['created_at'], reverse=True)
            return operations
            
        except Exception as e:
            logger.error(f"Error getting user operations for user {user_id}: {str(e)}")
            return []
    
    def cancel_operation(self, operation_id: str) -> bool:
        """
        Cancel a running operation.
        
        Args:
            operation_id: Operation ID
            
        Returns:
            bool: Success status
        """
        try:
            operation_data = self.get_operation(operation_id)
            if not operation_data:
                return False
            
            # Cancel Celery task if it exists
            if operation_data.get('task_id'):
                current_app.control.revoke(operation_data['task_id'], terminate=True)
            
            # Update operation status
            operation_data['status'] = 'cancelled'
            operation_data['completed_at'] = timezone.now().isoformat()
            
            cache_key = f"{self.cache_prefix}:{operation_id}"
            cache.set(cache_key, operation_data, timeout=self.default_timeout)
            
            logger.info(f"Cancelled bulk operation {operation_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error cancelling operation {operation_id}: {str(e)}")
            return False
    
    def cleanup_old_operations(self, days_to_keep: int = 7) -> int:
        """
        Clean up old completed operations.
        
        Args:
            days_to_keep: Number of days to keep operations
            
        Returns:
            int: Number of operations cleaned up
        """
        try:
            # This is a simplified implementation
            # In production, you'd want a more efficient way to track and clean up operations
            cleaned_count = 0
            
            # Get all operation keys (this would need to be implemented based on your caching strategy)
            # For now, we'll just log the cleanup attempt
            logger.info(f"Cleanup old operations older than {days_to_keep} days")
            
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Error cleaning up old operations: {str(e)}")
            return 0
    
    def get_operation_statistics(self, user_id: int = None) -> Dict[str, Any]:
        """
        Get operation statistics.
        
        Args:
            user_id: Optional user ID to filter statistics
            
        Returns:
            Dict with statistics
        """
        try:
            # This is a simplified implementation
            # In production, you'd want to maintain these statistics more efficiently
            stats = {
                'total_operations': 0,
                'running_operations': 0,
                'completed_operations': 0,
                'failed_operations': 0,
                'cancelled_operations': 0,
                'success_rate': 0.0
            }
            
            # Get operations for user or all operations
            if user_id:
                operations = self.get_user_operations(user_id, limit=1000)
            else:
                # This would need to be implemented to get all operations
                operations = []
            
            stats['total_operations'] = len(operations)
            
            for op in operations:
                status = op['status']
                if status == 'running':
                    stats['running_operations'] += 1
                elif status == 'completed':
                    stats['completed_operations'] += 1
                elif status == 'failed':
                    stats['failed_operations'] += 1
                elif status == 'cancelled':
                    stats['cancelled_operations'] += 1
            
            # Calculate success rate
            if stats['total_operations'] > 0:
                stats['success_rate'] = (
                    stats['completed_operations'] / stats['total_operations']
                ) * 100
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting operation statistics: {str(e)}")
            return {}


# Global instance
bulk_operation_manager = BulkOperationManager()


def track_bulk_operation(operation_type: str, user_id: int, description: str):
    """
    Decorator to track bulk operations.
    
    Args:
        operation_type: Type of operation
        user_id: User ID
        description: Operation description
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Create operation
            operation_id = bulk_operation_manager.create_operation(
                operation_type=operation_type,
                user_id=user_id,
                description=description
            )
            
            try:
                # Start operation
                bulk_operation_manager.start_operation(operation_id)
                
                # Execute function
                result = func(*args, **kwargs, operation_id=operation_id)
                
                # Complete operation
                bulk_operation_manager.complete_operation(operation_id, success=True)
                
                return result
                
            except Exception as e:
                # Mark operation as failed
                bulk_operation_manager.complete_operation(
                    operation_id,
                    success=False,
                    error_message=str(e)
                )
                raise
        
        return wrapper
    return decorator