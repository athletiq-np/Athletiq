import os
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

User = get_user_model()


def upload_to_documents(instance, filename):
    """Generate upload path for documents"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('documents', str(instance.uploaded_by.user_id), filename)


def upload_to_images(instance, filename):
    """Generate upload path for images"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('images', str(instance.uploaded_by.user_id), filename)


class Document(models.Model):
    """Model for storing uploaded documents"""
    
    DOCUMENT_TYPES = [
        ('certificate', 'Certificate'),
        ('scoresheet', 'Scoresheet'),
        ('athlete_photo', 'Athlete Photo'),
        ('guardian_document', 'Guardian Document'),
        ('school_document', 'School Document'),
        ('tournament_document', 'Tournament Document'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    document_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    file = models.FileField(
        upload_to=upload_to_documents,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif']
            )
        ]
    )
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    mime_type = models.CharField(max_length=100)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_documents')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processing_result = models.JSONField(default=dict, blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optional relationships
    athlete = models.ForeignKey('athletes.Athlete', on_delete=models.CASCADE, null=True, blank=True)
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    tournament = models.ForeignKey('tournaments.Tournament', on_delete=models.CASCADE, null=True, blank=True)
    guardian = models.ForeignKey('guardians.Guardian', on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        db_table = 'documents'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.document_type})"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            # Set mime type based on file extension or content type
            if hasattr(self.file, 'content_type') and self.file.content_type:
                self.mime_type = self.file.content_type
            else:
                ext = self.file.name.split('.')[-1].lower()
                mime_types = {
                    'pdf': 'application/pdf',
                    'doc': 'application/msword',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'png': 'image/png',
                    'gif': 'image/gif',
                    'txt': 'text/plain',
                }
                self.mime_type = mime_types.get(ext, 'application/octet-stream')
        else:
            # Set defaults when no file is provided
            if not self.file_size:
                self.file_size = 0
            if not self.mime_type:
                self.mime_type = 'application/octet-stream'
        
        super().save(*args, **kwargs)


class ProcessedImage(models.Model):
    """Model for storing processed/optimized images"""
    
    image_id = models.AutoField(primary_key=True)
    original_document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='processed_images')
    image = models.ImageField(upload_to=upload_to_images)
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
    file_size = models.PositiveIntegerField()
    quality = models.PositiveIntegerField(default=85)
    is_thumbnail = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'processed_images'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Processed image for {self.original_document.title}"


class OCRResult(models.Model):
    """Model for storing OCR processing results"""
    
    ocr_id = models.AutoField(primary_key=True)
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='ocr_result')
    extracted_text = models.TextField()
    confidence_score = models.FloatField(null=True, blank=True)
    language_detected = models.CharField(max_length=10, default='en')
    processing_time = models.FloatField(help_text="Processing time in seconds")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ocr_results'
    
    def __str__(self):
        return f"OCR result for {self.document.title}"


class PDFTemplate(models.Model):
    """Model for storing PDF templates"""
    
    TEMPLATE_TYPES = [
        ('scoresheet', 'Scoresheet'),
        ('certificate', 'Certificate'),
        ('report', 'Report'),
        ('custom', 'Custom'),
    ]
    
    template_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    template_type = models.CharField(max_length=50, choices=TEMPLATE_TYPES)
    description = models.TextField(blank=True)
    template_file = models.FileField(
        upload_to='pdf_templates/',
        validators=[FileExtensionValidator(allowed_extensions=['html', 'json'])]
    )
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pdf_templates'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.template_type})"


class GeneratedPDF(models.Model):
    """Model for tracking generated PDFs"""
    
    pdf_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    template = models.ForeignKey(PDFTemplate, on_delete=models.CASCADE)
    pdf_file = models.FileField(upload_to='generated_pdfs/')
    generation_data = models.JSONField(default=dict)
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    file_size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional relationships
    athlete = models.ForeignKey('athletes.Athlete', on_delete=models.CASCADE, null=True, blank=True)
    tournament = models.ForeignKey('tournaments.Tournament', on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        db_table = 'generated_pdfs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d')}"
