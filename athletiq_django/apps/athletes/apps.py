"""
Athletes app configuration.
"""
from django.apps import AppConfig


class AthletesConfig(AppConfig):
    """
    Configuration for the athletes app.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.athletes'
    verbose_name = 'Athletes'
    
    def ready(self):
        """
        Import signals when the app is ready.
        """
        import apps.athletes.signals