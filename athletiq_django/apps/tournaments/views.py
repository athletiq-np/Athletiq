"""
Tournament views for Athletiq Django backend.
"""
from django.db.models import Q, Count, Prefetch
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.permissions.base import IsOwnerOrReadOnly, IsSuperAdminOrReadOnly, IsSchoolAdmin, IsSuperAdmin
from core.pagination import CustomPageNumberPagination
from core.utils.responses import success_response, error_response
from .models import Tournament, TournamentTeam, TournamentPlayer, TournamentSport
from .serializers import (
    TournamentListSerializer, TournamentDetailSerializer,
    TournamentCreateSerializer, TournamentUpdateSerializer,
    TeamRegistrationSerializer, TournamentTeamSerializer,
    TournamentStatsSerializer, BulkTeamUpdateSerializer
)
from .filters import TournamentFilter


class TournamentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for tournament management with CRUD operations.
    """
    
    queryset = Tournament.objects.select_related(
        'organizer_id', 'created_by'
    ).prefetch_related(
        'sports', 'tournament_teams__players'
    )
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TournamentFilter
    search_fields = ['name', 'description', 'sport', 'location', 'city']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'name']
    ordering = ['-created_at']
    pagination_class = CustomPageNumberPagination
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return TournamentListSerializer
        elif self.action == 'create':
            return TournamentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TournamentUpdateSerializer
        else:
            return TournamentDetailSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['create']:
            # Only authenticated users can create tournaments
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only super admin or tournament creator can modify
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        else:
            # List and retrieve are public
            permission_classes = [permissions.AllowAny]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Temporarily returning all tournaments for debugging"""
        print("\n=== DEBUG: Getting all tournaments ===")
        print(f"User: {self.request.user}")
        print(f"Is authenticated: {self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            print(f"User role: {getattr(self.request.user, 'role', 'No role')}")
        
        # Get all tournaments with related data
        all_tournaments = Tournament.objects.all()
        print(f"Total tournaments in DB: {all_tournaments.count()}")
        for t in all_tournaments:
            print(f"- {t.id}: {t.name} (published: {t.is_published}, created_by: {t.created_by})")
        
        # For now, return all tournaments
        return all_tournaments
    
    def perform_create(self, serializer):
        """Set created_by field when creating tournament."""
        serializer.save(created_by=self.request.user)
    
    def list(self, request, *args, **kwargs):
        """Override list to return consistent response format."""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return success_response(
                data=serializer.data,
                message='Tournaments retrieved successfully'
            )
        except Exception as e:
            return error_response(
                message='Server error while fetching tournaments.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to return consistent response format."""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return success_response(
                data=serializer.data,
                message='Tournament retrieved successfully'
            )
        except Tournament.DoesNotExist:
            return error_response(
                message='Tournament not found',
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return error_response(
                message='Server error while fetching tournament.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        """Override create to return consistent response format."""
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                tournament = serializer.save()
                response_serializer = TournamentDetailSerializer(tournament)
                return success_response(
                    data=response_serializer.data,
                    message='Tournament created successfully',
                    status_code=status.HTTP_201_CREATED
                )
            
            return error_response(
                message='Validation failed',
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return error_response(
                message='Server error while creating tournament.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Override update to return consistent response format."""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if serializer.is_valid():
                tournament = serializer.save()
                response_serializer = TournamentDetailSerializer(tournament)
                return success_response(
                    data=response_serializer.data,
                    message='Tournament updated successfully'
                )
            
            return error_response(
                message='Validation failed',
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Tournament.DoesNotExist:
            return error_response(
                message='Tournament not found',
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return error_response(
                message='Server error while updating tournament.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to return consistent response format."""
        try:
            instance = self.get_object()
            
            # Check if tournament can be deleted
            if instance.status in ['ongoing', 'completed']:
                return error_response(
                    message='Cannot delete tournament that is ongoing or completed.',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if there are registered teams
            if instance.tournament_teams.filter(registration_status='registered').exists():
                return error_response(
                    message='Cannot delete tournament with registered teams.',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Soft delete by setting is_active to False
            instance.is_active = False
            instance.save()
            
            return success_response(
                data=None,
                message='Tournament deleted successfully'
            )
        except Tournament.DoesNotExist:
            return error_response(
                message='Tournament not found',
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return error_response(
                message='Server error while deleting tournament.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register_team(self, request, pk=None):
        """Register a team for the tournament."""
        tournament = self.get_object()
        
        serializer = TeamRegistrationSerializer(
            data=request.data,
            context={'tournament': tournament, 'request': request}
        )
        
        if serializer.is_valid():
            tournament_team = serializer.save()
            response_serializer = TournamentTeamSerializer(tournament_team)
            return success_response(
                data=response_serializer.data,
                message='Team registered successfully',
                status_code=status.HTTP_201_CREATED
            )
        
        return error_response(
            message='Registration failed',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['get'])
    def teams(self, request, pk=None):
        """Get all teams registered for the tournament."""
        tournament = self.get_object()
        
        # Filter by status if provided
        status_filter = request.query_params.get('status', 'all')
        teams_queryset = tournament.tournament_teams.select_related().prefetch_related('players')
        
        if status_filter != 'all':
            teams_queryset = teams_queryset.filter(registration_status=status_filter)
        
        # Include players if requested
        include_players = request.query_params.get('include_players', 'false').lower() == 'true'
        
        serializer = TournamentTeamSerializer(teams_queryset, many=True)
        
        return success_response(
            data=serializer.data,
            message='Tournament teams retrieved successfully',
            meta={
                'total_teams': teams_queryset.count(),
                'include_players': include_players
            }
        )
    
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_team_status(self, request, pk=None):
        """Update team registration status."""
        tournament = self.get_object()
        team_id = request.data.get('team_id')
        new_status = request.data.get('status')
        
        if not team_id or not new_status:
            return Response({
                'success': False,
                'message': 'team_id and status are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tournament_team = tournament.tournament_teams.get(id=team_id)
        except TournamentTeam.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Team not found in this tournament'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions
        if (request.user.role not in ['super_admin'] and 
            tournament.created_by != request.user):
            return Response({
                'success': False,
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        tournament_team.registration_status = new_status
        tournament_team.notes = request.data.get('notes', tournament_team.notes)
        tournament_team.seed_order = request.data.get('seed_order', tournament_team.seed_order)
        
        if new_status == 'registered':
            tournament_team.confirmed_date = timezone.now()
        
        tournament_team.save()
        
        serializer = TournamentTeamSerializer(tournament_team)
        return Response({
            'success': True,
            'message': 'Team status updated successfully',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def bulk_update_teams(self, request, pk=None):
        """Bulk update team registrations."""
        tournament = self.get_object()
        
        # Check permissions
        if (request.user.role not in ['super_admin'] and 
            tournament.created_by != request.user):
            return Response({
                'success': False,
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BulkTeamUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            updates = serializer.validated_data['updates']
            updated_teams = []
            
            for update in updates:
                try:
                    tournament_team = tournament.tournament_teams.get(
                        id=update['tournament_team_id']
                    )
                    
                    if 'status' in update:
                        tournament_team.registration_status = update['status']
                        if update['status'] == 'registered':
                            tournament_team.confirmed_date = timezone.now()
                    
                    if 'seed_order' in update:
                        tournament_team.seed_order = update['seed_order']
                    
                    if 'notes' in update:
                        tournament_team.notes = update['notes']
                    
                    tournament_team.save()
                    updated_teams.append(tournament_team.id)
                    
                except TournamentTeam.DoesNotExist:
                    continue
            
            return Response({
                'success': True,
                'message': f'Updated {len(updated_teams)} teams',
                'data': {'updated_team_ids': updated_teams}
            })
        
        return Response({
            'success': False,
            'message': 'Invalid data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Get tournament dashboard data."""
        tournament = self.get_object()
        
        # Get team statistics
        teams_stats = tournament.tournament_teams.aggregate(
            total_teams=Count('id'),
            registered_teams=Count('id', filter=Q(registration_status='registered')),
            pending_teams=Count('id', filter=Q(registration_status='pending')),
            rejected_teams=Count('id', filter=Q(registration_status='rejected'))
        )
        
        # Get player statistics
        total_players = TournamentPlayer.objects.filter(
            tournament_team__tournament=tournament
        ).count()
        
        eligible_players = TournamentPlayer.objects.filter(
            tournament_team__tournament=tournament,
            is_eligible=True
        ).count()
        
        dashboard_data = {
            'tournament': TournamentDetailSerializer(tournament).data,
            'statistics': {
                **teams_stats,
                'total_players': total_players,
                'eligible_players': eligible_players,
                'registration_open': tournament.is_registration_open,
                'days_until_start': (tournament.start_date - timezone.now().date()).days if tournament.start_date > timezone.now().date() else 0
            }
        }
        
        return Response({
            'success': True,
            'data': dashboard_data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get overall tournament statistics."""
        # Get counts by status
        total_tournaments = Tournament.objects.count()
        active_tournaments = Tournament.objects.filter(status='ongoing').count()
        upcoming_tournaments = Tournament.objects.filter(status='upcoming').count()
        completed_tournaments = Tournament.objects.filter(status='completed').count()
        
        # Get team and player counts
        total_teams = TournamentTeam.objects.filter(registration_status='registered').count()
        total_players = TournamentPlayer.objects.filter(
            tournament_team__registration_status='registered'
        ).count()
        
        # Get sports breakdown
        sports_breakdown = dict(
            Tournament.objects.values('sport').annotate(
                count=Count('id')
            ).values_list('sport', 'count')
        )
        
        # Get level breakdown
        level_breakdown = dict(
            Tournament.objects.values('level').annotate(
                count=Count('id')
            ).values_list('level', 'count')
        )
        
        # Get recent tournaments
        recent_tournaments = Tournament.objects.filter(
            is_published=True
        ).order_by('-created_at')[:5]
        
        stats_data = {
            'total_tournaments': total_tournaments,
            'active_tournaments': active_tournaments,
            'upcoming_tournaments': upcoming_tournaments,
            'completed_tournaments': completed_tournaments,
            'total_teams_registered': total_teams,
            'total_players_registered': total_players,
            'sports_breakdown': sports_breakdown,
            'level_breakdown': level_breakdown,
            'recent_tournaments': recent_tournaments
        }
        
        serializer = TournamentStatsSerializer(stats_data)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def check_eligibility(self, request, pk=None):
        """Check player eligibility for tournament."""
        tournament = self.get_object()
        player_ids = request.data.get('player_ids', [])
        
        if not player_ids:
            return Response({
                'success': False,
                'message': 'player_ids are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # This would typically check against player database
        # For now, return a simple eligibility check
        eligibility_results = []
        
        for player_id in player_ids:
            # Basic eligibility check (can be expanded)
            is_eligible = True
            eligibility_notes = []
            
            # Check if player is already registered in another team for this tournament
            existing_registration = TournamentPlayer.objects.filter(
                tournament_team__tournament=tournament,
                player_id=player_id
            ).exists()
            
            if existing_registration:
                is_eligible = False
                eligibility_notes.append("Player already registered in this tournament")
            
            eligibility_results.append({
                'player_id': player_id,
                'is_eligible': is_eligible,
                'eligibility_notes': eligibility_notes
            })
        
        return Response({
            'success': True,
            'data': {
                'tournament_id': tournament.id,
                'eligibility_results': eligibility_results
            }
        })
    
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        """Update tournament status."""
        tournament = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({
                'success': False,
                'message': 'status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check permissions
        if (request.user.role not in ['super_admin'] and 
            tournament.created_by != request.user):
            return Response({
                'success': False,
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Validate status transition
        valid_statuses = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled', 'postponed']
        if new_status not in valid_statuses:
            return Response({
                'success': False,
                'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        tournament.status = new_status
        tournament.save()
        
        return Response({
            'success': True,
            'message': 'Tournament status updated successfully',
            'data': {
                'tournament_id': tournament.id,
                'status': tournament.status
            }
        })


# ==========================================
# ADDITIONAL TOURNAMENT MANAGEMENT ENDPOINTS
# ==========================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_featured_tournaments(request):
    """
    Get featured tournaments for homepage display.
    """
    try:
        featured_tournaments = Tournament.objects.filter(
            is_featured=True,
            is_published=True,
            is_active=True
        ).select_related('organizer_id', 'created_by').order_by('-created_at')[:6]
        
        serializer = TournamentListSerializer(featured_tournaments, many=True)
        
        return success_response(
            data=serializer.data,
            message='Featured tournaments retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while fetching featured tournaments.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_upcoming_tournaments(request):
    """
    Get upcoming tournaments with filtering and pagination.
    """
    try:
        from django.utils import timezone
        
        upcoming_tournaments = Tournament.objects.filter(
            start_date__gte=timezone.now().date(),
            status__in=['draft', 'upcoming'],
            is_published=True,
            is_active=True
        ).select_related('organizer_id', 'created_by')
        
        # Apply filters
        sport_filter = request.query_params.get('sport')
        if sport_filter:
            upcoming_tournaments = upcoming_tournaments.filter(sport__icontains=sport_filter)
        
        level_filter = request.query_params.get('level')
        if level_filter:
            upcoming_tournaments = upcoming_tournaments.filter(level=level_filter)
        
        city_filter = request.query_params.get('city')
        if city_filter:
            upcoming_tournaments = upcoming_tournaments.filter(city__icontains=city_filter)
        
        # Order by start date
        upcoming_tournaments = upcoming_tournaments.order_by('start_date')
        
        # Paginate
        from core.pagination import StandardResultsSetPagination
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(upcoming_tournaments, request)
        
        if page is not None:
            serializer = TournamentListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = TournamentListSerializer(upcoming_tournaments, many=True)
        return success_response(
            data=serializer.data,
            message='Upcoming tournaments retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while fetching upcoming tournaments.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsSchoolAdmin])
def get_my_tournaments(request):
    """
    Get tournaments created by the current user (school admin).
    """
    try:
        my_tournaments = Tournament.objects.filter(
            created_by=request.user,
            is_active=True
        ).select_related('organizer_id', 'created_by').prefetch_related('tournament_teams')
        
        # Apply status filter if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            my_tournaments = my_tournaments.filter(status=status_filter)
        
        # Apply search filter if provided
        search = request.query_params.get('search')
        if search:
            my_tournaments = my_tournaments.filter(
                Q(name__icontains=search) |
                Q(sport__icontains=search) |
                Q(tournament_code__icontains=search)
            )
        
        # Order by creation date
        my_tournaments = my_tournaments.order_by('-created_at')
        
        serializer = TournamentListSerializer(my_tournaments, many=True)
        
        return success_response(
            data=serializer.data,
            message='My tournaments retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while fetching my tournaments.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_tournaments(request):
    """
    Advanced tournament search with multiple criteria.
    """
    try:
        # Start with published tournaments
        tournaments = Tournament.objects.filter(
            is_published=True,
            is_active=True
        ).select_related('organizer_id', 'created_by')
        
        # Apply search query
        query = request.query_params.get('q', '').strip()
        if query:
            tournaments = tournaments.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(sport__icontains=query) |
                Q(location__icontains=query) |
                Q(city__icontains=query) |
                Q(tournament_code__icontains=query)
            )
        
        # Apply filters
        filters = {}
        
        # Sport filter
        sports = request.query_params.getlist('sports')
        if sports:
            tournaments = tournaments.filter(sport__in=sports)
        
        # Level filter
        levels = request.query_params.getlist('levels')
        if levels:
            tournaments = tournaments.filter(level__in=levels)
        
        # Status filter
        statuses = request.query_params.getlist('status')
        if statuses:
            tournaments = tournaments.filter(status__in=statuses)
        
        # Date range filters
        start_date_from = request.query_params.get('start_date_from')
        if start_date_from:
            tournaments = tournaments.filter(start_date__gte=start_date_from)
        
        start_date_to = request.query_params.get('start_date_to')
        if start_date_to:
            tournaments = tournaments.filter(start_date__lte=start_date_to)
        
        # Location filters
        city = request.query_params.get('city')
        if city:
            tournaments = tournaments.filter(city__icontains=city)
        
        country = request.query_params.get('country')
        if country:
            tournaments = tournaments.filter(country__icontains=country)
        
        # Entry fee filters
        free_only = request.query_params.get('free_only', '').lower() == 'true'
        if free_only:
            tournaments = tournaments.filter(entry_fee=0)
        
        max_entry_fee = request.query_params.get('max_entry_fee')
        if max_entry_fee:
            tournaments = tournaments.filter(entry_fee__lte=max_entry_fee)
        
        # Registration status filter
        registration_open = request.query_params.get('registration_open', '').lower()
        if registration_open == 'true':
            from django.utils import timezone
            today = timezone.now().date()
            tournaments = tournaments.filter(
                Q(registration_deadline__isnull=True, status__in=['draft', 'upcoming']) |
                Q(registration_deadline__gte=today, status__in=['draft', 'upcoming'])
            )
        
        # Ordering
        order_by = request.query_params.get('order_by', '-created_at')
        valid_order_fields = ['created_at', '-created_at', 'start_date', '-start_date', 'name', '-name']
        if order_by in valid_order_fields:
            tournaments = tournaments.order_by(order_by)
        else:
            tournaments = tournaments.order_by('-created_at')
        
        # Paginate
        from core.pagination import StandardResultsSetPagination
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(tournaments, request)
        
        if page is not None:
            serializer = TournamentListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = TournamentListSerializer(tournaments, many=True)
        return success_response(
            data=serializer.data,
            message='Tournament search completed successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error during tournament search.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def get_tournament_analytics(request):
    """
    Get comprehensive tournament analytics for admin dashboard.
    """
    try:
        from django.utils import timezone
        from django.db.models import Avg, Sum
        
        # Basic counts
        total_tournaments = Tournament.objects.count()
        active_tournaments = Tournament.objects.filter(status='ongoing').count()
        upcoming_tournaments = Tournament.objects.filter(status='upcoming').count()
        completed_tournaments = Tournament.objects.filter(status='completed').count()
        
        # Registration statistics
        total_registrations = TournamentTeam.objects.count()
        confirmed_registrations = TournamentTeam.objects.filter(registration_status='registered').count()
        pending_registrations = TournamentTeam.objects.filter(registration_status='pending').count()
        
        # Financial statistics
        total_entry_fees = Tournament.objects.aggregate(
            total=Sum('entry_fee')
        )['total'] or 0
        
        total_prize_pools = Tournament.objects.aggregate(
            total=Sum('prize_pool')
        )['total'] or 0
        
        avg_entry_fee = Tournament.objects.aggregate(
            avg=Avg('entry_fee')
        )['avg'] or 0
        
        # Sports breakdown
        sports_stats = Tournament.objects.values('sport').annotate(
            count=Count('id'),
            avg_teams=Avg('tournament_teams__id')
        ).order_by('-count')[:10]
        
        # Level breakdown
        level_stats = Tournament.objects.values('level').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Monthly tournament creation trend (last 12 months)
        from datetime import datetime, timedelta
        twelve_months_ago = timezone.now() - timedelta(days=365)
        
        monthly_stats = Tournament.objects.filter(
            created_at__gte=twelve_months_ago
        ).extra(
            select={'month': "DATE_TRUNC('month', created_at)"}
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        # Recent activity
        recent_tournaments = Tournament.objects.select_related(
            'organizer_id', 'created_by'
        ).order_by('-created_at')[:10]
        
        recent_registrations = TournamentTeam.objects.select_related(
            'tournament'
        ).order_by('-registration_date')[:10]
        
        analytics_data = {
            'overview': {
                'total_tournaments': total_tournaments,
                'active_tournaments': active_tournaments,
                'upcoming_tournaments': upcoming_tournaments,
                'completed_tournaments': completed_tournaments,
                'total_registrations': total_registrations,
                'confirmed_registrations': confirmed_registrations,
                'pending_registrations': pending_registrations,
            },
            'financial': {
                'total_entry_fees': float(total_entry_fees),
                'total_prize_pools': float(total_prize_pools),
                'avg_entry_fee': float(avg_entry_fee),
            },
            'sports_breakdown': list(sports_stats),
            'level_breakdown': list(level_stats),
            'monthly_trend': list(monthly_stats),
            'recent_tournaments': TournamentListSerializer(recent_tournaments, many=True).data,
            'recent_registrations': TournamentTeamSerializer(recent_registrations, many=True).data,
        }
        
        return success_response(
            data=analytics_data,
            message='Tournament analytics retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message='Server error while generating tournament analytics.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsSchoolAdmin])
def duplicate_tournament(request, tournament_id):
    """
    Duplicate an existing tournament with modifications.
    """
    try:
        # Get the original tournament
        original_tournament = get_object_or_404(
            Tournament,
            id=tournament_id,
            is_active=True
        )
        
        # Check if user can duplicate this tournament
        if (request.user.role != 'SuperAdmin' and 
            original_tournament.created_by != request.user):
            return error_response(
                message='Permission denied. You can only duplicate your own tournaments.',
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Get modification data
        modifications = request.data.get('modifications', {})
        
        # Create new tournament data
        new_tournament_data = {
            'name': modifications.get('name', f"{original_tournament.name} (Copy)"),
            'description': modifications.get('description', original_tournament.description),
            'sport': modifications.get('sport', original_tournament.sport),
            'level': modifications.get('level', original_tournament.level),
            'start_date': modifications.get('start_date', original_tournament.start_date),
            'end_date': modifications.get('end_date', original_tournament.end_date),
            'registration_deadline': modifications.get('registration_deadline', original_tournament.registration_deadline),
            'max_teams': modifications.get('max_teams', original_tournament.max_teams),
            'min_teams': modifications.get('min_teams', original_tournament.min_teams),
            'max_players_per_team': modifications.get('max_players_per_team', original_tournament.max_players_per_team),
            'location': modifications.get('location', original_tournament.location),
            'address': modifications.get('address', original_tournament.address),
            'city': modifications.get('city', original_tournament.city),
            'country': modifications.get('country', original_tournament.country),
            'organizer_id': original_tournament.organizer_id,
            'organizer_type': original_tournament.organizer_type,
            'format': modifications.get('format', original_tournament.format),
            'rules': modifications.get('rules', original_tournament.rules),
            'prize_details': modifications.get('prize_details', original_tournament.prize_details),
            'entry_fee': modifications.get('entry_fee', original_tournament.entry_fee),
            'prize_pool': modifications.get('prize_pool', original_tournament.prize_pool),
            'age_group': modifications.get('age_group', original_tournament.age_group),
            'gender': modifications.get('gender', original_tournament.gender),
            'category': modifications.get('category', original_tournament.category),
            'visibility': modifications.get('visibility', original_tournament.visibility),
            'sports_config': modifications.get('sports_config', original_tournament.sports_config),
            'created_by': request.user,
            'status': 'draft',  # Always start as draft
            'is_published': False,  # Always start unpublished
            'is_featured': False,  # Never duplicate as featured
        }
        
        # Create the new tournament
        serializer = TournamentCreateSerializer(
            data=new_tournament_data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            new_tournament = serializer.save()
            
            # Copy sports configuration if exists
            if original_tournament.sports.exists():
                for sport in original_tournament.sports.all():
                    TournamentSport.objects.create(
                        tournament=new_tournament,
                        sport_name=sport.sport_name,
                        category=sport.category,
                        age_group=sport.age_group,
                        gender=sport.gender,
                        max_teams=sport.max_teams,
                        min_teams=sport.min_teams,
                        players_per_team=sport.players_per_team,
                        format=sport.format,
                        rules=sport.rules,
                        prize_details=sport.prize_details,
                        sport_config=sport.sport_config,
                    )
            
            response_serializer = TournamentDetailSerializer(new_tournament)
            return success_response(
                data=response_serializer.data,
                message='Tournament duplicated successfully',
                status_code=status.HTTP_201_CREATED
            )
        
        return error_response(
            message='Validation failed',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
    except Tournament.DoesNotExist:
        return error_response(
            message='Tournament not found',
            status_code=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return error_response(
            message='Server error while duplicating tournament.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )