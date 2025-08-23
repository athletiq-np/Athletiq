"""
Email notification service for Athletiq Django backend.
Maintains compatibility with existing Node.js email configuration.
"""
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.template import Template, Context
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from ..models import NotificationLog, NotificationTemplate
from .template_service import TemplateService

logger = logging.getLogger(__name__)


class EmailService:
    """
    Email service that maintains compatibility with existing Node.js implementation.
    Uses Django's email backend with django-anymail for provider integration.
    """
    
    def __init__(self):
        self.template_service = TemplateService()
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@athletiq.com')
        self.from_name = getattr(settings, 'DEFAULT_FROM_NAME', 'Athletiq Nepal')
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        content: str,
        html_content: str = None,
        template_name: str = None,
        context: Dict[str, Any] = None,
        related_object: Any = None,
        recipient_name: str = None
    ) -> Dict[str, Any]:
        """
        Send email notification with tracking.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            content: Plain text content
            html_content: HTML content (optional)
            template_name: Template name for logging (optional)
            context: Template context data (optional)
            related_object: Related model instance (optional)
            recipient_name: Recipient name (optional)
            
        Returns:
            Dict with success status and message details
        """
        try:
            # Create notification log entry
            notification_log = self._create_notification_log(
                to_email=to_email,
                subject=subject,
                content=content,
                html_content=html_content,
                template_name=template_name,
                context=context or {},
                related_object=related_object,
                recipient_name=recipient_name
            )
            
            # Create email message
            email = EmailMultiAlternatives(
                subject=subject,
                body=content,
                from_email=f'"{self.from_name}" <{self.from_email}>',
                to=[to_email]
            )
            
            # Add HTML content if provided
            if html_content:
                email.attach_alternative(html_content, "text/html")
            
            # Send email
            result = email.send()
            
            if result:
                # Mark as sent
                external_id = getattr(email, 'anymail_status', {}).get('message_id', '')
                notification_log.mark_as_sent(external_id=external_id)
                
                logger.info(f"Email sent successfully to {to_email}")
                return {
                    'success': True,
                    'message_id': external_id,
                    'notification_id': str(notification_log.id),
                    'message': 'Email sent successfully'
                }
            else:
                notification_log.mark_as_failed('Failed to send email')
                return {
                    'success': False,
                    'error': 'Failed to send email',
                    'message': 'Email sending failed'
                }
                
        except Exception as e:
            logger.error(f"Email sending error: {str(e)}")
            if 'notification_log' in locals():
                notification_log.mark_as_failed(str(e))
            
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send email'
            }
    
    def send_guardian_registration_email(
        self,
        athlete_data: Dict[str, Any],
        claim_code: str,
        guardian_email: str
    ) -> Dict[str, Any]:
        """
        Send guardian registration notification email.
        Maintains compatibility with Node.js implementation.
        """
        try:
            # Get or create template
            template = self.template_service.get_template(
                template_type='email',
                category='guardian_registration'
            )
            
            # Prepare context data
            context = {
                'athlete_name': athlete_data.get('full_name', ''),
                'athlete_id': athlete_data.get('athlete_id', ''),
                'school_name': athlete_data.get('school_name', ''),
                'grade': athlete_data.get('grade', ''),
                'claim_code': claim_code,
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
                'current_date': timezone.now().strftime('%B %d, %Y'),
                'expiry_hours': 24
            }
            
            # Render template content
            subject = self.template_service.render_template_content(
                template.subject, context
            )
            html_content = self.template_service.render_template_content(
                template.html_content, context
            )
            plain_content = self.template_service.render_template_content(
                template.content, context
            )
            
            # Send email
            return self.send_email(
                to_email=guardian_email,
                subject=subject,
                content=plain_content,
                html_content=html_content,
                template_name='guardian_registration',
                context=context,
                related_object=athlete_data.get('athlete_instance'),
                recipient_name='Guardian'
            )
            
        except Exception as e:
            logger.error(f"Guardian registration email error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send guardian registration email'
            }
    
    def send_athlete_registration_email(
        self,
        athlete_data: Dict[str, Any],
        school_admin_email: str
    ) -> Dict[str, Any]:
        """Send athlete registration confirmation email to school admin."""
        try:
            template = self.template_service.get_template(
                template_type='email',
                category='athlete_registration'
            )
            
            context = {
                'athlete_name': athlete_data.get('full_name', ''),
                'athlete_id': athlete_data.get('athlete_id', ''),
                'school_name': athlete_data.get('school_name', ''),
                'registration_date': timezone.now().strftime('%B %d, %Y'),
                'guardian_email': athlete_data.get('guardian_email', ''),
                'guardian_phone': athlete_data.get('guardian_phone', ''),
            }
            
            subject = self.template_service.render_template_content(
                template.subject, context
            )
            html_content = self.template_service.render_template_content(
                template.html_content, context
            )
            plain_content = self.template_service.render_template_content(
                template.content, context
            )
            
            return self.send_email(
                to_email=school_admin_email,
                subject=subject,
                content=plain_content,
                html_content=html_content,
                template_name='athlete_registration',
                context=context,
                related_object=athlete_data.get('athlete_instance'),
                recipient_name='School Admin'
            )
            
        except Exception as e:
            logger.error(f"Athlete registration email error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send athlete registration email'
            }
    
    def send_reminder_email(
        self,
        claim_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send reminder email for pending guardian claims."""
        try:
            template = self.template_service.get_template(
                template_type='email',
                category='reminder'
            )
            
            context = {
                'athlete_name': claim_data.get('full_name', ''),
                'athlete_id': claim_data.get('athlete_id', ''),
                'claim_code': claim_data.get('claim_code', ''),
                'expiry_time': '6 hours',
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
            }
            
            subject = self.template_service.render_template_content(
                template.subject, context
            )
            html_content = self.template_service.render_template_content(
                template.html_content, context
            )
            plain_content = self.template_service.render_template_content(
                template.content, context
            )
            
            return self.send_email(
                to_email=claim_data.get('guardian_email', ''),
                subject=subject,
                content=plain_content,
                html_content=html_content,
                template_name='reminder',
                context=context,
                recipient_name='Guardian'
            )
            
        except Exception as e:
            logger.error(f"Reminder email error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send reminder email'
            }
    
    def _create_notification_log(
        self,
        to_email: str,
        subject: str,
        content: str,
        html_content: str = None,
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
                    template_type='email',
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
            notification_type='email',
            template=template,
            recipient_email=to_email,
            recipient_name=recipient_name or '',
            subject=subject,
            content=content,
            html_content=html_content or '',
            context_data=context or {},
            content_type=content_type,
            object_id=object_id
        )