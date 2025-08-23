"""
URL patterns for school endpoints.
"""
from django.urls import path
from apps.schools import views
from apps.schools.debug_views import check_permissions, superadmin_check

app_name = 'schools'

urlpatterns = [
    # School registration (public)
    path('register/', views.SchoolRegistrationView.as_view(), name='school-register'),
    
    # School list (SuperAdmin only)
    path('', views.SchoolListView.as_view(), name='school-list'),
    
    # My school endpoints (SchoolAdmin)
    path('me/', views.MySchoolProfileView.as_view(), name='my-school-profile'),
    path('me/update/', views.MySchoolUpdateView.as_view(), name='my-school-update'),
    path('me/tournaments/', views.get_my_school_tournaments, name='my-school-tournaments'),
    path('me/teams/', views.get_my_school_teams, name='my-school-teams'),
    path('me/athletes/', views.get_my_school_athletes, name='my-school-athletes'),
    path('me/tournament-stats/', views.get_my_school_tournament_stats, name='my-school-tournament-stats'),
    
    # School resources
    path('houses/', views.SchoolHousesView.as_view(), name='school-houses'),
    path('staff/', views.SchoolStaffView.as_view(), name='school-staff'),
    path('notifications/', views.SchoolNotificationsView.as_view(), name='school-notifications'),
    path('activities/', views.get_school_activities, name='school-activities'),
    
    # Team management
    path('me/teams/create/', views.create_school_team, name='create-school-team'),
    path('me/teams/<int:team_id>/', views.get_school_team, name='get-school-team'),
    path('me/teams/<int:team_id>/update/', views.update_school_team, name='update-school-team'),
    path('me/teams/<int:team_id>/delete/', views.delete_school_team, name='delete-school-team'),
    
    # Debug endpoints
    path('debug/permissions/', check_permissions, name='debug-permissions'),
    path('debug/superadmin-check/', superadmin_check, name='debug-superadmin-check'),
]