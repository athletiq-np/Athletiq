"""
School serializers for API endpoints.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.schools.models import School, SchoolHouse, SchoolStaff, SchoolNotification
from apps.authentication.models import User
import bcrypt

User = get_user_model()


class SchoolRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for school registration with admin user creation.
    """
    # Admin user fields
    admin_name = serializers.CharField(max_length=255, write_only=True)
    admin_email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = School
        fields = [
            'name', 'address', 'country', 'province', 'district', 'city', 'ward',
            'phone', 'email', 'website', 'principal_name', 'logo',
            'admin_name', 'admin_email', 'password'
        ]
        extra_kwargs = {
            'school_code': {'read_only': True},
            'onboarding_status': {'read_only': True},
        }
    
    def validate_admin_email(self, value):
        """Validate that admin email is not already in use."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "This administrator email is already registered."
            )
        return value
    
    def validate_name(self, value):
        """Validate that school name is not already in use."""
        if School.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError(
                "A school with this name is already registered."
            )
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """Create school and admin user in a transaction with proper error handling."""
        try:
            # Extract admin user data
            admin_name = validated_data.pop('admin_name')
            admin_email = validated_data.pop('admin_email')
            password = validated_data.pop('password')
            
            # Create admin user
            admin_user = User.objects.create(
                full_name=admin_name,
                email=admin_email,
                role='SchoolAdmin',
                is_active=True
            )
            admin_user.set_password(password)
            admin_user.save()
            
            # Generate school code
            school_code = self._generate_school_code()
            
            # Create school
            school = School.objects.create(
                school_code=school_code,
                admin_user=admin_user,
                onboarding_status='pending',
                is_active=True,
                **validated_data
            )
            
            # Log successful registration
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"School registered successfully: {school.name} ({school.school_code})")
            
            return school
            
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"School registration failed: {str(e)}")
            raise serializers.ValidationError(
                f"Registration failed: {str(e)}"
            )
    
    def _generate_school_code(self):
        """Generate unique school code."""
        import random
        import string
        
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not School.objects.filter(school_code=code).exists():
                return code


class SchoolSerializer(serializers.ModelSerializer):
    """
    Serializer for school profile information.
    """
    admin_user_name = serializers.CharField(source='admin_user.full_name', read_only=True)
    admin_user_email = serializers.CharField(source='admin_user.email', read_only=True)
    athletes_count = serializers.SerializerMethodField()
    teams_count = serializers.SerializerMethodField()
    active_tournaments_count = serializers.SerializerMethodField()
    full_address = serializers.ReadOnlyField()
    is_onboarded = serializers.ReadOnlyField()
    
    class Meta:
        model = School
        fields = [
            'school_id', 'school_code', 'name', 'address', 'country', 'province',
            'district', 'city', 'ward', 'phone', 'email', 'website',
            'principal_name', 'onboarding_status', 'created_at', 'updated_at',
            'admin_user_name', 'admin_user_email', 'athletes_count', 'teams_count',
            'active_tournaments_count', 'full_address', 'is_onboarded', 'is_active'
        ]
        read_only_fields = ['school_id', 'school_code', 'created_at', 'updated_at']
    
    def get_athletes_count(self, obj):
        """Get total number of active athletes."""
        return obj.get_athletes_count()
    
    def get_teams_count(self, obj):
        """Get total number of active teams."""
        return obj.get_teams_count()
    
    def get_active_tournaments_count(self, obj):
        """Get number of active tournaments."""
        return obj.get_active_tournaments_count()


class SchoolUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating school profile.
    """
    class Meta:
        model = School
        fields = [
            'name', 'address', 'province', 'district', 'city', 'ward',
            'phone', 'email', 'website', 'principal_name'
        ]
    
    def validate_name(self, value):
        """Validate that school name is not already in use by another school."""
        if self.instance and School.objects.filter(
            name__iexact=value
        ).exclude(school_id=self.instance.school_id).exists():
            raise serializers.ValidationError(
                "A school with this name is already registered."
            )
        return value


class SchoolHouseSerializer(serializers.ModelSerializer):
    """
    Serializer for school houses.
    """
    # captain_name = serializers.CharField(source='captain.full_name', read_only=True)
    members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SchoolHouse
        fields = [
            'id', 'name', 'color', 'points',
            'members_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_members_count(self, obj):
        """Get number of members in the house."""
        return obj.get_members_count()


class SchoolStaffSerializer(serializers.ModelSerializer):
    """
    Serializer for school staff.
    """
    class Meta:
        model = SchoolStaff
        fields = [
            'id', 'full_name', 'position', 'department', 'email', 'phone',
            'hire_date', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SchoolNotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for school notifications.
    """
    class Meta:
        model = SchoolNotification
        fields = [
            'id', 'title', 'message', 'type', 'priority', 'read_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SchoolListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for school lists (SuperAdmin view).
    """
    admin_user_name = serializers.CharField(source='admin_user.full_name', read_only=True)
    admin_user_email = serializers.CharField(source='admin_user.email', read_only=True)
    
    class Meta:
        model = School
        fields = [
            'school_id', 'school_code', 'name', 'city', 'province',
            'onboarding_status', 'created_at', 'admin_user_name', 'admin_user_email'
        ]