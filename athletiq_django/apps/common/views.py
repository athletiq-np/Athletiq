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