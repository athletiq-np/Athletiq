"""
Enhanced serializers for athlete models with comprehensive field support.
"""
from rest_framework import serializers
from django.core.validators import validate_email
from .models import Athlete
from apps.schools.models import School
from apps.guardians.models import Guardian
from core.utils.validators import validate_phone_number
from datetime import date, timedelta
import re


class AthleteListSerializer(serializers.ModelSerializer):
    """
    Serializer for athlete list view with essential fields.
    """
    age = serializers.ReadOnlyField()
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = Athlete
        fields = [
            'id', 'athlete_id', 'full_name', 'date_of_birth', 
            'gender', 'age', 'school_name', 'created_at'
        ]


class AthleteDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed athlete view with all fields.
    """
    age = serializers.ReadOnlyField()
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_code = serializers.CharField(source='school.school_code', read_only=True)
    guardian_name_display = serializers.CharField(source='guardian.full_name', read_only=True)
    display_name = serializers.ReadOnlyField()
    is_verified = serializers.ReadOnlyField()
    can_participate = serializers.ReadOnlyField()
    
    class Meta:
        model = Athlete
        fields = '__all__'
        read_only_fields = [
            'id', 'athlete_id', 'profile_completion', 'created_at', 'updated_at',
            'age', 'display_name', 'is_verified', 'can_participate'
        ]


class AthleteCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new athletes with comprehensive validation.
    """
    school_id = serializers.IntegerField(write_only=True)
    guardian_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Athlete
        fields = [
            'full_name', 'full_name_nepali', 'date_of_birth', 'gender', 
            'nationality', 'citizenship_no', 'grade', 'section', 'school_id',
            'guardian_id', 'guardian_name', 'relationship_to_player', 
            'guardian_phone', 'guardian_email', 'address', 'province', 
            'district', 'municipality_or_rural_municipality', 'ward_no',
            'height_cm', 'weight_kg', 'blood_group', 'registered_sports',
            'primary_sport', 'father_name', 'mother_name', 'medical_conditions',
            'allergies', 'emergency_contact', 'medical_notes'
        ]
    
    def validate_school_id(self, value):
        """Validate that school exists and is active."""
        try:
            # Handle both integer and School object
            if isinstance(value, School):
                return value.school_id
            school = School.objects.get(school_id=value, is_active=True)
            return value  # Return the original value (integer), not the school object
        except School.DoesNotExist:
            raise serializers.ValidationError("Invalid school ID or school is not active.")
    
    def validate_guardian_id(self, value):
        """Validate that guardian exists if provided."""
        if value is not None:
            try:
                guardian = Guardian.objects.get(guardian_id=value, is_active=True)
                return value  # Return the original value (integer), not the guardian object
            except Guardian.DoesNotExist:
                raise serializers.ValidationError("Invalid guardian ID or guardian is not active.")
        return None
    
    def validate_date_of_birth(self, value):
        """Validate date of birth is reasonable for an athlete."""
        if not value:
            raise serializers.ValidationError("Date of birth is required.")
        
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        
        if age < 5:
            raise serializers.ValidationError("Athlete must be at least 5 years old.")
        if age > 25:
            raise serializers.ValidationError("Athlete must be under 25 years old.")
        
        # Check if date is not in the future
        if value > today:
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        
        return value
    
    def validate_guardian_phone(self, value):
        """Validate guardian phone number format."""
        if value:
            validate_phone_number(value)
        return value
    
    def validate_guardian_email(self, value):
        """Validate guardian email format."""
        if value:
            validate_email(value)
        return value
    
    def validate_citizenship_no(self, value):
        """Validate citizenship number format."""
        if value:
            # Basic validation for Nepali citizenship format
            if not re.match(r'^[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{5}$', value):
                raise serializers.ValidationError(
                    "Invalid citizenship number format. Expected format: XX-XX-XX-XXXXX"
                )
        return value
    
    def validate_registered_sports(self, value):
        """Validate registered sports list."""
        if value and not isinstance(value, list):
            raise serializers.ValidationError("Registered sports must be a list.")
        return value or []
    
    def validate(self, attrs):
        """Cross-field validation."""
        # If guardian_id is provided, some guardian fields should match
        guardian_id = attrs.get('guardian_id')
        if guardian_id:
            try:
                guardian = Guardian.objects.get(guardian_id=guardian_id, is_active=True)
                if attrs.get('guardian_name') and attrs['guardian_name'] != guardian.full_name:
                    raise serializers.ValidationError({
                        'guardian_name': 'Guardian name must match the selected guardian.'
                    })
                if attrs.get('guardian_phone') and attrs['guardian_phone'] != guardian.phone:
                    raise serializers.ValidationError({
                        'guardian_phone': 'Guardian phone must match the selected guardian.'
                    })
                if attrs.get('guardian_email') and attrs['guardian_email'] != guardian.email:
                    raise serializers.ValidationError({
                        'guardian_email': 'Guardian email must match the selected guardian.'
                    })
            except Guardian.DoesNotExist:
                # This should have been caught in validate_guardian_id, but just in case
                pass
        
        return attrs
    
    def create(self, validated_data):
        """Create athlete with proper relationships."""
        school_id = validated_data.pop('school_id')
        guardian_id = validated_data.pop('guardian_id', None)
        
        # Get the actual school object
        school = School.objects.get(school_id=school_id, is_active=True)
        guardian = None
        if guardian_id:
            guardian = Guardian.objects.get(guardian_id=guardian_id, is_active=True)
        
        athlete = Athlete.objects.create(
            school=school,
            guardian=guardian,
            **validated_data
        )
        
        # Calculate initial profile completion
        athlete.calculate_profile_completion()
        
        return athlete


class AthleteUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating athlete information.
    """
    school_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Athlete
        fields = [
            'full_name', 'full_name_nepali', 'date_of_birth', 'gender',
            'nationality', 'citizenship_no', 'grade', 'section', 'school_id',
            'guardian_name', 'relationship_to_player', 'guardian_phone', 
            'guardian_email', 'address', 'province', 'district',
            'municipality_or_rural_municipality', 'ward_no', 'height_cm',
            'weight_kg', 'blood_group', 'registered_sports', 'primary_sport',
            'father_name', 'mother_name', 'medical_conditions', 'allergies',
            'emergency_contact', 'medical_notes', 'verification_status'
        ]
    
    def validate_date_of_birth(self, value):
        """Validate date of birth is reasonable for an athlete."""
        if value:
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            
            if age < 5:
                raise serializers.ValidationError("Athlete must be at least 5 years old.")
            if age > 25:
                raise serializers.ValidationError("Athlete must be under 25 years old.")
            
            if value > today:
                raise serializers.ValidationError("Date of birth cannot be in the future.")
        
        return value
    
    def validate_guardian_phone(self, value):
        """Validate guardian phone number format."""
        if value:
            validate_phone_number(value)
        return value
    
    def validate_guardian_email(self, value):
        """Validate guardian email format."""
        if value:
            validate_email(value)
        return value
    
    def validate_school_id(self, value):
        """Validate that school exists and is active."""
        if value is not None:
            try:
                school = School.objects.get(school_id=value, is_active=True)
                return value  # Return the original value (integer), not the school object
            except School.DoesNotExist:
                raise serializers.ValidationError("Invalid school ID or school is not active.")
        return value
    
    def update(self, instance, validated_data):
        """Update athlete and recalculate profile completion."""
        # Handle school_id separately
        school_id = validated_data.pop('school_id', None)
        if school_id is not None:
            try:
                school = School.objects.get(school_id=school_id, is_active=True)
                instance.school = school
            except School.DoesNotExist:
                raise serializers.ValidationError("Invalid school ID or school is not active.")
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        instance.calculate_profile_completion()
        return instance


class AthleteBulkCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk athlete creation.
    """
    athletes = AthleteCreateSerializer(many=True)
    
    def validate_athletes(self, value):
        """Validate that we don't have too many athletes in one request."""
        if len(value) > 100:
            raise serializers.ValidationError("Cannot create more than 100 athletes at once.")
        
        # Check for duplicate athlete IDs within the batch
        athlete_names = []
        for athlete_data in value:
            name_dob = f"{athlete_data.get('full_name', '')}-{athlete_data.get('date_of_birth', '')}"
            if name_dob in athlete_names:
                raise serializers.ValidationError(
                    f"Duplicate athlete found: {athlete_data.get('full_name', 'Unknown')}"
                )
            athlete_names.append(name_dob)
        
        return value
    
    def create(self, validated_data):
        """Create multiple athletes."""
        athletes_data = validated_data['athletes']
        created_athletes = []
        errors = []
        
        print(f"Creating {len(athletes_data)} athletes")  # Debug logging
        
        for i, athlete_data in enumerate(athletes_data):
            try:
                print(f"Processing athlete {i}: {athlete_data}")  # Debug logging
                serializer = AthleteCreateSerializer(data=athlete_data)
                if serializer.is_valid():
                    athlete = serializer.save()
                    created_athletes.append(athlete)
                    print(f"Successfully created athlete: {athlete.full_name}")  # Debug logging
                else:
                    print(f"Validation errors for athlete {i}: {serializer.errors}")  # Debug logging
                    errors.append({
                        'index': i,
                        'name': athlete_data.get('full_name', 'Unknown'),
                        'errors': serializer.errors
                    })
            except Exception as e:
                import traceback
                print(f"Exception creating athlete {i}: {str(e)}")  # Debug logging
                print(f"Traceback: {traceback.format_exc()}")  # Debug logging
                errors.append({
                    'index': i,
                    'name': athlete_data.get('full_name', 'Unknown'),
                    'errors': str(e)
                })
        
        return {
            'created_athletes': [athlete.id for athlete in created_athletes],  # Return IDs instead of objects
            'errors': errors,
            'success_count': len(created_athletes),
            'error_count': len(errors)
        }


