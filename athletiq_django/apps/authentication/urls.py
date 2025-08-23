"""
Authentication URLs.
"""
from django.urls import path
from . import views
from .unified_auth import unified_login, unified_logout, get_user_type, verify_unified_token

urlpatterns = [
    # Unified authentication endpoints (NEW)
    path('unified/login', unified_login, name='unified_login'),
    path('unified/logout', unified_logout, name='unified_logout'),
    path('unified/user-type', get_user_type, name='get_user_type'),
    path('unified/verify', verify_unified_token, name='verify_unified_token'),
    
    # Legacy authentication endpoints (for backward compatibility)
    path('login', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh', views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout', views.logout_view, name='logout'),
    path('csrf', views.get_csrf_token, name='get_csrf_token'),
    
    # User profile endpoints
    path('profile', views.profile_view, name='profile'),
    path('profile/update', views.update_profile_view, name='update_profile'),
    path('change-password', views.change_password_view, name='change_password'),
    
    # Token verification
    path('verify', views.verify_token_view, name='verify_token'),
]