from django.urls import path
from . import views

app_name = 'google_services'

urlpatterns = [
    # Translation endpoints
    path('translate/text/', views.translate_text, name='translate_text'),
    path('translate/batch/', views.translate_batch, name='translate_batch'),
    path('translate/detect/', views.detect_language, name='detect_language'),
    path('translate/languages/', views.supported_languages, name='supported_languages'),
    
    # Vision endpoints
    path('vision/ocr/', views.vision_ocr, name='vision_ocr'),
    path('vision/document-properties/', views.vision_document_properties, name='vision_document_properties'),
    
    # Maps endpoints
    path('maps/geocode/', views.geocode_address, name='geocode_address'),
    path('maps/reverse-geocode/', views.reverse_geocode, name='reverse_geocode'),
    path('maps/places/search/', views.search_places, name='search_places'),
    path('maps/places/<str:place_id>/', views.place_details, name='place_details'),
    
    # Service status
    path('status/', views.service_status, name='service_status'),
]