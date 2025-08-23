"""
Minimal athlete model for testing.
"""
from django.db import models
from apps.common.models import BaseModel
import uuid


class Athlete(BaseModel):
    """
    Minimal athlete model.
    """
    
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    
    # Core fields
    id = models.AutoField(primary_key=True)
    athlete_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    full_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    
    # School relationship using string reference
    school = models.ForeignKey(
        'schools.School', 
        on_delete=models.CASCADE, 
        related_name='athletes',
        db_column='school_id'
    )
    
    class Meta:
        db_table = 'players'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.full_name} ({self.athlete_id})"