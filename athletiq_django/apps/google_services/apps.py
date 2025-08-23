from django.apps import AppConfig


class GoogleServicesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.google_services'
    verbose_name = 'Google Services'
    
    def ready(self):
        """Initialize Google services when Django starts"""
        pass