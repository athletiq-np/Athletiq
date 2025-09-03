# apps/schools/admin_views.py

"""
SuperAdmin views for school management.
"""
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from core.permissions import IsSuperAdmin
from core.utils.responses import success_response, error_response, validation_error_response
from .models import School
from .serializers import SchoolSerializer
from apps.athletes.models import Athlete
from apps.tournaments.models import Tournament

@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def admin_schools_advanced_list_view(request):
    """
    SuperAdmin view to list all schools with advanced filtering and analytics.
    """
    try:
        schools = School.objects.all().order_by('-created_at')
        
        # Apply filters
        search = request.GET.get('search', '')
        province_filter = request.GET.get('province', '')
        city_filter = request.GET.get('city', '')
        status_filter = request.GET.get('status', '')
        type_filter = request.GET.get('type', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        if search:
            schools = schools.filter(
                Q(name__icontains=search) |
                Q(school_code__icontains=search) |
                Q(email__icontains=search) |
                Q(address__icontains=search)
            )
        
        if province_filter:
            schools = schools.filter(province__icontains=province_filter)
        
        if city_filter:
            schools = schools.filter(city__icontains=city_filter)
        
        if status_filter:
            if status_filter == 'active':
                schools = schools.filter(is_active=True)
            elif status_filter == 'inactive':
                schools = schools.filter(is_active=False)
        
        if type_filter:
            schools = schools.filter(school_type=type_filter)
        
        if date_from:
            schools = schools.filter(created_at__gte=date_from)
        
        if date_to:
            schools = schools.filter(created_at__lte=date_to)
        
        # Paginate results
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = schools.count()
        schools_page = schools[start:end]
        
        # Serialize school data with enhanced information
        schools_data = []
        for school in schools_page:
            # Get athlete count
            athlete_count = Athlete.objects.filter(school=school).count()
            active_athlete_count = Athlete.objects.filter(school=school, is_active=True).count()
            
            # Get tournament count
            tournament_count = Tournament.objects.filter(hosted_by=school.name).count()
            
            schools_data.append({
                'id': school.id,
                'name': school.name,
                'school_code': school.school_code,
                'email': school.email,
                'phone': school.phone,
                'address': school.address,
                'city': school.city,
                'province': school.province,
                'principal_name': school.principal_name,
                'school_type': getattr(school, 'school_type', 'Unknown'),
                'is_active': school.is_active,
                'created_at': school.created_at.isoformat() if school.created_at else None,
                'updated_at': school.updated_at.isoformat() if hasattr(school, 'updated_at') and school.updated_at else None,
                'statistics': {
                    'total_athletes': athlete_count,
                    'active_athletes': active_athlete_count,
                    'tournaments_hosted': tournament_count,
                },
                'admin_info': {
                    'admin_name': f"{school.admin.first_name} {school.admin.last_name}" if school.admin else 'Not assigned',
                    'admin_email': school.admin.email if school.admin else None,
                } if hasattr(school, 'admin') and school.admin else None
            })
        
        # Calculate analytics
        analytics = {
            'total_schools': total_count,
            'active_schools': schools.filter(is_active=True).count(),
            'schools_by_province': get_schools_by_province_stats(schools),
            'schools_by_type': get_schools_by_type_stats(schools),
            'athlete_distribution': get_athlete_distribution_stats(),
            'recent_registrations': get_recent_school_registrations_stats(),
        }
        
        return success_response(
            data={
                'schools': schools_data,
                'analytics': analytics,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total': total_count,
                    'pages': (total_count + page_size - 1) // page_size
                }
            },
            message=f'Retrieved {len(schools_data)} schools'
        )
        
    except Exception as e:
        return error_response(f'Failed to retrieve schools: {str(e)}')


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def admin_bulk_school_operations_view(request):
    """
    SuperAdmin view for bulk school operations.
    """
    try:
        operation = request.data.get('operation')
        school_ids = request.data.get('school_ids', [])
        
        if not school_ids:
            return validation_error_response({'school_ids': ['School IDs are required']})
        
        schools = School.objects.filter(id__in=school_ids)
        
        if operation == 'activate':
            schools.update(is_active=True)
            message = f'Activated {len(school_ids)} schools'
        elif operation == 'deactivate':
            schools.update(is_active=False)
            message = f'Deactivated {len(school_ids)} schools'
        elif operation == 'approve':
            schools.update(is_active=True, approved_at=timezone.now())
            message = f'Approved {len(school_ids)} schools'
        elif operation == 'delete':
            # Soft delete by deactivating
            schools.update(is_active=False)
            message = f'Deleted {len(school_ids)} schools'
        elif operation == 'update_type':
            new_type = request.data.get('new_type')
            if not new_type:
                return validation_error_response({'new_type': ['New school type is required']})
            
            schools.update(school_type=new_type)
            message = f'Updated school type for {len(school_ids)} schools'
        else:
            return validation_error_response({'operation': ['Invalid operation']})
        
        return success_response(
            data={
                'operation': operation,
                'affected_schools': len(school_ids),
                'school_ids': school_ids
            },
            message=message
        )
        
    except Exception as e:
        return error_response(f'Failed to perform bulk operation: {str(e)}')


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def admin_school_analytics_view(request):
    """
    SuperAdmin view to get comprehensive school analytics.
    """
    try:
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)
        
        # Basic statistics
        total_schools = School.objects.count()
        active_schools = School.objects.filter(is_active=True).count()
        
        # Registration trends
        new_schools_30_days = School.objects.filter(created_at__gte=last_30_days).count()
        new_schools_7_days = School.objects.filter(created_at__gte=last_7_days).count()
        
        # Province distribution
        schools_by_province = School.objects.values('province').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # School type distribution
        schools_by_type = School.objects.values('school_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Top schools by athlete count
        top_schools = []
        schools_with_athletes = School.objects.annotate(
            athlete_count=Count('athletes')
        ).order_by('-athlete_count')[:10]
        
        for school in schools_with_athletes:
            top_schools.append({
                'id': school.id,
                'name': school.name,
                'school_code': school.school_code,
                'athlete_count': school.athlete_count,
                'city': school.city,
                'province': school.province
            })
        
        # Monthly registration trends
        monthly_registrations = []
        for i in range(12):
            month_start = (now - timedelta(days=30*i)).replace(day=1)
            month_end = month_start + timedelta(days=32)
            month_end = month_end.replace(day=1) - timedelta(days=1)
            
            count = School.objects.filter(
                created_at__gte=month_start,
                created_at__lte=month_end
            ).count()
            
            monthly_registrations.append({
                'month': month_start.strftime('%Y-%m'),
                'count': count
            })
        
        monthly_registrations.reverse()
        
        # Athlete distribution across schools
        athlete_stats = {
            'total_athletes': Athlete.objects.count(),
            'schools_with_athletes': School.objects.filter(athletes__isnull=False).distinct().count(),
            'avg_athletes_per_school': 0,
            'schools_without_athletes': 0
        }
        
        schools_with_athlete_count = School.objects.annotate(
            athlete_count=Count('athletes')
        ).aggregate(
            avg_count=Sum('athlete_count')
        )
        
        if schools_with_athlete_count['avg_count'] and active_schools > 0:
            athlete_stats['avg_athletes_per_school'] = schools_with_athlete_count['avg_count'] / active_schools
            
        athlete_stats['schools_without_athletes'] = total_schools - athlete_stats['schools_with_athletes']
        
        analytics_data = {
            'summary': {
                'total_schools': total_schools,
                'active_schools': active_schools,
                'new_schools_30_days': new_schools_30_days,
                'new_schools_7_days': new_schools_7_days,
            },
            'distribution': {
                'by_province': list(schools_by_province),
                'by_type': list(schools_by_type),
                'top_schools': top_schools,
            },
            'trends': {
                'monthly_registrations': monthly_registrations,
            },
            'athlete_statistics': athlete_stats,
        }
        
        return success_response(
            data=analytics_data,
            message='School analytics retrieved successfully'
        )
        
    except Exception as e:
        return error_response(f'Failed to retrieve school analytics: {str(e)}')


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def admin_school_export_view(request):
    """
    SuperAdmin view to export school data.
    """
    try:
        export_format = request.data.get('format', 'csv')  # 'csv', 'excel', 'json'
        filters = request.data.get('filters', {})
        
        # Apply filters to get the queryset
        schools = School.objects.all()
        
        if filters.get('province'):
            schools = schools.filter(province__icontains=filters['province'])
        if filters.get('city'):
            schools = schools.filter(city__icontains=filters['city'])
        if filters.get('status'):
            schools = schools.filter(is_active=filters['status'] == 'active')
        if filters.get('date_from'):
            schools = schools.filter(created_at__gte=filters['date_from'])
        if filters.get('date_to'):
            schools = schools.filter(created_at__lte=filters['date_to'])
        
        # Prepare export data
        export_data = []
        for school in schools:
            # Get statistics
            athlete_count = Athlete.objects.filter(school=school).count()
            active_athlete_count = Athlete.objects.filter(school=school, is_active=True).count()
            tournament_count = Tournament.objects.filter(hosted_by=school.name).count()
            
            export_data.append({
                'ID': school.id,
                'School Name': school.name,
                'School Code': school.school_code,
                'Email': school.email,
                'Phone': school.phone,
                'Address': school.address,
                'City': school.city,
                'Province': school.province,
                'Principal Name': school.principal_name,
                'School Type': getattr(school, 'school_type', 'Unknown'),
                'Status': 'Active' if school.is_active else 'Inactive',
                'Total Athletes': athlete_count,
                'Active Athletes': active_athlete_count,
                'Tournaments Hosted': tournament_count,
                'Admin Name': f"{school.admin.first_name} {school.admin.last_name}" if hasattr(school, 'admin') and school.admin else '',
                'Admin Email': school.admin.email if hasattr(school, 'admin') and school.admin else '',
                'Registration Date': school.created_at.strftime('%Y-%m-%d %H:%M:%S') if school.created_at else '',
            })
        
        return success_response(
            data={
                'export_data': export_data,
                'total_records': len(export_data),
                'format': export_format,
                'generated_at': timezone.now().isoformat()
            },
            message=f'Exported {len(export_data)} school records'
        )
        
    except Exception as e:
        return error_response(f'Failed to export school data: {str(e)}')


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def admin_school_detail_view(request, school_id):
    """
    SuperAdmin view to get detailed school information.
    """
    try:
        school = School.objects.get(id=school_id)
        
        # Get detailed statistics
        athletes = Athlete.objects.filter(school=school)
        athlete_count = athletes.count()
        active_athlete_count = athletes.filter(is_active=True).count()
        verified_athlete_count = athletes.filter(user__email_verified=True).count()
        
        # Get recent athletes
        recent_athletes = athletes.order_by('-created_at')[:5]
        recent_athletes_data = [{
            'id': athlete.id,
            'full_name': athlete.full_name,
            'email': athlete.user.email if athlete.user else None,
            'created_at': athlete.created_at.isoformat() if athlete.created_at else None,
            'is_active': athlete.is_active
        } for athlete in recent_athletes]
        
        # Get tournaments
        tournaments = Tournament.objects.filter(hosted_by=school.name)
        tournament_count = tournaments.count()
        
        recent_tournaments = tournaments.order_by('-created_at')[:5]
        recent_tournaments_data = [{
            'id': tournament.id,
            'name': tournament.name,
            'start_date': tournament.start_date,
            'status': tournament.status,
            'created_at': tournament.created_at.isoformat() if tournament.created_at else None
        } for tournament in recent_tournaments]
        
        school_data = {
            'id': school.id,
            'name': school.name,
            'school_code': school.school_code,
            'email': school.email,
            'phone': school.phone,
            'address': school.address,
            'city': school.city,
            'province': school.province,
            'principal_name': school.principal_name,
            'school_type': getattr(school, 'school_type', 'Unknown'),
            'is_active': school.is_active,
            'created_at': school.created_at.isoformat() if school.created_at else None,
            'updated_at': school.updated_at.isoformat() if hasattr(school, 'updated_at') and school.updated_at else None,
            'statistics': {
                'total_athletes': athlete_count,
                'active_athletes': active_athlete_count,
                'verified_athletes': verified_athlete_count,
                'tournaments_hosted': tournament_count,
            },
            'recent_athletes': recent_athletes_data,
            'recent_tournaments': recent_tournaments_data,
            'admin_info': {
                'admin_name': f"{school.admin.first_name} {school.admin.last_name}" if hasattr(school, 'admin') and school.admin else 'Not assigned',
                'admin_email': school.admin.email if hasattr(school, 'admin') and school.admin else None,
                'admin_last_login': school.admin.last_login.isoformat() if hasattr(school, 'admin') and school.admin and school.admin.last_login else None,
            } if hasattr(school, 'admin') and school.admin else None
        }
        
        return success_response(
            data=school_data,
            message='School details retrieved successfully'
        )
        
    except School.DoesNotExist:
        return error_response('School not found', status_code=404)
    except Exception as e:
        return error_response(f'Failed to retrieve school details: {str(e)}')


# Helper functions

def get_schools_by_province_stats(schools_queryset):
    """Get school count by province."""
    return list(schools_queryset.values('province').annotate(
        count=Count('id')
    ).order_by('-count'))

def get_schools_by_type_stats(schools_queryset):
    """Get school count by type."""
    return list(schools_queryset.values('school_type').annotate(
        count=Count('id')
    ).order_by('-count'))

def get_athlete_distribution_stats():
    """Get athlete distribution across schools."""
    return School.objects.annotate(
        athlete_count=Count('athletes')
    ).values('name', 'athlete_count').order_by('-athlete_count')[:10]

def get_recent_school_registrations_stats():
    """Get recent school registration statistics."""
    now = timezone.now()
    last_7_days = now - timedelta(days=7)
    
    daily_stats = []
    for i in range(7):
        date = now - timedelta(days=i)
        count = School.objects.filter(
            created_at__date=date.date()
        ).count()
        
        daily_stats.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })
    
    return list(reversed(daily_stats))