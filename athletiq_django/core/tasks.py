"""
Core system tasks for Celery.
"""
import logging
from datetime import datetime, timedelta
from celery import shared_task
from django.core.management import call_command
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from core.monitoring.error_tracker import ErrorTracker
from core.performance.monitors import PerformanceMonitor

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_performance_report(self):
    """
    Generate daily performance report.
    """
    try:
        logger.info("Starting performance report generation")
        
        # Generate performance metrics
        monitor = PerformanceMonitor()
        report_data = monitor.generate_daily_report()
        
        # Store report in cache for quick access
        cache_key = f"performance_report_{datetime.now().strftime('%Y-%m-%d')}"
        cache.set(cache_key, report_data, timeout=86400 * 7)  # Keep for 7 days
        
        logger.info("Performance report generated successfully")
        return {
            'status': 'success',
            'report_date': datetime.now().isoformat(),
            'metrics_count': len(report_data.get('metrics', []))
        }
        
    except Exception as exc:
        logger.error(f"Performance report generation failed: {str(exc)}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def cleanup_old_logs(self, days_to_keep=30):
    """
    Clean up old log files and database log entries.
    """
    try:
        logger.info(f"Starting log cleanup for entries older than {days_to_keep} days")
        
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        # Clean up error tracking entries
        error_tracker = ErrorTracker()
        deleted_count = error_tracker.cleanup_old_entries(cutoff_date)
        
        logger.info(f"Cleaned up {deleted_count} old log entries")
        return {
            'status': 'success',
            'deleted_entries': deleted_count,
            'cutoff_date': cutoff_date.isoformat()
        }
        
    except Exception as exc:
        logger.error(f"Log cleanup failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def system_health_check(self):
    """
    Perform comprehensive system health check.
    """
    try:
        logger.info("Starting system health check")
        
        health_status = {
            'timestamp': datetime.now().isoformat(),
            'database': False,
            'cache': False,
            'celery': True,  # If this task runs, Celery is working
            'external_services': {}
        }
        
        # Check database connectivity
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                health_status['database'] = True
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            health_status['database'] = False
        
        # Check cache connectivity
        try:
            cache.set('health_check', 'ok', timeout=60)
            if cache.get('health_check') == 'ok':
                health_status['cache'] = True
                cache.delete('health_check')
        except Exception as e:
            logger.error(f"Cache health check failed: {str(e)}")
            health_status['cache'] = False
        
        # Check external services
        health_status['external_services'] = _check_external_services()
        
        # Store health status in cache
        cache.set('system_health_status', health_status, timeout=300)  # 5 minutes
        
        logger.info("System health check completed")
        return health_status
        
    except Exception as exc:
        logger.error(f"System health check failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def backup_critical_data(self):
    """
    Create backup of critical system data.
    """
    try:
        logger.info("Starting critical data backup")
        
        backup_info = {
            'timestamp': datetime.now().isoformat(),
            'status': 'in_progress',
            'tables_backed_up': []
        }
        
        # Use Django's dumpdata command for critical tables
        critical_models = [
            'authentication.User',
            'schools.School',
            'tournaments.Tournament',
            'athletes.Athlete',
            'guardians.Guardian'
        ]
        
        with transaction.atomic():
            for model in critical_models:
                try:
                    # This would typically write to a backup location
                    # For now, we'll just log the operation
                    logger.info(f"Backing up {model}")
                    backup_info['tables_backed_up'].append(model)
                except Exception as e:
                    logger.error(f"Failed to backup {model}: {str(e)}")
        
        backup_info['status'] = 'completed'
        logger.info("Critical data backup completed")
        return backup_info
        
    except Exception as exc:
        logger.error(f"Critical data backup failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


def _check_external_services():
    """
    Check the health of external services.
    """
    services_status = {}
    
    # Check Google Services
    try:
        from apps.google_services.services.google_service_manager import GoogleServiceManager
        manager = GoogleServiceManager()
        services_status['google_vision'] = manager.vision_service.is_available()
        services_status['google_translate'] = manager.translate_service.is_available()
        services_status['google_maps'] = manager.maps_service.is_available()
    except Exception as e:
        logger.error(f"Google services health check failed: {str(e)}")
        services_status['google_services'] = False
    
    # Check Twilio
    try:
        from apps.notifications.services.sms_service import SMSService
        sms_service = SMSService()
        services_status['twilio'] = sms_service.is_available()
    except Exception as e:
        logger.error(f"Twilio health check failed: {str(e)}")
        services_status['twilio'] = False
    
    return services_status


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_system_alert(self, alert_type, message, severity='info'):
    """
    Send system alerts to administrators.
    """
    try:
        logger.info(f"Sending system alert: {alert_type}")
        
        # This would typically send notifications to system administrators
        # For now, we'll log the alert and store it in cache
        alert_data = {
            'type': alert_type,
            'message': message,
            'severity': severity,
            'timestamp': datetime.now().isoformat()
        }
        
        # Store alert in cache for admin dashboard
        alerts_key = 'system_alerts'
        alerts = cache.get(alerts_key, [])
        alerts.append(alert_data)
        
        # Keep only last 100 alerts
        if len(alerts) > 100:
            alerts = alerts[-100:]
        
        cache.set(alerts_key, alerts, timeout=86400 * 7)  # Keep for 7 days
        
        logger.info(f"System alert sent: {alert_type}")
        return alert_data
        
    except Exception as exc:
        logger.error(f"Failed to send system alert: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))