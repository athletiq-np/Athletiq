from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from ..models import Document, OCRResult
from ..serializers import OCRResultSerializer, OCRRequestSerializer
from ..services.ocr_service import OCRService, DocumentProcessingService
from ..permissions import DocumentPermission
from core.permissions.base import IsAuthenticated


class OCRViewSet(viewsets.GenericViewSet):
    """ViewSet for OCR operations"""
    
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.ocr_service = OCRService()
    
    @action(detail=False, methods=['post'])
    def extract_text(self, request):
        """Extract text from a document using OCR"""
        serializer = OCRRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document_id = serializer.validated_data['document_id']
            language = serializer.validated_data.get('language', 'en')
            
            document = get_object_or_404(Document, document_id=document_id)
            
            # Check permissions
            if not self._can_process_document(request.user, document):
                return Response({
                    'success': False,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if document is an image
            if not document.mime_type.startswith('image/'):
                return Response({
                    'success': False,
                    'message': 'Document must be an image for OCR processing'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Extract text
            ocr_result = self.ocr_service.extract_text_from_document(document, language)
            
            result_serializer = OCRResultSerializer(ocr_result, context={'request': request})
            
            return Response({
                'success': True,
                'message': 'Text extracted successfully',
                'data': result_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'OCR processing failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def batch_extract(self, request):
        """Extract text from multiple documents"""
        document_ids = request.data.get('document_ids', [])
        language = request.data.get('language', 'en')
        
        if not document_ids:
            return Response({
                'success': False,
                'message': 'document_ids are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get documents
            documents = Document.objects.filter(document_id__in=document_ids)
            
            # Filter documents user can access
            accessible_documents = []
            for document in documents:
                if self._can_process_document(request.user, document):
                    accessible_documents.append(document)
            
            if not accessible_documents:
                return Response({
                    'success': False,
                    'message': 'No accessible documents found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Process documents
            results = self.ocr_service.batch_process_documents(accessible_documents, language)
            
            return Response({
                'success': True,
                'message': f'Processed {results["total_processed"]} documents',
                'data': results
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Batch OCR processing failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def search_text(self, request):
        """Search documents by OCR extracted text"""
        query = request.query_params.get('q')
        
        if not query:
            return Response({
                'success': False,
                'message': 'Query parameter "q" is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            ocr_results = self.ocr_service.search_documents_by_text(query, request.user)
            serializer = OCRResultSerializer(ocr_results, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'data': serializer.data,
                'count': len(serializer.data)
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Search failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def document_result(self, request):
        """Get OCR result for a specific document"""
        document_id = request.query_params.get('document_id')
        
        if not document_id:
            return Response({
                'success': False,
                'message': 'document_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = get_object_or_404(Document, document_id=document_id)
            
            # Check permissions
            if not self._can_process_document(request.user, document):
                return Response({
                    'success': False,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            ocr_result = self.ocr_service.get_ocr_result(document)
            
            if not ocr_result:
                return Response({
                    'success': False,
                    'message': 'No OCR result found for this document'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = OCRResultSerializer(ocr_result, context={'request': request})
            
            return Response({
                'success': True,
                'data': serializer.data
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error retrieving OCR result: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def reprocess(self, request):
        """Reprocess a document for OCR"""
        document_id = request.data.get('document_id')
        language = request.data.get('language', 'en')
        
        if not document_id:
            return Response({
                'success': False,
                'message': 'document_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = get_object_or_404(Document, document_id=document_id)
            
            # Check permissions
            if not self._can_process_document(request.user, document):
                return Response({
                    'success': False,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Reprocess document
            ocr_result = self.ocr_service.reprocess_document(document, language)
            
            serializer = OCRResultSerializer(ocr_result, context={'request': request})
            
            return Response({
                'success': True,
                'message': 'Document reprocessed successfully',
                'data': serializer.data
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Reprocessing failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def text_statistics(self, request):
        """Get text statistics for a document"""
        document_id = request.query_params.get('document_id')
        
        if not document_id:
            return Response({
                'success': False,
                'message': 'document_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = get_object_or_404(Document, document_id=document_id)
            
            # Check permissions
            if not self._can_process_document(request.user, document):
                return Response({
                    'success': False,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            statistics = self.ocr_service.get_text_statistics(document)
            
            if not statistics:
                return Response({
                    'success': False,
                    'message': 'No OCR result found for this document'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'success': True,
                'data': statistics
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error retrieving statistics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _can_process_document(self, user, document):
        """Check if user can process the document"""
        # SuperAdmin can process any document
        if user.role == 'SuperAdmin':
            return True
        
        # Owner can process their documents
        if document.uploaded_by == user:
            return True
        
        # SchoolAdmin can process their school's documents
        if user.role == 'SchoolAdmin' and hasattr(user, 'school'):
            return document.school == user.school
        
        return False


class OCRResultViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing OCR results"""
    
    queryset = OCRResult.objects.all()
    serializer_class = OCRResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['language_detected', 'document__document_type']
    search_fields = ['extracted_text']
    ordering_fields = ['created_at', 'confidence_score', 'processing_time']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter OCR results based on user permissions"""
        user = self.request.user
        queryset = OCRResult.objects.select_related('document')
        
        # SuperAdmin can see all results
        if user.role == 'SuperAdmin':
            return queryset
        
        # Users can only see results for documents they can access
        return queryset.filter(document__uploaded_by=user)


class DocumentProcessingViewSet(viewsets.GenericViewSet):
    """ViewSet for general document processing operations"""
    
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.processing_service = DocumentProcessingService()
    
    @action(detail=False, methods=['post'])
    def process_document(self, request):
        """Process a document (OCR, validation, etc.)"""
        document_id = request.data.get('document_id')
        
        if not document_id:
            return Response({
                'success': False,
                'message': 'document_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = get_object_or_404(Document, document_id=document_id)
            
            # Check permissions
            if not self._can_process_document(request.user, document):
                return Response({
                    'success': False,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Process document
            results = self.processing_service.process_uploaded_document(document)
            
            return Response({
                'success': True,
                'message': 'Document processed successfully',
                'data': results
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Document processing failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def processing_status(self, request):
        """Get processing status for a document"""
        document_id = request.query_params.get('document_id')
        
        if not document_id:
            return Response({
                'success': False,
                'message': 'document_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = get_object_or_404(Document, document_id=document_id)
            
            # Check permissions
            if not self._can_process_document(request.user, document):
                return Response({
                    'success': False,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            status_info = self.processing_service.get_processing_status(document)
            
            return Response({
                'success': True,
                'data': status_info
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error retrieving status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def validate_document(self, request):
        """Validate document content and structure"""
        document_id = request.data.get('document_id')
        
        if not document_id:
            return Response({
                'success': False,
                'message': 'document_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = get_object_or_404(Document, document_id=document_id)
            
            # Check permissions
            if not self._can_process_document(request.user, document):
                return Response({
                    'success': False,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            validation_results = self.processing_service.validate_document_content(document)
            
            return Response({
                'success': True,
                'data': validation_results
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Validation failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _can_process_document(self, user, document):
        """Check if user can process the document"""
        # SuperAdmin can process any document
        if user.role == 'SuperAdmin':
            return True
        
        # Owner can process their documents
        if document.uploaded_by == user:
            return True
        
        # SchoolAdmin can process their school's documents
        if user.role == 'SchoolAdmin' and hasattr(user, 'school'):
            return document.school == user.school
        
        return False