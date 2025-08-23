import logging
from typing import Dict, Any, List
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from ..models import AlertRule, Alert, SystemMetrics

logger = logging.getLogger(__name__)


class AlertingService:
    """Service for managing alerts and notifications."""
    
    def __init__(self):
        self.operators = {
            'gt': lambda x, y: x > y,
            'lt': lambda x, y: x < y,
            'eq': lambda x, y: x == y,
            'gte': lambda x, y: x >= y,
            'lte': lambda x, y: x <= y,
        }
    
    def check_alert_rules(self) -> List[Dict[str, Any]]:
        """Check all active alert rules and trigger alerts if needed."""
        triggered_alerts = []
        
        active_rules = AlertRule.objects.filter(is_active=True)
        
        for rule in active_rules:
            try:
                if self._should_trigger_alert(rule):
                    alert = self._trigger_alert(rule)
                    triggered_alerts.append({
                        'rule_id': rule.id,
                        'rule_name': rule.name,
                        'alert_id': alert.id,
                        'severity': rule.severity,
                        'message': alert.message
                    })
            except Exception as e:
                logger.error(f"Failed to check alert rule {rule.name}: {str(e)}")
        
        return triggered_alerts
    
    def _should_trigger_alert(self, rule: AlertRule) -> bool:
        """Check if an alert rule should be triggered."""
        # Get recent metrics for this rule
        recent_metrics = SystemMetrics.objects.filter(
            metric_type=rule.metric_type,
            timestamp__gte=timezone.now() - timezone.timedelta(minutes=5)
        ).order_by('-timestamp')[:5]
        
        if not recent_metrics:
            return False
        
        # Check if any recent metric violates the rule
        operator = self.operators.get(rule.condition)
        if not operator:
            logger.error(f"Unknown operator: {rule.condition}")
            return False
        
        for metric in recent_metrics:
            if operator(metric.value, rule.threshold):
                # Check if there's already an active alert for this rule
                existing_alert = Alert.objects.filter(
                    rule=rule,
                    status='active'
                ).first()
                
                if not existing_alert:
                    return True
        
        return False
    
    def _trigger_alert(self, rule: AlertRule) -> Alert:
        """Trigger an alert for the given rule."""
        # Get the metric value that triggered the alert
        recent_metric = SystemMetrics.objects.filter(
            metric_type=rule.metric_type
        ).order_by('-timestamp').first()
        
        trigger_value = recent_metric.value if recent_metric else 0
        
        message = self._generate_alert_message(rule, trigger_value)
        
        # Create alert record
        alert = Alert.objects.create(
            rule=rule,
            trigger_value=trigger_value,
            message=message
        )
        
        # Send notifications
        self._send_alert_notifications(alert)
        
        logger.warning(f"Alert triggered: {rule.name} - {message}")
        
        return alert
    
    def _generate_alert_message(self, rule: AlertRule, trigger_value: float) -> str:
        """Generate alert message."""
        return (
            f"Alert: {rule.name}\n"
            f"Metric: {rule.metric_type}\n"
            f"Condition: {rule.get_condition_display()}\n"
            f"Threshold: {rule.threshold}\n"
            f"Current Value: {trigger_value}\n"
            f"Severity: {rule.get_severity_display()}\n"
            f"Description: {rule.description}"
        )
    
    def _send_alert_notifications(self, alert: Alert) -> None:
        """Send alert notifications via email."""
        if not alert.rule.notification_emails:
            return
        
        try:
            send_mail(
                subject=f"[{alert.rule.get_severity_display().upper()}] {alert.rule.name}",
                message=alert.message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@athletiq.com'),
                recipient_list=alert.rule.notification_emails,
                fail_silently=False
            )
            logger.info(f"Alert notification sent for {alert.rule.name}")
        except Exception as e:
            logger.error(f"Failed to send alert notification: {str(e)}")
    
    def acknowledge_alert(self, alert_id: int, user) -> bool:
        """Acknowledge an alert."""
        try:
            alert = Alert.objects.get(id=alert_id, status='active')
            alert.status = 'acknowledged'
            alert.acknowledged_by = user
            alert.acknowledged_at = timezone.now()
            alert.save()
            
            logger.info(f"Alert {alert_id} acknowledged by {user.username}")
            return True
        except Alert.DoesNotExist:
            logger.error(f"Alert {alert_id} not found or not active")
            return False
        except Exception as e:
            logger.error(f"Failed to acknowledge alert {alert_id}: {str(e)}")
            return False
    
    def resolve_alert(self, alert_id: int, user) -> bool:
        """Resolve an alert."""
        try:
            alert = Alert.objects.get(id=alert_id, status__in=['active', 'acknowledged'])
            alert.status = 'resolved'
            alert.resolved_at = timezone.now()
            alert.save()
            
            logger.info(f"Alert {alert_id} resolved by {user.username}")
            return True
        except Alert.DoesNotExist:
            logger.error(f"Alert {alert_id} not found or already resolved")
            return False
        except Exception as e:
            logger.error(f"Failed to resolve alert {alert_id}: {str(e)}")
            return False
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get all active alerts."""
        alerts = Alert.objects.filter(status__in=['active', 'acknowledged']).order_by('-triggered_at')
        
        return [
            {
                'id': alert.id,
                'rule_name': alert.rule.name,
                'severity': alert.rule.severity,
                'status': alert.status,
                'triggered_at': alert.triggered_at.isoformat(),
                'trigger_value': alert.trigger_value,
                'threshold': alert.rule.threshold,
                'message': alert.message,
                'acknowledged_by': alert.acknowledged_by.username if alert.acknowledged_by else None,
                'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None
            }
            for alert in alerts
        ]