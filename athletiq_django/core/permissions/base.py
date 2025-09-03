"""
Base permission classes for role-based access control.
"""
from rest_framework import permissions


class IsAuthenticated(permissions.BasePermission):
    """
    Custom authentication permission that works with our JWT system.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated.
        """
        return bool(request.user and request.user.is_authenticated)


class IsSuperAdmin(permissions.BasePermission):
    """
    Permission class for SuperAdmin role.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and has SuperAdmin role.
        Role comparison is case-insensitive.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and
            str(request.user.role).lower() == 'superadmin'
        )


class IsSchoolAdmin(permissions.BasePermission):
    """
    Permission class for SchoolAdmin role.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and has SchoolAdmin role.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'SchoolAdmin'
        )


class IsSchoolAdminOrSuperAdmin(permissions.BasePermission):
    """
    Permission class for SchoolAdmin or SuperAdmin roles.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and has SchoolAdmin or SuperAdmin role.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['SchoolAdmin', 'SuperAdmin']
        )


class IsCoach(permissions.BasePermission):
    """
    Permission class for Coach role.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and has Coach role.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'Coach'
        )


class IsReferee(permissions.BasePermission):
    """
    Permission class for Referee role.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and has Referee role.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'Referee'
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows owners to edit their own objects.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user owns the object or has read-only access.
        """
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for the owner
        # Check different possible owner field names
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        return False


class IsSchoolOwnerOrSuperAdmin(permissions.BasePermission):
    """
    Permission class for school-specific resources.
    """
    
    def has_permission(self, request, view):
        """
        Check basic authentication and role.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['SchoolAdmin', 'SuperAdmin']
        )
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user owns the school or is SuperAdmin.
        """
        # SuperAdmin can access everything
        if request.user.role == 'SuperAdmin':
            return True
        
        # SchoolAdmin can only access their own school's resources
        if request.user.role == 'SchoolAdmin':
            # Check if object has school relationship
            if hasattr(obj, 'school'):
                user_school = request.user.get_school()
                return user_school and obj.school == user_school
            elif hasattr(obj, 'school_id'):
                user_school = request.user.get_school()
                return user_school and obj.school_id == user_school.school_id
            # If object is a school itself
            elif obj.__class__.__name__ == 'School':
                user_school = request.user.get_school()
                return user_school and obj == user_school
        
        return False


class IsSchoolOwner(permissions.BasePermission):
    """
    Permission class for school owners (alias for IsSchoolOwnerOrSuperAdmin).
    """
    
    def has_permission(self, request, view):
        """
        Check basic authentication and role.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['SchoolAdmin', 'SuperAdmin']
        )
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user owns the school or is SuperAdmin.
        """
        # SuperAdmin can access everything
        if request.user.role == 'SuperAdmin':
            return True
        
        # SchoolAdmin can only access their own school's resources
        if request.user.role == 'SchoolAdmin':
            # Check if object has school relationship
            if hasattr(obj, 'school'):
                user_school = request.user.get_school()
                return user_school and obj.school == user_school
            elif hasattr(obj, 'school_id'):
                user_school = request.user.get_school()
                return user_school and obj.school_id == user_school.school_id
            # If object is a school itself
            elif obj.__class__.__name__ == 'School':
                user_school = request.user.get_school()
                return user_school and obj == user_school
        
        return False


class IsSuperAdminOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows SuperAdmin full access and others read-only.
    """
    
    def has_permission(self, request, view):
        """
        Check if user has permission for the action.
        """
        # Read permissions for any user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for SuperAdmin
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'SuperAdmin'
        )


class IsOrganizationAdmin(permissions.BasePermission):
    """
    Permission class for Organization Admin role.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and has Organization Admin role.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and
            str(request.user.role).lower() == 'organization'
        )


class IsOrganizationOwnerOrSuperAdmin(permissions.BasePermission):
    """
    Permission class for organization-specific resources.
    """
    
    def has_permission(self, request, view):
        """
        Check basic authentication and role.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and
            str(request.user.role).lower() in ['organization', 'superadmin']
        )
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user owns the organization or is SuperAdmin.
        """
        # SuperAdmin can access everything
        if str(request.user.role).lower() == 'superadmin':
            return True
        
        # Organization admin can only access their own organization's resources
        if str(request.user.role).lower() == 'organization':
            # Check if object has organization relationship
            if hasattr(obj, 'organization'):
                user_organization = getattr(request.user, 'organization', None)
                return user_organization and obj.organization == user_organization
            elif hasattr(obj, 'organization_id'):
                user_organization = getattr(request.user, 'organization', None)
                return user_organization and obj.organization_id == user_organization.id
            # If object is an organization itself
            elif obj.__class__.__name__ == 'Organization':
                user_organization = getattr(request.user, 'organization', None)
                return user_organization and obj == user_organization
        
        return False


class RoleBasedPermission(permissions.BasePermission):
    """
    Generic role-based permission class.
    Usage: Add allowed_roles attribute to view.
    """
    
    def has_permission(self, request, view):
        """
        Check if user has required role.
        """
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Get allowed roles from view
        allowed_roles = getattr(view, 'allowed_roles', [])
        if not allowed_roles:
            return True  # No role restriction
        
        return request.user.role in allowed_roles