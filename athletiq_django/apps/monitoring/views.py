import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.contrib.admin.views.decorators import staff_member_required
from django.utils import timezone
from django.db import models
from django.db.models import Q
from .services.health_check import HealthCheckService
from .services.metrics import MetricsCollectionService
from .services.alerting import AlertingService
from .models import HealthCheckLog, SystemMetrics, Alert

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Basic health check endpoint - returns simple status.
    This endpoint should be accessible without authentication for load balancers.
    """
    try:
        health_service = HealthCheckService()
        
        # Run a quick subset of checks for basic health
        basic_checks = ['database', 'redis']
        results = {}
        overall_healthy = True
        
        for check_name in basic_checks:
            try:
                result = health_service.run_single_check(check_name)
                results[check_name] = result
                if result['status'] == 'unhealthy':
                    overall_healthy = False
            except Exception as e:
                results[check_name] = {
                    'status': 'unhealthy',
                    'error': str(e)
                }
                overall_healthy = False
        
        response_data = {
            'status': 'healthy' if overall_healthy else 'unhealthy',
            'timestamp': timezone.now().isoformat(),
            'checks': results
        }
        
        status_code = 200 if overall_healthy else 503
        return JsonResponse(response_data, status=status_code)
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': 'Health check service unavailable'
        }, status=503)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detailed_health_check(request):
    """
    Detailed health check endpoint - requires authentication.
    Returns comprehensive health information for all services.
    """
    try:
        health_service = HealthCheckService()
        results = health_service.run_all_checks()
        
        return Response(results, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Detailed health check failed: {str(e)}")
        return Response({
            'error': 'Health check service unavailable',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def service_health_history(request, service_name):
    """Get health check history for a specific service."""
    try:
        health_service = HealthCheckService()
        hours = int(request.GET.get('hours', 24))
        
        history = health_service.get_service_history(service_name, hours)
        
        return Response({
            'service': service_name,
            'period_hours': hours,
            'history': history
        }, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response({
            'error': 'Invalid hours parameter'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Failed to get service history: {str(e)}")
        return Response({
            'error': 'Failed to retrieve service history'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@method_decorator(cache_page(60))  # Cache for 1 minute
def system_metrics(request):
    """Get current system metrics."""
    try:
        metrics_service = MetricsCollectionService()
        metrics = metrics_service.collect_system_metrics()
        
        return Response({
            'timestamp': timezone.now().isoformat(),
            'metrics': metrics
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to collect system metrics: {str(e)}")
        return Response({
            'error': 'Failed to collect system metrics'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def metrics_summary(request):
    """Get metrics summary for a specified time period."""
    try:
        hours = int(request.GET.get('hours', 24))
        metrics_service = MetricsCollectionService()
        summary = metrics_service.get_metrics_summary(hours)
        
        return Response(summary, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response({
            'error': 'Invalid hours parameter'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Failed to get metrics summary: {str(e)}")
        return Response({
            'error': 'Failed to retrieve metrics summary'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_alerts(request):
    """Get all active alerts."""
    try:
        alerting_service = AlertingService()
        alerts = alerting_service.get_active_alerts()
        
        return Response({
            'alerts': alerts,
            'count': len(alerts)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to get active alerts: {str(e)}")
        return Response({
            'error': 'Failed to retrieve active alerts'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def acknowledge_alert(request, alert_id):
    """Acknowledge an alert."""
    try:
        alerting_service = AlertingService()
        success = alerting_service.acknowledge_alert(alert_id, request.user)
        
        if success:
            return Response({
                'message': 'Alert acknowledged successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to acknowledge alert'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Failed to acknowledge alert: {str(e)}")
        return Response({
            'error': 'Failed to acknowledge alert'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolve_alert(request, alert_id):
    """Resolve an alert."""
    try:
        alerting_service = AlertingService()
        success = alerting_service.resolve_alert(alert_id, request.user)
        
        if success:
            return Response({
                'message': 'Alert resolved successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to resolve alert'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Failed to resolve alert: {str(e)}")
        return Response({
            'error': 'Failed to resolve alert'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_status(request):
    """Get comprehensive system status dashboard."""
    try:
        health_service = HealthCheckService()
        metrics_service = MetricsCollectionService()
        alerting_service = AlertingService()
        
        # Get health status
        health_results = health_service.run_all_checks()
        
        # Get recent metrics
        recent_metrics = metrics_service.collect_system_metrics()
        
        # Get active alerts
        active_alerts = alerting_service.get_active_alerts()
        
        # Calculate uptime and other stats
        from django.utils import timezone
        from datetime import timedelta
        
        # Get service availability over last 24 hours
        since_24h = timezone.now() - timedelta(hours=24)
        health_logs = HealthCheckLog.objects.filter(
            timestamp__gte=since_24h
        ).values('service').annotate(
            total_checks=models.Count('id'),
            healthy_checks=models.Count('id', filter=models.Q(status='healthy')),
            availability=models.F('healthy_checks') * 100.0 / models.F('total_checks')
        )
        
        return Response({
            'timestamp': timezone.now().isoformat(),
            'overall_status': health_results.get('overall_status', 'unknown'),
            'health_checks': health_results.get('checks', {}),
            'system_metrics': recent_metrics,
            'active_alerts': {
                'count': len(active_alerts),
                'critical': len([a for a in active_alerts if a['severity'] == 'critical']),
                'high': len([a for a in active_alerts if a['severity'] == 'high']),
                'alerts': active_alerts[:10]  # Show only first 10
            },
            'service_availability': list(health_logs)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to get system status: {str(e)}")
        return Response({
            'error': 'Failed to retrieve system status'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)