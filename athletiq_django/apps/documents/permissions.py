from rest_framework import permissions
from django.db import models


class DocumentPermission(permissions.BasePermission):
    """Custom permission for document access"""
    
    def has_permission(self, request, view):
        """Check if user has permission to access documents"""
        # All authenticated users can access documents
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access specific document"""
        user = request.user
        
        # SuperAdmin has full access
        if user.role == 'SuperAdmin':
            return True
        
        # Public documents can be viewed by anyone
        if obj.is_public and view.action in ['retrieve', 'download']:
            return True
        
        # Owner has full access to their documents
        if obj.uploaded_by == user:
            return True
        
        # SchoolAdmin can access their school's documents
        if user.role == 'SchoolAdmin' and hasattr(user, 'school'):
            if obj.school == user.school:
                return True
        
        # Guardian can access documents related to their athletes
        if hasattr(user, 'guardian'):
            if obj.guardian == user.guardian:
                return True
            # Check if document is related to guardian's athletes
            if obj.athlete and obj.athlete.guardian == user.guardian:
                return True
        
        # Deny access for other cases
        return False


class PDFTemplatePermission(permissions.BasePermission):
    """Custom permission for PDF template access"""
    
    def has_permission(self, request, view):
        """Check if user has permission to access PDF templates"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access specific template"""
        user = request.user
        
        # SuperAdmin has full access
        if user.role == 'SuperAdmin':
            return True
        
        # For read operations, check if template is active
        if view.action in ['retrieve', 'list']:
            return obj.is_active
        
        # For write operations, only SuperAdmin and template creator
        if view.action in ['update', 'partial_update', 'destroy']:
            return user.role == 'SuperAdmin' or obj.created_by == user
        
        # For create operations, authenticated users can create
        if view.action == 'create':
            return True
        
        return False


class GeneratedPDFPermission(permissions.BasePermission):
    """Custom permission for generated PDF access"""
    
    def has_permission(self, request, view):
        """Check if user has permission to access generated PDFs"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access specific PDF"""
        user = request.user
        
        # SuperAdmin has full access
        if user.role == 'SuperAdmin':
            return True
        
        # Owner can access their generated PDFs
        if obj.generated_by == user:
            return True
        
        # SchoolAdmin can access PDFs related to their school
        if user.role == 'SchoolAdmin' and hasattr(user, 'school'):
            # Check if PDF is related to school's athlete or tournament
            if obj.athlete and obj.athlete.school == user.school:
                return True
            if obj.tournament and obj.tournament.organizer.school == user.school:
                return True
        
        # Guardian can access PDFs related to their athletes
        if hasattr(user, 'guardian'):
            if obj.athlete and obj.athlete.guardian == user.guardian:
                return True
        
        return False


class FileUploadPermission(permissions.BasePermission):
    """Permission for file upload operations"""
    
    def has_permission(self, request, view):
        """Check if user can upload files"""
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
        
        # All authenticated users can upload files
        return True
    
    def has_object_permission(self, request, view, obj):
        """Object-level permission for file operations"""
        # This would be used for specific file operations
        return True