"""
Celery tasks for asynchronous athlete operations.
"""
import logging
import csv
import io
from typing import Dict, Any, List
from celery import shared_task
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from .models import Athlete
from .serializers import AthleteCreateSerializer, AthleteBulkCreateSerializer
from apps.schools.models import School
from apps.notifications.tasks import send_guardian_registration_notification_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_import_athletes_task(self, school_id: int, csv_data: str, options: Dict[str, Any] = None, operation_id: str = None):
    """
    Asynchronous task to import athletes from CSV data.
    
    Args:
        school_id: School ID for the athletes
        csv_data: CSV content as string
        options: Import options (update_existing, etc.)
        operation_id: Bulk operation ID for progress tracking
        
    Returns:
        Dict with import results
    """
    try:
        from core.bulk_operations import bulk_operation_manager
        
        logger.info(f"Starting bulk athlete import for school {school_id}")
        
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
            'created_athletes': []
        }
        
        options = options or {}
        update_existing = options.get('update_existing', False)
        
        for row_num, row in enumerate(reader, start=1):
            try:
                # Prepare athlete data
                athlete_data = {
                    'full_name': row.get('full_name', '').strip(),
                    'full_name_nepali': row.get('full_name_nepali', '').strip(),
                    'gender': row.get('gender', '').strip(),
                    'date_of_birth': row.get('date_of_birth', '').strip(),
                    'school_id': school.school_id,
                    'guardian_name': row.get('guardian_name', '').strip(),
                    'guardian_phone': row.get('guardian_phone', '').strip(),
                    'guardian_email': row.get('guardian_email', '').strip(),
                    'address': row.get('address', '').strip(),
                    'grade': row.get('grade', '').strip(),
                    'citizenship_no': row.get('citizenship_no', '').strip(),
                    'height_cm': row.get('height_cm', '').strip() or None,
                    'weight_kg': row.get('weight_kg', '').strip() or None,
                    'blood_group': row.get('blood_group', '').strip(),
                    'primary_sport': row.get('primary_sport', '').strip(),
                }
                
                # Remove empty values
                athlete_data = {k: v for k, v in athlete_data.items() if v}
                
                # Check if athlete already exists
                existing_athlete = None
                if athlete_data.get('citizenship_no'):
                    existing_athlete = Athlete.objects.filter(
                        citizenship_no=athlete_data['citizenship_no']
                    ).first()
                
                if existing_athlete and not update_existing:
                    results['errors'].append({
                        'row': row_num,
                        'message': f'Athlete with citizenship {athlete_data["citizenship_no"]} already exists'
                    })
                    results['failed_imports'] += 1
                    continue
                
                # Create or update athlete
                if existing_athlete and update_existing:
                    # Update existing athlete
                    serializer = AthleteCreateSerializer(existing_athlete, data=athlete_data, partial=True)
                    if serializer.is_valid():
                        athlete = serializer.save()
                        results['created_athletes'].append({
                            'id': athlete.id,
                            'athlete_id': athlete.athlete_id,
                            'full_name': athlete.full_name,
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
                    # Create new athlete
                    serializer = AthleteCreateSerializer(data=athlete_data)
                    if serializer.is_valid():
                        athlete = serializer.save()
                        results['created_athletes'].append({
                            'id': athlete.id,
                            'athlete_id': athlete.athlete_id,
                            'full_name': athlete.full_name,
                            'action': 'created'
                        })
                        results['successful_imports'] += 1
                        
                        # Send guardian notification if contact info provided
                        if athlete_data.get('guardian_phone') or athlete_data.get('guardian_email'):
                            send_guardian_registration_notification_task.delay({
                                'athlete_id': athlete.id,
                                'full_name': athlete.full_name,
                                'athlete_id': athlete.athlete_id,
                                'guardian_phone': athlete_data.get('guardian_phone'),
                                'guardian_email': athlete_data.get('guardian_email'),
                                'school_name': school.name
                            })
                    else:
                        results['errors'].append({
                            'row': row_num,
                            'message': f'Validation error: {serializer.errors}'
                        })
                        results['failed_imports'] += 1
                
                results['total_processed'] += 1
                
                # Update progress every 10 items
                if operation_id and results['total_processed'] % 10 == 0:
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
            
            # Send notification
            send_bulk_operation_notification_task.delay(
                operation_id,
                school.admin_user.id if school.admin_user else None,
                'athlete_import',
                results
            )
        
        logger.info(f"Bulk import completed: {results['successful_imports']} successful, {results['failed_imports']} failed")
        return results
        
    except Exception as exc:
        logger.error(f"Bulk athlete import task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_export_athletes_task(self, school_id: int = None, filters: Dict[str, Any] = None):
    """
    Asynchronous task to export athletes to CSV.
    
    Args:
        school_id: Optional school ID to filter athletes
        filters: Additional filters for athlete export
        
    Returns:
        Dict with export results including CSV content
    """
    try:
        logger.info(f"Starting bulk athlete export for school {school_id}")
        
        # Build queryset
        queryset = Athlete.objects.select_related('school').filter(is_active=True)
        
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        
        # Apply additional filters
        if filters:
            if filters.get('verification_status'):
                queryset = queryset.filter(verification_status=filters['verification_status'])
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('gender'):
                queryset = queryset.filter(gender=filters['gender'])
            if filters.get('grade'):
                queryset = queryset.filter(grade=filters['grade'])
        
        # Generate CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        headers = [
            'athlete_id', 'full_name', 'full_name_nepali', 'gender', 'date_of_birth',
            'grade', 'school_name', 'guardian_name', 'guardian_phone', 'guardian_email',
            'address', 'citizenship_no', 'height_cm', 'weight_kg', 'blood_group',
            'primary_sport', 'is_active', 'verification_status',
            'profile_completion', 'created_at'
        ]
        writer.writerow(headers)
        
        # Write data rows
        exported_count = 0
        for athlete in queryset:
            row = [
                athlete.athlete_id,
                athlete.full_name,
                athlete.full_name_nepali or '',
                athlete.gender,
                athlete.date_of_birth.strftime('%Y-%m-%d') if athlete.date_of_birth else '',
                getattr(athlete, 'grade', ''),
                athlete.school.name if athlete.school else '',
                getattr(athlete, 'guardian_name', ''),
                getattr(athlete, 'guardian_phone', ''),
                getattr(athlete, 'guardian_email', ''),
                athlete.address or '',
                athlete.citizenship_no or '',
                athlete.height_cm or '',
                athlete.weight_kg or '',
                athlete.blood_group or '',
                athlete.primary_sport or '',
                'Active' if athlete.is_active else 'Inactive',
                athlete.verification_status,
                athlete.profile_completion,
                athlete.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ]
            writer.writerow(row)
            exported_count += 1
        
        csv_content = output.getvalue()
        output.close()
        
        logger.info(f"Athlete export completed: {exported_count} athletes exported")
        
        return {
            'success': True,
            'exported_count': exported_count,
            'csv_content': csv_content,
            'filename': f'athletes_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv',
            'message': f'Successfully exported {exported_count} athletes'
        }
        
    except Exception as exc:
        logger.error(f"Bulk athlete export task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_update_athlete_status_task(self, athlete_ids: List[int], status_updates: Dict[str, Any]):
    """
    Asynchronous task to update status for multiple athletes.
    
    Args:
        athlete_ids: List of athlete IDs to update
        status_updates: Dictionary of status fields to update
        
    Returns:
        Dict with update results
    """
    try:
        logger.info(f"Starting bulk status update for {len(athlete_ids)} athletes")
        
        # Validate status updates
        allowed_fields = [
            'is_active', 'verification_status', 'profile_status',
            'document_verified', 'guardian_verified'
        ]
        
        updates = {k: v for k, v in status_updates.items() if k in allowed_fields}
        
        if not updates:
            return {
                'success': False,
                'message': 'No valid status fields provided for update'
            }
        
        # Perform bulk update
        with transaction.atomic():
            updated_count = Athlete.objects.filter(
                id__in=athlete_ids,
                is_active=True
            ).update(**updates)
        
        logger.info(f"Bulk status update completed: {updated_count} athletes updated")
        
        return {
            'success': True,
            'updated_count': updated_count,
            'updates_applied': updates,
            'message': f'Successfully updated {updated_count} athletes'
        }
        
    except Exception as exc:
        logger.error(f"Bulk athlete status update task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def recalculate_profile_completion_task(self, athlete_ids: List[int] = None):
    """
    Asynchronous task to recalculate profile completion for athletes.
    
    Args:
        athlete_ids: Optional list of specific athlete IDs, if None processes all
        
    Returns:
        Dict with recalculation results
    """
    try:
        logger.info("Starting profile completion recalculation")
        
        # Build queryset
        if athlete_ids:
            queryset = Athlete.objects.filter(id__in=athlete_ids, is_active=True)
        else:
            queryset = Athlete.objects.filter(is_active=True)
        
        updated_count = 0
        
        # Process in batches to avoid memory issues
        batch_size = 100
        for i in range(0, queryset.count(), batch_size):
            batch = queryset[i:i + batch_size]
            
            for athlete in batch:
                old_completion = athlete.profile_completion
                new_completion = athlete.calculate_profile_completion()
                
                if old_completion != new_completion:
                    athlete.profile_completion = new_completion
                    athlete.save(update_fields=['profile_completion', 'profile_status'])
                    updated_count += 1
        
        logger.info(f"Profile completion recalculation completed: {updated_count} athletes updated")
        
        return {
            'success': True,
            'processed_count': queryset.count(),
            'updated_count': updated_count,
            'message': f'Recalculated profile completion for {queryset.count()} athletes, {updated_count} updated'
        }
        
    except Exception as exc:
        logger.error(f"Profile completion recalculation task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_athlete_data_migration_task(self, source_school_id: int, target_school_id: int, athlete_ids: List[int] = None):
    """
    Asynchronous task to migrate athletes between schools.
    
    Args:
        source_school_id: Source school ID
        target_school_id: Target school ID
        athlete_ids: Optional list of specific athlete IDs to migrate
        
    Returns:
        Dict with migration results
    """
    try:
        logger.info(f"Starting athlete migration from school {source_school_id} to {target_school_id}")
        
        # Get schools
        try:
            source_school = School.objects.get(school_id=source_school_id)
            target_school = School.objects.get(school_id=target_school_id)
        except School.DoesNotExist as e:
            return {
                'success': False,
                'message': f'School not found: {str(e)}'
            }
        
        # Build queryset
        if athlete_ids:
            queryset = Athlete.objects.filter(
                id__in=athlete_ids,
                school=source_school,
                is_active=True
            )
        else:
            queryset = Athlete.objects.filter(
                school=source_school,
                is_active=True
            )
        
        migrated_count = 0
        migration_errors = []
        
        # Perform migration in batches
        with transaction.atomic():
            for athlete in queryset:
                try:
                    # Update athlete's school
                    athlete.school = target_school
                    athlete.save(update_fields=['school'])
                    migrated_count += 1
                    
                except Exception as e:
                    migration_errors.append({
                        'athlete_id': athlete.athlete_id,
                        'error': str(e)
                    })
        
        logger.info(f"Athlete migration completed: {migrated_count} athletes migrated")
        
        return {
            'success': True,
            'migrated_count': migrated_count,
            'error_count': len(migration_errors),
            'errors': migration_errors,
            'message': f'Successfully migrated {migrated_count} athletes'
        }
        
    except Exception as exc:
        logger.error(f"Athlete migration task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_bulk_operation_notification_task(self, operation_id: str, user_id: int, operation_type: str, results: Dict[str, Any]):
    """
    Send notification about bulk operation completion.
    
    Args:
        operation_id: Bulk operation ID
        user_id: User ID who initiated the operation
        operation_type: Type of operation
        results: Operation results
        
    Returns:
        Dict with notification result
    """
    try:
        from apps.authentication.models import User
        from apps.notifications.tasks import send_email_task
        
        logger.info(f"Sending bulk operation notification for operation {operation_id}")
        
        # Get user
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return {
                'success': False,
                'message': f'User {user_id} not found'
            }
        
        # Prepare notification content
        subject = f"Bulk Operation Completed: {operation_type.replace('_', ' ').title()}"
        
        if results.get('success', False):
            status_text = "completed successfully"
            status_color = "green"
        else:
            status_text = "failed"
            status_color = "red"
        
        content = f"""
        Dear {user.full_name},
        
        Your bulk operation has {status_text}.
        
        Operation Details:
        - Type: {operation_type.replace('_', ' ').title()}
        - Operation ID: {operation_id}
        - Status: {status_text.title()}
        
        Results:
        - Total Processed: {results.get('total_processed', 0)}
        - Successful: {results.get('successful_imports', results.get('successful_creations', results.get('updated_count', 0)))}
        - Failed: {results.get('failed_imports', results.get('failed_creations', 0))}
        
        You can view detailed results in your dashboard.
        
        Best regards,
        Athletiq Team
        """
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: {status_color};">Bulk Operation {status_text.title()}</h2>
            
            <p>Dear {user.full_name},</p>
            
            <p>Your bulk operation has <strong style="color: {status_color};">{status_text}</strong>.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Operation Details:</h3>
                <ul>
                    <li><strong>Type:</strong> {operation_type.replace('_', ' ').title()}</li>
                    <li><strong>Operation ID:</strong> {operation_id}</li>
                    <li><strong>Status:</strong> <span style="color: {status_color};">{status_text.title()}</span></li>
                </ul>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Results:</h3>
                <ul>
                    <li><strong>Total Processed:</strong> {results.get('total_processed', 0)}</li>
                    <li><strong>Successful:</strong> {results.get('successful_imports', results.get('successful_creations', results.get('updated_count', 0)))}</li>
                    <li><strong>Failed:</strong> {results.get('failed_imports', results.get('failed_creations', 0))}</li>
                </ul>
            </div>
            
            <p>You can view detailed results in your dashboard.</p>
            
            <p>Best regards,<br>Athletiq Team</p>
        </div>
        """
        
        # Send email notification
        email_result = send_email_task.apply(args=[
            user.email,
            subject,
            content,
            html_content,
            'bulk_operation_notification',
            {
                'user_name': user.full_name,
                'operation_type': operation_type,
                'operation_id': operation_id,
                'results': results
            },
            user.full_name
        ])
        
        logger.info(f"Bulk operation notification sent for operation {operation_id}")
        
        return {
            'success': True,
            'message': 'Notification sent successfully',
            'email_result': email_result.result if email_result else None
        }
        
    except Exception as exc:
        logger.error(f"Bulk operation notification task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))