"""
Enhanced admin interface for athlete models.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import Athlete


# @admin.register(Athlete)
class AthleteAdmin(admin.ModelAdmin):
    """
    Enhanced admin interface for Athlete model.
    """
    list_display = [
        'athlete_id', 'full_name', 'display_name_admin', 'age_display', 'gender', 
        'school_link', 'guardian_link', 'registration_status', 'verification_status',
        'profile_completion_bar', 'is_verified_display', 'created_at'
    ]
    
    list_filter = [
        'gender', 'school', 'created_at', 'is_active'
    ]
    
    search_fields = [
        'athlete_id', 'full_name', 'full_name_nepali', 'citizenship_no',
        'guardian_name', 'guardian_phone', 'guardian_email', 'school__name'
    ]
    
    readonly_fields = [
        'athlete_id', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'athlete_id', 'full_name', 'full_name_nepali',
                'date_of_birth', 'gender', 'nationality', 'citizenship_no'
            )
        }),
        ('School Information', {
            'fields': ('school', 'grade', 'section', 'player_code')
        }),
        ('Guardian Information', {
            'fields': (
                'guardian', 'guardian_name', 'relationship_to_player',
                'guardian_phone', 'guardian_email'
            )
        }),
        ('Address Information', {
            'fields': (
                'address', 'province', 'district', 
                'municipality_or_rural_municipality', 'ward_no'
            ),
            'classes': ('collapse',)
        }),
        ('Physical Information', {
            'fields': ('height_cm', 'weight_kg', 'blood_group'),
            'classes': ('collapse',)
        }),
        ('Sports Information', {
            'fields': ('registered_sports', 'primary_sport'),
            'classes': ('collapse',)
        }),
        ('Family Information', {
            'fields': ('father_name', 'mother_name'),
            'classes': ('collapse',)
        }),
        ('Medical Information', {
            'fields': (
                'medical_conditions', 'allergies', 'emergency_contact', 'medical_notes'
            ),
            'classes': ('collapse',)
        }),
        ('Documents', {
            'fields': (
                'profile_photo_url', 'birth_certificate_url', 'birth_certificate_verified',
                'birth_certificate_no', 'birth_certificate_date', 'birth_certificate_office'
            ),
            'classes': ('collapse',)
        }),
        ('Status & Verification', {
            'fields': (
                'registration_status', 'verification_status', 'profile_status',
                'profile_completion', 'document_verified', 'requires_manual_review'
            )
        }),
        ('System Information', {
            'fields': ('claim_code', 'created_by', 'created_at', 'updated_at', 'is_active'),
            'classes': ('collapse',)
        }),
    )
    
    list_per_page = 25
    date_hierarchy = 'created_at'
    
    actions = [
        'mark_as_verified', 'mark_as_pending', 'recalculate_profile_completion',
        'activate_athletes', 'deactivate_athletes'
    ]
    
    def display_name_admin(self, obj):
        """Display name with Nepali name if available."""
        if obj.full_name_nepali:
            return format_html(
                '{}<br><small style="color: #666;">{}</small>',
                obj.full_name,
                obj.full_name_nepali
            )
        return obj.full_name
    display_name_admin.short_description = 'Name'
    display_name_admin.admin_order_field = 'full_name'
    
    def school_link(self, obj):
        """Create a link to the school admin page."""
        if obj.school:
            url = reverse('admin:schools_school_change', args=[obj.school.pk])
            return format_html('<a href="{}">{}</a>', url, obj.school.name)
        return '-'
    school_link.short_description = 'School'
    school_link.admin_order_field = 'school__name'
    
    def guardian_link(self, obj):
        """Create a link to the guardian admin page if available."""
        if obj.guardian:
            url = reverse('admin:guardians_guardian_change', args=[obj.guardian.pk])
            return format_html('<a href="{}">{}</a>', url, obj.guardian.full_name)
        elif obj.guardian_name:
            return obj.guardian_name
        return '-'
    guardian_link.short_description = 'Guardian'
    guardian_link.admin_order_field = 'guardian__full_name'
    
    def age_display(self, obj):
        """Display athlete age."""
        return obj.age if obj.age else '-'
    age_display.short_description = 'Age'
    age_display.admin_order_field = 'date_of_birth'
    
    def is_verified_display(self, obj):
        """Display verification status as icon."""
        if obj.is_verified:
            return format_html('<span style="color: green;">✓ Verified</span>')
        else:
            return format_html('<span style="color: red;">✗ Not Verified</span>')
    is_verified_display.short_description = 'Verified'
    is_verified_display.boolean = True
    
    def profile_completion_bar(self, obj):
        """Display profile completion as a progress bar."""
        percentage = obj.profile_completion
        if percentage >= 80:
            color = '#28a745'  # Green
        elif percentage >= 50:
            color = '#ffc107'  # Yellow
        else:
            color = '#dc3545'  # Red
        
        return format_html(
            '<div style="width: 100px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 3px;">'
            '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 2px; text-align: center; line-height: 20px; color: white; font-size: 12px;">'
            '{}%'
            '</div>'
            '</div>',
            percentage, color, percentage
        )
    profile_completion_bar.short_description = 'Profile Completion'
    profile_completion_bar.admin_order_field = 'profile_completion'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('school', 'guardian', 'created_by')
    
    def mark_as_verified(self, request, queryset):
        """Mark selected athletes as verified."""
        updated = queryset.update(
            verification_status='verified',
            document_verified=True,
            requires_manual_review=False
        )
        self.message_user(request, f'{updated} athletes marked as verified.')
    mark_as_verified.short_description = 'Mark selected athletes as verified'
    
    def mark_as_pending(self, request, queryset):
        """Mark selected athletes as pending verification."""
        updated = queryset.update(verification_status='pending')
        self.message_user(request, f'{updated} athletes marked as pending verification.')
    mark_as_pending.short_description = 'Mark selected athletes as pending'
    
    def recalculate_profile_completion(self, request, queryset):
        """Recalculate profile completion for selected athletes."""
        count = 0
        for athlete in queryset:
            athlete.calculate_profile_completion()
            count += 1
        self.message_user(request, f'Profile completion recalculated for {count} athletes.')
    recalculate_profile_completion.short_description = 'Recalculate profile completion'
    
    def activate_athletes(self, request, queryset):
        """Activate selected athletes."""
        updated = queryset.update(is_active=True, registration_status='active')
        self.message_user(request, f'{updated} athletes activated.')
    activate_athletes.short_description = 'Activate selected athletes'
    
    def deactivate_athletes(self, request, queryset):
        """Deactivate selected athletes."""
        updated = queryset.update(is_active=False, registration_status='inactive')
        self.message_user(request, f'{updated} athletes deactivated.')
    deactivate_athletes.short_description = 'Deactivate selected athletes'