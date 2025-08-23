"""
Celery configuration for Athletiq Django project.
"""
import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'athletiq.settings.development')

app = Celery('athletiq')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat Configuration
app.conf.beat_schedule = {
    'cleanup-expired-notifications': {
        'task': 'apps.notifications.tasks.cleanup_expired_notifications',
        'schedule': 3600.0,  # Run every hour
    },
    'cleanup-old-documents': {
        'task': 'apps.documents.tasks.cleanup_old_documents',
        'schedule': 86400.0,  # Run daily
    },
    'generate-performance-reports': {
        'task': 'core.tasks.generate_performance_report',
        'schedule': 86400.0,  # Run daily
    },
}

# Task routing configuration
app.conf.task_routes = {
    'apps.notifications.tasks.*': {'queue': 'notifications'},
    'apps.documents.tasks.*': {'queue': 'documents'},
    'core.tasks.*': {'queue': 'system'},
    'apps.athletes.tasks.*': {'queue': 'bulk_operations'},
    'apps.tournaments.tasks.*': {'queue': 'bulk_operations'},
    'apps.schools.tasks.*': {'queue': 'bulk_operations'},
}

# Task configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone=settings.TIME_ZONE,
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,
    task_compression='gzip',
    result_compression='gzip',
    result_expires=3600,  # 1 hour
)

@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery configuration."""
    print(f'Request: {self.request!r}')
    return 'Debug task completed successfully'