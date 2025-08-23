import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import SystemMetrics, AlertRule
from .services.alerting import AlertingService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=SystemMetrics)
def check_alert_rules_on_metric(sender, instance, created, **kwargs):
    """Check alert rules when new metrics are created."""
    if created:
        try:
            alerting_service = AlertingService()
            # Check only rules for this specific metric type
            rules = AlertRule.objects.filter(
                metric_type=instance.metric_type,
                is_active=True
            )
            
            for rule in rules:
                try:
                    if alerting_service._should_trigger_alert(rule):
                        alerting_service._trigger_alert(rule)
                except Exception as e:
                    logger.error(f"Failed to check alert rule {rule.name}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Failed to check alert rules for metric {instance.metric_type}: {str(e)}")


@receiver(user_logged_in)
def track_user_login(sender, request, user, **kwargs):
    """Track user login metrics."""
    try:
        SystemMetrics.objects.create(
            metric_type='user_login',
            value=1,
            unit='count',
            endpoint=request.path if request else None
        )
    except Exception as e:
        logger.error(f"Failed to track user login: {str(e)}")


@receiver(user_logged_out)
def track_user_logout(sender, request, user, **kwargs):
    """Track user logout metrics."""
    try:
        SystemMetrics.objects.create(
            metric_type='user_logout',
            value=1,
            unit='count',
            endpoint=request.path if request else None
        )
    except Exception as e:
        logger.error(f"Failed to track user logout: {str(e)}")