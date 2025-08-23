"""
Debug views for troubleshooting authentication and permissions.
"""
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.permissions.base import IsSuperAdmin
from django.contrib.auth import get_user_model

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_permissions(request):
    """
    Debug endpoint to check user permissions and role.
    """
    user = request.user
    
    # Check if user is authenticated
    is_authenticated = user.is_authenticated
    
    # Check SuperAdmin permission
    is_superadmin = IsSuperAdmin().has_permission(request, None)
    
    # User details
    user_details = {
        'id': user.user_id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'is_active': user.is_active,
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
        'permissions': {
            'is_authenticated': is_authenticated,
            'is_superadmin': is_superadmin,
        }
    }
    
    return Response({
        'success': True,
        'user': user_details,
        'message': 'Permission check completed'
    })

@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def superadmin_check(request):
    """
    Test endpoint that requires SuperAdmin permission.
    """
    return Response({
        'success': True,
        'message': 'You have SuperAdmin access!',
        'user': {
            'id': request.user.user_id,
            'email': request.user.email,
            'role': request.user.role
        }
    })
