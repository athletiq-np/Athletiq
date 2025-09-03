"""
Organization views for API endpoints.
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.db import transaction

from core.utils.responses import (
    success_response, error_response, created_response,
    unauthorized_response, validation_error_response
)
from core.permissions import IsOrganizationAdmin, IsSuperAdmin
from .models import Organization, OrganizationSchoolPartnership, OrganizationAthlete
from .serializers import (
    OrganizationRegistrationSerializer, OrganizationSerializer,
    OrganizationUpdateSerializer, OrganizationSchoolPartnershipSerializer,
    OrganizationAthleteSerializer, OrganizationStatsSerializer,
    OrganizationListSerializer
)


class OrganizationRegistrationView(APIView):
    """
    Organization registration endpoint.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Register a new organization."""
        try:
            serializer = OrganizationRegistrationSerializer(data=request.data)
            if serializer.is_valid():
                with transaction.atomic():
                    organization = serializer.save()
                    
                    # Send verification email (TODO: implement)
                    # send_organization_verification_email(organization)
                    
                    return created_response(
                        data=OrganizationSerializer(organization).data,
                        message='Organization registered successfully. Please wait for verification.'
                    )
            else:
                return validation_error_response(serializer.errors)
        except Exception as e:
            return error_response(str(e))


class OrganizationProfileView(RetrieveUpdateAPIView):
    """
    Organization profile management.
    """
    permission_classes = [IsOrganizationAdmin]
    
    def get_object(self):
        return self.request.user.organization
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return OrganizationSerializer
        return OrganizationUpdateSerializer
    
    def get(self, request, *args, **kwargs):
        """Get organization profile."""
        try:
            organization = self.get_object()
            serializer = self.get_serializer(organization)
            return success_response(
                data=serializer.data,
                message='Organization profile retrieved successfully'
            )
        except Exception as e:
            return error_response(str(e))
    
    def put(self, request, *args, **kwargs):
        """Update organization profile."""
        try:
            organization = self.get_object()
            serializer = self.get_serializer(organization, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return success_response(
                    data=serializer.data,
                    message='Organization profile updated successfully'
                )
            else:
                return validation_error_response(serializer.errors)
        except Exception as e:
            return error_response(str(e))


@api_view(['GET'])
@permission_classes([IsOrganizationAdmin])
def organization_dashboard_view(request):
    """
    Get organization dashboard data.
    """
    try:
        organization = request.user.organization
        
        # Get basic stats
        stats = {
            'total_athletes': organization.total_athletes,
            'total_tournaments': organization.total_tournaments,
            'partner_schools': organization.partner_schools.count(),
            'pending_verifications': 0,  # TODO: implement
            'active_tournaments': organization.created_tournaments.filter(
                status='active'
            ).count() if hasattr(organization, 'created_tournaments') else 0,
        }
        
        # Get recent activities (TODO: implement activities model)
        recent_activities = []
        
        # Get notifications (TODO: implement)
        notifications = []
        
        dashboard_data = {
            'organization': OrganizationSerializer(organization).data,
            'stats': stats,
            'recent_activities': recent_activities,
            'notifications': notifications
        }
        
        return success_response(
            data=dashboard_data,
            message='Dashboard data retrieved successfully'
        )
        
    except Exception as e:
        return error_response(str(e))


@api_view(['GET', 'POST'])
@permission_classes([IsOrganizationAdmin])
def organization_athletes_view(request):
    """
    Manage organization athletes.
    """
    try:
        organization = request.user.organization
        
        if request.method == 'GET':
            # Get organization athletes
            org_athletes = OrganizationAthlete.objects.filter(
                organization=organization,
                is_active=True
            ).select_related('athlete', 'athlete__school')
            
            # Apply filters
            search = request.GET.get('search', '')
            if search:
                org_athletes = org_athletes.filter(
                    Q(athlete__full_name__icontains=search) |
                    Q(athlete__athlete_id__icontains=search) |
                    Q(athlete__school__name__icontains=search)
                )
            
            serializer = OrganizationAthleteSerializer(org_athletes, many=True)
            return success_response(
                data={'athletes': serializer.data},
                message='Athletes retrieved successfully'
            )
        
        elif request.method == 'POST':
            # Register new athlete through organization
            from apps.athletes.models import Athlete
            from apps.athletes.serializers import AthleteRegistrationSerializer
            
            athlete_data = request.data.copy()
            athlete_data['registered_by_organization'] = organization.id
            
            # Athlete must be associated with a school
            if 'school' not in athlete_data:
                return validation_error_response({
                    'school': ['School is required for athlete registration']
                })
            
            athlete_serializer = AthleteRegistrationSerializer(data=athlete_data)
            if athlete_serializer.is_valid():
                with transaction.atomic():
                    athlete = athlete_serializer.save()
                    
                    # Create organization-athlete relationship
                    org_athlete = OrganizationAthlete.objects.create(
                        organization=organization,
                        athlete=athlete
                    )
                    
                    return created_response(
                        data=OrganizationAthleteSerializer(org_athlete).data,
                        message='Athlete registered successfully'
                    )
            else:
                return validation_error_response(athlete_serializer.errors)
        
    except Exception as e:
        return error_response(str(e))


@api_view(['GET', 'POST'])
@permission_classes([IsOrganizationAdmin])
def organization_tournaments_view(request):
    """
    Manage organization tournaments.
    """
    try:
        organization = request.user.organization
        
        if request.method == 'GET':
            # Get organization tournaments
            from apps.tournaments.models import Tournament
            
            tournaments = Tournament.objects.filter(
                created_by_organization=organization
            ).order_by('-created_at')
            
            # Apply filters
            search = request.GET.get('search', '')
            status_filter = request.GET.get('status', '')
            
            if search:
                tournaments = tournaments.filter(
                    Q(name__icontains=search) |
                    Q(sport__icontains=search) |
                    Q(location__icontains=search)
                )
            
            if status_filter:
                tournaments = tournaments.filter(status=status_filter)
            
            from apps.tournaments.serializers import TournamentSerializer
            serializer = TournamentSerializer(tournaments, many=True)
            
            return success_response(
                data={'tournaments': serializer.data},
                message='Tournaments retrieved successfully'
            )
        
        elif request.method == 'POST':
            # Create new tournament
            from apps.tournaments.models import Tournament
            from apps.tournaments.serializers import TournamentCreateSerializer
            
            tournament_data = request.data.copy()
            tournament_data['created_by_organization'] = organization.id
            
            tournament_serializer = TournamentCreateSerializer(data=tournament_data)
            if tournament_serializer.is_valid():
                tournament = tournament_serializer.save()
                
                from apps.tournaments.serializers import TournamentSerializer
                return created_response(
                    data=TournamentSerializer(tournament).data,
                    message='Tournament created successfully'
                )
            else:
                return validation_error_response(tournament_serializer.errors)
        
    except Exception as e:
        return error_response(str(e))


@api_view(['GET', 'POST'])
@permission_classes([IsOrganizationAdmin])
def organization_schools_view(request):
    """
    Manage organization-school partnerships.
    """
    try:
        organization = request.user.organization
        
        if request.method == 'GET':
            # Get partner schools
            partnerships = OrganizationSchoolPartnership.objects.filter(
                organization=organization,
                is_active=True
            ).select_related('school')
            
            serializer = OrganizationSchoolPartnershipSerializer(partnerships, many=True)
            return success_response(
                data={'partnerships': serializer.data},
                message='School partnerships retrieved successfully'
            )
        
        elif request.method == 'POST':
            # Create new partnership
            partnership_data = request.data.copy()
            partnership_data['organization'] = organization.id
            
            serializer = OrganizationSchoolPartnershipSerializer(data=partnership_data)
            if serializer.is_valid():
                partnership = serializer.save()
                return created_response(
                    data=OrganizationSchoolPartnershipSerializer(partnership).data,
                    message='School partnership created successfully'
                )
            else:
                return validation_error_response(serializer.errors)
        
    except Exception as e:
        return error_response(str(e))


@api_view(['GET'])
@permission_classes([IsOrganizationAdmin])
def organization_analytics_view(request):
    """
    Get organization analytics data.
    """
    try:
        organization = request.user.organization
        
        # Basic statistics
        stats = {
            'total_athletes': organization.total_athletes,
            'active_athletes': organization.organization_athletes.filter(
                is_active=True
            ).count(),
            'total_tournaments': organization.total_tournaments,
            'active_tournaments': 0,  # TODO: implement
            'partner_schools': organization.partner_schools.count(),
            'monthly_registrations': [],  # TODO: implement
            'performance_metrics': {}  # TODO: implement
        }
        
        return success_response(
            data=stats,
            message='Analytics data retrieved successfully'
        )
        
    except Exception as e:
        return error_response(str(e))


# SuperAdmin views for organization management
@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def admin_organizations_list_view(request):
    """
    SuperAdmin view to list all organizations.
    """
    try:
        organizations = Organization.objects.all().order_by('-created_at')
        
        # Apply filters
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        type_filter = request.GET.get('type', '')
        
        if search:
            organizations = organizations.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(registration_number__icontains=search)
            )
        
        if status_filter:
            organizations = organizations.filter(status=status_filter)
        
        if type_filter:
            organizations = organizations.filter(type=type_filter)
        
        serializer = OrganizationListSerializer(organizations, many=True)
        return success_response(
            data={'organizations': serializer.data},
            message='Organizations retrieved successfully'
        )
        
    except Exception as e:
        return error_response(str(e))


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def admin_verify_organization_view(request, organization_id):
    """
    SuperAdmin view to verify an organization.
    """
    try:
        organization = get_object_or_404(Organization, id=organization_id)
        action = request.data.get('action')  # 'verify' or 'reject'
        
        if action == 'verify':
            organization.status = 'verified'
            organization.verified_at = timezone.now()
            organization.verified_by = request.user
            message = 'Organization verified successfully'
        elif action == 'reject':
            organization.status = 'rejected'
            message = 'Organization rejected'
        else:
            return validation_error_response({'action': ['Invalid action']})
        
        organization.save()
        
        return success_response(
            data=OrganizationSerializer(organization).data,
            message=message
        )
        
    except Exception as e:
        return error_response(str(e))