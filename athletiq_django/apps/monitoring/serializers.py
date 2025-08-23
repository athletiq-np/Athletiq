from rest_framework import serializers
from .models import HealthCheckLog, SystemMetrics, AlertRule, Alert


class HealthCheckLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthCheckLog
        fields = ['id', 'service', 'status', 'response_time', 'error_message', 'details', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class SystemMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemMetrics
        fields = ['id', 'metric_type', 'value', 'unit', 'endpoint', 'user_agent', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class AlertRuleSerializer(serializers.ModelSerializer):
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    
    class Meta:
        model = AlertRule
        fields = [
            'id', 'name', 'description', 'metric_type', 'condition', 'condition_display',
            'threshold', 'severity', 'severity_display', 'is_active', 'notification_emails',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'condition_display', 'severity_display']


class AlertSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    rule_severity = serializers.CharField(source='rule.severity', read_only=True)
    rule_threshold = serializers.FloatField(source='rule.threshold', read_only=True)
    acknowledged_by_username = serializers.CharField(source='acknowledged_by.username', read_only=True)
    
    class Meta:
        model = Alert
        fields = [
            'id', 'rule', 'rule_name', 'rule_severity', 'rule_threshold', 'status',
            'triggered_at', 'resolved_at', 'acknowledged_by', 'acknowledged_by_username',
            'acknowledged_at', 'trigger_value', 'message'
        ]
        read_only_fields = [
            'id', 'triggered_at', 'rule_name', 'rule_severity', 'rule_threshold',
            'acknowledged_by_username'
        ]