"""
Database and query optimization utilities for Athletiq Django application.
"""
import time
from typing import Dict, List, Any, Optional
from django.db import models, connection
from django.db.models import Prefetch
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class QueryOptimizer:
    """
    Utility class for optimizing Django ORM queries.
    """
    
    @staticmethod
    def optimize_queryset(queryset, select_related: List[str] = None,
                         prefetch_related: List[str] = None,
                         only_fields: List[str] = None,
                         defer_fields: List[str] = None) -> models.QuerySet:
        """
        Apply common optimizations to a queryset.
        
        Args:
            queryset: Django QuerySet to optimize
            select_related: Fields to select_related
            prefetch_related: Fields to prefetch_related
            only_fields: Fields to include (only)
            defer_fields: Fields to defer
        
        Returns:
            Optimized QuerySet
        """
        optimized_qs = queryset
        
        # Apply select_related for foreign keys
        if select_related:
            optimized_qs = optimized_qs.select_related(*select_related)
        
        # Apply prefetch_related for reverse foreign keys and many-to-many
        if prefetch_related:
            optimized_qs = optimized_qs.prefetch_related(*prefetch_related)
        
        # Apply field selection optimizations
        if only_fields:
            optimized_qs = optimized_qs.only(*only_fields)
        elif defer_fields:
            optimized_qs = optimized_qs.defer(*defer_fields)
        
        return optimized_qs
    
    @staticmethod
    def get_related_fields(model_class) -> Dict[str, List[str]]:
        """
        Analyze model to suggest related field optimizations.
        
        Args:
            model_class: Django model class
        
        Returns:
            Dict with suggested select_related and prefetch_related fields
        """
        select_related_fields = []
        prefetch_related_fields = []
        
        for field in model_class._meta.get_fields():
            if isinstance(field, models.ForeignKey):
                select_related_fields.append(field.name)
            elif isinstance(field, (models.ManyToManyField, models.OneToOneField)):
                prefetch_related_fields.append(field.name)
            elif hasattr(field, 'related_model') and field.one_to_many:
                # Reverse foreign key
                prefetch_related_fields.append(field.get_accessor_name())
        
        return {
            'select_related': select_related_fields,
            'prefetch_related': prefetch_related_fields
        }
    
    @staticmethod
    def create_optimized_prefetch(related_name: str, queryset: models.QuerySet = None,
                                 to_attr: str = None) -> Prefetch:
        """
        Create an optimized Prefetch object.
        
        Args:
            related_name: Name of the related field
            queryset: Optional optimized queryset for the prefetch
            to_attr: Optional attribute name to store the prefetched objects
        
        Returns:
            Prefetch object
        """
        return Prefetch(
            related_name,
            queryset=queryset,
            to_attr=to_attr
        )
    
    @staticmethod
    def analyze_query_performance(queryset, execute: bool = False) -> Dict[str, Any]:
        """
        Analyze query performance and provide optimization suggestions.
        
        Args:
            queryset: Django QuerySet to analyze
            execute: Whether to execute the query for timing analysis
        
        Returns:
            Dict with analysis results and suggestions
        """
        analysis = {
            'sql': str(queryset.query),
            'model': queryset.model.__name__,
            'optimizations': [],
            'warnings': []
        }
        
        # Check for missing select_related
        sql_lower = analysis['sql'].lower()
        if 'join' in sql_lower and not hasattr(queryset, '_prefetch_related_lookups'):
            analysis['warnings'].append("Query contains JOINs but no select_related detected")
            analysis['optimizations'].append("Consider using select_related() for foreign key fields")
        
        # Check for N+1 query potential
        if queryset.model._meta.get_fields():
            foreign_keys = [f.name for f in queryset.model._meta.get_fields() 
                          if isinstance(f, models.ForeignKey)]
            if foreign_keys:
                analysis['optimizations'].append(f"Consider select_related({', '.join(foreign_keys)})")
        
        # Execute query for timing if requested
        if execute:
            start_time = time.time()
            list(queryset)  # Force evaluation
            execution_time = time.time() - start_time
            analysis['execution_time'] = execution_time
            
            if execution_time > 1.0:
                analysis['warnings'].append(f"Slow query detected: {execution_time:.2f}s")
        
        return analysis


