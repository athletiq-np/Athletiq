"""
Celery tasks for asynchronous school operations.
"""
import logging
import csv
import io
from typing import Dict, Any, List
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from .models import School
from .serializers import SchoolRegistrationSerializer

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_create_schools_task(self, schools_data: List[Dict[str, Any]]):
    """
    Asynchronous task to create multiple schools.
    
    Args:
        schools_data: List of school data dictionaries
        
    Returns:
        Dict with creation results
    """
    try:
        logger.info(f"Starting bulk school creation for {len(schools_data)} schools")
        
        results = {
            'success': True,
            'total_processed': 0,
            'successful_creations': 0,
            'failed_creations': 0,
            'errors': [],
            'created_schools': []
        }
        
        for index, school_data in enumerate(schools_data):
            try:
                # Validate and create school
                serializer = SchoolRegistrationSerializer(data=school_data)
                if serializer.is_valid():
                    school = serializer.save()
                    results['created_schools'].append({
                        'id': school.id,
                        'school_id': school.school_id,
                        'name': school.name,
                        'school_code': school.school_code
                    })
                    results['successful_creations'] += 1
                else:
                    results['errors'].append({
                        'index': index,
                        'data': school_data.get('name', 'Unknown'),
                        'message': f'Validation error: {serializer.errors}'
                    })
                    results['failed_creations'] += 1
                
                results['total_processed'] += 1
                
            except Exception as e:
                logger.error(f"Error creating school at index {index}: {str(e)}")
                results['errors'].append({
                    'index': index,
                    'data': school_data.get('name', 'Unknown'),
                    'message': str(e)
                })
                results['failed_creations'] += 1
                results['total_processed'] += 1
        
        logger.info(f"Bulk school creation completed: {results['successful_creations']} successful, {results['failed_creations']} failed")
        return results
        
    except Exception as exc:
        logger.error(f"Bulk school creation task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_export_schools_task(self, filters: Dict[str, Any] = None):
    """
    Asynchronous task to export schools to CSV.
    
    Args:
        filters: Optional filters for school export
        
    Returns:
        Dict with export results including CSV content
    """
    try:
        logger.info("Starting bulk school export")
        
        # Build queryset
        queryset = School.objects.filter(is_active=True)
        
        # Apply filters
        if filters:
            if filters.get('country'):
                queryset = queryset.filter(country=filters['country'])
            if filters.get('province'):
                queryset = queryset.filter(province=filters['province'])
            if filters.get('district'):
                queryset = queryset.filter(district=filters['district'])
            if filters.get('school_type'):
                queryset = queryset.filter(school_type=filters['school_type'])
            if filters.get('verification_status'):
                queryset = queryset.filter(verification_status=filters['verification_status'])
        
        # Generate CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        headers = [
            'school_id', 'school_code', 'name', 'name_nepali', 'school_type',
            'address', 'country', 'province', 'district', 'city',
            'phone', 'email', 'website', 'principal_name', 'principal_phone',
            'principal_email', 'established_year', 'total_students',
            'verification_status', 'created_at'
        ]
        writer.writerow(headers)
        
        # Write data rows
        exported_count = 0
        for school in queryset:
            row = [
                school.school_id,
                school.school_code,
                school.name,
                school.name_nepali or '',
                school.school_type or '',
                school.address or '',
                school.country,
                school.province,
                school.district,
                school.city,
                school.phone or '',
                school.email or '',
                school.website or '',
                school.principal_name or '',
                school.principal_phone or '',
                school.principal_email or '',
                school.established_year or '',
                school.total_students or '',
                school.verification_status,
                school.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ]
            writer.writerow(row)
            exported_count += 1
        
        csv_content = output.getvalue()
        output.close()
        
        logger.info(f"School export completed: {exported_count} schools exported")
        
        return {
            'success': True,
            'exported_count': exported_count,
            'csv_content': csv_content,
            'filename': f'schools_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv',
            'message': f'Successfully exported {exported_count} schools'
        }
        
    except Exception as exc:
        logger.error(f"Bulk school export task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_update_school_status_task(self, school_ids: List[int], status_updates: Dict[str, Any]):
    """
    Asynchronous task to update status for multiple schools.
    
    Args:
        school_ids: List of school IDs to update
        status_updates: Dictionary of status fields to update
        
    Returns:
        Dict with update results
    """
    try:
        logger.info(f"Starting bulk status update for {len(school_ids)} schools")
        
        # Validate status updates
        allowed_fields = [
            'verification_status', 'registration_status'
        ]
        
        updates = {k: v for k, v in status_updates.items() if k in allowed_fields}
        
        if not updates:
            return {
                'success': False,
                'message': 'No valid status fields provided for update'
            }
        
        # Perform bulk update
        with transaction.atomic():
            updated_count = School.objects.filter(
                id__in=school_ids,
                is_active=True
            ).update(**updates)
        
        logger.info(f"Bulk school status update completed: {updated_count} schools updated")
        
        return {
            'success': True,
            'updated_count': updated_count,
            'updates_applied': updates,
            'message': f'Successfully updated {updated_count} schools'
        }
        
    except Exception as exc:
        logger.error(f"Bulk school status update task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_school_statistics_task(self, school_ids: List[int] = None):
    """
    Asynchronous task to generate statistics for schools.
    
    Args:
        school_ids: Optional list of specific school IDs
        
    Returns:
        Dict with statistics generation results
    """
    try:
        logger.info("Starting school statistics generation")
        
        # Build queryset
        if school_ids:
            queryset = School.objects.filter(id__in=school_ids, is_active=True)
        else:
            queryset = School.objects.filter(is_active=True)
        
        statistics_generated = 0
        statistics = []
        
        for school in queryset:
            try:
                # Generate school statistics
                from apps.athletes.models import Athlete
                from apps.tournaments.models import Tournament
                
                athlete_count = Athlete.objects.filter(school=school, is_active=True).count()
                verified_athletes = Athlete.objects.filter(
                    school=school, 
                    is_active=True,
                    verification_status='verified'
                ).count()
                
                tournament_count = Tournament.objects.filter(school=school, is_active=True).count()
                active_tournaments = Tournament.objects.filter(
                    school=school,
                    is_active=True,
                    status='active'
                ).count()
                
                stats_data = {
                    'school_id': school.school_id,
                    'school_name': school.name,
                    'total_athletes': athlete_count,
                    'verified_athletes': verified_athletes,
                    'verification_rate': (verified_athletes / athlete_count * 100) if athlete_count > 0 else 0,
                    'total_tournaments': tournament_count,
                    'active_tournaments': active_tournaments,
                    'generated_at': timezone.now().isoformat()
                }
                
                statistics.append(stats_data)
                statistics_generated += 1
                
            except Exception as e:
                logger.error(f"Error generating statistics for school {school.school_id}: {str(e)}")
        
        logger.info(f"School statistics generation completed: {statistics_generated} statistics generated")
        
        return {
            'success': True,
            'processed_count': queryset.count(),
            'statistics_generated': statistics_generated,
            'statistics': statistics,
            'message': f'Generated statistics for {statistics_generated} schools'
        }
        
    except Exception as exc:
        logger.error(f"School statistics generation task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def bulk_import_schools_task(self, csv_data: str, options: Dict[str, Any] = None, operation_id: str = None):
    """
    Asynchronous task to import schools from CSV data.
    
    Args:
        csv_data: CSV content as string
        options: Import options (update_existing, etc.)
        operation_id: Bulk operation ID for progress tracking
        
    Returns:
        Dict with import results
    """
    try:
        from core.bulk_operations import bulk_operation_manager
        
        logger.info("Starting bulk school import")
        
        # Parse CSV data
        csv_file = io.StringIO(csv_data)
        reader = csv.DictReader(csv_file)
        
        results = {
            'success': True,
            'total_processed': 0,
            'successful_imports': 0,
            'failed_imports': 0,
            'errors': [],
            'created_schools': []
        }
        
        options = options or {}
        update_existing = options.get('update_existing', False)
        
        for row_num, row in enumerate(reader, start=1):
            try:
                # Prepare school data
                school_data = {
                    'name': row.get('name', '').strip(),
                    'name_nepali': row.get('name_nepali', '').strip(),
                    'school_code': row.get('school_code', '').strip(),
                    'school_type': row.get('school_type', '').strip(),
                    'address': row.get('address', '').strip(),
                    'country': row.get('country', 'Nepal').strip(),
                    'province': row.get('province', '').strip(),
                    'district': row.get('district', '').strip(),
                    'city': row.get('city', '').strip(),
                    'phone': row.get('phone', '').strip(),
                    'email': row.get('email', '').strip(),
                    'website': row.get('website', '').strip(),
                    'principal_name': row.get('principal_name', '').strip(),
                    'principal_phone': row.get('principal_phone', '').strip(),
                    'principal_email': row.get('principal_email', '').strip(),
                    'established_year': row.get('established_year', '').strip() or None,
                }
                
                # Remove empty values
                school_data = {k: v for k, v in school_data.items() if v}
                
                # Check if school already exists
                existing_school = None
                if school_data.get('school_code'):
                    existing_school = School.objects.filter(
                        school_code=school_data['school_code']
                    ).first()
                
                if existing_school and not update_existing:
                    results['errors'].append({
                        'row': row_num,
                        'message': f'School with code {school_data["school_code"]} already exists'
                    })
                    results['failed_imports'] += 1
                    continue
                
                # Create or update school
                if existing_school and update_existing:
                    # Update existing school
                    serializer = SchoolRegistrationSerializer(existing_school, data=school_data, partial=True)
                    if serializer.is_valid():
                        school = serializer.save()
                        results['created_schools'].append({
                            'id': school.id,
                            'school_id': school.school_id,
                            'name': school.name,
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
                    # Create new school
                    serializer = SchoolRegistrationSerializer(data=school_data)
                    if serializer.is_valid():
                        school = serializer.save()
                        results['created_schools'].append({
                            'id': school.id,
                            'school_id': school.school_id,
                            'name': school.name,
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
        
        logger.info(f"Bulk school import completed: {results['successful_imports']} successful, {results['failed_imports']} failed")
        return results
        
    except Exception as exc:
        logger.error(f"Bulk school import task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def sync_school_data_task(self, school_ids: List[int] = None):
    """
    Asynchronous task to synchronize school data with external systems.
    
    Args:
        school_ids: Optional list of specific school IDs to sync
        
    Returns:
        Dict with synchronization results
    """
    try:
        logger.info("Starting school data synchronization")
        
        # Build queryset
        if school_ids:
            queryset = School.objects.filter(id__in=school_ids, is_active=True)
        else:
            queryset = School.objects.filter(is_active=True)
        
        synced_count = 0
        sync_errors = []
        
        for school in queryset:
            try:
                # Update athlete counts
                from apps.athletes.models import Athlete
                
                total_athletes = Athlete.objects.filter(school=school, is_active=True).count()
                
                # Update school record
                if hasattr(school, 'total_students'):
                    school.total_students = total_athletes
                    school.save(update_fields=['total_students'])
                
                synced_count += 1
                
            except Exception as e:
                logger.error(f"Error syncing school {school.school_id}: {str(e)}")
                sync_errors.append({
                    'school_id': school.school_id,
                    'error': str(e)
                })
        
        logger.info(f"School data synchronization completed: {synced_count} schools synced")
        
        return {
            'success': True,
            'processed_count': queryset.count(),
            'synced_count': synced_count,
            'error_count': len(sync_errors),
            'errors': sync_errors,
            'message': f'Synchronized data for {synced_count} schools'
        }
        
    except Exception as exc:
        logger.error(f"School data synchronization task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))