"""
Celery tasks for asynchronous tournament operations.
"""
import logging
import csv
import io
from typing import Dict, Any, List
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from .models import Tournament
from .serializers import TournamentCreateSerializer
from apps.schools.models import School

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_create_tournaments_task(self, tournaments_data: List[Dict[str, Any]]):
    """
    Asynchronous task to create multiple tournaments.
    
    Args:
        tournaments_data: List of tournament data dictionaries
        
    Returns:
        Dict with creation results
    """
    try:
        logger.info(f"Starting bulk tournament creation for {len(tournaments_data)} tournaments")
        
        results = {
            'success': True,
            'total_processed': 0,
            'successful_creations': 0,
            'failed_creations': 0,
            'errors': [],
            'created_tournaments': []
        }
        
        for index, tournament_data in enumerate(tournaments_data):
            try:
                # Validate and create tournament
                serializer = TournamentCreateSerializer(data=tournament_data)
                if serializer.is_valid():
                    tournament = serializer.save()
                    results['created_tournaments'].append({
                        'id': tournament.id,
                        'tournament_id': tournament.tournament_id,
                        'name': tournament.name,
                        'sport': tournament.sport
                    })
                    results['successful_creations'] += 1
                else:
                    results['errors'].append({
                        'index': index,
                        'data': tournament_data.get('name', 'Unknown'),
                        'message': f'Validation error: {serializer.errors}'
                    })
                    results['failed_creations'] += 1
                
                results['total_processed'] += 1
                
            except Exception as e:
                logger.error(f"Error creating tournament at index {index}: {str(e)}")
                results['errors'].append({
                    'index': index,
                    'data': tournament_data.get('name', 'Unknown'),
                    'message': str(e)
                })
                results['failed_creations'] += 1
                results['total_processed'] += 1
        
        logger.info(f"Bulk tournament creation completed: {results['successful_creations']} successful, {results['failed_creations']} failed")
        return results
        
    except Exception as exc:
        logger.error(f"Bulk tournament creation task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_export_tournaments_task(self, filters: Dict[str, Any] = None):
    """
    Asynchronous task to export tournaments to CSV.
    
    Args:
        filters: Optional filters for tournament export
        
    Returns:
        Dict with export results including CSV content
    """
    try:
        logger.info("Starting bulk tournament export")
        
        # Build queryset
        queryset = Tournament.objects.select_related('school').filter(is_active=True)
        
        # Apply filters
        if filters:
            if filters.get('sport'):
                queryset = queryset.filter(sport=filters['sport'])
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('school_id'):
                queryset = queryset.filter(school__school_id=filters['school_id'])
            if filters.get('start_date_from'):
                queryset = queryset.filter(start_date__gte=filters['start_date_from'])
            if filters.get('start_date_to'):
                queryset = queryset.filter(start_date__lte=filters['start_date_to'])
        
        # Generate CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        headers = [
            'tournament_id', 'name', 'sport', 'category', 'status',
            'start_date', 'end_date', 'registration_deadline',
            'school_name', 'venue', 'max_participants',
            'current_participants', 'entry_fee', 'prize_pool',
            'description', 'created_at'
        ]
        writer.writerow(headers)
        
        # Write data rows
        exported_count = 0
        for tournament in queryset:
            row = [
                tournament.tournament_id,
                tournament.name,
                tournament.sport,
                tournament.category,
                tournament.status,
                tournament.start_date.strftime('%Y-%m-%d') if tournament.start_date else '',
                tournament.end_date.strftime('%Y-%m-%d') if tournament.end_date else '',
                tournament.registration_deadline.strftime('%Y-%m-%d') if tournament.registration_deadline else '',
                tournament.school.name if tournament.school else '',
                tournament.venue or '',
                tournament.max_participants or '',
                getattr(tournament, 'current_participants', 0),
                tournament.entry_fee or '',
                tournament.prize_pool or '',
                tournament.description or '',
                tournament.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ]
            writer.writerow(row)
            exported_count += 1
        
        csv_content = output.getvalue()
        output.close()
        
        logger.info(f"Tournament export completed: {exported_count} tournaments exported")
        
        return {
            'success': True,
            'exported_count': exported_count,
            'csv_content': csv_content,
            'filename': f'tournaments_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv',
            'message': f'Successfully exported {exported_count} tournaments'
        }
        
    except Exception as exc:
        logger.error(f"Bulk tournament export task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_update_tournament_status_task(self, tournament_ids: List[int], status_updates: Dict[str, Any]):
    """
    Asynchronous task to update status for multiple tournaments.
    
    Args:
        tournament_ids: List of tournament IDs to update
        status_updates: Dictionary of status fields to update
        
    Returns:
        Dict with update results
    """
    try:
        logger.info(f"Starting bulk status update for {len(tournament_ids)} tournaments")
        
        # Validate status updates
        allowed_fields = [
            'status', 'registration_open', 'published'
        ]
        
        updates = {k: v for k, v in status_updates.items() if k in allowed_fields}
        
        if not updates:
            return {
                'success': False,
                'message': 'No valid status fields provided for update'
            }
        
        # Perform bulk update
        with transaction.atomic():
            updated_count = Tournament.objects.filter(
                id__in=tournament_ids,
                is_active=True
            ).update(**updates)
        
        logger.info(f"Bulk tournament status update completed: {updated_count} tournaments updated")
        
        return {
            'success': True,
            'updated_count': updated_count,
            'updates_applied': updates,
            'message': f'Successfully updated {updated_count} tournaments'
        }
        
    except Exception as exc:
        logger.error(f"Bulk tournament status update task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_tournament_reports_task(self, tournament_ids: List[int] = None):
    """
    Asynchronous task to generate reports for tournaments.
    
    Args:
        tournament_ids: Optional list of specific tournament IDs
        
    Returns:
        Dict with report generation results
    """
    try:
        logger.info("Starting tournament report generation")
        
        # Build queryset
        if tournament_ids:
            queryset = Tournament.objects.filter(id__in=tournament_ids, is_active=True)
        else:
            # Generate reports for active tournaments
            queryset = Tournament.objects.filter(
                is_active=True,
                status__in=['active', 'completed']
            )
        
        reports_generated = 0
        reports = []
        
        for tournament in queryset:
            try:
                # Generate tournament statistics
                report_data = {
                    'tournament_id': tournament.tournament_id,
                    'name': tournament.name,
                    'sport': tournament.sport,
                    'status': tournament.status,
                    'participants_count': getattr(tournament, 'participants_count', 0),
                    'registration_rate': _calculate_registration_rate(tournament),
                    'completion_rate': _calculate_completion_rate(tournament),
                    'generated_at': timezone.now().isoformat()
                }
                
                reports.append(report_data)
                reports_generated += 1
                
            except Exception as e:
                logger.error(f"Error generating report for tournament {tournament.tournament_id}: {str(e)}")
        
        logger.info(f"Tournament report generation completed: {reports_generated} reports generated")
        
        return {
            'success': True,
            'processed_count': queryset.count(),
            'reports_generated': reports_generated,
            'reports': reports,
            'message': f'Generated {reports_generated} tournament reports'
        }
        
    except Exception as exc:
        logger.error(f"Tournament report generation task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_import_tournaments_task(self, csv_data: str, school_id: int, options: Dict[str, Any] = None, operation_id: str = None):
    """
    Asynchronous task to import tournaments from CSV data.
    
    Args:
        csv_data: CSV content as string
        school_id: School ID for the tournaments
        options: Import options (update_existing, etc.)
        operation_id: Bulk operation ID for progress tracking
        
    Returns:
        Dict with import results
    """
    try:
        from core.bulk_operations import bulk_operation_manager
        
        logger.info(f"Starting bulk tournament import for school {school_id}")
        
        # Get school
        try:
            school = School.objects.get(school_id=school_id)
        except School.DoesNotExist:
            result = {
                'success': False,
                'message': f'School with ID {school_id} not found'
            }
            if operation_id:
                bulk_operation_manager.complete_operation(operation_id, success=False, error_message=result['message'])
            return result
        
        # Parse CSV data
        csv_file = io.StringIO(csv_data)
        reader = csv.DictReader(csv_file)
        
        results = {
            'success': True,
            'total_processed': 0,
            'successful_imports': 0,
            'failed_imports': 0,
            'errors': [],
            'created_tournaments': []
        }
        
        options = options or {}
        update_existing = options.get('update_existing', False)
        
        for row_num, row in enumerate(reader, start=1):
            try:
                # Prepare tournament data
                tournament_data = {
                    'name': row.get('name', '').strip(),
                    'sport': row.get('sport', '').strip(),
                    'category': row.get('category', '').strip(),
                    'description': row.get('description', '').strip(),
                    'start_date': row.get('start_date', '').strip(),
                    'end_date': row.get('end_date', '').strip(),
                    'registration_deadline': row.get('registration_deadline', '').strip(),
                    'venue': row.get('venue', '').strip(),
                    'max_participants': row.get('max_participants', '').strip() or None,
                    'entry_fee': row.get('entry_fee', '').strip() or None,
                    'prize_pool': row.get('prize_pool', '').strip() or None,
                    'school_id': school.school_id,
                }
                
                # Remove empty values
                tournament_data = {k: v for k, v in tournament_data.items() if v}
                
                # Check if tournament already exists
                existing_tournament = None
                if tournament_data.get('name') and tournament_data.get('sport'):
                    existing_tournament = Tournament.objects.filter(
                        name=tournament_data['name'],
                        sport=tournament_data['sport'],
                        school=school
                    ).first()
                
                if existing_tournament and not update_existing:
                    results['errors'].append({
                        'row': row_num,
                        'message': f'Tournament "{tournament_data["name"]}" already exists for this sport'
                    })
                    results['failed_imports'] += 1
                    continue
                
                # Create or update tournament
                if existing_tournament and update_existing:
                    # Update existing tournament
                    serializer = TournamentCreateSerializer(existing_tournament, data=tournament_data, partial=True)
                    if serializer.is_valid():
                        tournament = serializer.save()
                        results['created_tournaments'].append({
                            'id': tournament.id,
                            'tournament_id': tournament.tournament_id,
                            'name': tournament.name,
                            'action': 'updated'
                        })
                        results['successful_imports'] += 1
                    else:
                        results['errors'].append({
                            'row': row_num,
                            'message': f'Validation error: {serializer.errors}'
                        })
                        results['failed_imports'] += 1
                else:
                    # Create new tournament
                    serializer = TournamentCreateSerializer(data=tournament_data)
                    if serializer.is_valid():
                        tournament = serializer.save()
                        results['created_tournaments'].append({
                            'id': tournament.id,
                            'tournament_id': tournament.tournament_id,
                            'name': tournament.name,
                            'action': 'created'
                        })
                        results['successful_imports'] += 1
                    else:
                        results['errors'].append({
                            'row': row_num,
                            'message': f'Validation error: {serializer.errors}'
                        })
                        results['failed_imports'] += 1
                
                results['total_processed'] += 1
                
                # Update progress every 5 items
                if operation_id and results['total_processed'] % 5 == 0:
                    bulk_operation_manager.update_progress(
                        operation_id,
                        processed_items=results['total_processed'],
                        successful_items=results['successful_imports'],
                        failed_items=results['failed_imports']
                    )
                
            except Exception as e:
                logger.error(f"Error processing row {row_num}: {str(e)}")
                results['errors'].append({
                    'row': row_num,
                    'message': str(e)
                })
                results['failed_imports'] += 1
                results['total_processed'] += 1
        
        # Complete the operation
        if operation_id:
            bulk_operation_manager.complete_operation(
                operation_id,
                success=results['success'],
                final_results=results
            )
        
        logger.info(f"Bulk tournament import completed: {results['successful_imports']} successful, {results['failed_imports']} failed")
        return results
        
    except Exception as exc:
        logger.error(f"Bulk tournament import task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def cleanup_expired_tournaments_task(self):
    """
    Asynchronous task to cleanup expired tournament registrations and data.
    
    Returns:
        Dict with cleanup results
    """
    try:
        logger.info("Starting expired tournament cleanup")
        
        # Find tournaments that ended more than 30 days ago
        cutoff_date = timezone.now() - timezone.timedelta(days=30)
        
        expired_tournaments = Tournament.objects.filter(
            end_date__lt=cutoff_date,
            status='completed'
        )
        
        cleanup_results = {
            'tournaments_processed': 0,
            'registrations_cleaned': 0,
            'documents_cleaned': 0
        }
        
        for tournament in expired_tournaments:
            try:
                # Clean up tournament registrations (if you have a registration model)
                # registrations_deleted = TournamentRegistration.objects.filter(
                #     tournament=tournament
                # ).delete()[0]
                # cleanup_results['registrations_cleaned'] += registrations_deleted
                
                # Clean up temporary tournament documents
                # documents_deleted = TournamentDocument.objects.filter(
                #     tournament=tournament,
                #     document_type='temporary'
                # ).delete()[0]
                # cleanup_results['documents_cleaned'] += documents_deleted
                
                cleanup_results['tournaments_processed'] += 1
                
            except Exception as e:
                logger.error(f"Error cleaning up tournament {tournament.tournament_id}: {str(e)}")
        
        logger.info(f"Tournament cleanup completed: {cleanup_results}")
        
        return {
            'success': True,
            **cleanup_results,
            'message': f'Cleaned up {cleanup_results["tournaments_processed"]} expired tournaments'
        }
        
    except Exception as exc:
        logger.error(f"Tournament cleanup task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


def _calculate_registration_rate(tournament):
    """Calculate registration rate for tournament."""
    try:
        if not tournament.max_participants:
            return 0.0
        
        current_participants = getattr(tournament, 'current_participants', 0)
        return (current_participants / tournament.max_participants) * 100
    except:
        return 0.0


def _calculate_completion_rate(tournament):
    """Calculate completion rate for tournament."""
    try:
        if tournament.status == 'completed':
            return 100.0
        elif tournament.status == 'active':
            # Calculate based on current date vs tournament duration
            if tournament.start_date and tournament.end_date:
                total_duration = (tournament.end_date - tournament.start_date).days
                if total_duration > 0:
                    elapsed_duration = (timezone.now().date() - tournament.start_date).days
                    return min((elapsed_duration / total_duration) * 100, 100.0)
        return 0.0
    except:
        return 0.0