"""
Serializers for notifications app.
"""
from rest_framework import serializers
from .models import NotificationTemplate, NotificationLog, NotificationPreference, GuardianClaim


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for notification templates."""
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'template_type', 'category', 'subject',
            'content', 'html_content', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer for notification logs."""
    
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = NotificationLog
        fields = [
            'id', 'notification_type', 'template', 'template_name',
            'recipient_email', 'recipient_phone', 'recipient_name',
            'subject', 'status', 'external_id', 'error_message',
            'sent_at', 'delivered_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'template_name', 'external_id', 'sent_at', 
            'delivered_at', 'created_at'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences."""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'guardian_registration', 'athlete_registration', 'tournament_updates',
            'reminders', 'marketing', 'preferred_email', 'preferred_phone',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class GuardianClaimSerializer(serializers.ModelSerializer):
    """Serializer for guardian claims."""
    
    athlete_name = serializers.CharField(source='athlete.full_name', read_only=True)
    athlete_id = serializers.CharField(source='athlete.athlete_id', read_only=True)
    school_name = serializers.CharField(source='athlete.school.name', read_only=True)
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = GuardianClaim
        fields = [
            'id', 'athlete', 'athlete_name', 'athlete_id', 'school_name',
            'guardian_phone', 'guardian_email', 'claim_code', 'status',
            'requires_school_approval', 'reminder_sent', 'is_expired',
            'expires_at', 'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'athlete_name', 'athlete_id', 'school_name', 'claim_code',
            'is_expired', 'completed_at', 'created_at', 'updated_at'
        ]
    
    def get_is_expired(self, obj):
        """Check if claim is expired."""
        return obj.is_expired()


class SendNotificationSerializer(serializers.Serializer):
    """Serializer for sending notifications."""
    
    NOTIFICATION_TYPES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('both', 'Both'),
    ]
    
    notification_type = serializers.ChoiceField(choices=NOTIFICATION_TYPES)
    recipient_email = serializers.EmailField(required=False)
    recipient_phone = serializers.CharField(max_length=20, required=False)
    recipient_name = serializers.CharField(max_length=255, required=False)
    subject = serializers.CharField(max_length=255, required=False)
    message = serializers.CharField()
    template_category = serializers.CharField(max_length=50, required=False)
    context_data = serializers.JSONField(required=False, default=dict)
    
    def validate(self, data):
        """Validate notification data."""
        notification_type = data.get('notification_type')
        
        if notification_type in ['email', 'both']:
            if not data.get('recipient_email'):
                raise serializers.ValidationError(
                    "recipient_email is required for email notifications"
                )
            if not data.get('subject'):
                raise serializers.ValidationError(
                    "subject is required for email notifications"
                )
        
        if notification_type in ['sms', 'both']:
            if not data.get('recipient_phone'):
                raise serializers.ValidationError(
                    "recipient_phone is required for SMS notifications"
                )
        
        return data


class ClaimVerificationSerializer(serializers.Serializer):
    """Serializer for claim code verification."""
    
    claim_code = serializers.CharField(max_length=10)
    
    def validate_claim_code(self, value):
        """Validate claim code format."""
        if not value.isalnum():
            raise serializers.ValidationError("Claim code must be alphanumeric")
        return value.upper()


class ClaimCompletionSerializer(serializers.Serializer):
    """Serializer for completing guardian claims."""
    
    claim_code = serializers.CharField(max_length=10)
    guardian_name = serializers.CharField(max_length=255)
    guardian_phone = serializers.CharField(max_length=20, required=False)
    guardian_email = serializers.EmailField(required=False)
    
    def validate_claim_code(self, value):
        """Validate claim code format."""
        if not value.isalnum():
            raise serializers.ValidationError("Claim code must be alphanumeric")
        return value.upper()
    
    def validate(self, data):
        """Validate that at least one contact method is provided."""
        if not data.get('guardian_phone') and not data.get('guardian_email'):
            raise serializers.ValidationError(
                "At least one contact method (phone or email) is required"
            )
        return data