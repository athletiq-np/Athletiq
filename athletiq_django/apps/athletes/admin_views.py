# apps/athletes/admin_views.py

"""
SuperAdmin views for athlete management.
"""
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from core.permissions import IsSuperAdmin
from core.utils.responses import success_response, error_response, validation_error_response
from .models import Athlete
from .serializers import AthleteSerializer
from apps.schools.models import School

@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def admin_athletes_advanced_list_view(request):
    """
    SuperAdmin view to list all athletes with advanced filtering and analytics.
    """
    try:
        athletes = Athlete.objects.all().select_related('school', 'user').order_by('-created_at')
        
        # Apply filters
        search = request.GET.get('search', '')
        school_filter = request.GET.get('school', '')
        status_filter = request.GET.get('status', '')
        verification_filter = request.GET.get('verification', '')
        age_range = request.GET.get('age_range', '')
        sport_filter = request.GET.get('sport', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        if search:
            athletes = athletes.filter(
                Q(full_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(school__name__icontains=search) |
                Q(school__school_code__icontains=search)
            )
        
        if school_filter:
            athletes = athletes.filter(school_id=school_filter)
        
        if status_filter:
            if status_filter == 'active':
                athletes = athletes.filter(is_active=True)
            elif status_filter == 'inactive':
                athletes = athletes.filter(is_active=False)
        
        if verification_filter:
            if verification_filter == 'verified':
                athletes = athletes.filter(user__email_verified=True)
            elif verification_filter == 'unverified':
                athletes = athletes.filter(user__email_verified=False)
        
        if age_range:
            # Parse age range like "13-16" or "17+"
            if '-' in age_range:
                min_age, max_age = map(int, age_range.split('-'))
                min_birth_date = timezone.now().date() - timedelta(days=max_age*365)
                max_birth_date = timezone.now().date() - timedelta(days=min_age*365)
                athletes = athletes.filter(dob__range=[min_birth_date, max_birth_date])
            elif '+' in age_range:
                min_age = int(age_range.replace('+', ''))
                max_birth_date = timezone.now().date() - timedelta(days=min_age*365)
                athletes = athletes.filter(dob__lte=max_birth_date)
        
        if date_from:
            athletes = athletes.filter(created_at__gte=date_from)
        
        if date_to:
            athletes = athletes.filter(created_at__lte=date_to)
        
        # Paginate results
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = athletes.count()
        athletes_page = athletes[start:end]
        
        # Serialize athlete data with enhanced information
        athletes_data = []
        for athlete in athletes_page:
            athletes_data.append({
                'id': athlete.id,
                'full_name': athlete.full_name,
                'email': athlete.user.email if athlete.user else None,
                'dob': athlete.dob,
                'school': {
                    'id': athlete.school.id if athlete.school else None,
                    'name': athlete.school.name if athlete.school else None,
                    'school_code': athlete.school.school_code if athlete.school else None,
                } if athlete.school else None,
                'is_active': athlete.is_active,
                'profile_complete': getattr(athlete, 'profile_complete', False),
                'created_at': athlete.created_at.isoformat() if athlete.created_at else None,
                'last_updated': athlete.updated_at.isoformat() if hasattr(athlete, 'updated_at') and athlete.updated_at else None,
                'verification_status': athlete.user.email_verified if athlete.user else False,
                'age': calculate_age(athlete.dob) if athlete.dob else None,
            })
        
        # Calculate analytics
        analytics = {
            'total_athletes': total_count,
            'active_athletes': athletes.filter(is_active=True).count(),
            'verified_athletes': athletes.filter(user__email_verified=True).count(),
            'athletes_by_school': get_athletes_by_school_stats(athletes),
            'age_distribution': get_age_distribution(athletes),
            'recent_registrations': get_recent_registrations_stats(),
        }
        
        return success_response(
            data={
                'athletes': athletes_data,
                'analytics': analytics,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total': total_count,
                    'pages': (total_count + page_size - 1) // page_size
                }
            },
            message=f'Retrieved {len(athletes_data)} athletes'
        )
        
    except Exception as e:
        return error_response(f'Failed to retrieve athletes: {str(e)}')


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def admin_bulk_athlete_operations_view(request):
    """
    SuperAdmin view for bulk athlete operations.
    """
    try:
        operation = request.data.get('operation')
        athlete_ids = request.data.get('athlete_ids', [])
        
        if not athlete_ids:
            return validation_error_response({'athlete_ids': ['Athlete IDs are required']})
        
        athletes = Athlete.objects.filter(id__in=athlete_ids)
        
        if operation == 'activate':
            athletes.update(is_active=True)
            message = f'Activated {len(athlete_ids)} athletes'
        elif operation == 'deactivate':
            athletes.update(is_active=False)
            message = f'Deactivated {len(athlete_ids)} athletes'
        elif operation == 'verify':
            # Verify associated user accounts
            for athlete in athletes:
                if athlete.user:
                    athlete.user.email_verified = True
                    athlete.user.save()
            message = f'Verified {len(athlete_ids)} athletes'
        elif operation == 'delete':
            # Soft delete by deactivating
            athletes.update(is_active=False)
            message = f'Deleted {len(athlete_ids)} athletes'
        elif operation == 'transfer_school':
            new_school_id = request.data.get('new_school_id')
            if not new_school_id:
                return validation_error_response({'new_school_id': ['New school ID is required for transfer operation']})
            
            try:
                new_school = School.objects.get(id=new_school_id)
                athletes.update(school=new_school)
                message = f'Transferred {len(athlete_ids)} athletes to {new_school.name}'
            except School.DoesNotExist:
                return error_response('School not found')
        else:
            return validation_error_response({'operation': ['Invalid operation']})
        
        return success_response(
            data={
                'operation': operation,
                'affected_athletes': len(athlete_ids),
                'athlete_ids': athlete_ids
            },
            message=message
        )
        
    except Exception as e:
        return error_response(f'Failed to perform bulk operation: {str(e)}')


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def admin_athlete_analytics_view(request):
    """
    SuperAdmin view to get comprehensive athlete analytics.
    """
    try:
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)
        
        # Basic statistics
        total_athletes = Athlete.objects.count()
        active_athletes = Athlete.objects.filter(is_active=True).count()
        verified_athletes = Athlete.objects.filter(user__email_verified=True).count()
        
        # Registration trends
        new_athletes_30_days = Athlete.objects.filter(created_at__gte=last_30_days).count()
        new_athletes_7_days = Athlete.objects.filter(created_at__gte=last_7_days).count()
        
        # School distribution
        athletes_by_school = Athlete.objects.values('school__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Age distribution
        age_groups = {
            'under_13': 0,
            '13_16': 0,
            '17_19': 0,
            'over_19': 0
        }
        
        athletes_with_dob = Athlete.objects.exclude(dob__isnull=True)
        for athlete in athletes_with_dob:
            age = calculate_age(athlete.dob)
            if age < 13:
                age_groups['under_13'] += 1
            elif 13 <= age <= 16:
                age_groups['13_16'] += 1
            elif 17 <= age <= 19:
                age_groups['17_19'] += 1
            else:
                age_groups['over_19'] += 1
        
        # Profile completion stats
        complete_profiles = Athlete.objects.filter(profile_complete=True).count()
        incomplete_profiles = total_athletes - complete_profiles
        
        # Monthly registration trends
        monthly_registrations = []
        for i in range(12):
            month_start = (now - timedelta(days=30*i)).replace(day=1)
            month_end = month_start + timedelta(days=32)
            month_end = month_end.replace(day=1) - timedelta(days=1)
            
            count = Athlete.objects.filter(
                created_at__gte=month_start,
                created_at__lte=month_end
            ).count()
            
            monthly_registrations.append({
                'month': month_start.strftime('%Y-%m'),
                'count': count
            })
        
        monthly_registrations.reverse()
        
        analytics_data = {
            'summary': {
                'total_athletes': total_athletes,
                'active_athletes': active_athletes,
                'verified_athletes': verified_athletes,
                'complete_profiles': complete_profiles,
                'incomplete_profiles': incomplete_profiles,
                'new_athletes_30_days': new_athletes_30_days,
                'new_athletes_7_days': new_athletes_7_days,
            },
            'distribution': {
                'by_school': list(athletes_by_school),
                'by_age_group': age_groups,
            },
            'trends': {
                'monthly_registrations': monthly_registrations,
            },
            'completion_rates': {
                'profile_completion_rate': (complete_profiles / total_athletes * 100) if total_athletes > 0 else 0,
                'verification_rate': (verified_athletes / total_athletes * 100) if total_athletes > 0 else 0,
            }
        }
        
        return success_response(
            data=analytics_data,
            message='Athlete analytics retrieved successfully'
        )
        
    except Exception as e:
        return error_response(f'Failed to retrieve athlete analytics: {str(e)}')


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def admin_athlete_export_view(request):
    """
    SuperAdmin view to export athlete data.
    """
    try:
        export_format = request.data.get('format', 'csv')  # 'csv', 'excel', 'json'
        filters = request.data.get('filters', {})
        
        # Apply filters to get the queryset
        athletes = Athlete.objects.all().select_related('school', 'user')
        
        if filters.get('school'):
            athletes = athletes.filter(school_id=filters['school'])
        if filters.get('status'):
            athletes = athletes.filter(is_active=filters['status'] == 'active')
        if filters.get('date_from'):
            athletes = athletes.filter(created_at__gte=filters['date_from'])
        if filters.get('date_to'):
            athletes = athletes.filter(created_at__lte=filters['date_to'])
        
        # Prepare export data
        export_data = []
        for athlete in athletes:
            export_data.append({
                'ID': athlete.id,
                'Full Name': athlete.full_name,
                'Email': athlete.user.email if athlete.user else '',
                'Date of Birth': athlete.dob.strftime('%Y-%m-%d') if athlete.dob else '',
                'Age': calculate_age(athlete.dob) if athlete.dob else '',
                'School': athlete.school.name if athlete.school else '',
                'School Code': athlete.school.school_code if athlete.school else '',
                'Status': 'Active' if athlete.is_active else 'Inactive',
                'Verified': 'Yes' if athlete.user and athlete.user.email_verified else 'No',
                'Profile Complete': 'Yes' if getattr(athlete, 'profile_complete', False) else 'No',
                'Registration Date': athlete.created_at.strftime('%Y-%m-%d %H:%M:%S') if athlete.created_at else '',
            })
        
        return success_response(
            data={
                'export_data': export_data,
                'total_records': len(export_data),
                'format': export_format,
                'generated_at': timezone.now().isoformat()
            },
            message=f'Exported {len(export_data)} athlete records'
        )
        
    except Exception as e:
        return error_response(f'Failed to export athlete data: {str(e)}')


# Helper functions

def calculate_age(birth_date):
    """Calculate age from birth date."""
    if not birth_date:
        return None
    
    today = timezone.now().date()
    age = today.year - birth_date.year
    
    if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
        age -= 1
    
    return age

def get_athletes_by_school_stats(athletes_queryset):
    """Get athlete count by school."""
    return list(athletes_queryset.values('school__name').annotate(
        count=Count('id')
    ).order_by('-count')[:10])

def get_age_distribution(athletes_queryset):
    """Get age distribution of athletes."""
    age_groups = {
        'under_13': 0,
        '13_16': 0,
        '17_19': 0,
        'over_19': 0
    }
    
    athletes_with_dob = athletes_queryset.exclude(dob__isnull=True)
    for athlete in athletes_with_dob:
        age = calculate_age(athlete.dob)
        if age is not None:
            if age < 13:
                age_groups['under_13'] += 1
            elif 13 <= age <= 16:
                age_groups['13_16'] += 1
            elif 17 <= age <= 19:
                age_groups['17_19'] += 1
            else:
                age_groups['over_19'] += 1
    
    return age_groups

def get_recent_registrations_stats():
    """Get recent registration statistics."""
    now = timezone.now()
    last_7_days = now - timedelta(days=7)
    
    daily_stats = []
    for i in range(7):
        date = now - timedelta(days=i)
        count = Athlete.objects.filter(
            created_at__date=date.date()
        ).count()
        
        daily_stats.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })
    
    return list(reversed(daily_stats))