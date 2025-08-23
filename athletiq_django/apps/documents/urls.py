from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DocumentViewSet, FileUploadView, PDFTemplateViewSet, GeneratedPDFViewSet
)
from .views.pdf_views import (
    PDFGenerationViewSet, PDFTemplateManagementViewSet, GeneratedPDFManagementViewSet
)
from .views.ocr_views import (
    OCRViewSet, OCRResultViewSet, DocumentProcessingViewSet
)

app_name = 'documents'

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'upload', FileUploadView, basename='upload')
router.register(r'pdf-templates', PDFTemplateViewSet, basename='pdf-template')
router.register(r'generated-pdfs', GeneratedPDFViewSet, basename='generated-pdf')

# PDF generation and management
router.register(r'pdf/generate', PDFGenerationViewSet, basename='pdf-generate')
router.register(r'pdf/templates', PDFTemplateManagementViewSet, basename='pdf-template-mgmt')
router.register(r'pdf/generated', GeneratedPDFManagementViewSet, basename='pdf-generated-mgmt')

# OCR and document processing
router.register(r'ocr', OCRViewSet, basename='ocr')
router.register(r'ocr-results', OCRResultViewSet, basename='ocr-results')
router.register(r'processing', DocumentProcessingViewSet, basename='document-processing')

urlpatterns = [
    path('api/', include(router.urls)),
    
    # Additional file serving endpoints
    path('api/files/<int:document_id>/download/', 
         DocumentViewSet.as_view({'get': 'download'}), 
         name='file-download'),
    
    path('api/files/<int:document_id>/processed-images/', 
         DocumentViewSet.as_view({'get': 'processed_images'}), 
         name='processed-images'),
    
    path('api/upload/single/', 
         FileUploadView.as_view({'post': 'upload'}), 
         name='single-upload'),
    
    path('api/upload/bulk/', 
         FileUploadView.as_view({'post': 'bulk_upload'}), 
         name='bulk-upload'),
]