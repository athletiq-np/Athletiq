"""
Admin configuration for guardian models.
"""
from django.contrib import admin
from .models import Guardian, GuardianSession, AthleteClaimRequest, GuardianNotification


@admin.register(Guardian)
class GuardianAdmin(admin.ModelAdmin):
    """
    Guardian admin configuration.
    """
    list_display = [
        'full_name', 'email', 'phone', 'verification_status', 
        'email_verified', 'is_active', 'created_at'
    ]
    list_filter = ['verification_status', 'email_verified', 'is_active', 'created_at']
    search_fields = ['full_name', 'email', 'phone']
    readonly_fields = ['guardian_id', 'password_hash', 'verification_token', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('full_name', 'email', 'phone')
        }),
        ('Address', {
            'fields': ('address', 'city', 'province', 'district')
        }),
        ('Profile', {
            'fields': ('date_of_birth', 'occupation', 'profile_picture')
        }),
        ('Verification', {
            'fields': ('verification_status', 'email_verified', 'phone_verified', 'verification_token')
        }),
        ('System', {
            'fields': ('is_active', 'last_login', 'created_at', 'updated_at')
        }),
    )


@admin.register(GuardianSession)
class GuardianSessionAdmin(admin.ModelAdmin):
    """
    Guardian session admin configuration.
    """
    list_display = ['guardian', 'ip_address', 'is_active', 'created_at', 'last_activity']
    list_filter = ['is_active', 'created_at']
    search_fields = ['guardian__email', 'ip_address']
    readonly_fields = ['session_token', 'created_at', 'last_activity']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('guardian')


@admin.register(AthleteClaimRequest)
class AthleteClaimRequestAdmin(admin.ModelAdmin):
    """
    Athlete claim request admin configuration.
    """
    list_display = [
        'guardian', 'athlete_id', 'relationship', 'status', 
        'reviewed_by', 'created_at'
    ]
    list_filter = ['status', 'relationship', 'created_at']
    search_fields = ['guardian__full_name', 'guardian__email', 'athlete_id']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Claim Information', {
            'fields': ('guardian', 'athlete_id', 'relationship', 'notes')
        }),
        ('Supporting Documents', {
            'fields': ('supporting_documents',)
        }),
        ('Review', {
            'fields': ('status', 'reviewed_by', 'review_notes', 'reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('guardian', 'reviewed_by')


@admin.register(GuardianNotification)
class GuardianNotificationAdmin(admin.ModelAdmin):
    """
    Guardian notification admin configuration.
    """
    list_display = [
        'guardian', 'title', 'notification_type', 'is_read', 
        'is_sent', 'created_at'
    ]
    list_filter = ['notification_type', 'is_read', 'is_sent', 'created_at']
    search_fields = ['guardian__full_name', 'guardian__email', 'title']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('guardian')