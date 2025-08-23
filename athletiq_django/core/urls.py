"""
URL configuration for core bulk operations.
"""
from django.urls import path
from core.views.bulk_operations import (
    get_operation_status,
    list_user_operations,
    cancel_operation,
    get_operation_statistics,
    start_bulk_athlete_import,
    start_bulk_athlete_export,
    start_bulk_school_import,
    start_bulk_tournament_import,
    start_bulk_data_migration,
    start_bulk_status_update
)

app_name = 'bulk_operations'

urlpatterns = [
    # Operation management
    path('operations/', list_user_operations, name='list_operations'),
    path('operations/<str:operation_id>/', get_operation_status, name='get_operation_status'),
    path('operations/<str:operation_id>/cancel/', cancel_operation, name='cancel_operation'),
    path('statistics/', get_operation_statistics, name='get_statistics'),
    
    # Bulk operations
    path('athletes/import/', start_bulk_athlete_import, name='bulk_athlete_import'),
    path('athletes/export/', start_bulk_athlete_export, name='bulk_athlete_export'),
    path('schools/import/', start_bulk_school_import, name='bulk_school_import'),
    path('tournaments/import/', start_bulk_tournament_import, name='bulk_tournament_import'),
    path('data-migration/', start_bulk_data_migration, name='bulk_data_migration'),
    path('status-update/', start_bulk_status_update, name='bulk_status_update'),
]