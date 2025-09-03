"""
Common URLs for basic endpoints.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Root endpoint
    path('', views.root_view, name='root'),
    
    # Test endpoint
    path('api/test', views.test_view, name='test'),
    
    # Health stats endpoint
    path('stats/', views.health_stats_view, name='health-stats'),
    
    # SuperAdmin analytics endpoints
    path('analytics/global/', views.global_analytics_view, name='global-analytics'),
    path('analytics/health/', views.system_health_view, name='system-health'),
]