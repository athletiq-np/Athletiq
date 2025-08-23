"""
Permission mixins for class-based views.
"""
from rest_framework.response import Response
from rest_framework import status
from .base import (
    IsSuperAdmin, 
    IsSchoolAdmin, 
    IsSchoolAdminOrSuperAdmin,
    IsSchoolOwnerOrSuperAdmin
)


class RoleRequiredMixin:
    """
    Mixin to add role-based permissions to class-based views.
    """
    allowed_roles = []
    
    def check_permissions(self, request):
        """
        Check if user has required permissions.
        """
        super().check_permissions(request)
        
        if self.allowed_roles and request.user.role not in self.allowed_roles:
            self.permission_denied(
                request,
                message='Insufficient permissions for this role'
            )


class SuperAdminRequiredMixin(RoleRequiredMixin):
    """
    Mixin that requires SuperAdmin role.
    """
    allowed_roles = ['SuperAdmin']


class SchoolAdminRequiredMixin(RoleRequiredMixin):
    """
    Mixin that requires SchoolAdmin role.
    """
    allowed_roles = ['SchoolAdmin']


class SchoolAdminOrSuperAdminMixin(RoleRequiredMixin):
    """
    Mixin that requires SchoolAdmin or SuperAdmin role.
    """
    allowed_roles = ['SchoolAdmin', 'SuperAdmin']


class SchoolOwnershipMixin:
    """
    Mixin to ensure SchoolAdmin users can only access their own school's resources.
    """
    
    def get_queryset(self):
        """
        Filter queryset based on user's school ownership.
        """
        queryset = super().get_queryset()
        
        # SuperAdmin can see everything
        if self.request.user.role == 'SuperAdmin':
            return queryset
        
        # SchoolAdmin can only see their school's resources
        if self.request.user.role == 'SchoolAdmin':
            user_school = self.request.user.get_school()
            if user_school:
                # Filter by school relationship
                if hasattr(queryset.model, 'school'):
                    return queryset.filter(school=user_school)
                elif hasattr(queryset.model, 'school_id'):
                    return queryset.filter(school_id=user_school.school_id)
        
        # Return empty queryset for other roles
        return queryset.none()
    
    def perform_create(self, serializer):
        """
        Set school ownership when creating objects.
        """
        # For SchoolAdmin users, automatically set school
        if (self.request.user.role == 'SchoolAdmin' and 
            hasattr(serializer.Meta.model, 'school')):
            user_school = self.request.user.get_school()
            if user_school:
                serializer.save(school=user_school)
            else:
                serializer.save()
        else:
            serializer.save()


class GuardianPermissionMixin:
    """
    Mixin for guardian-specific permissions.
    """
    
    def check_guardian_permissions(self, request):
        """
        Check if user is a guardian and has access to the resource.
        """
        # This will be implemented when we create the Guardian model
        pass