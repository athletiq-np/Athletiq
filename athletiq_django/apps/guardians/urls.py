"""
Guardian URLs.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register', views.GuardianRegistrationView.as_view(), name='guardian_register'),
    path('auth/login', views.GuardianLoginView.as_view(), name='guardian_login'),
    path('auth/logout', views.guardian_logout_view, name='guardian_logout'),
    path('auth/verify-email', views.verify_email_view, name='guardian_verify_email'),
    
    # Profile endpoints
    path('profile', views.guardian_profile_view, name='guardian_profile'),
    path('profile/update', views.guardian_profile_update_view, name='guardian_profile_update'),
    path('profile/change-password', views.guardian_change_password_view, name='guardian_change_password'),
    
    # Dashboard
    path('dashboard', views.guardian_dashboard_view, name='guardian_dashboard'),
    
    # Athlete management
    path('athletes', views.guardian_athletes_view, name='guardian_athletes'),
    path('athletes/<int:athlete_id>', views.guardian_athlete_detail_view, name='guardian_athlete_detail'),
    path('athletes/<int:athlete_id>/tournaments', views.guardian_athlete_tournaments_view, name='guardian_athlete_tournaments'),
    path('athletes/<int:athlete_id>/consent', views.guardian_athlete_consent_view, name='guardian_athlete_consent'),
    path('athletes/claim', views.claim_athlete_view, name='claim_athlete'),
    
    # Claim requests
    path('claim-requests', views.guardian_claim_requests_view, name='guardian_claim_requests'),
    
    # Document management
    path('documents/upload', views.upload_guardian_document_view, name='guardian_document_upload'),
    
    # Notifications
    path('notifications', views.guardian_notifications_view, name='guardian_notifications'),
    path('notifications/<int:notification_id>/read', views.mark_notification_read_view, name='mark_notification_read'),
    path('notifications/mark-all-read', views.mark_all_notifications_read_view, name='mark_all_notifications_read'),
    
    # Communication
    path('communication-history', views.guardian_communication_history_view, name='guardian_communication_history'),
    path('feedback', views.guardian_feedback_view, name='guardian_feedback'),
    
    # SuperAdmin guardian management
    path('admin/list/', views.admin_guardians_list_view, name='admin-list'),
]