"""
Guardian serializers for API endpoints.
"""
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Guardian, AthleteClaimRequest, GuardianNotification
from core.utils.validators import validate_password_strength


class GuardianRegistrationSerializer(serializers.ModelSerializer):
    """
    Guardian registration serializer.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password_strength])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = Guardian
        fields = [
            'full_name', 'email', 'phone', 'address', 'city', 
            'province', 'district', 'date_of_birth', 'occupation',
            'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        """
        Validate password confirmation.
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        """
        Create guardian with encrypted password.
        """
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        guardian = Guardian.objects.create(**validated_data)
        guardian.set_password(password)
        guardian.generate_verification_token()
        guardian.save()
        
        return guardian


class GuardianLoginSerializer(serializers.Serializer):
    """
    Guardian login serializer.
    """
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        """
        Validate guardian credentials and return token data.
        """
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            try:
                guardian = Guardian.objects.get(email=email)
                
                if not guardian.is_active:
                    raise serializers.ValidationError('Guardian account is disabled.')
                
                if not guardian.check_password(password):
                    raise serializers.ValidationError('Invalid email or password.')
                
                # Generate JWT token for guardian
                refresh = RefreshToken()
                refresh['guardian_id'] = guardian.guardian_id
                refresh['email'] = guardian.email
                refresh['full_name'] = guardian.full_name
                refresh['is_verified'] = guardian.is_verified
                
                return {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'guardian': GuardianSerializer(guardian).data
                }
                
            except Guardian.DoesNotExist:
                raise serializers.ValidationError('Invalid email or password.')
        
        raise serializers.ValidationError('Email and password are required.')


class GuardianSerializer(serializers.ModelSerializer):
    """
    Guardian serializer for API responses.
    """
    is_verified = serializers.ReadOnlyField()
    
    class Meta:
        model = Guardian
        fields = [
            'guardian_id', 'full_name', 'email', 'phone', 'address',
            'city', 'province', 'district', 'date_of_birth', 'occupation',
            'verification_status', 'email_verified', 'phone_verified',
            'is_verified', 'profile_picture', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'guardian_id', 'verification_status', 'email_verified', 
            'phone_verified', 'created_at', 'updated_at'
        ]


class GuardianProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Guardian profile update serializer.
    """
    
    class Meta:
        model = Guardian
        fields = [
            'full_name', 'phone', 'address', 'city', 'province', 
            'district', 'date_of_birth', 'occupation', 'profile_picture'
        ]


class AthleteClaimRequestSerializer(serializers.ModelSerializer):
    """
    Athlete claim request serializer.
    """
    guardian_name = serializers.CharField(source='guardian.full_name', read_only=True)
    guardian_email = serializers.CharField(source='guardian.email', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)
    
    class Meta:
        model = AthleteClaimRequest
        fields = [
            'id', 'guardian', 'guardian_name', 'guardian_email',
            'athlete_id', 'relationship', 'supporting_documents', 'notes',
            'status', 'reviewed_by', 'reviewed_by_name', 'review_notes',
            'reviewed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'guardian', 'status', 'reviewed_by', 'review_notes',
            'reviewed_at', 'created_at', 'updated_at'
        ]


class AthleteClaimRequestCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating athlete claim requests.
    """
    
    class Meta:
        model = AthleteClaimRequest
        fields = ['athlete_id', 'relationship', 'supporting_documents', 'notes']
    
    def create(self, validated_data):
        """
        Create claim request with guardian from context.
        """
        guardian = self.context['request'].guardian
        validated_data['guardian'] = guardian
        return super().create(validated_data)


class GuardianNotificationSerializer(serializers.ModelSerializer):
    """
    Guardian notification serializer.
    """
    
    class Meta:
        model = GuardianNotification
        fields = [
            'id', 'title', 'message', 'notification_type',
            'athlete_id', 'tournament_id', 'match_id',
            'is_read', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GuardianPasswordChangeSerializer(serializers.Serializer):
    """
    Guardian password change serializer.
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password_strength])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        """
        Validate password change.
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs
    
    def validate_old_password(self, value):
        """
        Validate old password.
        """
        guardian = self.context['request'].guardian
        if not guardian.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class EmailVerificationSerializer(serializers.Serializer):
    """
    Email verification serializer.
    """
    token = serializers.CharField(required=True)
    
    def validate_token(self, value):
        """
        Validate verification token.
        """
        try:
            guardian = Guardian.objects.get(verification_token=value)
            if guardian.email_verified:
                raise serializers.ValidationError("Email is already verified.")
            return value
        except Guardian.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token.")


class GuardianDashboardSerializer(serializers.Serializer):
    """
    Serializer for guardian dashboard data.
    """
    guardian = GuardianSerializer()
    athletes_count = serializers.IntegerField()
    athletes = serializers.ListField()
    pending_claims = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    recent_notifications = GuardianNotificationSerializer(many=True)


class AthleteClaimSerializer(serializers.Serializer):
    """
    Serializer for claiming an athlete.
    """
    athlete_code = serializers.CharField(max_length=20, required=True)
    relationship = serializers.ChoiceField(
        choices=[
            ('father', 'Father'),
            ('mother', 'Mother'),
            ('guardian', 'Guardian'),
            ('relative', 'Relative'),
            ('other', 'Other')
        ],
        required=True
    )
    supporting_documents = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        allow_empty=True
    )
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class GuardianDocumentUploadSerializer(serializers.Serializer):
    """
    Serializer for guardian document uploads.
    """
    document_type = serializers.ChoiceField(
        choices=[
            ('id_card', 'ID Card'),
            ('passport', 'Passport'),
            ('birth_certificate', 'Birth Certificate'),
            ('proof_of_address', 'Proof of Address'),
            ('other', 'Other')
        ],
        required=True
    )
    document_url = serializers.URLField(required=True)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)


class GuardianConsentSerializer(serializers.Serializer):
    """
    Serializer for guardian consent.
    """
    consent_type = serializers.ChoiceField(
        choices=[
            ('tournament', 'Tournament Participation'),
            ('medical', 'Medical Treatment'),
            ('travel', 'Travel Permission'),
            ('photo', 'Photo/Video Permission'),
            ('other', 'Other')
        ],
        required=True
    )
    consent_given = serializers.BooleanField(required=True)
    tournament_id = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class GuardianFeedbackSerializer(serializers.Serializer):
    """
    Serializer for guardian feedback.
    """
    subject = serializers.CharField(max_length=255, required=True)
    message = serializers.CharField(required=True)
    athlete_id = serializers.CharField(max_length=20, required=False, allow_blank=True)
    priority = serializers.ChoiceField(
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('urgent', 'Urgent')
        ],
        default='medium'
    )
    category = serializers.ChoiceField(
        choices=[
            ('general', 'General Inquiry'),
            ('complaint', 'Complaint'),
            ('suggestion', 'Suggestion'),
            ('technical', 'Technical Issue'),
            ('other', 'Other')
        ],
        default='general'
    )


class GuardianStatsSerializer(serializers.Serializer):
    """
    Serializer for guardian statistics.
    """
    total_athletes = serializers.IntegerField()
    verified_athletes = serializers.IntegerField()
    pending_claims = serializers.IntegerField()
    total_notifications = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    recent_activity = serializers.ListField()


class GuardianNotificationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating guardian notifications.
    """
    class Meta:
        model = GuardianNotification
        fields = ['is_read']