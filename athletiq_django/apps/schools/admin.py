"""
Django admin configuration for School models.
"""
from django.contrib import admin
from django.utils.html import format_html
from apps.schools.models import School, SchoolHouse, SchoolStaff, SchoolNotification


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    """
    Admin interface for School model.
    """
    list_display = [
        'school_code', 'name', 'city', 'province', 'onboarding_status',
        'admin_user_name', 'created_at', 'is_active'
    ]
    list_filter = ['onboarding_status', 'province', 'country', 'is_active', 'created_at']
    search_fields = ['name', 'school_code', 'city', 'admin_user__full_name', 'admin_user__email']
    readonly_fields = ['school_id', 'school_code', 'created_at', 'updated_at', 'full_address']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('school_id', 'school_code', 'name', 'principal_name')
        }),
        ('Location', {
            'fields': ('address', 'country', 'province', 'district', 'city', 'ward', 'full_address')
        }),
        ('Contact Information', {
            'fields': ('phone', 'email', 'website')
        }),
        ('Administration', {
            'fields': ('admin_user', 'onboarding_status')
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        }),
    )
    
    def admin_user_name(self, obj):
        """Display admin user name."""
        return obj.admin_user.full_name if obj.admin_user else '-'
    admin_user_name.short_description = 'Admin User'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('admin_user')


@admin.register(SchoolHouse)
class SchoolHouseAdmin(admin.ModelAdmin):
    """
    Admin interface for SchoolHouse model.
    """
    list_display = ['name', 'school', 'color_display', 'points', 'members_count', 'is_active']
    list_filter = ['school', 'is_active']
    search_fields = ['name', 'school__name']
    readonly_fields = ['created_at', 'updated_at', 'members_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('school', 'name', 'color')
        }),
        ('Statistics', {
            'fields': ('points', 'members_count')
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        }),
    )
    
    def color_display(self, obj):
        """Display color as a colored box."""
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc;"></div>',
            obj.color
        )
    color_display.short_description = 'Color'
    
    # def captain_name(self, obj):
    #     """Display captain name."""
    #     return obj.captain.full_name if obj.captain else 'Not assigned'
    # captain_name.short_description = 'Captain'
    
    def members_count(self, obj):
        """Display number of members."""
        return obj.get_members_count()
    members_count.short_description = 'Members'


@admin.register(SchoolStaff)
class SchoolStaffAdmin(admin.ModelAdmin):
    """
    Admin interface for SchoolStaff model.
    """
    list_display = ['full_name', 'position', 'school', 'department', 'email', 'status', 'hire_date']
    list_filter = ['position', 'department', 'status', 'school', 'hire_date']
    search_fields = ['full_name', 'email', 'school__name', 'position']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('full_name', 'email', 'phone')
        }),
        ('Position', {
            'fields': ('school', 'position', 'department', 'hire_date')
        }),
        ('Status', {
            'fields': ('status', 'is_active', 'created_at', 'updated_at')
        }),
    )


@admin.register(SchoolNotification)
class SchoolNotificationAdmin(admin.ModelAdmin):
    """
    Admin interface for SchoolNotification model.
    """
    list_display = ['title', 'school', 'type', 'priority', 'read_status', 'created_at']
    list_filter = ['type', 'priority', 'read_status', 'school', 'created_at']
    search_fields = ['title', 'message', 'school__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Notification Details', {
            'fields': ('school', 'title', 'message')
        }),
        ('Classification', {
            'fields': ('type', 'priority', 'read_status')
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('school')