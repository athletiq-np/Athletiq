from django.core.management.base import BaseCommand
from apps.monitoring.services.metrics import MetricsCollectionService


class Command(BaseCommand):
    help = 'Collect system metrics'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup-days',
            type=int,
            default=30,
            help='Number of days to keep metrics data (default: 30)'
        )
    
    def handle(self, *args, **options):
        metrics_service = MetricsCollectionService()
        
        self.stdout.write('Collecting system metrics...')
        metrics = metrics_service.collect_system_metrics()
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully collected {len(metrics)} metrics')
        )
        
        # Cleanup old metrics if requested
        cleanup_days = options['cleanup_days']
        if cleanup_days > 0:
            self.stdout.write(f'Cleaning up metrics older than {cleanup_days} days...')
            deleted_count = metrics_service.cleanup_old_metrics(cleanup_days)
            self.stdout.write(
                self.style.SUCCESS(f'Cleaned up {deleted_count} old metrics records')
            )