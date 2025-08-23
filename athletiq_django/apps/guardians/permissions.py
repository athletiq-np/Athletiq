"""
Guardian-specific permissions.
"""
from rest_framework import permissions
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import Guardian


class IsGuardianAuthenticated(permissions.BasePermission):
    """
    Permission class for guardian authentication.
    """
    
    def has_permission(self, request, view):
        """
        Check if request has valid guardian JWT token.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return False
        
        try:
            token = auth_header.split(' ')[1]
            
            # Decode JWT token using rest_framework_simplejwt
            access_token = AccessToken(token)
            
            # Check if it's a guardian token
            guardian_id = access_token.get('guardian_id')
            if not guardian_id:
                return False
            
            # Get guardian
            guardian = Guardian.objects.get(guardian_id=guardian_id)
            if not guardian.is_active:
                return False
            
            # Add guardian to request
            request.guardian = guardian
            return True
            
        except (InvalidToken, TokenError, Guardian.DoesNotExist):
            return False
        except Exception:
            return False


class IsGuardianOwner(permissions.BasePermission):
    """
    Permission class to check if guardian owns the resource.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Check if guardian owns the object.
        """
        if not hasattr(request, 'guardian'):
            return False
        
        # Check if object has guardian relationship
        if hasattr(obj, 'guardian'):
            return obj.guardian == request.guardian
        
        return False


class IsVerifiedGuardian(permissions.BasePermission):
    """
    Permission class for verified guardians only.
    """
    
    def has_permission(self, request, view):
        """
        Check if guardian is verified.
        """
        if not hasattr(request, 'guardian'):
            return False
        
        return request.guardian.is_verified