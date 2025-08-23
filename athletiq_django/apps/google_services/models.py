from django.db import models
from apps.common.models import BaseModel


class GoogleServiceUsage(BaseModel):
    """Track Google service API usage for monitoring and billing"""
    
    SERVICE_TYPES = [
        ('vision', 'Google Vision API'),
        ('translate', 'Google Translate API'),
        ('maps', 'Google Maps API'),
    ]
    
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    operation = models.CharField(max_length=100)  # e.g., 'text_detection', 'translate_text'
    request_count = models.IntegerField(default=1)
    response_size = models.IntegerField(null=True, blank=True)  # bytes
    processing_time = models.FloatField(null=True, blank=True)  # seconds
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    user = models.ForeignKey(
        'authentication.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        db_table = 'google_service_usage'
        indexes = [
            models.Index(fields=['service_type', 'created_at']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.service_type} - {self.operation} - {self.created_at}"


class TranslationCache(BaseModel):
    """Cache translation results to reduce API calls"""
    
    source_text = models.TextField()
    source_language = models.CharField(max_length=10)
    target_language = models.CharField(max_length=10)
    translated_text = models.TextField()
    confidence = models.FloatField(null=True, blank=True)
    
    class Meta:
        db_table = 'translation_cache'
        unique_together = ['source_text', 'source_language', 'target_language']
        indexes = [
            models.Index(fields=['source_language', 'target_language']),
        ]
    
    def __str__(self):
        return f"{self.source_language} -> {self.target_language}: {self.source_text[:50]}"


class LocationCache(BaseModel):
    """Cache Google Maps location data"""
    
    query = models.CharField(max_length=500)
    place_id = models.CharField(max_length=100, unique=True)
    formatted_address = models.TextField()
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    location_data = models.JSONField(default=dict)  # Full Google Places response
    
    class Meta:
        db_table = 'location_cache'
        indexes = [
            models.Index(fields=['query']),
            models.Index(fields=['place_id']),
        ]
    
    def __str__(self):
        return f"{self.query} - {self.formatted_address}"