class AthleteExportSerializer(serializers.ModelSerializer):
    """
    Serializer for exporting athlete data.
    """
    age = serializers.ReadOnlyField()
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_code = serializers.CharField(source='school.school_code', read_only=True)
    guardian_name_display = serializers.CharField(source='guardian.full_name', read_only=True)
    
    class Meta:
        model = Athlete
        fields = [
            'athlete_id', 'full_name', 'full_name_nepali', 'date_of_birth', 'age',
            'gender', 'nationality', 'citizenship_no', 'grade', 'section',
            'school_name', 'school_code', 'guardian_name', 'guardian_name_display',
            'guardian_phone', 'guardian_email', 'address', 'province', 'district',
            'municipality_or_rural_municipality', 'ward_no', 'height_cm', 'weight_kg',
            'blood_group', 'primary_sport', 'father_name', 'mother_name',
            'is_active', 'verification_status', 'profile_completion',
            'created_at', 'updated_at'
        ]


class AthleteDocumentSerializer(serializers.Serializer):
    """
    Serializer for athlete document operations.
    """
    document_type = serializers.ChoiceField(
        choices=['profile_photo', 'birth_certificate'],
        required=True
    )
    document_url = serializers.URLField(required=True)
    certificate_no = serializers.CharField(max_length=100, required=False, allow_blank=True)
    certificate_date = serializers.DateField(required=False, allow_null=True)
    certificate_office = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def validate(self, attrs):
        """Validate document data based on type."""
        document_type = attrs.get('document_type')
        
        if document_type == 'birth_certificate':
            # Birth certificate should have additional details
            if not attrs.get('certificate_no'):
                raise serializers.ValidationError({
                    'certificate_no': 'Certificate number is required for birth certificates.'
                })
        
        return attrs


class AthleteVerificationSerializer(serializers.Serializer):
    """
    Serializer for athlete document verification.
    """
    verification_status = serializers.ChoiceField(
        choices=['verified', 'rejected', 'requires_review'],
        required=True
    )
    document_type = serializers.ChoiceField(
        choices=['profile_photo', 'birth_certificate', 'all'],
        default='all'
    )
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class AthleteBulkVerificationSerializer(serializers.Serializer):
    """
    Serializer for bulk athlete verification.
    """
    athlete_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=100
    )
    verification_status = serializers.ChoiceField(
        choices=['verified', 'rejected', 'requires_review'],
        required=True
    )
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class AthleteSearchSerializer(serializers.Serializer):
    """
    Serializer for athlete search parameters.
    """
    q = serializers.CharField(max_length=255, required=False, allow_blank=True)
    schools = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    is_active = serializers.BooleanField(required=False)
    verification_status = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            ('pending', 'Pending Verification'),
            ('verified', 'Verified'),
            ('rejected', 'Rejected'),
            ('requires_review', 'Requires Manual Review'),
        ]),
        required=False
    )
    gender = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            ('Male', 'Male'),
            ('Female', 'Female'),
            ('Other', 'Other'),
        ]),
        required=False
    )
    grade = serializers.ListField(
        child=serializers.CharField(max_length=10),
        required=False
    )
    min_age = serializers.IntegerField(min_value=5, max_value=25, required=False)
    max_age = serializers.IntegerField(min_value=5, max_value=25, required=False)
    sports = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False
    )
    min_completion = serializers.IntegerField(min_value=0, max_value=100, required=False)
    document_verified = serializers.BooleanField(required=False)
    order_by = serializers.ChoiceField(
        choices=[
            'full_name', '-full_name', 'athlete_id', '-athlete_id',
            'date_of_birth', '-date_of_birth', 'created_at', '-created_at',
            'profile_completion', '-profile_completion'
        ],
        default='-created_at'
    )
    
    def validate(self, attrs):
        """Cross-field validation for search parameters."""
        min_age = attrs.get('min_age')
        max_age = attrs.get('max_age')
        
        if min_age and max_age and min_age > max_age:
            raise serializers.ValidationError({
                'min_age': 'Minimum age cannot be greater than maximum age.'
            })
        
        return attrs


class AthleteStatsSerializer(serializers.Serializer):
    """
    Serializer for athlete statistics.
    """
    total_athletes = serializers.IntegerField()
    verified_athletes = serializers.IntegerField()
    pending_athletes = serializers.IntegerField()
    active_athletes = serializers.IntegerField()
    verification_rate = serializers.FloatField()
    average_profile_completion = serializers.FloatField()
    gender_distribution = serializers.DictField()
    grade_distribution = serializers.DictField()
    school_distribution = serializers.ListField()
    completion_ranges = serializers.DictField()
    age_ranges = serializers.DictField()