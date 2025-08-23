"""
Management command to cleanup old notifications and expired claims.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.notifications.models import NotificationLog, GuardianClaim


class Command(BaseCommand):
    help = 'Cleanup old notifications and expired claims'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to keep notification logs (default: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )
    
    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        self.stdout.write(f'Cleaning up data older than {days} days ({cutoff_date})')
        
        # Cleanup old notification logs
        old_logs = NotificationLog.objects.filter(created_at__lt=cutoff_date)
        log_count = old_logs.count()
        
        if dry_run:
            self.stdout.write(f'Would delete {log_count} notification logs')
        else:
            deleted_logs, _ = old_logs.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Deleted {deleted_logs} notification logs')
            )
        
        # Mark expired claims
        expired_claims = GuardianClaim.objects.filter(
            status='pending',
            expires_at__lt=timezone.now()
        )
        expired_count = expired_claims.count()
        
        if dry_run:
            self.stdout.write(f'Would mark {expired_count} claims as expired')
        else:
            updated_claims = expired_claims.update(status='expired')
            self.stdout.write(
                self.style.SUCCESS(f'Marked {updated_claims} claims as expired')
            )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('This was a dry run. No data was actually modified.')
            )