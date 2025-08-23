"""
Tournament URLs for Athletiq Django backend.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TournamentViewSet, get_featured_tournaments, get_upcoming_tournaments,
    get_my_tournaments, search_tournaments, get_tournament_analytics,
    duplicate_tournament
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', TournamentViewSet, basename='tournament')

app_name = 'tournaments'

urlpatterns = [
    # Additional tournament endpoints
    path('featured/', get_featured_tournaments, name='featured-tournaments'),
    path('upcoming/', get_upcoming_tournaments, name='upcoming-tournaments'),
    path('my-tournaments/', get_my_tournaments, name='my-tournaments'),
    path('search/', search_tournaments, name='search-tournaments'),
    path('analytics/', get_tournament_analytics, name='tournament-analytics'),
    path('<int:tournament_id>/duplicate/', duplicate_tournament, name='duplicate-tournament'),
    
    # Tournament ViewSet routes (includes all CRUD operations)
    path('', include(router.urls)),
]

# The router automatically creates the following URL patterns:
# GET    /api/tournaments/                    - List tournaments
# POST   /api/tournaments/                    - Create tournament
# GET    /api/tournaments/{id}/               - Retrieve tournament
# PUT    /api/tournaments/{id}/               - Update tournament
# PATCH  /api/tournaments/{id}/               - Partial update tournament
# DELETE /api/tournaments/{id}/               - Delete tournament
# 
# Custom action routes:
# POST   /api/tournaments/{id}/register_team/     - Register team
# GET    /api/tournaments/{id}/teams/             - Get tournament teams
# PATCH  /api/tournaments/{id}/update_team_status/ - Update team status
# PATCH  /api/tournaments/{id}/bulk_update_teams/  - Bulk update teams
# GET    /api/tournaments/{id}/dashboard/         - Tournament dashboard
# POST   /api/tournaments/{id}/check_eligibility/ - Check eligibility
# PATCH  /api/tournaments/{id}/update_status/     - Update tournament status
# GET    /api/tournaments/statistics/             - Tournament statistics