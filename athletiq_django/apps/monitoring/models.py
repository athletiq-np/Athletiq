from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class HealthCheckLog(models.Model):
    """Log health check results for monitoring and analysis."""
    
    SERVICE_CHOICES = [
        ('database', 'Database'),
        ('redis', 'Redis Cache'),
        ('email', 'Email Service'),
        ('sms', 'SMS Service'),
        ('google_vision', 'Google Vision API'),
        ('google_translate', 'Google Translate API'),
        ('google_maps', 'Google Maps API'),
        ('file_storage', 'File Storage'),
    ]
    
    STATUS_CHOICES = [
        ('healthy', 'Healthy'),
        ('degraded', 'Degraded'),
        ('unhealthy', 'Unhealthy'),
    ]
    
    service = models.CharField(max_length=50, choices=SERVICE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    response_time = models.FloatField(help_text="Response time in milliseconds")
    error_message = models.TextField(blank=True, null=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'monitoring_health_check_log'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['service', 'timestamp']),
            models.Index(fields=['status', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.service} - {self.status} at {self.timestamp}"


class SystemMetrics(models.Model):
    """Store system performance metrics."""
    
    METRIC_TYPES = [
        ('api_response_time', 'API Response Time'),
        ('database_query_time', 'Database Query Time'),
        ('memory_usage', 'Memory Usage'),
        ('cpu_usage', 'CPU Usage'),
        ('active_users', 'Active Users'),
        ('request_count', 'Request Count'),
        ('error_rate', 'Error Rate'),
    ]
    
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    value = models.FloatField()
    unit = models.CharField(max_length=20, default='ms')
    endpoint = models.CharField(max_length=255, blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'monitoring_system_metrics'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric_type', 'timestamp']),
            models.Index(fields=['endpoint', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.metric_type}: {self.value}{self.unit} at {self.timestamp}"


class AlertRule(models.Model):
    """Define alerting rules for monitoring."""
    
    CONDITION_CHOICES = [
        ('gt', 'Greater Than'),
        ('lt', 'Less Than'),
        ('eq', 'Equal To'),
        ('gte', 'Greater Than or Equal'),
        ('lte', 'Less Than or Equal'),
    ]
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    metric_type = models.CharField(max_length=50)
    condition = models.CharField(max_length=10, choices=CONDITION_CHOICES)
    threshold = models.FloatField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    is_active = models.BooleanField(default=True)
    notification_emails = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'monitoring_alert_rule'
        ordering = ['severity', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.severity})"


class Alert(models.Model):
    """Store triggered alerts."""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
    ]
    
    rule = models.ForeignKey(AlertRule, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    triggered_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(blank=True, null=True)
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    acknowledged_at = models.DateTimeField(blank=True, null=True)
    trigger_value = models.FloatField()
    message = models.TextField()
    
    class Meta:
        db_table = 'monitoring_alert'
        ordering = ['-triggered_at']
        indexes = [
            models.Index(fields=['status', 'triggered_at']),
            models.Index(fields=['rule', 'triggered_at']),
        ]
    
    def __str__(self):
        return f"Alert: {self.rule.name} - {self.status}"