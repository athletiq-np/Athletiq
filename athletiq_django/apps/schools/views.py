"""
School views for API endpoints.
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count, Prefetch
from django.shortcuts import get_object_or_404
from apps.schools.models import School, SchoolHouse, SchoolStaff, SchoolNotification
from apps.schools.serializers import (
    SchoolRegistrationSerializer, SchoolSerializer, SchoolUpdateSerializer,
    SchoolListSerializer, SchoolHouseSerializer, SchoolStaffSerializer,
    SchoolNotificationSerializer
)
from core.permissions import IsSuperAdmin, IsSchoolAdmin, IsSchoolOwner
from core.utils.responses import success_response, error_response
from core.pagination import StandardResultsSetPagination


class SchoolRegistrationView(generics.CreateAPIView):
    """
    Register a new school with admin user.
    Public endpoint for school registration.
    """
    serializer_class = SchoolRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            school = serializer.save()
            response_data = {
                'school_id': school.school_id,
                'school_code': school.school_code
            }
            return success_response(
                data=response_data,
                message='School and admin registered successfully!',
                status_code=status.HTTP_201_CREATED
            )
        return error_response(
            message='Validation failed',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class SchoolListView(generics.ListAPIView):
    """
    List all schools (SuperAdmin only).
    """
    serializer_class = SchoolListSerializer
    # Temporarily allow any authenticated user for debugging
    permission_classes = [permissions.IsAuthenticated]  # Changed from [IsSuperAdmin]
    pagination_class = StandardResultsSetPagination
    
    def check_permissions(self, request):
        """Override to add debug logging for permission checks."""
        print("\n=== DEBUG: SchoolListView Permission Check ===")
        print(f"User: {request.user}")
        print(f"Is Authenticated: {request.user.is_authenticated}")
        print(f"User Role: {getattr(request.user, 'role', 'No role')}")
        print(f"Is Superuser: {getattr(request.user, 'is_superuser', False)}")
        print("======================================\n")
        
        # Call the original permission check
        return super().check_permissions(request)
    
    def get_queryset(self):
        queryset = School.objects.select_related('admin_user').filter(is_active=True)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(school_code__icontains=search) |
                Q(city__icontains=search) |
                Q(admin_user__full_name__icontains=search)
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(onboarding_status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return success_response(
            data=response.data,
            message='Schools retrieved successfully'
        )


class MySchoolProfileView(generics.RetrieveAPIView):
    """
    Get the profile for the currently logged-in admin's school.
    """
    serializer_class = SchoolSerializer
    permission_classes = [IsSchoolAdmin]
    
    def get_object(self):
        """Get school associated with the current user."""
        try:
            return School.objects.select_related('admin_user').get(
                admin_user=self.request.user,
                is_active=True
            )
        except School.DoesNotExist:
            return None
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return error_response(
                message='No school associated with this user.',
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(instance)
        return success_response(
            data=serializer.data,
            message='School profile retrieved successfully'
        )


class MySchoolUpdateView(generics.UpdateAPIView):
    """
    Update the profile for the currently logged-in admin's school.
    """
    serializer_class = SchoolUpdateSerializer
    permission_classes = [IsSchoolAdmin]
    
    def get_object(self):
        """Get school associated with the current user."""
        return get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=self.request.user,
            is_active=True
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            serializer.save()
            # Return full school data
            full_serializer = SchoolSerializer(instance)
            return success_response(
                data=full_serializer.data,
                message='School profile updated successfully'
            )
        
        return error_response(
            message='Validation failed',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsSchoolAdmin])
def get_my_school_tournaments(request):
    """
    Get tournaments for the school with proper filtering and pagination.
    """
    try:
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=request.user,
            is_active=True
        )
        
        # Import Tournament model if available
        try:
            from apps.tournaments.models import Tournament
            
            # Get tournaments where school's teams are registered
            registered_tournaments = Tournament.objects.filter(
                tournament_teams__school_id=school.id,
                is_active=True
            ).distinct().select_related('organizer').prefetch_related('tournament_teams')
            
            # Get available tournaments (not registered yet)
            available_tournaments = Tournament.objects.filter(
                status__in=['draft', 'upcoming', 'ongoing'],
                is_active=True
            ).exclude(
                tournament_teams__school_id=school.id
            ).select_related('organizer')
            
            # Apply search filter if provided
            search = request.query_params.get('search', None)
            if search:
                registered_tournaments = registered_tournaments.filter(
                    Q(name__icontains=search) |
                    Q(tournament_code__icontains=search) |
                    Q(sport__icontains=search)
                )
                available_tournaments = available_tournaments.filter(
                    Q(name__icontains=search) |
                    Q(tournament_code__icontains=search) |
                    Q(sport__icontains=search)
                )
            
            # Serialize tournament data
            from apps.tournaments.serializers import TournamentListSerializer
            
            registered_data = TournamentListSerializer(registered_tournaments, many=True).data
            available_data = TournamentListSerializer(available_tournaments, many=True).data
            
            data = {
                'registered_tournaments': registered_data,
                'available_tournaments': available_data
            }
            
        except ImportError:
            # Tournament model not yet implemented
            data = {
                'registered_tournaments': [],
                'available_tournaments': []
            }
        
        return success_response(
            data=data,
            message='School tournaments retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while fetching school tournaments.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsSchoolAdmin])
def get_my_school_teams(request):
    """
    Get teams for the school.
    """
    try:
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=request.user,
            is_active=True
        )
        
        # This will be implemented when Team model is created
        # For now, return empty list
        data = []
        
        return success_response(
            data=data,
            message='School teams retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while fetching school teams.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsSchoolAdmin])
def get_my_school_athletes(request):
    """
    Get athletes for the school with filtering and pagination.
    """
    try:
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=request.user,
            is_active=True
        )
        
        # Import Athlete model if available
        try:
            from apps.athletes.models import Athlete
            from apps.athletes.serializers import AthleteListSerializer
            
            # Get athletes for this school
            athletes = Athlete.objects.filter(
                school=school,
                is_active=True
            ).select_related('guardian').prefetch_related('sports_participation')
            
            # Apply search filter if provided
            search = request.query_params.get('search', None)
            if search:
                athletes = athletes.filter(
                    Q(full_name__icontains=search) |
                    Q(player_id__icontains=search) |
                    Q(guardian__full_name__icontains=search)
                )
            
            # Apply status filter if provided
            status_filter = request.query_params.get('status', None)
            if status_filter:
                athletes = athletes.filter(registration_status=status_filter)
            
            # Apply gender filter if provided
            gender_filter = request.query_params.get('gender', None)
            if gender_filter:
                athletes = athletes.filter(gender=gender_filter)
            
            # Apply sport filter if provided
            sport_filter = request.query_params.get('sport', None)
            if sport_filter:
                athletes = athletes.filter(sports__contains=[sport_filter])
            
            # Order by name
            athletes = athletes.order_by('full_name')
            
            # Paginate results
            from core.pagination import StandardResultsSetPagination
            paginator = StandardResultsSetPagination()
            page = paginator.paginate_queryset(athletes, request)
            
            if page is not None:
                serializer = AthleteListSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)
            
            serializer = AthleteListSerializer(athletes, many=True)
            data = serializer.data
            
        except ImportError:
            # Athlete model not yet implemented
            data = []
        
        return success_response(
            data=data,
            message='School athletes retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while fetching school athletes.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsSchoolAdmin])
def get_my_school_tournament_stats(request):
    """
    Get tournament statistics for the school.
    """
    try:
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=request.user,
            is_active=True
        )
        
        # Mock statistics - will be implemented with actual models
        stats = {
            'total_tournaments': 0,
            'active_tournaments': 0,
            'completed_tournaments': 0,
            'total_teams_registered': 0,
            'total_matches_played': 0,
            'matches_won': 0,
            'total_athletes': 0,
            'win_rate': 0
        }
        
        return success_response(
            data=stats,
            message='School tournament statistics retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while fetching school tournament statistics.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class SchoolHousesView(generics.ListAPIView):
    """
    Get school houses.
    """
    serializer_class = SchoolHouseSerializer
    permission_classes = [IsSchoolAdmin]
    
    def get_queryset(self):
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=self.request.user,
            is_active=True
        )
        return SchoolHouse.objects.filter(
            school=school,
            is_active=True
        ).select_related('captain').order_by('-points', 'name')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            return success_response(
                data=[],
                message='No houses configured for this school. Please contact administration to set up house system.'
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return success_response(
            data=serializer.data,
            message='School houses retrieved successfully'
        )


class SchoolStaffView(generics.ListAPIView):
    """
    Get school staff.
    """
    serializer_class = SchoolStaffSerializer
    permission_classes = [IsSchoolAdmin]
    
    def get_queryset(self):
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=self.request.user,
            is_active=True
        )
        return SchoolStaff.objects.filter(
            school=school,
            status='active',
            is_active=True
        ).order_by('position', 'full_name')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            # Return basic school admin info if no staff records exist
            school = get_object_or_404(
                School.objects.select_related('admin_user'),
                admin_user=self.request.user,
                is_active=True
            )
            admin_data = [{
                'id': school.admin_user.user_id,
                'full_name': school.admin_user.full_name,
                'position': 'School Administrator',
                'department': 'Administration',
                'email': school.admin_user.email,
                'phone': school.phone,
                'hire_date': None,
                'status': 'active'
            }]
            return success_response(
                data=admin_data,
                message='Staff information retrieved. Only admin user found - please add more staff members.'
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return success_response(
            data=serializer.data,
            message='School staff retrieved successfully'
        )


class SchoolNotificationsView(generics.ListAPIView):
    """
    Get school notifications.
    """
    serializer_class = SchoolNotificationSerializer
    permission_classes = [IsSchoolAdmin]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=self.request.user,
            is_active=True
        )
        return SchoolNotification.objects.filter(
            school=school,
            is_active=True
        ).order_by('-created_at')[:50]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            return success_response(
                data=[],
                message='No notifications found. You will receive notifications here when there are updates.'
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return success_response(
            data=serializer.data,
            message='School notifications retrieved successfully'
        )


@api_view(['GET'])
@permission_classes([IsSchoolAdmin])
def get_school_activities(request):
    """
    Get school activities (matches, tournaments, practices).
    """
    try:
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=request.user,
            is_active=True
        )
        
        # This will be implemented when Match and Tournament models are created
        # For now, return empty list
        data = []
        
        return success_response(
            data=data,
            message='School activities retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while fetching school activities.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==========================================
# TEAM MANAGEMENT ENDPOINTS
# ==========================================

@api_view(['POST'])
@permission_classes([IsSchoolAdmin])
def create_school_team(request):
    """
    Create a new team for the school.
    """
    try:
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=request.user,
            is_active=True
        )
        
        # Validate required fields
        required_fields = ['name', 'sport', 'gender', 'age_group']
        for field in required_fields:
            if not request.data.get(field):
                return error_response(
                    message=f'{field.replace("_", " ").title()} is required.',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        
        # This will be implemented when Team model is created
        # For now, return mock response
        mock_team = {
            'id': 1,
            'name': request.data.get('name'),
            'sport': request.data.get('sport'),
            'coach': request.data.get('coach'),
            'gender': request.data.get('gender'),
            'age_group': request.data.get('age_group'),
            'description': request.data.get('description'),
            'status': request.data.get('status', 'active'),
            'school_id': school.school_id,
            'created_at': '2024-01-01T00:00:00Z',
            'athletes': []
        }
        
        return success_response(
            data=mock_team,
            message='Team created successfully',
            status_code=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        return error_response(
            message='Server error while creating team.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsSchoolAdmin])
def get_school_team(request, team_id):
    """
    Get a specific team with athletes.
    """
    try:
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=request.user,
            is_active=True
        )
        
        # This will be implemented when Team model is created
        # For now, return mock response
        mock_team = {
            'id': int(team_id),
            'name': 'School Eagles',
            'sport': 'football',
            'coach': 'John Doe',
            'gender': 'male',
            'age_group': 'u16',
            'description': 'Main school football team',
            'status': 'active',
            'school_id': school.school_id,
            'athletes': []
        }
        
        return success_response(
            data=mock_team,
            message='Team retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while fetching team.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsSchoolAdmin])
def update_school_team(request, team_id):
    """
    Update a team for the school.
    """
    try:
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=request.user,
            is_active=True
        )
        
        # This will be implemented when Team model is created
        # For now, return mock response
        mock_updated_team = {
            'id': int(team_id),
            **request.data,
            'updated_at': '2024-01-01T00:00:00Z'
        }
        
        return success_response(
            data=mock_updated_team,
            message='Team updated successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while updating team.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsSchoolAdmin])
def delete_school_team(request, team_id):
    """
    Delete a team for the school.
    """
    try:
        school = get_object_or_404(
            School.objects.select_related('admin_user'),
            admin_user=request.user,
            is_active=True
        )
        
        # This will be implemented when Team model is created
        # For now, return success response
        return success_response(
            data=None,
            message='Team deleted successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while deleting team.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )