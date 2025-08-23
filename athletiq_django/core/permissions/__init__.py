"""
Permission classes for role-based access control.
"""
from .base import (
    IsAuthenticated,
    IsSuperAdmin,
    IsSchoolAdmin,
    IsSchoolAdminOrSuperAdmin,
    IsCoach,
    IsReferee,
    IsOwnerOrReadOnly,
    IsSchoolOwnerOrSuperAdmin,
    IsSchoolOwner,
    IsSuperAdminOrReadOnly,
    RoleBasedPermission,
)

__all__ = [
    'IsAuthenticated',
    'IsSuperAdmin',
    'IsSchoolAdmin',
    'IsSchoolAdminOrSuperAdmin',
    'IsCoach',
    'IsReferee',
    'IsOwnerOrReadOnly',
    'IsSchoolOwnerOrSuperAdmin',
    'IsSchoolOwner',
    'IsSuperAdminOrReadOnly',
    'RoleBasedPermission',
]