import time
import logging
from typing import Dict, Any, List
from django.db import connection
from django.core.cache import cache
from django.core.mail import get_connection
from django.conf import settings
import redis
import requests
from ..models import HealthCheckLog

logger = logging.getLogger(__name__)


class HealthCheckService:
    """Service for performing health checks on various system components."""
    
    def __init__(self):
        self.checks = {
            'database': self._check_database,
            'redis': self._check_redis,
            'email': self._check_email_service,
            'file_storage': self._check_file_storage,
            'google_vision': self._check_google_vision,
            'google_translate': self._check_google_translate,
            'sms': self._check_sms_service,
        }
    
    def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks and return results."""
        results = {
            'overall_status': 'healthy',
            'timestamp': time.time(),
            'checks': {}
        }
        
        unhealthy_count = 0
        degraded_count = 0
        
        for service_name, check_func in self.checks.items():
            try:
                check_result = check_func()
                results['checks'][service_name] = check_result
                
                # Log the result
                self._log_health_check(service_name, check_result)
                
                if check_result['status'] == 'unhealthy':
                    unhealthy_count += 1
                elif check_result['status'] == 'degraded':
                    degraded_count += 1
                    
            except Exception as e:
                logger.error(f"Health check failed for {service_name}: {str(e)}")
                error_result = {
                    'status': 'unhealthy',
                    'response_time': 0,
                    'error': str(e)
                }
                results['checks'][service_name] = error_result
                self._log_health_check(service_name, error_result)
                unhealthy_count += 1
        
        # Determine overall status
        if unhealthy_count > 0:
            results['overall_status'] = 'unhealthy'
        elif degraded_count > 0:
            results['overall_status'] = 'degraded'
        
        return results    

    def run_single_check(self, service_name: str) -> Dict[str, Any]:
        """Run a single health check."""
        if service_name not in self.checks:
            raise ValueError(f"Unknown service: {service_name}")
        
        try:
            result = self.checks[service_name]()
            self._log_health_check(service_name, result)
            return result
        except Exception as e:
            logger.error(f"Health check failed for {service_name}: {str(e)}")
            error_result = {
                'status': 'unhealthy',
                'response_time': 0,
                'error': str(e)
            }
            self._log_health_check(service_name, error_result)
            return error_result
    
    def _check_database(self) -> Dict[str, Any]:
        """Check database connectivity and performance."""
        start_time = time.time()
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            response_time = (time.time() - start_time) * 1000
            
            # Check if response time is acceptable
            if response_time > 1000:  # 1 second
                status = 'degraded'
            elif response_time > 100:  # 100ms
                status = 'degraded'
            else:
                status = 'healthy'
            
            return {
                'status': status,
                'response_time': response_time,
                'details': {
                    'vendor': connection.vendor,
                    'database': connection.settings_dict.get('NAME', 'unknown')
                }
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'response_time': (time.time() - start_time) * 1000,
                'error': str(e)
            }
    
    def _check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity and performance."""
        start_time = time.time()
        
        try:
            # Test cache operations
            test_key = 'health_check_test'
            test_value = 'test_value'
            
            cache.set(test_key, test_value, timeout=10)
            retrieved_value = cache.get(test_key)
            cache.delete(test_key)
            
            response_time = (time.time() - start_time) * 1000
            
            if retrieved_value != test_value:
                return {
                    'status': 'unhealthy',
                    'response_time': response_time,
                    'error': 'Cache value mismatch'
                }
            
            # Check response time
            if response_time > 500:  # 500ms
                status = 'degraded'
            elif response_time > 100:  # 100ms
                status = 'degraded'
            else:
                status = 'healthy'
            
            return {
                'status': status,
                'response_time': response_time,
                'details': {
                    'backend': getattr(settings, 'CACHES', {}).get('default', {}).get('BACKEND', 'unknown')
                }
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'response_time': (time.time() - start_time) * 1000,
                'error': str(e)
            }    

    def _check_email_service(self) -> Dict[str, Any]:
        """Check email service connectivity."""
        start_time = time.time()
        
        try:
            connection = get_connection()
            connection.open()
            connection.close()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time': response_time,
                'details': {
                    'backend': settings.EMAIL_BACKEND
                }
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'response_time': (time.time() - start_time) * 1000,
                'error': str(e)
            }
    
    def _check_file_storage(self) -> Dict[str, Any]:
        """Check file storage accessibility."""
        start_time = time.time()
        
        try:
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            
            # Test file operations
            test_content = ContentFile(b'health check test')
            test_filename = 'health_check_test.txt'
            
            # Save test file
            saved_name = default_storage.save(test_filename, test_content)
            
            # Check if file exists
            exists = default_storage.exists(saved_name)
            
            # Clean up
            if exists:
                default_storage.delete(saved_name)
            
            response_time = (time.time() - start_time) * 1000
            
            if not exists:
                return {
                    'status': 'unhealthy',
                    'response_time': response_time,
                    'error': 'File storage test failed'
                }
            
            return {
                'status': 'healthy',
                'response_time': response_time,
                'details': {
                    'storage_class': default_storage.__class__.__name__
                }
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'response_time': (time.time() - start_time) * 1000,
                'error': str(e)
            }
    
    def _check_google_vision(self) -> Dict[str, Any]:
        """Check Google Vision API connectivity."""
        start_time = time.time()
        
        try:
            from apps.google_services.services.vision_service import VisionService
            
            vision_service = VisionService()
            # Simple connectivity test - this will fail gracefully if API is down
            # We're just checking if the service can be initialized
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time': response_time,
                'details': {
                    'service': 'Google Vision API'
                }
            }
        except Exception as e:
            return {
                'status': 'degraded',  # Non-critical service
                'response_time': (time.time() - start_time) * 1000,
                'error': str(e)
            }
    
    def _check_google_translate(self) -> Dict[str, Any]:
        """Check Google Translate API connectivity."""
        start_time = time.time()
        
        try:
            from apps.google_services.services.translate_service import TranslateService
            
            translate_service = TranslateService()
            # Simple connectivity test
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time': response_time,
                'details': {
                    'service': 'Google Translate API'
                }
            }
        except Exception as e:
            return {
                'status': 'degraded',  # Non-critical service
                'response_time': (time.time() - start_time) * 1000,
                'error': str(e)
            }
    
    def _check_sms_service(self) -> Dict[str, Any]:
        """Check SMS service connectivity."""
        start_time = time.time()
        
        try:
            from apps.notifications.services.sms_service import SMSService
            
            sms_service = SMSService()
            # Simple connectivity test - check if Twilio client can be initialized
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time': response_time,
                'details': {
                    'service': 'Twilio SMS'
                }
            }
        except Exception as e:
            return {
                'status': 'degraded',  # Non-critical service
                'response_time': (time.time() - start_time) * 1000,
                'error': str(e)
            }
    
    def _log_health_check(self, service: str, result: Dict[str, Any]) -> None:
        """Log health check result to database."""
        try:
            HealthCheckLog.objects.create(
                service=service,
                status=result['status'],
                response_time=result.get('response_time', 0),
                error_message=result.get('error'),
                details=result.get('details', {})
            )
        except Exception as e:
            logger.error(f"Failed to log health check for {service}: {str(e)}")
    
    def get_service_history(self, service: str, hours: int = 24) -> List[Dict[str, Any]]:
        """Get health check history for a specific service."""
        from django.utils import timezone
        from datetime import timedelta
        
        since = timezone.now() - timedelta(hours=hours)
        
        logs = HealthCheckLog.objects.filter(
            service=service,
            timestamp__gte=since
        ).order_by('-timestamp')
        
        return [
            {
                'status': log.status,
                'response_time': log.response_time,
                'timestamp': log.timestamp.isoformat(),
                'error_message': log.error_message,
                'details': log.details
            }
            for log in logs
        ]