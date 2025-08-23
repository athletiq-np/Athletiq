from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import uuid

User = get_user_model()


class NotificationTemplate(models.Model):
    """Email and SMS notification templates"""
    TEMPLATE_TYPES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
    ]
    
    TEMPLATE_CATEGORIES = [
        ('guardian_registration', 'Guardian Registration'),
        ('athlete_registration', 'Athlete Registration'),
        ('tournament_notification', 'Tournament Notification'),
        ('school_notification', 'School Notification'),
        ('reminder', 'Reminder'),
        ('verification', 'Verification'),
        ('welcome', 'Welcome'),
        ('password_reset', 'Password Reset'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    category = models.CharField(max_length=50, choices=TEMPLATE_CATEGORIES)
    subject = models.CharField(max_length=255, blank=True)  # For email templates
    content = models.TextField()
    html_content = models.TextField(blank=True)  # For email HTML templates
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_templates'
        unique_together = ['template_type', 'category']

    def __str__(self):
        return f"{self.name} ({self.template_type})"


class NotificationLog(models.Model):
    """Log of all sent notifications"""
    NOTIFICATION_TYPES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
        ('complained', 'Complained'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Recipient information
    recipient_email = models.EmailField(blank=True)
    recipient_phone = models.CharField(max_length=20, blank=True)
    recipient_name = models.CharField(max_length=255, blank=True)
    
    # Content
    subject = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    html_content = models.TextField(blank=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    external_id = models.CharField(max_length=255, blank=True)  # Provider message ID
    error_message = models.TextField(blank=True)
    
    # Metadata
    context_data = models.JSONField(default=dict, blank=True)
    
    # Generic foreign key to link to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Timestamps
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_logs'
        indexes = [
            models.Index(fields=['notification_type', 'status']),
            models.Index(fields=['recipient_email']),
            models.Index(fields=['recipient_phone']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        recipient = self.recipient_email or self.recipient_phone
        return f"{self.notification_type} to {recipient} - {self.status}"

    def mark_as_sent(self, external_id=None):
        """Mark notification as sent"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        if external_id:
            self.external_id = external_id
        self.save(update_fields=['status', 'sent_at', 'external_id', 'updated_at'])

    def mark_as_delivered(self):
        """Mark notification as delivered"""
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save(update_fields=['status', 'delivered_at', 'updated_at'])

    def mark_as_failed(self, error_message):
        """Mark notification as failed"""
        self.status = 'failed'
        self.error_message = error_message
        self.save(update_fields=['status', 'error_message', 'updated_at'])


class NotificationPreference(models.Model):
    """User notification preferences"""
    NOTIFICATION_CHANNELS = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('both', 'Both'),
        ('none', 'None'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Preference settings
    guardian_registration = models.CharField(max_length=10, choices=NOTIFICATION_CHANNELS, default='both')
    athlete_registration = models.CharField(max_length=10, choices=NOTIFICATION_CHANNELS, default='both')
    tournament_updates = models.CharField(max_length=10, choices=NOTIFICATION_CHANNELS, default='email')
    reminders = models.CharField(max_length=10, choices=NOTIFICATION_CHANNELS, default='both')
    marketing = models.CharField(max_length=10, choices=NOTIFICATION_CHANNELS, default='none')
    
    # Contact information
    preferred_email = models.EmailField(blank=True)
    preferred_phone = models.CharField(max_length=20, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_preferences'

    def __str__(self):
        return f"Preferences for {self.user.email}"


class GuardianClaim(models.Model):
    """Guardian claim codes for athlete verification"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('pending_approval', 'Pending Approval'),
        ('pending_school_approval', 'Pending School Approval'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    athlete = models.ForeignKey('athletes.Athlete', on_delete=models.CASCADE, related_name='guardian_claims')
    guardian_phone = models.CharField(max_length=20)
    guardian_email = models.EmailField()
    claim_code = models.CharField(max_length=10, unique=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    requires_school_approval = models.BooleanField(default=False)
    reminder_sent = models.BooleanField(default=False)
    
    expires_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guardian_claims'
        indexes = [
            models.Index(fields=['claim_code']),
            models.Index(fields=['status']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"Claim {self.claim_code} for {self.athlete.full_name}"

    def is_expired(self):
        """Check if claim code is expired"""
        return timezone.now() > self.expires_at

    def mark_as_completed(self):
        """Mark claim as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at', 'updated_at'])