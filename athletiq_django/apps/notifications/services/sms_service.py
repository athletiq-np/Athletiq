"""
SMS notification service using Twilio.
Maintains compatibility with existing Node.js SMS configuration.
"""
import logging
from typing import Dict, Any, Optional
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from twilio.rest import Client
from twilio.base.exceptions import TwilioException
from ..models import NotificationLog, NotificationTemplate
from .template_service import TemplateService

logger = logging.getLogger(__name__)


class SMSService:
    """
    SMS service using Twilio that maintains compatibility with Node.js implementation.
    """
    
    def __init__(self):
        self.template_service = TemplateService()
        
        # Initialize Twilio client
        account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
        auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
        self.from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', None)
        
        if account_sid and auth_token:
            self.client = Client(account_sid, auth_token)
        else:
            self.client = None
            logger.warning("Twilio credentials not configured")
    
    def send_sms(
        self,
        to_phone: str,
        message: str,
        template_name: str = None,
        context: Dict[str, Any] = None,
        related_object: Any = None,
        recipient_name: str = None
    ) -> Dict[str, Any]:
        """
        Send SMS notification with tracking.
        
        Args:
            to_phone: Recipient phone number
            message: SMS message content
            template_name: Template name for logging (optional)
            context: Template context data (optional)
            related_object: Related model instance (optional)
            recipient_name: Recipient name (optional)
            
        Returns:
            Dict with success status and message details
        """
        if not self.client:
            return {
                'success': False,
                'error': 'Twilio not configured',
                'message': 'SMS service not available'
            }
        
        if not self.from_number:
            return {
                'success': False,
                'error': 'Twilio phone number not configured',
                'message': 'SMS service not available'
            }
        
        try:
            # Create notification log entry
            notification_log = self._create_notification_log(
                to_phone=to_phone,
                message=message,
                template_name=template_name,
                context=context or {},
                related_object=related_object,
                recipient_name=recipient_name
            )
            
            # Send SMS via Twilio
            twilio_message = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_phone
            )
            
            # Mark as sent
            notification_log.mark_as_sent(external_id=twilio_message.sid)
            
            logger.info(f"SMS sent successfully to {to_phone}")
            return {
                'success': True,
                'message_id': twilio_message.sid,
                'notification_id': str(notification_log.id),
                'message': 'SMS sent successfully'
            }
            
        except TwilioException as e:
            logger.error(f"Twilio SMS error: {str(e)}")
            if 'notification_log' in locals():
                notification_log.mark_as_failed(str(e))
            
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send SMS'
            }
        except Exception as e:
            logger.error(f"SMS sending error: {str(e)}")
            if 'notification_log' in locals():
                notification_log.mark_as_failed(str(e))
            
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send SMS'
            }
    
    def send_guardian_registration_sms(
        self,
        athlete_data: Dict[str, Any],
        claim_code: str,
        guardian_phone: str
    ) -> Dict[str, Any]:
        """
        Send guardian registration notification SMS.
        Maintains compatibility with Node.js implementation.
        """
        try:
            # Get or create template
            template = self.template_service.get_template(
                template_type='sms',
                category='guardian_registration'
            )
            
            # Prepare context data
            context = {
                'athlete_name': athlete_data.get('full_name', ''),
                'athlete_id': athlete_data.get('athlete_id', ''),
                'school_name': athlete_data.get('school_name', ''),
                'claim_code': claim_code,
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
                'expiry_hours': 24
            }
            
            # Render template content
            message = self.template_service.render_template_content(
                template.content, context
            )
            
            # Send SMS
            return self.send_sms(
                to_phone=guardian_phone,
                message=message,
                template_name='guardian_registration',
                context=context,
                related_object=athlete_data.get('athlete_instance'),
                recipient_name='Guardian'
            )
            
        except Exception as e:
            logger.error(f"Guardian registration SMS error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send guardian registration SMS'
            }
    
    def send_reminder_sms(
        self,
        claim_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send reminder SMS for pending guardian claims."""
        try:
            template = self.template_service.get_template(
                template_type='sms',
                category='reminder'
            )
            
            context = {
                'athlete_name': claim_data.get('full_name', ''),
                'athlete_id': claim_data.get('athlete_id', ''),
                'claim_code': claim_data.get('claim_code', ''),
                'expiry_time': '6 hours',
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
            }
            
            message = self.template_service.render_template_content(
                template.content, context
            )
            
            return self.send_sms(
                to_phone=claim_data.get('guardian_phone', ''),
                message=message,
                template_name='reminder',
                context=context,
                recipient_name='Guardian'
            )
            
        except Exception as e:
            logger.error(f"Reminder SMS error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send reminder SMS'
            }
    
    def _create_notification_log(
        self,
        to_phone: str,
        message: str,
        template_name: str = None,
        context: Dict[str, Any] = None,
        related_object: Any = None,
        recipient_name: str = None
    ) -> NotificationLog:
        """Create notification log entry for tracking."""
        
        # Get template if template_name provided
        template = None
        if template_name:
            try:
                template = NotificationTemplate.objects.get(
                    template_type='sms',
                    category=template_name,
                    is_active=True
                )
            except NotificationTemplate.DoesNotExist:
                pass
        
        # Get content type and object id for generic foreign key
        content_type = None
        object_id = None
        if related_object:
            content_type = ContentType.objects.get_for_model(related_object)
            object_id = related_object.pk
        
        return NotificationLog.objects.create(
            notification_type='sms',
            template=template,
            recipient_phone=to_phone,
            recipient_name=recipient_name or '',
            subject='',  # SMS doesn't have subject
            content=message,
            html_content='',  # SMS doesn't have HTML
            context_data=context or {},
            content_type=content_type,
            object_id=object_id
        )