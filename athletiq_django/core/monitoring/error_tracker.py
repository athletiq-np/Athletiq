"""
Error tracking and monitoring system for Athletiq Django application.
Provides error aggregation, alerting, and metrics collection.
"""
import json
import time
import logging
from datetime import datetime, timedelta
from django.core.cache import cache
from django.conf import settings
from django.core.mail import send_mail
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class ErrorTracker:
    """
    Centralized error tracking and monitoring system.
    """
    
    def __init__(self):
        self.cache_prefix = "error_tracker"
        self.alert_thresholds = {
            'server_errors': 10,  # 5xx errors per hour
            'auth_failures': 50,  # Authentication failures per hour
            'rate_limit_violations': 100,  # Rate limit hits per hour
            'security_events': 5,  # Security events per hour
        }
    
    def track_error(self, error_type: str, details: Dict, severity: str = 'medium'):
        """Track an error occurrence."""
        timestamp = int(time.time())
        
        # Store error details
        error_data = {
            'type': error_type,
            'details': details,
            'severity': severity,
            'timestamp': timestamp,
            'count': 1
        }
        
        # Update counters
        self._update_error_counters(error_type, severity)
        
        # Store recent errors for analysis
        self._store_recent_error(error_data)
        
        # Check if alerting is needed
        self._check_alert_thresholds(error_type, severity)
        
        # Log the error
        self._log_error_event(error_data)
    
    def get_error_summary(self, hours: int = 24) -> Dict:
        """Get error summary for the specified time period."""
        summary = {
            'total_errors': 0,
            'by_type': {},
            'by_severity': {'low': 0, 'medium': 0, 'high': 0, 'critical': 0},
            'recent_errors': [],
            'trends': {}
        }
        
        # Get error counts by type
        for error_type in ['server_errors', 'auth_failures', 'validation_errors', 'security_events']:
            count = self._get_error_count(error_type, hours)
            summary['by_type'][error_type] = count
            summary['total_errors'] += count
        
        # Get recent errors
        summary['recent_errors'] = self._get_recent_errors(limit=50)
        
        # Calculate trends
        summary['trends'] = self._calculate_error_trends()
        
        return summary
    
    def get_error_metrics(self) -> Dict:
        """Get error metrics for monitoring dashboard."""
        return {
            'error_rate_1h': self._get_error_rate(1),
            'error_rate_24h': self._get_error_rate(24),
            'top_errors': self._get_top_errors(),
            'error_distribution': self._get_error_distribution(),
            'alert_status': self._get_alert_status(),
        }
    
    def _update_error_counters(self, error_type: str, severity: str):
        """Update error counters in cache."""
        # Hourly counter
        hour_key = f"{self.cache_prefix}:hourly:{error_type}:{int(time.time() // 3600)}"
        cache.set(hour_key, cache.get(hour_key, 0) + 1, 3600)
        
        # Daily counter
        day_key = f"{self.cache_prefix}:daily:{error_type}:{int(time.time() // 86400)}"
        cache.set(day_key, cache.get(day_key, 0) + 1, 86400)
        
        # Severity counter
        severity_key = f"{self.cache_prefix}:severity:{severity}:{int(time.time() // 3600)}"
        cache.set(severity_key, cache.get(severity_key, 0) + 1, 3600)
    
    def _store_recent_error(self, error_data: Dict):
        """Store recent error for analysis."""
        recent_errors_key = f"{self.cache_prefix}:recent_errors"
        recent_errors = cache.get(recent_errors_key, [])
        
        # Add new error
        recent_errors.append(error_data)
        
        # Keep only last 100 errors
        if len(recent_errors) > 100:
            recent_errors = recent_errors[-100:]
        
        cache.set(recent_errors_key, recent_errors, 3600)
    
    def _get_error_count(self, error_type: str, hours: int) -> int:
        """Get error count for specified time period."""
        total_count = 0
        current_hour = int(time.time() // 3600)
        
        for i in range(hours):
            hour_key = f"{self.cache_prefix}:hourly:{error_type}:{current_hour - i}"
            total_count += cache.get(hour_key, 0)
        
        return total_count
    
    def _get_recent_errors(self, limit: int = 50) -> List[Dict]:
        """Get recent errors."""
        recent_errors_key = f"{self.cache_prefix}:recent_errors"
        recent_errors = cache.get(recent_errors_key, [])
        return recent_errors[-limit:]
    
    def _calculate_error_trends(self) -> Dict:
        """Calculate error trends."""
        current_hour = int(time.time() // 3600)
        trends = {}
        
        for error_type in ['server_errors', 'auth_failures', 'validation_errors']:
            # Current hour vs previous hour
            current = cache.get(f"{self.cache_prefix}:hourly:{error_type}:{current_hour}", 0)
            previous = cache.get(f"{self.cache_prefix}:hourly:{error_type}:{current_hour - 1}", 0)
            
            if previous > 0:
                trend = ((current - previous) / previous) * 100
            else:
                trend = 100 if current > 0 else 0
            
            trends[error_type] = {
                'current_hour': current,
                'previous_hour': previous,
                'trend_percentage': round(trend, 2)
            }
        
        return trends
    
    def _get_error_rate(self, hours: int) -> float:
        """Calculate error rate per hour."""
        total_errors = sum(
            self._get_error_count(error_type, hours)
            for error_type in ['server_errors', 'auth_failures', 'validation_errors']
        )
        return round(total_errors / hours, 2)
    
    def _get_top_errors(self, limit: int = 10) -> List[Dict]:
        """Get top errors by frequency."""
        recent_errors = self._get_recent_errors(100)
        error_counts = {}
        
        for error in recent_errors:
            error_type = error['type']
            if error_type in error_counts:
                error_counts[error_type] += 1
            else:
                error_counts[error_type] = 1
        
        # Sort by count
        sorted_errors = sorted(error_counts.items(), key=lambda x: x[1], reverse=True)
        
        return [
            {'type': error_type, 'count': count}
            for error_type, count in sorted_errors[:limit]
        ]
    
    def _get_error_distribution(self) -> Dict:
        """Get error distribution by severity."""
        distribution = {}
        current_hour = int(time.time() // 3600)
        
        for severity in ['low', 'medium', 'high', 'critical']:
            count = cache.get(f"{self.cache_prefix}:severity:{severity}:{current_hour}", 0)
            distribution[severity] = count
        
        return distribution
    
    def _get_alert_status(self) -> Dict:
        """Get current alert status."""
        alerts = {}
        
        for alert_type, threshold in self.alert_thresholds.items():
            current_count = self._get_error_count(alert_type, 1)  # Last hour
            alerts[alert_type] = {
                'current': current_count,
                'threshold': threshold,
                'status': 'alert' if current_count >= threshold else 'ok'
            }
        
        return alerts
    
    def _check_alert_thresholds(self, error_type: str, severity: str):
        """Check if error thresholds are exceeded and send alerts."""
        if error_type in self.alert_thresholds:
            current_count = self._get_error_count(error_type, 1)  # Last hour
            threshold = self.alert_thresholds[error_type]
            
            if current_count >= threshold:
                self._send_alert(error_type, current_count, threshold, severity)
    
    def _send_alert(self, error_type: str, count: int, threshold: int, severity: str):
        """Send alert notification."""
        alert_key = f"{self.cache_prefix}:alert_sent:{error_type}:{int(time.time() // 3600)}"
        
        # Prevent duplicate alerts within the same hour
        if cache.get(alert_key):
            return
        
        cache.set(alert_key, True, 3600)
        
        # Log alert
        alert_data = {
            'level': 'error' if severity in ['high', 'critical'] else 'warn',
            'message': f"Error threshold exceeded: {error_type}",
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
            'alert': {
                'type': error_type,
                'count': count,
                'threshold': threshold,
                'severity': severity,
                'timeframe': '1 hour'
            },
            'meta': {
                'service': 'athletiq-django',
                'environment': getattr(settings, 'ENVIRONMENT', 'development'),
            }
        }
        
        logger.error(json.dumps(alert_data))
        
        # Send email alert if configured
        if getattr(settings, 'SEND_ERROR_ALERTS', False):
            self._send_email_alert(alert_data)
    
    def _send_email_alert(self, alert_data: Dict):
        """Send email alert to administrators."""
        try:
            subject = f"[Athletiq Alert] {alert_data['alert']['type']} threshold exceeded"
            message = f"""
Error Alert - Athletiq Django Application

Alert Type: {alert_data['alert']['type']}
Current Count: {alert_data['alert']['count']}
Threshold: {alert_data['alert']['threshold']}
Severity: {alert_data['alert']['severity']}
Timeframe: {alert_data['alert']['timeframe']}
Environment: {alert_data['meta']['environment']}
Timestamp: {alert_data['timestamp']}

Please investigate the issue immediately.
            """
            
            admin_emails = getattr(settings, 'ADMIN_EMAILS', [])
            if admin_emails:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    admin_emails,
                    fail_silently=True
                )
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
    
    def _log_error_event(self, error_data: Dict):
        """Log error event for monitoring."""
        log_data = {
            'level': 'error',
            'message': f"Error tracked: {error_data['type']}",
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
            'error_tracking': error_data,
            'meta': {
                'service': 'athletiq-django',
                'environment': getattr(settings, 'ENVIRONMENT', 'development'),
            }
        }
        
        if getattr(settings, 'STRUCTURED_LOGGING', True):
            logger.info(json.dumps(log_data))
        else:
            logger.info(f"Error tracked: {error_data['type']} - Severity: {error_data['severity']}")


# Global error tracker instance
error_tracker = ErrorTracker()


def track_error(error_type: str, details: Dict, severity: str = 'medium'):
    """Convenience function to track errors."""
    error_tracker.track_error(error_type, details, severity)


def get_error_summary(hours: int = 24) -> Dict:
    """Convenience function to get error summary."""
    return error_tracker.get_error_summary(hours)


def get_error_metrics() -> Dict:
    """Convenience function to get error metrics."""
    return error_tracker.get_error_metrics()