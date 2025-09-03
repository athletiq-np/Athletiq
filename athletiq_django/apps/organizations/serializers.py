"""
Organization serializers for API endpoints.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, OrganizationSchoolPartnership, OrganizationAthlete

User = get_user_model()


class OrganizationRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for organization registration."""
    
    admin_email = serializers.EmailField(write_only=True)
    admin_password = serializers.CharField(write_only=True, min_length=8)
    admin_password_confirm = serializers.CharField(write_only=True)
    admin_full_name = serializers.CharField(write_only=True, max_length=255)

    class Meta:
        model = Organization
        fields = [
            'name', 'type', 'registration_number', 'description',
            'contact_person', 'email', 'phone', 'secondary_phone',
            'address', 'city', 'province', 'district', 'postal_code',
            'founded_date', 'website', 'logo',
            'admin_email', 'admin_password', 'admin_password_confirm', 'admin_full_name'
        ]

    def validate(self, attrs):
        """Validate organization registration data."""
        # Check password confirmation
        if attrs['admin_password'] != attrs['admin_password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        
        # Check if admin email already exists
        if User.objects.filter(email=attrs['admin_email']).exists():
            raise serializers.ValidationError("A user with this email already exists")
        
        # Check if organization email already exists
        if Organization.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError("An organization with this email already exists")
        
        # Check if registration number already exists
        if Organization.objects.filter(registration_number=attrs['registration_number']).exists():
            raise serializers.ValidationError("An organization with this registration number already exists")
        
        return attrs

    def create(self, validated_data):
        """Create organization with admin user."""
        # Extract admin user data
        admin_data = {
            'email': validated_data.pop('admin_email'),
            'password': validated_data.pop('admin_password'),
            'full_name': validated_data.pop('admin_full_name'),
            'role': 'organization'
        }
        validated_data.pop('admin_password_confirm')
        
        # Create admin user
        admin_user = User.objects.create_user(
            email=admin_data['email'],
            password=admin_data['password'],
            full_name=admin_data['full_name'],
            role=admin_data['role'],
            is_active=True
        )
        
        # Create organization
        organization = Organization.objects.create(
            admin_user=admin_user,
            **validated_data
        )
        
        return organization


class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for organization details."""
    
    admin_user_email = serializers.CharField(source='admin_user.email', read_only=True)
    admin_user_name = serializers.CharField(source='admin_user.full_name', read_only=True)
    total_athletes = serializers.ReadOnlyField()
    total_tournaments = serializers.ReadOnlyField()
    is_verified = serializers.ReadOnlyField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'type', 'registration_number', 'description',
            'contact_person', 'email', 'phone', 'secondary_phone',
            'address', 'city', 'province', 'district', 'postal_code',
            'status', 'verified_at', 'founded_date', 'website', 'logo',
            'is_active', 'can_create_tournaments', 'can_register_athletes',
            'admin_user_email', 'admin_user_name', 'total_athletes', 
            'total_tournaments', 'is_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'verified_at', 'admin_user_email', 
            'admin_user_name', 'total_athletes', 'total_tournaments', 
            'is_verified', 'created_at', 'updated_at'
        ]


class OrganizationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating organization profile."""

    class Meta:
        model = Organization
        fields = [
            'name', 'type', 'description', 'contact_person', 'email', 
            'phone', 'secondary_phone', 'address', 'city', 'province', 
            'district', 'postal_code', 'founded_date', 'website', 'logo'
        ]

    def validate_email(self, value):
        """Validate email uniqueness."""
        organization = self.instance
        if Organization.objects.filter(email=value).exclude(id=organization.id).exists():
            raise serializers.ValidationError("An organization with this email already exists")
        return value


class OrganizationSchoolPartnershipSerializer(serializers.ModelSerializer):
    """Serializer for organization-school partnerships."""
    
    school_name = serializers.CharField(source='school.name', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = OrganizationSchoolPartnership
        fields = [
            'id', 'organization', 'school', 'partnership_type',
            'start_date', 'end_date', 'is_active', 'notes',
            'school_name', 'organization_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class OrganizationAthleteSerializer(serializers.ModelSerializer):
    """Serializer for organization athletes."""
    
    athlete_name = serializers.CharField(source='athlete.full_name', read_only=True)
    athlete_id = serializers.CharField(source='athlete.athlete_id', read_only=True)
    school_name = serializers.CharField(source='athlete.school.name', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = OrganizationAthlete
        fields = [
            'id', 'organization', 'athlete', 'registration_date',
            'is_active', 'notes', 'athlete_name', 'athlete_id',
            'school_name', 'organization_name'
        ]
        read_only_fields = ['id', 'registration_date']


class OrganizationStatsSerializer(serializers.Serializer):
    """Serializer for organization statistics."""
    
    total_athletes = serializers.IntegerField()
    active_athletes = serializers.IntegerField()
    total_tournaments = serializers.IntegerField()
    active_tournaments = serializers.IntegerField()
    partner_schools = serializers.IntegerField()
    monthly_registrations = serializers.ListField()
    performance_metrics = serializers.DictField()


class OrganizationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for organization listings."""
    
    total_athletes = serializers.ReadOnlyField()
    total_tournaments = serializers.ReadOnlyField()
    is_verified = serializers.ReadOnlyField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'type', 'status', 'email', 'phone',
            'city', 'province', 'is_verified', 'total_athletes',
            'total_tournaments', 'created_at'
        ]