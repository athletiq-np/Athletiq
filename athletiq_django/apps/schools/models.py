"""
School models for Athletiq system.
"""
from django.db import models
from django.core.validators import EmailValidator, RegexValidator
from django.conf import settings
from apps.common.models import BaseModel


class School(BaseModel):
    """
    School model that maps to the existing schools table.
    Maintains compatibility with the existing database schema.
    """
    
    ONBOARDING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('suspended', 'Suspended'),
    ]
    
    # Use existing primary key field name
    school_id = models.AutoField(primary_key=True)
    
    # School identification
    school_code = models.CharField(
        max_length=20, 
        unique=True,
        help_text="Unique school code for identification"
    )
    
    # Basic information
    name = models.CharField(max_length=255, help_text="Official school name")
    address = models.TextField(help_text="Complete school address")
    
    # Location details
    country = models.CharField(max_length=100, default='Rwanda')
    province = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    ward = models.CharField(max_length=10, blank=True, null=True)
    
    # Contact information
    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
        )]
    )
    email = models.EmailField(validators=[EmailValidator()])
    website = models.URLField(blank=True, null=True)
    
    # School logo
    logo = models.ImageField(
        upload_to='school_logos/',
        blank=True,
        null=True,
        help_text="School logo image"
    )
    
    # Administration
    principal_name = models.CharField(max_length=255)
    admin_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='administered_school',
        help_text="The user who administers this school"
    )
    
    # Status and metadata
    onboarding_status = models.CharField(
        max_length=20,
        choices=ONBOARDING_STATUS_CHOICES,
        default='pending'
    )
    
    class Meta:
        db_table = 'schools'  # Explicitly set the database table name
        ordering = ['name']
        indexes = [
            models.Index(fields=['school_code']),
            models.Index(fields=['name']),
            models.Index(fields=['province', 'district']),
            models.Index(fields=['onboarding_status']),
        ]
        
    def __str__(self):
        return f"{self.name} ({self.school_code})"
    
    @property
    def full_address(self):
        """Get formatted full address."""
        address_parts = [self.address, self.city, self.district, self.province, self.country]
        return ', '.join(filter(None, address_parts))
    
    @property
    def is_onboarded(self):
        """Check if school has completed onboarding."""
        return self.onboarding_status == 'completed'
    
    def get_admin_user(self):
        """Get the admin user for this school."""
        return self.admin_user
    
    def get_athletes_count(self):
        """Get total number of athletes in this school."""
        try:
            return self.athletes.filter(is_active=True).count()
        except AttributeError:
            # Athletes model not yet implemented
            return 0
    
    def get_teams_count(self):
        """Get total number of teams in this school."""
        try:
            return self.teams.filter(is_active=True).count()
        except AttributeError:
            # Teams model not yet implemented
            return 0
    
    def get_active_tournaments_count(self):
        """Get number of active tournaments this school is participating in."""
        try:
            from apps.tournaments.models import Tournament
            return Tournament.objects.filter(
                tournament_teams__school_id=self.id,
                status__in=['ongoing', 'upcoming']
            ).distinct().count()
        except (ImportError, AttributeError):
            # Tournament model not yet implemented
            return 0


class SchoolHouse(BaseModel):
    """
    School house system for organizing students into houses.
    """
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='houses'
    )
    name = models.CharField(max_length=100)
    color = models.CharField(
        max_length=7,
        default='#6B7280',
        help_text="Hex color code for the house"
    )
    # captain = models.ForeignKey(
    #     'athletes.Athlete',
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='captained_house'
    # )
    points = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'school_houses'
        unique_together = ['school', 'name']
        ordering = ['-points', 'name']
        
    def __str__(self):
        return f"{self.school.name} - {self.name}"
    
    def get_members_count(self):
        """Get number of athletes in this house."""
        try:
            return self.members.filter(is_active=True).count()
        except AttributeError:
            # Athletes model not yet implemented
            return 0


class SchoolStaff(BaseModel):
    """
    School staff members and their roles.
    """
    
    POSITION_CHOICES = [
        ('Principal', 'Principal'),
        ('Vice Principal', 'Vice Principal'),
        ('Sports Coordinator', 'Sports Coordinator'),
        ('Teacher', 'Teacher'),
        ('Coach', 'Coach'),
        ('Administrator', 'Administrator'),
        ('Other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('terminated', 'Terminated'),
    ]
    
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='staff'
    )
    full_name = models.CharField(max_length=255)
    position = models.CharField(max_length=50, choices=POSITION_CHOICES)
    department = models.CharField(max_length=100, blank=True)
    email = models.EmailField(validators=[EmailValidator()])
    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
        )]
    )
    hire_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    class Meta:
        db_table = 'school_staff'
        ordering = ['position', 'full_name']
        
    def __str__(self):
        return f"{self.full_name} - {self.position} at {self.school.name}"


class SchoolNotification(BaseModel):
    """
    Notifications for schools.
    """
    
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('error', 'Error'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    read_status = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'school_notifications'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.school.name}"