class DatabaseOptimizer:
    """
    Database-level optimization utilities.
    """
    
    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """
        Get database performance statistics.
        
        Returns:
            Dict with database statistics
        """
        stats = {}
        
        with connection.cursor() as cursor:
            # Get database size (PostgreSQL specific)
            try:
                cursor.execute("""
                    SELECT pg_size_pretty(pg_database_size(current_database())) as size
                """)
                result = cursor.fetchone()
                if result:
                    stats['database_size'] = result[0]
            except Exception:
                pass
            
            # Get table sizes
            try:
                cursor.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                    ORDER BY size_bytes DESC
                    LIMIT 10
                """)
                stats['largest_tables'] = [
                    {
                        'schema': row[0],
                        'table': row[1], 
                        'size': row[2],
                        'size_bytes': row[3]
                    }
                    for row in cursor.fetchall()
                ]
            except Exception:
                pass
            
            # Get connection info
            try:
                cursor.execute("SELECT count(*) FROM pg_stat_activity")
                result = cursor.fetchone()
                if result:
                    stats['active_connections'] = result[0]
            except Exception:
                pass
        
        return stats
    
    @staticmethod
    def analyze_slow_queries(limit: int = 10) -> List[Dict[str, Any]]:
        """
        Analyze slow queries from database logs.
        
        Args:
            limit: Maximum number of queries to return
        
        Returns:
            List of slow query information
        """
        slow_queries = []
        
        try:
            with connection.cursor() as cursor:
                # PostgreSQL pg_stat_statements extension
                cursor.execute("""
                    SELECT 
                        query,
                        calls,
                        total_time,
                        mean_time,
                        rows
                    FROM pg_stat_statements 
                    ORDER BY mean_time DESC 
                    LIMIT %s
                """, [limit])
                
                for row in cursor.fetchall():
                    slow_queries.append({
                        'query': row[0][:200] + '...' if len(row[0]) > 200 else row[0],
                        'calls': row[1],
                        'total_time': row[2],
                        'mean_time': row[3],
                        'rows': row[4]
                    })
        
        except Exception as e:
            logger.warning(f"Could not analyze slow queries: {e}")
        
        return slow_queries
    
    @staticmethod
    def get_index_usage() -> List[Dict[str, Any]]:
        """
        Get database index usage statistics.
        
        Returns:
            List of index usage information
        """
        index_stats = []
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        indexname,
                        idx_tup_read,
                        idx_tup_fetch
                    FROM pg_stat_user_indexes
                    ORDER BY idx_tup_read DESC
                """)
                
                for row in cursor.fetchall():
                    index_stats.append({
                        'schema': row[0],
                        'table': row[1],
                        'index': row[2],
                        'tuples_read': row[3],
                        'tuples_fetched': row[4]
                    })
        
        except Exception as e:
            logger.warning(f"Could not get index usage: {e}")
        
        return index_stats
    
    @staticmethod
    def suggest_indexes(model_class) -> List[str]:
        """
        Suggest database indexes for a model.
        
        Args:
            model_class: Django model class
        
        Returns:
            List of suggested index creation SQL
        """
        suggestions = []
        table_name = model_class._meta.db_table
        
        # Suggest indexes for foreign keys
        for field in model_class._meta.get_fields():
            if isinstance(field, models.ForeignKey):
                column_name = field.column
                index_name = f"idx_{table_name}_{column_name}"
                suggestions.append(
                    f"CREATE INDEX {index_name} ON {table_name} ({column_name});"
                )
        
        # Suggest composite indexes for common query patterns
        # This would need to be customized based on actual query patterns
        
        return suggestions
    
    @staticmethod
    def optimize_database_settings() -> Dict[str, str]:
        """
        Suggest database configuration optimizations.
        
        Returns:
            Dict of suggested database settings
        """
        suggestions = {
            'shared_buffers': '256MB',  # 25% of RAM for dedicated DB server
            'effective_cache_size': '1GB',  # 75% of RAM
            'work_mem': '4MB',  # Per connection
            'maintenance_work_mem': '64MB',
            'checkpoint_completion_target': '0.9',
            'wal_buffers': '16MB',
            'default_statistics_target': '100',
            'random_page_cost': '1.1',  # For SSD storage
            'effective_io_concurrency': '200',  # For SSD storage
        }
        
        return suggestions


class PerformanceOptimizer:
    """
    General performance optimization utilities.
    """
    
    def __init__(self):
        self.query_optimizer = QueryOptimizer()
        self.db_optimizer = DatabaseOptimizer()
    
    def optimize_model_queries(self, model_class) -> Dict[str, Any]:
        """
        Provide comprehensive optimization suggestions for a model.
        
        Args:
            model_class: Django model class
        
        Returns:
            Dict with optimization suggestions
        """
        suggestions = {
            'model': model_class.__name__,
            'related_fields': self.query_optimizer.get_related_fields(model_class),
            'suggested_indexes': self.db_optimizer.suggest_indexes(model_class),
            'optimizations': []
        }
        
        # Check for common optimization opportunities
        if hasattr(model_class, 'created_at'):
            suggestions['optimizations'].append(
                "Consider adding database index on 'created_at' for time-based queries"
            )
        
        if hasattr(model_class, 'is_active'):
            suggestions['optimizations'].append(
                "Consider adding database index on 'is_active' for filtering active records"
            )
        
        # Check for text fields that might benefit from full-text search
        text_fields = [f.name for f in model_class._meta.get_fields() 
                      if isinstance(f, (models.TextField, models.CharField)) and f.max_length > 100]
        
        if text_fields:
            suggestions['optimizations'].append(
                f"Consider full-text search indexes for text fields: {', '.join(text_fields)}"
            )
        
        return suggestions
    
    def create_performance_report(self) -> Dict[str, Any]:
        """
        Create a comprehensive performance report.
        
        Returns:
            Dict with performance analysis and recommendations
        """
        report = {
            'timestamp': time.time(),
            'database_stats': self.db_optimizer.get_database_stats(),
            'slow_queries': self.db_optimizer.analyze_slow_queries(),
            'index_usage': self.db_optimizer.get_index_usage(),
            'recommendations': []
        }
        
        # Add general recommendations
        report['recommendations'].extend([
            "Enable query logging to identify slow queries",
            "Monitor database connection pool usage",
            "Consider implementing query result caching",
            "Use select_related() and prefetch_related() for related data",
            "Implement database query optimization middleware"
        ])
        
        return report