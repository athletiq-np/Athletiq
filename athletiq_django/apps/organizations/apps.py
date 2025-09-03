"""
Organization app configuration.
"""

from django.apps import AppConfig


class OrganizationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.organizations'
    verbose_name = 'Organizations'

    def ready(self):
        # Import signal handlers
        try:
            import apps.organizations.signals
        except ImportError:
            pass