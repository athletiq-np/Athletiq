"""
Simplified URL configuration for testing.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include([
        # Authentication
        path('auth/', include('apps.authentication.urls')),
        
        # Core modules
        path('schools/', include('apps.schools.urls')),
        
        # Guardian portal
        path('guardian/', include('apps.guardians.urls')),
    ])),
]