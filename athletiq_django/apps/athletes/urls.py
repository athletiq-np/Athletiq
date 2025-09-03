"""
URL patterns for athlete management endpoints.
"""
from django.urls import path
from . import views

app_name = 'athletes'

urlpatterns = [
    # Basic CRUD operations
    path('', views.AthleteListCreateView.as_view(), name='athlete-list-create'),
    path('<int:pk>/', views.AthleteDetailView.as_view(), name='athlete-detail'),
    
    # Bulk operations
    path('bulk-create/', views.bulk_create_athletes, name='athlete-bulk-create'),
    path('bulk-update/', views.bulk_update_athletes, name='athlete-bulk-update'),
    path('bulk-verify/', views.bulk_verify_athletes, name='athlete-bulk-verify'),
    path('bulk-delete/', views.bulk_delete_athletes, name='athlete-bulk-delete'),
    path('export/', views.export_athletes, name='athlete-export'),
    
    # Search and filtering
    path('search/', views.search_athletes, name='athlete-search'),
    path('school/<int:school_id>/', views.get_athletes_by_school, name='athletes-by-school'),
    
    # Document management
    path('<int:athlete_id>/documents/', views.get_athlete_documents, name='athlete-documents'),
    path('<int:athlete_id>/documents/upload/', views.upload_athlete_document, name='athlete-document-upload'),
    path('<int:athlete_id>/documents/verify/', views.verify_athlete_document, name='athlete-document-verify'),
    
    # Analytics and statistics
    path('statistics/', views.athlete_statistics, name='athlete-statistics'),
    
    # SuperAdmin endpoints
    path('admin/list/', views.admin_athletes_list_view, name='admin-list'),
    
    # Utility endpoints
    path('<int:athlete_id>/recalculate-completion/', views.recalculate_profile_completion, name='athlete-recalculate-completion'),
]