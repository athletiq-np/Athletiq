from django.core.management.base import BaseCommand
from apps.monitoring.services.health_check import HealthCheckService


class Command(BaseCommand):
    help = 'Run health checks on all services'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--service',
            type=str,
            help='Run health check for specific service only'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output'
        )
    
    def handle(self, *args, **options):
        health_service = HealthCheckService()
        
        service_name = options.get('service')
        verbose = options.get('verbose', False)
        
        if service_name:
            self.stdout.write(f'Running health check for {service_name}...')
            try:
                result = health_service.run_single_check(service_name)
                self._display_result(service_name, result, verbose)
            except ValueError as e:
                self.stdout.write(self.style.ERROR(str(e)))
        else:
            self.stdout.write('Running all health checks...')
            results = health_service.run_all_checks()
            
            self.stdout.write(f'Overall Status: {results["overall_status"].upper()}')
            self.stdout.write('')
            
            for service, result in results['checks'].items():
                self._display_result(service, result, verbose)
    
    def _display_result(self, service_name, result, verbose=False):
        """Display health check result."""
        status = result['status']
        response_time = result.get('response_time', 0)
        
        if status == 'healthy':
            style = self.style.SUCCESS
        elif status == 'degraded':
            style = self.style.WARNING
        else:
            style = self.style.ERROR
        
        self.stdout.write(
            style(f'{service_name}: {status.upper()} ({response_time:.2f}ms)')
        )
        
        if verbose:
            if 'error' in result:
                self.stdout.write(f'  Error: {result["error"]}')
            if 'details' in result:
                for key, value in result['details'].items():
                    self.stdout.write(f'  {key}: {value}')
            self.stdout.write('')