"""
Organization URL configuration.
"""

from django.urls import path
from . import views

app_name = 'organizations'

urlpatterns = [
    # Organization registration and authentication
    path('register/', views.OrganizationRegistrationView.as_view(), name='register'),
    
    # Organization profile management
    path('profile/', views.OrganizationProfileView.as_view(), name='profile'),
    
    # Organization dashboard
    path('dashboard/', views.organization_dashboard_view, name='dashboard'),
    
    # Organization athletes management
    path('athletes/', views.organization_athletes_view, name='athletes-list'),
    
    # Organization tournaments management  
    path('tournaments/', views.organization_tournaments_view, name='tournaments-list'),
    
    # Organization schools partnerships
    path('schools/', views.organization_schools_view, name='schools-list'),
    
    # Organization statistics
    path('statistics/', views.organization_analytics_view, name='statistics'),
    
    # Organization analytics
    path('analytics/', views.organization_analytics_view, name='analytics'),
    
    # SuperAdmin organization management
    path('admin/list/', views.admin_organizations_list_view, name='admin-list'),
    path('admin/<int:organization_id>/verify/', views.admin_verify_organization_view, name='admin-verify'),
]