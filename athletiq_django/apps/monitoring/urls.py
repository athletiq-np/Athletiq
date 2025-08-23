from django.urls import path
from . import views

app_name = 'monitoring'

urlpatterns = [
    # Basic health check (no auth required)
    path('health/', views.health_check, name='health_check'),
    
    # Detailed monitoring endpoints (auth required)
    path('health/detailed/', views.detailed_health_check, name='detailed_health_check'),
    path('health/service/<str:service_name>/', views.service_health_history, name='service_health_history'),
    
    # System metrics
    path('metrics/', views.system_metrics, name='system_metrics'),
    path('metrics/summary/', views.metrics_summary, name='metrics_summary'),
    
    # Alerts
    path('alerts/', views.active_alerts, name='active_alerts'),
    path('alerts/<int:alert_id>/acknowledge/', views.acknowledge_alert, name='acknowledge_alert'),
    path('alerts/<int:alert_id>/resolve/', views.resolve_alert, name='resolve_alert'),
    
    # System status dashboard
    path('status/', views.system_status, name='system_status'),
]