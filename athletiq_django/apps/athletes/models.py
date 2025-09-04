"""
Enhanced athlete model with comprehensive fields.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.common.models import BaseModel
from datetime import date
import uuid
import random


def generate_athlete_id():
    """Generate custom athlete ID in format NPXXXXXX where XXXXXX is 6 random digits."""
    # Get 6 random digits to ensure better uniqueness (1 million combinations)
    random_digits = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    return f"NP{random_digits}"


class Athlete(BaseModel):
    """
    Enhanced athlete model with comprehensive fields.
    """
    
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
    ]
    
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('requires_review', 'Requires Manual Review'),
    ]
    
    # Core fields
    id = models.AutoField(primary_key=True)
    athlete_id = models.CharField(max_length=8, unique=True, default=generate_athlete_id, editable=False)
    full_name = models.CharField(max_length=100)
    full_name_nepali = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    
    # School and grade information
    school = models.ForeignKey(
        'schools.School', 
        on_delete=models.CASCADE, 
        related_name='athletes',
        db_column='school_id'
    )
    grade = models.CharField(max_length=10, blank=True, null=True)
    section = models.CharField(max_length=10, blank=True, null=True)
    
    # Personal information
    nationality = models.CharField(max_length=50, default='Nepali')
    citizenship_no = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    province = models.CharField(max_length=50, blank=True, null=True)
    district = models.CharField(max_length=50, blank=True, null=True)
    municipality_or_rural_municipality = models.CharField(max_length=100, blank=True, null=True)
    ward_no = models.CharField(max_length=10, blank=True, null=True)
    
    # Guardian information
    guardian = models.ForeignKey(
        'guardians.Guardian',
        on_delete=models.SET_NULL,
        related_name='athletes',
        null=True,
        blank=True
    )
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    relationship_to_player = models.CharField(max_length=50, blank=True, null=True)
    guardian_phone = models.CharField(max_length=20, blank=True, null=True)
    guardian_email = models.EmailField(blank=True, null=True)
    
    # Physical attributes
    height_cm = models.IntegerField(
        validators=[MinValueValidator(50), MaxValueValidator(250)],
        null=True,
        blank=True
    )
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(10), MaxValueValidator(200)],
        null=True,
        blank=True
    )
    blood_group = models.CharField(
        max_length=3,
        choices=BLOOD_GROUP_CHOICES,
        blank=True,
        null=True
    )
    
    # Sports information
    registered_sports = models.JSONField(default=list)
    primary_sport = models.CharField(max_length=50, blank=True, null=True)
    
    # Family information
    father_name = models.CharField(max_length=100, blank=True, null=True)
    mother_name = models.CharField(max_length=100, blank=True, null=True)
    
    # Medical information
    medical_conditions = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    medical_notes = models.TextField(blank=True, null=True)
    
    # Profile and document information
    profile_photo_url = models.URLField(blank=True, null=True)
    birth_certificate_url = models.URLField(blank=True, null=True)
    birth_certificate_no = models.CharField(max_length=50, blank=True, null=True)
    birth_certificate_date = models.DateField(blank=True, null=True)
    birth_certificate_office = models.CharField(max_length=100, blank=True, null=True)
    
    # Verification status
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='pending'
    )
    document_verified = models.BooleanField(default=False)
    birth_certificate_verified = models.BooleanField(default=False)
    requires_manual_review = models.BooleanField(default=False)
    profile_completion = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'players'
        ordering = ['-created_at']
        
    def save(self, *args, **kwargs):
        """Override save to ensure unique athlete_id generation."""
        if not self.athlete_id:
            # Generate a unique athlete_id
            while True:
                new_id = generate_athlete_id()
                if not Athlete.objects.filter(athlete_id=new_id).exists():
                    self.athlete_id = new_id
                    break
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.full_name} ({self.athlete_id})"
        
    @property
    def age(self):
        """Calculate athlete's current age."""
        if not self.date_of_birth:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
        
    @property
    def display_name(self):
        """Return display name in preferred format."""
        return self.full_name_nepali or self.full_name
    
    @property
    def can_participate(self):
        """Check if athlete can participate in tournaments."""
        return (
            self.is_active and
            self.verification_status == 'verified' and
            self.profile_completion >= 80
        )
        
    def calculate_profile_completion(self):
        """Calculate profile completion percentage based on filled fields."""
        required_fields = [
            'full_name', 'date_of_birth', 'gender', 'school',
            'guardian_name', 'guardian_phone'
        ]
        optional_fields = [
            'full_name_nepali', 'grade', 'section', 'nationality',
            'citizenship_no', 'address', 'province', 'district',
            'municipality_or_rural_municipality', 'ward_no', 'guardian_email',
            'height_cm', 'weight_kg', 'blood_group', 'primary_sport',
            'father_name', 'mother_name', 'medical_conditions',
            'allergies', 'emergency_contact', 'profile_photo_url',
            'birth_certificate_url'
        ]
        
        # Required fields count more towards completion
        required_weight = 0.7
        optional_weight = 0.3
        
        # Calculate required fields completion
        required_filled = sum(1 for field in required_fields if getattr(self, field))
        required_score = (required_filled / len(required_fields)) * required_weight
        
        # Calculate optional fields completion
        optional_filled = sum(1 for field in optional_fields if getattr(self, field))
        optional_score = (optional_filled / len(optional_fields)) * optional_weight
        
        # Calculate total completion percentage
        completion = int((required_score + optional_score) * 100)
        
        # Update the field
        self.profile_completion = min(completion, 100)
        self.save(update_fields=['profile_completion'])
        
        return self.profile_completion
        
    def soft_delete(self):
        """Soft delete by setting is_active to False."""
        self.is_active = False
        self.save(update_fields=['is_active'])