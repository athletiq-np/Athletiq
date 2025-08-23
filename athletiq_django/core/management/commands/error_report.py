"""
Management command to generate error reports and monitor system health.
"""
import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.monitoring.error_tracker import error_tracker


class Command(BaseCommand):
    help = 'Generate error reports and monitor system health'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Number of hours to analyze (default: 24)'
        )
        parser.add_argument(
            '--format',
            choices=['json', 'text'],
            default='text',
            help='Output format (default: text)'
        )
        parser.add_argument(
            '--metrics-only',
            action='store_true',
            help='Show only metrics without detailed errors'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        output_format = options['format']
        metrics_only = options['metrics_only']

        self.stdout.write(
            self.style.SUCCESS(f'Generating error report for last {hours} hours...')
        )

        # Get error summary
        summary = error_tracker.get_error_summary(hours)
        metrics = error_tracker.get_error_metrics()

        if output_format == 'json':
            self._output_json(summary, metrics, metrics_only)
        else:
            self._output_text(summary, metrics, metrics_only)

    def _output_json(self, summary, metrics, metrics_only):
        """Output report in JSON format."""
        data = {
            'summary': summary,
            'metrics': metrics,
            'timestamp': timezone.now().isoformat()
        }
        
        if metrics_only:
            data = {'metrics': metrics, 'timestamp': data['timestamp']}
        
        self.stdout.write(json.dumps(data, indent=2))

    def _output_text(self, summary, metrics, metrics_only):
        """Output report in human-readable text format."""
        self.stdout.write(self.style.HTTP_INFO('=' * 60))
        self.stdout.write(self.style.HTTP_INFO('ATHLETIQ ERROR REPORT'))
        self.stdout.write(self.style.HTTP_INFO('=' * 60))
        
        # Summary
        self.stdout.write(f"\nTotal Errors: {summary['total_errors']}")
        
        # Errors by type
        self.stdout.write(self.style.WARNING('\nErrors by Type:'))
        for error_type, count in summary['by_type'].items():
            if count > 0:
                self.stdout.write(f"  {error_type}: {count}")
        
        # Errors by severity
        self.stdout.write(self.style.WARNING('\nErrors by Severity:'))
        for severity, count in summary['by_severity'].items():
            if count > 0:
                color = self._get_severity_color(severity)
                self.stdout.write(f"  {severity}: {color(str(count))}")
        
        # Error rates
        self.stdout.write(self.style.WARNING('\nError Rates:'))
        self.stdout.write(f"  Last 1 hour: {metrics['error_rate_1h']} errors/hour")
        self.stdout.write(f"  Last 24 hours: {metrics['error_rate_24h']} errors/hour")
        
        # Top errors
        if metrics['top_errors']:
            self.stdout.write(self.style.WARNING('\nTop Errors:'))
            for i, error in enumerate(metrics['top_errors'][:5], 1):
                self.stdout.write(f"  {i}. {error['type']}: {error['count']} occurrences")
        
        # Alert status
        self.stdout.write(self.style.WARNING('\nAlert Status:'))
        for alert_type, status in metrics['alert_status'].items():
            status_color = self.style.ERROR if status['status'] == 'alert' else self.style.SUCCESS
            self.stdout.write(
                f"  {alert_type}: {status_color(status['status'].upper())} "
                f"({status['current']}/{status['threshold']})"
            )
        
        # Trends
        if summary['trends']:
            self.stdout.write(self.style.WARNING('\nTrends (Current vs Previous Hour):'))
            for error_type, trend in summary['trends'].items():
                trend_indicator = self._get_trend_indicator(trend['trend_percentage'])
                self.stdout.write(
                    f"  {error_type}: {trend['current_hour']} "
                    f"({trend_indicator}{trend['trend_percentage']:+.1f}%)"
                )
        
        # Recent errors (if not metrics only)
        if not metrics_only and summary['recent_errors']:
            self.stdout.write(self.style.WARNING('\nRecent Errors (Last 10):'))
            for error in summary['recent_errors'][-10:]:
                timestamp = timezone.datetime.fromtimestamp(error['timestamp'])
                self.stdout.write(
                    f"  {timestamp.strftime('%H:%M:%S')} - "
                    f"{error['type']} ({error['severity']})"
                )
        
        self.stdout.write(self.style.HTTP_INFO('\n' + '=' * 60))

    def _get_severity_color(self, severity):
        """Get color function for severity level."""
        colors = {
            'low': self.style.SUCCESS,
            'medium': self.style.WARNING,
            'high': self.style.ERROR,
            'critical': self.style.ERROR
        }
        return colors.get(severity, self.style.SUCCESS)

    def _get_trend_indicator(self, percentage):
        """Get trend indicator symbol."""
        if percentage > 10:
            return '↗ '
        elif percentage < -10:
            return '↘ '
        else:
            return '→ '