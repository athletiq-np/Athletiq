"""
Management command to generate performance reports and system health checks.
"""
import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.performance.monitors import performance_monitor
from core.performance.optimizers import PerformanceOptimizer
from core.cache.managers import cache_manager


class Command(BaseCommand):
    help = 'Generate performance reports and system health checks'

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            choices=['json', 'text'],
            default='text',
            help='Output format (default: text)'
        )
        parser.add_argument(
            '--health-only',
            action='store_true',
            help='Show only health status'
        )
        parser.add_argument(
            '--metrics-only',
            action='store_true',
            help='Show only performance metrics'
        )
        parser.add_argument(
            '--cache-stats',
            action='store_true',
            help='Include detailed cache statistics'
        )

    def handle(self, *args, **options):
        output_format = options['format']
        health_only = options['health_only']
        metrics_only = options['metrics_only']
        cache_stats = options['cache_stats']

        self.stdout.write(
            self.style.SUCCESS('Generating performance report...')
        )

        if health_only:
            health = performance_monitor.get_health_status()
            if output_format == 'json':
                self.stdout.write(json.dumps(health, indent=2))
            else:
                self._output_health_text(health)
        elif metrics_only:
            metrics = performance_monitor.get_comprehensive_metrics()
            if output_format == 'json':
                self.stdout.write(json.dumps(metrics, indent=2))
            else:
                self._output_metrics_text(metrics)
        else:
            # Full report
            health = performance_monitor.get_health_status()
            metrics = performance_monitor.get_comprehensive_metrics()
            
            if cache_stats:
                cache_stats_data = cache_manager.get_stats()
                cache_info = cache_manager.get_cache_info()
            else:
                cache_stats_data = None
                cache_info = None
            
            if output_format == 'json':
                data = {
                    'health': health,
                    'metrics': metrics,
                    'timestamp': timezone.now().isoformat()
                }
                if cache_stats_data:
                    data['cache_stats'] = cache_stats_data
                    data['cache_info'] = cache_info
                
                self.stdout.write(json.dumps(data, indent=2))
            else:
                self._output_full_report_text(health, metrics, cache_stats_data, cache_info)

    def _output_health_text(self, health):
        """Output health status in text format."""
        self.stdout.write(self.style.HTTP_INFO('=' * 60))
        self.stdout.write(self.style.HTTP_INFO('SYSTEM HEALTH STATUS'))
        self.stdout.write(self.style.HTTP_INFO('=' * 60))
        
        # Overall status
        status_color = self._get_status_color(health['overall_status'])
        self.stdout.write(f"\nOverall Status: {status_color(health['overall_status'].upper())}")
        
        # Component status
        self.stdout.write(self.style.WARNING('\nComponent Status:'))
        for component, status in health['components'].items():
            status_color = self._get_status_color(status)
            self.stdout.write(f"  {component}: {status_color(status.upper())}")
        
        # Alerts
        if health['alerts']:
            self.stdout.write(self.style.ERROR('\nAlerts:'))
            for alert in health['alerts']:
                self.stdout.write(f"  ⚠ {alert}")
        else:
            self.stdout.write(self.style.SUCCESS('\nNo alerts'))
        
        self.stdout.write(self.style.HTTP_INFO('\n' + '=' * 60))

    def _output_metrics_text(self, metrics):
        """Output metrics in text format."""
        self.stdout.write(self.style.HTTP_INFO('=' * 60))
        self.stdout.write(self.style.HTTP_INFO('PERFORMANCE METRICS'))
        self.stdout.write(self.style.HTTP_INFO('=' * 60))
        
        # System metrics
        system = metrics.get('system', {})
        if 'cpu' in system:
            self.stdout.write(self.style.WARNING('\nSystem Metrics:'))
            self.stdout.write(f"  CPU Usage: {system['cpu'].get('percent', 0):.1f}%")
            self.stdout.write(f"  CPU Cores: {system['cpu'].get('count', 0)}")
            
            if 'memory' in system:
                memory = system['memory']
                self.stdout.write(f"  Memory Usage: {memory.get('percent', 0):.1f}%")
                self.stdout.write(f"  Memory Used: {self._format_bytes(memory.get('used', 0))}")
                self.stdout.write(f"  Memory Available: {self._format_bytes(memory.get('available', 0))}")
        
        # Database metrics
        database = metrics.get('database', {})
        if 'connections' in database:
            self.stdout.write(self.style.WARNING('\nDatabase Metrics:'))
            conn = database['connections']
            self.stdout.write(f"  Active Connections: {conn.get('active', 0)}")
            self.stdout.write(f"  Total Connections: {conn.get('total', 0)}")
            
            if 'performance' in database:
                perf = database['performance']
                if 'database_size' in perf:
                    self.stdout.write(f"  Database Size: {self._format_bytes(perf['database_size'])}")
                if 'cache_hit_ratio' in perf:
                    self.stdout.write(f"  Cache Hit Ratio: {perf['cache_hit_ratio']:.1f}%")
        
        # Cache metrics
        cache = metrics.get('cache', {})
        if 'stats' in cache:
            self.stdout.write(self.style.WARNING('\nCache Metrics:'))
            stats = cache['stats']
            self.stdout.write(f"  Status: {cache.get('status', 'unknown')}")
            if 'hit_rate' in stats:
                self.stdout.write(f"  Hit Rate: {stats['hit_rate']:.1f}%")
            if 'memory_used_human' in stats:
                self.stdout.write(f"  Memory Used: {stats['memory_used_human']}")
            if 'connected_clients' in stats:
                self.stdout.write(f"  Connected Clients: {stats['connected_clients']}")
        
        self.stdout.write(self.style.HTTP_INFO('\n' + '=' * 60))

    def _output_full_report_text(self, health, metrics, cache_stats, cache_info):
        """Output full report in text format."""
        self.stdout.write(self.style.HTTP_INFO('=' * 80))
        self.stdout.write(self.style.HTTP_INFO('ATHLETIQ PERFORMANCE REPORT'))
        self.stdout.write(self.style.HTTP_INFO('=' * 80))
        
        # Health status section
        self.stdout.write(self.style.HTTP_SUCCESS('\n📊 HEALTH STATUS'))
        self.stdout.write('-' * 40)
        
        status_color = self._get_status_color(health['overall_status'])
        self.stdout.write(f"Overall Status: {status_color(health['overall_status'].upper())}")
        
        for component, status in health['components'].items():
            status_color = self._get_status_color(status)
            self.stdout.write(f"  {component.title()}: {status_color(status.upper())}")
        
        if health['alerts']:
            self.stdout.write(self.style.ERROR('\nActive Alerts:'))
            for alert in health['alerts']:
                self.stdout.write(f"  ⚠ {alert}")
        
        # System metrics section
        system = metrics.get('system', {})
        if system and 'cpu' in system:
            self.stdout.write(self.style.HTTP_SUCCESS('\n🖥️ SYSTEM METRICS'))
            self.stdout.write('-' * 40)
            
            cpu = system['cpu']
            memory = system.get('memory', {})
            disk = system.get('disk', {})
            
            self.stdout.write(f"CPU Usage: {cpu.get('percent', 0):.1f}% ({cpu.get('count', 0)} cores)")
            self.stdout.write(f"Memory: {memory.get('percent', 0):.1f}% used ({self._format_bytes(memory.get('used', 0))} / {self._format_bytes(memory.get('total', 0))})")
            self.stdout.write(f"Disk: {disk.get('percent', 0):.1f}% used ({self._format_bytes(disk.get('used', 0))} / {self._format_bytes(disk.get('total', 0))})")
        
        # Database metrics section
        database = metrics.get('database', {})
        if database and 'connections' in database:
            self.stdout.write(self.style.HTTP_SUCCESS('\n🗄️ DATABASE METRICS'))
            self.stdout.write('-' * 40)
            
            conn = database['connections']
            self.stdout.write(f"Connections: {conn.get('active', 0)} active / {conn.get('total', 0)} total")
            
            if 'performance' in database:
                perf = database['performance']
                if 'database_size' in perf:
                    self.stdout.write(f"Database Size: {self._format_bytes(perf['database_size'])}")
                if 'cache_hit_ratio' in perf:
                    hit_ratio = perf['cache_hit_ratio']
                    color = self.style.SUCCESS if hit_ratio > 90 else self.style.WARNING
                    self.stdout.write(f"Cache Hit Ratio: {color(f'{hit_ratio:.1f}%')}")
        
        # Cache metrics section
        cache = metrics.get('cache', {})
        if cache:
            self.stdout.write(self.style.HTTP_SUCCESS('\n🚀 CACHE METRICS'))
            self.stdout.write('-' * 40)
            
            status = cache.get('status', 'unknown')
            status_color = self.style.SUCCESS if status == 'connected' else self.style.ERROR
            self.stdout.write(f"Status: {status_color(status.upper())}")
            
            if 'stats' in cache:
                stats = cache['stats']
                if 'hit_rate' in stats:
                    hit_rate = stats['hit_rate']
                    color = self.style.SUCCESS if hit_rate > 80 else self.style.WARNING
                    self.stdout.write(f"Hit Rate: {color(f'{hit_rate:.1f}%')}")
                
                if 'memory_used_human' in stats:
                    self.stdout.write(f"Memory Used: {stats['memory_used_human']}")
                
                if 'connected_clients' in stats:
                    self.stdout.write(f"Connected Clients: {stats['connected_clients']}")
        
        # Cache manager stats
        if cache_stats:
            self.stdout.write(self.style.HTTP_SUCCESS('\n📈 CACHE MANAGER STATS'))
            self.stdout.write('-' * 40)
            
            self.stdout.write(f"Hit Rate: {cache_stats['hit_rate']:.1f}%")
            self.stdout.write(f"Total Operations: {cache_stats['total_operations']}")
            self.stdout.write(f"Error Rate: {cache_stats['error_rate']:.1f}%")
            
            stats = cache_stats['stats']
            self.stdout.write(f"Hits: {stats['hits']}, Misses: {stats['misses']}")
            self.stdout.write(f"Sets: {stats['sets']}, Deletes: {stats['deletes']}")
        
        # Application metrics section
        app = metrics.get('application', {})
        if app:
            self.stdout.write(self.style.HTTP_SUCCESS('\n🐍 APPLICATION METRICS'))
            self.stdout.write('-' * 40)
            
            django_info = app.get('django', {})
            self.stdout.write(f"Environment: {django_info.get('environment', 'unknown')}")
            self.stdout.write(f"Debug Mode: {django_info.get('debug', False)}")
            
            requests = app.get('requests', {})
            if requests:
                self.stdout.write(f"Total Requests: {requests.get('total_requests', 0)}")
                self.stdout.write(f"Average Duration: {requests.get('avg_duration', 0):.3f}s")
                self.stdout.write(f"Slow Requests: {requests.get('slow_requests', 0)}")
        
        self.stdout.write(self.style.HTTP_INFO('\n' + '=' * 80))

    def _get_status_color(self, status):
        """Get color function for status."""
        colors = {
            'healthy': self.style.SUCCESS,
            'warning': self.style.WARNING,
            'critical': self.style.ERROR,
            'degraded': self.style.WARNING,
            'unknown': self.style.WARNING
        }
        return colors.get(status.lower(), self.style.SUCCESS)

    def _format_bytes(self, bytes_value):
        """Format bytes in human readable format."""
        if bytes_value == 0:
            return "0 B"
        
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.1f} {unit}"
            bytes_value /= 1024.0
        
        return f"{bytes_value:.1f} PB"