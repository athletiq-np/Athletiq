"""
Celery tasks for asynchronous notification processing.
"""
import logging
from typing import Dict, Any
from celery import shared_task
from django.utils import timezone
from .services.notification_service import NotificationService
from .services.email_service import EmailService
from .services.sms_service import SMSService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_guardian_registration_notification_task(self, athlete_data: Dict[str, Any]):
    """
    Asynchronous task to send guardian registration notifications.
    
    Args:
        athlete_data: Dictionary containing athlete information
        
    Returns:
        Dict with task result
    """
    try:
        notification_service = NotificationService()
        result = notification_service.send_guardian_registration_notification(athlete_data)
        
        logger.info(f"Guardian registration notification task completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Guardian registration notification task failed: {str(e)}")
        
        # Retry the task with exponential backoff
        if self.request.retries < self.max_retries:
            countdown = 2 ** self.request.retries * 60  # 1min, 2min, 4min
            raise self.retry(countdown=countdown, exc=e)
        
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to send guardian registration notification after retries'
        }


@shared_task(bind=True, max_retries=3)
def send_athlete_registration_notification_task(
    self,
    athlete_data: Dict[str, Any],
    school_admin_email: str
):
    """
    Asynchronous task to send athlete registration notifications to school admin.
    
    Args:
        athlete_data: Dictionary containing athlete information
        school_admin_email: School administrator email address
        
    Returns:
        Dict with task result
    """
    try:
        notification_service = NotificationService()
        result = notification_service.send_athlete_registration_notification(
            athlete_data=athlete_data,
            school_admin_email=school_admin_email
        )
        
        logger.info(f"Athlete registration notification task completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Athlete registration notification task failed: {str(e)}")
        
        # Retry the task with exponential backoff
        if self.request.retries < self.max_retries:
            countdown = 2 ** self.request.retries * 60  # 1min, 2min, 4min
            raise self.retry(countdown=countdown, exc=e)
        
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to send athlete registration notification after retries'
        }


@shared_task(bind=True, max_retries=2)
def send_email_task(
    self,
    to_email: str,
    subject: str,
    content: str,
    html_content: str = None,
    template_name: str = None,
    context: Dict[str, Any] = None,
    recipient_name: str = None
):
    """
    Asynchronous task to send individual emails.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        content: Plain text content
        html_content: HTML content (optional)
        template_name: Template name for logging (optional)
        context: Template context data (optional)
        recipient_name: Recipient name (optional)
        
    Returns:
        Dict with task result
    """
    try:
        email_service = EmailService()
        result = email_service.send_email(
            to_email=to_email,
            subject=subject,
            content=content,
            html_content=html_content,
            template_name=template_name,
            context=context or {},
            recipient_name=recipient_name
        )
        
        logger.info(f"Email task completed for {to_email}: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Email task failed for {to_email}: {str(e)}")
        
        # Retry the task with exponential backoff
        if self.request.retries < self.max_retries:
            countdown = 2 ** self.request.retries * 30  # 30sec, 1min
            raise self.retry(countdown=countdown, exc=e)
        
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to send email after retries'
        }


@shared_task(bind=True, max_retries=2)
def send_sms_task(
    self,
    to_phone: str,
    message: str,
    template_name: str = None,
    context: Dict[str, Any] = None,
    recipient_name: str = None
):
    """
    Asynchronous task to send individual SMS messages.
    
    Args:
        to_phone: Recipient phone number
        message: SMS message content
        template_name: Template name for logging (optional)
        context: Template context data (optional)
        recipient_name: Recipient name (optional)
        
    Returns:
        Dict with task result
    """
    try:
        sms_service = SMSService()
        result = sms_service.send_sms(
            to_phone=to_phone,
            message=message,
            template_name=template_name,
            context=context or {},
            recipient_name=recipient_name
        )
        
        logger.info(f"SMS task completed for {to_phone}: {result}")
        return result
        
    except Exception as e:
        logger.error(f"SMS task failed for {to_phone}: {str(e)}")
        
        # Retry the task with exponential backoff
        if self.request.retries < self.max_retries:
            countdown = 2 ** self.request.retries * 30  # 30sec, 1min
            raise self.retry(countdown=countdown, exc=e)
        
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to send SMS after retries'
        }


@shared_task
def send_reminder_notifications_task():
    """
    Periodic task to send reminder notifications for expiring claims.
    This task should be scheduled to run every hour.
    
    Returns:
        Dict with task result
    """
    try:
        notification_service = NotificationService()
        result = notification_service.send_reminder_notifications()
        
        logger.info(f"Reminder notifications task completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Reminder notifications task failed: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to send reminder notifications'
        }


@shared_task
def cleanup_expired_claims_task():
    """
    Periodic task to cleanup expired guardian claims.
    This task should be scheduled to run daily.
    
    Returns:
        Dict with task result
    """
    try:
        from .models import GuardianClaim
        
        # Mark expired claims
        expired_count = GuardianClaim.objects.filter(
            status='pending',
            expires_at__lt=timezone.now()
        ).update(status='expired')
        
        logger.info(f"Marked {expired_count} claims as expired")
        
        return {
            'success': True,
            'expired_count': expired_count,
            'message': f'Marked {expired_count} claims as expired'
        }
        
    except Exception as e:
        logger.error(f"Cleanup expired claims task failed: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to cleanup expired claims'
        }


@shared_task
def process_notification_delivery_status_task():
    """
    Periodic task to process notification delivery status updates.
    This task should be scheduled to run every 15 minutes.
    
    Returns:
        Dict with task result
    """
    try:
        from .models import NotificationLog
        
        # Find notifications that are sent but not yet marked as delivered
        pending_notifications = NotificationLog.objects.filter(
            status='sent',
            sent_at__lt=timezone.now() - timezone.timedelta(minutes=5)
        )
        
        processed_count = 0
        
        for notification in pending_notifications:
            # Here you would check with the email/SMS provider for delivery status
            # For now, we'll just mark old notifications as delivered
            if notification.sent_at < timezone.now() - timezone.timedelta(hours=1):
                notification.mark_as_delivered()
                processed_count += 1
        
        logger.info(f"Processed {processed_count} notification delivery statuses")
        
        return {
            'success': True,
            'processed_count': processed_count,
            'message': f'Processed {processed_count} notification delivery statuses'
        }
        
    except Exception as e:
        logger.error(f"Process notification delivery status task failed: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to process notification delivery statuses'
        }


@shared_task
def cleanup_expired_notifications():
    """
    Periodic task to cleanup expired notifications and logs.
    This task should be scheduled to run hourly.
    
    Returns:
        Dict with task result
    """
    try:
        from .models import NotificationLog, GuardianClaim
        from datetime import timedelta
        
        # Clean up old notification logs (older than 30 days)
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_logs = NotificationLog.objects.filter(
            created_at__lt=cutoff_date
        ).delete()[0]
        
        # Clean up expired guardian claims (older than 7 days)
        expired_cutoff = timezone.now() - timedelta(days=7)
        deleted_claims = GuardianClaim.objects.filter(
            status='expired',
            updated_at__lt=expired_cutoff
        ).delete()[0]
        
        logger.info(f"Cleaned up {deleted_logs} old notification logs and {deleted_claims} expired claims")
        
        return {
            'success': True,
            'deleted_logs': deleted_logs,
            'deleted_claims': deleted_claims,
            'message': f'Cleaned up {deleted_logs} logs and {deleted_claims} claims'
        }
        
    except Exception as e:
        logger.error(f"Cleanup expired notifications task failed: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to cleanup expired notifications'
        }