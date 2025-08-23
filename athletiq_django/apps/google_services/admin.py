from django.contrib import admin
from .models import GoogleServiceUsage, TranslationCache, LocationCache


@admin.register(GoogleServiceUsage)
class GoogleServiceUsageAdmin(admin.ModelAdmin):
    list_display = [
        'service_type', 'operation', 'success', 'processing_time',
        'user', 'created_at'
    ]
    list_filter = [
        'service_type', 'operation', 'success', 'created_at'
    ]
    search_fields = ['operation', 'user__email', 'error_message']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(TranslationCache)
class TranslationCacheAdmin(admin.ModelAdmin):
    list_display = [
        'source_language', 'target_language', 'source_text_preview',
        'translated_text_preview', 'confidence', 'created_at'
    ]
    list_filter = ['source_language', 'target_language', 'created_at']
    search_fields = ['source_text', 'translated_text']
    readonly_fields = ['created_at', 'updated_at']
    
    def source_text_preview(self, obj):
        return obj.source_text[:50] + '...' if len(obj.source_text) > 50 else obj.source_text
    source_text_preview.short_description = 'Source Text'
    
    def translated_text_preview(self, obj):
        return obj.translated_text[:50] + '...' if len(obj.translated_text) > 50 else obj.translated_text
    translated_text_preview.short_description = 'Translated Text'


@admin.register(LocationCache)
class LocationCacheAdmin(admin.ModelAdmin):
    list_display = [
        'query', 'place_id', 'formatted_address', 'latitude', 'longitude', 'created_at'
    ]
    list_filter = ['created_at']
    search_fields = ['query', 'place_id', 'formatted_address']
    readonly_fields = ['created_at', 'updated_at']