"""
Main notification service that coordinates email and SMS notifications.
Maintains compatibility with existing Node.js guardian notification service.
"""
import logging
import secrets
import string
from typing import Dict, List, Any, Optional
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from ..models import GuardianClaim, NotificationPreference
from .email_service import EmailService
from .sms_service import SMSService

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Main notification service that coordinates email and SMS notifications.
    Maintains compatibility with Node.js GuardianNotificationService.
    """
    
    def __init__(self):
        self.email_service = EmailService()
        self.sms_service = SMSService()
    
    def generate_claim_code(self) -> str:
        """Generate a secure claim code for guardian verification."""
        # Generate 8-character alphanumeric code (matching Node.js implementation)
        alphabet = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(8))
    
    @transaction.atomic
    def send_guardian_registration_notification(
        self,
        athlete_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send registration notification to guardian via email and SMS.
        Maintains compatibility with Node.js implementation.
        
        Args:
            athlete_data: Dictionary containing athlete information
            
        Returns:
            Dict with success status and notification details
        """
        try:
            claim_code = self.generate_claim_code()
            
            # Store claim code in database
            claim = self._store_claim_code(
                athlete_data=athlete_data,
                claim_code=claim_code
            )
            
            notifications = []
            
            # Send SMS if phone number provided
            if athlete_data.get('guardian_phone'):
                sms_result = self.sms_service.send_guardian_registration_sms(
                    athlete_data=athlete_data,
                    claim_code=claim_code,
                    guardian_phone=athlete_data['guardian_phone']
                )
                notifications.append({
                    'type': 'sms',
                    'success': sms_result['success'],
                    'message': sms_result['message']
                })
            
            # Send Email if email provided
            if athlete_data.get('guardian_email'):
                email_result = self.email_service.send_guardian_registration_email(
                    athlete_data=athlete_data,
                    claim_code=claim_code,
                    guardian_email=athlete_data['guardian_email']
                )
                notifications.append({
                    'type': 'email',
                    'success': email_result['success'],
                    'message': email_result['message']
                })
            
            return {
                'success': True,
                'claim_code': claim_code,
                'claim_id': str(claim.id),
                'notifications': notifications,
                'message': 'Guardian notification sent successfully'
            }
            
        except Exception as e:
            logger.error(f"Guardian notification error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send guardian notification'
            }
    
    def send_athlete_registration_notification(
        self,
        athlete_data: Dict[str, Any],
        school_admin_email: str
    ) -> Dict[str, Any]:
        """Send athlete registration notification to school admin."""
        try:
            return self.email_service.send_athlete_registration_email(
                athlete_data=athlete_data,
                school_admin_email=school_admin_email
            )
        except Exception as e:
            logger.error(f"Athlete registration notification error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send athlete registration notification'
            }
    
    def send_reminder_notifications(self) -> Dict[str, Any]:
        """
        Send reminder notifications for claims expiring within 6 hours.
        Maintains compatibility with Node.js implementation.
        """
        try:
            # Find claims expiring within 6 hours
            expiry_threshold = timezone.now() + timedelta(hours=6)
            
            pending_claims = GuardianClaim.objects.filter(
                status='pending',
                expires_at__lte=expiry_threshold,
                expires_at__gt=timezone.now(),
                reminder_sent=False
            ).select_related('athlete')
            
            reminders = []
            
            for claim in pending_claims:
                # Prepare claim data
                claim_data = {
                    'full_name': claim.athlete.full_name,
                    'athlete_id': claim.athlete.athlete_id,
                    'claim_code': claim.claim_code,
                    'guardian_phone': claim.guardian_phone,
                    'guardian_email': claim.guardian_email,
                }
                
                # Send SMS reminder if phone available
                if claim.guardian_phone:
                    sms_result = self.sms_service.send_reminder_sms(claim_data)
                    reminders.append({
                        'athlete_id': claim.athlete.athlete_id,
                        'type': 'sms',
                        'success': sms_result['success'],
                        'message': sms_result['message']
                    })
                
                # Send email reminder if email available
                if claim.guardian_email:
                    email_result = self.email_service.send_reminder_email(claim_data)
                    reminders.append({
                        'athlete_id': claim.athlete.athlete_id,
                        'type': 'email',
                        'success': email_result['success'],
                        'message': email_result['message']
                    })
                
                # Mark reminder as sent
                claim.reminder_sent = True
                claim.save(update_fields=['reminder_sent'])
            
            return {
                'success': True,
                'reminders_sent': len(reminders),
                'reminders': reminders,
                'message': f'Sent {len(reminders)} reminder notifications'
            }
            
        except Exception as e:
            logger.error(f"Reminder sending error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send reminder notifications'
            }
    
    def verify_claim_code(self, claim_code: str) -> Dict[str, Any]:
        """
        Verify claim code and retrieve athlete information.
        Maintains compatibility with Node.js implementation.
        """
        try:
            claim = GuardianClaim.objects.select_related('athlete', 'athlete__school').get(
                claim_code=claim_code,
                status='pending',
                expires_at__gt=timezone.now()
            )
            
            return {
                'success': True,
                'data': {
                    'id': claim.athlete.id,
                    'full_name': claim.athlete.full_name,
                    'athlete_id': claim.athlete.athlete_id,
                    'grade': getattr(claim.athlete, 'grade', ''),
                    'date_of_birth': claim.athlete.date_of_birth,
                    'school_name': claim.athlete.school.name if claim.athlete.school else '',
                    'claim_code': claim.claim_code,
                    'guardian_phone': claim.guardian_phone,
                    'guardian_email': claim.guardian_email,
                },
                'message': 'Claim code verified successfully'
            }
            
        except GuardianClaim.DoesNotExist:
            return {
                'success': False,
                'message': 'Invalid or expired claim code'
            }
        except Exception as e:
            logger.error(f"Claim code verification error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to verify claim code'
            }
    
    @transaction.atomic
    def complete_claim(self, claim_code: str, guardian_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mark claim as completed and update guardian information.
        Maintains compatibility with Node.js implementation.
        """
        try:
            claim = GuardianClaim.objects.select_related('athlete').get(
                claim_code=claim_code,
                status='pending',
                expires_at__gt=timezone.now()
            )
            
            # Mark claim as completed
            claim.mark_as_completed()
            
            # Update athlete's guardian information
            athlete = claim.athlete
            if hasattr(athlete, 'guardian_name'):
                athlete.guardian_name = guardian_data.get('guardian_name', '')
            if hasattr(athlete, 'guardian_phone'):
                athlete.guardian_phone = guardian_data.get('guardian_phone', claim.guardian_phone)
            if hasattr(athlete, 'guardian_email'):
                athlete.guardian_email = guardian_data.get('guardian_email', claim.guardian_email)
            if hasattr(athlete, 'guardian_verified'):
                athlete.guardian_verified = True
            
            athlete.save()
            
            return {
                'success': True,
                'message': 'Guardian profile completed successfully'
            }
            
        except GuardianClaim.DoesNotExist:
            return {
                'success': False,
                'message': 'Invalid or expired claim code'
            }
        except Exception as e:
            logger.error(f"Claim completion error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to complete guardian profile'
            }
    
    def get_notification_preferences(self, user) -> NotificationPreference:
        """Get or create notification preferences for user."""
        preferences, created = NotificationPreference.objects.get_or_create(
            user=user,
            defaults={
                'preferred_email': user.email,
                'preferred_phone': getattr(user, 'phone', ''),
            }
        )
        return preferences
    
    def _store_claim_code(
        self,
        athlete_data: Dict[str, Any],
        claim_code: str,
        status: str = 'pending'
    ) -> GuardianClaim:
        """Store claim code in database with expiration."""
        
        # Set expiration to 24 hours from now
        expires_at = timezone.now() + timedelta(hours=24)
        
        # Get athlete instance
        from apps.athletes.models import Athlete
        try:
            athlete = Athlete.objects.get(id=athlete_data['athlete_id'])
        except (Athlete.DoesNotExist, KeyError):
            # If athlete instance not found, we'll need to handle this
            # For now, raise an exception
            raise ValueError("Athlete instance required for claim code storage")
        
        # Create or update claim
        claim, created = GuardianClaim.objects.update_or_create(
            athlete=athlete,
            defaults={
                'guardian_phone': athlete_data.get('guardian_phone', ''),
                'guardian_email': athlete_data.get('guardian_email', ''),
                'claim_code': claim_code,
                'status': status,
                'expires_at': expires_at,
                'reminder_sent': False,
            }
        )
        
        return claim