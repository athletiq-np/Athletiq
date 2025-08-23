from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import HealthCheckLog, SystemMetrics, AlertRule, Alert


@admin.register(HealthCheckLog)
class HealthCheckLogAdmin(admin.ModelAdmin):
    list_display = ['service', 'status', 'response_time', 'timestamp', 'error_indicator']
    list_filter = ['service', 'status', 'timestamp']
    search_fields = ['service', 'error_message']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def error_indicator(self, obj):
        if obj.error_message:
            return format_html('<span style="color: red;">❌</span>')
        return format_html('<span style="color: green;">✅</span>')
    error_indicator.short_description = 'Error'
    
    def get_queryset(self, request):
        # Limit to recent logs for performance
        qs = super().get_queryset(request)
        return qs.filter(timestamp__gte=timezone.now() - timezone.timedelta(days=7))


@admin.register(SystemMetrics)
class SystemMetricsAdmin(admin.ModelAdmin):
    list_display = ['metric_type', 'value', 'unit', 'endpoint', 'timestamp']
    list_filter = ['metric_type', 'timestamp']
    search_fields = ['metric_type', 'endpoint']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def get_queryset(self, request):
        # Limit to recent metrics for performance
        qs = super().get_queryset(request)
        return qs.filter(timestamp__gte=timezone.now() - timezone.timedelta(days=1))


@admin.register(AlertRule)
class AlertRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'metric_type', 'condition_display', 'threshold', 'severity', 'is_active']
    list_filter = ['severity', 'is_active', 'metric_type']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Alert Condition', {
            'fields': ('metric_type', 'condition', 'threshold', 'severity')
        }),
        ('Notifications', {
            'fields': ('notification_emails',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def condition_display(self, obj):
        return f"{obj.get_condition_display()} {obj.threshold}"
    condition_display.short_description = 'Condition'


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['rule', 'status', 'severity_display', 'trigger_value', 'triggered_at', 'acknowledged_by']
    list_filter = ['status', 'rule__severity', 'triggered_at']
    search_fields = ['rule__name', 'message']
    readonly_fields = ['triggered_at', 'resolved_at', 'acknowledged_at']
    
    fieldsets = (
        ('Alert Information', {
            'fields': ('rule', 'status', 'trigger_value', 'message')
        }),
        ('Timeline', {
            'fields': ('triggered_at', 'acknowledged_by', 'acknowledged_at', 'resolved_at')
        })
    )
    
    def severity_display(self, obj):
        severity = obj.rule.severity
        colors = {
            'low': 'green',
            'medium': 'orange',
            'high': 'red',
            'critical': 'darkred'
        }
        color = colors.get(severity, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            severity.upper()
        )
    severity_display.short_description = 'Severity'
    
    actions = ['acknowledge_alerts', 'resolve_alerts']
    
    def acknowledge_alerts(self, request, queryset):
        updated = queryset.filter(status='active').update(
            status='acknowledged',
            acknowledged_by=request.user,
            acknowledged_at=timezone.now()
        )
        self.message_user(request, f'{updated} alerts acknowledged.')
    acknowledge_alerts.short_description = 'Acknowledge selected alerts'
    
    def resolve_alerts(self, request, queryset):
        updated = queryset.filter(status__in=['active', 'acknowledged']).update(
            status='resolved',
            resolved_at=timezone.now()
        )
        self.message_user(request, f'{updated} alerts resolved.')
    resolve_alerts.short_description = 'Resolve selected alerts'