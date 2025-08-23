"""
Authentication models for Athletiq system.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import EmailValidator
import bcrypt


class User(AbstractUser):
    """
    Custom User model that maps to the existing users table.
    Maintains compatibility with the existing Node.js authentication system.
    """
    
    USER_ROLES = [
        ('SuperAdmin', 'Super Administrator'),
        ('SchoolAdmin', 'School Administrator'),
        ('Coach', 'Coach'),
        ('Referee', 'Referee'),
        ('Organization', 'Organization'),
    ]
    
    # Use existing primary key field name
    user_id = models.AutoField(primary_key=True)
    
    # Override username to not be required (we use email for login)
    username = models.CharField(max_length=150, blank=True, null=True)
    
    # User information fields matching existing schema
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    password_hash = models.CharField(max_length=255, blank=True)  # For bcrypt compatibility
    role = models.CharField(max_length=50, choices=USER_ROLES, default='SchoolAdmin')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Override the default username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    
    class Meta:
        db_table = 'users'
        
    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
    def set_password(self, raw_password):
        """
        Set password using bcrypt for compatibility with existing system.
        """
        if raw_password:
            # Generate bcrypt hash
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(raw_password.encode('utf-8'), salt)
            self.password_hash = hashed.decode('utf-8')
            # Also set Django's password field for admin compatibility
            super().set_password(raw_password)
    
    def check_password(self, raw_password):
        """
        Check password against bcrypt hash for compatibility.
        """
        if self.password_hash:
            try:
                return bcrypt.checkpw(
                    raw_password.encode('utf-8'), 
                    self.password_hash.encode('utf-8')
                )
            except (ValueError, TypeError):
                # Fallback to Django's password checking
                return super().check_password(raw_password)
        return super().check_password(raw_password)
    
    @property
    def is_super_admin(self):
        """Check if user is a super administrator."""
        return self.role == 'SuperAdmin'
    
    @property
    def is_school_admin(self):
        """Check if user is a school administrator."""
        return self.role == 'SchoolAdmin'
    
    def get_school(self):
        """Get the school associated with this user (for SchoolAdmin)."""
        if self.role == 'SchoolAdmin':
            try:
                from apps.schools.models import School
                return School.objects.get(admin_user=self)
            except School.DoesNotExist:
                return None
        return None


class UserSession(models.Model):
    """
    User session tracking for security and monitoring.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_token = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'user_sessions'
        
    def __str__(self):
        return f"Session for {self.user.email} from {self.ip_address}"