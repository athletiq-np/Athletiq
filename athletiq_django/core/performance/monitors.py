"""
Performance monitoring utilities for Athletiq Django application.
"""
import time
import psutil
from typing import Dict, List, Any, Optional
from django.core.cache import cache
from django.conf import settings
from django.db import connection
import logging

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """
    System performance monitoring and metrics collection.
    """
    
    def __init__(self):
        self.metrics_cache_key = "performance_metrics"
        self.metrics_ttl = 60  # 1 minute
    
    def collect_system_metrics(self) -> Dict[str, Any]:
        """
        Collect system-level performance metrics.
        
        Returns:
            Dict with system metrics
        """
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            
            # Network metrics (if available)
            try:
                network = psutil.net_io_counters()
                network_metrics = {
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'packets_sent': network.packets_sent,
                    'packets_recv': network.packets_recv
                }
            except Exception:
                network_metrics = {}
            
            metrics = {
                'timestamp': time.time(),
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count,
                    'load_average': psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
                },
                'memory': {
                    'total': memory.total,
                    'available': memory.available,
                    'percent': memory.percent,
                    'used': memory.used,
                    'free': memory.free
                },
                'disk': {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': disk.percent
                },
                'network': network_metrics
            }
            
            return metrics
        
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return {'error': str(e), 'timestamp': time.time()}
    
    def collect_database_metrics(self) -> Dict[str, Any]:
        """
        Collect database performance metrics.
        
        Returns:
            Dict with database metrics
        """
        metrics = {
            'timestamp': time.time(),
            'connections': {},
            'queries': {},
            'performance': {}
        }
        
        try:
            # Connection metrics
            with connection.cursor() as cursor:
                # Active connections
                cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
                active_connections = cursor.fetchone()[0]
                
                cursor.execute("SELECT count(*) FROM pg_stat_activity")
                total_connections = cursor.fetchone()[0]
                
                metrics['connections'] = {
                    'active': active_connections,
                    'total': total_connections
                }
                
                # Query statistics
                try:
                    cursor.execute("""
                        SELECT 
                            sum(calls) as total_calls,
                            sum(total_time) as total_time,
                            avg(mean_time) as avg_time
                        FROM pg_stat_statements
                    """)
                    result = cursor.fetchone()
                    if result:
                        metrics['queries'] = {
                            'total_calls': result[0] or 0,
                            'total_time': result[1] or 0,
                            'average_time': result[2] or 0
                        }
                except Exception:
                    # pg_stat_statements not available
                    pass
                
                # Database size
                cursor.execute("SELECT pg_database_size(current_database())")
                db_size = cursor.fetchone()[0]
                metrics['performance']['database_size'] = db_size
                
                # Cache hit ratio
                cursor.execute("""
                    SELECT 
                        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as hit_ratio
                    FROM pg_statio_user_tables
                """)
                result = cursor.fetchone()
                if result and result[0]:
                    metrics['performance']['cache_hit_ratio'] = float(result[0])
        
        except Exception as e:
            logger.error(f"Error collecting database metrics: {e}")
            metrics['error'] = str(e)
        
        return metrics
    
    def collect_cache_metrics(self) -> Dict[str, Any]:
        """
        Collect cache performance metrics.
        
        Returns:
            Dict with cache metrics
        """
        metrics = {
            'timestamp': time.time(),
            'status': 'unknown',
            'stats': {}
        }
        
        try:
            # Test cache connectivity
            test_key = "monitor_test"
            cache.set(test_key, "test", 10)
            test_result = cache.get(test_key)
            cache.delete(test_key)
            
            if test_result == "test":
                metrics['status'] = 'connected'
            else:
                metrics['status'] = 'error'
            
            # Get Redis-specific metrics
            try:
                from django_redis import get_redis_connection
                redis_conn = get_redis_connection("default")
                
                info = redis_conn.info()
                metrics['stats'] = {
                    'version': info.get('redis_version'),
                    'memory_used': info.get('used_memory'),
                    'memory_used_human': info.get('used_memory_human'),
                    'connected_clients': info.get('connected_clients'),
                    'total_commands_processed': info.get('total_commands_processed'),
                    'keyspace_hits': info.get('keyspace_hits', 0),
                    'keyspace_misses': info.get('keyspace_misses', 0),
                    'expired_keys': info.get('expired_keys', 0),
                    'evicted_keys': info.get('evicted_keys', 0)
                }
                
                # Calculate hit rate
                hits = metrics['stats']['keyspace_hits']
                misses = metrics['stats']['keyspace_misses']
                if hits + misses > 0:
                    metrics['stats']['hit_rate'] = (hits / (hits + misses)) * 100
                else:
                    metrics['stats']['hit_rate'] = 0
            
            except ImportError:
                metrics['backend'] = 'non-redis'
            except Exception as e:
                metrics['redis_error'] = str(e)
        
        except Exception as e:
            logger.error(f"Error collecting cache metrics: {e}")
            metrics['status'] = 'error'
            metrics['error'] = str(e)
        
        return metrics
    
    def collect_application_metrics(self) -> Dict[str, Any]:
        """
        Collect application-level performance metrics.
        
        Returns:
            Dict with application metrics
        """
        metrics = {
            'timestamp': time.time(),
            'django': {
                'version': getattr(settings, 'DJANGO_VERSION', 'unknown'),
                'debug': getattr(settings, 'DEBUG', False),
                'environment': getattr(settings, 'ENVIRONMENT', 'unknown')
            },
            'requests': {},
            'errors': {}
        }
        
        try:
            # Get request metrics from cache
            request_metrics = cache.get('request_metrics', {})
            metrics['requests'] = request_metrics
            
            # Get error metrics from cache
            error_metrics = cache.get('error_metrics', {})
            metrics['errors'] = error_metrics
        
        except Exception as e:
            logger.error(f"Error collecting application metrics: {e}")
            metrics['error'] = str(e)
        
        return metrics
    
    def get_comprehensive_metrics(self) -> Dict[str, Any]:
        """
        Collect all performance metrics.
        
        Returns:
            Dict with comprehensive metrics
        """
        # Check cache first
        cached_metrics = cache.get(self.metrics_cache_key)
        if cached_metrics:
            return cached_metrics
        
        metrics = {
            'collection_time': time.time(),
            'system': self.collect_system_metrics(),
            'database': self.collect_database_metrics(),
            'cache': self.collect_cache_metrics(),
            'application': self.collect_application_metrics()
        }
        
        # Cache metrics
        cache.set(self.metrics_cache_key, metrics, self.metrics_ttl)
        
        return metrics
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        Get overall system health status.
        
        Returns:
            Dict with health status
        """
        metrics = self.get_comprehensive_metrics()
        
        health = {
            'timestamp': time.time(),
            'overall_status': 'healthy',
            'components': {},
            'alerts': []
        }
        
        # Check system health
        system_metrics = metrics.get('system', {})
        if 'cpu' in system_metrics:
            cpu_percent = system_metrics['cpu'].get('percent', 0)
            if cpu_percent > 90:
                health['components']['cpu'] = 'critical'
                health['alerts'].append(f"High CPU usage: {cpu_percent}%")
            elif cpu_percent > 70:
                health['components']['cpu'] = 'warning'
                health['alerts'].append(f"Elevated CPU usage: {cpu_percent}%")
            else:
                health['components']['cpu'] = 'healthy'
        
        if 'memory' in system_metrics:
            memory_percent = system_metrics['memory'].get('percent', 0)
            if memory_percent > 90:
                health['components']['memory'] = 'critical'
                health['alerts'].append(f"High memory usage: {memory_percent}%")
            elif memory_percent > 80:
                health['components']['memory'] = 'warning'
                health['alerts'].append(f"Elevated memory usage: {memory_percent}%")
            else:
                health['components']['memory'] = 'healthy'
        
        # Check database health
        db_metrics = metrics.get('database', {})
        if 'error' in db_metrics:
            health['components']['database'] = 'critical'
            health['alerts'].append("Database connection error")
        else:
            health['components']['database'] = 'healthy'
        
        # Check cache health
        cache_metrics = metrics.get('cache', {})
        cache_status = cache_metrics.get('status', 'unknown')
        if cache_status == 'error':
            health['components']['cache'] = 'critical'
            health['alerts'].append("Cache connection error")
        elif cache_status == 'connected':
            health['components']['cache'] = 'healthy'
        else:
            health['components']['cache'] = 'unknown'
        
        # Determine overall status
        component_statuses = list(health['components'].values())
        if 'critical' in component_statuses:
            health['overall_status'] = 'critical'
        elif 'warning' in component_statuses:
            health['overall_status'] = 'warning'
        elif 'unknown' in component_statuses:
            health['overall_status'] = 'degraded'
        
        return health
    
    def track_request_metrics(self, request, response, duration):
        """
        Track request-level metrics.
        
        Args:
            request: Django request object
            response: Django response object
            duration: Request duration in seconds
        """
        try:
            # Get current metrics
            metrics = cache.get('request_metrics', {
                'total_requests': 0,
                'total_duration': 0,
                'status_codes': {},
                'slow_requests': 0,
                'avg_duration': 0
            })
            
            # Update metrics
            metrics['total_requests'] += 1
            metrics['total_duration'] += duration
            
            # Track status codes
            status_code = str(response.status_code)
            metrics['status_codes'][status_code] = metrics['status_codes'].get(status_code, 0) + 1
            
            # Track slow requests (> 1 second)
            if duration > 1.0:
                metrics['slow_requests'] += 1
            
            # Calculate average duration
            metrics['avg_duration'] = metrics['total_duration'] / metrics['total_requests']
            
            # Cache updated metrics
            cache.set('request_metrics', metrics, 3600)  # 1 hour TTL
        
        except Exception as e:
            logger.error(f"Error tracking request metrics: {e}")
    
    def reset_metrics(self):
        """Reset all cached metrics."""
        cache.delete(self.metrics_cache_key)
        cache.delete('request_metrics')
        cache.delete('error_metrics')
        logger.info("Performance metrics reset")


# Global performance monitor instance
performance_monitor = PerformanceMonitor()