import time
import psutil
import logging
from typing import Dict, Any, List, Optional
from django.db import connection, models
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from ..models import SystemMetrics, AlertRule, Alert

logger = logging.getLogger(__name__)


class MetricsCollectionService:
    """Service for collecting and storing system metrics."""
    
    def __init__(self):
        self.cache_key_prefix = 'metrics:'
    
    def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect current system metrics."""
        metrics = {}
        
        try:
            # Memory usage
            memory = psutil.virtual_memory()
            metrics['memory_usage'] = {
                'value': memory.percent,
                'unit': 'percent',
                'details': {
                    'total': memory.total,
                    'available': memory.available,
                    'used': memory.used
                }
            }
            
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            metrics['cpu_usage'] = {
                'value': cpu_percent,
                'unit': 'percent'
            }
            
            # Database metrics
            db_metrics = self._collect_database_metrics()
            metrics.update(db_metrics)
            
            # Cache metrics
            cache_metrics = self._collect_cache_metrics()
            metrics.update(cache_metrics)
            
            # Store metrics
            self._store_metrics(metrics)
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {str(e)}")
        
        return metrics
    
    def collect_api_metrics(self, endpoint: str, response_time: float, 
                          status_code: int, user_agent: str = None) -> None:
        """Collect API endpoint metrics."""
        try:
            # Store API response time
            SystemMetrics.objects.create(
                metric_type='api_response_time',
                value=response_time,
                unit='ms',
                endpoint=endpoint,
                user_agent=user_agent
            )
            
            # Update request count
            self._increment_counter(f'request_count:{endpoint}')
            
            # Track error rate
            if status_code >= 400:
                self._increment_counter(f'error_count:{endpoint}')
            
        except Exception as e:
            logger.error(f"Failed to collect API metrics: {str(e)}")
    
    def get_metrics_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get metrics summary for the specified time period."""
        since = timezone.now() - timedelta(hours=hours)
        
        summary = {
            'period': f'{hours} hours',
            'timestamp': timezone.now().isoformat(),
            'metrics': {}
        }
        
        # Get average response times by endpoint
        api_metrics = SystemMetrics.objects.filter(
            metric_type='api_response_time',
            timestamp__gte=since
        ).values('endpoint').annotate(
            avg_response_time=models.Avg('value'),
            max_response_time=models.Max('value'),
            min_response_time=models.Min('value'),
            request_count=models.Count('id')
        )
        
        summary['metrics']['api_performance'] = list(api_metrics)
        
        # Get system resource usage
        system_metrics = SystemMetrics.objects.filter(
            metric_type__in=['memory_usage', 'cpu_usage'],
            timestamp__gte=since
        ).values('metric_type').annotate(
            avg_value=models.Avg('value'),
            max_value=models.Max('value'),
            min_value=models.Min('value')
        )
        
        summary['metrics']['system_resources'] = list(system_metrics)
        
        return summary 
   
    def _collect_database_metrics(self) -> Dict[str, Any]:
        """Collect database performance metrics."""
        metrics = {}
        
        try:
            start_time = time.time()
            
            with connection.cursor() as cursor:
                # Test query performance
                cursor.execute("SELECT COUNT(*) FROM auth_user")
                cursor.fetchone()
                
                # Get database size (PostgreSQL specific)
                if connection.vendor == 'postgresql':
                    cursor.execute("""
                        SELECT pg_size_pretty(pg_database_size(current_database()))
                    """)
                    db_size = cursor.fetchone()[0]
                else:
                    db_size = 'unknown'
            
            query_time = (time.time() - start_time) * 1000
            
            metrics['database_query_time'] = {
                'value': query_time,
                'unit': 'ms',
                'details': {
                    'database_size': db_size,
                    'vendor': connection.vendor
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to collect database metrics: {str(e)}")
        
        return metrics
    
    def _collect_cache_metrics(self) -> Dict[str, Any]:
        """Collect cache performance metrics."""
        metrics = {}
        
        try:
            start_time = time.time()
            
            # Test cache performance
            test_key = 'metrics_test'
            cache.set(test_key, 'test_value', timeout=10)
            cache.get(test_key)
            cache.delete(test_key)
            
            cache_time = (time.time() - start_time) * 1000
            
            metrics['cache_response_time'] = {
                'value': cache_time,
                'unit': 'ms'
            }
            
        except Exception as e:
            logger.error(f"Failed to collect cache metrics: {str(e)}")
        
        return metrics
    
    def _store_metrics(self, metrics: Dict[str, Any]) -> None:
        """Store collected metrics in database."""
        for metric_name, metric_data in metrics.items():
            try:
                SystemMetrics.objects.create(
                    metric_type=metric_name,
                    value=metric_data['value'],
                    unit=metric_data.get('unit', ''),
                )
            except Exception as e:
                logger.error(f"Failed to store metric {metric_name}: {str(e)}")
    
    def _increment_counter(self, key: str) -> None:
        """Increment a counter in cache."""
        try:
            cache_key = f"{self.cache_key_prefix}{key}"
            current_value = cache.get(cache_key, 0)
            cache.set(cache_key, current_value + 1, timeout=3600)  # 1 hour
        except Exception as e:
            logger.error(f"Failed to increment counter {key}: {str(e)}")
    
    def get_counter_value(self, key: str) -> int:
        """Get counter value from cache."""
        try:
            cache_key = f"{self.cache_key_prefix}{key}"
            return cache.get(cache_key, 0)
        except Exception as e:
            logger.error(f"Failed to get counter {key}: {str(e)}")
            return 0
    
    def cleanup_old_metrics(self, days: int = 30) -> int:
        """Clean up old metrics data."""
        cutoff_date = timezone.now() - timedelta(days=days)
        
        deleted_count = SystemMetrics.objects.filter(
            timestamp__lt=cutoff_date
        ).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} old metrics records")
        return deleted_count