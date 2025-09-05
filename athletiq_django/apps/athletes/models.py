"""
Enhanced athlete model with comprehensive fields.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.utils import timezone
from apps.common.models import BaseModel
from datetime import date
import uuid
import random
import os


def generate_athlete_id():
    """Generate custom athlete ID in format NPXXXXXX where XXXXXX is 6 random digits."""
    # Get 6 random digits to ensure better uniqueness (1 million combinations)
    random_digits = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    return f"NP{random_digits}"


def athlete_profile_image_path(instance, filename):
    """Generate upload path for athlete profile images."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('athletes', 'profiles', str(instance.athlete_id), filename)


def athlete_document_path(instance, filename):
    """Generate upload path for athlete documents."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('athletes', 'documents', str(instance.athlete_id), filename)


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
    profile_photo = models.ImageField(
        upload_to=athlete_profile_image_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif'])],
        help_text="Profile photo (JPG, PNG, GIF - Max 5MB)"
    )
    profile_photo_url = models.URLField(blank=True, null=True)  # Keep for backward compatibility
    
    birth_certificate = models.FileField(
        upload_to=athlete_document_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'])],
        help_text="Birth certificate (PDF, JPG, PNG, DOC, DOCX - Max 10MB)"
    )
    birth_certificate_url = models.URLField(blank=True, null=True)  # Keep for backward compatibility
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
    
    @property
    def profile_image_url(self):
        """Get profile image URL (file or external URL)."""
        if self.profile_photo and hasattr(self.profile_photo, 'url'):
            return self.profile_photo.url
        elif self.profile_photo_url:
            return self.profile_photo_url
        return None
    
    @property
    def birth_certificate_file_url(self):
        """Get birth certificate file URL (file or external URL)."""
        if self.birth_certificate and hasattr(self.birth_certificate, 'url'):
            return self.birth_certificate.url
        elif self.birth_certificate_url:
            return self.birth_certificate_url
        return None
    
    @property
    def has_profile_photo(self):
        """Check if athlete has a profile photo."""
        return bool(self.profile_photo or self.profile_photo_url)
    
    @property
    def has_birth_certificate(self):
        """Check if athlete has a birth certificate."""
        return bool(self.birth_certificate or self.birth_certificate_url)
        
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
            'allergies', 'emergency_contact', 'profile_photo', 'profile_photo_url',
            'birth_certificate', 'birth_certificate_url'
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


class AthleteDocument(BaseModel):
    """
    Model for storing athlete documents with verification status.
    """
    
    DOCUMENT_TYPE_CHOICES = [
        ('birth_certificate', 'Birth Certificate'),
        ('citizenship', 'Citizenship Document'),
        ('passport', 'Passport'),
        ('school_id', 'School ID'),
        ('medical_certificate', 'Medical Certificate'),
        ('photo_id', 'Photo ID'),
        ('other', 'Other Document'),
    ]
    
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('requires_review', 'Requires Manual Review'),
    ]
    
    athlete = models.ForeignKey(
        Athlete,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    document_type = models.CharField(
        max_length=50,
        choices=DOCUMENT_TYPE_CHOICES,
        default='other'
    )
    file = models.FileField(
        upload_to=athlete_document_path,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'])],
        help_text="Document file (PDF, JPG, PNG, DOC, DOCX - Max 10MB)"
    )
    original_filename = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(default=0, help_text="File size in bytes")
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    
    # Verification fields
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='pending'
    )
    verification_notes = models.TextField(blank=True)
    verified_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_athlete_documents'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'athlete_documents'
        ordering = ['-created_at']
        unique_together = ['athlete', 'document_type', 'file']
    
    def __str__(self):
        return f"{self.athlete.full_name} - {self.get_document_type_display()}"
    
    def save(self, *args, **kwargs):
        """Override save to set file info."""
        if self.file:
            if not self.original_filename:
                self.original_filename = self.file.name
            self.file_size = self.file.size
            if not self.title:
                self.title = f"{self.get_document_type_display()} - {self.athlete.full_name}"
        super().save(*args, **kwargs)
    
    @property
    def file_url(self):
        """Get file URL."""
        if self.file and hasattr(self.file, 'url'):
            return self.file.url
        return None
    
    @property
    def is_verified(self):
        """Check if document is verified."""
        return self.verification_status == 'verified'
    
    @property
    def file_extension(self):
        """Get file extension."""
        if self.file:
            return self.file.name.split('.')[-1].lower()
        return None
    
    @property
    def is_image(self):
        """Check if file is an image."""
        return self.file_extension in ['jpg', 'jpeg', 'png', 'gif']
    
    def mark_verified(self, user=None, notes=""):
        """Mark document as verified."""
        self.verification_status = 'verified'
        self.verification_notes = notes
        self.verified_by = user
        self.verified_at = timezone.now()
        self.save()
    
    def mark_rejected(self, user=None, notes=""):
        """Mark document as rejected."""
        self.verification_status = 'rejected'
        self.verification_notes = notes
        self.verified_by = user
        self.verified_at = timezone.now()
        self.save()