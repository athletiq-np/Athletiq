"""
Tournament models for Athletiq Django backend.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.common.models import BaseModel

User = get_user_model()


class Tournament(BaseModel):
    """
    Tournament model matching the existing PostgreSQL schema.
    """
    
    # Tournament status choices
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('postponed', 'Postponed'),
    ]
    
    # Tournament format choices
    FORMAT_CHOICES = [
        ('knockout', 'Knockout'),
        ('league', 'League'),
        ('group_stage', 'Group Stage'),
        ('round_robin', 'Round Robin'),
        ('double_elimination', 'Double Elimination'),
    ]
    
    # Organizer type choices
    ORGANIZER_TYPE_CHOICES = [
        ('school', 'School'),
        ('district', 'District'),
        ('national', 'National'),
        ('other', 'Other'),
    ]
    
    # Tournament level choices
    LEVEL_CHOICES = [
        ('school', 'School'),
        ('district', 'District'),
        ('provincial', 'Provincial'),
        ('national', 'National'),
        ('international', 'International'),
    ]
    
    # Primary key (matches existing schema)
    id = models.AutoField(primary_key=True)
    
    # UUID for external references
    tournament_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Tournament code (short alphanumeric identifier)
    tournament_code = models.CharField(max_length=20, unique=True, blank=True)
    
    # Basic information
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    sport = models.CharField(max_length=50)
    level = models.CharField(max_length=50, choices=LEVEL_CHOICES, default='school')
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    registration_deadline = models.DateField(blank=True, null=True)
    
    # Team configuration
    max_teams = models.PositiveIntegerField(blank=True, null=True)
    min_teams = models.PositiveIntegerField(default=2, validators=[MinValueValidator(2)])
    max_players_per_team = models.PositiveIntegerField(blank=True, null=True)
    
    # Location information
    location = models.CharField(max_length=200, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, default='Nepal')
    
    # Organization
    organizer_id = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='organized_tournaments'
    )
    organizer_type = models.CharField(
        max_length=50, 
        choices=ORGANIZER_TYPE_CHOICES,
        blank=True,
        null=True
    )
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_tournaments'
    )
    
    # Tournament configuration
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    format = models.CharField(max_length=50, choices=FORMAT_CHOICES, blank=True, null=True)
    rules = models.TextField(blank=True, null=True)
    prize_details = models.TextField(blank=True, null=True)
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Publication and visibility
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    visibility = models.CharField(max_length=20, default='public')
    
    # Media
    logo_url = models.URLField(blank=True, null=True)
    
    # Sports configuration (JSON field for complex sports setup)
    sports_config = models.JSONField(default=list, blank=True)
    
    # Prize pool
    prize_pool = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Age and gender restrictions
    age_group = models.CharField(max_length=50, blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = 'tournaments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sport']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['organizer_type', 'organizer_id']),
            models.Index(fields=['tournament_code']),
            models.Index(fields=['level']),
        ]
        
    def __str__(self):
        return f"{self.name} ({self.tournament_code})"
    
    def clean(self):
        """Validate tournament data."""
        from django.core.exceptions import ValidationError
        
        # Validate dates
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("End date must be after start date")
        
        if self.registration_deadline and self.start_date and self.registration_deadline > self.start_date:
            raise ValidationError("Registration deadline must be before start date")
        
        # Validate team limits
        if self.max_teams and self.min_teams and self.max_teams < self.min_teams:
            raise ValidationError("Maximum teams must be greater than or equal to minimum teams")
    
    def save(self, *args, **kwargs):
        """Override save to generate tournament code if not provided."""
        if not self.tournament_code:
            self.tournament_code = self._generate_tournament_code()
        
        self.full_clean()
        super().save(*args, **kwargs)
    
    def _generate_tournament_code(self):
        """Generate a unique tournament code."""
        import random
        import string
        
        while True:
            code = 'TMT' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
            if not Tournament.objects.filter(tournament_code=code).exists():
                return code
    
    @property
    def is_registration_open(self):
        """Check if registration is still open."""
        if not self.registration_deadline:
            return self.status in ['draft', 'upcoming']
        return timezone.now().date() <= self.registration_deadline and self.status in ['draft', 'upcoming']
    
    @property
    def is_active(self):
        """Check if tournament is currently active."""
        return self.status == 'ongoing'
    
    @property
    def is_completed(self):
        """Check if tournament is completed."""
        return self.status == 'completed'


class TournamentTeam(BaseModel):
    """
    Model for teams registered in tournaments.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('registered', 'Registered'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    id = models.AutoField(primary_key=True)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='tournament_teams')
    team_id = models.PositiveIntegerField()  # Reference to teams table
    team_name = models.CharField(max_length=200)
    school_id = models.PositiveIntegerField(blank=True, null=True)  # Reference to schools table
    
    # Registration details
    registration_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    registration_date = models.DateTimeField(auto_now_add=True)
    confirmed_date = models.DateTimeField(blank=True, null=True)
    
    # Tournament specific data
    seed_order = models.PositiveIntegerField(blank=True, null=True)
    group_assignment = models.CharField(max_length=10, blank=True, null=True)
    
    # Contact and notes
    contact_person = models.CharField(max_length=200, blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Registration metadata
    registration_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'tournament_teams'
        unique_together = ['tournament', 'team_id']
        ordering = ['seed_order', 'registration_date']
        indexes = [
            models.Index(fields=['tournament', 'registration_status']),
            models.Index(fields=['team_id']),
            models.Index(fields=['school_id']),
        ]
    
    def __str__(self):
        return f"{self.team_name} in {self.tournament.name}"


class TournamentPlayer(BaseModel):
    """
    Model for players registered in tournament teams.
    """
    
    id = models.AutoField(primary_key=True)
    tournament_team = models.ForeignKey(TournamentTeam, on_delete=models.CASCADE, related_name='players')
    player_id = models.PositiveIntegerField()  # Reference to players/athletes table
    player_name = models.CharField(max_length=200)
    
    # Player details
    jersey_number = models.PositiveIntegerField(blank=True, null=True)
    position = models.CharField(max_length=50, blank=True, null=True)
    is_captain = models.BooleanField(default=False)
    is_vice_captain = models.BooleanField(default=False)
    
    # Eligibility
    is_eligible = models.BooleanField(default=True)
    eligibility_notes = models.TextField(blank=True, null=True)
    
    # Registration metadata
    registration_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'tournament_players'
        unique_together = ['tournament_team', 'player_id']
        indexes = [
            models.Index(fields=['tournament_team', 'is_eligible']),
            models.Index(fields=['player_id']),
        ]
    
    def __str__(self):
        return f"{self.player_name} - {self.tournament_team.team_name}"


class TournamentSport(BaseModel):
    """
    Model for sports configuration in tournaments.
    """
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('mixed', 'Mixed'),
    ]
    
    id = models.AutoField(primary_key=True)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='sports')
    sport_name = models.CharField(max_length=100)
    category = models.CharField(max_length=100, blank=True, null=True)
    age_group = models.CharField(max_length=50, blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    
    # Team configuration
    max_teams = models.PositiveIntegerField(blank=True, null=True)
    min_teams = models.PositiveIntegerField(default=2)
    players_per_team = models.PositiveIntegerField(blank=True, null=True)
    
    # Competition format
    format = models.CharField(max_length=50, choices=Tournament.FORMAT_CHOICES, blank=True, null=True)
    rules = models.TextField(blank=True, null=True)
    
    # Prizes
    prize_details = models.TextField(blank=True, null=True)
    
    # Configuration
    sport_config = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'tournament_sports'
        unique_together = ['tournament', 'sport_name', 'category', 'age_group', 'gender']
        indexes = [
            models.Index(fields=['tournament', 'sport_name']),
            models.Index(fields=['sport_name', 'category']),
        ]
    
    def __str__(self):
        return f"{self.sport_name} - {self.tournament.name}"