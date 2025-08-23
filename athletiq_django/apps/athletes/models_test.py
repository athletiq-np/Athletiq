"""
Test model to check if basic structure works.
"""
from django.db import models
from apps.common.models import BaseModel


class TestAthlete(BaseModel):
    """
    Simple test model.
    """
    name = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'test_athletes'
        
    def __str__(self):
        return self.name