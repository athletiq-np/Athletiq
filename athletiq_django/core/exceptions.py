"""
Custom exception handlers and error responses.
Enhanced to match Node.js API format and provide comprehensive error tracking.
"""
import json
import time
import traceback
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
import logging

logger = logging.getLogger(__name__)
error_logger = logging.getLogger('django.request')
security_logger = logging.getLogger('security')


def custom_exception_handler(exc, context):
    """
    Enhanced exception handler that returns responses in the same format
    as the existing Node.js API for frontend compatibility.
    Includes comprehensive error tracking and monitoring.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Get request context
    request = context.get('request')
    view = context.get('view')
    request_id = getattr(request, 'request_id', 'unknown') if request else 'unknown'
    user_id = getattr(request.user, 'user_id', None) if request and hasattr(request, 'user') and request.user.is_authenticated else None
    
    # Handle unhandled exceptions
    if response is None:
        response = handle_unhandled_exception(exc, request, request_id, user_id)
    else:
        # Handle DRF exceptions
        response = format_drf_exception_response(exc, response, request, request_id, user_id)
    
    # Log the exception with structured format
    log_exception(exc, request, response, request_id, user_id, view)
    
    # Track error metrics
    track_error_metrics(exc, request, response)
    
    return response


def handle_unhandled_exception(exc, request, request_id, user_id):
    """Handle exceptions not caught by DRF."""
    status_code = 500
    error_type = exc.__class__.__name__
    
    # Determine appropriate status code
    if isinstance(exc, DjangoValidationError):
        status_code = 400
    elif isinstance(exc, PermissionError):
        status_code = 403
    elif isinstance(exc, FileNotFoundError):
        status_code = 404
    
    # Create response data
    response_data = {
        'success': False,
        'message': get_safe_error_message(exc, status_code),
        'status': status_code,
        'error_type': error_type
    }
    
    # Add request ID
    if request_id != 'unknown':
        response_data['request_id'] = request_id
    
    # Add debug info in development
    if getattr(settings, 'DEBUG', False):
        response_data['debug'] = {
            'exception': str(exc),
            'traceback': traceback.format_exc().split('\n')
        }
    
    return Response(response_data, status=status_code)


def format_drf_exception_response(exc, response, request, request_id, user_id):
    """Format DRF exception response to match Node.js API format."""
    error_type = exc.__class__.__name__
    
    # Create custom response data
    custom_response_data = {
        'success': False,
        'message': get_error_message(exc, response),
        'status': response.status_code,
        'error_type': error_type
    }
    
    # Add detailed errors if available
    if hasattr(response, 'data') and response.data:
        if isinstance(response.data, dict):
            # Handle field-specific errors
            if 'detail' in response.data:
                custom_response_data['message'] = str(response.data['detail'])
            elif 'non_field_errors' in response.data:
                custom_response_data['message'] = str(response.data['non_field_errors'][0])
            else:
                # Format field errors
                errors = {}
                for field, field_errors in response.data.items():
                    if isinstance(field_errors, list):
                        errors[field] = field_errors
                    else:
                        errors[field] = [str(field_errors)]
                
                if errors:
                    custom_response_data['errors'] = errors
                    # Set message to first error
                    first_field = next(iter(errors))
                    custom_response_data['message'] = f"{first_field}: {errors[first_field][0]}"
        elif isinstance(response.data, list):
            custom_response_data['message'] = str(response.data[0]) if response.data else custom_response_data['message']
    
    # Add request ID
    if request_id != 'unknown':
        custom_response_data['request_id'] = request_id
    
    # Add debug info in development
    if getattr(settings, 'DEBUG', False):
        custom_response_data['debug'] = {
            'exception': str(exc),
            'view': str(request.resolver_match.view_name) if (request and 
                    hasattr(request, 'resolver_match') and 
                    request.resolver_match and 
                    hasattr(request.resolver_match, 'view_name')) else None
        }
    
    response.data = custom_response_data
    return response


def log_exception(exc, request, response, request_id, user_id, view):
    """Log exception with structured format compatible with Winston."""
    log_data = {
        'level': 'error',
        'message': f"Exception: {exc.__class__.__name__}",
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
        'error': {
            'name': exc.__class__.__name__,
            'message': str(exc),
            'stack': traceback.format_exc().split('\n') if getattr(settings, 'DEBUG', False) else None,
        },
        'request': {
            'method': request.method if request else None,
            'path': request.path if request else None,
            'ip': get_client_ip(request) if request else None,
            'userAgent': request.META.get('HTTP_USER_AGENT', '') if request else None,
            'requestId': request_id,
            'userId': user_id,
        },
        'response': {
            'statusCode': response.status_code if response else 500,
        },
        'context': {
            'view': str(view.__class__.__name__) if view else None,
            'viewMethod': getattr(view, 'action', None) if view else None,
        },
        'meta': {
            'service': 'athletiq-django',
            'environment': getattr(settings, 'ENVIRONMENT', 'development'),
        }
    }
    
    # Log with appropriate level
    if response and response.status_code >= 500:
        log_level = logging.ERROR
    elif response and response.status_code >= 400:
        log_level = logging.WARNING
    else:
        log_level = logging.ERROR
    
    if getattr(settings, 'STRUCTURED_LOGGING', True):
        error_logger.log(log_level, json.dumps(log_data))
    else:
        error_logger.log(
            log_level,
            f"Exception: {exc.__class__.__name__} - {str(exc)} - "
            f"Path: {request.path if request else 'unknown'} - "
            f"Status: {response.status_code if response else 500} - "
            f"Request ID: {request_id}"
        )


def track_error_metrics(exc, request, response):
    """Track error metrics for monitoring."""
    try:
        from django.core.cache import cache
        
        # Track error counts by type
        error_type = exc.__class__.__name__
        cache_key = f"error_count:{error_type}"
        current_count = cache.get(cache_key, 0)
        cache.set(cache_key, current_count + 1, 3600)  # 1 hour TTL
        
        # Track 5xx errors separately
        if response and response.status_code >= 500:
            server_error_key = "error_count:server_errors"
            server_error_count = cache.get(server_error_key, 0)
            cache.set(server_error_key, server_error_count + 1, 3600)
        
        # Track errors by endpoint
        if request:
            endpoint_key = f"error_count:endpoint:{request.path}"
            endpoint_count = cache.get(endpoint_key, 0)
            cache.set(endpoint_key, endpoint_count + 1, 3600)
    
    except Exception as e:
        # Don't let metrics tracking break error handling
        logger.warning(f"Error tracking metrics: {e}")


def get_client_ip(request):
    """Get client IP address from request."""
    if not request:
        return None
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


def get_safe_error_message(exc, status_code):
    """Get safe error message for production."""
    if getattr(settings, 'DEBUG', False):
        return str(exc)
    
    # Generic messages for production
    if status_code >= 500:
        return "Internal server error"
    elif status_code == 404:
        return "Not found"
    elif status_code == 403:
        return "Permission denied"
    elif status_code == 401:
        return "Authentication required"
    elif status_code == 400:
        return "Bad request"
    else:
        return "An error occurred"


def get_error_message(exc, response):
    """Get appropriate error message from exception."""
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, dict):
            # Get first error message from dict
            for key, value in exc.detail.items():
                if isinstance(value, list):
                    return f"{key}: {value[0]}" if value else str(exc)
                return f"{key}: {value}"
        elif isinstance(exc.detail, list):
            return str(exc.detail[0]) if exc.detail else str(exc)
        else:
            return str(exc.detail)
    return str(exc)


def bad_request_handler(request, exception):
    """Handle 400 Bad Request errors."""
    return JsonResponse({
        'success': False,
        'message': 'Bad Request',
        'status': 400
    }, status=400)


def permission_denied_handler(request, exception):
    """Handle 403 Permission Denied errors."""
    return JsonResponse({
        'success': False,
        'message': 'Permission Denied',
        'status': 403
    }, status=403)


def not_found_handler(request, exception):
    """Handle 404 Not Found errors."""
    return JsonResponse({
        'success': False,
        'message': 'Not Found',
        'status': 404
    }, status=404)


def server_error_handler(request):
    """Handle 500 Internal Server Error."""
    return JsonResponse({
        'success': False,
        'message': 'Internal Server Error',
        'status': 500
    }, status=500)