"""
Management command to send reminder notifications.
"""
from django.core.management.base import BaseCommand
from apps.notifications.tasks import send_reminder_notifications_task


class Command(BaseCommand):
    help = 'Send reminder notifications for expiring guardian claims'
    
    def handle(self, *args, **options):
        self.stdout.write('Starting reminder notifications...')
        
        try:
            result = send_reminder_notifications_task.delay()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Reminder notifications task queued with ID: {result.id}'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error queuing reminder notifications: {str(e)}')
            )