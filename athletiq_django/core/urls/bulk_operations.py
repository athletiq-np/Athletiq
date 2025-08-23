"""
URL patterns for bulk operations API.
"""
from django.urls import path
from core.views.bulk_operations import (
    get_operation_status,
    list_user_operations,
    cancel_operation,
    get_operation_statistics,
    start_bulk_athlete_import,
    start_bulk_athlete_export,
    start_bulk_status_update
)

app_name = 'bulk_operations'

urlpatterns = [
    # Operation management
    path('operations/', list_user_operations, name='list-operations'),
    path('operations/<str:operation_id>/', get_operation_status, name='operation-status'),
    path('operations/<str:operation_id>/cancel/', cancel_operation, name='cancel-operation'),
    path('statistics/', get_operation_statistics, name='operation-statistics'),
    
    # Bulk operations
    path('athletes/import/', start_bulk_athlete_import, name='bulk-athlete-import'),
    path('athletes/export/', start_bulk_athlete_export, name='bulk-athlete-export'),
    path('status-update/', start_bulk_status_update, name='bulk-status-update'),
]