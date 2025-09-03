"""
Common views for basic endpoints.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count
from apps.athletes.models import Athlete
from apps.schools.models import School
from apps.tournaments.models import Tournament
from .analytics import get_global_analytics, get_system_health
from core.permissions import IsSuperAdmin


@api_view(['GET'])
@permission_classes([AllowAny])
def root_view(request):
    """Root endpoint - equivalent to Node.js '/' route."""
    return Response({
        'success': True,
        'message': 'Athletiq API is running...',
        'timestamp': timezone.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def test_view(request):
    """Test endpoint - equivalent to Node.js '/api/test' route."""
    return Response({
        'success': True,
        'message': 'Test route working',
        'timestamp': timezone.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_stats_view(request):
    """
    Health stats endpoint for system statistics.
    """
    stats = {
        'success': True,
        'data': {
            'total_athletes': Athlete.objects.count(),
            'total_schools': School.objects.count(),
            'total_tournaments': Tournament.objects.count(),
            'athletes_by_gender': dict(Athlete.objects.values_list('gender').annotate(count=Count('gender'))),
            'schools_by_region': dict(School.objects.values_list('district').annotate(count=Count('school_id'))),
            'timestamp': timezone.now().isoformat()
        }
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def global_analytics_view(request):
    """
    Global analytics endpoint for SuperAdmin dashboard.
    Provides comprehensive system-wide statistics.
    """
    try:
        analytics_data = get_global_analytics()
        return Response({
            'success': True,
            'data': analytics_data,
            'message': 'Global analytics retrieved successfully'
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error retrieving analytics: {str(e)}',
            'data': None
        }, status=500)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def system_health_view(request):
    """
    System health endpoint for SuperAdmin monitoring.
    """
    try:
        health_data = get_system_health()
        return Response({
            'success': True,
            'data': health_data,
            'message': 'System health retrieved successfully'
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error retrieving system health: {str(e)}',
            'data': None
        }, status=500)