"""
URL configuration for Athletiq project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# API Router
router = DefaultRouter()

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include([
        # Authentication
        path('auth/', include('apps.authentication.urls')),
        
        # Core modules
        path('schools/', include('apps.schools.urls')),
        path('tournaments/', include('apps.tournaments.urls')),
        path('athletes/', include('apps.athletes.urls')),
        path('health/', include('apps.common.urls')),
        
        # Organizations
        path('organizations/', include('apps.organizations.urls')),
        
        # Guardian portal
        path('guardian/', include('apps.guardians.urls')),
        
        # Documents and file management
        path('', include('apps.documents.urls')),
        
        # Google services
        path('google/', include('apps.google_services.urls')),
        
        # Monitoring and health checks
        path('monitoring/', include('apps.monitoring.urls')),
        
        # Bulk operations
        path('bulk-operations/', include('core.urls')),
    ])),
    
    # Root endpoint
    path('', include('apps.common.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns

# Custom error handlers
handler400 = 'core.exceptions.bad_request_handler'
handler403 = 'core.exceptions.permission_denied_handler'
handler404 = 'core.exceptions.not_found_handler'
handler500 = 'core.exceptions.server_error_handler'