"""
Organization models for Athletiq Django backend.

This module defines the Organization model and related functionality for managing
sports organizations, clubs, and academies in the Athletiq system.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from apps.common.models import TimestampedModel

User = get_user_model()


class Organization(TimestampedModel):
    """
    Organization model for sports clubs, academies, and other sports organizations.
    """
    
    ORGANIZATION_TYPES = [
        ('sports_club', 'Sports Club'),
        ('academy', 'Sports Academy'),
        ('training_center', 'Training Center'),
        ('federation', 'Sports Federation'),
        ('association', 'Sports Association'),
        ('league', 'Sports League'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    ]

    # Basic Information
    name = models.CharField(
        max_length=255,
        help_text="Official name of the organization"
    )
    
    type = models.CharField(
        max_length=50,
        choices=ORGANIZATION_TYPES,
        default='sports_club',
        help_text="Type of sports organization"
    )
    
    registration_number = models.CharField(
        max_length=100,
        unique=True,
        help_text="Official registration number"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Brief description of the organization"
    )

    # Contact Information
    contact_person = models.CharField(
        max_length=255,
        help_text="Name of primary contact person"
    )
    
    email = models.EmailField(
        unique=True,
        help_text="Primary email address"
    )
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(
        validators=[phone_regex],
        max_length=17,
        help_text="Primary phone number"
    )
    
    secondary_phone = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        help_text="Secondary phone number"
    )

    # Address Information
    address = models.TextField(help_text="Complete address")
    city = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Verification and Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Verification status"
    )
    
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date when organization was verified"
    )
    
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_organizations',
        help_text="Admin user who verified this organization"
    )

    # Admin User
    admin_user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='organization',
        help_text="User account for organization administrator"
    )

    # Additional Information
    founded_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when organization was founded"
    )
    
    website = models.URLField(
        blank=True,
        help_text="Organization website"
    )
    
    logo = models.ImageField(
        upload_to='organizations/logos/',
        blank=True,
        help_text="Organization logo"
    )
    
    # Settings
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the organization is active"
    )
    
    can_create_tournaments = models.BooleanField(
        default=True,
        help_text="Whether organization can create tournaments"
    )
    
    can_register_athletes = models.BooleanField(
        default=True,
        help_text="Whether organization can register athletes"
    )

    class Meta:
        db_table = 'organizations'
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.type})"

    @property
    def is_verified(self):
        """Check if organization is verified."""
        return self.status == 'verified'

    @property
    def total_athletes(self):
        """Get total number of athletes registered by this organization."""
        return self.organization_athletes.filter(is_active=True).count()

    @property
    def total_tournaments(self):
        """Get total number of tournaments created by this organization."""
        return self.created_tournaments.filter(is_active=True).count()

    @property
    def partner_schools(self):
        """Get schools that have partnerships with this organization."""
        return self.school_partnerships.filter(is_active=True)

    def can_manage_athlete(self, athlete):
        """Check if organization can manage a specific athlete."""
        return athlete.organization == self and self.is_active

    def can_manage_tournament(self, tournament):
        """Check if organization can manage a specific tournament."""
        return tournament.created_by_organization == self and self.is_active


class OrganizationSchoolPartnership(TimestampedModel):
    """
    Model for partnerships between organizations and schools.
    """
    
    PARTNERSHIP_TYPES = [
        ('training', 'Training Partnership'),
        ('sponsorship', 'Sponsorship'),
        ('collaboration', 'Collaboration'),
        ('affiliate', 'Affiliate Program'),
    ]
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='school_partnerships'
    )
    
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='organization_partnerships'
    )
    
    partnership_type = models.CharField(
        max_length=50,
        choices=PARTNERSHIP_TYPES,
        default='collaboration'
    )
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about the partnership"
    )

    class Meta:
        db_table = 'organization_school_partnerships'
        unique_together = ['organization', 'school']
        verbose_name = 'Organization-School Partnership'
        verbose_name_plural = 'Organization-School Partnerships'

    def __str__(self):
        return f"{self.organization.name} - {self.school.name}"


class OrganizationAthlete(TimestampedModel):
    """
    Model for athletes registered through organizations.
    """
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='organization_athletes'
    )
    
    athlete = models.ForeignKey(
        'athletes.Athlete',
        on_delete=models.CASCADE,
        related_name='organization_registrations'
    )
    
    registration_date = models.DateTimeField(auto_now_add=True)
    
    is_active = models.BooleanField(default=True)
    
    notes = models.TextField(
        blank=True,
        help_text="Notes about the athlete registration"
    )

    class Meta:
        db_table = 'organization_athletes'
        unique_together = ['organization', 'athlete']
        verbose_name = 'Organization Athlete'
        verbose_name_plural = 'Organization Athletes'

    def __str__(self):
        return f"{self.organization.name} - {self.athlete.full_name}"