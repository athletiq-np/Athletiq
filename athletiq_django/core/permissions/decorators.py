"""
Permission decorators for function-based views.
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def require_roles(allowed_roles):
    """
    Decorator to require specific roles for function-based views.
    
    Usage:
        @require_roles(['SuperAdmin', 'SchoolAdmin'])
        def my_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check authentication
            if not (request.user and request.user.is_authenticated):
                return Response({
                    'success': False,
                    'message': 'Authentication required',
                    'status': status.HTTP_401_UNAUTHORIZED
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check role
            if request.user.role not in allowed_roles:
                return Response({
                    'success': False,
                    'message': 'Insufficient permissions',
                    'status': status.HTTP_403_FORBIDDEN
                }, status=status.HTTP_403_FORBIDDEN)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_super_admin(view_func):
    """
    Decorator to require SuperAdmin role.
    """
    return require_roles(['SuperAdmin'])(view_func)


def require_school_admin(view_func):
    """
    Decorator to require SchoolAdmin role.
    """
    return require_roles(['SchoolAdmin'])(view_func)


def require_school_admin_or_super_admin(view_func):
    """
    Decorator to require SchoolAdmin or SuperAdmin role.
    """
    return require_roles(['SchoolAdmin', 'SuperAdmin'])(view_func)


def require_school_ownership(view_func):
    """
    Decorator to require school ownership for SchoolAdmin users.
    SuperAdmin users bypass this check.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Check authentication
        if not (request.user and request.user.is_authenticated):
            return Response({
                'success': False,
                'message': 'Authentication required',
                'status': status.HTTP_401_UNAUTHORIZED
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # SuperAdmin can access everything
        if request.user.role == 'SuperAdmin':
            return view_func(request, *args, **kwargs)
        
        # SchoolAdmin must have associated school
        if request.user.role == 'SchoolAdmin':
            user_school = request.user.get_school()
            if not user_school:
                return Response({
                    'success': False,
                    'message': 'No school associated with this user',
                    'status': status.HTTP_403_FORBIDDEN
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Add school to request for use in view
            request.user_school = user_school
            return view_func(request, *args, **kwargs)
        
        # Other roles not allowed
        return Response({
            'success': False,
            'message': 'Insufficient permissions',
            'status': status.HTTP_403_FORBIDDEN
        }, status=status.HTTP_403_FORBIDDEN)
    
    return wrapper