"""
API views for bulk operations management.
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import JsonResponse
from core.bulk_operations import bulk_operation_manager
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_operation_status(request, operation_id):
    """
    Get the status of a bulk operation.
    
    Args:
        request: HTTP request
        operation_id: Operation ID
        
    Returns:
        JSON response with operation status
    """
    try:
        operation_data = bulk_operation_manager.get_operation(operation_id)
        
        if not operation_data:
            return Response(
                {'error': 'Operation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has permission to view this operation
        if operation_data['user_id'] != request.user.id and not request.user.is_superuser:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response({
            'success': True,
            'data': operation_data
        })
        
    except Exception as e:
        logger.error(f"Error getting operation status {operation_id}: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_operations(request):
    """
    List bulk operations for the current user.
    
    Args:
        request: HTTP request
        
    Returns:
        JSON response with list of operations
    """
    try:
        # Get query parameters
        status_filter = request.GET.get('status')
        limit = int(request.GET.get('limit', 50))
        
        # Validate limit
        if limit > 100:
            limit = 100
        
        # Get user operations
        operations = bulk_operation_manager.get_user_operations(
            user_id=request.user.id,
            status_filter=status_filter,
            limit=limit
        )
        
        return Response({
            'success': True,
            'data': {
                'operations': operations,
                'count': len(operations)
            }
        })
        
    except ValueError as e:
        return Response(
            {'error': 'Invalid limit parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error listing user operations: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_operation(request, operation_id):
    """
    Cancel a running bulk operation.
    
    Args:
        request: HTTP request
        operation_id: Operation ID
        
    Returns:
        JSON response with cancellation status
    """
    try:
        operation_data = bulk_operation_manager.get_operation(operation_id)
        
        if not operation_data:
            return Response(
                {'error': 'Operation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has permission to cancel this operation
        if operation_data['user_id'] != request.user.id and not request.user.is_superuser:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if operation can be cancelled
        if operation_data['status'] not in ['pending', 'running']:
            return Response(
                {'error': f'Cannot cancel operation with status: {operation_data["status"]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cancel the operation
        success = bulk_operation_manager.cancel_operation(operation_id)
        
        if success:
            return Response({
                'success': True,
                'message': 'Operation cancelled successfully'
            })
        else:
            return Response(
                {'error': 'Failed to cancel operation'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        logger.error(f"Error cancelling operation {operation_id}: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_operation_statistics(request):
    """
    Get bulk operation statistics for the current user.
    
    Args:
        request: HTTP request
        
    Returns:
        JSON response with operation statistics
    """
    try:
        # Get statistics for current user (or all if superuser)
        user_id = None if request.user.is_superuser else request.user.id
        statistics = bulk_operation_manager.get_operation_statistics(user_id)
        
        return Response({
            'success': True,
            'data': statistics
        })
        
    except Exception as e:
        logger.error(f"Error getting operation statistics: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_bulk_athlete_import(request):
    """
    Start bulk athlete import operation.
    
    Args:
        request: HTTP request with CSV data and options
        
    Returns:
        JSON response with operation ID
    """
    try:
        # Validate request data
        if 'csv_data' not in request.data:
            raise ValidationError('CSV data is required')
        
        if 'school_id' not in request.data:
            raise ValidationError('School ID is required')
        
        csv_data = request.data['csv_data']
        school_id = request.data['school_id']
        options = request.data.get('options', {})
        
        # Count CSV rows to estimate total items
        import csv
        import io
        csv_file = io.StringIO(csv_data)
        reader = csv.DictReader(csv_file)
        total_items = sum(1 for _ in reader)
        
        # Create bulk operation
        operation_id = bulk_operation_manager.create_operation(
            operation_type='athlete_import',
            user_id=request.user.id,
            description=f'Import {total_items} athletes for school {school_id}',
            total_items=total_items,
            metadata={
                'school_id': school_id,
                'options': options
            }
        )
        
        # Start the Celery task
        from apps.athletes.tasks import bulk_import_athletes_task
        task = bulk_import_athletes_task.delay(school_id, csv_data, options)
        
        # Update operation with task ID
        bulk_operation_manager.start_operation(operation_id, task.id)
        
        return Response({
            'success': True,
            'data': {
                'operation_id': operation_id,
                'task_id': task.id,
                'total_items': total_items
            }
        }, status=status.HTTP_202_ACCEPTED)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error starting bulk athlete import: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_bulk_athlete_export(request):
    """
    Start bulk athlete export operation.
    
    Args:
        request: HTTP request with export filters
        
    Returns:
        JSON response with operation ID
    """
    try:
        school_id = request.data.get('school_id')
        filters = request.data.get('filters', {})
        
        # Create bulk operation
        operation_id = bulk_operation_manager.create_operation(
            operation_type='athlete_export',
            user_id=request.user.id,
            description=f'Export athletes for school {school_id or "all schools"}',
            metadata={
                'school_id': school_id,
                'filters': filters
            }
        )
        
        # Start the Celery task
        from apps.athletes.tasks import bulk_export_athletes_task
        task = bulk_export_athletes_task.delay(school_id, filters)
        
        # Update operation with task ID
        bulk_operation_manager.start_operation(operation_id, task.id)
        
        return Response({
            'success': True,
            'data': {
                'operation_id': operation_id,
                'task_id': task.id
            }
        }, status=status.HTTP_202_ACCEPTED)
        
    except Exception as e:
        logger.error(f"Error starting bulk athlete export: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_bulk_school_import(request):
    """
    Start bulk school import operation.
    
    Args:
        request: HTTP request with CSV data and options
        
    Returns:
        JSON response with operation ID
    """
    try:
        # Validate request data
        if 'csv_data' not in request.data:
            raise ValidationError('CSV data is required')
        
        csv_data = request.data['csv_data']
        options = request.data.get('options', {})
        
        # Count CSV rows to estimate total items
        import csv
        import io
        csv_file = io.StringIO(csv_data)
        reader = csv.DictReader(csv_file)
        total_items = sum(1 for _ in reader)
        
        # Create bulk operation
        operation_id = bulk_operation_manager.create_operation(
            operation_type='school_import',
            user_id=request.user.id,
            description=f'Import {total_items} schools',
            total_items=total_items,
            metadata={
                'options': options
            }
        )
        
        # Start the Celery task
        from apps.schools.tasks import bulk_import_schools_task
        task = bulk_import_schools_task.delay(csv_data, options, operation_id)
        
        # Update operation with task ID
        bulk_operation_manager.start_operation(operation_id, task.id)
        
        return Response({
            'success': True,
            'data': {
                'operation_id': operation_id,
                'task_id': task.id,
                'total_items': total_items
            }
        }, status=status.HTTP_202_ACCEPTED)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error starting bulk school import: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_bulk_tournament_import(request):
    """
    Start bulk tournament import operation.
    
    Args:
        request: HTTP request with CSV data and school ID
        
    Returns:
        JSON response with operation ID
    """
    try:
        # Validate request data
        if 'csv_data' not in request.data:
            raise ValidationError('CSV data is required')
        
        if 'school_id' not in request.data:
            raise ValidationError('School ID is required')
        
        csv_data = request.data['csv_data']
        school_id = request.data['school_id']
        options = request.data.get('options', {})
        
        # Count CSV rows to estimate total items
        import csv
        import io
        csv_file = io.StringIO(csv_data)
        reader = csv.DictReader(csv_file)
        total_items = sum(1 for _ in reader)
        
        # Create bulk operation
        operation_id = bulk_operation_manager.create_operation(
            operation_type='tournament_import',
            user_id=request.user.id,
            description=f'Import {total_items} tournaments for school {school_id}',
            total_items=total_items,
            metadata={
                'school_id': school_id,
                'options': options
            }
        )
        
        # Start the Celery task
        from apps.tournaments.tasks import bulk_import_tournaments_task
        task = bulk_import_tournaments_task.delay(csv_data, school_id, options, operation_id)
        
        # Update operation with task ID
        bulk_operation_manager.start_operation(operation_id, task.id)
        
        return Response({
            'success': True,
            'data': {
                'operation_id': operation_id,
                'task_id': task.id,
                'total_items': total_items
            }
        }, status=status.HTTP_202_ACCEPTED)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error starting bulk tournament import: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_bulk_data_migration(request):
    """
    Start bulk data migration operation.
    
    Args:
        request: HTTP request with migration parameters
        
    Returns:
        JSON response with operation ID
    """
    try:
        # Validate request data
        migration_type = request.data.get('migration_type')  # 'athlete_school_transfer'
        source_id = request.data.get('source_id')
        target_id = request.data.get('target_id')
        entity_ids = request.data.get('entity_ids', [])
        
        if not migration_type:
            raise ValidationError('Migration type is required')
        
        if not source_id or not target_id:
            raise ValidationError('Source and target IDs are required')
        
        if migration_type not in ['athlete_school_transfer']:
            raise ValidationError('Invalid migration type')
        
        # Create bulk operation
        operation_id = bulk_operation_manager.create_operation(
            operation_type=f'{migration_type}_migration',
            user_id=request.user.id,
            description=f'Migrate {len(entity_ids) if entity_ids else "all"} entities from {source_id} to {target_id}',
            total_items=len(entity_ids) if entity_ids else 0,
            metadata={
                'migration_type': migration_type,
                'source_id': source_id,
                'target_id': target_id
            }
        )
        
        # Start the appropriate Celery task
        if migration_type == 'athlete_school_transfer':
            from apps.athletes.tasks import bulk_athlete_data_migration_task
            task = bulk_athlete_data_migration_task.delay(source_id, target_id, entity_ids)
        
        # Update operation with task ID
        bulk_operation_manager.start_operation(operation_id, task.id)
        
        return Response({
            'success': True,
            'data': {
                'operation_id': operation_id,
                'task_id': task.id,
                'migration_type': migration_type
            }
        }, status=status.HTTP_202_ACCEPTED)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error starting bulk data migration: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_bulk_status_update(request):
    """
    Start bulk status update operation.
    
    Args:
        request: HTTP request with entity type, IDs, and status updates
        
    Returns:
        JSON response with operation ID
    """
    try:
        entity_type = request.data.get('entity_type')  # 'athlete', 'tournament', 'school'
        entity_ids = request.data.get('entity_ids', [])
        status_updates = request.data.get('status_updates', {})
        
        # Validate request data
        if not entity_type:
            raise ValidationError('Entity type is required')
        
        if not entity_ids:
            raise ValidationError('Entity IDs are required')
        
        if not status_updates:
            raise ValidationError('Status updates are required')
        
        if entity_type not in ['athlete', 'tournament', 'school']:
            raise ValidationError('Invalid entity type')
        
        # Create bulk operation
        operation_id = bulk_operation_manager.create_operation(
            operation_type=f'{entity_type}_status_update',
            user_id=request.user.id,
            description=f'Update status for {len(entity_ids)} {entity_type}s',
            total_items=len(entity_ids),
            metadata={
                'entity_type': entity_type,
                'status_updates': status_updates
            }
        )
        
        # Start the appropriate Celery task
        if entity_type == 'athlete':
            from apps.athletes.tasks import bulk_update_athlete_status_task
            task = bulk_update_athlete_status_task.delay(entity_ids, status_updates)
        elif entity_type == 'tournament':
            from apps.tournaments.tasks import bulk_update_tournament_status_task
            task = bulk_update_tournament_status_task.delay(entity_ids, status_updates)
        elif entity_type == 'school':
            from apps.schools.tasks import bulk_update_school_status_task
            task = bulk_update_school_status_task.delay(entity_ids, status_updates)
        
        # Update operation with task ID
        bulk_operation_manager.start_operation(operation_id, task.id)
        
        return Response({
            'success': True,
            'data': {
                'operation_id': operation_id,
                'task_id': task.id,
                'total_items': len(entity_ids)
            }
        }, status=status.HTTP_202_ACCEPTED)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error starting bulk status update: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )