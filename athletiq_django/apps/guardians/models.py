"""
Guardian models for the guardian portal system.
"""
from django.db import models
from django.core.validators import EmailValidator
from core.utils.validators import validate_phone_number
import bcrypt
import uuid


class Guardian(models.Model):
    """
    Guardian model for parents/guardians who can claim and manage athletes.
    """
    
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    guardian_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    phone = models.CharField(max_length=20, validators=[validate_phone_number])
    password_hash = models.CharField(max_length=255)
    
    # Address information
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    province = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    
    # Verification and status
    verification_status = models.CharField(
        max_length=20, 
        choices=VERIFICATION_STATUS_CHOICES, 
        default='pending'
    )
    verification_token = models.CharField(max_length=255, blank=True)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    
    # Profile information
    profile_picture = models.ImageField(upload_to='guardian_profiles/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    occupation = models.CharField(max_length=100, blank=True)
    
    # System fields
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'guardians'
        
    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
    def set_password(self, raw_password):
        """
        Set password using bcrypt for compatibility with existing system.
        """
        if raw_password:
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(raw_password.encode('utf-8'), salt)
            self.password_hash = hashed.decode('utf-8')
    
    def check_password(self, raw_password):
        """
        Check password against bcrypt hash.
        """
        if self.password_hash:
            try:
                return bcrypt.checkpw(
                    raw_password.encode('utf-8'), 
                    self.password_hash.encode('utf-8')
                )
            except (ValueError, TypeError):
                return False
        return False
    
    def generate_verification_token(self):
        """
        Generate a verification token for email verification.
        """
        self.verification_token = str(uuid.uuid4())
        return self.verification_token
    
    @property
    def is_verified(self):
        """Check if guardian is fully verified."""
        return self.verification_status == 'verified' and self.email_verified


class GuardianSession(models.Model):
    """
    Guardian session tracking for security and monitoring.
    """
    guardian = models.ForeignKey(Guardian, on_delete=models.CASCADE, related_name='sessions')
    session_token = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'guardian_sessions'
        
    def __str__(self):
        return f"Session for {self.guardian.email} from {self.ip_address}"


class AthleteClaimRequest(models.Model):
    """
    Model to track guardian requests to claim athletes.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    guardian = models.ForeignKey(Guardian, on_delete=models.CASCADE, related_name='claim_requests')
    athlete_id = models.CharField(max_length=20)  # Reference to athlete
    relationship = models.CharField(max_length=50)  # Father, Mother, Guardian, etc.
    
    # Supporting documents
    supporting_documents = models.JSONField(default=list)  # List of document URLs
    notes = models.TextField(blank=True)
    
    # Status and review
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        'authentication.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_claims'
    )
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'athlete_claim_requests'
        unique_together = ['guardian', 'athlete_id']
        
    def __str__(self):
        return f"{self.guardian.full_name} claiming athlete {self.athlete_id}"


class GuardianNotification(models.Model):
    """
    Notifications for guardians.
    """
    
    TYPE_CHOICES = [
        ('claim_approved', 'Claim Approved'),
        ('claim_rejected', 'Claim Rejected'),
        ('athlete_update', 'Athlete Update'),
        ('tournament_registration', 'Tournament Registration'),
        ('match_schedule', 'Match Schedule'),
        ('document_required', 'Document Required'),
        ('system_announcement', 'System Announcement'),
    ]
    
    guardian = models.ForeignKey(Guardian, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    
    # Related objects
    athlete_id = models.CharField(max_length=20, blank=True)
    tournament_id = models.IntegerField(blank=True, null=True)
    match_id = models.IntegerField(blank=True, null=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'guardian_notifications'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Notification for {self.guardian.full_name}: {self.title}"