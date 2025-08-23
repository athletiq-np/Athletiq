from django.core.management.base import BaseCommand
from apps.monitoring.services.alerting import AlertingService


class Command(BaseCommand):
    help = 'Check alert rules and trigger alerts if needed'
    
    def handle(self, *args, **options):
        alerting_service = AlertingService()
        
        self.stdout.write('Checking alert rules...')
        triggered_alerts = alerting_service.check_alert_rules()
        
        if triggered_alerts:
            self.stdout.write(
                self.style.WARNING(f'Triggered {len(triggered_alerts)} alerts:')
            )
            for alert in triggered_alerts:
                self.stdout.write(
                    f"  - {alert['rule_name']} ({alert['severity']}): {alert['message']}"
                )
        else:
            self.stdout.write(
                self.style.SUCCESS('No alerts triggered')
            )