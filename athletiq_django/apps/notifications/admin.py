"""
Django admin configuration for notifications app.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import NotificationTemplate, NotificationLog, NotificationPreference, GuardianClaim


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'category', 'is_active', 'created_at']
    list_filter = ['template_type', 'category', 'is_active', 'created_at']
    search_fields = ['name', 'subject', 'content']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'template_type', 'category', 'is_active')
        }),
        ('Content', {
            'fields': ('subject', 'content', 'html_content'),
            'classes': ('wide',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = [
        'notification_type', 'recipient_display', 'subject_truncated', 
        'status', 'template', 'sent_at', 'created_at'
    ]
    list_filter = [
        'notification_type', 'status', 'template__category', 
        'sent_at', 'created_at'
    ]
    search_fields = [
        'recipient_email', 'recipient_phone', 'recipient_name', 
        'subject', 'external_id'
    ]
    readonly_fields = [
        'id', 'external_id', 'sent_at', 'delivered_at', 
        'created_at', 'updated_at'
    ]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {
            'fields': ('notification_type', 'template', 'status')
        }),
        ('Recipient', {
            'fields': ('recipient_email', 'recipient_phone', 'recipient_name')
        }),
        ('Content', {
            'fields': ('subject', 'content', 'html_content'),
            'classes': ('collapse',)
        }),
        ('Tracking', {
            'fields': ('external_id', 'error_message', 'sent_at', 'delivered_at')
        }),
        ('Related Object', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('context_data', 'id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def recipient_display(self, obj):
        """Display recipient email or phone."""
        return obj.recipient_email or obj.recipient_phone or 'N/A'
    recipient_display.short_description = 'Recipient'
    
    def subject_truncated(self, obj):
        """Display truncated subject."""
        if obj.subject:
            return obj.subject[:50] + '...' if len(obj.subject) > 50 else obj.subject
        return 'N/A'
    subject_truncated.short_description = 'Subject'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('template', 'content_type')


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'guardian_registration', 'athlete_registration', 
        'tournament_updates', 'reminders', 'marketing'
    ]
    list_filter = [
        'guardian_registration', 'athlete_registration', 
        'tournament_updates', 'reminders', 'marketing'
    ]
    search_fields = ['user__email', 'user__full_name', 'preferred_email', 'preferred_phone']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('user',)
        }),
        ('Notification Preferences', {
            'fields': (
                'guardian_registration', 'athlete_registration', 
                'tournament_updates', 'reminders', 'marketing'
            )
        }),
        ('Contact Information', {
            'fields': ('preferred_email', 'preferred_phone')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(GuardianClaim)
class GuardianClaimAdmin(admin.ModelAdmin):
    list_display = [
        'claim_code', 'athlete_name', 'guardian_contact', 
        'status', 'expires_at', 'reminder_sent', 'created_at'
    ]
    list_filter = [
        'status', 'requires_school_approval', 'reminder_sent', 
        'expires_at', 'created_at'
    ]
    search_fields = [
        'claim_code', 'athlete__full_name', 'athlete__athlete_id',
        'guardian_email', 'guardian_phone'
    ]
    readonly_fields = [
        'id', 'claim_code', 'completed_at', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {
            'fields': ('athlete', 'claim_code', 'status')
        }),
        ('Guardian Information', {
            'fields': ('guardian_phone', 'guardian_email')
        }),
        ('Settings', {
            'fields': ('requires_school_approval', 'reminder_sent', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('completed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id',),
            'classes': ('collapse',)
        }),
    )
    
    def athlete_name(self, obj):
        """Display athlete name with link."""
        if obj.athlete:
            url = reverse('admin:athletes_athlete_change', args=[obj.athlete.pk])
            return format_html('<a href="{}">{}</a>', url, obj.athlete.full_name)
        return 'N/A'
    athlete_name.short_description = 'Athlete'
    
    def guardian_contact(self, obj):
        """Display guardian contact information."""
        contact = []
        if obj.guardian_email:
            contact.append(obj.guardian_email)
        if obj.guardian_phone:
            contact.append(obj.guardian_phone)
        return ' / '.join(contact) if contact else 'N/A'
    guardian_contact.short_description = 'Guardian Contact'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('athlete')
    
    actions = ['mark_as_completed', 'send_reminder']
    
    def mark_as_completed(self, request, queryset):
        """Mark selected claims as completed."""
        updated = queryset.filter(status='pending').update(status='completed')
        self.message_user(request, f'{updated} claims marked as completed.')
    mark_as_completed.short_description = 'Mark selected claims as completed'
    
    def send_reminder(self, request, queryset):
        """Send reminder for selected claims."""
        from .tasks import send_reminder_notifications_task
        
        # Filter for pending claims that haven't had reminders sent
        eligible_claims = queryset.filter(
            status='pending',
            reminder_sent=False
        )
        
        if eligible_claims.exists():
            # Trigger reminder task
            send_reminder_notifications_task.delay()
            self.message_user(request, f'Reminder task triggered for {eligible_claims.count()} claims.')
        else:
            self.message_user(request, 'No eligible claims for reminders.')
    send_reminder.short_description = 'Send reminder for selected claims'