"""
Django signals for automatic notification triggering.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .tasks import send_guardian_registration_notification_task, send_athlete_registration_notification_task

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender='athletes.Athlete')
def athlete_created_notification(sender, instance, created, **kwargs):
    """
    Send notifications when a new athlete is created.
    """
    if created and instance.guardian_email:
        try:
            # Prepare athlete data for notification
            athlete_data = {
                'athlete_id': instance.id,
                'full_name': instance.full_name,
                'athlete_id': getattr(instance, 'athlete_id', ''),
                'school_name': instance.school.name if instance.school else '',
                'grade': getattr(instance, 'grade', ''),
                'guardian_email': instance.guardian_email,
                'guardian_phone': getattr(instance, 'guardian_phone', ''),
                'athlete_instance': instance,
            }
            
            # Queue guardian registration notification
            send_guardian_registration_notification_task.delay(athlete_data)
            
            # Send notification to school admin if available
            if instance.school and hasattr(instance.school, 'admin_user'):
                school_admin_email = instance.school.admin_user.email
                send_athlete_registration_notification_task.delay(
                    athlete_data, school_admin_email
                )
            
            logger.info(f"Queued notifications for new athlete: {instance.full_name}")
            
        except Exception as e:
            logger.error(f"Error queuing athlete notifications: {str(e)}")


@receiver(post_save, sender='guardians.Guardian')
def guardian_created_notification(sender, instance, created, **kwargs):
    """
    Send welcome notification when a new guardian is created.
    """
    if created:
        try:
            # Send welcome email to guardian
            # This could be implemented as a separate task
            logger.info(f"Guardian created: {instance.email}")
            
        except Exception as e:
            logger.error(f"Error sending guardian welcome notification: {str(e)}")


@receiver(post_save, sender='schools.School')
def school_created_notification(sender, instance, created, **kwargs):
    """
    Send notifications when a new school is registered.
    """
    if created and instance.admin_user:
        try:
            # Send welcome email to school admin
            # This could be implemented as a separate task
            logger.info(f"School created: {instance.name}")
            
        except Exception as e:
            logger.error(f"Error sending school welcome notification: {str(e)}")


@receiver(post_save, sender='tournaments.Tournament')
def tournament_created_notification(sender, instance, created, **kwargs):
    """
    Send notifications when a new tournament is created.
    """
    if created:
        try:
            # Send notification to relevant stakeholders
            # This could be implemented as a separate task
            logger.info(f"Tournament created: {instance.name}")
            
        except Exception as e:
            logger.error(f"Error sending tournament notifications: {str(e)}")