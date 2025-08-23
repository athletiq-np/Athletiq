from django.contrib import admin
from django.utils.html import format_html
from .models import Document, ProcessedImage, OCRResult, PDFTemplate, GeneratedPDF


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        'document_id', 'title', 'document_type', 'uploaded_by', 
        'file_size_display', 'status', 'is_public', 'created_at'
    ]
    list_filter = ['document_type', 'status', 'is_public', 'created_at', 'mime_type']
    search_fields = ['title', 'description', 'uploaded_by__full_name']
    readonly_fields = ['document_id', 'file_size', 'mime_type', 'created_at', 'updated_at']
    raw_id_fields = ['uploaded_by', 'athlete', 'school', 'tournament', 'guardian']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'document_type', 'file')
        }),
        ('File Information', {
            'fields': ('file_size', 'mime_type', 'status', 'processing_result')
        }),
        ('Relationships', {
            'fields': ('uploaded_by', 'athlete', 'school', 'tournament', 'guardian')
        }),
        ('Settings', {
            'fields': ('is_public',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def file_size_display(self, obj):
        """Display file size in human readable format"""
        if obj.file_size:
            if obj.file_size < 1024:
                return f"{obj.file_size} B"
            elif obj.file_size < 1024 * 1024:
                return f"{obj.file_size / 1024:.1f} KB"
            else:
                return f"{obj.file_size / (1024 * 1024):.1f} MB"
        return "Unknown"
    file_size_display.short_description = "File Size"


@admin.register(ProcessedImage)
class ProcessedImageAdmin(admin.ModelAdmin):
    list_display = [
        'image_id', 'original_document', 'dimensions_display', 
        'file_size_display', 'quality', 'is_thumbnail', 'created_at'
    ]
    list_filter = ['is_thumbnail', 'quality', 'created_at']
    search_fields = ['original_document__title']
    readonly_fields = ['image_id', 'width', 'height', 'file_size', 'created_at']
    raw_id_fields = ['original_document']
    
    def dimensions_display(self, obj):
        return f"{obj.width} × {obj.height}"
    dimensions_display.short_description = "Dimensions"
    
    def file_size_display(self, obj):
        """Display file size in human readable format"""
        if obj.file_size < 1024:
            return f"{obj.file_size} B"
        elif obj.file_size < 1024 * 1024:
            return f"{obj.file_size / 1024:.1f} KB"
        else:
            return f"{obj.file_size / (1024 * 1024):.1f} MB"
    file_size_display.short_description = "File Size"


@admin.register(OCRResult)
class OCRResultAdmin(admin.ModelAdmin):
    list_display = [
        'ocr_id', 'document', 'confidence_score', 'language_detected', 
        'processing_time', 'created_at'
    ]
    list_filter = ['language_detected', 'created_at']
    search_fields = ['document__title', 'extracted_text']
    readonly_fields = ['ocr_id', 'created_at']
    raw_id_fields = ['document']
    
    fieldsets = (
        ('Document Information', {
            'fields': ('document',)
        }),
        ('OCR Results', {
            'fields': ('extracted_text', 'confidence_score', 'language_detected')
        }),
        ('Processing Information', {
            'fields': ('processing_time', 'metadata')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        })
    )


@admin.register(PDFTemplate)
class PDFTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'template_id', 'name', 'template_type', 'is_active', 
        'created_by', 'created_at'
    ]
    list_filter = ['template_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['template_id', 'created_at', 'updated_at']
    raw_id_fields = ['created_by']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'template_type', 'description')
        }),
        ('Template File', {
            'fields': ('template_file',)
        }),
        ('Settings', {
            'fields': ('is_active', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(GeneratedPDF)
class GeneratedPDFAdmin(admin.ModelAdmin):
    list_display = [
        'pdf_id', 'title', 'template', 'generated_by', 
        'file_size_display', 'created_at'
    ]
    list_filter = ['template__template_type', 'created_at']
    search_fields = ['title', 'template__name', 'generated_by__full_name']
    readonly_fields = ['pdf_id', 'file_size', 'created_at']
    raw_id_fields = ['template', 'generated_by', 'athlete', 'tournament']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'template', 'pdf_file')
        }),
        ('Generation Data', {
            'fields': ('generation_data',)
        }),
        ('Relationships', {
            'fields': ('generated_by', 'athlete', 'tournament')
        }),
        ('File Information', {
            'fields': ('file_size',)
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        })
    )
    
    def file_size_display(self, obj):
        """Display file size in human readable format"""
        if obj.file_size:
            if obj.file_size < 1024:
                return f"{obj.file_size} B"
            elif obj.file_size < 1024 * 1024:
                return f"{obj.file_size / 1024:.1f} KB"
            else:
                return f"{obj.file_size / (1024 * 1024):.1f} MB"
        return "Unknown"
    file_size_display.short_description = "File Size"
