"""
Common models and base classes for Athletiq system.
"""
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model with common fields for all models.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        abstract = True
        
    def soft_delete(self):
        """Soft delete by setting is_active to False."""
        self.is_active = False
        self.save()
        
    def restore(self):
        """Restore soft deleted record."""
        self.is_active = True
        self.save()


class TimestampedModel(models.Model):
    """
    Abstract base model with only timestamp fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True