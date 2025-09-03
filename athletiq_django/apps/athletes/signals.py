"""
Enhanced signals for athlete management system.
"""
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.core.cache import cache
from .models import Athlete
import logging

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Athlete)
def update_athlete_profile_completion(sender, instance, **kwargs):
    """
    Update profile completion and status before saving athlete.
    """
    # Generate athlete ID if not set
    if not instance.athlete_id:
        instance.generate_athlete_id()
    
    # Calculate profile completion if not already calculated
    # TODO: Implement profile_completion field and calculate_profile_completion method
    # if not hasattr(instance, '_profile_completion_calculated'):
    #     old_completion = instance.profile_completion
    #     new_completion = instance.calculate_profile_completion()
    #     
    #     # Only update if there's a significant change
    #     if abs(old_completion - new_completion) >= 5:
    #         instance.profile_completion = new_completion
        
        # Mark as calculated to avoid recursion
        # TODO: Implement profile_completion field
        # instance._profile_completion_calculated = True
    
    # Update profile status based on completion
    # TODO: Implement profile_completion field
    # if instance.profile_completion >= 80:
    #     instance.profile_status = 'complete'
    # elif instance.profile_completion >= 50:
    #     instance.profile_status = 'under_review'
    # else:
    #     instance.profile_status = 'incomplete'
    
    # Auto-update verification status based on profile completion and documents
    # TODO: Implement profile_completion field
    # if (instance.profile_completion >= 80 and 
    #     instance.document_verified and 
    #     instance.verification_status == 'pending'):
    #     instance.verification_status = 'verified'
    
    # Update registration status for complete profiles
    # TODO: Implement profile_completion field
    # if (instance.profile_completion >= 60 and 
    #     instance.verification_status == 'verified' and 
    #     instance.registration_status == 'pending'):
    #     instance.registration_status = 'active'


@receiver(post_save, sender=Athlete)
def handle_athlete_post_save(sender, instance, created, **kwargs):
    """
    Handle post-save operations for athlete.
    """
    if created:
        # Log athlete creation
        logger.info(
            f"New athlete created: {instance.full_name} "
            f"(ID: {instance.athlete_id}) at {instance.school.name}"
        )
        
        # Clear school statistics cache
        cache.delete(f'school_stats_{instance.school.school_id}')
        
        # Send welcome notification to guardian if available
        # TODO: Implement guardian field properly
        # if instance.guardian and instance.guardian.email:
        #     # TODO: Implement email notification
        #     logger.info(f"Welcome notification should be sent to {instance.guardian.email}")
    
    else:
        # Log significant updates
        if hasattr(instance, '_state') and instance._state.adding is False:
            # Check if verification status changed
            try:
                old_instance = Athlete.objects.get(pk=instance.pk)
                if old_instance.verification_status != instance.verification_status:
                    logger.info(
                        f"Athlete {instance.full_name} verification status changed "
                        f"from {old_instance.verification_status} to {instance.verification_status}"
                    )
                    
                    # Send notification to guardian about status change
                    if instance.guardian and instance.guardian.email:
                        # TODO: Implement status change notification
                        logger.info(
                            f"Status change notification should be sent to {instance.guardian.email}"
                        )
            except Athlete.DoesNotExist:
                pass
    
    # Clear related caches
    cache.delete(f'athlete_stats_{instance.school.school_id}')
    cache.delete('global_athlete_stats')


@receiver(post_delete, sender=Athlete)
def handle_athlete_deletion(sender, instance, **kwargs):
    """
    Handle athlete deletion (soft delete).
    """
    logger.info(f"Athlete deleted: {instance.full_name} (ID: {instance.athlete_id})")
    
    # Clear related caches
    cache.delete(f'school_stats_{instance.school.school_id}')
    cache.delete(f'athlete_stats_{instance.school.school_id}')
    cache.delete('global_athlete_stats')


# Signal to handle guardian relationship updates
@receiver(post_save, sender='guardians.Guardian')
def update_related_athletes_on_guardian_change(sender, instance, **kwargs):
    """
    Update related athletes when guardian information changes.
    This ensures athlete records stay in sync with their guardian's contact info.
    """
    try:
        # Update athlete records that reference this guardian
        athletes = Athlete.objects.filter(guardian=instance)
        
        updated_count = 0
        for athlete in athletes:
            # Update guardian contact information in athlete record
            needs_update = False
            
            if athlete.guardian_name != instance.full_name:
                athlete.guardian_name = instance.full_name
                needs_update = True
                
            if athlete.guardian_phone != instance.phone:
                athlete.guardian_phone = instance.phone
                needs_update = True
                
            if athlete.guardian_email != instance.email:
                athlete.guardian_email = instance.email
                needs_update = True
            
            if needs_update:
                # Save without triggering profile completion recalculation
                athlete.save(update_fields=['guardian_name', 'guardian_phone', 'guardian_email', 'updated_at'])
                updated_count += 1
        
        if updated_count > 0:
            logger.info(f"Updated {updated_count} athletes related to guardian {instance.full_name}")
            
    except Exception as e:
        logger.error(f"Error updating athletes for guardian {instance.guardian_id}: {str(e)}")
        # Don't raise the exception to avoid breaking guardian save operations


@receiver(pre_save, sender=Athlete)
def sync_guardian_info_on_athlete_save(sender, instance, **kwargs):
    """
    Automatically populate guardian contact fields when an athlete is assigned to a guardian.
    """
    # Check if the athlete model has guardian fields before trying to access them
    if hasattr(instance, 'guardian') and hasattr(instance, 'guardian_id') and instance.guardian and instance.guardian_id:
        try:
            # Sync guardian contact information to athlete fields
            if hasattr(instance, 'guardian_name') and (not instance.guardian_name or instance.guardian_name != instance.guardian.full_name):
                instance.guardian_name = instance.guardian.full_name
                
            if hasattr(instance, 'guardian_phone') and (not instance.guardian_phone or instance.guardian_phone != instance.guardian.phone):
                instance.guardian_phone = instance.guardian.phone
                
            if hasattr(instance, 'guardian_email') and (not instance.guardian_email or instance.guardian_email != instance.guardian.email):
                instance.guardian_email = instance.guardian.email
                
        except Exception as e:
            logger.error(f"Error syncing guardian info for athlete {instance.athlete_id}: {str(e)}")
            # Don't raise the exception to avoid breaking athlete save operations
    # athlete._profile_completion_calculated = True
    # athlete.save()
    
    # Note: athletes variable reference removed - was undefined
    # if athletes.exists():
    #     logger.info(f"Updated {athletes.count()} athletes related to guardian {instance.full_name}")


# Signal to handle school changes
@receiver(post_save, sender='schools.School')
def update_related_athletes_on_school_change(sender, instance, **kwargs):
    """
    Update related athletes when school information changes.
    """
    # Only update if school is still active
    if instance.is_active:
        athletes = Athlete.objects.filter(school=instance)
        
        # Clear school-related caches
        cache.delete(f'school_stats_{instance.school_id}')
        cache.delete(f'athlete_stats_{instance.school_id}')
        
        if athletes.exists():
            logger.info(f"School {instance.name} updated, affecting {athletes.count()} athletes")