"""
URL configuration for notifications app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationTemplateViewSet, NotificationLogViewSet,
    NotificationPreferenceViewSet, GuardianClaimViewSet,
    NotificationViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'templates', NotificationTemplateViewSet, basename='notification-templates')
router.register(r'logs', NotificationLogViewSet, basename='notification-logs')
router.register(r'preferences', NotificationPreferenceViewSet, basename='notification-preferences')
router.register(r'claims', GuardianClaimViewSet, basename='guardian-claims')
router.register(r'send', NotificationViewSet, basename='notifications')

app_name = 'notifications'

urlpatterns = [
    path('', include(router.urls)),
]